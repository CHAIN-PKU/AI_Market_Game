import { formatCivName } from '../lib/civDisplay';
import type { OligarchyAlert } from '../lib/roundStory';

export function OligarchyBanner({
  alert,
  onPostTask,
  onOpenRules,
}: {
  alert: OligarchyAlert;
  onPostTask: () => void;
  onOpenRules: () => void;
}) {
  const pct = Math.round(alert.wealthShare * 100);

  return (
    <div className="oligarchy-banner" role="alert">
      <div className="oligarchy-icon" aria-hidden>
        <span className="oligarchy-exclaim">!</span>
      </div>
      <div className="oligarchy-body">
        <p className="oligarchy-title">寡头警告 · {formatCivName(alert.civilizationName)}</p>
        <p className="oligarchy-def">
          <strong>寡头</strong>：少数人拿走文明里大部分金币（本局阈值 ≥42%）。{alert.richestName ?? '某人'}{' '}
          目前约占 <strong>{pct}%</strong>，竞争容易变「一家独大」。
        </p>
        <div className="oligarchy-actions">
          <button type="button" className="btn-oligarchy" onClick={onPostTask}>
            发悬赏拉新人
          </button>
          <button type="button" className="btn-oligarchy-secondary" onClick={onOpenRules}>
            改制度（税/共享）
          </button>
        </div>
      </div>
    </div>
  );
}
