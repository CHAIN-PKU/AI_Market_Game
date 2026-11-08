import {
  Color,
  DataTexture,
  MeshToonMaterial,
  NearestFilter,
  RedFormat,
  type Material,
  type MeshStandardMaterial,
} from 'three';

/**
 * A 3-step ramp for cel shading. NearestFilter keeps hard bands
 * (the "anime" look) instead of a smooth Lambert gradient.
 */
const ramp = (() => {
  const data = new Uint8Array([90, 135, 178, 216, 248]);
  const tex = new DataTexture(data, 5, 1, RedFormat);
  tex.minFilter = NearestFilter;
  tex.magFilter = NearestFilter;
  tex.needsUpdate = true;
  return tex;
})();

export function toToonMaterial(source: Material, colorOverride?: string): Material {
  if (!(source as MeshStandardMaterial).isMeshStandardMaterial) return source;
  const standard = source as MeshStandardMaterial;
  const toon = new MeshToonMaterial({
    color: colorOverride ? new Color(colorOverride) : standard.color ? standard.color.clone() : new Color('#ffffff'),
    map: standard.map ?? null,
    gradientMap: ramp,
    transparent: standard.transparent,
    opacity: standard.opacity,
    alphaTest: standard.alphaTest,
    side: standard.side,
    vertexColors: standard.vertexColors,
  });
  toon.name = `${standard.name || 'material'}-toon`;
  return toon;
}
