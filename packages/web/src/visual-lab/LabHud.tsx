import type { VisualScheme } from './types';

const AGENT_NAMES = [
  'Helix',
  'Nova',
  'Pixel',
  'Quill',
  'Sage',
  'Mosaic',
  'Ledger',
  'Ember',
];

export function LabHud({
  scheme,
  onSchemeChange,
}: {
  scheme: VisualScheme;
  onSchemeChange: (s: VisualScheme) => void;
}) {
  return (
    <>
      <header className="vlab-top">
        <div>
          <h1 className="vlab-title">AI Market Game · Visual Lab</h1>
          <p className="vlab-sub">
            方案 {scheme === 'kenney' ? 'A · Kenney' : 'B · Quaternius'} · 不接 Simulation
          </p>
        </div>
        <div className="vlab-stats tabular-nums">
          <span>💰 12,480</span>
          <span>第 0/30 轮</span>
          <span>👥 8</span>
        </div>
        <div className="vlab-scheme-toggle" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={scheme === 'kenney'}
            className={scheme === 'kenney' ? 'vlab-tab vlab-tab--on' : 'vlab-tab'}
            onClick={() => onSchemeChange('kenney')}
          >
            A Kenney
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={scheme === 'quaternius'}
            className={scheme === 'quaternius' ? 'vlab-tab vlab-tab--on' : 'vlab-tab'}
            onClick={() => onSchemeChange('quaternius')}
          >
            B Quaternius
          </button>
        </div>
      </header>

      <aside className="vlab-left">
        <h2 className="vlab-panel-h">市集公告</h2>
        <div className="vlab-card">
          <p className="vlab-card-title">模拟悬赏 · 写界面</p>
          <p className="vlab-card-meta">起拍 120 金 · 3 人盯单</p>
        </div>
        <div className="vlab-card vlab-card--muted">
          <p className="vlab-card-title">技能铺上新</p>
          <p className="vlab-card-meta">「快速交付」教程 80 金</p>
        </div>
      </aside>

      <aside className="vlab-right">
        <h2 className="vlab-panel-h">居民 · Helix</h2>
        <blockquote className="vlab-voice">「先把市集单啃下来，钱包才能呼吸。」</blockquote>
        <dl className="vlab-grid">
          <div>
            <dt>职业</dt>
            <dd>写程序</dd>
          </div>
          <div>
            <dt>金币</dt>
            <dd>340</dd>
          </div>
          <div>
            <dt>技能</dt>
            <dd>2 项</dd>
          </div>
        </dl>
        <p className="vlab-footnote">HUD 为策略游戏占位，数据为静态示意。</p>
      </aside>

      <footer className="vlab-dock">
        <button type="button" className="vlab-dock-btn">
          发布任务
        </button>
        <button type="button" className="vlab-dock-btn vlab-dock-btn--ghost">
          制度
        </button>
        <button type="button" className="vlab-dock-btn vlab-dock-btn--ghost">
          技能铺
        </button>
        <button type="button" className="vlab-dock-btn" disabled>
          时间 · 下一轮
        </button>
      </footer>

      <div className="vlab-agent-strip" aria-hidden>
        {AGENT_NAMES.map((n) => (
          <span key={n} className="vlab-chip">
            {n}
          </span>
        ))}
      </div>
    </>
  );
}
