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
      const affinity = agent.traits.domainAffinity[task.requirements.domain];
      const expectedValue = quality * task.reward * (1 + affinity);
      const reasonFactors = buildReasonFactors({
        agent,
        successProbability: probability,
        riskComfortFloor: floor,
        expectedReward: task.reward,
        expectedValue,
        goal,
        observed,
      });
      const eligible = probability >= floor && expectedValue >= 25;
      return { task, quality, probability, expectedValue, observed, reasonFactors, eligible };
    });

    const eligible = evaluated
      .filter((entry) => entry.eligible)
      .sort((a, b) => b.expectedValue - a.expectedValue);

    const chosen = eligible.slice(0, 2);
    const bids: Bid[] = chosen.map((entry) => {
      const priceFactor = bidPriceFactor(agent, { savingForSkill: goal.id === 'save_for_skill' }, ctx.rng);
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
        personalGoalId: goal.id,
        personalGoalLabel: goal.label,
        observedCompetitors: entry.observed,
        reasonFactors: entry.reasonFactors,
      }));

    return { bids, declines };
  }
}
