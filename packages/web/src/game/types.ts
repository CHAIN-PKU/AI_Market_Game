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
  reasonCode: 'bid' | 'risk_above_comfort' | 'too_little_upside' | 'lower_priority';
  bidAmount: number | null;
  expectedQuality: number;
  successProbability: number;
  riskComfortFloor: number;
  expectedReward: number;
  expectedValue: number;
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
  publicRecord: { tasksCompleted: number; tasksFailed: number; grossEarnings: number; taxPaid: number };
  goal: { id: string; label: string; skillId: string | null; skillName: string | null; price: number | null };
  decision: DemoDecision;
  isFocus: boolean;
};

export type BidSummary = {
  agentId: string;
  displayName: string;
  bidAmount: number;
  expectedQuality: number;
  successProbability: number;
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
    reward: number;
    difficulty: number;
    minAbility: number;
    source: string;
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
