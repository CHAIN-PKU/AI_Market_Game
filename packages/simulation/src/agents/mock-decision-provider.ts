import type { AgentDecision, AgentDecisionContext, AgentDecisionProvider } from './types.js';
import {
  agentExpectedQuality,
  bidPriceFactor,
  buildReasonFactors,
  observedCompetitorsFor,
  personalGoalFor,
  riskComfortFloor,
  successProbabilityFor,
  type BidDecline,
  type Bid,
} from '../market/bidding.js';
import type { AgentState, CivilizationState, MarketTask } from '../core/types.js';
import { effectiveAbility } from '../core/skills.js';
import { successProbability } from '../core/odds.js';

/**
 * Deterministic heuristic agents — no LLM, fully reproducible.
 *
 * Personality is part of the decision rule (not flavour text):
 * - `riskTolerance` sets the success-probability floor below which a resident declines.
 * - `riskTolerance` also shades the bid price (cautious = higher margin, risk-taker = lower).
 * - `domainAffinity` weights expected value per task.
 * - `investAggression` is used later by the engine when deciding to buy a skill.
 */
type RingPlan = { taskId: string; leaderId: string; partnerIds: string[]; defectorId?: string };

export class MockAgentDecisionProvider implements AgentDecisionProvider {
  constructor(private opts: { marketDepth?: boolean } = {}) {}

  decideForCivilization(ctx: AgentDecisionContext): AgentDecision[] {
    const civ = ctx.getCivilization(ctx.civilizationId);
    if (!civ) return [];

    const openTasks = ctx.openTaskIds
      .map((id) => ctx.getTask(id))
      .filter((t): t is MarketTask => !!t && t.status === 'open');

    const playerTask = openTasks.find((t) => t.source === 'player');
    let ring: RingPlan | null = null;
    if (this.opts.marketDepth && civ.rules.allowCollaboration && playerTask) {
      const candidates = civ.agents
        .filter((a) => (a.busyUntilRound ?? 0) <= ctx.round)
        .sort((a, b) => {
          const aa = effectiveAbility(a.abilities, a.skills.map((s) => s.skillId), civ.sharedSkillIds)[
            playerTask.requirements.domain
          ];
          const bb = effectiveAbility(b.abilities, b.skills.map((s) => s.skillId), civ.sharedSkillIds)[
            playerTask.requirements.domain
          ];
          return bb - aa || a.id.localeCompare(b.id);
        });
      const ringCandidates = candidates;
      if (ringCandidates.length >= 2) {
        const leaderId = ringCandidates[0]!.id;
        const partner = ringCandidates[1]!;
        const defect = ctx.rng() < 0.5;
        ring = {
          taskId: playerTask.id,
          leaderId,
          partnerIds: defect ? [] : [partner.id],
          defectorId: defect ? partner.id : undefined,
        };
      }
    }
    return civ.agents.map((agent) => {
      if ((agent.busyUntilRound ?? 0) > ctx.round) return { bids: [], declines: [] };
      return this.decideForAgent(agent, civ, openTasks, ctx, ring);
    });
  }

