/**
 * Local paths (after `node scripts/fetch-visual-lab-assets.mjs`) with CDN fallbacks for offline dev.
 * Models: Kenney CC0 via tge-assets; Quaternius CC0 via quaternius.com (mirrored in treehouse / showcase).
 */

import type { AssetRef } from './GlbInstance';

const KENNEY_CDN = 'https://cdn.jsdelivr.net/gh/Hidencod/tge-assets@main/packs';
const localKenney = (file: string) => `/assets/glb/kenney/${file}`;
const localQuat = (file: string) => `/assets/glb/quaternius/${file}`;

export function kenneyUrl(file: string, packPath: string) {
  return { primary: localKenney(file), fallback: `${KENNEY_CDN}/${packPath}` };
}

const TREEHOUSE = 'https://raw.githubusercontent.com/robertguss/treehouse/main/library/models';
const SHOWCASE =
  'https://raw.githubusercontent.com/trebeljahr/quaternius-showcase/main/public/glb/buildings_pack_2';

export const KENNEY_BUILDINGS = [
  kenneyUrl('building-type-a.glb', 'city-kit-suburban/building-type-a.glb'),
  kenneyUrl('building-type-b.glb', 'city-kit-suburban/building-type-b.glb'),
  kenneyUrl('building-type-c.glb', 'city-kit-suburban/building-type-c.glb'),
  kenneyUrl('building-type-d.glb', 'city-kit-suburban/building-type-d.glb'),
  kenneyUrl('building-type-e.glb', 'city-kit-suburban/building-type-e.glb'),
  kenneyUrl('building-type-f.glb', 'city-kit-suburban/building-type-f.glb'),
  kenneyUrl('building-type-g.glb', 'city-kit-suburban/building-type-g.glb'),
];

export const KENNEY_AGENTS = [
  kenneyUrl('character-male-a.glb', 'mini-characters/character-male-a.glb'),
  kenneyUrl('character-male-b.glb', 'mini-characters/character-male-b.glb'),
  kenneyUrl('character-male-c.glb', 'mini-characters/character-male-c.glb'),
  kenneyUrl('character-male-d.glb', 'mini-characters/character-male-d.glb'),
  kenneyUrl('character-female-a.glb', 'mini-characters/character-female-a.glb'),
  kenneyUrl('character-female-b.glb', 'mini-characters/character-female-b.glb'),
  kenneyUrl('character-female-c.glb', 'mini-characters/character-female-c.glb'),
  kenneyUrl('character-female-d.glb', 'mini-characters/character-female-d.glb'),
];

export const KENNEY_ROADS = [
  kenneyUrl('road-straight.glb', 'city-kit-roads/road-straight.glb'),
  kenneyUrl('road-crossroad.glb', 'city-kit-roads/road-crossroad.glb'),
  kenneyUrl('road-bend.glb', 'city-kit-roads/road-bend.glb'),
];

export const KENNEY_TREES = [
  kenneyUrl('tree-small.glb', 'city-kit-suburban/tree-small.glb'),
  kenneyUrl('tree-large.glb', 'city-kit-suburban/tree-large.glb'),
  kenneyUrl('tree-tall.glb', 'nature-kit/tree-tall.glb'),
];

export const QUAT_BUILDINGS = [
  { primary: localQuat('Building2_Large.glb'), fallback: `${SHOWCASE}/Building2_Large.glb` },
  { primary: localQuat('Building1_Small.glb'), fallback: `${SHOWCASE}/Building1_Small.glb` },
  { primary: localQuat('Building2_Small.glb'), fallback: `${SHOWCASE}/Building2_Small.glb` },
  { primary: localQuat('Building3_Small.glb'), fallback: `${SHOWCASE}/Building3_Small.glb` },
  { primary: localQuat('Building4.glb'), fallback: `${SHOWCASE}/Building4.glb` },
  { primary: localQuat('House1.glb'), fallback: `${SHOWCASE}/House1.glb` },
  { primary: localQuat('House2.glb'), fallback: `${SHOWCASE}/House2.glb` },
];

export const QUAT_AGENTS = [
  { primary: localQuat('casual_male.glb'), fallback: `${TREEHOUSE}/characters/casual_male.glb` },
  { primary: localQuat('casual_female.glb'), fallback: `${TREEHOUSE}/characters/casual_female.glb` },
  { primary: localQuat('casual2_male.glb'), fallback: `${TREEHOUSE}/characters/casual2_male.glb` },
  { primary: localQuat('casual2_female.glb'), fallback: `${TREEHOUSE}/characters/casual2_female.glb` },
  { primary: localQuat('casual3_male.glb'), fallback: `${TREEHOUSE}/characters/casual3_male.glb` },
  { primary: localQuat('casual3_female.glb'), fallback: `${TREEHOUSE}/characters/casual3_female.glb` },
  { primary: localQuat('worker_male.glb'), fallback: `${TREEHOUSE}/characters/worker_male.glb` },
  { primary: localQuat('worker_female.glb'), fallback: `${TREEHOUSE}/characters/worker_female.glb` },
];

export const QUAT_TREES = [
  { primary: localQuat('tree_1.glb'), fallback: `${TREEHOUSE}/nature/tree_1.glb` },
  { primary: localQuat('tree_2.glb'), fallback: `${TREEHOUSE}/nature/tree_2.glb` },
  { primary: localQuat('tree_1.glb'), fallback: `${TREEHOUSE}/nature/tree_1.glb` },
];

export const ALL_PRELOAD_URLS: AssetRef[] = [
  ...KENNEY_BUILDINGS,
  ...KENNEY_AGENTS,
  ...KENNEY_ROADS,
  ...KENNEY_TREES,
  ...QUAT_BUILDINGS,
  ...QUAT_AGENTS,
  ...QUAT_TREES,
  {
    primary: '/assets/glb/quaternius/rock_1.glb',
    fallback:
      'https://raw.githubusercontent.com/robertguss/treehouse/main/library/models/nature/rock_1.glb',
  },
];
