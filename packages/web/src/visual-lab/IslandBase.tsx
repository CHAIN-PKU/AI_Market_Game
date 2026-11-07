/** Terrain + water only — no procedural buildings. */
export function IslandBase() {
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <circleGeometry args={[11, 64]} />
        <meshStandardMaterial color="#79ae87" roughness={0.92} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[5.2, 6.1, 48]} />
        <meshStandardMaterial color="#e8dcc4" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, 0]}>
        <circleGeometry args={[15.5, 64]} />
        <meshStandardMaterial color="#4c9fa8" transparent opacity={0.88} roughness={0.3} />
      </mesh>
    </group>
  );
}
