import { Html, useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Group, MathUtils, type AnimationAction, type Material } from 'three';
import { clone as cloneWithSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { QUAT_AGENTS } from '../visual-lab/assetUrls';
import { resolveGlbUrl } from '../visual-lab/GlbInstance';
import { NATIVE, WORLD, fitScale } from '../visual-lab/assetScale';
import { toToonMaterial } from './toon';

const SKIN = ['#f4c9a4', '#e7b48c', '#c98d63', '#9a6040'];
const HAIR = ['#2f211b', '#5a3a25', '#c08a3e', '#1f2933', '#7a4b2a', '#d9c8a0'];
const SHIRT: Record<string, string> = { coding: '#3f8f96', research: '#8f7cc9', design: '#d97a52' };

function characterColor(materialName: string, index: number, roleKey: string): string | undefined {
  const n = materialName.toLowerCase();
  if (n.includes('face')) return SKIN[index % SKIN.length]!;
  if (n.includes('skin')) return SKIN[index % SKIN.length]!;
  if (n.includes('hair')) return HAIR[index % HAIR.length]!;
  if (n.includes('shirt')) return SHIRT[roleKey] ?? '#3f8f96';
  if (n.includes('vest')) return '#b8842f';
  if (n.includes('pants')) return '#3d4657';
  if (n.includes('belt')) return '#6b4a2f';
  if (n.includes('hat')) return '#e0a94f';
  return undefined;
}
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
  const gltf = useGLTF(resolveGlbUrl(QUAT_AGENTS[index]!));
  const clone = useMemo(() => {
    const g = cloneWithSkeleton(gltf.scene) as Group;
    g.traverse((obj) => {
      if ('castShadow' in obj) obj.castShadow = true;
      if ('receiveShadow' in obj) obj.receiveShadow = true;
      if ((obj as { isMesh?: boolean }).isMesh) {
        const mesh = obj as unknown as { material: Material | Material[] };
        const roleKey = ROLE_KEY[agent.role];
        mesh.material = Array.isArray(mesh.material)
          ? mesh.material.map((m) => toToonMaterial(m, characterColor(m.name, index, roleKey)))
          : toToonMaterial(mesh.material, characterColor(mesh.material.name, index, roleKey));
      }
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

  const scale = fitScale(NATIVE.quatAgentHeight[index]!, WORLD.agentHeight);
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
      <primitive object={clone} scale={scale} position={[0, 0.004, 0]} />
      <Html center position={[0, 1.13, 0.05]} zIndexRange={[18, 0]} style={{ pointerEvents: 'none' }}>
        <div className="ga-face" aria-hidden>
          <i />
          <i />
          <b />
        </div>
      </Html>

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
