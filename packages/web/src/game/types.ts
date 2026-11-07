/** Shape of packages/web/src/demo/bid-demo.fixture.json (generated from the real engine). */

export type Role = 'Coding' | 'Research' | 'Design';

export type BidResult = {
  agentId: string;
  displayName: string;
  bidAmount: number;
  expectedQuality: number;
  successProbability: number;
  ability: number;
};

export type DemoAgent = {
  id: string;
  displayName: string;
  role: Role;
  specialty: 'coding' | 'research' | 'design';
  abilities: { coding: number; research: number; design: number };
  traits: { riskTolerance: number; investAggression: number; domainAffinity: Record<string, number> };
  walletBefore: number;
  walletAfter: number;
  skillsAfter: string[];
  bid: BidResult | null;
  expectedQuality: number;
  score: number;
  passed: boolean;
  passReason: string | null;
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
  agents: DemoAgent[];
  bids: BidResult[];
  winner: {
    agentId: string;
    displayName: string;
    bidAmount: number;
    completed: boolean;
    failed: boolean;
    quality: number | null;
  } | null;
  settlement: { gross: number; tax: number; net: number; walletBefore: number; walletAfter: number } | null;
  skillPurchase: { skillId: string; name: string; price: number; abilityBefore: number; abilityAfter: number }[];
  walletAfterRound: number | null;
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
