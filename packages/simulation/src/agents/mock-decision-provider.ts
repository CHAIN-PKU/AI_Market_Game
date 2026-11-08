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

/**
 * Deterministic heuristic agents — no LLM, fully reproducible.
 *
 * Personality is part of the decision rule (not flavour text):
 * - `riskTolerance` sets the success-probability floor below which a resident declines.
 * - `riskTolerance` also shades the bid price (cautious = higher margin, risk-taker = lower).
 * - `domainAffinity` weights expected value per task.
 * - `investAggression` is used later by the engine when deciding to buy a skill.
 */
export class MockAgentDecisionProvider implements AgentDecisionProvider {
  constructor(private opts: { marketDepth?: boolean } = {}) {}

  decideForCivilization(ctx: AgentDecisionContext): AgentDecision[] {
    const civ = ctx.getCivilization(ctx.civilizationId);
    if (!civ) return [];

    const openTasks = ctx.openTaskIds
      .map((id) => ctx.getTask(id))
      .filter((t): t is MarketTask => !!t && t.status === 'open');

    return civ.agents.map((agent) => this.decideForAgent(agent, civ, openTasks, ctx));
  }

  private decideForAgent(
    agent: AgentState,
    civ: CivilizationState,
    openTasks: MarketTask[],
    ctx: AgentDecisionContext
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
      const reputation =
        (agent.stats.tasksCompleted + 1) /
        (agent.stats.tasksCompleted + agent.stats.tasksFailed + 3);
      const estimatedCost = Math.round(
        task.reward * (0.3 + (1 - quality) * 0.15 + (1 - probability) * 0.05),
      );
      const expectedProfit = Math.round(quality * task.reward - estimatedCost);
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
        ? probability >= floor && expectedProfit >= 1
        : probability >= floor && expectedValue >= 25;
      return { task, quality, probability, expectedValue, observed, rivals, reputation, estimatedCost, expectedProfit, reasonFactors, eligible };
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
      };
    });

    const declines: BidDecline[] = evaluated
      .filter((entry) => !chosen.includes(entry))
      .map((entry) => ({
        taskId: entry.task.id,
        agentId: agent.id,
        civilizationId: civ.id,
        reasonCode: !entry.eligible
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
