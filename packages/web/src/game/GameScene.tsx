import { Html, Sky } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { AGENT_SLOTS, BUILDING_SLOTS, TREE_SLOTS, type BuildingSlot } from '../visual-lab/islandLayout';
import { KENNEY_BUILDINGS, KENNEY_TREES } from '../visual-lab/assetUrls';
import { GlbInstance } from '../visual-lab/GlbInstance';
import { IslandBase } from '../visual-lab/IslandBase';
import { NATIVE, WORLD, fitScale, sitOnGround } from '../visual-lab/assetScale';
import { GameAgent, type AgentVisualState } from './GameAgent';
import { GridIcon, MarketIcon, PeopleIcon, RoleIcon, SkillIcon } from './icons';
import { atLeast, type StepId } from './playback';
import { gold } from './presentation';
import type { BidDemoFixture } from './types';
function FixedCamera() {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    camera.position.set(0, 19, 25);
    camera.lookAt(0, 1, 0);
  }, [camera]);
  return null;
}

const MARKET_FRONT: [number, number, number] = [0, 0, -6.3];
const SKILL_FRONT: [number, number, number] = [-5.75, 0, -4.1];

function agentTarget(
  step: StepId,
  agentId: string,
  index: number,
  fixture: BidDemoFixture,
  focusAgentId: string | null
): [number, number, number] {
  const base = AGENT_SLOTS[index]!.position;
  const winnerId = fixture.winner?.agentId;
  const isBidder = fixture.bids.some((b) => b.agentId === agentId);

  if (step.startsWith('focus_')) {
    if (agentId === focusAgentId) return [base[0] * 0.72, 0, base[2] * 0.72];
    return [base[0], 0, base[2]];
  }
  if (agentId === winnerId) {
    if (step === 'assigned' || step === 'working') return MARKET_FRONT;
    if (step === 'skill') return SKILL_FRONT;
  }
  if (step === 'bids') {
    return isBidder ? [base[0] * 0.62, 0, base[2] * 0.62] : [base[0] * 1.06, 0, base[2] * 1.06];
  }
  return [base[0], 0, base[2]];
}

function agentVisual(
  step: StepId,
  agentId: string,
  fixture: BidDemoFixture,
  focusAgentId: string | null
): AgentVisualState {
  const isWinner = agentId === fixture.winner?.agentId;
  const isBidder = fixture.bids.some((b) => b.agentId === agentId);
  const isFocused = agentId === focusAgentId;

  if (step === 'idle' || step === 'posted') return 'idle';
  if (step === 'focus_astra' || step === 'focus_delta' || step === 'focus_grove') {
    if (!isFocused) return 'idle';
    const agent = fixture.agents.find((a) => a.id === agentId);
    return agent?.decision.action === 'bid' ? 'bidding' : 'watching';
  }
  if (step === 'bids') return isBidder ? 'bidding' : 'watching';
  if (step === 'assigned') return isWinner ? 'selected' : 'idle';
  if (step === 'working') return isWinner ? 'working' : 'idle';
  if (step === 'settled') return isWinner ? 'done' : 'idle';
  if (step === 'skill') return isWinner ? 'shopping' : 'idle';
  return isWinner ? 'done' : 'idle';
}


/* ---------------- building silhouettes (readable with labels hidden) ---------------- */

function Box({
  size,
  position,
  color,
  rotation,
  emissive,
}: {
  size: [number, number, number];
  position: [number, number, number];
  color: string;
  rotation?: [number, number, number];
  emissive?: string;
}) {
  return (
    <mesh castShadow receiveShadow position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        roughness={0.82}
        metalness={0.04}
        emissive={emissive ?? '#000000'}
        emissiveIntensity={emissive ? 0.55 : 0}
      />
    </mesh>
  );
}

