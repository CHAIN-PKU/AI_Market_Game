import { formatCivName } from '../lib/civDisplay';
import type { CivilizationState } from '../types';

export function CivSummaryCard({
  civ,
  side,
  metrics,
  onOpen,
}: {
  civ: CivilizationState;
  side: 'a' | 'b';
  metrics?: { totalGrossOutput: number; tasksSucceeded: number; tasksFailed: number };
  onOpen: () => void;
}) {
  const top = [...civ.agents].sort((a, b) => b.wallet - a.wallet)[0];
  const accent = side === 'a' ? 'var(--color-a)' : 'var(--color-b)';

  return (
    <button type="button" className={`civ-card civ-card-${side}`} onClick={onOpen}>
      <span className="civ-card-label">{formatCivName(civ.displayName)}</span>
      <span className="civ-card-metric">{metrics?.totalGrossOutput ?? 0}</span>
      <span className="civ-card-sub">总产出（累计交差赏金）</span>
      {top && (
        <span className="civ-card-foot" style={{ color: accent }}>
          {top.displayName} {top.wallet}
        </span>
      )}
    </button>
  );
}
