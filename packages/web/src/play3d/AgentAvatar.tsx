import type { AgentState } from '../types';
import { agentSpecialty } from '../lib/civDisplay';

const DOMAIN_COLOR: Record<string, string> = {
  编程: '#4c9fa8',
  科研: '#9b8fd9',
  设计: '#d77f54',
};

export function AgentAvatar({
  agent,
  position,
  selected,
  onSelect,
}: {
  agent: AgentState;
  position: [number, number, number];
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const spec = agentSpecialty(agent);
  const color = DOMAIN_COLOR[spec] ?? '#79ae87';
  const scale = selected ? 1.12 : 1;
  const emissive = selected ? '#253c3a' : '#000000';
  const intensity = selected ? 0.25 : 0;

  return (
    <group
      scale={scale}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(agent.id);
      }}
    >
      <mesh castShadow position={[-0.18, 0.35, 0]}>
        <boxGeometry args={[0.12, 0.45, 0.12]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh castShadow position={[0.18, 0.35, 0]}>
        <boxGeometry args={[0.12, 0.45, 0.12]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh castShadow position={[0, 0.55, 0]}>
        <boxGeometry args={[0.52, 0.65, 0.32]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={intensity} />
      </mesh>
      <mesh castShadow position={[0, 1.02, 0]}>
        <sphereGeometry args={[0.3, 14, 14]} />
        <meshStandardMaterial color="#fff9ed" emissive={emissive} emissiveIntensity={intensity * 0.5} />
      </mesh>
      <mesh position={[-0.1, 1.05, 0.22]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#253c3a" />
      </mesh>
      <mesh position={[0.1, 1.05, 0.22]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#253c3a" />
      </mesh>
      {spec === '编程' && (
        <mesh position={[0.32, 0.62, 0.12]}>
          <boxGeometry args={[0.14, 0.22, 0.1]} />
          <meshStandardMaterial color="#253c3a" />
        </mesh>
      )}
      {spec === '科研' && (
        <mesh position={[0.28, 1.08, 0.08]}>
          <boxGeometry args={[0.2, 0.14, 0.05]} />
          <meshStandardMaterial color="#e7b65a" />
        </mesh>
      )}
      {spec === '设计' && (
        <mesh position={[-0.3, 0.88, 0.15]} rotation={[0, 0.5, 0]}>
          <boxGeometry args={[0.03, 0.4, 0.28]} />
          <meshStandardMaterial color="#d77f54" />
        </mesh>
      )}
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.55, 0.7, 24]} />
          <meshStandardMaterial color="#e7b65a" emissive="#e7b65a" emissiveIntensity={0.3} />
        </mesh>
      )}
    </group>
  );
}
