import type { AgentState, CivilizationState, MarketTask } from '../core/types.js';
import { effectiveAbility, getSkillById } from '../core/skills.js';

export interface Bid {
  taskId: string;
  agentId: string;
  civilizationId: string;
  bidAmount: number;
  expectedQuality: number;
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
  task: MarketTask,
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
