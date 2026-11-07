/**
 * Generates the deterministic bidding-demo fixture from the REAL simulation engine.
 * Run: npm run demo:fixture   (requires `npm run build -w @ai-civ/simulation` first)
 *
 * Three layers:
 *  1. Decision Layer  — simulation engine (MockAgentDecisionProvider, personality-aware).
 *  2. Explanation Layer — this script turns public event payloads into structured explanations.
 *  3. Presentation Layer — the web app turns factors into short public lines (no economics).
 */
import {
  agentExpectedQuality,
  createDualCivilizationGame,
  createFreeMarketRules,
  effectiveAbility,
  getSkillById,
  observedCompetitorsFor,
  personalGoalFor,
  postPlayerTask,
  riskComfortFloor,
  runSingleRound,
  successProbability,
} from '../packages/simulation/dist/index.js';
import fs from 'node:fs';
import path from 'node:path';

const SCENARIO = {
  title: '修复网站登录问题',
  titleEn: 'Fix the website login bug',
  domain: 'coding',
  reward: 100,
};

const ROLE_BY_DOMAIN = { coding: 'Coding', research: 'Research', design: 'Design' };

/** Authored characters for this demo (only focus trio is fully fleshed out). */
const PROFILES = {
  0: {
    personality: 'cautious',
    personalityLabel: '谨慎型',
    blurb: '先算风险，再谈赚钱；报价要留出安全边际。',
    risk: 0.25,
    invest: 0.45,
    cooperation: 0.4,
  },
  3: {
    personality: 'bold',
    personalityLabel: '积极型',
    blurb: '愿意用更低报价抢单，目标是把能力装备升级。',
    risk: 0.7,
    invest: 0.9,
    cooperation: 0.5,
  },
  6: {
    personality: 'steady',
    personalityLabel: '稳健型',
    blurb: '看长期能力成长，不盲目抢最低价。',
    risk: 0.5,
    invest: 0.6,
    cooperation: 0.75,
  },
  1: { personality: 'pragmatic', personalityLabel: '务实型', blurb: '有把握才出手，平时先攒钱。', risk: 0.42, invest: 0.45, cooperation: 0.55 },
  2: { personality: 'curious', personalityLabel: '好奇型', blurb: '愿意试新领域，但更看重划算不划算。', risk: 0.54, invest: 0.6, cooperation: 0.5 },
  4: { personality: 'quiet', personalityLabel: '低调型', blurb: '不抢风头，靠稳定交付积累口碑。', risk: 0.66, invest: 0.5, cooperation: 0.6 },
  5: { personality: 'balanced', personalityLabel: '平衡型', blurb: '风险与收益都要说得过去。', risk: 0.42, invest: 0.7, cooperation: 0.65 },
  7: { personality: 'observer', personalityLabel: '观察型', blurb: '先看市场，再决定动不动手。', risk: 0.54, invest: 0.55, cooperation: 0.5 },
};

const ROLE_INDEX = { coding: 0, research: 1, design: 2 };

function specialtyOf(agent) {
  return Object.entries(agent.abilities).sort((a, b) => b[1] - a[1])[0][0];
}

function successForAbility(ability, task) {
  return successProbability(ability, task.requirements.difficulty, task.requirements.minAbility);
}

