/** Task domains supported in MVP phase 1. */
export type TaskDomain = 'coding' | 'research' | 'design';

export interface Abilities {
  coding: number;
  research: number;
  design: number;
}

export type SkillOwnership = 'private' | 'shared';

export interface CivilizationRules {
  name: string;
  /** Fraction of gross task payout taken as tax (0–1). */
  taxRate: number;
  /** Share of tax routed to public R&D pool (0–1). */
  publicResearchShare: number;
  skillOwnership: SkillOwnership;
  allowFreeHire: boolean;
  allowCollaboration: boolean;
}

export interface AgentTraits {
  riskTolerance: number;
  investAggression: number;
  /** Reserved for future collaboration mechanics; not used in MVP decisions. */
  cooperationPreference?: number;
  /** Preferred domain for tie-breaking (0–1 weights). */
  domainAffinity: Record<TaskDomain, number>;
}

export interface OwnedSkill {
  skillId: string;
  purchasedAtRound: number;
}

export interface AgentState {
  id: string;
  civilizationId: string;
  displayName: string;
  wallet: number;
  abilities: Abilities;
  skills: OwnedSkill[];
  /** Round until which this agent is occupied by an assigned task (0 = free). */
  busyUntilRound?: number;
  traits: AgentTraits;
  /** Lifetime stats for reporting. */
  stats: {
    tasksCompleted: number;
    tasksFailed: number;
    grossEarnings: number;
    taxPaid: number;
    skillSpend: number;
  };
}

export interface CivilizationState {
  id: string;
  displayName: string;
  rules: CivilizationRules;
  treasury: number;
  publicResearchPool: number;
  /** Shared skill ids when skillOwnership === 'shared'. */
  sharedSkillIds: string[];
  agents: AgentState[];
}

export type TaskStatus = 'open' | 'assigned' | 'completed' | 'failed';

export interface TaskRequirements {
  domain: TaskDomain;
  minAbility: number;
  difficulty: number;
}

export interface MarketTask {
  id: string;
  roundCreated: number;
  title: string;
  requirements: TaskRequirements;
  reward: number;
  deadlineRound: number;
  status: TaskStatus;
  source?: 'system' | 'player';
  playerTitle?: string;
  durationRounds?: number;
  assignedRound?: number;
  assignedAgentId?: string;
  assignedCivilizationId?: string;
  assignedTeamIds?: string[];
  winningBid?: number;
}

export type GameEventKind =
  | 'round_started'
  | 'task_posted'
  | 'bid_placed'
  | 'bid_declined'
  | 'task_assigned'
  | 'team_formed'
  | 'team_settled'
  | 'task_completed'
  | 'task_failed'
  | 'tax_collected'
  | 'skill_purchased'
  | 'skill_shared'
  | 'competition_checkpoint'
  | 'rules_updated'
  | 'story'
  | 'simulation_finished';

export interface GameEvent {
  id: string;
  round: number;
  kind: GameEventKind;
  message: string;
  payload?: Record<string, unknown>;
}

export interface SimulationConfig {
  seed: number;
  totalRounds: number;
  agentsPerCivilization: number;
  initialTreasury: number;
  initialAgentAbility: number;
  tasksPerRound: number;
  competitionInterval: number;
}

export interface SimulationMetrics {
  totalGrossOutput: number;
  tasksSucceeded: number;
  tasksFailed: number;
  avgAbility: Abilities;
  giniWealth: number;
  skillPurchases: number;
}

export interface GameState {
  config: SimulationConfig;
  round: number;
  civilizations: CivilizationState[];
  marketTasks: MarketTask[];
  events: GameEvent[];
  rngState: number;
  metricsByCiv: Record<string, SimulationMetrics>;
}
