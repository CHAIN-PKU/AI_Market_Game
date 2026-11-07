import {
  BUILDING_SLOTS,
  AGENT_SLOTS,
  TREE_SLOTS,
} from './islandLayout';
import {
  KENNEY_AGENTS,
  KENNEY_BUILDINGS,
  KENNEY_ROADS,
  KENNEY_TREES,
} from './assetUrls';
import { GlbInstance } from './GlbInstance';
import { IslandBase } from './IslandBase';
import { LabLighting } from './LabLighting';

const BUILDING_SCALE = 1.35;
const AGENT_SCALE = 0.85;
const TREE_SCALE = 0.9;

export function KenneyLabScene() {
  return (
    <>
      <LabLighting />
      <IslandBase />
      <GlbInstance
        url={KENNEY_ROADS[0]}
        position={[0, 0.02, 0]}
        rotation={[0, 0, 0]}
        scale={2.2}
      />
      <GlbInstance
        url={KENNEY_ROADS[1]}
        position={[0, 0.02, -1.5]}
        rotation={[0, 0, 0]}
        scale={2.2}
      />
      <GlbInstance
        url={KENNEY_ROADS[2]}
        position={[4, 0.02, 3]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={2.2}
      />
      {BUILDING_SLOTS.map((slot, i) => {
        const asset = KENNEY_BUILDINGS[i];
        if (!asset) return null;
        return (
          <GlbInstance
            key={slot.id}
            url={asset}
            position={slot.position}
            rotation={[0, slot.rotationY, 0]}
            scale={BUILDING_SCALE}
          />
        );
      })}
      {AGENT_SLOTS.map((slot, i) => {
        const asset = KENNEY_AGENTS[i];
        if (!asset) return null;
        return (
          <GlbInstance
            key={slot.id}
            url={asset}
            position={[slot.position[0], slot.position[1] + 0.02, slot.position[2]]}
            rotation={[0, slot.rotationY, 0]}
            scale={AGENT_SCALE}
          />
        );
      })}
      {TREE_SLOTS.map((t, i) => {
        const tree = KENNEY_TREES[i % KENNEY_TREES.length];
        return (
          <GlbInstance
            key={`tree-${i}`}
            url={tree}
            position={t.position}
            rotation={[0, t.rotationY, 0]}
            scale={TREE_SCALE * t.scale}
          />
        );
      })}
    </>
  );
}
