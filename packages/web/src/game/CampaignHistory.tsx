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
  done,
  onRestart,
  onClose,
}: {
  civilization: string;
  round: number;
  maxRounds: number;
  rules: { name: string; taxRate: number };
  history: RoundHistory[];
  done?: boolean;
  onRestart?: () => void;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const totalTax = history.reduce((sum, r) => sum + (r.tax ?? 0), 0);
  const wins = history.filter((r) => r.winner).length;
  const winnerCounts = new Map<string, number>();
  for (const r of history) {
    if (r.winner) winnerCounts.set(r.winner, (winnerCounts.get(r.winner) ?? 0) + 1);
  }
  const skillCount = history.filter((r) => r.skill).length;
  const maxGain = history.reduce((max, r) => {
    if (r.abilityBefore == null || r.abilityAfter == null) return max;
    return Math.max(max, r.abilityAfter - r.abilityBefore);
  }, 0);
  const lastTreasury = history[history.length - 1]?.treasuryAfter ?? null;
  const incomeTotals = new Map<string, number>();
  for (const r of history) {
    for (const income of r.incomes ?? []) {
      incomeTotals.set(income.name, (incomeTotals.get(income.name) ?? 0) + income.net);
    }
  }
  const earners = [...incomeTotals.entries()].filter(([, net]) => net > 0).sort((a, b) => b[1] - a[1]);
  const zeroEarners = [...incomeTotals.entries()].filter(([, net]) => net <= 0).length;
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
          <span>
            买技能 <b>{skillCount}</b> 次
          </span>
          <span>
            最大本事 <b>+{maxGain}</b>
          </span>
          <span>
            国库 <b>{lastTreasury === null ? '—' : gold(lastTreasury)}</b>
          </span>
        </div>

        {winnerCounts.size > 0 && (
          <p className="g-history-winners">
            谁接过单：
            {[...winnerCounts.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([name, n]) => `${name} ${n} 次`)
              .join(' · ')}
          </p>
        )}

        {earners.length > 0 && (
          <p className="g-history-income">
            谁赚到了钱：
            {earners
              .slice(0, 4)
              .map(([name, net]) => `${name} ${gold(net)}`)
              .join(' · ')}
            {zeroEarners > 0 ? ` · 其他 ${zeroEarners} 人 0 金` : ''}
          </p>
        )}

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
                    <td>{r.winner ?? '流标'}{r.failed ? ' · 搞砸' : ''}</td>
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
            {done && onRestart && (
              <button
                type="button"
                className="g-btn g-btn--primary"
                onClick={() => {
                  onRestart();
                  onClose();
                }}
              >
                再跑 5 轮
              </button>
            )}
            <button type="button" className="g-btn g-btn--ghost" onClick={onClose}>
              关闭
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
