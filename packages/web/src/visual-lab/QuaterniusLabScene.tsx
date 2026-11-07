import { BUILDING_SLOTS, AGENT_SLOTS, TREE_SLOTS } from './islandLayout';
import { QUAT_AGENTS, QUAT_BUILDINGS, QUAT_TREES } from './assetUrls';
import { AnimatedGlbInstance, GlbInstance } from './GlbInstance';
import { IslandBase } from './IslandBase';
import { LabLighting } from './LabLighting';

const BUILDING_SCALE = 0.42;
const AGENT_SCALE = 0.55;

export function QuaterniusLabScene() {
  return (
    <>
      <LabLighting />
      <IslandBase />
      {BUILDING_SLOTS.map((slot, i) => {
        const asset = QUAT_BUILDINGS[i];
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
        const asset = QUAT_AGENTS[i];
        if (!asset) return null;
        return (
          <AnimatedGlbInstance
            key={slot.id}
            url={asset}
            position={[slot.position[0], slot.position[1], slot.position[2]]}
            rotation={[0, slot.rotationY + Math.PI, 0]}
            scale={AGENT_SCALE}
          />
        );
      })}
      {TREE_SLOTS.map((t, i) => {
        const tree = QUAT_TREES[i % QUAT_TREES.length];
        return (
          <GlbInstance
            key={`tree-q-${i}`}
            url={tree}
            position={t.position}
            rotation={[0, t.rotationY, 0]}
            scale={0.35 * t.scale}
          />
        );
      })}
      {TREE_SLOTS.slice(0, 3).map((t, i) => (
        <GlbInstance
          key={`rock-${i}`}
          url={{
            primary: '/assets/glb/quaternius/rock_1.glb',
            fallback:
              'https://raw.githubusercontent.com/robertguss/treehouse/main/library/models/nature/rock_1.glb',
          }}
          position={[t.position[0] * 0.6, 0, t.position[2] * 0.5]}
          rotation={[0, t.rotationY, 0]}
          scale={0.28}
        />
      ))}
    </>
  );
}
