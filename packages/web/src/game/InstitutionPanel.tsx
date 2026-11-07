import { useState } from 'react';
import type { BidDemoFixture } from './types';
import { CloseIcon, CoinIcon, PeopleIcon, SkillIcon } from './icons';

type Props = {
  fixture: BidDemoFixture;
  onClose: () => void;
  onApplied: (fixture: BidDemoFixture, summary: string) => void;
};

export function summarizeRun(fixture: BidDemoFixture): string {
  const head = `第 ${fixture.demoRound} 轮`;
  if (!fixture.winner) return `${head} · 本轮无人中标`;
  const parts = [`${fixture.winner.displayName} 中标 ${fixture.winner.bidAmount} 金`];
  if (fixture.settlement) {
    parts.push(`到手 ${fixture.settlement.net}，税 ${fixture.settlement.tax}`);
  }
  const skill = fixture.skillPurchase[0];
  if (skill) {
    parts.push(`买「${skill.name}」写程序 ${skill.abilityBefore} → ${skill.abilityAfter}`);
  } else {
    parts.push('本轮没有买技能');
  }
  return `${head} · ${parts.join(' · ')}`;
}

function rulesName(taxPct: number, ownership: 'private' | 'shared'): string {
  if (ownership === 'shared') return '公共研发';
  if (taxPct >= 25) return '高税再分配';
  if (taxPct <= 5) return '低税自由市场';
  return '自由市场';
}

export function InstitutionPanel({ fixture, onClose, onApplied }: Props) {
  const rules = fixture.civilization.rules;
  const [taxPct, setTaxPct] = useState(Math.round(rules.taxRate * 100));
  const [sharePct, setSharePct] = useState(Math.round(rules.publicResearchShare * 100));
  const [ownership, setOwnership] = useState<'private' | 'shared'>(rules.skillOwnership === 'shared' ? 'shared' : 'private');
  const [seed, setSeed] = useState(String(fixture.seed));
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runRound() {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch('/api/demo/round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seed: Number(seed) || fixture.seed,
          tasksPerRound: fixture.tasksPerRound,
          warmupRounds: fixture.warmupRounds,
          initialAbility: fixture.initialAbility,
          rules: {
            name: rulesName(taxPct, ownership),
            taxRate: taxPct / 100,
            publicResearchShare: sharePct / 100,
            skillOwnership: ownership,
          },
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`引擎返回 ${res.status}${text ? `：${text.slice(0, 120)}` : ''}`);
      }
      const data = (await res.json()) as { fixture: BidDemoFixture };
      if (!data?.fixture?.agents?.length) throw new Error('引擎返回的回合数据不完整');
      onApplied(data.fixture, summarizeRun(data.fixture));
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message}（需要 API 3001 在运行：npm run dev:server）`
          : '引擎调用失败',
      );
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="g-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="g-lab" role="dialog" aria-modal="true" aria-labelledby="g-rules-title">
        <header className="g-rules-head">
          <div>
            <h2 id="g-rules-title">制度实验台</h2>
            <p>同一个种子、同一批居民，只改规则，让引擎重新跑一回合。</p>
          </div>
          <button type="button" className="g-icon-btn" onClick={onClose} aria-label="关闭制度实验台">
            <CloseIcon size={16} />
          </button>
        </header>

        <div className="g-rules-scenario">
          <span>
            <CoinIcon size={14} /> {fixture.scenario.title} · {fixture.scenario.reward} 金
          </span>
          <span>
            <PeopleIcon size={14} /> {fixture.agents.length} 名居民
          </span>
          <span>种子 {seed}</span>
        </div>

        <label className="g-rule-field">
          <span className="g-rule-label">
            <b>税率</b>
            <em>{taxPct}%</em>
          </span>
          <input
            type="range"
            min={0}
            max={40}
            step={1}
            value={taxPct}
            onChange={(e) => setTaxPct(Number(e.target.value))}
          />
          <small>任务报酬里进入国库的比例；税后收入决定居民还能不能买技能。</small>
        </label>

        <label className="g-rule-field">
          <span className="g-rule-label">
            <b>公共研发份额</b>
            <em>{sharePct}%</em>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={sharePct}
            onChange={(e) => setSharePct(Number(e.target.value))}
          />
          <small>税收里划入公共研发池的比例；技能共享制度下会改变谁能受益。</small>
        </label>

        <div className="g-rule-field">
          <span className="g-rule-label">
            <b>技能归属</b>
            <em>{ownership === 'private' ? '私人所有' : '文明共享'}</em>
          </span>
          <div className="g-seg">
            <button
              type="button"
              className={ownership === 'private' ? 'is-on' : ''}
              onClick={() => setOwnership('private')}
            >
              私人所有
            </button>
            <button
              type="button"
              className={ownership === 'shared' ? 'is-on' : ''}
              onClick={() => setOwnership('shared')}
            >
              文明共享
            </button>
          </div>
          <small>私人所有：谁买的技能只提升谁；文明共享：买的技能进入公共池。</small>
        </div>

        <div className="g-rule-seed">
          <label htmlFor="g-seed">
            <b>随机种子</b>
          </label>
          <input
            id="g-seed"
            type="number"
            min={1}
            max={9999}
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
          />
          <button type="button" className="g-btn g-btn--ghost" onClick={() => setSeed(String(Math.floor(Math.random() * 9999) + 1))}>
            换一个
          </button>
        </div>

        <p className="g-rules-note">
          <SkillIcon size={14} /> 竞价、中标、税金、技能购买全部由 simulation 引擎重算；动画只负责播放结果，不参与结算。
        </p>

        {error && (
          <div className="g-rules-error" role="alert">
            {error}
          </div>
        )}

        <footer className="g-rules-foot">
          <span className="g-muted">同一批角色，不同制度 → 不同历史。</span>
          <div>
            <button type="button" className="g-btn g-btn--ghost" onClick={onClose} disabled={running}>
              取消
            </button>
            <button type="button" className="g-btn g-btn--primary" onClick={runRound} disabled={running}>
              {running ? '引擎计算中…' : '用这套制度重跑'}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
