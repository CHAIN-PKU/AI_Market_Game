/** Walking skeleton layout — see docs/SCENE_DESIGN_v1.md */
export type BuildingKind =
  | 'market'
  | 'skill'
  | 'coding'
  | 'research'
  | 'design'
  | 'public-rd'
  | 'homes';

export type BuildingDef = {
  id: string;
  kind: BuildingKind;
  label: string;
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  body: string;
  roof: string;
  accent?: string;
};

export const BUILDINGS: BuildingDef[] = [
  {
    id: 'bld-market',
    kind: 'market',
    label: '任务市场',
    x: 0,
    z: -1,
    w: 3.2,
    d: 3.2,
    h: 2.5,
    body: '#f5f0e6',
    roof: '#f2d98a',
    accent: '#f4b942',
  },
  {
    id: 'bld-skill',
    kind: 'skill',
    label: 'Skill 商店',
    x: -4.5,
    z: 1,
    w: 3,
    d: 3,
    h: 2,
    body: '#a8dadc',
    roof: '#4ea8de',
  },
  {
    id: 'bld-code',
    kind: 'coding',
    label: 'Coding 工坊',
    x: 4.2,
    z: -4,
    w: 3,
    d: 4,
    h: 2,
    body: '#e8eef5',
    roof: '#4ea8de',
    accent: '#2c3e50',
  },
  {
    id: 'bld-research',
    kind: 'research',
    label: 'Research 实验室',
    x: -4,
    z: -4.5,
    w: 3,
    d: 3,
    h: 2,
    body: '#fff8e7',
    roof: '#9b8fd9',
  },
  {
    id: 'bld-design',
    kind: 'design',
    label: 'Design 工坊',
    x: 4.5,
    z: 4,
    w: 3,
    d: 3,
    h: 2,
    body: '#ffe8f0',
    roof: '#d4846a',
  },
  {
    id: 'bld-public-rd',
    kind: 'public-rd',
    label: '公共研发中心',
    x: -2,
    z: 4.8,
    w: 4,
    d: 3,
    h: 3,
    body: '#e0f2f1',
    roof: '#7cbfa0',
  },
  {
    id: 'bld-homes',
    kind: 'homes',
    label: '居民带',
    x: 5.5,
    z: 0.5,
    w: 2.8,
    d: 1.8,
    h: 1.5,
    body: '#c49a6c',
    roof: '#8b5e3c',
  },
];

export function agentRowPositions(count: number): { x: number; z: number }[] {
  const n = Math.min(count, 8);
  const arcR = 5.2;
  const centerZ = 3.8;
  return Array.from({ length: n }, (_, i) => {
    const t = n <= 1 ? 0.5 : i / (n - 1);
    const angle = Math.PI * 0.82 + t * Math.PI * 0.36;
    return {
      x: Math.cos(angle) * arcR,
      z: centerZ + Math.sin(angle) * 1.2,
    };
  });
}
