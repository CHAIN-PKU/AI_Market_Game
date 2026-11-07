import { useGLTF, useAnimations } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import type { Group } from 'three';
import { clone as cloneWithSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { applyCozyPalette } from './cozyMaterials';

export type AssetRef = { primary: string; fallback: string };

export function resolveGlbUrl(url: AssetRef | string): string {
  if (typeof url === 'string') return url;
  // Local `/assets/glb/*` is the canonical source (committed). CDN fallback is only used
  // by the fetch script, not at runtime — keep runtime deterministic/offline.
  return url.primary;
}

function prepareClone(
  source: Group,
  castShadow: boolean,
  receiveShadow: boolean,
  cozy: boolean,
  variant: number
): Group {
  // SkeletonUtils.clone re-targets skinned meshes so each instance keeps its own bones.
  const g = cloneWithSkeleton(source) as Group;
  if (cozy) applyCozyPalette(g, variant);
  g.traverse((obj) => {
    if ('castShadow' in obj) obj.castShadow = castShadow;
    if ('receiveShadow' in obj) obj.receiveShadow = receiveShadow;
  });
  return g;
}

type InstanceProps = {
  url: AssetRef | string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  castShadow?: boolean;
  receiveShadow?: boolean;
  /** Apply the cozy material palette (used for the Quaternius scheme). */
  cozy?: boolean;
  /** Variant index, e.g. per-agent shirt colours. */
  variant?: number;
};

export function GlbInstance({
  url,
  position,
  rotation,
  scale = 1,
  castShadow = true,
  receiveShadow = true,
  cozy = false,
  variant = 0,
}: InstanceProps) {
  const src = resolveGlbUrl(url);
  const gltf = useGLTF(src);
  const clone = useMemo(
    () => prepareClone(gltf.scene, castShadow, receiveShadow, cozy, variant),
    [gltf.scene, castShadow, receiveShadow, cozy, variant]
  );

  return <primitive object={clone} position={position} rotation={rotation} scale={scale} />;
}

/** Same as GlbInstance, but plays the model's idle clip (first clip matching /idle/i). */
export function AnimatedGlbInstance({
  url,
  position,
  rotation,
  scale = 1,
  castShadow = true,
  receiveShadow = true,
  cozy = false,
  variant = 0,
}: InstanceProps) {
  const src = resolveGlbUrl(url);
  const gltf = useGLTF(src);
  const clone = useMemo(
    () => prepareClone(gltf.scene, castShadow, receiveShadow, cozy, variant),
    [gltf.scene, castShadow, receiveShadow, cozy, variant]
  );
  const { actions } = useAnimations(gltf.animations, clone);

  useEffect(() => {
    const clip = gltf.animations.find((a) => /idle/i.test(a.name));
    if (!clip) return;
    const action = actions[clip.name];
    action?.reset().fadeIn(0.25).play();
    return () => {
      action?.fadeOut(0.15);
    };
  }, [actions, gltf.animations]);

  return <primitive object={clone} position={position} rotation={rotation} scale={scale} />;
}
