import { useMemo } from 'react';
import { BufferGeometry, DoubleSide, Float32BufferAttribute } from 'three';
import type { BuildingRole } from '../visual-lab/islandLayout';

type Style = {
  wall: string;
  roof: string;
  roofAlt: string;
  trim: string;
  door: string;
};

const STYLE: Record<BuildingRole, Style> = {
  market: { wall: '#f4e3c3', roof: '#3f8f96', roofAlt: '#79c0bc', trim: '#d97a52', door: '#8b5e3c' },
  skill: { wall: '#f6e8d8', roof: '#8b6db0', roofAlt: '#b39ad4', trim: '#e0a94f', door: '#6b4a2f' },
  coding: { wall: '#e8f0ec', roof: '#2f6f75', roofAlt: '#5fa7a4', trim: '#3f8f96', door: '#4b5a52' },
  research: { wall: '#eef1f7', roof: '#6f9dc9', roofAlt: '#a8c8e4', trim: '#3f6f9c', door: '#43566b' },
  design: { wall: '#fbeee4', roof: '#d97a52', roofAlt: '#efab7f', trim: '#b85a3a', door: '#7a4b2a' },
  'public-rd': { wall: '#f7f0df', roof: '#b8842f', roofAlt: '#e0b85f', trim: '#8a5a2f', door: '#6b4a2f' },
  homes: { wall: '#f9f0df', roof: '#7cbf7a', roofAlt: '#a9dc9a', trim: '#4f8b52', door: '#8b5e3c' },
};

function Box({
  size,
  position,
  color,
  rotation,
  roughness = 0.86,
}: {
  size: [number, number, number];
  position: [number, number, number];
  color: string;
  rotation?: [number, number, number];
  roughness?: number;
}) {
  return (
    <mesh castShadow receiveShadow position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={0.02} />
    </mesh>
  );
}

