import type { AsyncAgentDecisionProvider, AgentDecisionTrace } from './async-types.js';
import type { AgentDecision, AgentDecisionContext } from './types.js';
import { LlmAgentDecisionProvider } from './llm-agent-decision-provider.js';
import { MockAgentDecisionProvider } from './mock-decision-provider.js';

export interface HybridAsyncOptions {
  llmAgentCountPerCiv: number;
}

/** LLM for first N residents per civ; others use mock (cost control). */
export class HybridAsyncAgentDecisionProvider implements AsyncAgentDecisionProvider {
  readonly label = 'hybrid';
  private mock = new MockAgentDecisionProvider();

  constructor(
    private llm: LlmAgentDecisionProvider,
    private options: HybridAsyncOptions = { llmAgentCountPerCiv: 2 },
  ) {}

  get apiCalls(): number {
    return this.llm.apiCalls;
  }

  async decideForCivilization(ctx: AgentDecisionContext): Promise<AgentDecision[]> {
    const r = await this.decideWithTrace(ctx);
    return r.decisions;
  }

  async decideWithTrace(ctx: AgentDecisionContext): Promise<{
    decisions: AgentDecision[];
    traces: AgentDecisionTrace[];
    apiCalls: number;
  }> {
    const civ = ctx.getCivilization(ctx.civilizationId);
    if (!civ) return { decisions: [], traces: [], apiCalls: 0 };

    const llmResult = await this.llm.decideWithTrace(ctx);
    const mockDecisions = this.mock.decideForCivilization(ctx);

    const n = this.options.llmAgentCountPerCiv;
    const decisions = civ.agents.map((_agent, index) => {
      if (index < n) return llmResult.decisions[index] ?? { bids: [] };
      return mockDecisions[index] ?? { bids: [] };
    });

    const traces: AgentDecisionTrace[] = civ.agents.map((agent, index) => {
      if (index < n) {
        const t = llmResult.traces.find((x) => x.agentId === agent.id);
        return t ?? { agentId: agent.id, source: 'llm' };
      }
      return { agentId: agent.id, source: 'mock' };
    });

    return { decisions, traces, apiCalls: llmResult.apiCalls };
  }
}
