import { Canvas, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGLTF } from '@react-three/drei';
import { LAB_CAMERA, VIEW_PRESETS, type ViewPreset } from './islandLayout';
import { ALL_PRELOAD_URLS } from './assetUrls';
import { KenneyLabScene } from './KenneyLabScene';
import { QuaterniusLabScene } from './QuaterniusLabScene';
import { LabHud } from './LabHud';
import type { VisualScheme } from './types';
import { resolveGlbUrl } from './GlbInstance';

const preloadUrls = [...new Set(ALL_PRELOAD_URLS.map((u) => resolveGlbUrl(u)))];
for (const url of preloadUrls) {
  useGLTF.preload(url);
}

type OrbitLikeControls = {
  target: { set: (x: number, y: number, z: number) => void };
  update: () => void;
};

/** Applies a reproducible camera preset so screenshots can be taken without hand-orbit. */
function CameraPreset({ view }: { view: ViewPreset }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as OrbitLikeControls | null;

  useEffect(() => {
    const preset = VIEW_PRESETS[view];
    camera.position.set(...preset.position);
    if (controls) {
      controls.target.set(...preset.target);
      controls.update();
    } else {
      camera.lookAt(...preset.target);
    }
  }, [view, camera, controls]);

  return null;
}

export function VisualLabPage() {
  const [scheme, setScheme] = useState<VisualScheme>('kenney');
  const [view, setView] = useState<ViewPreset>('default');

  return (
    <div className="vlab-shell">
      <LabHud scheme={scheme} onSchemeChange={setScheme} view={view} onViewChange={setView} />
      <div className="vlab-canvas">
        <Canvas
          shadows
          camera={{ position: LAB_CAMERA.position, fov: LAB_CAMERA.fov, near: 0.1, far: 140 }}
        >
          <CameraPreset view={view} />
          <Suspense fallback={null}>
            {scheme === 'kenney' ? <KenneyLabScene /> : <QuaterniusLabScene />}
          </Suspense>
        </Canvas>
      </div>
      <p className="vlab-links">
        <Link to="/">入口</Link>
        <span> · </span>
        <Link to="/play-3d">/play-3d（保留）</Link>
        <span> · 同一布局与镜头，切换 A/B 做公平对比</span>
      </p>
    </div>
  );
}
