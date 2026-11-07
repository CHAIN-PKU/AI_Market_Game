/**
 * Asset placement config — single source of truth for visual-lab scales.
 *
 * Native sizes were measured in the browser with `three.Box3().setFromObject()` after
 * GLTFLoader parse (2026-11-07). Do NOT copy these numbers into scene components:
 * change targets here, or add a new entry when swapping a model.
 */
import type { BuildingRole } from './islandLayout';

/** Cozy-diorama world units. Camera presets are tuned for 1920×1080. */
export const WORLD = {
  /** Head-to-toe height of a resident. */
  agentHeight: 1.68,
  /** Target height per building role (market stays low & wide, R&D is taller). */
  buildingByRole: {
    market: 2.7,
    skill: 2.5,
    coding: 2.9,
    research: 3.1,
    design: 2.6,
    'public-rd': 3.2,
    homes: 2.4,
  } satisfies Record<BuildingRole, number>,
  /** Max footprint width so buildings do not crash into each other on the ring. */
  buildingMaxWidth: { kenney: 4.2, quaternius: 4.6 },
  /** Target tree heights, cycled through TREE_SLOTS. */
  treeHeights: [2.8, 2.2, 3.2, 2.5, 2.0, 2.9],
  rockHeight: 0.7,
} as const;

/** Native (GLB) measurements — source of truth for scale calibration. */
export const NATIVE = {
  kenneyBuildingHeight: [0.834, 1.138, 1.034, 1.238, 1.138, 1.138, 0.768],
  kenneyBuildingWidth: [1.3, 1.828, 1.286, 1.756, 1.3, 1.428, 1.45],
  quatBuildingHeight: [5.918, 4.663, 4.968, 5.677, 5.487, 3.179, 2.926],
  quatBuildingWidth: [5.716, 3.747, 3.584, 3.052, 4.644, 2.557, 3.644],
  kenneyAgentHeight: [0.671, 0.661, 0.793, 0.722, 0.776, 0.723, 0.776, 0.776],
  quatAgentHeight: [3.18, 3.048, 3.18, 3.048, 3.18, 3.048, 3.167, 3.167],
  kenneyTreeHeight: [0.567, 0.767, 1.688],
  quatTreeHeight: [2.481, 3.123],
  quatRockHeight: 0.878,
  /** Models with a small negative minY need lifting by `-minY * scale`. */
  minY: {
    kenneyBuilding: 0,
    quatBuilding: -0.02,
    quatAgent: -0.006,
    quatTree: -0.04,
    quatRock: -0.051,
  },
} as const;

/** Fit a model to a target height, optionally capped by a maximum footprint width. */
export function fitScale(nativeHeight: number, targetHeight: number, nativeWidth?: number, maxWidth?: number): number {
  if (!(nativeHeight > 0)) return 1;
  const byHeight = targetHeight / nativeHeight;
  if (!nativeWidth || !maxWidth || !(nativeWidth > 0)) return byHeight;
  return Math.min(byHeight, maxWidth / nativeWidth);
}

/** World-space Y lift so the model's lowest point sits on the given ground level. */
export function sitOnGround(nativeMinY: number, scale: number, groundY = 0): number {
  return groundY - nativeMinY * scale;
}
