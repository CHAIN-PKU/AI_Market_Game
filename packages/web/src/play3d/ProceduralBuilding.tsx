import type { BuildingDef } from './sceneConfig';

export function ProceduralBuilding({
  def,
  selected,
  onSelect,
}: {
  def: BuildingDef;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const yBase = 0.18;
  const emissive = selected ? '#253c3a' : '#000000';
  const intensity = selected ? 0.2 : 0;

  return (
    <group
      position={[def.x, yBase, def.z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(def.id);
      }}
    >
      <mesh castShadow receiveShadow position={[0, def.h / 2, 0]}>
        <boxGeometry args={[def.w, def.h, def.d]} />
        <meshStandardMaterial color={def.body} emissive={emissive} emissiveIntensity={intensity} />
      </mesh>
      {def.kind === 'market' && (
        <>
          <mesh castShadow position={[0, def.h + 0.25, def.d * 0.35]}>
            <boxGeometry args={[def.w * 1.05, 0.15, 0.4]} />
            <meshStandardMaterial color="#e7b65a" />
          </mesh>
          <mesh position={[0, def.h + 1, 0]}>
            <boxGeometry args={[0.35, 0.5, 0.08]} />
            <meshStandardMaterial color="#d77f54" emissive="#d77f54" emissiveIntensity={0.15} />
          </mesh>
        </>
      )}
      {def.kind === 'skill' && (
        <mesh position={[0, def.h * 0.5, def.d * 0.48]}>
          <boxGeometry args={[0.6, 0.9, 0.08]} />
          <meshStandardMaterial color="#4c9fa8" emissive="#4c9fa8" emissiveIntensity={0.2} />
        </mesh>
      )}
      {def.kind !== 'market' && def.kind !== 'skill' && (
        <mesh castShadow position={[0, def.h + 0.28, 0]}>
          <boxGeometry args={[def.w * 0.95, 0.42, def.d * 0.95]} />
          <meshStandardMaterial color={def.roof} />
        </mesh>
      )}
      {def.kind === 'research' && (
        <mesh position={[0, def.h + 0.85, 0]}>
          <sphereGeometry args={[0.4, 12, 10]} />
          <meshStandardMaterial color="#9b8fd9" metalness={0.15} roughness={0.45} />
        </mesh>
      )}
      {def.kind === 'design' && (
        <mesh position={[def.w * 0.25, def.h + 0.5, 0]}>
          <boxGeometry args={[0.5, 0.35, 0.05]} />
          <meshStandardMaterial color="#d77f54" />
        </mesh>
      )}
      {def.kind === 'coding' && (
        <mesh position={[def.w * 0.3, def.h * 0.55, def.d * 0.42]}>
          <boxGeometry args={[0.35, 0.28, 0.05]} />
          <meshStandardMaterial color="#253c3a" emissive="#2244aa" emissiveIntensity={0.35} />
        </mesh>
      )}
      {def.kind === 'public-rd' && (
        <mesh position={[0, def.h + 0.55, 0]}>
          <cylinderGeometry args={[0.55, 0.65, 0.35, 16]} />
          <meshStandardMaterial color="#79ae87" />
        </mesh>
      )}
      {def.kind === 'homes' && (
        <>
          {[ -1.5, 0, 1.5 ].map((ox) => (
            <mesh key={ox} castShadow position={[ox, def.h / 2, 0]}>
              <boxGeometry args={[1.2, def.h, 0.9]} />
              <meshStandardMaterial color="#fff9ed" />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}
