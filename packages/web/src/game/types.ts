/** Shape of packages/web/src/demo/bid-demo.fixture.json (v2, generated from the real engine). */

export type Role = 'Coding' | 'Research' | 'Design';

export type PersonalityId =
  | 'cautious'
  | 'bold'
  | 'steady'
  | 'pragmatic'
  | 'curious'
  | 'quiet'
  | 'balanced'
  | 'observer';

export type ReasonFactor = { key: string; label: string; value: number | string };

export type ObservedCompetitors = {
  strongerSpecialists: number;
  topEarnerName: string | null;
  topEarnerEarnings: number;
};

export type DemoDecision = {
  action: 'bid' | 'pass';
  reasonCode: 'bid' | 'risk_above_comfort' | 'too_little_upside' | 'lower_priority' | 'price_ring';
  bidAmount: number | null;
  expectedQuality: number;
  successProbability: number;
  riskComfortFloor: number;
  expectedReward: number;
  expectedValue: number;
  estimatedCost?: number;
  expectedProfit?: number;
  reputation?: number;
  competitors?: number;
  reasonFactors: ReasonFactor[];
  observedCompetitors: ObservedCompetitors;
  personalGoal: { id: string; label: string };
  result: 'won' | 'lost' | 'passed' | 'failed';
  reaction: 'glad' | 'wary' | 'reflective' | 'neutral' | 'worried';
};

export type DemoAgent = {
  id: string;
  displayName: string;
  role: Role;
  specialty: 'coding' | 'research' | 'design';
  personality: PersonalityId;
  personalityLabel: string;
  personalityBlurb: string;
  strategy: '激进抢单' | '稳健报价' | '合作优先';
  traits: {
    riskTolerance: number;
    investAggression: number;
    cooperationPreference: number;
    domainAffinity: Record<string, number>;
  };
  abilities: { coding: number; research: number; design: number };
  walletBefore: number;
  walletAfter: number;
  skillsAfter: { id: string; name: string }[];
  publicRecord: { tasksCompleted: number; tasksFailed: number; grossEarnings: number; taxPaid: number; ringDefections?: number };
  goal: { id: string; label: string; skillId: string | null; skillName: string | null; price: number | null };
  decision: DemoDecision;
  isFocus: boolean;
  busyUntilRound?: number;
};

export type BidSummary = {
  agentId: string;
  displayName: string;
  bidAmount: number;
  expectedQuality: number;
  successProbability: number;
  estimatedCost?: number;
  expectedProfit?: number;
  reputation?: number;
  competitors?: number;
  teamAgentIds?: string[];
  teamQuality?: number;
  teamProbability?: number;
  teamCost?: number;
  teamProfit?: number;
  ringAgentIds?: string[];
  ringDefected?: boolean;
  personalGoalLabel: string;
  reasonFactors: ReasonFactor[];
};

export type RawEvent = {
  id: string;
  round: number;
  kind: string;
  message: string;
  payload: Record<string, unknown> | null;
};

export type BidDemoFixture = {
  version: number;
  generatedBy: string;
  seed: number;
  tasksPerRound: number;
  warmupRounds: number;
  demoRound: number;
  initialAbility: number;
  scenario: {
    taskId: string;
    title: string;
    titleEn: string;
    domain: 'coding' | 'research' | 'design';
    domainLabel: string;
    description: string;
    reward: number;
    difficulty: number;
    minAbility: number;
    source: string;
    durationRounds?: number;
  };
  civilization: {
    id: string;
    name: string;
    rules: {
      name: string;
      taxRate: number;
      publicResearchShare: number;
      skillOwnership: string;
      allowFreeHire: boolean;
      allowCollaboration: boolean;
    };
    treasuryStart: number;
    treasuryAfter: number;
  };
  /** 中标之后的投资进化：服务端用引擎算的（/api/demo/round 返回），不是前端预置 */
  evolution?: EvolutionSummary;
  /** A 模式：引擎真跑的一轮双文明同场抢单，见 scripts/add-a-mode-demo.mjs */
  aMode?: {
    generatedBy: string;
    seed: number;
    round: number;
    civilizations: { id: string; name: string; rules: string; taxRate: number; treasury: number; agents: number }[];
    tasksPlayed: number;
    bidsByCiv: { civId: string; name: string; bids: number }[];
    winners: {
      taskId: string;
      title: string;
      reward: number;
      winnerAgentId: string | null;
      winnerName: string | null;
      winnerCivId: string | null;
      winningBid: number | null;
      status: string;
    }[];
    wonByRival: number;
    wonByHome: number;
  };
  /** 对手文明（多人对抗的第一块地基）：数据由引擎跑出，见 scripts/add-rival-demo.mjs */
  rival?: {
    id: string;
    name: string;
    rules: {
      name: string;
      taxRate: number;
      publicResearchShare: number;
      skillOwnership: string;
      allowFreeHire: boolean;
      allowCollaboration: boolean;
    };
    treasuryStart: number;
    treasuryAfter: number;
    generatedBy?: string;
    bids: BidSummary[];
    crossCiv?: {
      rule: string;
      scores: { who: string; civ: string; civId: string; amount: number; quality: number; score: number }[];
      winner: { who: string; civ: string; civId: string; amount: number; score: number } | null;
      rivalLost: boolean;
    };
  };
  treasuryBreakdown: {
    start: number;
    end: number;
    delta: number;
    mainTaskTax: number;
    otherTaskTax: number;
    totalTax: number;
    publicResearch: number;
    toTreasury: number;
    completedTasks: number;
    consistent: boolean;
  };
  focusAgentIds: string[];
  agents: DemoAgent[];
  bids: BidSummary[];
  declines: { agentId: string; reasonCode: string }[];
  winner: {
    agentId: string;
    displayName: string;
    bidAmount: number;
    completed: boolean;
    failed: boolean;
    quality: number | null;
    teamAgentIds?: string[];
  } | null;
  settlement: { gross: number; tax: number; net: number; walletBefore: number; walletAfter: number } | null;
  skillPurchase: { skillId: string; name: string; price: number; abilityBefore: number | null; abilityAfter: number | null }[];
  nextRound: {
    domain: string;
    abilityBefore: number | null;
    abilityAfter: number | null;
    successBefore: number | null;
    successAfter: number | null;
  };
  otherTasks: { id: string; title: string; domain: string; reward: number; status: string; winnerName: string | null }[];
  rawEvents: RawEvent[];
};

