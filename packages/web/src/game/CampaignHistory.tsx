import { CloseIcon } from './icons';
import { gold } from './presentation';
import { DOMAIN_LABEL, type RoundHistory } from './types';

export function CampaignHistory({
  round,
  maxRounds,
  history,
  onClose,
}: {
  round: number;
  maxRounds: number;
  history: RoundHistory[];
  onClose: () => void;
}) {
  const totalTax = history.reduce((sum, r) => sum + (r.tax ?? 0), 0);
  const wins = history.filter((r) => r.winner).length;
  return (
    <div className="g-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="g-history" role="dialog" aria-modal="true" aria-labelledby="g-history-title">
        <header className="g-history-head">
          <div>
            <h2 id="g-history-title">文明编年史</h2>
            <p>
              第 {round}/{maxRounds} 轮 · 同一批居民，制度与市场共同写下的记录
            </p>
          </div>
          <button type="button" className="g-icon-btn" onClick={onClose} aria-label="关闭编年史">
            <CloseIcon size={16} />
          </button>
        </header>

        <div className="g-history-stats">
          <span>
            已记录 <b>{history.length}</b> 轮
          </span>
          <span>
            有中标 <b>{wins}</b> 轮
          </span>
          <span>
            累计税 <b>{gold(totalTax)}</b>
          </span>
        </div>

        {history.length === 0 ? (
          <p className="g-history-empty">还没有记录。推进一轮后再来看。</p>
        ) : (
          <div className="g-history-table-wrap">
            <table className="g-history-table">
              <thead>
                <tr>
                  <th>轮</th>
                  <th>任务</th>
                  <th>中标</th>
                  <th>报价</th>
                  <th>税 / 到手</th>
                  <th>技能</th>
                  <th>国库</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r, i) => (
                  <tr key={`${r.round}-${i}`} className={i === history.length - 1 ? 'is-latest' : undefined}>
                    <td>{r.round}</td>
                    <td>
                      <span className={`g-history-domain g-history-domain--${r.domain}`}>
                        {DOMAIN_LABEL[r.domain as keyof typeof DOMAIN_LABEL] ?? r.domain}
                      </span>
                      {r.title}
                    </td>
                    <td>{r.winner ?? '流标'}</td>
                    <td>{r.bid === null ? '—' : gold(r.bid)}</td>
                    <td>{r.tax === null ? '—' : `${gold(r.tax)} / ${gold(r.net ?? 0)}`}</td>
                    <td>{r.skill ?? '—'}</td>
                    <td>{gold(r.treasuryAfter)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <footer className="g-history-foot">
          <span className="g-muted">历史只记录引擎结果，不由动画改写。</span>
          <button type="button" className="g-btn g-btn--ghost" onClick={onClose}>
            关闭
          </button>
        </footer>
      </section>
    </div>
  );
}
