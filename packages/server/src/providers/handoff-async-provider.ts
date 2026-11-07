import type { AsyncAgentDecisionProvider, AgentDecisionTrace } from '@ai-civ/simulation';
import type { AgentDecision, AgentDecisionContext } from '@ai-civ/simulation';

/** Uses decisions pre-submitted by Cursor Agent via handoff API / cursor:play script. */
export class HandoffAsyncAgentDecisionProvider implements AsyncAgentDecisionProvider {
  readonly label = 'handoff';

  constructor(
    private getDecisions: (civilizationId: string) => AgentDecision[] | undefined,
    private getReasoning: (agentId: string) => string | undefined,
  ) {}

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
    const preset = this.getDecisions(ctx.civilizationId);
    if (!preset || !civ) {
      throw new HandoffPendingError(ctx.civilizationId);
    }

    const traces: AgentDecisionTrace[] = civ.agents.map((a, i) => ({
      agentId: a.id,
      source: 'llm',
      reasoning: this.getReasoning(a.id) ?? preset[i] ? 'Cursor Agent（Handoff）' : undefined,
    }));

    return { decisions: preset, traces, apiCalls: 0 };
  }
}

export class HandoffPendingError extends Error {
  constructor(public civilizationId: string) {
    super(`Awaiting Cursor Agent handoff for ${civilizationId}`);
    this.name = 'HandoffPendingError';
  }
}
