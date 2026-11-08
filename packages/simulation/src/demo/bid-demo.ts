/**
 * Deterministic bidding-demo fixture builder (shared by the CLI script, the API and tests).
 *
 * Layers:
 *  1. Decision Layer  — simulation engine (MockAgentDecisionProvider, personality-aware).
 *  2. Explanation Layer — turns public event payloads into structured explanations.
 *  3. Presentation Layer — the web app turns factors into short public lines (no economics).
 *
 * The builder is pure: same options -> byte-identical fixture. It never touches the filesystem.
 */
import { createDualCivilizationGame, createFreeMarketRules } from '../core/factory.js';
import { runSingleRound } from '../core/engine.js';
import { MockAgentDecisionProvider } from '../agents/mock-decision-provider.js';
import { effectiveAbility, getSkillById } from '../core/skills.js';
import { successProbability } from '../core/odds.js';
import { clampRules, type RulesPatch } from '../core/rules-clamp.js';
import {
  agentExpectedQuality,
  observedCompetitorsFor,
  personalGoalFor,
  riskComfortFloor,
} from '../market/bidding.js';
import { postPlayerTask } from '../market/player-task.js';
import type { AgentState, CivilizationState, GameEvent, GameState, MarketTask, TaskDomain } from '../core/types.js';

type ScenarioSpec = {
  title: string;
  titleEn: string;
  domain: TaskDomain;
  reward: number;
  description: string;
  durationRounds?: number;
};

const DEMO_SCENARIOS: ScenarioSpec[] = [
  {
    title: '修复网站登录问题',
    titleEn: 'Fix the website login bug',
    domain: 'coding',
    reward: 100,
    description: '客户网站的登录入口一直报错，需要在今天内修好。',
  },
  {
    title: '整理竞品研究报告',
    titleEn: 'Competitor research brief',
    domain: 'research',
    reward: 110,
    description: '运营需要一份竞品功能与定价对比，明早给结论。',
  },
  {
    title: '设计品牌视觉套件',
    titleEn: 'Brand visual kit',
    domain: 'design',
    reward: 120,
    description: '新品牌要一套能直接上手的视觉规范与首屏。',
    durationRounds: 2,
  },
];

const ROLE_BY_DOMAIN: Record<TaskDomain, 'Coding' | 'Research' | 'Design'> = {
  coding: 'Coding',
  research: 'Research',
  design: 'Design',
};

type Profile = {
  personality: string;
  personalityLabel: string;
  blurb: string;
  risk: number;
  invest: number;
  cooperation: number;
};

/** Authored characters for this demo (only focus trio is fully fleshed out). */
const PROFILES: Record<number, Profile> = {
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
  1: {
    personality: 'pragmatic',
    personalityLabel: '务实型',
    blurb: '有把握才出手，平时先攒钱。',
    risk: 0.42,
    invest: 0.45,
    cooperation: 0.55,
  },
  2: {
    personality: 'curious',
    personalityLabel: '好奇型',
    blurb: '愿意试新领域，但更看重划算不划算。',
    risk: 0.54,
    invest: 0.6,
    cooperation: 0.5,
  },
  4: {
    personality: 'quiet',
    personalityLabel: '低调型',
    blurb: '不抢风头，靠稳定交付积累口碑。',
    risk: 0.66,
    invest: 0.5,
    cooperation: 0.6,
  },
  5: {
    personality: 'balanced',
    personalityLabel: '平衡型',
    blurb: '风险与收益都要说得过去。',
    risk: 0.42,
    invest: 0.7,
    cooperation: 0.65,
  },
  7: {
    personality: 'observer',
    personalityLabel: '观察型',
    blurb: '先看市场，再决定动不动手。',
    risk: 0.54,
    invest: 0.55,
    cooperation: 0.5,
  },
};

function specialtyOf(agent: AgentState): TaskDomain {
  return (
    Object.entries(agent.abilities) as [TaskDomain, number][]
  ).sort((a, b) => b[1] - a[1])[0]![0];
}

