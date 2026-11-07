import { OrbitControls } from '@react-three/drei';
import type { CivilizationState } from '../types';
import { AgentAvatar } from './AgentAvatar';
import { BUILDINGS, agentRowPositions } from './sceneConfig';
import { ProceduralBuilding } from './ProceduralBuilding';

export function CivilizationScene({
  civ,
  selectedAgentId,
  selectedBuildingId,
  onSelectAgent,
  onSelectBuilding,
}: {
  civ: CivilizationState;
  selectedAgentId: string | null;
  selectedBuildingId: string | null;
  onSelectAgent: (id: string) => void;
  onSelectBuilding: (id: string) => void;
}) {
  const slots = agentRowPositions(civ.agents.length);

  return (
    <>
      <color attach="background" args={['#d4e8f5']} />
      <fog attach="fog" args={['#d4e8f5', 28, 55]} />
      <ambientLight intensity={0.55} />
      <directionalLight
        castShadow
        position={[10, 16, 8]}
        intensity={1.1}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={40}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
      />
      <OrbitControls
        makeDefault
        target={[0, 0, 0]}
        minPolarAngle={0.35}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={8}
        maxDistance={32}
      />
      <mesh receiveShadow position={[0, -0.05, 0]}>
        <boxGeometry args={[22, 0.35, 22]} />
        <meshStandardMaterial color="#7cbfa0" />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.18, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#c4b896" />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.19, 0]}>
        <planeGeometry args={[1.2, 22]} />
        <meshStandardMaterial color="#d9c9a8" />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.19, 0]}>
        <planeGeometry args={[22, 1.2]} />
        <meshStandardMaterial color="#d9c9a8" />
      </mesh>
      {BUILDINGS.map((b) => (
        <ProceduralBuilding
          key={b.id}
          def={b}
          selected={selectedBuildingId === b.id}
          onSelect={onSelectBuilding}
        />
      ))}
      {civ.agents.map((agent, i) => {
        const slot = slots[i];
        if (!slot) return null;
        return (
          <AgentAvatar
            key={agent.id}
            agent={agent}
            position={[slot.x, 0.25, slot.z]}
            selected={selectedAgentId === agent.id}
            onSelect={onSelectAgent}
          />
        );
      })}
    </>
  );
}
