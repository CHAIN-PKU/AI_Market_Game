import { formatCivName } from '../lib/civDisplay';
import type { CivilizationState } from '../types';

export function CivPkStrip({
  civA,
  civB,
  roundOutA,
  roundOutB,
}: {
  civA: CivilizationState;
  civB: CivilizationState;
  roundOutA: number;
  roundOutB: number;
}) {
  const total = Math.max(1, roundOutA + roundOutB);
  const pctA = Math.round((roundOutA / total) * 100);
  const pctB = 100 - pctA;
  const leader =
    roundOutA === roundOutB ? '本回合平局' : roundOutA > roundOutB ? 'A 暂领先' : 'B 暂领先';

  return (
    <section className="civ-pk" aria-label="文明对战">
      <div className="civ-pk-header">
        <span className="civ-pk-badge">PK</span>
        <span className="civ-pk-lead">{leader}</span>
        <span className="civ-pk-sub">本回合产出</span>
      </div>
      <div className="civ-pk-scores">
        <div className="civ-pk-name civ-pk-name-a">{formatCivName(civA.displayName)}</div>
        <div className="civ-pk-vs">VS</div>
        <div className="civ-pk-name civ-pk-name-b">{formatCivName(civB.displayName)}</div>
      </div>
      <div className="civ-pk-bar">
        <div
          className="civ-pk-fill civ-pk-fill-a"
          style={{ width: `${pctA}%` }}
          title={`${roundOutA}`}
        />
        <div
          className="civ-pk-fill civ-pk-fill-b"
          style={{ width: `${pctB}%` }}
          title={`${roundOutB}`}
        />
      </div>
      <div className="civ-pk-numbers">
        <span className="tabular-nums">{roundOutA}</span>
        <span className="tabular-nums">{roundOutB}</span>
      </div>
    </section>
  );
}
