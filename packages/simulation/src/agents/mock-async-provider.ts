import { MockAgentDecisionProvider } from './mock-decision-provider.js';
import { buildPracticeReasoning } from './practice-reasoning.js';
import type { AsyncAgentDecisionProvider, AgentDecisionTrace } from './async-types.js';
import type { AgentDecisionContext } from './types.js';
import type { MarketTask } from '../core/types.js';

export class MockAsyncAgentDecisionProvider implements AsyncAgentDecisionProvider {
  readonly label = 'practice';
  private inner = new MockAgentDecisionProvider();

  async decideForCivilization(ctx: AgentDecisionContext) {
    return this.inner.decideForCivilization(ctx);
  }

  async decideWithTrace(ctx: AgentDecisionContext): Promise<{
    decisions: Awaited<ReturnType<MockAgentDecisionProvider['decideForCivilization']>>;
    traces: AgentDecisionTrace[];
    apiCalls: number;
  }> {
    const civ = ctx.getCivilization(ctx.civilizationId);
    const decisions = this.inner.decideForCivilization(ctx);
    const traces: AgentDecisionTrace[] = [];

    if (!civ) {
      return { decisions, traces, apiCalls: 0 };
    }

    const taskById = new Map<string, MarketTask>();
    for (const id of ctx.openTaskIds) {
      const t = ctx.getTask(id);
      if (t) taskById.set(id, t);
    }

    for (let i = 0; i < civ.agents.length; i += 1) {
      const agent = civ.agents[i]!;
      const decision = decisions[i];
      const firstBid = decision?.bids[0];
      let reasoning: string | undefined;
      if (firstBid) {
        const task = taskById.get(firstBid.taskId);
        if (task) {
          const partner = civ.agents[(i + 1) % civ.agents.length];
          const sameTask =
            partner &&
            decisions[(i + 1) % civ.agents.length]?.bids.some((b) => b.taskId === firstBid.taskId);
          reasoning = buildPracticeReasoning(agent, civ, task, {
            bidAmount: firstBid.bidAmount,
            partnerName: sameTask && ctx.rng() > 0.45 ? partner!.displayName : undefined,
          });
        }
      }
      traces.push({
        agentId: agent.id,
        source: 'practice',
        reasoning:
          reasoning ??
          `【${agent.displayName}】今天市集人太多，我先观望…（练习模式：配置 CURSOR_API_KEY 可看真实 Agent 思考）`,
      });
    }

    return { decisions, traces, apiCalls: 0 };
  }
}
