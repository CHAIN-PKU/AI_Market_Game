import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CatmullRomCurve3, TubeGeometry, Vector3, type Group } from 'three';
import { ISLAND } from '../visual-lab/islandLayout';

const SAND = '#e8d3a8';
const SAND_DARK = '#d4b985';
const ROCK = '#8d8a80';
const ROCK_DARK = '#6f716b';
const WOOD = '#8a5a34';
const WOOD_DARK = '#5e3d24';
const LEAF = '#4f9b57';
const LEAF_LIGHT = '#72b86a';

function Box({ size, position, color, rotation }: { size: [number, number, number]; position: [number, number, number]; color: string; rotation?: [number, number, number] }) {
  return (
    <mesh castShadow receiveShadow position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.92} />
    </mesh>
  );
}

function Palm({ x, z, scale = 1, lean = 0.16 }: { x: number; z: number; scale?: number; lean?: number }) {
  const crown = useMemo(() => new Vector3(lean * 0.9, 2.72, lean * 0.35), [lean]);
  const trunkGeometry = useMemo(() => {
    const curve = new CatmullRomCurve3([
      new Vector3(0, 0, 0),
      new Vector3(lean * 0.12, 0.7, lean * 0.02),
      new Vector3(lean * 0.36, 1.45, lean * 0.12),
      crown,
    ]);
    return new TubeGeometry(curve, 12, 0.095, 6, false);
  }, [crown, lean]);
  const leaves = useMemo(() => Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2), []);
  return (
    <group position={[x, 0, z]} scale={scale}>
      <mesh castShadow receiveShadow geometry={trunkGeometry}>
        <meshStandardMaterial color={WOOD} roughness={0.95} />
      </mesh>
      {/* trunk rings */}
      {[0.45, 0.95, 1.45, 1.95, 2.4].map((y, i) => (
        <mesh key={y} castShadow position={[lean * (y / 2.72) * 0.5, y, lean * (y / 2.72) * 0.16]}>
          <torusGeometry args={[0.09, 0.012, 5, 10]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#9d6b3f' : WOOD_DARK} roughness={0.95} />
        </mesh>
      ))}
      {/* crown hub hides the leaf/trunk seam */}
      <mesh position={crown} castShadow>
        <sphereGeometry args={[0.19, 8, 6]} />
        <meshStandardMaterial color="#5f7f3f" roughness={0.9} />
      </mesh>
      {/* leaves start exactly at the crown hub, not floating around it */}
      {leaves.map((a, i) => (
        <group key={i} position={crown} rotation={[0, a, 0]}>
          <mesh castShadow position={[0, -0.02, 0.62]} rotation={[Math.PI / 2 - 0.18, 0, 0]}>
            <coneGeometry args={[0.17, 1.28, 4]} />
            <meshStandardMaterial color={i % 2 === 0 ? LEAF : LEAF_LIGHT} roughness={0.88} side={2} />
          </mesh>
        </group>
      ))}
      {[0, 1, 2].map((i) => (
        <mesh key={`c-${i}`} position={[crown.x + Math.cos(i * 2.1) * 0.16, crown.y - 0.16, crown.z + Math.sin(i * 2.1) * 0.16]} castShadow>
          <sphereGeometry args={[0.075, 7, 5]} />
          <meshStandardMaterial color="#8d5a2f" roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function Rock({ x, z, y = 0, scale = 1, rotation = 0 }: { x: number; z: number; y?: number; scale?: number; rotation?: number }) {
  return (
    <mesh castShadow receiveShadow position={[x, y, z]} rotation={[0.2, rotation, 0.1]} scale={[scale, scale * 0.72, scale * 0.9]}>
      <dodecahedronGeometry args={[0.62, 0]} />
      <meshStandardMaterial color={ROCK} roughness={1} flatShading />
    </mesh>
  );
}

function Dock() {
  const planks = Array.from({ length: 9 }, (_, i) => i);
  return (
    <group position={[10.4, 0, 4.6]} rotation={[0, -0.7, 0]}>
      {[-0.75, 0.75].map((x) => [0, 2.1, 4.2].map((z) => (
        <mesh key={`${x}-${z}`} castShadow position={[x, -0.62, z]}>
          <cylinderGeometry args={[0.075, 0.09, 2.2, 6]} />
          <meshStandardMaterial color={WOOD_DARK} roughness={1} />
        </mesh>
      )))}
      {planks.map((i) => (
        <Box key={i} size={[1.7, 0.08, 0.46]} position={[0, 0.03, i * 0.48]} color={i % 2 === 0 ? WOOD : '#9b6a3e'} />
      ))}
      {[-0.85, 0.85].map((x) => (
        <Box key={`rail-${x}`} size={[0.07, 0.55, 4.2]} position={[x, 0.35, 1.9]} color={WOOD_DARK} />
      ))}
      <mesh position={[0, 1.25, 4.45]} castShadow>
        <cylinderGeometry args={[0.045, 0.06, 1.6, 6]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.8} />
      </mesh>
      <mesh position={[0, 2.06, 4.45]}>
        <boxGeometry args={[0.24, 0.3, 0.24]} />
        <meshStandardMaterial color="#ffd98a" emissive="#e0a94f" emissiveIntensity={1.2} roughness={0.3} />
      </mesh>
      <pointLight position={[0, 2.05, 4.45]} intensity={0.55} distance={5} color="#ffd98a" />
      <Box size={[0.5, 0.45, 0.5]} position={[-1.25, 0.25, 0.45]} color="#b8842f" />
      <Box size={[0.4, 0.35, 0.4]} position={[-1.2, 0.6, 0.42]} color="#c9963d" rotation={[0, 0.3, 0]} />
      <mesh position={[1.25, 0.28, 0.4]} castShadow>
        <cylinderGeometry args={[0.22, 0.24, 0.5, 8]} />
        <meshStandardMaterial color="#7c5a37" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Boat() {
  return (
    <group position={[13.0, -1.05, 7.0]} rotation={[0, 0.5, 0]}>
      <mesh castShadow position={[0, 0.12, 0]} rotation={[0, 0, 0.08]}>
        <boxGeometry args={[1.1, 0.4, 2.1]} />
        <meshStandardMaterial color="#2f6f75" roughness={0.65} />
      </mesh>
      <mesh castShadow position={[0, 0.3, 0]} rotation={[0.1, 0, 0]}>
        <boxGeometry args={[0.95, 0.2, 1.8]} />
        <meshStandardMaterial color="#d8b278" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.95, 0.2]} castShadow>
        <cylinderGeometry args={[0.035, 0.05, 1.5, 6]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.8} />
      </mesh>
      <mesh position={[0.48, 0.95, 0.05]} rotation={[0, 0, -0.12]}>
        <planeGeometry args={[0.85, 0.8]} />
        <meshStandardMaterial color="#f7ead2" roughness={0.9} side={2} />
      </mesh>
      <mesh position={[0, 0.16, -0.95]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[0.7, 0.06, 0.2]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.9} />
      </mesh>
    </group>
  );
}

function Lighthouse() {
  return (
    <group position={[-12.3, -0.9, 4.2]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.34, 0]} receiveShadow>
        <circleGeometry args={[1.35, 18]} />
        <meshStandardMaterial color={SAND_DARK} roughness={1} />
      </mesh>
      <mesh receiveShadow castShadow position={[0, 0.18, 0]} scale={[3.0, 1.7, 2.8]}>
        <dodecahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial color={ROCK_DARK} roughness={1} flatShading />
      </mesh>
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.58, 2.4, 8]} />
        <meshStandardMaterial color="#f2e7d4" roughness={0.9} />
      </mesh>
      {[0.45, 1.25, 2.05].map((y) => (
        <mesh key={y} position={[0, y, 0]} castShadow>
          <cylinderGeometry args={[0.5, 0.5, 0.18, 8]} />
          <meshStandardMaterial color="#c96d52" roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 2.55, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.32, 0.34, 8]} />
        <meshStandardMaterial color="#f8f0dd" emissive="#ffd98a" emissiveIntensity={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0, 2.95, 0]} castShadow>
        <coneGeometry args={[0.38, 0.42, 8]} />
        <meshStandardMaterial color="#3f6f75" roughness={0.75} />
      </mesh>
      <pointLight position={[0, 2.55, 0]} intensity={0.8} distance={9} color="#ffd98a" />
    </group>
  );
}

function Seagulls() {
  const refs = useRef<(Group | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    refs.current.forEach((g, i) => {
      if (!g) return;
      g.position.y = 5.2 + Math.sin(t * 0.6 + i) * 0.55;
      g.position.x = -5 + Math.sin(t * 0.18 + i * 2.1) * 5.4;
      g.position.z = -3 + Math.cos(t * 0.22 + i * 1.7) * 4.6;
      g.rotation.y = t * 0.3 + i;
    });
  });
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <group key={i} ref={(g) => { refs.current[i] = g; }}>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.08, 6, 4]} />
            <meshStandardMaterial color="#f7f0df" roughness={0.9} />
          </mesh>
          <mesh position={[-0.18, 0, 0]} rotation={[0, 0, 0.18 + Math.sin(i) * 0.1]}>
            <boxGeometry args={[0.34, 0.02, 0.12]} />
            <meshStandardMaterial color="#f7f0df" roughness={0.9} />
          </mesh>
          <mesh position={[0.18, 0, 0]} rotation={[0, 0, -0.18 - Math.sin(i) * 0.1]}>
            <boxGeometry args={[0.34, 0.02, 0.12]} />
            <meshStandardMaterial color="#f7f0df" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function BeachSpot({ x, z, umbrella = '#d97a52' }: { x: number; z: number; umbrella?: string }) {
  return (
    <group position={[x, 0.025, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.25, 24]} />
        <meshStandardMaterial color={SAND} roughness={1} />
      </mesh>
      <mesh position={[0.3, 0.32, 0.1]} rotation={[0, 0, -0.25]} castShadow>
        <cylinderGeometry args={[0.025, 0.035, 1.7, 6]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.8} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh key={i} position={[0.3 + Math.sin((i / 6) * Math.PI * 2) * 0.72, 1.14, 0.1 + Math.cos((i / 6) * Math.PI * 2) * 0.72]} rotation={[0.2, (i / 6) * Math.PI * 2, 0.35]} castShadow>
          <coneGeometry args={[0.24, 0.75, 4]} />
          <meshStandardMaterial color={i % 2 === 0 ? umbrella : '#f7ead2'} roughness={0.9} side={2} />
        </mesh>
      ))}
      <mesh position={[-0.5, 0.03, 0.55]} rotation={[-Math.PI / 2, 0, 0.25]}>
        <planeGeometry args={[0.9, 1.35]} />
        <meshStandardMaterial color="#8f7cc9" roughness={0.9} side={2} />
      </mesh>
      <mesh position={[0.65, 0.18, 0.65]} castShadow>
        <sphereGeometry args={[0.18, 10, 8]} />
        <meshStandardMaterial color="#f6d36b" roughness={0.65} />
      </mesh>
      <Rock x={-0.85} z={-0.55} scale={0.35} />
    </group>
  );
}

