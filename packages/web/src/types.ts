export interface CivilizationRules {
  name: string;
  taxRate: number;
  publicResearchShare: number;
  skillOwnership: string;
}

export interface GameMeta {
  agentMode: string;
  playerBrainLabel: string;
  liveAgentBrain: boolean;
  needsCursorKey?: boolean;
  cursorConfigured: boolean;
  cursorModel: string | null;
  /** Cursor per-civilization run timeout (ms); mirrors server AI_CIV_CURSOR_TIMEOUT_MS. */
  cursorTimeoutMs: number;
  /** POST /advance client timeout hint (ms): ~2× cursorTimeout + buffer in cursor mode. */
  advancePostTimeoutMs: number;
  llmConfigured: boolean;
  llmModel: string | null;
  hint: string;
}

export interface AgentState {
  id: string;
  civilizationId: string;
  displayName: string;
  wallet: number;
  abilities: { coding: number; research: number; design: number };
  skills: { skillId: string }[];
  stats: {
    tasksCompleted: number;
    tasksFailed: number;
  };
}

export interface CivilizationState {
  id: string;
  displayName: string;
  rules: CivilizationRules;
  treasury: number;
  publicResearchPool: number;
  sharedSkillIds: string[];
  agents: AgentState[];
}

export interface GameEvent {
  id: string;
  round: number;
  kind: string;
  message: string;
  payload?: Record<string, unknown>;
}

export interface GameState {
  round: number;
  config: { totalRounds: number };
  civilizations: CivilizationState[];
  events: GameEvent[];
  metricsByCiv: Record<
    string,
    { totalGrossOutput: number; tasksSucceeded: number; tasksFailed: number }
  >;
}

export interface AgentTrace {
  agentId: string;
  source: 'mock' | 'llm' | 'cursor' | 'practice';
  reasoning?: string;
}
