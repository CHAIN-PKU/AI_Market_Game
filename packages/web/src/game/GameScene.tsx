import { ContactShadows, Html, Sky, SoftShadows, Sparkles, useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef, type ReactNode } from 'react';
import { MathUtils, Vector3, type PerspectiveCamera } from 'three';
import { AGENT_SLOTS, BUILDING_SLOTS, TREE_SLOTS } from '../visual-lab/islandLayout';
import { KENNEY_TREES } from '../visual-lab/assetUrls';
import { GlbInstance } from '../visual-lab/GlbInstance';
import { MIXAMO_AVATARS } from './avatarAssets';
import { IslandBase } from '../visual-lab/IslandBase';
import { NATIVE, WORLD, fitScale, sitOnGround } from '../visual-lab/assetScale';
import { GameAgent, type AgentVisualState } from './GameAgent';
import { EnvironmentDetails } from './EnvironmentDetails';
import { CozyBuilding } from './CozyBuilding';
import { BuildingExtras } from './BuildingExtras';
import { IslandLife } from './IslandLife';
import { VillageDetails } from './VillageDetails';
import { GridIcon, MarketIcon, PeopleIcon, RoleIcon, SkillIcon } from './icons';
import { atLeast, type StepId } from './playback';
import { activeChat } from './bargainScript';
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
    const targetPos = new Vector3(0, 17.2 * pull, 23.8 * pull);
    const targetLook = new Vector3(0, 1, 0);
    let targetFov = 38;

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
                <span key={`${bid.agentId}-${bid.bidAmount}-${bid.teamAgentIds?.[1] ?? ""}-${bid.ringDefected ? "d" : ""}`} className="notice-slip">
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

/**
 * 预加载全部角色模型，再渲染场景。
 * 不这样做的话：场景先挂载（Html 徽章/气泡已创建门户），随后模型加载完成触发
 * Suspense 解析，门户在同一帧被同步卸载，React 抛 removeChild 错误。
 */
function AvatarWarmup({ children }: { children: ReactNode }) {
  // 数量固定（8 个角色），因此可以安全地逐个调用 hook
  for (const avatar of MIXAMO_AVATARS) useGLTF(avatar.url);
  return <>{children}</>;
}

export function GameScene({
  fixture,
  step,
  selectedId,
  focusAgentId,
  onSelect,
  onPublish,
  quality,
  theaterT,
}: {
  fixture: BidDemoFixture;
  step: StepId;
  selectedId: string | null;
  focusAgentId: string | null;
  onSelect: (id: string) => void;
  onPublish: () => void;
  /** Seconds since the theater playback started, or null when the theater is off. */
  theaterT?: number | null;
  quality: QualityConfig;
}) {
  return (
    <AvatarWarmup>
      <CameraRig fixture={fixture} step={step} focusAgentId={focusAgentId} />
      <Sky sunPosition={[70, 18, 30]} turbidity={5.5} rayleigh={1.15} mieCoefficient={0.004} mieDirectionalG={0.82} />
      <fog attach="fog" args={['#f6ddc0', 44, 96]} />
      {quality.softShadows && <SoftShadows size={28} samples={16} focus={0.8} />}
      <ambientLight intensity={0.58} color="#ffe9d2" />
      <hemisphereLight intensity={0.65} color="#ffd9b5" groundColor="#7e9b67" />
      <directionalLight
        castShadow
        position={[16, 26, 14]}
        intensity={2.35}
        color="#ffd2a3"
        shadow-mapSize={[quality.shadowMap, quality.shadowMap]}
        shadow-bias={-0.0003}
        shadow-camera-far={80}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
      />
      <directionalLight position={[-14, 9, 10]} intensity={0.55} color="#b9ddff" />
      <directionalLight position={[0, 7, 22]} intensity={0.65} color="#fff4e2" />
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
      <IslandLife />
      <VillageDetails />
      <EnvironmentDetails />

      {BUILDING_SLOTS.map((slot) => {
        const height = WORLD.buildingByRole[slot.role];
        const width = slot.role === 'market' ? 2.7 : slot.role === 'homes' ? 2.5 : 2.2;
        return (
          <group key={slot.id} position={slot.position} rotation={[0, slot.rotationY, 0]}>
            <CozyBuilding role={slot.role} height={height} width={width} />
            <BuildingExtras role={slot.role} height={height} width={width} />
            <BuildingLabel x={0} z={0} label={slot.label} role={slot.role} height={height} />
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
          chatSay={theaterT == null ? null : activeChat(agent.displayName, theaterT).say}
          chatThink={theaterT == null ? null : activeChat(agent.displayName, theaterT).think}
          // 相邻站位交替抬高，避免两个气泡在同一高度叠住
          chatLift={(i % 2) * 0.62}
          outline={quality.outlines}
        />
      ))}

      <NoticeBoard fixture={fixture} step={step} onPublish={onPublish} />
    </AvatarWarmup>
  );
}
