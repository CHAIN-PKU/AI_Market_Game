import { Html, useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { Box3, Group, MathUtils, type Object3D } from 'three';
import { clone as cloneWithSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { ROLE_KEY, ROLE_LABEL, type DemoAgent } from './types';
import { RoleIcon } from './icons';
import { MIXAMO_AVATARS } from './avatarAssets';

export type AgentVisualState = 'idle' | 'watching' | 'bidding' | 'selected' | 'working' | 'done' | 'shopping';
const STATE_LABEL: Record<AgentVisualState, string> = { idle: '待机', watching: '观望', bidding: '竞标中', selected: '已中标', working: '工作中', done: '已完成', shopping: '去技能铺' };

type Props = { agent: DemoAgent; index: number; start: [number, number, number]; target: [number, number, number]; state: AgentVisualState; selected: boolean; focused?: boolean; outline?: boolean; onSelect: (id: string) => void };

export function GameAgent({ agent, index, start, target, state, selected, focused = false, onSelect }: Props) {
  const gltf = useGLTF(MIXAMO_AVATARS[index % MIXAMO_AVATARS.length]!.url);
  const dims = useMemo(() => {
    const box = new Box3().setFromObject(gltf.scene);
    const h = Math.max(0.001, box.max.y - box.min.y);
    return { scale: 1.68 / h, minY: box.min.y };
  }, [gltf.scene]);
  const clone = useMemo(() => cloneWithSkeleton(gltf.scene) as Group, [gltf.scene]);
  const { actions } = useAnimations(gltf.animations, clone);
  const current = useRef<string | null>(null);
  const groupRef = useRef<Group>(null);
  const walkBones = useMemo(() => {
    const byName = new Map<string, Object3D>();
    clone.traverse((o) => {
      const key = o.name.replace('mixamorig:', '');
      byName.set(key, o);
    });
    const pick = (name: string) => byName.get(name) ?? null;
    const legL = pick('LeftUpLeg');
    const legR = pick('RightUpLeg');
    const armL = pick('LeftArm');
    const armR = pick('RightArm');
    const spine = pick('Spine');
    const base = (o: Object3D | null) => (o ? { x: o.rotation.x, z: o.rotation.z } : { x: 0, z: 0 });
    return {
      legL, legR, armL, armR, spine,
      legLBase: base(legL), legRBase: base(legR), armLBase: base(armL), armRBase: base(armR), spineBase: base(spine),
    };
  }, [clone]);
  const walkPhase = useRef(0);
  const baseY = start[1];

  useEffect(() => {
    const a = Object.values(actions)[0];
    if (!a) return;
    a.reset().play();
    current.current = a.getClip().name;
  }, [actions]);

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
      walkPhase.current += dt * 9;
      g.position.y = baseY + Math.abs(Math.sin(walkPhase.current)) * 0.035;
      const s = Math.sin(walkPhase.current);
      const b = walkBones;
      if (b.legL) b.legL.rotation.x = b.legLBase.x + s * 0.55;
      if (b.legR) b.legR.rotation.x = b.legRBase.x - s * 0.55;
      if (b.armL) b.armL.rotation.x = b.armLBase.x - s * 0.35;
      if (b.armR) b.armR.rotation.x = b.armRBase.x + s * 0.35;
      if (b.spine) b.spine.rotation.z = b.spineBase.z + s * 0.03;
    } else {
      g.rotation.y = MathUtils.damp(g.rotation.y, (index % 8) * 0.06, 4, dt);
      g.position.y = MathUtils.damp(g.position.y, baseY, 10, dt);
    }
  });

  const roleKey = ROLE_KEY[agent.role];
  const bubble = state === 'selected' ? '中标' : state === 'working' ? '工作中…' : state === 'shopping' ? '去技能铺…' : state === 'done' ? '✓ 交差' : focused ? (agent.decision.action === 'bid' ? `${agent.decision.bidAmount} 金` : '先观望') : null;
  const roleVisible = focused || selected || state === 'bidding' || state === 'selected' || state === 'working' || state === 'done' || state === 'shopping';
  const badgeY = 1.9 + (index % 2) * 0.28;

  return (
    <group ref={groupRef} position={start} onClick={(e) => { e.stopPropagation(); onSelect(agent.id); }}>
      <primitive object={clone} scale={dims.scale} position={[0, -dims.minY * dims.scale, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0]}><circleGeometry args={[0.3, 24]} /><meshBasicMaterial color="#3b3024" transparent opacity={0.2} depthWrite={false} /></mesh>
      {selected && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]}><ringGeometry args={[0.5, 0.66, 40]} /><meshBasicMaterial color="#2f6f75" transparent opacity={0.9} /></mesh>}
      <Html center position={[0, badgeY, 0]} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
        <div className={`ga-badge ga-role-${roleKey} ${selected ? 'is-selected' : ''} ${state !== 'idle' ? 'is-active' : ''}`}>
          <RoleIcon role={roleKey} size={11} /><span className="ga-badge-name">{agent.displayName}</span>
          {roleVisible && <span className="ga-badge-role">{ROLE_LABEL[agent.role]} · {STATE_LABEL[state]}</span>}
        </div>
      </Html>
      <Html center position={[0, badgeY + 0.55, 0]} zIndexRange={[21, 0]} style={{ pointerEvents: 'none' }}>{bubble ? <div className={`ga-bubble ga-bubble--${state}`}>{bubble}</div> : null}</Html>
    </group>
  );
}