function buildFixture(seed, tasksPerRound, warmupRounds, initialAbility) {
  const state = createDualCivilizationGame(
    { seed, totalRounds: 8, tasksPerRound, initialAgentAbility: initialAbility },
    createFreeMarketRules('自由市场')
  );
  const civ = state.civilizations[0];
  state.civilizations = [civ];

  // Author the cast (traits are real engine inputs, not display labels).
  civ.agents.forEach((agent, index) => {
    const profile = PROFILES[index];
    if (!profile) return;
    agent.traits.riskTolerance = profile.risk;
    agent.traits.investAggression = profile.invest;
    agent.traits.cooperationPreference = profile.cooperation;
  });

  for (let i = 0; i < warmupRounds; i += 1) runSingleRound(state);

  const before = structuredClone(civ.agents);
  const demoRound = state.round + 1;

  const task = postPlayerTask(state, {
    title: SCENARIO.title,
    domain: SCENARIO.domain,
    reward: SCENARIO.reward,
  });

  runSingleRound(state);

  const roundEvents = state.events.filter((e) => e.round === demoRound);
  const focusEvents = roundEvents.filter((e) => e.payload?.taskId === task.id);
  const bidEvents = focusEvents.filter((e) => e.kind === 'bid_placed');
  const declineEvents = focusEvents.filter((e) => e.kind === 'bid_declined');
  const assigned = focusEvents.find((e) => e.kind === 'task_assigned');
  const completed = focusEvents.find((e) => e.kind === 'task_completed');
  const failed = focusEvents.find((e) => e.kind === 'task_failed');
  const taxEvent = completed ? focusEvents.find((e) => e.kind === 'tax_collected') : null;
  const winnerId = assigned?.payload?.agentId ?? null;
  const winnerBefore = before.find((a) => a.id === winnerId);
  const winnerAfter = civ.agents.find((a) => a.id === winnerId);
  const purchased = winnerId ? roundEvents.filter((e) => e.kind === 'skill_purchased' && e.payload?.agentId === winnerId) : [];

  const agents = civ.agents.map((agent, index) => {
    const previous = before[index];
    const profile = PROFILES[index];
    const domain = specialtyOf(previous);
    const goal = personalGoalFor(previous, civ);
    const observed = observedCompetitorsFor(previous, civ, SCENARIO.domain);
    const bidEvent = bidEvents.find((e) => e.payload?.agentId === agent.id);
    const declineEvent = declineEvents.find((e) => e.payload?.agentId === agent.id);
    const isWinner = agent.id === winnerId;

    const decisionPayload = bidEvent?.payload ?? declineEvent?.payload ?? null;
    const action = bidEvent ? 'bid' : 'pass';
    const abilities = effectiveAbility(previous.abilities, previous.skills.map((s) => s.skillId), []);
    const probability =
      typeof decisionPayload?.successProbability === 'number'
        ? decisionPayload.successProbability
        : successForAbility(abilities[SCENARIO.domain], task);
    const quality = agentExpectedQuality(previous, civ, task);
    const reasonFactors = decisionPayload?.reasonFactors ?? [];
    const reaction = isWinner
      ? completed
        ? 'glad'
        : 'worried'
      : action === 'pass'
        ? profile.personality === 'cautious'
          ? 'wary'
          : 'neutral'
        : 'reflective';

    return {
      id: agent.id,
      displayName: agent.displayName,
      role: ROLE_BY_DOMAIN[domain],
      specialty: domain,
      personality: profile.personality,
      personalityLabel: profile.personalityLabel,
      personalityBlurb: profile.blurb,
      traits: {
        riskTolerance: previous.traits.riskTolerance,
        investAggression: previous.traits.investAggression,
        cooperationPreference: previous.traits.cooperationPreference ?? 0.5,
        domainAffinity: previous.traits.domainAffinity,
      },
      abilities: previous.abilities,
      walletBefore: previous.wallet,
      walletAfter: agent.wallet,
      skillsAfter: agent.skills.map((s) => ({ id: s.skillId, name: getSkillById(s.skillId)?.name ?? s.skillId })),
      publicRecord: {
        tasksCompleted: previous.stats.tasksCompleted,
        tasksFailed: previous.stats.tasksFailed,
        grossEarnings: previous.stats.grossEarnings,
        taxPaid: previous.stats.taxPaid,
      },
      goal: {
        id: goal.id,
        label: goal.label,
        skillId: goal.skillId ?? null,
        skillName: goal.skillId ? getSkillById(goal.skillId)?.name ?? null : null,
        price: goal.price ?? null,
      },
      decision: {
        action,
        reasonCode: bidEvent ? 'bid' : decisionPayload?.reasonCode ?? 'lower_priority',
        bidAmount: bidEvent?.payload?.bidAmount ?? null,
        expectedQuality: quality,
        successProbability: probability,
        riskComfortFloor:
          typeof decisionPayload?.riskComfortFloor === 'number' ? decisionPayload.riskComfortFloor : riskComfortFloor(previous),
        expectedReward: task.reward,
        expectedValue: decisionPayload?.expectedValue ?? Math.round(quality * task.reward * (1 + previous.traits.domainAffinity[SCENARIO.domain])),
        reasonFactors,
        observedCompetitors: decisionPayload?.observedCompetitors ?? observed,
        personalGoal: { id: goal.id, label: goal.label },
        result: isWinner ? (completed ? 'won' : 'failed') : action === 'pass' ? 'passed' : 'lost',
        reaction,
      },
      isFocus: index === 0 || index === 3 || index === 6,
    };
  });

  const bids = bidEvents.map((e) => {
    const agent = agents.find((a) => a.id === e.payload.agentId);
    return {
      agentId: e.payload.agentId,
      displayName: agent?.displayName ?? e.payload.agentId,
      bidAmount: e.payload.bidAmount,
      expectedQuality: agent?.decision.expectedQuality ?? 0,
      successProbability: e.payload.successProbability,
      reasonFactors: e.payload.reasonFactors,
      personalGoalLabel: e.payload.personalGoalLabel,
    };
  });

  const otherTasks = state.marketTasks
    .filter((t) => t.id !== task.id && t.roundCreated === demoRound)
    .map((t) => ({
      id: t.id,
      title: t.title,
      domain: t.requirements.domain,
      reward: t.reward,
      status: t.status,
      winnerName: t.assignedAgentId ? before.find((a) => a.id === t.assignedAgentId)?.displayName ?? null : null,
    }));

  const rawEvents = roundEvents.map((e) => ({
    id: e.id,
    round: e.round,
    kind: e.kind,
    message: e.message,
    payload: e.payload ?? null,
  }));

  // Next-round feedback: same task difficulty, winner's post-skill odds.
  const winnerCodingAfter = winnerAfter
    ? effectiveAbility(winnerAfter.abilities, winnerAfter.skills.map((s) => s.skillId), [])[SCENARIO.domain]
    : null;
  const winnerCodingBefore = winnerBefore
    ? effectiveAbility(winnerBefore.abilities, winnerBefore.skills.map((s) => s.skillId), [])[SCENARIO.domain]
    : null;

  return {
    version: 2,
    generatedBy: 'scripts/gen-bid-demo.mjs',
    seed,
    tasksPerRound,
    warmupRounds,
    demoRound,
    initialAbility,
    scenario: {
      taskId: task.id,
      title: SCENARIO.title,
      titleEn: SCENARIO.titleEn,
      domain: SCENARIO.domain,
      domainLabel: ROLE_BY_DOMAIN[SCENARIO.domain],
      reward: task.reward,
      difficulty: task.requirements.difficulty,
      minAbility: task.requirements.minAbility,
      source: task.source,
    },
    civilization: {
      id: civ.id,
      name: '晨曦文明',
      rules: civ.rules,
      treasuryStart: state.config.initialTreasury,
      treasuryAfter: civ.treasury,
    },
    focusAgentIds: [agents[0].id, agents[3].id, agents[6].id],
    agents,
    bids,
    declines: declineEvents.map((e) => ({ agentId: e.payload.agentId, reasonCode: e.payload.reasonCode })),
    winner: winnerId
      ? {
          agentId: winnerId,
          displayName: winnerBefore.displayName,
          bidAmount: task.winningBid,
          completed: !!completed,
          failed: !!failed,
          quality: completed?.payload?.quality ?? null,
        }
      : null,
    settlement: completed
      ? {
          gross: task.reward,
          tax: taxEvent?.payload?.tax ?? null,
          net: taxEvent?.payload?.net ?? null,
          walletBefore: winnerBefore.wallet,
          walletAfter: winnerAfter.wallet,
        }
      : null,
    skillPurchase: purchased.length
      ? purchased.map((e) => {
          const skill = getSkillById(e.payload.skillId);
          return {
            skillId: e.payload.skillId,
            name: skill?.name ?? e.payload.skillId,
            price: e.payload.price,
            abilityBefore: winnerCodingBefore,
            abilityAfter: winnerCodingAfter,
          };
        })
      : [],
    nextRound: {
      domain: SCENARIO.domain,
      abilityBefore: winnerCodingBefore,
      abilityAfter: winnerCodingAfter,
      successBefore: winnerCodingBefore === null ? null : successForAbility(winnerCodingBefore, task),
      successAfter: winnerCodingAfter === null ? null : successForAbility(winnerCodingAfter, task),
    },
    otherTasks,
    rawEvents,
  };
}

