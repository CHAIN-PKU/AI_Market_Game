import { OrbitControls, Sky } from '@react-three/drei';
import { LAB_CAMERA, ORBIT_LIMITS } from './islandLayout';

export function LabLighting() {
  return (
    <>
      <Sky sunPosition={[70, 28, 45]} turbidity={0.55} rayleigh={0.48} />
      <fog attach="fog" args={['#c8e4ee', 28, 55]} />
      <ambientLight intensity={0.55} color="#fff9ed" />
      <hemisphereLight intensity={0.4} color="#b8e8ff" groundColor="#79ae87" />
      <directionalLight
        castShadow
        position={[14, 24, 12]}
        intensity={1.35}
        color="#fff3d0"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={45}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
      />
      <OrbitControls
        makeDefault
        target={LAB_CAMERA.target}
        minDistance={ORBIT_LIMITS.minDistance}
        maxDistance={ORBIT_LIMITS.maxDistance}
        minPolarAngle={ORBIT_LIMITS.minPolarAngle}
        maxPolarAngle={ORBIT_LIMITS.maxPolarAngle}
      />
    </>
  );
}
