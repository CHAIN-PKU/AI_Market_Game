import { ContactShadows, Html, Sky, SoftShadows, Sparkles } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import { MathUtils, Vector3, type PerspectiveCamera } from 'three';
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
import type { QualityConfig } from './quality';
function CameraRig({
  fixture,
  step,
  focusAgentId,
}: {
  fixture: BidDemoFixture;
  step: StepId;
  focusAgentId: string | null;
}) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const look = useRef(new Vector3(0, 1, 0));
  const focusIndex = focusAgentId ? fixture.agents.findIndex((a) => a.id === focusAgentId) : -1;
  const focusSlot = focusIndex >= 0 ? AGENT_SLOTS[focusIndex]?.position : null;
  const closeUp = step.startsWith('focus_') && !!focusSlot;

  useFrame((_, dt) => {
    const aspect = size.width / Math.max(1, size.height);
    const pull = Math.max(1, 1.14 / aspect);
    const targetPos = new Vector3(0, 15.4 * pull, 20.8 * pull);
    const targetLook = new Vector3(0, 1, 0);
    let targetFov = 40;

    if (closeUp && focusSlot) {
      const p = new Vector3(focusSlot[0] * 0.72, 0, focusSlot[2] * 0.72);
      // Characters face roughly +Z (small per-index yaw), so put the camera
      // in front of the resident rather than toward the island center.
      const faceY = (focusIndex >= 0 ? focusIndex : 0) * 0.08;
      const front = new Vector3(Math.sin(faceY), 0, Math.cos(faceY));
      targetPos.copy(p).add(front.multiplyScalar(4.8));
      targetPos.y = 2.1;
      targetLook.copy(p).add(new Vector3(0, 1.18, 0));
      targetFov = 34;
    }

    const k = 1 - Math.exp(-dt * 4.2);
    camera.position.lerp(targetPos, k);
    look.current.lerp(targetLook, k);
    camera.lookAt(look.current);
    camera.fov = MathUtils.damp(camera.fov, targetFov, 4, dt);
    camera.updateProjectionMatrix();
  });
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
  emissiveIntensity,
}: {
  size: [number, number, number];
  position: [number, number, number];
  color: string;
  rotation?: [number, number, number];
  emissive?: string;
  emissiveIntensity?: number;
}) {
  return (
    <mesh castShadow receiveShadow position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        roughness={0.82}
        metalness={0.04}
        emissive={emissive ?? '#000000'}
        emissiveIntensity={emissive ? (emissiveIntensity ?? 0.55) : 0}
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

function MarketStall({ sold }: { sold: boolean }) {
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
      {sold && (
        <group position={[0.55, 1.06, 0.35]}>
          {[0, 1, 2].map((i) => (
            <mesh key={`coin-${i}`} castShadow position={[0, i * 0.05, 0]}>
              <cylinderGeometry args={[0.13, 0.13, 0.035, 10]} />
              <meshStandardMaterial color="#e0a94f" metalness={0.45} roughness={0.35} emissive="#b8842f" emissiveIntensity={0.3} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

function SkillDisplay({ lit }: { lit: boolean }) {
  return (
    <group position={[0, 0, 2.05]}>
      <Box size={[1.9, 1.55, 0.18]} position={[0, 0.9, 0]} color="#fbf4e6" />
      <Box size={[1.58, 1.22, 0.06]} position={[0, 0.9, 0.12]} color={lit ? '#d9f3ea' : '#a9dcd6'} emissive="#3f8f96" emissiveIntensity={lit ? 1.15 : 0.35} />
      {[-0.46, 0, 0.46].map((x, i) => (
        <Box
          key={`card-${i}`}
          size={[0.34, 0.46, 0.04]}
          position={[x, 0.95, 0.18]}
          color={['#e0a94f', '#d97a52', '#8f7cc9'][i]!}
          emissive={lit ? '#e0a94f' : undefined}
          emissiveIntensity={lit ? 0.9 : 0}
        />
      ))}
      <Box size={[2.25, 0.1, 0.85]} position={[0, 1.82, 0.14]} color="#3f8f96" rotation={[0.1, 0, 0]} />
      <Post x={-0.95} z={0.35} height={1.8} color="#3f8f96" />
      <Post x={0.95} z={0.35} height={1.8} color="#3f8f96" />
      {lit && <pointLight position={[0, 1.3, 0.9]} intensity={2.1} distance={4.5} color="#ffd98a" />}
    </group>
  );
}

function CodingServers({ active }: { active: boolean }) {
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
          emissiveIntensity={active ? 1.6 : 0.3}
        />
      ))}
      <Box size={[0.85, 0.1, 0.8]} position={[0, 1.94, 0]} color="#5b6b67" />
      <Box size={[0.55, 0.35, 0.45]} position={[-0.65, 0.18, 0.2]} color="#8b5e3c" />
    </group>
  );
}

function ResearchDome({ active }: { active: boolean }) {
  return (
    <group position={[0, 0, 1.85]}>
      <mesh castShadow receiveShadow position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.78, 0.86, 0.44, 8]} />
        <meshStandardMaterial color="#e8dcc8" roughness={0.85} />
      </mesh>
      <mesh castShadow position={[0, 0.44, 0]}>
        <sphereGeometry args={[0.82, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#b7e3da" roughness={0.3} metalness={0.18} emissive="#3f8f96" emissiveIntensity={active ? 0.35 : 0} />
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
      {active && <pointLight position={[0, 1.4, 0.4]} intensity={1.8} distance={4} color="#9fe5df" />}
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

function PublicFlag({ shared }: { shared: boolean }) {
  return (
    <group position={[-1.25, 0, 1.55]}>
      <mesh castShadow position={[0, 2.2, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 4.4, 6]} />
        <meshStandardMaterial color="#6d7d76" roughness={0.85} />
      </mesh>
      <Box size={[1.45, 0.8, 0.04]} position={[0.76, 4.0, 0]} color={shared ? '#3f8f96' : '#d97a52'} />
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

function HomesTerrace({ lit }: { lit: boolean }) {
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
      <mesh castShadow position={[0, 1.52, 0.5]}>
        <boxGeometry args={[0.12, 0.2, 0.12]} />
        <meshStandardMaterial color={lit ? '#ffd98a' : '#8b5e3c'} emissive={lit ? '#e0a94f' : '#000000'} emissiveIntensity={lit ? 1.4 : 0} />
      </mesh>
      {lit && <pointLight position={[0, 1.45, 0.55]} intensity={1.6} distance={3.8} color="#ffd98a" />}
    </group>
  );
}

function BuildingProps({
  slot,
  fixture,
  step,
}: {
  slot: BuildingSlot;
  fixture: BidDemoFixture;
  step: StepId;
}) {
  const purchased = fixture.skillPurchase.length > 0;
  const working = step === 'working' && Boolean(fixture.winner);
  const settled = atLeast(step, 'settled');
  const activeDomain = working ? fixture.scenario.domain : null;
  return (
    <group position={slot.position} rotation={[0, slot.rotationY, 0]}>
      {slot.role === 'market' && <MarketStall sold={settled} />}
      {slot.role === 'skill' && <SkillDisplay lit={purchased && atLeast(step, 'skill')} />}
      {slot.role === 'coding' && <CodingServers active={activeDomain === 'coding'} />}
      {slot.role === 'research' && <ResearchDome active={activeDomain === 'research'} />}
      {slot.role === 'design' && <DesignEasel />}
      {slot.role === 'public-rd' && <PublicFlag shared={fixture.civilization.rules.skillOwnership === 'shared'} />}
      {slot.role === 'homes' && <HomesTerrace lit={settled} />}
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
              发布任务
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
  quality,
}: {
  fixture: BidDemoFixture;
  step: StepId;
  selectedId: string | null;
  focusAgentId: string | null;
  onSelect: (id: string) => void;
  onPublish: () => void;
  quality: QualityConfig;
}) {
  return (
    <>
      <CameraRig fixture={fixture} step={step} focusAgentId={focusAgentId} />
      <Sky sunPosition={[60, 30, 40]} turbidity={0.45} rayleigh={0.32} />
      <fog attach="fog" args={['#d8edf0', 42, 92]} />
      {quality.softShadows && <SoftShadows size={28} samples={16} focus={0.8} />}
      <ambientLight intensity={0.5} color="#fff9ed" />
      <hemisphereLight intensity={0.65} color="#c9efff" groundColor="#86c083" />
      <directionalLight
        castShadow
        position={[16, 26, 14]}
        intensity={2.1}
        color="#fff1d2"
        shadow-mapSize={[quality.shadowMap, quality.shadowMap]}
        shadow-bias={-0.0003}
        shadow-camera-far={80}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
      />
      <directionalLight position={[-14, 9, 10]} intensity={0.5} color="#b9ddff" />
      <directionalLight position={[-8, 14, -18]} intensity={1.25} color="#7fe0ea" />
      {quality.contactShadows && (
        <ContactShadows
          position={[0, 0.015, 0]}
          opacity={0.28}
          scale={28}
          blur={2.6}
          far={5}
          resolution={1024}
          color="#57452f"
        />
      )}
      {quality.sparkles && (
        <Sparkles count={38} scale={[18, 3.4, 18]} position={[0, 2.6, 0]} size={2.2} speed={0.16} opacity={0.32} color="#ffe8a8" />
      )}
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
            <BuildingProps slot={slot} fixture={fixture} step={step} />
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
          outline={quality.outlines}
        />
      ))}

      <NoticeBoard fixture={fixture} step={step} onPublish={onPublish} />
    </>
  );
}
