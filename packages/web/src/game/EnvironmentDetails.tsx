import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferAttribute, BufferGeometry } from 'three';

const FLOWER_COLORS = ['#f3a6b8', '#f6d36b', '#f7efe0', '#d9a6e8', '#f08a6a'];
const BUSH = '#5f9e62';

function Flower({ x, z, color, scale = 1 }: { x: number; z: number; color: string; scale?: number }) {
  return (
    <group position={[x, 0.02, z]} scale={scale}>
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.018, 0.24, 5]} />
        <meshStandardMaterial color="#4f8b52" roughness={0.9} />
      </mesh>
      {[
        [0, 0.26, 0],
        [0.06, 0.23, 0.03],
        [-0.05, 0.24, -0.02],
      ].map(([px, py, pz], i) => (
        <mesh key={i} position={[px!, py!, pz!]} castShadow>
          <sphereGeometry args={[0.045, 7, 5]} />
          <meshStandardMaterial color={color} roughness={0.75} />
        </mesh>
      ))}
      <mesh position={[0, 0.25, 0]}>
        <sphereGeometry args={[0.018, 6, 4]} />
        <meshStandardMaterial color="#f7d36b" roughness={0.7} />
      </mesh>
    </group>
  );
}

function Bush({ x, z, scale = 1 }: { x: number; z: number; scale?: number }) {
  return (
    <group position={[x, 0.02, z]} scale={scale}>
      {[
        [0, 0.18, 0, 0.3],
        [0.22, 0.14, 0.05, 0.22],
        [-0.2, 0.15, -0.03, 0.24],
      ].map(([px, py, pz, r], i) => (
        <mesh key={i} position={[px!, py!, pz!]} castShadow receiveShadow>
          <sphereGeometry args={[r!, 8, 6]} />
          <meshStandardMaterial color={i % 2 === 0 ? BUSH : '#72b46f'} roughness={0.95} />
        </mesh>
      ))}
      {[0, 1, 2].map((i) => (
        <mesh key={`berry-${i}`} position={[-0.1 + i * 0.1, 0.3 + (i % 2) * 0.04, 0.15]}>
          <sphereGeometry args={[0.025, 6, 4]} />
          <meshStandardMaterial color="#e46d5c" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function Lamp({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.075, 1.5, 6]} />
        <meshStandardMaterial color="#4b5a52" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.56, 0]} castShadow>
        <boxGeometry args={[0.3, 0.32, 0.3]} />
        <meshStandardMaterial color="#ffd98a" emissive="#e0a94f" emissiveIntensity={0.75} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.75, 0]} castShadow>
        <coneGeometry args={[0.2, 0.16, 6]} />
        <meshStandardMaterial color="#3f8f96" roughness={0.7} />
      </mesh>
      <pointLight position={[0, 1.55, 0]} intensity={0.35} distance={2.6} decay={2} color="#ffd98a" />
    </group>
  );
}

