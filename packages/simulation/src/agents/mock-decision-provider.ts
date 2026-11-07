import type { AgentDecision, AgentDecisionContext, AgentDecisionProvider } from './types.js';
import { agentExpectedQuality } from '../market/bidding.js';
import type { AgentState, CivilizationState, MarketTask } from '../core/types.js';

/** Deterministic heuristic agent — no LLM, fully reproducible. */
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
    ctx: AgentDecisionContext,
  ): AgentDecision {
    const bids = openTasks
      .map((task) => {
        const quality = agentExpectedQuality(agent, civ, task);
        const domainBoost = agent.traits.domainAffinity[task.requirements.domain];
        const score = quality * task.reward * (1 + domainBoost);
        if (score < 25) return undefined;
        const bidAmount = Math.round(task.reward * (0.72 + ctx.rng() * 0.18));
        return {
          taskId: task.id,
          agentId: agent.id,
          civilizationId: civ.id,
          bidAmount,
          expectedQuality: quality,
        };
      })
      .filter((b): b is NonNullable<typeof b> => !!b)
      .slice(0, 2);

    return { bids };
  }
}
