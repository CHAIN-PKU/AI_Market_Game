import { formatCivName } from '../lib/civDisplay';
import type { CivilizationState } from '../types';

export function PreRoundPanel({
  civA,
  civB,
  totalRounds,
}: {
  civA: CivilizationState;
  civB: CivilizationState;
  totalRounds: number;
}) {
  return (
    <section className="pre-round">
      <p className="pre-round-kicker">市集尚未开门</p>
      <h2 className="pre-round-title">今天会是哪座文明先开张？</h2>
      <p className="pre-round-body">
        {formatCivName(civA.displayName)} 与 {formatCivName(civB.displayName)} 各 8 位 AI
        居民已就位。点击下方 <strong>开启第 1 天</strong>，他们才会去抢单、交差、赚钱。
      </p>
      <p className="pre-round-foot">共 {totalRounds} 天 · 随时可点文明卡片认人</p>
    </section>
  );
}
