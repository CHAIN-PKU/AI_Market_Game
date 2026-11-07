import { agentSpecialty } from '../lib/civDisplay';
import type { AgentState, CivilizationState } from '../types';
import { BUILDINGS } from './sceneConfig';

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
        <p>点击地图上的居民或建筑查看详情（数据来自当前对局 GameState）。</p>
      </aside>
    );
  }

  if (buildingLabel && !agent) {
    const def = BUILDINGS.find((b) => b.label === buildingLabel);
    return (
      <aside className="play3d-detail">
        <header className="play3d-detail-head">
          <h2>{buildingLabel}</h2>
          <button type="button" className="btn-ghost" onClick={onClose}>
            关闭
          </button>
        </header>
        <p className="text-sm text-[var(--color-muted)]">
          {def?.kind === 'market' && '发布与抢单的中心。Walking Skeleton 仅占位造型。'}
          {def?.kind === 'skill' && '居民购买 Skill 的商店（占位）。'}
          {def?.kind === 'coding' && '编程类任务执行场所（占位）。'}
          {def?.kind === 'research' && '科研类任务场所（占位）。'}
          {def?.kind === 'design' && '设计类任务场所（占位）。'}
          {def?.kind === 'public-rd' && `公共研发 · 当前池：${civ.publicResearchPool} 金币（引擎数据）`}
          {def?.kind === 'homes' && '8 名居民出生点一排（占位）。'}
        </p>
      </aside>
    );
  }

  if (!agent) return null;

  const spec = agentSpecialty(agent);
  return (
    <aside className="play3d-detail">
      <header className="play3d-detail-head">
        <h2>{agent.displayName}</h2>
        <button type="button" className="btn-ghost" onClick={onClose}>
          关闭
        </button>
      </header>
      <p className="play3d-detail-kicker">
        {civ.displayName} · 擅长 {spec}
      </p>
      <dl className="play3d-detail-grid">
        <div>
          <dt>钱包</dt>
          <dd>{agent.wallet} 金币</dd>
        </div>
        <div>
          <dt>编 / 研 / 设</dt>
          <dd>
            {agent.abilities.coding} / {agent.abilities.research} / {agent.abilities.design}
          </dd>
        </div>
        <div>
          <dt>已完成任务</dt>
          <dd>{agent.stats.tasksCompleted}</dd>
        </div>
        <div>
          <dt>Skill 数</dt>
          <dd>{agent.skills.length}</dd>
        </div>
      </dl>
      <p className="text-xs text-[var(--color-muted)]">ID：{agent.id}（与 API 返回一致）</p>
    </aside>
  );
}
