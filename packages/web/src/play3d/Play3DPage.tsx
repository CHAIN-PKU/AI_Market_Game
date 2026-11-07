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
  const hasSelection = Boolean(agent || buildingLabel);

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
            {civ ? formatCivName(civ.displayName) : '…'} · 岛上的市集文明
          </p>
        </div>
        <div className="play3d-stats tabular-nums">
          <span title="文明金币总量">💰 {totalGold}</span>
          <span>
            第 {state?.round ?? 0}/{state?.config.totalRounds ?? 30} 轮
          </span>
          <span title="居民">👥 {civ?.agents.length ?? 8}</span>
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

      <div className="play3d-body">
        <aside className="play3d-rail" aria-label="功能预告">
          <span className="play3d-rail-icon" title="规则（即将开放）">
            📜
          </span>
          <span className="play3d-rail-icon" title="回放（视觉验收后再做）">
            🎬
          </span>
          <span className="play3d-rail-icon play3d-rail-icon--active" title="岛上沙盘">
            🏝️
          </span>
        </aside>

        <div className={`play3d-main ${hasSelection ? 'play3d-main--detail' : ''}`}>
          <div className="play3d-canvas-wrap">
            {!civ ? (
              <div className="play3d-canvas-fallback">3D 场景等待 GameState…</div>
            ) : (
              <>
                <Canvas
                  shadows
                  camera={{ position: [0, 20, 24], fov: 48, near: 0.1, far: 80 }}
                >
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
                {!hasSelection && (
                  <p className="play3d-canvas-hint">拖动旋转 · 滚轮缩放 · 点居民或建筑</p>
                )}
              </>
            )}
          </div>
          {civ && hasSelection && (
            <AgentDetailPanel
              civ={civ}
              agent={agent}
              buildingLabel={agent ? null : buildingLabel}
              onClose={() => {
                setSelectedAgentId(null);
                setSelectedBuildingId(null);
              }}
            />
          )}
        </div>
      </div>

      <footer className="play3d-dock">
        <button type="button" className="play3d-dock-btn" disabled title="事件回放阶段再开放">
          下一轮
        </button>
        <span className="play3d-dock-note">本里程碑只做「看的见的小岛」；推进天数请先用 Classic。</span>
      </footer>

      {meta && (
        <p className="play3d-foot text-xs">
          {meta.playerBrainLabel} · 画面展示文明 A 的 8 位居民
        </p>
      )}
    </div>
  );
}
