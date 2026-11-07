import { AGENT_SLOTS, BUILDING_SLOTS, TREE_SLOTS } from './islandLayout';
import { KENNEY_AGENTS, KENNEY_BUILDINGS, KENNEY_TREES } from './assetUrls';
import { AnimatedGlbInstance, GlbInstance } from './GlbInstance';
import { IslandBase } from './IslandBase';
import { LabLighting } from './LabLighting';
import { NATIVE, WORLD, fitScale, sitOnGround } from './assetScale';

export function KenneyLabScene() {
  return (
    <>
      <LabLighting />
      <IslandBase />

      {BUILDING_SLOTS.map((slot, i) => {
        const asset = KENNEY_BUILDINGS[i];
        if (!asset) return null;
        const scale = fitScale(
          NATIVE.kenneyBuildingHeight[i],
          WORLD.buildingByRole[slot.role],
          NATIVE.kenneyBuildingWidth[i],
          WORLD.buildingMaxWidth.kenney
        );
        return (
          <GlbInstance
            key={slot.id}
            url={asset}
            position={[slot.position[0], sitOnGround(0, scale, 0.02), slot.position[2]]}
            rotation={[0, slot.rotationY, 0]}
            scale={scale}
          />
        );
      })}

      {AGENT_SLOTS.map((slot, i) => {
        const asset = KENNEY_AGENTS[i];
        if (!asset) return null;
        const scale = fitScale(NATIVE.kenneyAgentHeight[i], WORLD.agentHeight);
        return (
          <AnimatedGlbInstance
            key={slot.id}
            url={asset}
            position={[slot.position[0], 0.03, slot.position[2]]}
            rotation={[0, slot.rotationY, 0]}
            scale={scale}
          />
        );
      })}

      {TREE_SLOTS.map((t, i) => {
        const treeIndex = i % KENNEY_TREES.length;
        const tree = KENNEY_TREES[treeIndex];
        const nativeMinY = treeIndex === 2 ? -0.05 : 0; // tree-tall sits below origin
        const scale = fitScale(NATIVE.kenneyTreeHeight[treeIndex], t.height);
        return (
          <GlbInstance
            key={`tree-${i}`}
            url={tree}
            position={[t.position[0], sitOnGround(nativeMinY, scale, 0.02), t.position[2]]}
            rotation={[0, t.rotationY, 0]}
            scale={scale}
          />
        );
      })}
    </>
  );
}
