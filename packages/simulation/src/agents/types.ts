import type { Bid } from '../market/bidding.js';

export interface AgentDecision {
  bids: Bid[];
  /** Skill id to buy after work phase, if affordable. */
  skillPurchaseId?: string;
}

export interface AgentDecisionProvider {
  decideForCivilization(input: AgentDecisionContext): AgentDecision[];
}

export interface AgentDecisionContext {
  round: number;
  civilizationId: string;
  /** Open tasks in shared market this round. */
  openTaskIds: string[];
  /** Lookup helpers passed from engine to avoid circular deps. */
  getTask: (id: string) => import('../core/types.js').MarketTask | undefined;
  getAgent: (id: string) => import('../core/types.js').AgentState | undefined;
  getCivilization: (id: string) => import('../core/types.js').CivilizationState | undefined;
  rng: () => number;
}
