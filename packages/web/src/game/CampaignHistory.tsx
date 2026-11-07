import { useState } from 'react';
import { CloseIcon } from './icons';
import { chronicleJson, chronicleMarkdown, chronicleShareText } from './campaignExport';
import { gold } from './presentation';
import { DOMAIN_LABEL, type RoundHistory } from './types';

function download(filename: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function CampaignHistory({
  civilization,
  round,
  maxRounds,
  rules,
  history,
  onClose,
}: {
  civilization: string;
  round: number;
  maxRounds: number;
  rules: { name: string; taxRate: number };
  history: RoundHistory[];
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const totalTax = history.reduce((sum, r) => sum + (r.tax ?? 0), 0);
  const wins = history.filter((r) => r.winner).length;
  const meta = { civilization, round, maxRounds, rules, history };
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');

  const copyShare = () => {
    const text = chronicleShareText(meta);
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <div className="g-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="g-history" role="dialog" aria-modal="true" aria-labelledby="g-history-title">
        <header className="g-history-head">
          <div>
            <h2 id="g-history-title">这 5 轮发生了什么</h2>
            <p>第 {round}/{maxRounds} 轮 · 同一批居民自己走出来的结果</p>
          </div>
          <button type="button" className="g-icon-btn" onClick={onClose} aria-label="关闭编年史">
            <CloseIcon size={16} />
          </button>
        </header>

        <div className="g-history-stats">
          <span>
            跑了 <b>{history.length}</b> 轮
          </span>
          <span>
            有人接单 <b>{wins}</b> 轮
          </span>
          <span>
            税钱 <b>{gold(totalTax)}</b>
          </span>
        </div>

        {history.length === 0 ? (
          <p className="g-history-empty">还没有记录。推进一轮后再来看。</p>
        ) : (
          <div className="g-history-table-wrap">
            <table className="g-history-table">
              <thead>
                <tr>
                  <th>第几轮</th>
                  <th>任务</th>
                  <th>谁接的</th>
                  <th>报价</th>
                  <th>税 / 到手</th>
                  <th>买了什么</th>
                  <th>本事</th>
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
                    <td>
                      {r.abilityBefore === null || r.abilityBefore === undefined
                        ? '—'
                        : r.abilityAfter === null || r.abilityAfter === undefined
                          ? r.abilityBefore
                          : r.abilityBefore === r.abilityAfter
                            ? r.abilityBefore
                            : `${r.abilityBefore} → ${r.abilityAfter}`}
                    </td>
                    <td>{gold(r.treasuryAfter)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <footer className="g-history-foot">
          <span className="g-muted">只记引擎算出来的结果，动画改不了。</span>
          <div className="g-history-actions">
            <button
              type="button"
              className="g-btn g-btn--ghost"
              onClick={() => download(`ai-civ-chronicle-${stamp}.md`, chronicleMarkdown(meta), 'text/markdown')}
            >
              存成 Markdown
            </button>
            <button
              type="button"
              className="g-btn g-btn--ghost"
              onClick={() => download(`ai-civ-chronicle-${stamp}.json`, chronicleJson(meta), 'application/json')}
            >
              存成 JSON
            </button>
            <button type="button" className="g-btn g-btn--ghost" onClick={copyShare}>
              {copied ? '已复制' : '复制分享文案'}
            </button>
            <button type="button" className="g-btn g-btn--ghost" onClick={onClose}>
              关闭
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