function successForAbility(ability: number, task: { requirements: { difficulty: number; minAbility: number } }) {
  return successProbability(ability, task.requirements.difficulty, task.requirements.minAbility);
}

type Payload = Record<string, any>;

function payloadOf(event: GameEvent | undefined): Payload | null {
  return (event?.payload as Payload | undefined) ?? null;
}

export interface BuildBidDemoOptions {
  seed?: number;
  tasksPerRound?: number;
  warmupRounds?: number;
  initialAbility?: number;
  /** Institutions the player wants to test. Values are clamped by the engine. */
  rules?: RulesPatch;
  /** Optional task override (kept stable for institution comparisons). */
  scenario?: { title?: string; titleEn?: string; domain?: TaskDomain; reward?: number; description?: string; durationRounds?: number };
  /** Campaign task rotation; defaults to coding -> research -> design. */
  scenarios?: Array<{ title?: string; titleEn?: string; domain?: TaskDomain; reward?: number; description?: string; durationRounds?: number }>;
  /** Engine round cap; campaigns pass their own. */
  totalRounds?: number;
  /** Richer cost/profit/reputation/competition model. Default false keeps the classic fixture. */
  marketDepth?: boolean;
}

type ResolvedScenario = ScenarioSpec;

function createBidDemoState(options: BuildBidDemoOptions = {}) {
  const seed = options.seed ?? 12;
  const tasksPerRound = options.tasksPerRound ?? 3;
  const initialAbility = options.initialAbility ?? 28;
  const scenario = { ...DEMO_SCENARIOS[0]!, ...options.scenario } as ResolvedScenario;
  const rules = clampRules(createFreeMarketRules('自由市场'), options.rules ?? {});
  const totalRounds = Math.max(30, options.totalRounds ?? 30);

  const state = createDualCivilizationGame(
    { seed, totalRounds, tasksPerRound, initialAgentAbility: initialAbility },
    rules,
  );
  const civ = state.civilizations[0]!;
  state.civilizations = [civ];

  // Author the cast (traits are real engine inputs, not display labels).
  civ.agents.forEach((agent, index) => {
    const profile = PROFILES[index];
    if (!profile) return;
    agent.traits.riskTolerance = profile.risk;
    agent.traits.investAggression = profile.invest;
    agent.traits.cooperationPreference = profile.cooperation;
  });

  return { state, civ, seed, tasksPerRound, initialAbility, scenario, rules };
}

