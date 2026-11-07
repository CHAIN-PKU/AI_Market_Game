import type { AgentState } from '../types';
import { agentSpecialty } from '../lib/civDisplay';

const DOMAIN_COLOR: Record<string, string> = {
  编程: '#4ea8de',
  科研: '#9b8fd9',
  设计: '#d4846a',
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
  const color = DOMAIN_COLOR[spec] ?? '#7cbfa0';
  const emissive = selected ? color : '#000000';
  const intensity = selected ? 0.45 : 0;

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(agent.id);
      }}
    >
      <mesh castShadow position={[0, 0.45, 0]}>
        <boxGeometry args={[0.45, 0.7, 0.35]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={intensity} />
      </mesh>
      <mesh castShadow position={[0, 0.95, 0]}>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshStandardMaterial color="#f5f0e6" emissive={emissive} emissiveIntensity={intensity * 0.6} />
      </mesh>
      {spec === '编程' && (
        <mesh position={[0.28, 0.5, 0]}>
          <boxGeometry args={[0.12, 0.2, 0.08]} />
          <meshStandardMaterial color="#2c3e50" />
        </mesh>
      )}
      {spec === '科研' && (
        <mesh position={[0.22, 0.98, 0.15]}>
          <boxGeometry args={[0.18, 0.12, 0.06]} />
          <meshStandardMaterial color="#fff" />
        </mesh>
      )}
      {spec === '设计' && (
        <mesh position={[-0.25, 0.85, 0.1]} rotation={[0, 0.4, 0]}>
          <boxGeometry args={[0.02, 0.35, 0.25]} />
          <meshStandardMaterial color="#f4b942" />
        </mesh>
      )}
    </group>
  );
}
