import type { BuildingRole } from '../visual-lab/islandLayout';

const WOOD = '#8a5a34';
const DARK = '#5e3d24';
const METAL = '#59645f';
const CREAM = '#f7ead2';
const GLASS = '#a9e4dc';

function B({ size, pos, color, rot }: { size: [number, number, number]; pos: [number, number, number]; color: string; rot?: [number, number, number] }) {
  return (
    <mesh castShadow receiveShadow position={pos} rotation={rot}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  );
}

function C({ r1, r2, h, pos, color, rot }: { r1: number; r2: number; h: number; pos: [number, number, number]; color: string; rot?: [number, number, number] }) {
  return (
    <mesh castShadow receiveShadow position={pos} rotation={rot}>
      <cylinderGeometry args={[r1, r2, h, 8]} />
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
  );
}

function Crate({ x, z, s = 1, color = '#b8842f' }: { x: number; z: number; s?: number; color?: string }) {
  return (
    <group position={[x, 0, z]} scale={s}>
      <B size={[0.5, 0.42, 0.5]} pos={[0, 0.23, 0]} color={color} />
      <B size={[0.52, 0.04, 0.06]} pos={[0, 0.31, 0.26]} color="#e0b85f" />
    </group>
  );
}

function Plant({ x, z, s = 1, color = '#5f9e62' }: { x: number; z: number; s?: number; color?: string }) {
  return (
    <group position={[x, 0, z]} scale={s}>
      <C r1={0.18} r2={0.14} h={0.26} pos={[0, 0.14, 0]} color="#b97a52" />
      {[0, 1, 2].map((i) => (
        <mesh key={i} castShadow position={[Math.sin(i * 2.1) * 0.08, 0.38 + i * 0.08, Math.cos(i * 2.1) * 0.06]}>
          <sphereGeometry args={[0.16, 7, 5]} />
          <meshStandardMaterial color={i === 1 ? '#7cbf7a' : color} roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

function Stall({ x, z, color }: { x: number; z: number; color: string }) {
  return (
    <group position={[x, 0, z]}>
      {[-0.55, 0.55].map((px) => <C key={px} r1={0.035} r2={0.045} h={1.1} pos={[px, 0.55, 0]} color={DARK} />)}
      <group position={[0, 1.12, 0]} rotation={[0.2, 0, 0]}>
        {[0, 1, 2, 3].map((i) => <B key={i} size={[0.3, 0.035, 0.65]} pos={[-0.45 + i * 0.3, 0, 0]} color={i % 2 === 0 ? color : CREAM} />)}
      </group>
      <B size={[1.2, 0.42, 0.32]} pos={[0, 0.26, 0.16]} color={WOOD} />
      {[-0.3, 0, 0.3].map((px, i) => (
        <mesh key={px} position={[px, 0.54 + (i % 2) * 0.06, 0.18]} castShadow>
          <sphereGeometry args={[0.11, 8, 6]} />
          <meshStandardMaterial color={['#e46d5c', '#e0b85f', '#7cbf7a'][i]} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function Research() {
  return (
    <group>
      <group position={[1.65, 0, 0.7]}>
        <B size={[0.9, 0.12, 1.25]} pos={[0, 0.06, 0]} color="#c4b7a2" />
        {[-0.4, 0.4].map((x) => [-0.55, 0.55].map((z) => <B key={`${x}-${z}`} size={[0.055, 1.05, 0.055]} pos={[x, 0.58, z]} color={CREAM} />))}
        <B size={[0.8, 0.055, 0.055]} pos={[0, 1.05, -0.55]} color={CREAM} />
        <mesh position={[0, 0.62, 0]}>
          <boxGeometry args={[0.78, 0.9, 1.08]} />
          <meshStandardMaterial color={GLASS} transparent opacity={0.24} roughness={0.1} metalness={0.1} />
        </mesh>
        <Plant x={-0.16} z={-0.25} s={0.72} />
        <Plant x={0.2} z={0.23} s={0.58} color="#72b86a" />
      </group>
      <group position={[-1.55, 0, 0.95]} rotation={[0, 0.28, 0]}>
        {[-0.2, 0.2].map((x) => <C key={x} r1={0.016} r2={0.024} h={1.0} pos={[x, 0.52, 0]} color={METAL} />)}
        <C r1={0.12} r2={0.16} h={0.9} pos={[0, 1.06, 0]} color="#e8e1d2" rot={[0.9, 0, 0]} />
        <C r1={0.16} r2={0.12} h={0.16} pos={[0, 1.45, 0.28]} color={METAL} rot={[0.9, 0, 0]} />
      </group>
      <C r1={0.02} r2={0.03} h={1.5} pos={[0.9, 1.55, -0.4]} color={METAL} />
      <mesh position={[0.9, 2.3, -0.4]} rotation={[0.35, 0.2, 0]}>
        <sphereGeometry args={[0.28, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2.3]} />
        <meshStandardMaterial color="#e8e1d2" roughness={0.35} side={2} />
      </mesh>
      <Crate x={1.2} z={1.35} s={0.65} />
    </group>
  );
}

function Market() {
  return (
    <group>
      <Stall x={-1.35} z={1.1} color="#d97a52" />
      <Stall x={1.35} z={1.1} color="#3f8f96" />
      <Crate x={-2.25} z={1.5} s={0.7} />
      <Crate x={2.25} z={1.55} s={0.6} color="#c9963d" />
    </group>
  );
}

function Coding() {
  return (
    <group>
      <group position={[1.6, 0, 0.8]}>
        <B size={[0.62, 1.25, 0.62]} pos={[0, 0.66, 0]} color="#33413d" />
        {Array.from({ length: 5 }, (_, i) => (
          <mesh key={i} position={[0, 0.25 + i * 0.2, 0.32]}>
            <boxGeometry args={[0.46, 0.07, 0.02]} />
            <meshStandardMaterial color="#a9e4dc" emissive="#5fb3c3" emissiveIntensity={0.9} />
          </mesh>
        ))}
        <C r1={0.02} r2={0.03} h={0.85} pos={[0.2, 1.72, 0]} color={METAL} />
      </group>
      <C r1={0.24} r2={0.24} h={0.12} pos={[-1.65, 0.16, 1.05]} color="#8a6a4b" rot={[Math.PI / 2, 0, 0]} />
      <C r1={0.12} r2={0.12} h={0.15} pos={[-1.65, 0.3, 1.05]} color="#2f6f75" />
      <Crate x={-1.8} z={1.45} s={0.65} color="#6f9dc9" />
    </group>
  );
}

function Design() {
  return (
    <group>
      <group position={[-1.45, 0, 1.0]} rotation={[0, 0.28, 0]}>
        {[-0.3, 0.3].map((x) => <C key={x} r1={0.018} r2={0.025} h={1.15} pos={[x, 0.58, 0]} color={DARK} rot={[0, 0, x * -0.5]} />)}
        <C r1={0.018} r2={0.025} h={1.0} pos={[0, 0.5, -0.22]} color={DARK} rot={[0.35, 0, 0]} />
        <B size={[0.85, 0.7, 0.04]} pos={[0, 1.02, 0.05]} color="#fbf4e6" rot={[-0.08, 0, 0]} />
        {[-0.22, 0, 0.22].map((x, i) => (
          <mesh key={i} position={[x, 1.05 + i * 0.04, 0.09]}>
            <sphereGeometry args={[0.07, 7, 5]} />
            <meshStandardMaterial color={['#d97a52', '#3f8f96', '#e0a94f'][i]} roughness={0.7} />
          </mesh>
        ))}
      </group>
      {[0.15, 0.38, 0.58].map((x, i) => <C key={x} r1={0.1} r2={0.1} h={0.24} pos={[1.35 + x, 0.15, 1.1]} color={['#d97a52', '#3f8f96', '#e0b85f'][i]} />)}
      <Plant x={1.8} z={1.45} s={0.7} />
    </group>
  );
}

function PublicRD() {
  return (
    <group>
      <group position={[0, 0, 1.15]}>
        <B size={[1.9, 0.22, 0.85]} pos={[0, 0.11, 0]} color="#b9a98f" />
        <B size={[1.9, 0.06, 0.12]} pos={[0, 0.25, 0.36]} color="#c96d52" />
        <Crate x={-0.55} z={0.2} s={0.8} />
        <Crate x={0.1} z={0.12} s={0.62} color="#c9963d" />
      </group>
      <C r1={0.02} r2={0.03} h={1.1} pos={[1.35, 1.0, 0.2]} color={METAL} />
      <B size={[0.7, 0.42, 0.04]} pos={[1.35, 1.55, 0.2]} color={CREAM} rot={[0, 0.4, 0]} />
    </group>
  );
}

function Homes() {
  return (
    <group>
      <group position={[0, 0, 1.1]}>
        <B size={[1.7, 0.1, 0.55]} pos={[0, 1.05, 0]} color={WOOD} />
        {[-0.78, 0.78].map((x) => <B key={x} size={[0.06, 0.55, 0.06]} pos={[x, 1.33, 0.22]} color={DARK} />)}
        {Array.from({ length: 6 }, (_, i) => <B key={i} size={[1.7, 0.035, 0.035]} pos={[0, 1.3 + i * 0.08, 0.22]} color={i % 2 === 0 ? WOOD : DARK} />)}
        <Plant x={-0.6} z={0.02} s={0.55} />
      </group>
      <C r1={0.02} r2={0.03} h={1.8} pos={[-1.25, 0.9, 1.5]} color={DARK} />
      <C r1={0.02} r2={0.03} h={1.8} pos={[1.25, 0.9, 1.5]} color={DARK} />
      <B size={[2.5, 0.015, 0.015]} pos={[0, 1.75, 1.5]} color="#f3e3cd" />
      {[-0.8, -0.2, 0.4, 0.9].map((x, i) => <B key={x} size={[0.28, 0.38, 0.025]} pos={[x, 1.5, 1.5]} color={['#d97a52', '#7cbf7a', '#8f7cc9', '#e0b85f'][i]} />)}
    </group>
  );
}

function Skill() {
  return (
    <group>
      <group position={[1.25, 0, 1.2]}>
        <B size={[1.25, 0.12, 0.6]} pos={[0, 0.54, 0]} color={WOOD} />
        {[-0.48, 0.48].map((x) => <B key={x} size={[0.08, 0.54, 0.5]} pos={[x, 0.28, 0]} color={DARK} />)}
        <B size={[0.4, 0.26, 0.06]} pos={[0, 0.85, 0.08]} color="#33413d" />
        <mesh position={[0, 0.98, 0.1]}>
          <boxGeometry args={[0.24, 0.12, 0.02]} />
          <meshStandardMaterial color="#b9a6e0" emissive="#8f7cc9" emissiveIntensity={0.5} />
        </mesh>
      </group>
      <Crate x={-1.55} z={1.3} s={0.7} color="#8f7cc9" />
      <Crate x={-1.3} z={1.62} s={0.5} color="#b39ad4" />
    </group>
  );
}

function RoleDetails({ role }: { role: BuildingRole }) {
  if (role === 'research') return <Research />;
  if (role === 'market') return <Market />;
  if (role === 'coding') return <Coding />;
  if (role === 'design') return <Design />;
  if (role === 'public-rd') return <PublicRD />;
  if (role === 'homes') return <Homes />;
  return <Skill />;
}

function Signature({ role, height, width }: { role: BuildingRole; height: number; width: number }) {
  const y = height * 0.9;
  if (role === 'research') {
    return (
      <group position={[0, y, 0]}>
        <C r1={0.55} r2={0.62} h={0.5} pos={[0, 0.25, 0]} color="#dfe8ee" />
        <mesh position={[0, 0.5, 0]} castShadow>
          <sphereGeometry args={[0.58, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#8fb6cf" roughness={0.35} metalness={0.15} />
        </mesh>
        <B size={[0.1, 0.46, 0.1]} pos={[0, 0.95, 0]} color="#4b5a52" />
        <mesh position={[0, 1.2, 0]}>
          <sphereGeometry args={[0.06, 6, 4]} />
          <meshStandardMaterial color="#e46d5c" emissive="#c84a3a" emissiveIntensity={1} />
        </mesh>
      </group>
    );
  }
  if (role === 'market') {
    return (
      <group position={[0, y, 0]}>
        <C r1={0.46} r2={0.52} h={0.55} pos={[0, 0.28, 0]} color="#f4e3c3" />
        <C r1={0.58} r2={0.58} h={0.08} pos={[0, 0.58, 0]} color="#d97a52" />
        <mesh position={[0, 0.9, 0]} castShadow>
          <coneGeometry args={[0.62, 0.5, 8]} />
          <meshStandardMaterial color="#3f8f96" roughness={0.75} />
        </mesh>
        <C r1={0.02} r2={0.03} h={0.6} pos={[0, 1.4, 0]} color="#4b5a52" />
        <B size={[0.35, 0.22, 0.03]} pos={[0.18, 1.55, 0]} color="#f7ead2" />
      </group>
    );
  }
  if (role === 'coding') {
    return (
      <group position={[0, y, 0]}>
        {[-0.3, 0, 0.3].map((x, i) => (
          <group key={x} position={[x, 0, -0.25 + i * 0.1]}>
            <B size={[0.42, 0.26, 0.34]} pos={[0, 0.13, 0]} color="#59645f" />
            <C r1={0.02} r2={0.03} h={0.8 + i * 0.2} pos={[0.12, 0.55, 0]} color="#33413d" />
          </group>
        ))}
        <B size={[1.2, 0.06, 0.06]} pos={[0, 0.06, 0.1]} color="#3f8f96" />
      </group>
    );
  }
  if (role === 'design') {
    return (
      <group position={[0, y - 0.05, 0]}>
        {[0, 1, 2].map((i) => (
          <group key={i} position={[-0.5 + i * 0.5, 0, 0]} rotation={[0, 0, -0.28]}>
            <B size={[0.5, 0.05, 0.7]} pos={[0, 0.1, 0]} color="#9fd4d0" />
            <B size={[0.05, 0.26, 0.7]} pos={[-0.22, 0.24, 0]} color="#f7f0df" />
          </group>
        ))}
        <B size={[1.5, 0.06, 0.06]} pos={[0, 0.02, 0.36]} color="#d97a52" />
      </group>
    );
  }
  if (role === 'public-rd') {
    return (
      <group position={[width / 2 + 0.4, 0, 0]}>
        <C r1={0.38} r2={0.46} h={height * 0.95} pos={[0, height * 0.475, 0]} color="#d7cbb5" />
        <mesh position={[0, height * 0.98, 0]} castShadow>
          <coneGeometry args={[0.52, 0.45, 8]} />
          <meshStandardMaterial color="#b8842f" roughness={0.8} />
        </mesh>
        {[0.3, 0.6, 0.9].map((t) => (
          <C key={t} r1={0.47} r2={0.47} h={0.06} pos={[0, height * t, 0]} color="#8a5a2f" />
        ))}
      </group>
    );
  }
  if (role === 'homes') {
    return (
      <group position={[0, y, 0]}>
        <B size={[0.65, 0.5, 0.55]} pos={[-0.35, 0.2, 0]} color="#f9f0df" />
        <mesh position={[-0.35, 0.5, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
          <boxGeometry args={[0.55, 0.55, 0.6]} />
          <meshStandardMaterial color="#7cbf7a" roughness={0.85} />
        </mesh>
        <B size={[0.18, 0.5, 0.18]} pos={[0.55, 0.28, 0]} color="#b98d60" />
      </group>
    );
  }
  return (
    <group position={[0, y, 0]}>
      <C r1={0.02} r2={0.03} h={0.9} pos={[0, 0.45, 0]} color="#4b5a52" />
      <B size={[0.7, 0.35, 0.04]} pos={[0.2, 0.85, 0]} color="#8f7cc9" />
      <B size={[0.5, 0.18, 0.02]} pos={[0.2, 0.86, 0.03]} color="#f4eaff" />
    </group>
  );
}

export function BuildingExtras({ role, height, width }: { role: BuildingRole; height: number; width: number }) {
  return (
    <group>
      <RoleDetails role={role} />
      <Signature role={role} height={height} width={width} />
    </group>
  );
}
