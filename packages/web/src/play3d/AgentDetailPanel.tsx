import { agentMoodLine, agentThinkingPreface, skillWishLine } from '../lib/agentPersona';
import { agentSpecialty } from '../lib/civDisplay';
import type { AgentState, CivilizationState } from '../types';
import { BUILDINGS } from './sceneConfig';

const JOB_ZH: Record<string, string> = {
  编程: '写程序',
  科研: '做研究',
  设计: '做设计',
};

const BUILDING_COPY: Record<string, string> = {
  market: '居民在这里抢市集订单、谈报价。你发的模拟悬赏也会落在这里。',
  skill: '挣到金币的居民会来这里买技能——花钱是为了下一单更好赚。',
  coding: '写程序类的订单通常在这边开工。',
  research: '查资料、写报告类的活儿在这里周转。',
  design: '做界面、画图形一类任务偏爱在这边接活。',
  'public-rd': '文明钱包里划出来的公共研发金会堆在这里，全员可能受益。',
  homes: '新人先住这一带，清晨你会看到他们溜达去上工。',
};

export function AgentDetailPanel({
  civ,
  agent,
  buildingLabel,
  onClose,
}: {
  civ: CivilizationState;
  agent: AgentState | null;
  buildingLabel: string | null;
  onClose: () => void;
}) {
  if (!agent && !buildingLabel) {
    return (
      <aside className="play3d-detail play3d-detail-empty">
        <p className="play3d-detail-whisper">点一个小家伙，或者点一栋房子，听听他们这阵子在想什么。</p>
      </aside>
    );
  }

  if (buildingLabel && !agent) {
    const def = BUILDINGS.find((b) => b.label === buildingLabel);
    const blurb = def ? BUILDING_COPY[def.kind] : '这片地方还在建设叙事里。';
    return (
      <aside className="play3d-detail">
        <header className="play3d-detail-head">
          <h2>{buildingLabel}</h2>
          <button type="button" className="btn-ghost" onClick={onClose}>
            收起
          </button>
        </header>
        <p className="play3d-detail-voice">{blurb}</p>
        {def?.kind === 'public-rd' && (
          <p className="play3d-detail-meta">
            公共研发池里现在有 <strong>{civ.publicResearchPool}</strong> 金币。
          </p>
        )}
      </aside>
    );
  }

  if (!agent) return null;

  const spec = agentSpecialty(agent);
  const job = JOB_ZH[spec] ?? spec;

  return (
    <aside className="play3d-detail play3d-detail-agent">
      <header className="play3d-detail-head">
        <h2>{agent.displayName}</h2>
        <button type="button" className="btn-ghost" onClick={onClose}>
          收起
        </button>
      </header>
      <p className="play3d-detail-role">
        {job} · {formatCivName(civ.displayName)}
      </p>
      <blockquote className="play3d-detail-voice">「{agentMoodLine(agent)}」</blockquote>
      <section className="play3d-detail-section">
        <h3 className="play3d-detail-h3">近况</h3>
        <p className="text-sm leading-relaxed">{agentThinkingPreface(agent)}</p>
        <p className="text-sm leading-relaxed mt-2 text-[var(--color-muted)]">
          {skillWishLine(agent)}
        </p>
      </section>
      <section className="play3d-detail-section">
        <h3 className="play3d-detail-h3">钱包与履历</h3>
        <dl className="play3d-detail-grid">
          <div>
            <dt>兜里金币</dt>
            <dd>{agent.wallet}</dd>
          </div>
          <div>
            <dt>写程序</dt>
            <dd>{agent.abilities.coding}</dd>
          </div>
          <div>
            <dt>做研究</dt>
            <dd>{agent.abilities.research}</dd>
          </div>
          <div>
            <dt>做设计</dt>
            <dd>{agent.abilities.design}</dd>
          </div>
          <div>
            <dt>搞定过的单</dt>
            <dd>{agent.stats.tasksCompleted}</dd>
          </div>
          <div>
            <dt>已学技能</dt>
            <dd>{agent.skills.length} 项</dd>
          </div>
        </dl>
      </section>
      {agent.stats.tasksCompleted === 0 && agent.wallet === 0 && (
        <p className="play3d-detail-footnote">
          市集还没开张？在 Classic 界面或未来「下一回合」里推进天数后，这里会开始变热闹。
        </p>
      )}
    </aside>
  );
}

function formatCivName(name: string): string {
  return name
    .replace(/^Civilization A$/i, '文明 A')
    .replace(/^Civilization B$/i, '文明 B');
}
