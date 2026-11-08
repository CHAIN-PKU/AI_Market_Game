import { useState } from 'react';
import { apiUrl } from '../apiBase';
import { DOMAIN_LABEL, type BidDemoFixture, type ExperimentReport } from './types';
import { downloadExperimentCard, experimentShareText } from './shareCard';
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
    parts.push(`买「${skill.name}」${DOMAIN_LABEL[fixture.scenario.domain]} ${skill.abilityBefore} → ${skill.abilityAfter}`);
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

function describeDecision(agent: { decision: { action: string; bidAmount: number | null } }): string {
  return agent.decision.action === 'bid' && agent.decision.bidAmount != null
    ? `报价 ${agent.decision.bidAmount}`
    : '不接';
}

/** 同一个居民在两套规则下的决策差异（按名字对齐，人不变，只有决策会变） */
export function diffDecisions(before: BidDemoFixture, after: BidDemoFixture) {
  return before.agents.map((old) => {
    const now = after.agents.find((a) => a.displayName === old.displayName);
    const b = describeDecision(old);
    const a = now ? describeDecision(now) : '—';
    return { name: old.displayName, before: b, after: a, changed: b !== a };
  });
}

export function InstitutionPanel({ fixture, onClose, onApplied }: Props) {
  const rules = fixture.civilization.rules;
  const [taxPct, setTaxPct] = useState(Math.round(rules.taxRate * 100));
  const [sharePct, setSharePct] = useState(Math.round(rules.publicResearchShare * 100));
  const [ownership, setOwnership] = useState<'private' | 'shared'>(rules.skillOwnership === 'shared' ? 'shared' : 'private');
  const [seed, setSeed] = useState(String(fixture.seed));
  const [running, setRunning] = useState(false);
  const [experimentBusy, setExperimentBusy] = useState(false);
  const [experiment, setExperiment] = useState<ExperimentReport | null>(null);
  const [copiedExperiment, setCopiedExperiment] = useState(false);
  const [error, setError] = useState<string | null>(null);


  async function runExperiment() {
    setExperimentBusy(true);
    setError(null);
    try {
      const res = await fetch(apiUrl('/api/experiment'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seed: Number(seed) || fixture.seed,
          maxRounds: 5,
          rulesA: fixture.civilization.rules,
          rulesB: {
            name: rulesName(taxPct, ownership),
            taxRate: taxPct / 100,
            publicResearchShare: sharePct / 100,
            skillOwnership: ownership,
          },
        }),
      });
      if (!res.ok) throw new Error(`引擎返回 ${res.status}`);
      const data = (await res.json()) as ExperimentReport;
      setExperiment(data);
    } catch (err) {
      setError(err instanceof Error ? `5 轮实验失败：${err.message}` : '5 轮实验失败');
    } finally {
      setExperimentBusy(false);
    }
  }

  async function runRound() {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch(apiUrl('/api/demo/round'), {
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
            <h2 id="g-rules-title">改规则，看变化</h2>
            <p>同一批居民，换个规则再跑一轮。</p>
          </div>
          <button type="button" className="g-icon-btn" onClick={onClose} aria-label="关闭改规则">
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

        {/* 后果预览：跟着滑块实时变，让"改了多少"和"会怎样"挨在一起 */}
        <div className="g-rule-preview" aria-live="polite">
          <span className="g-rule-preview-title">按这套规则</span>
          <div>
            <span>一单 {fixture.scenario.reward} 金到手约</span>
            <b>{Math.round(fixture.scenario.reward * (1 - taxPct / 100))} 金</b>
          </div>
          <div>
            <span>每 100 金税进公共研发</span>
            <b>{Math.round(sharePct)} 金</b>
          </div>
          <div>
            <span>技能</span>
            <b>{ownership === 'shared' ? '8 人共用，谁买全体受益' : '各买各的，只影响自己'}</b>
          </div>
        </div>

        <label className="g-rule-field">
          <span className="g-rule-label">
            <b>税</b>
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
          <small>每单收入里交多少税。税太高，居民可能就买不起技能了。</small>
        </label>

        <label className="g-rule-field">
          <span className="g-rule-label">
            <b>税里拿多少做公共研发</b>
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
          <small>收来的税，拿多少放进公共研发。</small>
        </label>

        <div className="g-rule-field">
          <span className="g-rule-label">
            <b>技能归谁</b>
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
          <small>私人：谁买谁用。共享：买了大家都能用。</small>
        </div>

        <div className="g-rule-seed">
          <label htmlFor="g-seed">
            <b>换一批任务</b>
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
            换一批
          </button>
        </div>

        <p className="g-rules-note">
          <SkillIcon size={14} /> 报价、中标、税、买技能都由引擎重新算；动画只负责播，不改结果。
        </p>

        {error && (
          <div className="g-rules-error" role="alert">
            {error}
          </div>
        )}

        {experiment && (
          <div className="g-experiment">
            <div className="g-experiment-head">
              <strong>5 轮文明对抗</strong>
              <span>{experiment.a.rules.name} vs {experiment.b.rules.name} · 同场抢单 · 种子 {experiment.seed}</span>
              <button
                type="button"
                className="g-btn g-btn--ghost g-experiment-download"
                onClick={() => {
                  void navigator.clipboard?.writeText(experimentShareText(experiment)).then(() => {
                    setCopiedExperiment(true);
                    window.setTimeout(() => setCopiedExperiment(false), 1500);
                  });
                }}
              >
                {copiedExperiment ? '已复制' : '复制文案'}
              </button>
              <button type="button" className="g-btn g-btn--ghost g-experiment-download" onClick={() => downloadExperimentCard(experiment)}>
                存成图片
              </button>
            </div>
            <table>
              <thead>
                <tr><th>指标</th><th>{experiment.a.rules.name}</th><th>{experiment.b.rules.name}</th></tr>
              </thead>
              <tbody>
                {[
                  ['总到手', experiment.a.stats.totalNet, experiment.b.stats.totalNet, true],
                  ['总税', experiment.a.stats.totalTax, experiment.b.stats.totalTax, true],
                  ['平均中标价', experiment.a.stats.avgWinningBid, experiment.b.stats.avgWinningBid, true],
                  ['组队', experiment.a.stats.teamBids, experiment.b.stats.teamBids, false],
                  ['串标', experiment.a.stats.ringBids, experiment.b.stats.ringBids, false],
                  ['举报', experiment.a.stats.reports, experiment.b.stats.reports, false],
                  ['买技能', experiment.a.stats.skills, experiment.b.stats.skills, false],
                  ['唯一赢家', experiment.a.stats.uniqueWinners, experiment.b.stats.uniqueWinners, false],
                  ['基尼', experiment.a.stats.gini, experiment.b.stats.gini, false],
                ].map(([label, a, b, money]) => (
                  <tr key={String(label)}>
                    <td>{label}</td>
                    <td>{money ? `${a} 金` : a}</td>
                    <td>{money ? `${b} 金` : b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <footer className="g-rules-foot">
          <span className="g-muted">同一批角色，换个规则，结果就不一样。</span>
          <div>
            <button type="button" className="g-btn g-btn--ghost" onClick={onClose} disabled={running}>
              算了
            </button>
            <button type="button" className="g-btn g-btn--ghost" onClick={runExperiment} disabled={experimentBusy || running}>
              {experimentBusy ? '跑 5 轮…' : '跑 5 轮 A/B'}
            </button>
            <button type="button" className="g-btn g-btn--primary" onClick={runRound} disabled={running || experimentBusy}>
              {running ? '正在算…' : '用这套规则再跑一轮'}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
