import { Canvas } from '@react-three/fiber';
import { Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGLTF } from '@react-three/drei';
import { LAB_CAMERA } from './islandLayout';
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

export function VisualLabPage() {
  const [scheme, setScheme] = useState<VisualScheme>('kenney');

  return (
    <div className="vlab-shell">
      <LabHud scheme={scheme} onSchemeChange={setScheme} />
      <div className="vlab-canvas">
        <Canvas
          shadows
          camera={{
            position: LAB_CAMERA.position,
            fov: LAB_CAMERA.fov,
            near: 0.1,
            far: 80,
          }}
        >
          <Suspense
            fallback={
              <mesh>
                <boxGeometry args={[0.1, 0.1, 0.1]} />
                <meshBasicMaterial color="#4c9fa8" />
              </mesh>
            }
          >
            {scheme === 'kenney' ? <KenneyLabScene /> : <QuaterniusLabScene />}
          </Suspense>
        </Canvas>
        <p className="vlab-shot-hint">
          截图验收：1920×1080 · 默认镜头 · 顶视 · 拉近 Helix。同布局切换 A/B 对比。
        </p>
      </div>
      <p className="vlab-links">
        <Link to="/">入口</Link>
        <span> · </span>
        <Link to="/play-3d">程序化 /play-3d（保留）</Link>
        <span> · </span>
        <a href="https://github.com/Hidencod/tge-assets" target="_blank" rel="noreferrer">
          tge-assets
        </a>
      </p>
    </div>
  );
}
