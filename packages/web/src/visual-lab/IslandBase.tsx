import { ISLAND } from './islandLayout';

/** Diorama terrain: soil thickness + grass top + plaza road ring + water. No procedural buildings. */
export function IslandBase() {
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
        <meshStandardMaterial color="#7cbf7a" roughness={0.95} />
      </mesh>

      {/* plaza road ring (shared by both schemes) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <ringGeometry args={[ISLAND.plazaInner, ISLAND.plazaOuter, 72]} />
        <meshStandardMaterial color="#e6d6b5" roughness={0.95} />
      </mesh>

      {/* central plaza slab */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} receiveShadow>
        <circleGeometry args={[ISLAND.plazaInner, 72]} />
        <meshStandardMaterial color="#d9c69d" roughness={0.95} />
      </mesh>

      {/* water plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, ISLAND.waterY, 0]} receiveShadow>
        <circleGeometry args={[ISLAND.waterRadius, 80]} />
        <meshStandardMaterial color="#63b6c4" transparent opacity={0.9} roughness={0.25} />
      </mesh>
    </group>
  );
}
