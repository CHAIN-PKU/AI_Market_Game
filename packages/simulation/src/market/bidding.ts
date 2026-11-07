import type { AgentState, CivilizationState, MarketTask, TaskDomain } from '../core/types.js';
import { effectiveAbility, getSkillById } from '../core/skills.js';
import { successProbability } from '../core/odds.js';

export interface PublicReasonFactor {
  key: string;
  label: string;
  /** Raw numeric/string value; the presentation layer formats it for players. */
  value: number | string;
}

export interface ObservedCompetitors {
  /** How many residents currently show a higher ability in this task domain (public rosters). */
  strongerSpecialists: number;
  topEarnerName: string | null;
  topEarnerEarnings: number;
}

export interface Bid {
  taskId: string;
  agentId: string;
  civilizationId: string;
  bidAmount: number;
  expectedQuality: number;
  /** Public decision record — consumed by the Explanation Layer. */
  successProbability?: number;
  riskComfortFloor?: number;
  expectedReward?: number;
  expectedValue?: number;
  personalGoalId?: string;
  personalGoalLabel?: string;
  observedCompetitors?: ObservedCompetitors;
  reasonFactors?: PublicReasonFactor[];
}

export type DeclineReasonCode = 'risk_above_comfort' | 'too_little_upside' | 'lower_priority';

export interface BidDecline {
  taskId: string;
  agentId: string;
  civilizationId: string;
  reasonCode: DeclineReasonCode;
  successProbability: number;
  expectedQuality: number;
  riskComfortFloor: number;
  expectedReward: number;
  expectedValue: number;
  personalGoalId: string;
  personalGoalLabel: string;
  observedCompetitors: ObservedCompetitors;
  reasonFactors: PublicReasonFactor[];
}

export interface PersonalGoal {
  id: 'save_for_skill' | 'grow_savings';
  label: string;
  skillId?: string;
  price?: number;
}

const DOMAIN_CYCLE: TaskDomain[] = ['coding', 'research', 'design'];

export function specialtyOf(agent: AgentState): TaskDomain {
  return DOMAIN_CYCLE.reduce((best, domain) =>
    agent.abilities[domain] > agent.abilities[best] ? domain : best
  );
}

/** Risk-adjusted minimum success rate this resident needs before bidding. */
export function riskComfortFloor(agent: AgentState): number {
  return 0.2 + (1 - agent.traits.riskTolerance) * 0.28;
}

/** What this resident is currently saving for — drives price aggressiveness and public goal. */
export function personalGoalFor(agent: AgentState, civ: CivilizationState): PersonalGoal {
  const specialty = specialtyOf(agent);
  const skillId = `skill_${specialty}_basic`;
  const skill = getSkillById(skillId);
  const owned = agent.skills.some((s) => s.skillId === skillId);
  const shared = civ.sharedSkillIds.includes(skillId);
  if (skill && !owned && !shared) {
    return { id: 'save_for_skill', label: `攒钱买「${skill.name}」`, skillId, price: skill.price };
  }
  return { id: 'grow_savings', label: '继续扩大储蓄' };
}

export function observedCompetitorsFor(
  agent: AgentState,
  civ: CivilizationState,
  domain: TaskDomain
): ObservedCompetitors {
  const ownAbility = effectiveAbility(
    agent.abilities,
    agent.skills.map((s) => s.skillId),
    civ.sharedSkillIds
  )[domain];
  const strongerSpecialists = civ.agents.filter((other) => {
    if (other.id === agent.id) return false;
    const ability = effectiveAbility(
      other.abilities,
      other.skills.map((s) => s.skillId),
      civ.sharedSkillIds
    )[domain];
    return ability > ownAbility;
  }).length;
  const topEarner = [...civ.agents].sort((a, b) => b.stats.grossEarnings - a.stats.grossEarnings)[0];
  return {
    strongerSpecialists,
    topEarnerName: topEarner?.displayName ?? null,
    topEarnerEarnings: topEarner?.stats.grossEarnings ?? 0,
  };
}

/**
 * Personality-aware bid price.
 * - Cautious residents keep a higher safety margin (bid closer to the reward).
 * - Risk-takers bid lower to win.
 * - Residents saving for a skill shade prices lower to secure income.
 */
export function bidPriceFactor(
  agent: AgentState,
  opts: { savingForSkill: boolean },
  rng: () => number
): number {
  const base = 0.72 + rng() * 0.18;
  const riskAdjust = (0.5 - agent.traits.riskTolerance) * 0.1;
  const urgency = opts.savingForSkill ? 0.035 : 0;
  return Math.max(0.55, Math.min(0.95, base + riskAdjust - urgency));
}

