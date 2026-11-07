import { OrbitControls, Sky } from '@react-three/drei';
import type { CivilizationState } from '../types';
import { AgentAvatar } from './AgentAvatar';
import { BUILDINGS, agentRowPositions } from './sceneConfig';
import { IslandEnvironment } from './IslandEnvironment';
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
      <Sky sunPosition={[80, 24, 40]} turbidity={0.6} rayleigh={0.5} mieCoefficient={0.005} />
      <fog attach="fog" args={['#b8dce8', 32, 58]} />
      <ambientLight intensity={0.65} color="#fff9ed" />
      <directionalLight
        castShadow
        position={[12, 22, 10]}
        intensity={1.25}
        color="#fff3d6"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
      />
      <hemisphereLight intensity={0.35} color="#b8e0ff" groundColor="#79ae87" />
      <OrbitControls
        makeDefault
        target={[0, 0.5, 0]}
        minPolarAngle={0.25}
        maxPolarAngle={Math.PI / 2.15}
        minDistance={12}
        maxDistance={28}
        maxAzimuthAngle={Math.PI / 3}
        minAzimuthAngle={-Math.PI / 3}
      />
      <IslandEnvironment />
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
            position={[slot.x, 0.15, slot.z]}
            selected={selectedAgentId === agent.id}
            onSelect={onSelectAgent}
          />
        );
      })}
    </>
  );
}
