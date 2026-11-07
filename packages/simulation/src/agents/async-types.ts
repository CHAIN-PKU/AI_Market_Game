import type { AgentDecision, AgentDecisionContext } from './types.js';

export interface AsyncAgentDecisionProvider {
  readonly label: string;
  decideForCivilization(ctx: AgentDecisionContext): Promise<AgentDecision[]>;
}

export interface AgentDecisionTrace {
  agentId: string;
  source: 'mock' | 'llm' | 'cursor' | 'practice';
  reasoning?: string;
}
