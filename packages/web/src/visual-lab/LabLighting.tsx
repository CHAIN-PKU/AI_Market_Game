import { OrbitControls, Sky } from '@react-three/drei';
import { LAB_CAMERA, ORBIT_LIMITS } from './islandLayout';

export function LabLighting() {
  return (
    <>
      <Sky sunPosition={[60, 30, 40]} turbidity={0.6} rayleigh={0.4} />
      <fog attach="fog" args={['#cfe8ec', 38, 78]} />
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
      <OrbitControls
        makeDefault
        target={LAB_CAMERA.target}
        minDistance={ORBIT_LIMITS.minDistance}
        maxDistance={ORBIT_LIMITS.maxDistance}
        minPolarAngle={ORBIT_LIMITS.minPolarAngle}
        maxPolarAngle={ORBIT_LIMITS.maxPolarAngle}
        enablePan={false}
      />
    </>
  );
}
