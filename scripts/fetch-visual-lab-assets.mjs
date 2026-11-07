#!/usr/bin/env node
/**
 * Downloads curated GLBs for /visual-lab (Kenney via tge-assets CDN mirror, Quaternius via upstream mirrors).
 * Run from repo root: node scripts/fetch-visual-lab-assets.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outKenney = path.join(root, 'packages/web/public/assets/glb/kenney');
const outQuat = path.join(root, 'packages/web/public/assets/glb/quaternius');

const KENNEY_BASE = 'https://cdn.jsdelivr.net/gh/Hidencod/tge-assets@main';
const TREEHOUSE_BASE = 'https://raw.githubusercontent.com/robertguss/treehouse/main/library/models';
const SHOWCASE_BASE =
  'https://raw.githubusercontent.com/trebeljahr/quaternius-showcase/main/public/glb';

const kenneyFiles = [
  'packs/city-kit-suburban/building-type-a.glb',
  'packs/city-kit-suburban/building-type-b.glb',
  'packs/city-kit-suburban/building-type-c.glb',
  'packs/city-kit-suburban/building-type-d.glb',
  'packs/city-kit-suburban/building-type-e.glb',
  'packs/city-kit-suburban/building-type-f.glb',
  'packs/city-kit-suburban/building-type-g.glb',
  'packs/city-kit-roads/road-straight.glb',
  'packs/city-kit-roads/road-crossroad.glb',
  'packs/city-kit-roads/road-bend.glb',
  'packs/city-kit-suburban/tree-small.glb',
  'packs/city-kit-suburban/tree-large.glb',
  'packs/city-kit-suburban/path-long.glb',
  'packs/mini-characters/character-male-a.glb',
  'packs/mini-characters/character-male-b.glb',
  'packs/mini-characters/character-male-c.glb',
  'packs/mini-characters/character-male-d.glb',
  'packs/mini-characters/character-female-a.glb',
  'packs/mini-characters/character-female-b.glb',
  'packs/mini-characters/character-female-c.glb',
  'packs/mini-characters/character-female-d.glb',
  'packs/nature-kit/tree-tall.glb',
];

const quaterniusFiles = [
  { url: `${SHOWCASE_BASE}/buildings_pack_2/Building1_Small.glb`, name: 'Building1_Small.glb' },
  { url: `${SHOWCASE_BASE}/buildings_pack_2/Building2_Small.glb`, name: 'Building2_Small.glb' },
  { url: `${SHOWCASE_BASE}/buildings_pack_2/Building3_Small.glb`, name: 'Building3_Small.glb' },
  { url: `${SHOWCASE_BASE}/buildings_pack_2/Building4.glb`, name: 'Building4.glb' },
  { url: `${SHOWCASE_BASE}/buildings_pack_2/House1.glb`, name: 'House1.glb' },
  { url: `${SHOWCASE_BASE}/buildings_pack_2/House2.glb`, name: 'House2.glb' },
  { url: `${SHOWCASE_BASE}/buildings_pack_2/Building2_Large.glb`, name: 'Building2_Large.glb' },
  { url: `${TREEHOUSE_BASE}/characters/casual_male.glb`, name: 'casual_male.glb' },
  { url: `${TREEHOUSE_BASE}/characters/casual_female.glb`, name: 'casual_female.glb' },
  { url: `${TREEHOUSE_BASE}/characters/casual2_male.glb`, name: 'casual2_male.glb' },
  { url: `${TREEHOUSE_BASE}/characters/casual2_female.glb`, name: 'casual2_female.glb' },
  { url: `${TREEHOUSE_BASE}/characters/casual3_male.glb`, name: 'casual3_male.glb' },
  { url: `${TREEHOUSE_BASE}/characters/casual3_female.glb`, name: 'casual3_female.glb' },
  { url: `${TREEHOUSE_BASE}/characters/worker_male.glb`, name: 'worker_male.glb' },
  { url: `${TREEHOUSE_BASE}/characters/worker_female.glb`, name: 'worker_female.glb' },
  { url: `${TREEHOUSE_BASE}/nature/tree_1.glb`, name: 'tree_1.glb' },
  { url: `${TREEHOUSE_BASE}/nature/tree_2.glb`, name: 'tree_2.glb' },
  { url: `${TREEHOUSE_BASE}/nature/rock_1.glb`, name: 'rock_1.glb' },
  { url: `${TREEHOUSE_BASE}/nature/grass_1.glb`, name: 'grass_1.glb' },
];

async function download(url, dest) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, buf);
  console.log('ok', path.relative(root, dest), buf.length);
}

async function main() {
  for (const rel of kenneyFiles) {
    const name = path.basename(rel);
    await download(`${KENNEY_BASE}/${rel}`, path.join(outKenney, name));
  }
  for (const { url, name } of quaterniusFiles) {
    await download(url, path.join(outQuat, name));
  }
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
