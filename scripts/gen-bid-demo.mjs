/**
 * Generates the deterministic bidding-demo fixture from the REAL simulation engine.
 * Run: npm run demo:fixture   (requires `npm run build -w @ai-civ/simulation` first)
 *
 * The web demo only replays this fixture — it never re-implements economy rules.
 */
import {
  agentExpectedQuality,
  createDualCivilizationGame,
  createFreeMarketRules,
  effectiveAbility,
  postPlayerTask,
  runSingleRound,
  getSkillById,
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

function successProbability(ability, difficulty, minAbility) {
  const gap = ability - difficulty;
  const meetMin = ability >= minAbility;
  const p = meetMin ? 0.35 + gap * 0.025 : 0.05 + ability * 0.005;
  return Math.max(0.03, Math.min(0.97, p));
}

function specialtyOf(agent) {
  return Object.entries(agent.abilities).sort((a, b) => b[1] - a[1])[0][0];
}

function buildFixture(seed, tasksPerRound, warmupRounds, initialAbility) {
  const state = createDualCivilizationGame(
    { seed, totalRounds: 8, tasksPerRound, initialAgentAbility: initialAbility },
    createFreeMarketRules('自由市场')
  );
  const civ = state.civilizations[0];
  // Product Slice is single-civilization: keep only 晨曦文明 for the demo round.
  state.civilizations = [civ];

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
  const bids = roundEvents
    .filter((e) => e.kind === 'bid_placed' && e.payload?.taskId === task.id)
    .map((e) => {
      const agent = before.find((a) => a.id === e.payload.agentId);
      if (!agent) return null;
      const abilities = effectiveAbility(agent.abilities, agent.skills.map((s) => s.skillId), []);
      const quality = agentExpectedQuality(agent, civ, task);
      const ability = abilities[SCENARIO.domain];
      return {
        agentId: agent.id,
        displayName: agent.displayName,
        bidAmount: e.payload.bidAmount,
        expectedQuality: Number(quality.toFixed(3)),
        successProbability: Number(
          successProbability(ability, task.requirements.difficulty, task.requirements.minAbility).toFixed(3)
        ),
        ability,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.successProbability - a.successProbability);

  const assigned = roundEvents.find((e) => e.kind === 'task_assigned' && e.payload?.taskId === task.id);
  const completed = roundEvents.find((e) => e.kind === 'task_completed' && e.payload?.taskId === task.id);
  const failed = roundEvents.find((e) => e.kind === 'task_failed' && e.payload?.taskId === task.id);
  const taxEvent = completed
    ? roundEvents.find((e) => e.kind === 'tax_collected' && e.payload?.taskId === task.id)
    : null;

  const winnerId = assigned?.payload?.agentId ?? null;
  const winnerBefore = before.find((a) => a.id === winnerId);
  const winnerAfter = civ.agents.find((a) => a.id === winnerId);
  const purchased = winnerId
    ? roundEvents.filter((e) => e.kind === 'skill_purchased' && e.payload?.agentId === winnerId)
    : [];

  const agents = civ.agents.map((agent, i) => {
    const previous = before[i];
    const submitted = bids.find((b) => b.agentId === agent.id);
    const abilities = effectiveAbility(previous.abilities, previous.skills.map((s) => s.skillId), []);
    const ability = abilities[SCENARIO.domain];
    const quality = agentExpectedQuality(previous, civ, task);
    const score = quality * task.reward * (1 + previous.traits.domainAffinity[SCENARIO.domain]);
    return {
      id: agent.id,
      displayName: agent.displayName,
      role: ROLE_BY_DOMAIN[specialtyOf(previous)],
      specialty: specialtyOf(previous),
      abilities: previous.abilities,
      traits: previous.traits,
      walletBefore: previous.wallet,
      walletAfter: agent.wallet,
      skillsAfter: agent.skills.map((s) => s.skillId),
      bid: submitted ?? null,
      expectedQuality: Number(quality.toFixed(3)),
      score: Number(score.toFixed(1)),
      passed: !submitted,
      passReason: submitted
        ? null
        : score < 25
          ? `估分 ${Number(score.toFixed(1))}，低于 25 的接单门槛`
          : '这单排不进本轮前两单，先去抢报酬更高的任务',
    };
  });

  const rawEvents = roundEvents.map((e) => ({
    id: e.id,
    round: e.round,
    kind: e.kind,
    message: e.message,
    payload: e.payload ?? null,
  }));

  return {
    version: 1,
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
    agents,
    bids,
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
          const domainBefore = effectiveAbility(
            winnerBefore.abilities,
            winnerBefore.skills.map((s) => s.skillId),
            []
          );
          const domainAfter = effectiveAbility(winnerAfter.abilities, winnerAfter.skills.map((s) => s.skillId), []);
          return {
            skillId: e.payload.skillId,
            name: skill?.name ?? e.payload.skillId,
            price: e.payload.price,
            abilityBefore: domainBefore[skill.domain],
            abilityAfter: domainAfter[skill.domain],
          };
        })
      : [],
    walletAfterRound: winnerAfter?.wallet ?? null,
    rawEvents,
  };
}

function summarize(fixture) {
  const bidders = fixture.bids.map((b) => `${b.displayName}:${b.bidAmount}(${b.successProbability})`).join(', ');
  const bought = fixture.skillPurchase.map((s) => `${s.name} ${s.price}G ${s.abilityBefore}->${s.abilityAfter}`).join('; ');
  return [
    `seed=${fixture.seed} tasksPerRound=${fixture.tasksPerRound} warmup=${fixture.warmupRounds} ability=${fixture.initialAbility} round=${fixture.demoRound}`,
    `  bids=${fixture.bids.length} [${bidders}]`,
    `  winner=${fixture.winner?.displayName ?? 'none'} completed=${fixture.winner?.completed ?? false} failed=${fixture.winner?.failed ?? false}`,
    `  settlement=${JSON.stringify(fixture.settlement)}`,
    `  skill=${bought || 'none'}`,
  ].join('\n');
}

const explore = process.argv.includes('--explore');
if (explore) {
  for (let seed = 1; seed <= 30; seed += 1) {
    for (const tasksPerRound of [2, 3]) {
      for (const warmupRounds of [0, 1]) {
        for (const initialAbility of [28, 30, 32]) {
          const f = buildFixture(seed, tasksPerRound, warmupRounds, initialAbility);
          if (f.winner?.completed && f.skillPurchase.length && f.bids.length >= 2 && f.bids.length <= 5) {
            console.log(summarize(f));
          }
        }
      }
    }
  }
  process.exit(0);
}

const seed = Number(process.env.DEMO_SEED ?? 12);
const tasksPerRound = Number(process.env.DEMO_TASKS ?? 3);
const warmupRounds = Number(process.env.DEMO_WARMUP ?? 1);
const initialAbility = Number(process.env.DEMO_ABILITY ?? 30);
const fixture = buildFixture(seed, tasksPerRound, warmupRounds, initialAbility);
const outDir = path.join(process.cwd(), 'packages/web/src/demo');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'bid-demo.fixture.json');
fs.writeFileSync(outFile, JSON.stringify(fixture, null, 2) + '\n');
console.log(summarize(fixture));
console.log('written:', outFile);
