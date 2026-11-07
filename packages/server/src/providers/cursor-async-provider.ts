import type { AsyncAgentDecisionProvider, AgentDecisionTrace } from '@ai-civ/simulation';
import type { AgentDecision, AgentDecisionContext } from '@ai-civ/simulation';
import { decideCivilizationWithCursor, type CursorBrainConfig } from '../cursor/cursor-sdk-brain.js';

export type CursorProviderHooks = {
  onCivilizationStart?: (civilizationId: string) => void;
  onCivilizationDone?: (civilizationId: string, ok: boolean, error?: string) => void;
};

export class CursorAsyncAgentDecisionProvider implements AsyncAgentDecisionProvider {
  readonly label = 'cursor';
  totalApiCalls = 0;

  constructor(
    private config: CursorBrainConfig,
    private hooks?: CursorProviderHooks,
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
    const civId = ctx.civilizationId;
    this.hooks?.onCivilizationStart?.(civId);
    try {
      const r = await decideCivilizationWithCursor(ctx, this.config);
      this.totalApiCalls += r.apiCalls;
      this.hooks?.onCivilizationDone?.(civId, true);
      return { decisions: r.decisions, traces: r.traces, apiCalls: r.apiCalls };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.hooks?.onCivilizationDone?.(civId, false, msg);
      throw e;
    }
  }
}
