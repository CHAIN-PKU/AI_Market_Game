import { Html, Sky } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { AGENT_SLOTS, BUILDING_SLOTS, TREE_SLOTS } from '../visual-lab/islandLayout';
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