function summarize(fixture) {
  const focus = fixture.agents.filter((a) => a.isFocus);
  const lines = focus.map((a) => `${a.displayName}[${a.personalityLabel}] ${a.decision.action}${a.decision.bidAmount ? ':' + a.decision.bidAmount : ''} (${a.decision.reasonCode})`);
  return [
    `seed=${fixture.seed} tasksPerRound=${fixture.tasksPerRound} warmup=${fixture.warmupRounds} ability=${fixture.initialAbility} round=${fixture.demoRound}`,
    `  focus: ${lines.join(' | ')}`,
    `  bids=${fixture.bids.length} winner=${fixture.winner?.displayName} completed=${fixture.winner?.completed}`,
    `  settlement=${JSON.stringify(fixture.settlement)}`,
    `  skill=${fixture.skillPurchase.map((s) => `${s.name} ${s.price}G ${s.abilityBefore}->${s.abilityAfter}`).join('; ') || 'none'}`,
  ].join('\n');
}

const explore = process.argv.includes('--explore');
if (explore) {
  const results = [];
  for (let seed = 1; seed <= 120; seed += 1) {
    for (const tasksPerRound of [2, 3]) {
      for (const warmupRounds of [0]) {
        const f = buildFixture(seed, tasksPerRound, warmupRounds, 28);
        const astra = f.agents[0];
        const delta = f.agents[3];
        const grove = f.agents[6];
        const ok =
          astra.decision.action === 'pass' &&
          astra.decision.reasonCode === 'risk_above_comfort' &&
          delta.decision.action === 'bid' &&
          grove.decision.action === 'bid' &&
          delta.decision.bidAmount < grove.decision.bidAmount &&
          f.winner?.agentId === delta.id &&
          f.winner?.completed &&
          f.skillPurchase.length > 0 &&
          f.bids.length === 2;
        if (ok) results.push(summarize(f));
      }
    }
  }
  console.log(results.slice(0, 10).join('\n---\n'));
  console.log('matches:', results.length);
  process.exit(0);
}

const seed = Number(process.env.DEMO_SEED ?? 12);
const tasksPerRound = Number(process.env.DEMO_TASKS ?? 3);
const warmupRounds = Number(process.env.DEMO_WARMUP ?? 0);
const initialAbility = Number(process.env.DEMO_ABILITY ?? 28);
const fixture = buildFixture(seed, tasksPerRound, warmupRounds, initialAbility);
const outDir = path.join(process.cwd(), 'packages/web/src/demo');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'bid-demo.fixture.json');
fs.writeFileSync(outFile, JSON.stringify(fixture, null, 2) + '\n');
console.log(summarize(fixture));
console.log('written:', outFile);