function Window({
  position,
  rotation,
  trim,
  withFlowers = false,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  trim: string;
  withFlowers?: boolean;
}) {
  return (
    <group position={position} rotation={rotation}>
      <Box size={[0.44, 0.42, 0.05]} position={[0, 0, 0]} color="#fbf5e8" />
      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[0.34, 0.32, 0.035]} />
        <meshStandardMaterial color="#a9e4dc" emissive="#7fb9a8" emissiveIntensity={0.22} roughness={0.22} metalness={0.08} />
      </mesh>
      <Box size={[0.03, 0.32, 0.045]} position={[0, 0, 0.05]} color="#fbf5e8" />
      <Box size={[0.34, 0.03, 0.045]} position={[0, 0, 0.05]} color="#fbf5e8" />
      <Box size={[0.5, 0.05, 0.07]} position={[0, -0.24, 0]} color={trim} />
      {withFlowers && (
        <group position={[0, -0.2, 0.09]}>
          {[-0.15, 0, 0.15].map((x, i) => (
            <mesh key={i} position={[x, 0.04, 0]} castShadow>
              <sphereGeometry args={[0.04, 7, 5]} />
              <meshStandardMaterial color={['#f3a6b8', '#f6d36b', '#f7efe0'][i]} roughness={0.75} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

export function CozyBuilding({ role, height, width }: { role: BuildingRole; height: number; width: number }) {
  const s = STYLE[role];
  const w = width;
  const d = width * 0.68;
  const base = 0.16;
  const wallH = height * 0.55;
  const wallTop = base + wallH;
  const peak = wallTop + height * 0.43;
  const halfD = d / 2 + 0.18;
  const slope = Math.hypot(halfD, peak - wallTop);
  const angle = Math.atan2(peak - wallTop, halfD);
  const rows = 4;
  const frontZ = d / 2 + 0.025;
  const backZ = -d / 2 - 0.025;

  const gable = useMemo(() => {
    const geo = new BufferGeometry();
    const y0 = wallTop;
    const y1 = peak;
    const x = w / 2;
    geo.setAttribute(
      'position',
      new Float32BufferAttribute(
        [
          -x, y0, -d / 2, -x, y0, d / 2, -x, y1, 0,
          x, y0, d / 2, x, y0, -d / 2, x, y1, 0,
        ],
        3,
      ),
    );
    geo.computeVertexNormals();
    return geo;
  }, [w, d, wallTop, peak]);

  return (
    <group>
      {/* stone foundation */}
      <Box size={[w + 0.2, base, d + 0.2]} position={[0, base / 2, 0]} color="#c4b7a2" />
      {/* plaster walls */}
      <Box size={[w, wallH, d]} position={[0, base + wallH / 2, 0]} color={s.wall} roughness={0.95} />
      {/* timber frame */}
      {[-w / 2, w / 2].map((x) =>
        [-d / 2, d / 2].map((z) => (
          <Box key={`${x}-${z}`} size={[0.08, wallH, 0.08]} position={[x, base + wallH / 2, z]} color={s.trim} roughness={0.9} />
        )),
      )}
      {[0.35, 0.95].map((y) => (
        <Box key={`beam-${y}`} size={[w + 0.04, 0.055, d + 0.04]} position={[0, base + wallH * y, 0]} color={s.trim} roughness={0.9} />
      ))}
      {/* door */}
      <Box size={[0.54, 0.68, 0.07]} position={[0, base + 0.36, frontZ]} color={s.door} />
      <Box size={[0.62, 0.74, 0.04]} position={[0, base + 0.36, frontZ + 0.02]} color={s.trim} />
      <mesh position={[0.18, base + 0.34, frontZ + 0.08]} castShadow>
        <sphereGeometry args={[0.035, 6, 4]} />
        <meshStandardMaterial color="#e0a94f" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* awning */}
      <group position={[0, base + 0.92, frontZ + 0.15]} rotation={[0.22, 0, 0]}>
        {[-0.42, -0.14, 0.14, 0.42].map((x, i) => (
          <Box key={i} size={[0.28, 0.045, 0.48]} position={[x, 0, 0]} color={i % 2 === 0 ? s.trim : '#f7ead2'} />
        ))}
      </group>
      {/* windows: front, back, sides */}
      <Window position={[-0.68, base + 0.9, frontZ + 0.01]} trim={s.trim} withFlowers />
      <Window position={[0.68, base + 0.9, frontZ + 0.01]} trim={s.trim} withFlowers />
      <Window position={[-0.68, base + 0.9, backZ - 0.01]} rotation={[0, Math.PI, 0]} trim={s.trim} />
      <Window position={[0.68, base + 0.9, backZ - 0.01]} rotation={[0, Math.PI, 0]} trim={s.trim} />
      <Window position={[-w / 2 - 0.01, base + 0.95, 0]} rotation={[0, -Math.PI / 2, 0]} trim={s.trim} />
      <Window position={[w / 2 + 0.01, base + 0.95, 0]} rotation={[0, Math.PI / 2, 0]} trim={s.trim} />
      {/* hanging sign */}
      <Box size={[0.82, 0.24, 0.06]} position={[0, base + 1.45, frontZ + 0.06]} color={s.trim} />
      <Box size={[0.64, 0.12, 0.03]} position={[0, base + 1.45, frontZ + 0.1]} color="#fdf7e9" />
      {/* gable ends */}
      <mesh geometry={gable}>
        <meshStandardMaterial color={s.wall} roughness={0.95} side={DoubleSide} />
      </mesh>
      {/* roof slabs */}
      {[1, -1].map((side) => (
        <group key={`roof-${side}`}>
          <Box
            size={[w + 0.55, 0.13, slope]}
            position={[0, (wallTop + peak) / 2, side * halfD / 2]}
            rotation={[side * angle, 0, 0]}
            color={s.roof}
            roughness={0.78}
          />
          {Array.from({ length: rows }, (_, i) => {
            const t = (i + 0.5) / rows;
            const z = side * halfD * t;
            const y = peak - (peak - wallTop) * t + 0.07;
            return (
              <Box
                key={`shingle-${side}-${i}`}
                size={[w + 0.58, 0.055, (halfD / rows) * 1.05]}
                position={[0, y, z]}
                rotation={[side * angle, 0, 0]}
                color={i % 2 === 0 ? s.roofAlt : s.roof}
                roughness={0.82}
              />
            );
          })}
        </group>
      ))}
      {/* ridge */}
      <Box size={[w + 0.6, 0.09, 0.12]} position={[0, peak + 0.03, 0]} color={s.roofAlt} />
      {/* role toppers */}
      {role === 'coding' && (
        <group position={[0, peak + 0.1, 0]}>
          <mesh position={[0, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.018, 0.028, 0.6, 5]} />
            <meshStandardMaterial color="#4b5a52" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.62, 0]}>
            <sphereGeometry args={[0.06, 8, 6]} />
            <meshStandardMaterial color="#e46d5c" emissive="#c84a3a" emissiveIntensity={1.1} />
          </mesh>
        </group>
      )}
      {role === 'research' && (
        <mesh position={[0, peak + 0.02, 0]} castShadow>
          <sphereGeometry args={[0.36, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#b7e3da" roughness={0.25} metalness={0.15} emissive="#3f8f96" emissiveIntensity={0.25} />
        </mesh>
      )}
      {role === 'public-rd' && (
        <group position={[w / 2 - 0.3, 0, 0]}>
          <mesh position={[0, height + 0.45, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.03, 0.9, 5]} />
            <meshStandardMaterial color="#6d7d76" roughness={0.8} />
          </mesh>
          <Box size={[0.45, 0.26, 0.03]} position={[0.25, height + 0.78, 0]} color={s.trim} />
        </group>
      )}
      {role === 'design' && (
        <group position={[0, peak + 0.05, 0]}>
          <Box size={[0.5, 0.34, 0.04]} position={[0, 0.18, 0]} color="#fbf4e6" rotation={[-0.1, 0.2, 0]} />
          {[-0.14, 0, 0.14].map((x, i) => (
            <mesh key={i} position={[x, 0.2, 0.04]}>
              <sphereGeometry args={[0.035, 7, 5]} />
              <meshStandardMaterial color={['#d97a52', '#3f8f96', '#e0a94f'][i]} roughness={0.7} />
            </mesh>
          ))}
        </group>
      )}
      {role === 'market' && (
        <group position={[0, peak + 0.05, 0]}>
          <mesh position={[0, 0.35, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.03, 0.7, 5]} />
            <meshStandardMaterial color="#6d7d76" roughness={0.8} />
          </mesh>
          <Box size={[0.5, 0.28, 0.03]} position={[0.25, 0.62, 0]} color="#d97a52" />
        </group>
      )}
      {role === 'skill' && (
        <group position={[0, peak + 0.05, 0]}>
          <Box size={[0.42, 0.3, 0.04]} position={[0, 0.16, 0]} color="#8f7cc9" />
          <mesh position={[0, 0.16, 0.03]}>
            <boxGeometry args={[0.3, 0.18, 0.03]} />
            <meshStandardMaterial color="#f4eaff" emissive="#b9a6e0" emissiveIntensity={0.5} roughness={0.4} />
          </mesh>
        </group>
      )}
      {/* chimney + smoke */}
      <Box size={[0.2, 0.5, 0.2]} position={[w * 0.25, peak - 0.08, -d * 0.22]} color="#b98d60" />
      {[0, 1, 2].map((i) => (
        <mesh key={`smoke-${i}`} position={[w * 0.25 + i * 0.06, peak + 0.22 + i * 0.14, -d * 0.22]}>
          <sphereGeometry args={[0.07 + i * 0.03, 7, 5]} />
          <meshStandardMaterial color="#f5f1e8" transparent opacity={0.26 - i * 0.05} roughness={1} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}
