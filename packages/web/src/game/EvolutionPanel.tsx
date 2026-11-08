import type { BidDemoFixture } from './types';

/**
 * 中标之后发生了什么：到手 → 缺口 → 训练投资 → 能力/成功率变化 → 文明倾向。
 * 数字全部来自 fixture.evolution（由 scripts/add-evolution-demo.mjs 用引擎算出来）。
 */
export function EvolutionPanel({ fixture, onClose }: { fixture: BidDemoFixture; onClose: () => void }) {
  const evo = fixture.evolution;

  if (!evo) return null;

  const pct = (n: number) => `${Math.round(n * 100)}%`;
  const leanTotal = Math.max(1, evo.civLean.coding + evo.civLean.research + evo.civLean.design);

  return (
    <div className="g-nego-backdrop" onClick={onClose} role="presentation">
      <section
        className="g-nego g-evo"
        role="dialog"
        aria-modal="true"
        aria-label="投资与进化"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="g-nego-head">
          <div>
            <span className="g-nego-kicker">AFTER THE WIN · 第 {fixture.demoRound} 轮</span>
            <h2>投资 · 进化</h2>
            <p>{evo.taskTitle} 中标之后，钱去哪了、能力怎么就变了——每一步都是引擎算的。</p>
          </div>
          <button type="button" className="g-nego-close" onClick={onClose} aria-label="关闭">×</button>
        </header>

        <ol className="g-evo-rail">
          <li className="g-evo-node">
            <span className="g-evo-num">1</span>
            <span className="g-evo-node-label">中标</span>
            <b>{evo.displayName}</b>
            <em>报价 {evo.bidAmount} 金</em>
          </li>
          <li className="g-evo-node">
            <span className="g-evo-num">2</span>
            <span className="g-evo-node-label">到手</span>
            <b>{evo.walletBefore} 金</b>
            <em>奖励 {evo.taskReward} − 税 {evo.taxPaid}</em>
          </li>
          <li className="g-evo-node g-evo-node--warn">
            <span className="g-evo-num">3</span>
            <span className="g-evo-node-label">缺口</span>
            <b>差 {evo.shortfallToSkill} 金</b>
            <em>技能要 {evo.cheapestSkillPrice}，买不起</em>
          </li>
          <li className="g-evo-node g-evo-node--ok">
            <span className="g-evo-num">4</span>
            <span className="g-evo-node-label">训练</span>
            <b>−{evo.trainingCost} 金</b>
            <em>{evo.reason}</em>
          </li>
        </ol>

        <div className="g-evo-result">
          <div className="g-evo-metric" data-kind="ability">
            <span>{evo.domain === 'coding' ? '写代码' : evo.domain} 能力</span>
            <b>
              {evo.abilityBefore}
              <i>→</i>
              {evo.abilityAfter}
            </b>
            <em>+{evo.trainingBonus}</em>
          </div>
          <div className="g-evo-metric" data-kind="odds">
            <span>下轮成功率</span>
            <b>
              {pct(evo.successBefore)}
              <i>→</i>
              {pct(evo.successAfter)}
            </b>
            <em>+{Math.round((evo.successAfter - evo.successBefore) * 100)}pt</em>
          </div>
          <div className="g-evo-metric" data-kind="wallet">
            <span>钱包</span>
            <b>
              {evo.walletBefore}
              <i>→</i>
              {evo.walletAfter}
            </b>
            <em>留着下次买技能</em>
          </div>
        </div>

        <div className="g-evo-lean">
          <span className="g-evo-lean-title">文明现在偏向哪个方向</span>
          {(['coding', 'research', 'design'] as const).map((k) => (
            <div key={k} className="g-evo-bar">
              <label>{k === 'coding' ? '写码' : k === 'research' ? '研究' : '设计'}</label>
              <div className="g-evo-track">
                <span style={{ width: `${Math.round((evo.civLean[k] / leanTotal) * 100)}%` }} />
              </div>
              <b>{evo.civLean[k]}</b>
            </div>
          ))}
        </div>

        <footer className="g-nego-foot">
          <span>训练是最小可负担的一步：40 金换 +4，比不上 80 金的技能，但今天就能变强。</span>
          <div>
            <button type="button" className="g-nego-done" onClick={onClose}>知道了</button>
          </div>
        </footer>
      </section>
    </div>
  );
}
