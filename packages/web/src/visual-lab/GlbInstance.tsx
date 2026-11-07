import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import type { Group } from 'three';
import { clone as cloneWithSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';

export type AssetRef = { primary: string; fallback: string };

export function resolveGlbUrl(url: AssetRef | string): string {
  if (typeof url === 'string') return url;
  // Vite serves /assets/glb/* when present; drei also accepts CDN if local missing.
  return url.primary;
}

export function GlbInstance({
  url,
  position,
  rotation,
  scale = 1,
  castShadow = true,
  receiveShadow = true,
}: {
  url: AssetRef | string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  castShadow?: boolean;
  receiveShadow?: boolean;
}) {
  const src = resolveGlbUrl(url);
  const gltf = useGLTF(src);
  const clone = useMemo(() => {
    // SkeletonUtils.clone: re-targets skinned meshes so each instance keeps its own bones.
    const g = cloneWithSkeleton(gltf.scene) as Group;
    g.traverse((obj) => {
      if ('castShadow' in obj) obj.castShadow = castShadow;
      if ('receiveShadow' in obj) obj.receiveShadow = receiveShadow;
    });
    return g;
  }, [gltf.scene, castShadow, receiveShadow]);

  return (
    <primitive object={clone} position={position} rotation={rotation} scale={scale} />
  );
}

export function AnimatedGlbInstance({
  url,
  position,
  rotation,
  scale = 1,
}: {
  url: AssetRef | string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}) {
  const src = resolveGlbUrl(url);
  const gltf = useGLTF(src);
  const clone = useMemo(() => cloneWithSkeleton(gltf.scene) as Group, [gltf.scene]);
  return <primitive object={clone} position={position} rotation={rotation} scale={scale} />;
}