export const ROLE_KEY: Record<Role, 'coding' | 'research' | 'design'> = {
  Coding: 'coding',
  Research: 'research',
  Design: 'design',
};

export const ROLE_LABEL: Record<Role, string> = {
  Coding: '写程序',
  Research: '做研究',
  Design: '做设计',
};

export const DOMAIN_LABEL: Record<string, string> = {
  coding: '写程序',
  research: '做研究',
  design: '做设计',
};

export const PERSONALITY_TONE: Record<PersonalityId, string> = {
  cautious: '谨慎',
  bold: '积极',
  steady: '稳健',
  pragmatic: '务实',
  curious: '好奇',
  quiet: '低调',
  balanced: '平衡',
  observer: '观察',
};

export type RoundHistory = {
  round: number;
  domain: string;
  title: string;
  winner: string | null;
  failed?: boolean;
  bid: number | null;
  tax: number | null;
  net: number | null;
  skill: string | null;
  abilityBefore?: number | null;
  abilityAfter?: number | null;
  walletAfter?: number | null;
  incomes?: { name: string; net: number }[];
  treasuryAfter: number;
  teams?: number;
  rings?: number;
  reports?: number;
  defections?: number;
  bids?: number;
  spread?: number;
};

export type RuleCompare = {
  /** 改规则前后每个居民的决策差异（审查要求解释「为什么变」） */
  decisions?: { name: string; before: string; after: string; changed: boolean }[];
  /** 谁在这次改规则后获得了新技能 */
  newSkills?: { name: string; skill: string }[];
  /** 制度对照的资金去向分解（私人投资 vs 公共研发池） */
  money?: {
    beforePrivate: number;
    afterPrivate: number;
    beforePublic: number;
    afterPublic: number;
    beforeToTreasury: number;
    afterToTreasury: number;
    beforeTax: number;
    afterTax: number;
  };
  beforeWinner: string;
  afterWinner: string;
  beforeNet: number | null;
  afterNet: number | null;
  beforeSkill: string | null;
  afterSkill: string | null;
  beforeTax: number;
  afterTax: number;
  beforeAbility: number | null;
  afterAbility: number | null;
  beforeTeams?: number;
  afterTeams?: number;
  beforeRings?: number;
  afterRings?: number;
  beforeReports?: number;
  afterReports?: number;
  beforeBids?: number;
  afterBids?: number;
  beforeSpread?: number;
  afterSpread?: number;
};

export type ExperimentStats = {
  rounds: number;
  wins: number;
  totalNet: number;
  totalTax: number;
  avgWinningBid: number;
  teamBids: number;
  ringBids: number;
  reports: number;
  defections: number;
  skills: number;
  treasuryEnd: number;
  gini: number;
  uniqueWinners: number;
};

export type ExperimentReport = {
  seed: number;
  maxRounds: number;
  a: { rules: { name: string; taxRate: number }; stats: ExperimentStats };
  b: { rules: { name: string; taxRate: number }; stats: ExperimentStats };
};

export type EvolutionSummary = {
  agentId: string;
  displayName: string;
  domain: string;
  reason: string;
  taskTitle: string;
  taskReward: number;
  bidAmount: number;
  walletBefore: number;
  taxPaid: number;
  trainingCost: number;
  trainingBonus: number;
  walletAfter: number;
  abilityBefore: number;
  abilityAfter: number;
  successBefore: number;
  successAfter: number;
  cheapestSkillPrice: number;
  shortfallToSkill: number;
  civLean: Record<string, number>;
};
