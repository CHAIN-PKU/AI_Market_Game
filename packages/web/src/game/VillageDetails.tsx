import { useMemo } from 'react';
import { BUILDING_SLOTS } from '../visual-lab/islandLayout';

const STONE = '#cdbfa7';
const STONE_DARK = '#b8aa92';
const WOOD = '#8a5a34';
const GREEN = '#5f9e62';

function Box({ size, position, color, rotation }: { size: [number, number, number]; position: [number, number, number]; color: string; rotation?: [number, number, number] }) {
  return (
    <mesh castShadow receiveShadow position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.95} />
    </mesh>
  );
}

function Paths() {
  const paths = useMemo(
    () =>
      BUILDING_SLOTS.map((slot) => {
        const a = Math.atan2(slot.position[0], slot.position[2]);
        return {
          x: Math.sin(a) * 8.1,
          z: Math.cos(a) * 8.1,
          rot: a,
        };
      }),
    [],
  );
  return (
    <group>
      {paths.map((p, i) => (
        <group key={i} position={[p.x, 0.018, p.z]} rotation={[0, p.rot, 0]}>
          <Box size={[0.7, 0.035, 1.55]} position={[0, 0, 0]} color={i % 2 === 0 ? STONE : STONE_DARK} />
          {[-0.55, 0, 0.55].map((z) => (
            <Box key={z} size={[0.74, 0.04, 0.22]} position={[0, 0.01, z]} color={i % 2 === 0 ? STONE_DARK : STONE} />
          ))}
        </group>
      ))}
    </group>
  );
}

function Fountain() {
  return (
    <group position={[0, 0.02, 0]}>
      <mesh receiveShadow castShadow position={[0, 0.12, 0]}>
        <cylinderGeometry args={[1.15, 1.3, 0.24, 24]} />
        <meshStandardMaterial color="#c9bda8" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.25, 0]}>
        <circleGeometry args={[1.02, 24]} />
        <meshStandardMaterial color="#74c2c9" roughness={0.2} metalness={0.1} transparent opacity={0.9} />
      </mesh>
      <mesh castShadow position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.18, 0.28, 0.65, 10]} />
        <meshStandardMaterial color="#dfd2bb" roughness={0.85} />
      </mesh>
      <mesh castShadow position={[0, 0.95, 0]}>
        <sphereGeometry args={[0.26, 12, 8]} />
        <meshStandardMaterial color="#9fd8d2" roughness={0.4} metalness={0.1} />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.45, 0.88, Math.sin(a) * 0.45]} rotation={[0.2, a, 0.2]}>
            <cylinderGeometry args={[0.025, 0.04, 0.7, 5]} />
            <meshStandardMaterial color="#d8f4f0" transparent opacity={0.55} roughness={0.2} />
          </mesh>
        );
      })}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh key={`f-${i}`} position={[Math.cos(a) * 1.55, 0.08, Math.sin(a) * 1.55]} castShadow>
            <sphereGeometry args={[0.12, 7, 5]} />
            <meshStandardMaterial color={i % 2 === 0 ? '#f3a6b8' : '#f6d36b'} roughness={0.8} />
          </mesh>
        );
      })}
    </group>
  );
}

function Garden() {
  return (
    <group position={[7.6, 0, 9.1]} rotation={[0, -0.55, 0]}>
      {[0, 1, 2].map((i) => (
        <group key={i} position={[0, 0, i * 0.55]}>
          <Box size={[1.6, 0.16, 0.42]} position={[0, 0.08, 0]} color="#8a5a34" />
          <Box size={[1.5, 0.08, 0.32]} position={[0, 0.18, 0]} color="#6b4a2f" />
          {[-0.5, 0, 0.5].map((x, j) => (
            <group key={j} position={[x, 0.22, 0]}>
              <mesh castShadow>
                <sphereGeometry args={[0.12, 6, 4]} />
                <meshStandardMaterial color={j % 2 === 0 ? GREEN : '#7cbf7a'} roughness={0.9} />
              </mesh>
              <mesh position={[0, 0.11, 0]}>
                <sphereGeometry args={[0.055, 5, 4]} />
                <meshStandardMaterial color={i === 1 ? '#e46d5c' : '#f6d36b'} roughness={0.75} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
      <mesh castShadow position={[-1.05, 0.45, 0.55]}>
        <cylinderGeometry args={[0.04, 0.05, 0.9, 5]} />
        <meshStandardMaterial color="#6b4a2f" roughness={0.9} />
      </mesh>
      <mesh position={[-1.0, 0.92, 0.55]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.55, 0.32, 0.03]} />
        <meshStandardMaterial color="#f7ead2" roughness={0.8} />
      </mesh>
    </group>
  );
}

function MarketLights() {
  return (
    <group position={[-3.7, 0, -7.4]}>
      {[-1.8, 1.8].map((x) => (
        <mesh key={x} castShadow position={[x, 1.4, 0]}>
          <cylinderGeometry args={[0.035, 0.045, 2.8, 5]} />
          <meshStandardMaterial color={WOOD} roughness={0.9} />
        </mesh>
      ))}
      <Box size={[3.7, 0.02, 0.02]} position={[0, 2.55, 0]} color="#6b4a2f" />
      {[-1.4, -0.7, 0, 0.7, 1.4].map((x) => (
        <mesh key={x} position={[x, 2.45, 0]}>
          <sphereGeometry args={[0.08, 7, 5]} />
          <meshStandardMaterial color="#ffe2a0" emissive="#e0a94f" emissiveIntensity={1.1} />
        </mesh>
      ))}
    </group>
  );
}

function Well() {
  return (
    <group position={[-6.8, 0, 4.7]}>
      <mesh castShadow receiveShadow position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.48, 0.55, 0.55, 12]} />
        <meshStandardMaterial color="#b8aa92" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.57, 0]}>
        <circleGeometry args={[0.39, 12]} />
        <meshStandardMaterial color="#5b9ea8" roughness={0.25} />
      </mesh>
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} castShadow position={[x, 0.9, 0]}>
          <cylinderGeometry args={[0.04, 0.05, 1.3, 5]} />
          <meshStandardMaterial color={WOOD} roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 1.55, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.045, 0.045, 1.2, 6]} />
        <meshStandardMaterial color="#6b4a2f" roughness={0.9} />
      </mesh>
    </group>
  );
}

export function VillageDetails() {
  return (
    <group>
      <Paths />
      <Fountain />
      <Garden />
      <MarketLights />
      <Well />
    </group>
  );
}
