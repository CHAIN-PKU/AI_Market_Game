import type { BidDemoFixture } from './types';

/**
 * A 模式：两座文明同场抢单的真实结果。
 * 数据来自引擎 runSingleRound 跑出来的一轮（scripts/add-a-mode-demo.mjs），不是拼的。
 */
export function AModePanel({ fixture, onClose }: { fixture: BidDemoFixture; onClose: () => void }) {
  const a = fixture.aMode;
  if (!a) return null;

  const home = a.civilizations[0];
  const rival = a.civilizations[1];
  const statusLabel: Record<string, string> = { completed: '做成', failed: '失败', assigned: '在干', open: '没人接' };

  return (
    <div className="g-nego-backdrop" onClick={onClose} role="presentation">
      <section
        className="g-nego g-a-mode"
        role="dialog"
        aria-modal="true"
        aria-label="A 模式：两岛同场"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="g-nego-head">
          <div>
            <span className="g-nego-kicker">A MODE · 第 {a.round} 轮</span>
            <h2>两座岛，抢同一批单</h2>
            <p>
              引擎真跑的一轮：两座文明各 8 个居民、同时出价，按「质量 0.55 + 价格 0.45」定标。
              下面是这一轮实际发生的结果。
            </p>
          </div>
          <button type="button" className="g-nego-close" onClick={onClose} aria-label="关闭">×</button>
        </header>

        <div className="g-a-score">
          <div className="g-a-side">
            <label>{home?.name ?? '本岛'}</label>
            <b>{a.wonByHome}</b>
            <em>拿下 · 国库 {home?.treasury?.toLocaleString() ?? '-'}</em>
          </div>
          <span className="g-a-vs">VS</span>
          <div className="g-a-side g-a-side--foe">
            <label>{rival?.name ?? '对岸'}</label>
            <b>{a.wonByRival}</b>
            <em>拿下 · 国库 {rival?.treasury?.toLocaleString() ?? '-'}</em>
          </div>
        </div>

        <ul className="g-a-list">
          {a.winners.map((row) => (
            <li key={row.taskId} className={row.winnerCivId === rival?.id ? 'is-foe' : ''}>
              <span className="g-a-task">{row.title}</span>
              <span className="g-a-who">
                {row.winnerName ?? '—'}
                <em>{row.winnerCivId === rival?.id ? '对岸' : '本岛'}</em>
              </span>
              <span className={`g-a-status is-${row.status}`}>{statusLabel[row.status] ?? row.status}</span>
            </li>
          ))}
        </ul>

        <footer className="g-nego-foot">
          <span>
            本轮共 {a.tasksPlayed} 张单，{a.winners.length} 张有人接。
            {a.wonByRival > a.wonByHome ? '对岸共享技能，质量更高，抢走了更多单。' : '本岛报价更狠，抢到了更多单。'}
          </span>
          <div>
            <button type="button" className="g-nego-done" onClick={onClose}>知道了</button>
          </div>
        </footer>
      </section>
    </div>
  );
}
