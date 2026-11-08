import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Group, MathUtils } from 'three';
import { ROLE_KEY, ROLE_LABEL, type DemoAgent } from './types';
import { RoleIcon } from './icons';
import { makeResidentTexture } from './characterArt';

export type AgentVisualState = 'idle' | 'watching' | 'bidding' | 'selected' | 'working' | 'done' | 'shopping';

const STATE_LABEL: Record<AgentVisualState, string> = {
  idle: '待机',
  watching: '观望',
  bidding: '竞标中',
  selected: '已中标',
  working: '工作中',
  done: '已完成',
  shopping: '去技能铺',
};

type Props = {
  agent: DemoAgent;
  index: number;
  start: [number, number, number];
  target: [number, number, number];
  state: AgentVisualState;
  selected: boolean;
  focused?: boolean;
  outline?: boolean;
  onSelect: (id: string) => void;
};

const HEIGHT = 1.68;

export function GameAgent({ agent, index, start, target, state, selected, focused = false, onSelect }: Props) {
  const groupRef = useRef<Group>(null);
  const spriteRef = useRef<Group>(null);
  const [moving, setMoving] = useState(false);
  const movingRef = useRef(false);
  const phase = useRef(index * 1.7);
  const roleKey = ROLE_KEY[agent.role];
  const texture = useMemo(() => makeResidentTexture(index, roleKey), [index, roleKey]);

  useEffect(() => () => texture.dispose(), [texture]);

  useFrame((_, dt) => {
    const g = groupRef.current;
    if (!g) return;
    const dx = target[0] - g.position.x;
    const dz = target[2] - g.position.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 0.05) {
      const stepLen = Math.min(dist, dt * 1.7);
      g.position.x += (dx / dist) * stepLen;
      g.position.z += (dz / dist) * stepLen;
      g.rotation.y = MathUtils.damp(g.rotation.y, Math.atan2(dx, dz), 8, dt);
      phase.current += dt * 9;
      if (!movingRef.current) {
        movingRef.current = true;
        setMoving(true);
      }
    } else {
      g.rotation.y = MathUtils.damp(g.rotation.y, (index % 8) * 0.06, 4, dt);
      if (movingRef.current) {
        movingRef.current = false;
        setMoving(false);
      }
      phase.current += dt * 1.5;
    }
    if (spriteRef.current) {
      const bob = moving ? Math.abs(Math.sin(phase.current)) * 0.04 : Math.sin(phase.current * 0.7) * 0.012;
      spriteRef.current.position.y = bob;
      spriteRef.current.rotation.z = moving ? Math.sin(phase.current) * 0.025 : 0;
      const targetScale = focused ? 1.07 : 1;
      spriteRef.current.scale.x = MathUtils.damp(spriteRef.current.scale.x, targetScale, 5, dt);
      spriteRef.current.scale.y = MathUtils.damp(spriteRef.current.scale.y, targetScale, 5, dt);
    }
  });

  const focusedLine = agent.decision.action === 'bid' ? `${agent.decision.bidAmount} 金` : '先观望';
  const bubble = focused
    ? focusedLine
    : state === 'bidding' && agent.decision.action === 'bid'
      ? `${agent.decision.bidAmount} 金`
      : state === 'selected'
        ? '中标'
        : state === 'working'
          ? '工作中…'
          : state === 'shopping'
            ? '去技能铺…'
            : state === 'done'
              ? '✓ 交差'
              : null;
  const roleVisible =
    focused || selected || state === 'bidding' || state === 'selected' || state === 'working' || state === 'done' || state === 'shopping';
  const badgeY = 1.9 + (index % 2) * 0.28;
  const bubbleY = badgeY + 0.55;

  return (
    <group
      ref={groupRef}
      position={start}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(agent.id);
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = '';
      }}
    >
      <group ref={spriteRef}>
        <sprite scale={[HEIGHT * (2 / 3), HEIGHT, 1]} position={[0, HEIGHT / 2, 0]}>
          <spriteMaterial map={texture} transparent alphaTest={0.03} toneMapped={false} />
        </sprite>
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0.04]}>
        <circleGeometry args={[0.32, 24]} />
        <meshBasicMaterial color="#3b3024" transparent opacity={0.2} depthWrite={false} />
      </mesh>
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]}>
          <ringGeometry args={[0.5, 0.66, 40]} />
          <meshBasicMaterial color="#2f6f75" transparent opacity={0.9} />
        </mesh>
      )}
      <Html center position={[0, badgeY, 0]} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
        <div className={`ga-badge ga-role-${roleKey} ${selected ? 'is-selected' : ''} ${state !== 'idle' ? 'is-active' : ''}`}>
          <RoleIcon role={roleKey} size={11} />
          <span className="ga-badge-name">{agent.displayName}</span>
          {roleVisible && (
            <span className="ga-badge-role">
              {ROLE_LABEL[agent.role]} · {STATE_LABEL[state]}
            </span>
          )}
        </div>
      </Html>
      <Html center position={[0, bubbleY, 0]} zIndexRange={[21, 0]} style={{ pointerEvents: 'none' }}>
        {bubble ? <div className={`ga-bubble ga-bubble--${state}`}>{bubble}</div> : null}
      </Html>
    </group>
  );
}