  private decideForAgent(
    agent: AgentState,
    civ: CivilizationState,
    openTasks: MarketTask[],
    ctx: AgentDecisionContext,
    ring: RingPlan | null
  ): AgentDecision {
    const goal = personalGoalFor(agent, civ);
    const floor = riskComfortFloor(agent);

    const evaluated = openTasks.map((task) => {
      const quality = agentExpectedQuality(agent, civ, task);
      const probability = successProbabilityFor(agent, civ, task);
      const observed = observedCompetitorsFor(agent, civ, task.requirements.domain);
      const domain = task.requirements.domain;
      const ownAbility = effectiveAbility(
        agent.abilities,
        agent.skills.map((s) => s.skillId),
        civ.sharedSkillIds,
      )[domain];
      const rivals = civ.agents.filter((other) => {
        if (other.id === agent.id) return false;
        const ability = effectiveAbility(
          other.abilities,
          other.skills.map((s) => s.skillId),
          civ.sharedSkillIds,
        )[domain];
        return ability >= ownAbility - 5;
      }).length;
      const affinity = agent.traits.domainAffinity[domain];
      const ringDefections = agent.stats.ringDefections ?? 0;
      const reputation =
        (agent.stats.tasksCompleted + 1) /
        (agent.stats.tasksCompleted + agent.stats.tasksFailed + ringDefections * 2 + 3);
      const estimatedCost = Math.round(
        task.reward * (0.3 + (1 - quality) * 0.15 + (1 - probability) * 0.05),
      );
      const expectedProfit = Math.round(quality * task.reward - estimatedCost);
      const ringBlocked = !!ring && ring.taskId === task.id && ring.partnerIds.includes(agent.id);
      const expectedValue = this.opts.marketDepth
        ? Math.max(0, expectedProfit) * (1 + affinity) * (task.source === 'player' ? 1.25 : 1)
        : quality * task.reward * (1 + affinity);
      const reasonFactors = buildReasonFactors({
        agent,
        successProbability: probability,
        riskComfortFloor: floor,
        expectedReward: task.reward,
        expectedValue,
        goal,
        observed,
      });
      if (this.opts.marketDepth) {
        reasonFactors.push(
          { key: 'estimatedCost', label: '预估成本', value: estimatedCost },
          { key: 'expectedProfit', label: '预计利润', value: expectedProfit },
          { key: 'reputation', label: '履约声誉', value: Math.round(reputation * 100) / 100 },
          { key: 'competitors', label: '同域对手', value: rivals },
        );
      }
      const eligible = this.opts.marketDepth
        ? !ringBlocked && probability >= floor && expectedProfit >= 1
        : probability >= floor && expectedValue >= 25;
      return { task, quality, probability, expectedValue, observed, rivals, reputation, estimatedCost, expectedProfit, reasonFactors, eligible, ringBlocked };
    });

    const eligible = evaluated
      .filter((entry) => entry.eligible)
      .sort((a, b) => {
        const playerDelta =
          (b.task.source === 'player' ? 1 : 0) - (a.task.source === 'player' ? 1 : 0);
        return playerDelta || b.expectedValue - a.expectedValue;
      });

    const chosen = eligible.slice(0, 2);
    const bids: Bid[] = chosen.map((entry) => {
      let priceFactor = bidPriceFactor(agent, { savingForSkill: goal.id === 'save_for_skill' }, ctx.rng);
      if (this.opts.marketDepth) {
        const pressure = Math.min(0.12, entry.rivals * 0.015);
        const reputationPremium = (entry.reputation - 0.4) * 0.04;
        priceFactor = Math.max(0.5, Math.min(0.95, priceFactor - pressure + reputationPremium));
        priceFactor = Math.max(priceFactor, (entry.estimatedCost + 4) / entry.task.reward);
      }
      return {
        taskId: entry.task.id,
        agentId: agent.id,
        civilizationId: civ.id,
        bidAmount: Math.round(entry.task.reward * priceFactor),
        expectedQuality: entry.quality,
        successProbability: entry.probability,
        riskComfortFloor: floor,
        expectedReward: entry.task.reward,
        expectedValue: Math.round(entry.expectedValue),
        estimatedCost: entry.estimatedCost,
        expectedProfit: entry.expectedProfit,
        reputation: Math.round(entry.reputation * 100) / 100,
        competitors: entry.rivals,
        personalGoalId: goal.id,
        personalGoalLabel: goal.label,
        observedCompetitors: entry.observed,
        reasonFactors: entry.reasonFactors,
        ringAgentIds: ring && entry.task.id === ring.taskId && ring.leaderId === agent.id && ring.partnerIds.length
          ? [ring.leaderId, ...ring.partnerIds]
          : undefined,
        ringDefected: !!ring && entry.task.id === ring.taskId && ring.defectorId === agent.id,
      };
    });

    if (this.opts.marketDepth && civ.rules.allowCollaboration) {
      const playerEntry = chosen.find(
        (entry) => entry.task.source === 'player' && entry.task.requirements.difficulty >= 35,
      );
      if (playerEntry) {
        const domain = playerEntry.task.requirements.domain;
        const abilityOf = (a: AgentState) =>
          effectiveAbility(a.abilities, a.skills.map((s) => s.skillId), civ.sharedSkillIds)[domain];
        const ownAbility = abilityOf(agent);
        const capable = civ.agents
          .filter((a) => successProbabilityFor(a, civ, playerEntry.task) >= riskComfortFloor(a))
          .sort((a, b) => abilityOf(b) - abilityOf(a) || a.id.localeCompare(b.id));
        const best = capable[0]?.id === agent.id;
        const partner = best
          ? civ.agents
              .filter((other) => other.id !== agent.id)
              .sort((a, b) => abilityOf(b) - abilityOf(a))[0]
          : undefined;
        if (partner) {
          const partnerQuality = agentExpectedQuality(partner, civ, playerEntry.task);
          const teamAbility = Math.max(ownAbility, abilityOf(partner)) + Math.min(ownAbility, abilityOf(partner)) * 0.25;
          const teamProbability = successProbability(
            teamAbility,
            playerEntry.task.requirements.difficulty,
            playerEntry.task.requirements.minAbility,
          );
          const teamQuality = Math.min(1, Math.max(playerEntry.quality, partnerQuality) + 0.08);
          const teamCost = Math.round(playerEntry.estimatedCost * 0.8);
          const teamProfit = Math.round(teamQuality * playerEntry.task.reward - teamCost);
          if (teamProfit >= 0) {
            const teamBidAmount = Math.round(
              playerEntry.task.reward * Math.max(0.58, Math.min(0.82, 0.64 + (1 - teamProbability) * 0.18)),
            );
            bids.push({
              taskId: playerEntry.task.id,
              agentId: agent.id,
              civilizationId: civ.id,
              bidAmount: Math.max(teamCost + 4, teamBidAmount),
              expectedQuality: teamQuality,
              successProbability: teamProbability,
              riskComfortFloor: floor,
              expectedReward: playerEntry.task.reward,
              expectedValue: Math.round(teamProfit * 1.1),
              estimatedCost: teamCost,
              expectedProfit: teamProfit,
              reputation: Math.round(playerEntry.reputation * 100) / 100,
              competitors: playerEntry.rivals,
              teamAgentIds: [agent.id, partner.id],
              teamQuality,
              teamProbability,
              teamCost,
              teamProfit,
              personalGoalId: goal.id,
              personalGoalLabel: goal.label,
              observedCompetitors: playerEntry.observed,
              reasonFactors: [
                ...playerEntry.reasonFactors,
                { key: 'team', label: '组队', value: partner.displayName },
              ],
              ringAgentIds:
                ring && ring.leaderId === agent.id
                  ? [ring.leaderId, ...ring.partnerIds]
                  : undefined,
            });
          }
        }
      }
    }

    const declines: BidDecline[] = evaluated
      .filter((entry) => !chosen.includes(entry))
      .map((entry) => ({
        taskId: entry.task.id,
        agentId: agent.id,
        civilizationId: civ.id,
        reasonCode: entry.ringBlocked
          ? 'price_ring'
          : !entry.eligible
            ? entry.probability < floor
              ? 'risk_above_comfort'
              : 'too_little_upside'
            : 'lower_priority',
        successProbability: entry.probability,
        expectedQuality: entry.quality,
        riskComfortFloor: floor,
        expectedReward: entry.task.reward,
        expectedValue: Math.round(entry.expectedValue),
        estimatedCost: entry.estimatedCost,
        expectedProfit: entry.expectedProfit,
        reputation: Math.round(entry.reputation * 100) / 100,
        competitors: entry.rivals,
        personalGoalId: goal.id,
        personalGoalLabel: goal.label,
        observedCompetitors: entry.observed,
        reasonFactors: entry.reasonFactors,
      }));

    return { bids, declines };
  }
}
