import { Html, useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Group, MathUtils, type AnimationAction } from 'three';
import { clone as cloneWithSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { KENNEY_AGENTS } from '../visual-lab/assetUrls';
import { resolveGlbUrl } from '../visual-lab/GlbInstance';
import { NATIVE, WORLD, fitScale } from '../visual-lab/assetScale';
import { ROLE_KEY, ROLE_LABEL, type DemoAgent } from './types';
import { RoleIcon } from './icons';

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
  onSelect: (id: string) => void;
};

export function GameAgent({ agent, index, start, target, state, selected, focused = false, onSelect }: Props) {
  const gltf = useGLTF(resolveGlbUrl(KENNEY_AGENTS[index]!));
  const clone = useMemo(() => {
    const g = cloneWithSkeleton(gltf.scene) as Group;
    g.traverse((obj) => {
      if ('castShadow' in obj) obj.castShadow = true;
      if ('receiveShadow' in obj) obj.receiveShadow = true;
    });
    return g;
  }, [gltf.scene]);

  const { actions } = useAnimations(gltf.animations, clone);
  const idleName = useMemo(() => gltf.animations.find((a) => /^idle$/i.test(a.name))?.name, [gltf.animations]);
  const walkName = useMemo(() => gltf.animations.find((a) => /^walk$/i.test(a.name))?.name, [gltf.animations]);
  const currentAction = useRef<AnimationAction | null>(null);
  const [moving, setMoving] = useState(false);
  const movingRef = useRef(false);
  const groupRef = useRef<Group>(null);

  const scale = fitScale(NATIVE.kenneyAgentHeight[index]!, WORLD.agentHeight);
  const faceY = index * 0.08;

  useEffect(() => {
    const name = moving ? walkName : idleName;
    if (!name) return;
    const next = actions[name];
    if (!next || next === currentAction.current) return;
    currentAction.current?.fadeOut(0.15);
    next.reset().fadeIn(0.15).play();
    currentAction.current = next;
  }, [actions, moving, idleName, walkName]);

  useEffect(() => {
    return () => {
      currentAction.current?.stop();
    };
  }, []);

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
      const desired = Math.atan2(dx, dz);
      g.rotation.y = MathUtils.damp(g.rotation.y, desired, 8, dt);
      if (!movingRef.current) {
        movingRef.current = true;
        setMoving(true);
      }
    } else {
      g.rotation.y = MathUtils.damp(g.rotation.y, faceY, 4, dt);
      if (movingRef.current) {
        movingRef.current = false;
        setMoving(false);
      }
    }
  });

  const roleKey = ROLE_KEY[agent.role];
  const focusedLine =
    agent.decision.action === 'bid' ? `${agent.decision.bidAmount} 金` : '先观望';
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
    focused ||
    selected ||
    state === 'bidding' ||
    state === 'selected' ||
    state === 'working' ||
    state === 'done' ||
    state === 'shopping';
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
      <primitive object={clone} scale={scale} />
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]}>
          <ringGeometry args={[0.5, 0.66, 40]} />
          <meshBasicMaterial color="#e0a94f" transparent opacity={0.85} />
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
      {bubble && (
        <Html center position={[0, bubbleY, 0]} zIndexRange={[21, 0]} style={{ pointerEvents: 'none' }}>
          <div className={`ga-bubble ga-bubble--${state}`}>{bubble}</div>
        </Html>
      )}
    </group>
  );
}
