import type {
  AgentState,
  CivilizationRules,
  CivilizationState,
  GameState,
  SimulationConfig,
  TaskDomain,
} from './types.js';

const AGENT_NAMES = [
  'Astra',
  'Boreal',
  'Cinder',
  'Delta',
  'Echo',
  'Flux',
  'Grove',
  'Helix',
  'Ion',
  'Jade',
  'Kite',
  'Lumen',
  'Mira',
  'Nova',
  'Orin',
  'Pax',
];

export const DEFAULT_CONFIG: SimulationConfig = {
  seed: 42,
  totalRounds: 30,
  agentsPerCivilization: 8,
  initialTreasury: 1000,
  initialAgentAbility: 35,
  tasksPerRound: 6,
  competitionInterval: 10,
};

export function createFreeMarketRules(name = 'Free Market'): CivilizationRules {
  return {
    name,
    taxRate: 0.08,
    publicResearchShare: 0.1,
    skillOwnership: 'private',
    allowFreeHire: true,
    allowCollaboration: true,
  };
}

export function createPublicResearchRules(name = 'Public R&D'): CivilizationRules {
  return {
    name,
    taxRate: 0.22,
    publicResearchShare: 0.65,
    skillOwnership: 'shared',
    allowFreeHire: false,
    allowCollaboration: true,
  };
}

const SPECIALTY_CYCLE: TaskDomain[] = ['coding', 'research', 'design'];

function abilityTriple(
  specialty: TaskDomain,
  base: number,
  index: number,
): { coding: number; research: number; design: number } {
  const high = base + 12 + (index % 3);
  const mid = base + (index % 4);
  const low = base - 6 - (index % 2);
  const triple = { coding: mid, research: mid, design: mid };
  triple[specialty] = high;
  const others = SPECIALTY_CYCLE.filter((d) => d !== specialty);
  triple[others[0]!] = mid;
  triple[others[1]!] = low;
  return triple;
}

function agentDisplayName(civilizationId: string, index: number): string {
  const offset = civilizationId === 'civ-b' ? 4 : 0;
  return AGENT_NAMES[(index + offset) % AGENT_NAMES.length]!;
}

function createAgent(civilizationId: string, index: number, initialAbility: number): AgentState {
  const specialty = SPECIALTY_CYCLE[index % 3]!;
  const abilities = abilityTriple(specialty, initialAbility, index);
  const aff = { coding: 0.15, research: 0.15, design: 0.15 };
  aff[specialty] = 0.55;

  return {
    id: `${civilizationId}-agent-${index}`,
    civilizationId,
    displayName: agentDisplayName(civilizationId, index),
    wallet: 0,
    abilities,
    skills: [],
    traits: {
      riskTolerance: 0.3 + (index % 5) * 0.12,
      investAggression: 0.25 + (index % 4) * 0.15,
      domainAffinity: aff,
    },
    stats: {
      tasksCompleted: 0,
      tasksFailed: 0,
      grossEarnings: 0,
      taxPaid: 0,
      skillSpend: 0,
    },
  };
}

export function createCivilization(
  id: string,
  displayName: string,
  rules: CivilizationRules,
  config: SimulationConfig,
): CivilizationState {
  const agents = Array.from({ length: config.agentsPerCivilization }, (_, i) =>
    createAgent(id, i, config.initialAgentAbility),
  );
  return {
    id,
    displayName,
    rules,
    treasury: config.initialTreasury,
    publicResearchPool: 0,
    sharedSkillIds: [],
    agents,
  };
}

export function createDualCivilizationGame(
  config: Partial<SimulationConfig> = {},
  rulesA = createFreeMarketRules(),
  rulesB = createPublicResearchRules(),
): GameState {
  const merged: SimulationConfig = { ...DEFAULT_CONFIG, ...config };
  const civA = createCivilization('civ-a', 'Civilization A', rulesA, merged);
  const civB = createCivilization('civ-b', 'Civilization B', rulesB, merged);

  return {
    config: merged,
    round: 0,
    civilizations: [civA, civB],
    marketTasks: [],
    events: [],
    rngState: merged.seed,
    metricsByCiv: {
      [civA.id]: emptyMetrics(),
      [civB.id]: emptyMetrics(),
    },
  };
}

function emptyMetrics() {
  return {
    totalGrossOutput: 0,
    tasksSucceeded: 0,
    tasksFailed: 0,
    avgAbility: { coding: 0, research: 0, design: 0 },
    giniWealth: 0,
    skillPurchases: 0,
  };
}
