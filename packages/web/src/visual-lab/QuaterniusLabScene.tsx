import { AGENT_SLOTS, BUILDING_SLOTS, ROCK_SLOTS, TREE_SLOTS } from './islandLayout';
import { QUAT_AGENTS, QUAT_BUILDINGS, QUAT_TREES } from './assetUrls';
import { AnimatedGlbInstance, GlbInstance } from './GlbInstance';
import { IslandBase } from './IslandBase';
import { LabLighting } from './LabLighting';
import { NATIVE, WORLD, fitScale, sitOnGround } from './assetScale';
import type { AssetRef } from './GlbInstance';

const ROCK: AssetRef = {
  primary: '/assets/glb/quaternius/rock_1.glb',
  fallback: 'https://raw.githubusercontent.com/robertguss/treehouse/main/library/models/nature/rock_1.glb',
};

export function QuaterniusLabScene() {
  return (
    <>
      <LabLighting />
      <IslandBase />

      {BUILDING_SLOTS.map((slot, i) => {
        const asset = QUAT_BUILDINGS[i];
        if (!asset) return null;
        const scale = fitScale(
          NATIVE.quatBuildingHeight[i],
          WORLD.buildingByRole[slot.role],
          NATIVE.quatBuildingWidth[i],
          WORLD.buildingMaxWidth.quaternius
        );
        return (
          <GlbInstance
            key={slot.id}
            url={asset}
            position={[slot.position[0], sitOnGround(NATIVE.minY.quatBuilding, scale, 0.02), slot.position[2]]}
            rotation={[0, slot.rotationY, 0]}
            scale={scale}
            cozy
          />
        );
      })}

      {AGENT_SLOTS.map((slot, i) => {
        const asset = QUAT_AGENTS[i];
        if (!asset) return null;
        const scale = fitScale(NATIVE.quatAgentHeight[i], WORLD.agentHeight);
        return (
          <AnimatedGlbInstance
            key={slot.id}
            url={asset}
            position={[slot.position[0], sitOnGround(NATIVE.minY.quatAgent, scale, 0.03), slot.position[2]]}
            rotation={[0, slot.rotationY, 0]}
            scale={scale}
            cozy
            variant={i}
          />
        );
      })}

      {TREE_SLOTS.map((t, i) => {
        const treeIndex = i % QUAT_TREES.length;
        const tree = QUAT_TREES[treeIndex];
        const scale = fitScale(NATIVE.quatTreeHeight[treeIndex], t.height);
        return (
          <GlbInstance
            key={`tree-q-${i}`}
            url={tree}
            position={[t.position[0], sitOnGround(NATIVE.minY.quatTree, scale, 0.02), t.position[2]]}
            rotation={[0, t.rotationY, 0]}
            scale={scale}
            cozy
          />
        );
      })}

      {ROCK_SLOTS.map((r, i) => {
        const scale = fitScale(NATIVE.quatRockHeight, WORLD.rockHeight);
        return (
          <GlbInstance
            key={`rock-${i}`}
            url={ROCK}
            position={[r.position[0], sitOnGround(NATIVE.minY.quatRock, scale, 0.02), r.position[2]]}
            rotation={[0, r.rotationY, 0]}
            scale={scale}
            castShadow={false}
            cozy
          />
        );
      })}
    </>
  );
}