function snapshotBidDemo(input: {
  state: GameState;
  civ: CivilizationState;
  task: MarketTask;
  before: AgentState[];
  scenario: ResolvedScenario;
  treasuryStart: number;
  demoRound: number;
  seed: number;
  tasksPerRound: number;
  warmupRounds: number;
  initialAbility: number;
}) {
  const {
    state,
    civ,
    task,
    before,
    scenario,
    treasuryStart,
    demoRound,
    seed,
    tasksPerRound,
    warmupRounds,
    initialAbility,
  } = input;

  const roundEvents: GameEvent[] = state.events.filter((e) => e.round === demoRound);
  const focusEvents = roundEvents.filter((e) => (e.payload as Payload | undefined)?.taskId === task.id);
  const bidEvents = focusEvents.filter((e) => e.kind === 'bid_placed');
  const declineEvents = focusEvents.filter((e) => e.kind === 'bid_declined');
  const assigned = focusEvents.find((e) => e.kind === 'task_assigned');
  const completed = focusEvents.find((e) => e.kind === 'task_completed');
  const failed = focusEvents.find((e) => e.kind === 'task_failed');
  const winnerId = (payloadOf(assigned)?.agentId as string | undefined) ?? null;
  const winnerBefore = before.find((a) => a.id === winnerId);
  const winnerAfter = civ.agents.find((a) => a.id === winnerId);
  const purchased = winnerId
    ? roundEvents.filter((e) => e.kind === 'skill_purchased' && (e.payload as Payload | undefined)?.agentId === winnerId)
    : [];

  const agents = civ.agents.map((agent, index) => {
    const previous = before[index]!;
    const profile = PROFILES[index]!;
    const domain = specialtyOf(previous);
    const goal = personalGoalFor(previous, civ);
    const observed = observedCompetitorsFor(previous, civ, scenario.domain);
    const bidEvent = bidEvents.find((e) => payloadOf(e)?.agentId === agent.id);
    const declineEvent = declineEvents.find((e) => payloadOf(e)?.agentId === agent.id);
    const isWinner = agent.id === winnerId;

    const decisionPayload = payloadOf(bidEvent) ?? payloadOf(declineEvent);
    const action = bidEvent ? 'bid' : ('pass' as const);
    const abilities = effectiveAbility(
      previous.abilities,
      previous.skills.map((s) => s.skillId),
      [],
    );
    const probability =
      typeof decisionPayload?.successProbability === 'number'
        ? decisionPayload.successProbability
        : successForAbility(abilities[scenario.domain], task);
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
      skillsAfter: agent.skills.map((s) => ({
        id: s.skillId,
        name: getSkillById(s.skillId)?.name ?? s.skillId,
      })),
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
        bidAmount: bidEvent ? (decisionPayload?.bidAmount as number) : null,
        expectedQuality: quality,
        successProbability: probability,
        riskComfortFloor:
          typeof decisionPayload?.riskComfortFloor === 'number'
            ? decisionPayload.riskComfortFloor
            : riskComfortFloor(previous),
        expectedReward: task.reward,
        expectedValue:
          decisionPayload?.expectedValue ??
          Math.round(quality * task.reward * (1 + previous.traits.domainAffinity[scenario.domain])),
        estimatedCost: decisionPayload?.estimatedCost as number | undefined,
        expectedProfit: decisionPayload?.expectedProfit as number | undefined,
        reputation: decisionPayload?.reputation as number | undefined,
        competitors: decisionPayload?.competitors as number | undefined,
        reasonFactors,
        observedCompetitors: decisionPayload?.observedCompetitors ?? observed,
        personalGoal: { id: goal.id, label: goal.label },
        result: isWinner ? (completed ? 'won' : 'failed') : action === 'pass' ? 'passed' : 'lost',
        reaction,
      },
      busyUntilRound: agent.busyUntilRound ?? 0,
      isFocus: index === 0 || index === 3 || index === 6,
    };
  });

  const bids = bidEvents.map((e) => {
    const payload = payloadOf(e)!;
    const agent = agents.find((a) => a.id === payload.agentId)!;
    return {
      agentId: payload.agentId as string,
      displayName: agent.displayName,
      bidAmount: payload.bidAmount as number,
      expectedQuality: agent.decision.expectedQuality,
      successProbability: payload.successProbability as number,
      estimatedCost: payload.estimatedCost as number | undefined,
      expectedProfit: payload.expectedProfit as number | undefined,
      reputation: payload.reputation as number | undefined,
      competitors: payload.competitors as number | undefined,
      teamAgentIds: payload.teamAgentIds as string[] | undefined,
      teamQuality: payload.teamQuality as number | undefined,
      teamProbability: payload.teamProbability as number | undefined,
      teamCost: payload.teamCost as number | undefined,
      teamProfit: payload.teamProfit as number | undefined,
      reasonFactors: payload.reasonFactors,
      personalGoalLabel: payload.personalGoalLabel as string,
    };
  });

  const otherTasks = state.marketTasks
    .filter(
      (t) =>
        t.id !== task.id &&
        roundEvents.some((e) => e.kind === 'task_assigned' && payloadOf(e)?.taskId === t.id),
    )
    .map((t) => ({
      id: t.id,
      title: t.title,
      domain: t.requirements.domain,
      reward: t.reward,
      status: t.status,
      winnerName: t.assignedAgentId
        ? before.find((a) => a.id === t.assignedAgentId)?.displayName ?? null
        : null,
    }));

  const rawEvents = roundEvents.map((e) => ({
    id: e.id,
    round: e.round,
    kind: e.kind,
    message: e.message,
    payload: e.payload ?? null,
  }));

  // Skill feedback is domain-aware: a coding skill bought on a research task
  // improves coding, not the research success rate for this task.
  const firstPurchase = purchased.length ? payloadOf(purchased[0]) : null;
  const purchasedSkill = firstPurchase ? getSkillById(firstPurchase.skillId as string) : undefined;
  const skillDomain = purchasedSkill?.domain ?? scenario.domain;
  const winnerCodingAfter = winnerAfter
    ? effectiveAbility(
        winnerAfter.abilities,
        winnerAfter.skills.map((s) => s.skillId),
        [],
      )[skillDomain]
    : null;
  const winnerCodingBefore = winnerBefore
    ? effectiveAbility(
        winnerBefore.abilities,
        winnerBefore.skills.map((s) => s.skillId),
        [],
      )[skillDomain]
    : null;

  const taxEvent = completed ? focusEvents.find((e) => e.kind === 'tax_collected') : undefined;

  // Treasury reconciliation: all completed tasks in this round, not only the demo task.
  const taxEvents: GameEvent[] = roundEvents.filter((e) => e.kind === 'tax_collected');
  const totalTax = taxEvents.reduce((sum, e) => sum + ((payloadOf(e)?.tax as number | undefined) ?? 0), 0);
  const mainTaskTax = taxEvents
    .filter((e) => payloadOf(e)?.taskId === task.id)
    .reduce((sum, e) => sum + ((payloadOf(e)?.tax as number | undefined) ?? 0), 0);
  const otherTaskTax = totalTax - mainTaskTax;
  const publicResearch = taxEvents.reduce(
    (sum, e) => sum + Math.round(((payloadOf(e)?.tax as number | undefined) ?? 0) * civ.rules.publicResearchShare),
    0,
  );
  const toTreasury = totalTax - publicResearch;
  const treasuryEnd = civ.treasury;
  const treasuryBreakdown = {
    start: treasuryStart,
    end: treasuryEnd,
    delta: treasuryEnd - treasuryStart,
    mainTaskTax,
    otherTaskTax,
    totalTax,
    publicResearch,
    toTreasury,
    completedTasks: taxEvents.length,
    consistent: treasuryStart + toTreasury === treasuryEnd,
  };

  return {
    version: 2,
    generatedBy: 'packages/simulation/src/demo/bid-demo.ts',
    seed,
    tasksPerRound,
    warmupRounds,
    demoRound,
    initialAbility,
    scenario: {
      taskId: task.id,
      title: scenario.title,
      titleEn: scenario.titleEn,
      domain: scenario.domain,
      domainLabel: ROLE_BY_DOMAIN[scenario.domain],
      description: scenario.description,
      reward: task.reward,
      difficulty: task.requirements.difficulty,
      minAbility: task.requirements.minAbility,
      source: task.source,
      durationRounds: task.durationRounds ?? 1,
    },
    civilization: {
      id: civ.id,
      name: '晨曦文明',
      rules: civ.rules,
      treasuryStart,
      treasuryAfter: civ.treasury,
    },
    treasuryBreakdown,
    focusAgentIds: [agents[0]!.id, agents[3]!.id, agents[6]!.id],
    agents,
    bids,
    declines: declineEvents.map((e: GameEvent) => ({
      agentId: payloadOf(e)!.agentId as string,
      reasonCode: payloadOf(e)!.reasonCode as string,
    })),
    winner: winnerId
      ? {
          agentId: winnerId,
          displayName: winnerBefore!.displayName,
          bidAmount: task.winningBid ?? 0,
          completed: !!completed,
          failed: !!failed,
          quality: (payloadOf(completed)?.quality as number | undefined) ?? null,
          teamAgentIds: task.assignedTeamIds,
        }
      : null,
    settlement: completed
      ? {
          gross: task.reward,
          tax: (payloadOf(taxEvent)?.tax as number | undefined) ?? null,
          net: (payloadOf(taxEvent)?.net as number | undefined) ?? null,
          walletBefore: winnerBefore!.wallet,
          walletAfter: winnerAfter!.wallet,
        }
      : null,
    skillPurchase: purchased.length
      ? purchased.map((e: GameEvent) => {
          const payload = payloadOf(e)!;
          const skill = getSkillById(payload.skillId as string);
          return {
            skillId: payload.skillId as string,
            name: skill?.name ?? (payload.skillId as string),
            domain: skill?.domain ?? scenario.domain,
            price: payload.price as number,
            abilityBefore: winnerCodingBefore,
            abilityAfter: winnerCodingAfter,
          };
        })
      : [],
    nextRound: {
      domain: skillDomain,
      abilityBefore: winnerCodingBefore,
      abilityAfter: winnerCodingAfter,
      successBefore: winnerCodingBefore === null ? null : successForAbility(winnerCodingBefore, task),
      successAfter: winnerCodingAfter === null ? null : successForAbility(winnerCodingAfter, task),
    },
    otherTasks,
    rawEvents,
  };
}

