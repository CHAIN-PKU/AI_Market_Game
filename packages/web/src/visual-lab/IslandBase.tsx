import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh, MeshBasicMaterial } from 'three';
import { ISLAND } from './islandLayout';
import { makeGrassTexture, makePlazaTexture } from './textures';

/** Diorama terrain: soil thickness + grass top + plaza road ring + water. No procedural buildings. */
export function IslandBase() {
  const grass = useMemo(() => makeGrassTexture(), []);
  const plaza = useMemo(() => makePlazaTexture(), []);
  const ringA = useRef<Mesh>(null);
  const ringB = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    for (const [ref, offset] of [[ringA, 0], [ringB, 2.4]] as const) {
      if (!ref.current) continue;
      const k = ((t + offset) % 4.8) / 4.8;
      ref.current.scale.setScalar(0.92 + k * 0.22);
      (ref.current.material as MeshBasicMaterial).opacity = 0.28 * (1 - k);
    }
  });
  return (
    <group>
      {/* soil side — gives the island a table-top model thickness */}
      <mesh position={[0, -ISLAND.grassHeight / 2, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[ISLAND.grassRadius, ISLAND.grassRadius * 0.92, ISLAND.grassHeight, 64]} />
        <meshStandardMaterial color="#8a6a4b" roughness={1} />
      </mesh>

      {/* grass top */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[ISLAND.grassRadius, 64]} />
        <meshStandardMaterial map={grass} color="#ffffff" roughness={0.95} />
      </mesh>

      {/* plaza road ring (shared by both schemes) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <ringGeometry args={[ISLAND.plazaInner, ISLAND.plazaOuter, 72]} />
        <meshStandardMaterial map={plaza} color="#ffffff" roughness={0.95} />
      </mesh>

      {/* central plaza slab */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} receiveShadow>
        <circleGeometry args={[ISLAND.plazaInner, 72]} />
        <meshStandardMaterial map={plaza} color="#f3e6cd" roughness={0.95} />
      </mesh>

      {/* water plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, ISLAND.waterY, 0]} receiveShadow>
        <circleGeometry args={[ISLAND.waterRadius, 80]} />
        <meshStandardMaterial color="#5fb3c3" transparent opacity={0.92} roughness={0.16} metalness={0.12} />
      </mesh>
      <mesh ref={ringA} rotation={[-Math.PI / 2, 0, 0]} position={[0, ISLAND.waterY + 0.02, 0]}>
        <ringGeometry args={[ISLAND.grassRadius + 0.15, ISLAND.grassRadius + 0.85, 80]} />
        <meshBasicMaterial color="#eaf7f2" transparent opacity={0.28} depthWrite={false} />
      </mesh>
      <mesh ref={ringB} rotation={[-Math.PI / 2, 0, 0]} position={[0, ISLAND.waterY + 0.02, 0]}>
        <ringGeometry args={[ISLAND.grassRadius + 0.15, ISLAND.grassRadius + 0.85, 80]} />
        <meshBasicMaterial color="#eaf7f2" transparent opacity={0.18} depthWrite={false} />
      </mesh>
    </group>
  );
}
