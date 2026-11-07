/**
 * Quaternius showcase GLBs ship with metallicFactor 0.4 and linear-space colors that
 * render nearly black without an environment map (verified 2026-11-07). This module
 * re-tints them to the cozy palette so scheme B is judged on modelling, not on a
 * material-export artifact. Kenney assets are already textured and are left untouched.
 */
import type { Color, Material, Mesh, Object3D } from 'three';

const PALETTE: Record<string, string> = {
  BrickRed: '#d4846a',
  DarkRed: '#c96f58',
  Brown: '#8b5e3c',
  Wood: '#a9774f',
  Beige: '#f5f0e6',
  White: '#fffaf0',
  LightGrey: '#e4e0d6',
  Grey: '#a8a49a',
  DarkGrey: '#6b675f',
  LightYellow: '#f2d98a',
  Green: '#79ae87',
  LightBlue: '#a8dadc',
  GreyBlue: '#9fb9c4',
  WhiteBlue: '#dfeef2',
  Skin: '#f3c9a2',
  Face: '#fff6e8',
  Hair: '#6b4a2f',
  Belt: '#8a5a3c',
  Pants: '#5b6b7a',
  Vest: '#d77f54',
  Hat: '#e7b65a',
  Rock: '#b9b2a6',
};

const SHIRTS = [
  '#4c9fa8',
  '#d77f54',
  '#79ae87',
  '#9b8fd9',
  '#e7b65a',
  '#4ea8de',
  '#c96f58',
  '#7fb3a5',
];

export function applyCozyPalette(root: Object3D, variant = 0): void {
  root.traverse((obj) => {
    const mesh = obj as Mesh;
    if (!mesh.isMesh || !mesh.material) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      const typed = material as Material & { color?: Color; metalness?: number; roughness?: number };
      if (typeof typed.metalness === 'number') typed.metalness = 0;
      if (typeof typed.roughness === 'number') typed.roughness = Math.max(typed.roughness ?? 0.5, 0.75);
      if (!typed.color) continue;
      const name = material.name;
      if (name === 'Shirt') {
        typed.color.set(SHIRTS[variant % SHIRTS.length]);
      } else if (PALETTE[name]) {
        typed.color.set(PALETTE[name]);
      }
      material.needsUpdate = true;
    }
  });
}