function Post({ x, z, height = 1.55, color = '#8b5e3c' }: { x: number; z: number; height?: number; color?: string }) {
  return (
    <mesh castShadow position={[x, height / 2, z]}>
      <cylinderGeometry args={[0.055, 0.07, height, 6]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  );
}

function MarketStall() {
  return (
    <group position={[4.8, 0, 3.25]} rotation={[0, -0.18, 0]}>
      {[-1.05, 1.05].map((x) =>
        [-0.55, 0.55].map((z) => <Post key={`${x}-${z}`} x={x} z={z} height={1.55} />),
      )}
      {Array.from({ length: 6 }, (_, i) => (
        <Box
          key={`stripe-${i}`}
          size={[0.42, 0.07, 1.45]}
          position={[-1.05 + i * 0.42, 1.52, 0]}
          color={i % 2 === 0 ? '#e8d8b8' : '#d97a52'}
          rotation={[0.06, 0, 0]}
        />
      ))}
      <Box size={[2.25, 0.62, 0.5]} position={[0, 0.55, 0.35]} color="#9a6a42" />
      <Box size={[2.25, 0.08, 0.62]} position={[0, 0.9, 0.35]} color="#c79a63" />
      {[-0.72, -0.24, 0.24, 0.72].map((x, i) => (
        <mesh key={`fruit-${i}`} castShadow position={[x, 1.03, 0.35]}>
          <sphereGeometry args={[0.13, 8, 6]} />
          <meshStandardMaterial color={['#e0a94f', '#d97a52', '#7cbf7a', '#e0a94f'][i]} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function SkillDisplay() {
  return (
    <group position={[0, 0, 2.05]}>
      <Box size={[1.9, 1.55, 0.18]} position={[0, 0.9, 0]} color="#fbf4e6" />
      <Box size={[1.58, 1.22, 0.06]} position={[0, 0.9, 0.12]} color="#a9dcd6" emissive="#3f8f96" />
      {[-0.46, 0, 0.46].map((x, i) => (
        <Box
          key={`card-${i}`}
          size={[0.34, 0.46, 0.04]}
          position={[x, 0.95, 0.18]}
          color={['#e0a94f', '#d97a52', '#8f7cc9'][i]!}
        />
      ))}
      <Box size={[2.25, 0.1, 0.85]} position={[0, 1.82, 0.14]} color="#3f8f96" rotation={[0.1, 0, 0]} />
      <Post x={-0.95} z={0.35} height={1.8} color="#3f8f96" />
      <Post x={0.95} z={0.35} height={1.8} color="#3f8f96" />
    </group>
  );
}

function CodingServers() {
  return (
    <group position={[1.35, 0, 1.65]}>
      <Box size={[0.78, 1.9, 0.72]} position={[0, 0.95, 0]} color="#3c4a48" />
      {[0.45, 0.8, 1.15, 1.5].map((y, i) => (
        <Box
          key={`led-${i}`}
          size={[0.5, 0.05, 0.03]}
          position={[0, y, 0.38]}
          color={i % 2 === 0 ? '#7cbf7a' : '#e0a94f'}
          emissive={i % 2 === 0 ? '#4c9a4a' : '#b8842f'}
        />
      ))}
      <Box size={[0.85, 0.1, 0.8]} position={[0, 1.94, 0]} color="#5b6b67" />
      <Box size={[0.55, 0.35, 0.45]} position={[-0.65, 0.18, 0.2]} color="#8b5e3c" />
    </group>
  );
}

function ResearchDome() {
  return (
    <group position={[0, 0, 1.85]}>
      <mesh castShadow receiveShadow position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.78, 0.86, 0.44, 8]} />
        <meshStandardMaterial color="#e8dcc8" roughness={0.85} />
      </mesh>
      <mesh castShadow position={[0, 0.44, 0]}>
        <sphereGeometry args={[0.82, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#b7e3da" roughness={0.3} metalness={0.18} />
      </mesh>
      <mesh castShadow position={[0.95, 0.8, -0.15]}>
        <cylinderGeometry args={[0.035, 0.05, 1.6, 6]} />
        <meshStandardMaterial color="#6d7d76" roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0.95, 1.62, -0.15]}>
        <sphereGeometry args={[0.12, 8, 6]} />
        <meshStandardMaterial color="#e0a94f" emissive="#b8842f" emissiveIntensity={0.4} />
      </mesh>
      <mesh castShadow position={[-0.15, 1.02, 0.35]} rotation={[0.5, 0, -0.7]}>
        <cylinderGeometry args={[0.11, 0.16, 1.05, 10]} />
        <meshStandardMaterial color="#3f8f96" roughness={0.45} metalness={0.25} />
      </mesh>
      <mesh castShadow position={[-0.55, 1.35, 0.55]} rotation={[0.5, 0, -0.7]}>
        <cylinderGeometry args={[0.16, 0.16, 0.12, 10]} />
        <meshStandardMaterial color="#e8d8b8" roughness={0.5} />
      </mesh>
    </group>
  );
}

function DesignEasel() {
  return (
    <group position={[1.8, 0, 1.8]} rotation={[0, 0.55, 0]}>
      {[
        [-0.32, 0, 0.18],
        [0.32, 0, 0.18],
        [0, 0, -0.28],
      ].map(([x, , z], i) => (
        <mesh key={`leg-${i}`} castShadow position={[x, 0.6, z]} rotation={[i === 2 ? -0.22 : 0.18, 0, x * 0.35]}>
          <cylinderGeometry args={[0.035, 0.045, 1.25, 6]} />
          <meshStandardMaterial color="#8b5e3c" roughness={0.9} />
        </mesh>
      ))}
      <Box size={[1.3, 1.45, 0.07]} position={[0, 1.28, 0.14]} color="#fbf4e6" rotation={[-0.12, 0, 0]} />
      {[
        [-0.2, 1.45, 0.19, '#d97a52'],
        [0.12, 1.2, 0.2, '#3f8f96'],
        [0.24, 1.62, 0.18, '#e0a94f'],
      ].map(([x, y, z, color], i) => (
        <mesh key={`paint-${i}`} castShadow position={[x as number, y as number, z as number]}>
          <sphereGeometry args={[0.11, 7, 5]} />
          <meshStandardMaterial color={color as string} roughness={0.7} />
        </mesh>
      ))}
      <Box size={[0.34, 0.08, 0.34]} position={[0.85, 0.42, 0.1]} color="#8b5e3c" />
      <Box size={[0.06, 0.4, 0.06]} position={[0.72, 0.2, 0.1]} color="#8b5e3c" />
      <Box size={[0.06, 0.4, 0.06]} position={[0.98, 0.2, 0.1]} color="#8b5e3c" />
    </group>
  );
}

function PublicFlag() {
  return (
    <group position={[-1.25, 0, 1.55]}>
      <mesh castShadow position={[0, 2.2, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 4.4, 6]} />
        <meshStandardMaterial color="#6d7d76" roughness={0.85} />
      </mesh>
      <Box size={[1.45, 0.8, 0.04]} position={[0.76, 4.0, 0]} color="#d97a52" />
      <Box size={[1.25, 0.09, 0.05]} position={[0.76, 4.0, 0.03]} color="#e0a94f" />
      <mesh castShadow position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.26, 0.32, 0.24, 8]} />
        <meshStandardMaterial color="#c7b79b" roughness={0.9} />
      </mesh>
      <Box size={[0.55, 0.42, 0.5]} position={[0.85, 0.21, 0.55]} color="#9a6a42" />
      <Box size={[0.48, 0.36, 0.45]} position={[1.35, 0.18, 0.42]} color="#b8842f" />
    </group>
  );
}

function HomesTerrace() {
  return (
    <group position={[0, 0, 2.8]}>
      <Box size={[2.3, 0.12, 1.35]} position={[0, 0.06, 0]} color="#b98d60" />
      <Box size={[2.3, 0.06, 0.08]} position={[0, 0.14, 0.68]} color="#8b5e3c" />
      {[
        [-1.0, -0.5],
        [1.0, -0.5],
        [-1.0, 0.5],
        [1.0, 0.5],
      ].map(([x, z], i) => (
        <Post key={`pergola-${i}`} x={x!} z={z!} height={1.7} color="#8b5e3c" />
      ))}
      <Box size={[2.15, 0.1, 0.1]} position={[0, 1.72, -0.5]} color="#8b5e3c" />
      <Box size={[2.15, 0.1, 0.1]} position={[0, 1.72, 0.5]} color="#8b5e3c" />
      <Box size={[0.1, 0.1, 1.1]} position={[-1.0, 1.72, 0]} color="#8b5e3c" />
      <Box size={[0.1, 0.1, 1.1]} position={[1.0, 1.72, 0]} color="#8b5e3c" />
      <mesh castShadow position={[0, 0.58, -0.15]}>
        <cylinderGeometry args={[0.42, 0.42, 0.08, 10]} />
        <meshStandardMaterial color="#c79a63" roughness={0.85} />
      </mesh>
      <Post x={-0.42} z={-0.15} height={0.55} color="#8b5e3c" />
      <Post x={0.42} z={-0.15} height={0.55} color="#8b5e3c" />
      {[-0.65, 0.65].map((x, i) => (
        <Box key={`chair-${i}`} size={[0.35, 0.35, 0.35]} position={[x, 0.24, -0.15]} color="#d97a52" />
      ))}
    </group>
  );
}

function BuildingProps({ slot }: { slot: BuildingSlot }) {
  return (
    <group position={slot.position} rotation={[0, slot.rotationY, 0]}>
      {slot.role === 'market' && <MarketStall />}
      {slot.role === 'skill' && <SkillDisplay />}
      {slot.role === 'coding' && <CodingServers />}
      {slot.role === 'research' && <ResearchDome />}
      {slot.role === 'design' && <DesignEasel />}
      {slot.role === 'public-rd' && <PublicFlag />}
      {slot.role === 'homes' && <HomesTerrace />}
    </group>
  );
}

function BuildingLabel({ x, z, label, role, height }: { x: number; z: number; label: string; role: string; height: number }) {
  const icon =
    role === 'market' ? (
      <MarketIcon size={13} />
    ) : role === 'skill' ? (
      <SkillIcon size={13} />
    ) : role === 'public-rd' ? (
      <GridIcon size={13} />
    ) : role === 'homes' ? (
      <PeopleIcon size={13} />
    ) : (
      <RoleIcon role={role as 'coding' | 'research' | 'design'} size={13} />
    );
  return (
    <Html center position={[x, height + 0.5, z]} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
      <div className={`bld-sign bld-sign--${role}`}>
        <span className="bld-sign-icon">{icon}</span>
        <span className="bld-sign-label">{label}</span>
      </div>
    </Html>
  );
}

function NoticeBoard({ fixture, step, onPublish }: { fixture: BidDemoFixture; step: StepId; onPublish: () => void }) {
  const idle = step === 'idle';
  const posted = atLeast(step, 'posted');
  const bidsOpen = atLeast(step, 'bids');
  const assigned = atLeast(step, 'assigned');
  const settled = atLeast(step, 'settled');
  return (
    <Html center position={[0, 2.5, -6.4]} zIndexRange={[25, 0]}>
      <div className="notice-board">
        <span className="notice-post notice-post--left" />
        <span className="notice-post notice-post--right" />
        <div className="notice-wood">
          <span className="notice-title">市集公告板</span>
          {idle ? (
            <button type="button" className="notice-action" onClick={onPublish}>
              发布第一笔任务
            </button>
          ) : (
            <div className="notice-task">
              <span className="notice-task-tag">本任务</span>
              <strong>{fixture.scenario.title}</strong>
              <span className="notice-task-meta">
                {gold(fixture.scenario.reward)} · 难度 {fixture.scenario.difficulty}
              </span>
            </div>
          )}
          {posted && bidsOpen && (
            <div className="notice-slips">
              {fixture.bids.map((bid) => (
                <span key={bid.agentId} className="notice-slip">
                  {bid.displayName} {gold(bid.bidAmount)}
                </span>
              ))}
            </div>
          )}
          {assigned && fixture.winner && <span className="notice-stamp">中标 · {fixture.winner.displayName}</span>}
          {settled && (
            <span className="notice-stamp is-settled">已结算 · {gold(fixture.settlement?.net ?? 0)} 到手</span>
          )}
        </div>
      </div>
    </Html>
  );
}

export function GameScene({
  fixture,
  step,
  selectedId,
  focusAgentId,
  onSelect,
  onPublish,
}: {
  fixture: BidDemoFixture;
  step: StepId;
  selectedId: string | null;
  focusAgentId: string | null;
  onSelect: (id: string) => void;
  onPublish: () => void;
}) {
  return (
    <>
      <FixedCamera />
      <Sky sunPosition={[60, 30, 40]} turbidity={0.6} rayleigh={0.4} />
      <fog attach="fog" args={['#cfe8ec', 40, 82]} />
      <ambientLight intensity={0.6} color="#fff9ed" />
      <hemisphereLight intensity={0.45} color="#b8e8ff" groundColor="#7cbf7a" />
      <directionalLight
        castShadow
        position={[16, 26, 14]}
        intensity={1.45}
        color="#fff3d0"
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-camera-far={70}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
      />
      <IslandBase />

      {BUILDING_SLOTS.map((slot, i) => {
        const asset = KENNEY_BUILDINGS[i];
        if (!asset) return null;
        const scale = fitScale(
          NATIVE.kenneyBuildingHeight[i]!,
          WORLD.buildingByRole[slot.role],
          NATIVE.kenneyBuildingWidth[i]!,
          WORLD.buildingMaxWidth.kenney
        );
        const height = NATIVE.kenneyBuildingHeight[i]! * scale;
        return (
          <group key={slot.id}>
            <GlbInstance
              url={asset}
              position={[slot.position[0], sitOnGround(0, scale, 0.02), slot.position[2]]}
              rotation={[0, slot.rotationY, 0]}
              scale={scale}
            />
            <BuildingProps slot={slot} />
            <BuildingLabel x={slot.position[0]} z={slot.position[2]} label={slot.label} role={slot.role} height={height} />
          </group>
        );
      })}

      {TREE_SLOTS.map((t, i) => {
        const treeIndex = i % KENNEY_TREES.length;
        const tree = KENNEY_TREES[treeIndex]!;
        const nativeMinY = treeIndex === 2 ? -0.05 : 0;
        const scale = fitScale(NATIVE.kenneyTreeHeight[treeIndex]!, t.height);
        return (
          <GlbInstance
            key={`tree-${i}`}
            url={tree}
            position={[t.position[0], sitOnGround(nativeMinY, scale, 0.02), t.position[2]]}
            rotation={[0, t.rotationY, 0]}
            scale={scale}
          />
        );
      })}

      {fixture.agents.map((agent, i) => (
        <GameAgent
          key={agent.id}
          agent={agent}
          index={i}
          start={[AGENT_SLOTS[i]!.position[0], 0.03, AGENT_SLOTS[i]!.position[2]]}
          target={agentTarget(step, agent.id, i, fixture, focusAgentId)}
          state={agentVisual(step, agent.id, fixture, focusAgentId)}
          selected={selectedId === agent.id}
          focused={focusAgentId === agent.id}
          onSelect={onSelect}
        />
      ))}

      <NoticeBoard fixture={fixture} step={step} onPublish={onPublish} />
    </>
  );
}