function Shell({ x, z, rotation = 0 }: { x: number; z: number; rotation?: number }) {
  return (
    <group position={[x, 0.03, z]} rotation={[0, rotation, 0]} scale={0.7}>
      <mesh castShadow>
        <sphereGeometry args={[0.09, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#f7e6cc" roughness={0.8} side={2} />
      </mesh>
      <mesh position={[0, 0.015, 0.02]} rotation={[-0.4, 0, 0]}>
        <boxGeometry args={[0.02, 0.06, 0.02]} />
        <meshStandardMaterial color="#d9b98a" roughness={0.8} />
      </mesh>
    </group>
  );
}

function BeachDetails() {
  const patches = useMemo(
    () => [
      [10.3, 5.4, 1.6, 0.6], [-10.7, 4.4, 1.3, 0.55], [7.8, 9.0, 1.1, 0.5],
      [-7.9, 8.7, 1.2, 0.6], [11.2, -2.2, 1.0, 0.5], [-11.0, -3.1, 1.2, 0.55],
    ],
    [],
  );
  const shells = useMemo(
    () => [
      [10.2, 6.2, 0.4], [-9.9, 6.7, 1.3], [8.6, 8.3, 2.1], [-8.4, 8.2, 0.7],
      [10.8, 4.0, 1.8], [-10.9, 3.5, 0.2],
    ],
    [],
  );
  return (
    <group>
      {/* wet sand line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0]}>
        <ringGeometry args={[ISLAND.grassRadius + 0.55, ISLAND.grassRadius + 1.55, 80]} />
        <meshStandardMaterial color="#c8a878" transparent opacity={0.78} roughness={0.7} />
      </mesh>
      {/* irregular dry-sand patches break the perfect ring */}
      {patches.map(([x, z, sx, sz], i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, i * 0.7]} position={[x, 0.026, z]} scale={[sx, sz, 1]} receiveShadow>
          <circleGeometry args={[0.9, 18]} />
          <meshStandardMaterial color={i % 2 === 0 ? SAND : '#efddb8'} roughness={1} />
        </mesh>
      ))}
      {/* tide foam */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[ISLAND.grassRadius + 1.55, ISLAND.grassRadius + 1.72, 80]} />
        <meshStandardMaterial color="#f7fff9" transparent opacity={0.55} roughness={0.3} />
      </mesh>
      {shells.map(([x, z, r], i) => <Shell key={i} x={x} z={z} rotation={r} />)}
      {/* driftwood */}
      {[[9.6, 6.6, 0.3], [-9.5, 7.1, -0.4], [10.8, 3.0, 0.9]].map(([x, z, r], i) => (
        <group key={i} position={[x, 0.14, z]} rotation={[0, r, 0]}>
          <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.06, 0.09, 0.8, 5]} />
            <meshStandardMaterial color="#8a6a4b" roughness={1} />
          </mesh>
          {[-0.25, 0.2].map((px) => (
            <mesh key={px} position={[px, 0.1, 0.1]} rotation={[0.4, 0, 0.5]}>
              <cylinderGeometry args={[0.025, 0.04, 0.35, 4]} />
              <meshStandardMaterial color="#9d7a54" roughness={1} />
            </mesh>
          ))}
        </group>
      ))}
      {/* beach grass */}
      {[[9.1, 6.9], [-9.2, 7.4], [10.2, 4.8], [-10.2, 4.2]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          {[0, 1, 2, 3].map((j) => (
            <mesh key={j} position={[j * 0.05 - 0.06, 0.12, j * 0.02]} rotation={[0, 0, (j - 1.5) * 0.25]}>
              <coneGeometry args={[0.025, 0.28 + j * 0.04, 4]} />
              <meshStandardMaterial color={j % 2 === 0 ? '#5c9d5f' : '#79b873'} roughness={0.95} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function DistantIsland({ x, z, scale = 1 }: { x: number; z: number; scale?: number }) {
  return (
    <group position={[x, -1.45, z]} scale={scale}>
      <mesh castShadow receiveShadow position={[0, 0.3, 0]}>
        <cylinderGeometry args={[1.5, 1.8, 0.55, 16]} />
        <meshStandardMaterial color="#7fa96b" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.59, 0]}>
        <circleGeometry args={[1.45, 16]} />
        <meshStandardMaterial color={SAND} roughness={1} />
      </mesh>
      <Palm x={0.3} z={0.2} scale={0.55} lean={0.1} />
      <Rock x={-0.7} z={-0.4} scale={0.5} y={0.2} />
    </group>
  );
}

export function IslandLife() {
  const rocks = useMemo(
    () => [
      [11.3, 2.1, 0.95, 0.6], [10.9, -6.2, 0.7, 0.8], [8.4, 9.4, 1.0, 0.5],
      [-11.4, 3.4, 0.8, 0.7], [-10.2, -7.8, 1.15, 0.9], [-7.2, 9.6, 0.65, 0.5],
      [12.6, -4.0, 1.05, 1.2], [-12.2, -1.8, 0.9, 0.9],
    ],
    [],
  );
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow>
        <ringGeometry args={[ISLAND.grassRadius - 0.25, ISLAND.grassRadius + 0.95, 80]} />
        <meshStandardMaterial color={SAND} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <ringGeometry args={[ISLAND.grassRadius + 0.9, ISLAND.grassRadius + 2.2, 80]} />
        <meshStandardMaterial color={SAND_DARK} transparent opacity={0.55} roughness={1} />
      </mesh>
      {rocks.map(([x, z, scale, rot], i) => (
        <Rock key={i} x={x} z={z} y={i % 3 === 0 ? -0.34 : 0} scale={scale} rotation={rot} />
      ))}
      {[[9.2, 7.4], [-8.6, 8.2]].map(([x, z], i) => (
        <group key={i} position={[x, 0.02, z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.55, 16]} />
            <meshStandardMaterial color="#7fc6c8" roughness={0.2} metalness={0.1} transparent opacity={0.85} />
          </mesh>
          <Rock x={0.5} z={0.2} scale={0.32} />
        </group>
      ))}
      <Palm x={10.1} z={3.4} scale={1.05} />
      <Palm x={-10.3} z={-1.6} scale={0.9} lean={-0.12} />
      <Palm x={4.9} z={10.3} scale={0.8} />
      <Dock />
      <Boat />
      <BeachSpot x={8.7} z={7.8} umbrella="#d97a52" />
      <BeachSpot x={-9.2} z={7.9} umbrella="#3f8f96" />
      <Lighthouse />
      <Seagulls />
      <BeachDetails />
      <DistantIsland x={-15.5} z={-10.5} scale={0.85} />
      <DistantIsland x={15.2} z={-12.0} scale={0.65} />
    </group>
  );
}
