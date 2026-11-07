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
  const yBase = 0.25;
  const emissive = selected ? '#332200' : '#000000';
  const intensity = selected ? 0.35 : 0;

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
      <mesh castShadow position={[0, def.h + 0.35, 0]}>
        <boxGeometry args={[def.w * 0.92, 0.55, def.d * 0.92]} />
        <meshStandardMaterial color={def.roof} />
      </mesh>
      {def.kind === 'market' && (
        <mesh position={[0, def.h + 1.1, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 1.8, 6]} />
          <meshStandardMaterial color={def.accent ?? '#f4b942'} />
        </mesh>
      )}
      {def.kind === 'research' && (
        <mesh position={[0, def.h + 0.9, 0]}>
          <sphereGeometry args={[0.55, 12, 10]} />
          <meshStandardMaterial color="#9b8fd9" metalness={0.2} roughness={0.4} />
        </mesh>
      )}
      {def.accent && def.kind === 'coding' && (
        <mesh position={[def.w * 0.35, def.h * 0.55, def.d * 0.45]}>
          <boxGeometry args={[0.4, 0.3, 0.05]} />
          <meshStandardMaterial color={def.accent} emissive="#2244aa" emissiveIntensity={0.4} />
        </mesh>
      )}
    </group>
  );
}
