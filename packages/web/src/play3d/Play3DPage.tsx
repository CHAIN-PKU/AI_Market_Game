import { Canvas } from '@react-three/fiber';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createGame, fetchMeta } from '../api';
import type { GameMeta, GameState } from '../types';
import { formatCivName } from '../lib/civDisplay';
import { AgentDetailPanel } from './AgentDetailPanel';
import { CivilizationScene } from './CivilizationScene';
import { BUILDINGS } from './sceneConfig';

export function Play3DPage() {
  const [meta, setMeta] = useState<GameMeta | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);

  const boot = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const m = await fetchMeta();
      setMeta(m);
      const g = await createGame();
      setState(g.state);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'load_failed';
      setLoadError(
        `无法连接后端：${msg}。请先在本机运行 npm run dev（API 3001 + 前端 5173）。`,
      );
      setState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void boot();
  }, [boot]);

  const civ = state?.civilizations[0] ?? null;
  const agent = civ?.agents.find((a) => a.id === selectedAgentId) ?? null;
  const buildingLabel =
    selectedBuildingId != null
      ? (BUILDINGS.find((b) => b.id === selectedBuildingId)?.label ?? null)
      : null;

  const totalGold =
    civ == null
      ? 0
      : civ.treasury + civ.agents.reduce((s, a) => s + a.wallet, 0);

  return (
    <div className="play3d-shell">
      <header className="play3d-top">
        <div>
          <h1 className="play3d-title">AI Market Game</h1>
          <p className="play3d-sub">
            {civ ? formatCivName(civ.displayName) : '…'} · 3D Walking Skeleton
          </p>
        </div>
        <div className="play3d-stats tabular-nums">
          <span>💰 {totalGold}</span>
          <span>
            第 {state?.round ?? 0}/{state?.config.totalRounds ?? 30} 轮
          </span>
          <span>👥 {civ?.agents.length ?? 8}</span>
        </div>
        <nav className="play3d-nav">
          <Link to="/" className="btn-ghost">
            入口
          </Link>
          <Link to="/classic" className="btn-secondary">
            Classic UI
          </Link>
        </nav>
      </header>

      {loadError && (
        <p className="play3d-error" role="alert">
          {loadError}
          <button type="button" className="btn-secondary ml-2" onClick={() => void boot()}>
            重试
          </button>
        </p>
      )}

      {loading && !loadError && <p className="play3d-hint">正在向 API 请求新对局…</p>}

      <div className="play3d-main">
        <div className="play3d-canvas-wrap">
          {!civ ? (
            <div className="play3d-canvas-fallback">3D 场景等待 GameState…</div>
          ) : (
            <Canvas shadows camera={{ position: [12, 14, 12], fov: 42, near: 0.1, far: 80 }}>
              <Suspense fallback={null}>
                <CivilizationScene
                  civ={civ}
                  selectedAgentId={selectedAgentId}
                  selectedBuildingId={selectedBuildingId}
                  onSelectAgent={(id) => {
                    setSelectedBuildingId(null);
                    setSelectedAgentId(id);
                  }}
                  onSelectBuilding={(id) => {
                    setSelectedAgentId(null);
                    setSelectedBuildingId(id);
                  }}
                />
              </Suspense>
            </Canvas>
          )}
        </div>
        {civ ? (
          <AgentDetailPanel
            civ={civ}
            agent={agent}
            buildingLabel={agent ? null : buildingLabel}
            onClose={() => {
              setSelectedAgentId(null);
              setSelectedBuildingId(null);
            }}
          />
        ) : (
          <aside className="play3d-detail play3d-detail-empty">
            <p>加载对局后可点选居民。</p>
          </aside>
        )}
      </div>

      {meta && (
        <p className="play3d-foot text-xs text-[var(--color-muted)]">
          大脑模式：{meta.playerBrainLabel} · 本屏仅展示文明 A（Slice 单文明）
        </p>
      )}
    </div>
  );
}
