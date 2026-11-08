import { useMemo, useRef } from 'react';
import { ExtrudeGeometry, Shape, ShapeGeometry } from 'three';
import { useFrame } from '@react-three/fiber';
import type { Mesh, MeshBasicMaterial } from 'three';
import { ISLAND } from './islandLayout';
import { makeGrassTexture, makePlazaTexture } from './textures';

function makeCoastShape(segments = 96) {
  const shape = new Shape();
  for (let i = 0; i <= segments; i += 1) {
    const a = (i / segments) * Math.PI * 2;
    const radius =
      ISLAND.grassRadius +
      Math.sin(a * 3 + 0.4) * 0.85 +
      Math.sin(a * 5 - 1.2) * 0.5 +
      Math.sin(a * 7 + 2.1) * 0.25;
    const x = Math.cos(a) * radius;
    const y = Math.sin(a) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

/** Diorama terrain: soil thickness + grass top + plaza road ring + water. No procedural buildings. */
export function IslandBase() {
  const grass = useMemo(() => makeGrassTexture(), []);
  const plaza = useMemo(() => makePlazaTexture(), []);
  const coast = useMemo(() => makeCoastShape(), []);
  const grassGeo = useMemo(() => new ShapeGeometry(coast), [coast]);
  const soilGeo = useMemo(() => new ExtrudeGeometry(coast, { depth: ISLAND.grassHeight, bevelEnabled: false, steps: 1 }), [coast]);
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
      {/* rocky underside: the island reads as a floating diorama rock, not a cylinder */}
      <mesh position={[0, -4.2, 0]} rotation={[Math.PI, 0, 0]} castShadow receiveShadow>
        <coneGeometry args={[12.1, 8.4, 64, 1]} />
        <meshStandardMaterial color="#6f6153" roughness={1} flatShading />
      </mesh>
      {Array.from({ length: 18 }, (_, i) => {
        const a = (i / 18) * Math.PI * 2;
        const r = 11.4 + Math.sin(i * 2.7) * 0.45;
        return (
          <mesh key={i} position={[Math.cos(a) * r, -0.55 - (i % 3) * 0.3, Math.sin(a) * r]} rotation={[0.4, a, 0.2]} scale={[0.7 + (i % 4) * 0.16, 0.5 + (i % 3) * 0.15, 0.65]} castShadow>
            <dodecahedronGeometry args={[0.7, 0]} />
            <meshStandardMaterial color={i % 2 === 0 ? '#7a6b5b' : '#8a7765'} roughness={1} flatShading />
          </mesh>
        );
      })}
      {/* extruded soil gives the island a table-top model thickness and an irregular coast */}
      <mesh geometry={soilGeo} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow castShadow>
        <meshStandardMaterial color="#8a6a4b" roughness={1} />
      </mesh>

      {/* grass top follows the same irregular coastline */}
      <mesh geometry={grassGeo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]} receiveShadow>
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