export function buildBidDemoFixture(options: BuildBidDemoOptions = {}) {
  const { state, civ, seed, tasksPerRound, initialAbility, scenario } = createBidDemoState(options);
  const warmupRounds = options.warmupRounds ?? 0;

  const provider = options.marketDepth
    ? new MockAgentDecisionProvider({ marketDepth: true })
    : undefined;
  for (let i = 0; i < warmupRounds; i += 1) runSingleRound(state, provider);

  const before = structuredClone(civ.agents);
  const treasuryStart = civ.treasury;
  const demoRound = state.round + 1;

  const task = postPlayerTask(state, {
    title: scenario.title,
    domain: scenario.domain,
    reward: scenario.reward,
    durationRounds: scenario.durationRounds,
  });

  runSingleRound(state, provider);

  return snapshotBidDemo({
    state,
    civ,
    task,
    before,
    scenario,
    treasuryStart,
    demoRound,
    seed,
    tasksPerRound,
    warmupRounds,
    initialAbility,
  });
}

export type BidDemoCampaign = ReturnType<typeof createBidDemoCampaign>;

export function createBidDemoCampaign(options: BuildBidDemoOptions & { maxRounds?: number } = {}) {
  const maxRounds = options.maxRounds ?? 5;
  const scenarios = (options.scenarios?.length
    ? options.scenarios.map((s) => ({ ...DEMO_SCENARIOS[0]!, ...s }))
    : DEMO_SCENARIOS) as ResolvedScenario[];
  const base = createBidDemoState({
    ...options,
    scenario: scenarios[0],
    totalRounds: Math.max(30, maxRounds + 1),
  });
  return { ...base, scenarios, maxRounds, completedRounds: 0, marketDepth: options.marketDepth ?? false };
}

/** Advance the campaign by one real engine round; state (wallets, skills) is preserved. */
export function advanceBidDemoCampaign(campaign: BidDemoCampaign) {
  if (campaign.completedRounds >= campaign.maxRounds) {
    throw new Error(`campaign finished (${campaign.completedRounds}/${campaign.maxRounds})`);
  }

  const { state, civ, seed, tasksPerRound, initialAbility } = campaign;
  const scenario = campaign.scenarios[campaign.completedRounds % campaign.scenarios.length]!;
  const before = structuredClone(civ.agents);
  const treasuryStart = civ.treasury;
  const demoRound = state.round + 1;

  const task = postPlayerTask(state, {
    title: scenario.title,
    domain: scenario.domain,
    reward: scenario.reward,
    durationRounds: scenario.durationRounds,
  });

  const provider = campaign.marketDepth
    ? new MockAgentDecisionProvider({ marketDepth: true })
    : undefined;
  runSingleRound(state, provider);
  campaign.completedRounds = state.round;

  const fixture = snapshotBidDemo({
    state,
    civ,
    task,
    before,
    scenario,
    treasuryStart,
    demoRound,
    seed,
    tasksPerRound,
    warmupRounds: 0,
    initialAbility,
  });

  return { fixture, campaign };
}