function Bench({ x, z, rotation = 0 }: { x: number; z: number; rotation?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[1.0, 0.08, 0.35]} />
        <meshStandardMaterial color="#b8842f" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.62, -0.16]} castShadow>
        <boxGeometry args={[1.0, 0.3, 0.06]} />
        <meshStandardMaterial color="#a9774f" roughness={0.9} />
      </mesh>
      {[-0.38, 0.38].map((px) => (
        <mesh key={px} position={[px, 0.2, 0]} castShadow>
          <boxGeometry args={[0.06, 0.36, 0.3]} />
          <meshStandardMaterial color="#6b4a2f" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function Cloud({ x, y, z, scale = 1 }: { x: number; y: number; z: number; scale?: number }) {
  return (
    <group position={[x, y, z]} scale={scale}>
      {[
        [0, 0, 0, 0.9],
        [0.8, -0.1, 0.1, 0.65],
        [-0.75, -0.12, 0.05, 0.6],
        [0.25, 0.28, -0.05, 0.55],
      ].map(([px, py, pz, r], i) => (
        <mesh key={i} position={[px!, py!, pz!]}>
          <sphereGeometry args={[r!, 12, 8]} />
          <meshStandardMaterial color="#fffdf6" transparent opacity={0.62} roughness={1} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function Petals() {
  const points = useRef<BufferGeometry>(null);
  const data = useMemo(() => {
    const rand = seeded(91);
    const arr = new Float32Array(42 * 3);
    for (let i = 0; i < 42; i += 1) {
      arr[i * 3] = (rand() - 0.5) * 18;
      arr[i * 3 + 1] = 0.4 + rand() * 4.2;
      arr[i * 3 + 2] = (rand() - 0.5) * 16;
    }
    return arr;
  }, []);

  useFrame((_, dt) => {
    const geo = points.current;
    if (!geo) return;
    const attr = geo.getAttribute('position') as BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i + 1] -= dt * (0.09 + (i % 7) * 0.012);
      arr[i] += Math.sin(arr[i + 1] * 0.7) * dt * 0.02;
      if (arr[i + 1] < 0.15) {
        arr[i + 1] = 4.2;
        arr[i] = ((i * 37) % 180) / 10 - 9;
      }
    }
    attr.needsUpdate = true;
  });

  return (
    <points>
      <bufferGeometry ref={points}>
        <bufferAttribute attach="attributes-position" args={[data, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#f4b7bd" size={0.045} transparent opacity={0.55} depthWrite={false} sizeAttenuation />
    </points>
  );
}

function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

export function EnvironmentDetails() {
  const flowers = useMemo(() => {
    const rand = seeded(31);
    return Array.from({ length: 34 }, () => {
      const angle = rand() * Math.PI * 2;
      const radius = 9.9 + rand() * 1.0;
      return {
        x: Math.sin(angle) * radius,
        z: Math.cos(angle) * radius,
        color: FLOWER_COLORS[Math.floor(rand() * FLOWER_COLORS.length)]!,
        scale: 0.75 + rand() * 0.5,
      };
    });
  }, []);

  const bushes = useMemo(() => {
    const rand = seeded(83);
    return Array.from({ length: 14 }, (_, i) => {
      const angle = ((i * 51 + 18) * Math.PI) / 180;
      const radius = 8.1 + rand() * 1.1;
      return { x: Math.sin(angle) * radius, z: Math.cos(angle) * radius, scale: 0.65 + rand() * 0.4 };
    });
  }, []);

  const tufts = useMemo(() => {
    const rand = seeded(5);
    return Array.from({ length: 46 }, () => {
      const angle = rand() * Math.PI * 2;
      const radius = 8.2 + rand() * 2.6;
      return { x: Math.sin(angle) * radius, z: Math.cos(angle) * radius, scale: 0.5 + rand() * 0.7 };
    });
  }, []);

  return (
    <group>
      {flowers.map((f, i) => (
        <Flower key={`flower-${i}`} x={f.x} z={f.z} color={f.color} scale={f.scale} />
      ))}
      {bushes.map((b, i) => (
        <Bush key={`bush-${i}`} x={b.x} z={b.z} scale={b.scale} />
      ))}
      {tufts.map((t, i) => (
        <group key={`tuft-${i}`} position={[t.x, 0, t.z]} scale={t.scale}>
          {[0, 1, 2].map((j) => (
            <mesh key={j} position={[j * 0.04 - 0.04, 0.09, j * 0.02]} rotation={[0, 0, (j - 1) * 0.3]}>
              <coneGeometry args={[0.025, 0.22, 4]} />
              <meshStandardMaterial color={j % 2 === 0 ? '#5c9d5f' : '#79b873'} roughness={0.95} />
            </mesh>
          ))}
        </group>
      ))}
      <Lamp x={-7.15} z={1.0} />
      <Lamp x={7.15} z={1.0} />
      <Lamp x={-2.9} z={7.2} />
      <Lamp x={2.9} z={7.2} />
      <Bench x={4.4} z={8.35} rotation={-0.35} />
      <Bench x={-4.4} z={8.35} rotation={0.35} />
      <Cloud x={-9.5} y={7.6} z={-8.0} scale={0.8} />
      <Cloud x={9.5} y={8.1} z={-6.0} scale={0.65} />
      <Cloud x={-3.0} y={9.2} z={-12.0} scale={0.9} />
      <Cloud x={13.0} y={10.1} z={-2.0} scale={0.55} />
      <Cloud x={-13.0} y={9.8} z={-4.0} scale={0.6} />
      <Cloud x={4.0} y={11.0} z={-16.0} scale={0.45} />
      <Petals />
    </group>
  );
}