export function buildReasonFactors(input: {
  agent: AgentState;
  successProbability: number;
  riskComfortFloor: number;
  expectedReward: number;
  expectedValue: number;
  goal: PersonalGoal;
  observed: ObservedCompetitors;
}): PublicReasonFactor[] {
  return [
    { key: 'successProbability', label: '自估成功率', value: round3(input.successProbability) },
    { key: 'riskComfortFloor', label: '风险安全线', value: round3(input.riskComfortFloor) },
    { key: 'expectedReward', label: '订单奖励', value: input.expectedReward },
    { key: 'expectedValue', label: '风险调整后价值', value: Math.round(input.expectedValue) },
    { key: 'wallet', label: '当前钱包', value: input.agent.wallet },
    { key: 'personalGoal', label: '当前目标', value: input.goal.label },
    { key: 'observedStronger', label: '同行中更强的人', value: input.observed.strongerSpecialists },
  ];
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export function successProbabilityFor(
  agent: AgentState,
  civ: CivilizationState,
  task: MarketTask
): number {
  const ability = effectiveAbility(
    agent.abilities,
    agent.skills.map((s) => s.skillId),
    civ.sharedSkillIds
  )[task.requirements.domain];
  return successProbability(ability, task.requirements.difficulty, task.requirements.minAbility);
}

export function scoreBid(bid: Bid, task: MarketTask): number {
  const qualityWeight = 0.55;
  const priceWeight = 0.45;
  const normalizedPrice = 1 - bid.bidAmount / Math.max(task.reward, 1);
  return qualityWeight * bid.expectedQuality + priceWeight * normalizedPrice;
}

export function agentExpectedQuality(
  agent: AgentState,
  civ: CivilizationState,
  task: MarketTask
): number {
  const owned = agent.skills.map((s) => s.skillId);
  const abilities = effectiveAbility(agent.abilities, owned, civ.sharedSkillIds);
  const ability = abilities[task.requirements.domain];
  const gap = ability - task.requirements.difficulty;
  return Math.max(0, Math.min(1, 0.45 + gap * 0.03));
}

export interface BidSelectionOptions {
  /** Prevent one superstar agent from taking every order in a round. */
  maxTasksPerAgent?: number;
  /** When scores are close, prefer the civilization with fewer wins this round. */
  balanceCivilizations?: boolean;
}

export function selectWinningBids(
  tasks: MarketTask[],
  bids: Bid[],
  options: BidSelectionOptions = {},
): Map<string, Bid> {
  const maxTasksPerAgent = options.maxTasksPerAgent ?? 1;
  const balanceCivilizations = options.balanceCivilizations ?? true;

  const openTasks = tasks
    .filter((t) => t.status === 'open')
    .sort((a, b) => b.reward - a.reward);

  const winsByAgent = new Map<string, number>();
  const winsByCiv = new Map<string, number>();
  const winners = new Map<string, Bid>();

  for (const task of openTasks) {
    const taskBids = bids.filter((b) => {
      if (b.taskId !== task.id) return false;
      const wins = winsByAgent.get(b.agentId) ?? 0;
      return wins < maxTasksPerAgent;
    });
    if (taskBids.length === 0) continue;

    const scored = taskBids.map((bid) => ({ bid, score: scoreBid(bid, task) }));
    scored.sort((a, b) => b.score - a.score);
    const topScore = scored[0]!.score;
    const close = scored.filter((s) => topScore - s.score <= 0.04);

    let pick = scored[0]!.bid;
    if (balanceCivilizations && close.length > 1) {
      close.sort((a, b) => {
        const aw = winsByCiv.get(a.bid.civilizationId) ?? 0;
        const bw = winsByCiv.get(b.bid.civilizationId) ?? 0;
        if (aw !== bw) return aw - bw;
        return b.score - a.score;
      });
      pick = close[0]!.bid;
    }

    winners.set(task.id, pick);
    winsByAgent.set(pick.agentId, (winsByAgent.get(pick.agentId) ?? 0) + 1);
    winsByCiv.set(pick.civilizationId, (winsByCiv.get(pick.civilizationId) ?? 0) + 1);
  }

  return winners;
}

export function agentAlreadyOwnsSkill(agent: AgentState, skillId: string): boolean {
  return agent.skills.some((s) => s.skillId === skillId);
}

export function nextAffordableSkill(
  agent: AgentState,
  civ: CivilizationState,
): { skillId: string; price: number } | undefined {
  const owned = new Set(agent.skills.map((s) => s.skillId));
  const shared = new Set(civ.sharedSkillIds);
  const candidates = ['skill_coding_basic', 'skill_research_basic', 'skill_design_basic']
    .map((id) => getSkillById(id))
    .filter((s): s is NonNullable<typeof s> => !!s)
    .filter((s) => !owned.has(s.id) && !shared.has(s.id))
    .filter((s) => agent.wallet >= s.price);
  if (candidates.length === 0) return undefined;
  const aff = agent.traits.domainAffinity;
  candidates.sort(
    (a, b) => aff[b.domain] + b.abilityBonus * 0.01 - (aff[a.domain] + a.abilityBonus * 0.01),
  );
  const pick = candidates[0]!;
  return { skillId: pick.id, price: pick.price };
}
