/** Shared layout for Kenney vs Quaternius A/B — same slots, same camera presets. */

export type BuildingRole =
  | 'market'
  | 'skill'
  | 'coding'
  | 'research'
  | 'design'
  | 'public-rd'
  | 'homes';

export type BuildingSlot = {
  id: string;
  role: BuildingRole;
  label: string;
  position: [number, number, number];
  rotationY: number;
};

export type AgentSlot = {
  id: string;
  displayName: string;
  job: '写程序' | '做研究' | '做设计';
  position: [number, number, number];
  rotationY: number;
};

export type TreeSlot = {
  position: [number, number, number];
  rotationY: number;
  scale: number;
};

/** Default screenshot camera — identical for scheme A and B. */
export const LAB_CAMERA = {
  position: [0, 22, 26] as [number, number, number],
  fov: 48,
  target: [0, 0.4, 0] as [number, number, number],
};

export const ORBIT_LIMITS = {
  minDistance: 14,
  maxDistance: 32,
  minPolarAngle: 0.28,
  maxPolarAngle: Math.PI / 2.12,
};

export const BUILDING_SLOTS: BuildingSlot[] = [
  { id: 'b-market', role: 'market', label: '市集广场', position: [0, 0, -5.5], rotationY: 0 },
  { id: 'b-skill', role: 'skill', label: '技能铺', position: [-5, 0, -2], rotationY: Math.PI / 2 },
  { id: 'b-code', role: 'coding', label: '程序坊', position: [5.5, 0, -2.5], rotationY: -Math.PI / 2 },
  { id: 'b-research', role: 'research', label: '研究所', position: [-6, 0, 4], rotationY: Math.PI / 3 },
  { id: 'b-design', role: 'design', label: '设计屋', position: [6, 0, 3.5], rotationY: -Math.PI / 3 },
  { id: 'b-rd', role: 'public-rd', label: '公研仓', position: [-2.5, 0, 6.5], rotationY: Math.PI },
  { id: 'b-homes', role: 'homes', label: '居民里', position: [3, 0, 7], rotationY: Math.PI * 1.05 },
];

export const AGENT_SLOTS: AgentSlot[] = [
  { id: 'a1', displayName: 'Helix', job: '写程序', position: [-4.2, 0, 1.2], rotationY: -0.4 },
  { id: 'a2', displayName: 'Nova', job: '做研究', position: [-3, 0, 2.1], rotationY: -0.2 },
  { id: 'a3', displayName: 'Pixel', job: '做设计', position: [-1.8, 0, 2.6], rotationY: 0 },
  { id: 'a4', displayName: 'Quill', job: '写程序', position: [-0.4, 0, 2.8], rotationY: 0.15 },
  { id: 'a5', displayName: 'Sage', job: '做研究', position: [1, 0, 2.7], rotationY: 0.3 },
  { id: 'a6', displayName: 'Mosaic', job: '做设计', position: [2.4, 0, 2.2], rotationY: 0.45 },
  { id: 'a7', displayName: 'Ledger', job: '写程序', position: [3.6, 0, 1.4], rotationY: 0.6 },
  { id: 'a8', displayName: 'Ember', job: '做研究', position: [4.5, 0, 0.3], rotationY: 0.8 },
];

export const TREE_SLOTS: TreeSlot[] = [
  { position: [-9, 0, -6], rotationY: 0.2, scale: 1.1 },
  { position: [9, 0, -5], rotationY: -0.5, scale: 1 },
  { position: [-8.5, 0, 7], rotationY: 1, scale: 1.15 },
  { position: [8, 0, 8], rotationY: 2, scale: 0.95 },
  { position: [-10, 0, 2], rotationY: 0.7, scale: 1.05 },
  { position: [10, 0, 1], rotationY: -1, scale: 1.1 },
];
