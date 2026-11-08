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
  /** Target height in world units; assetScale.ts converts it to a model scale. */
  height: number;
};

/** Island / diorama dimensions (world units). */
export const ISLAND = {
  grassRadius: 11.5,
  /** Visible soil thickness so the map reads as a table-top model. */
  grassHeight: 1.4,
  waterRadius: 18,
  waterY: -1.3,
  plazaInner: 5.6,
  plazaOuter: 7.4,
} as const;

/** Default camera — identical for scheme A and B. */
export const LAB_CAMERA = {
  position: [0, 19, 25] as [number, number, number],
  fov: 45,
  target: [0, 1, 0] as [number, number, number],
};

export type ViewPreset = 'default' | 'topdown' | 'closeup';

/** Reproducible camera presets for the six acceptance screenshots. */
export const VIEW_PRESETS: Record<ViewPreset, { position: [number, number, number]; target: [number, number, number] }> = {
  default: { position: [0, 19, 25], target: [0, 1, 0] },
  topdown: { position: [0, 36, 0.01], target: [0, 0, 0] },
  closeup: { position: [0, 5.5, 9.5], target: [0, 1.1, 2.2] },
};

export const ORBIT_LIMITS = {
  minDistance: 10,
  maxDistance: 42,
  minPolarAngle: 0.18,
  maxPolarAngle: Math.PI / 2.15,
};

/** Rotation that makes a +Z-facing model look at the island center. */
function facingCenter(x: number, z: number): number {
  return Math.atan2(-x, -z);
}

function building(
  id: string,
  role: BuildingRole,
  label: string,
  x: number,
  z: number,
  rotationY?: number
): BuildingSlot {
  return {
    id,
    role,
    label,
    position: [x, 0, z],
    rotationY: rotationY ?? facingCenter(x, z),
  };
}

/** Seven building slots on a ring (radius ≈ 9) around the central plaza. */
export const BUILDING_SLOTS: BuildingSlot[] = [
  building('b-market', 'market', '市集广场', -3.7, -8.6),
  building('b-skill', 'skill', '技能铺', -7.3, -5.2),
  building('b-code', 'coding', '程序坊', 7.3, -5.2),
  building('b-research', 'research', '研究所', -9.1, 1.6),
  building('b-design', 'design', '设计屋', 9.1, 1.6),
  building('b-rd', 'public-rd', '公研仓', -6.0, 7.6),
  building('b-homes', 'homes', '居民里', 6.0, 7.6),
];

const AGENT_RING = 3.6;
const AGENT_FACING = [0.15, -0.1, 0.05, 0.2, -0.15, 0.1, -0.05, 0.18];

const AGENT_NAMES: AgentSlot['displayName'][] = [
  'Helix',
  'Nova',
  'Pixel',
  'Quill',
  'Sage',
  'Mosaic',
  'Ledger',
  'Ember',
];
const AGENT_JOBS: AgentSlot['job'][] = ['写程序', '做研究', '做设计'];

/** Eight residents in a loose ring on the plaza, facing the default camera. */
export const AGENT_SLOTS: AgentSlot[] = AGENT_NAMES.map((displayName, i) => {
  const angle = ((22.5 + i * 45) * Math.PI) / 180;
  return {
    id: `a${i + 1}`,
    displayName,
    job: AGENT_JOBS[i % AGENT_JOBS.length],
    position: [Math.sin(angle) * AGENT_RING, 0, Math.cos(angle) * AGENT_RING],
    rotationY: AGENT_FACING[i],
  };
});

const TREE_ANGLES = [10, 70, 150, 190, 250, 310];
const TREE_HEIGHTS = [2.8, 2.2, 3.2, 2.5, 2.0, 2.9];

/** Trees on the outer grass ring, in the gaps between buildings. */
export const TREE_SLOTS: TreeSlot[] = TREE_ANGLES.map((deg, i) => {
  const angle = (deg * Math.PI) / 180;
  return {
    position: [Math.sin(angle) * 10.9, 0, Math.cos(angle) * 10.9],
    rotationY: angle + i * 0.4,
    height: TREE_HEIGHTS[i],
  };
});

/** Quaternius-only rock props. */
export const ROCK_SLOTS: { position: [number, number, number]; rotationY: number }[] = [
  { position: [9.8, 0, -5.2], rotationY: 0.4 },
  { position: [-9.5, 0, 5.0], rotationY: 1.2 },
  { position: [8.6, 0, 6.8], rotationY: 2.4 },
];
