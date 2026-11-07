/** Cozy island base — procedural until Kenney GLB lands */
export function IslandEnvironment() {
  const trees: [number, number][] = [
    [-8, -8],
    [8, -7],
    [-7, 8],
    [8, 8],
    [-9, 2],
    [9, -2],
  ];

  return (
    <group>
      <mesh receiveShadow position={[0, -0.55, 0]}>
        <cylinderGeometry args={[11.5, 12.5, 1.1, 32]} />
        <meshStandardMaterial color="#5a9a68" />
      </mesh>
      <mesh receiveShadow position={[0, -0.05, 0]}>
        <cylinderGeometry args={[10.2, 10.5, 0.35, 32]} />
        <meshStandardMaterial color="#79ae87" />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 0]}>
        <circleGeometry args={[9.8, 48]} />
        <meshStandardMaterial color="#89bc93" />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.135, 0]}>
        <ringGeometry args={[5.5, 6.2, 32]} />
        <meshStandardMaterial color="#d9c9a8" />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.14, 0]}>
        <planeGeometry args={[1.1, 20]} />
        <meshStandardMaterial color="#e8dcc4" />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.14, 0]}>
        <planeGeometry args={[20, 1.1]} />
        <meshStandardMaterial color="#e8dcc4" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.7, 0]}>
        <circleGeometry args={[22, 64]} />
        <meshStandardMaterial color="#4c9fa8" transparent opacity={0.85} />
      </mesh>
      {trees.map(([x, z], i) => (
        <group key={i} position={[x, 0.12, z]}>
          <mesh castShadow position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.12, 0.16, 0.5, 6]} />
            <meshStandardMaterial color="#8b5e3c" />
          </mesh>
          <mesh castShadow position={[0, 0.65, 0]}>
            <coneGeometry args={[0.45, 0.9, 8]} />
            <meshStandardMaterial color="#79ae87" />
          </mesh>
        </group>
      ))}
    </group>
  );
}
