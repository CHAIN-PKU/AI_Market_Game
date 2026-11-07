import { formatCivName } from '../lib/civDisplay';
import type { AgentTrace, GameState } from '../types';

const SOURCE_LABEL: Record<string, string> = {
  cursor: 'Cursor Agent · 实时',
  llm: 'LLM · 实时',
  practice: '练习模式 · 模拟心路',
  mock: '测试',
};

function findAgent(state: GameState, agentId: string) {
  for (const civ of state.civilizations) {
    const a = civ.agents.find((x) => x.id === agentId);
    if (a) return { agent: a, civ };
  }
  return undefined;
}

export function AgentMindStream({
  state,
  traces,
  round,
}: {
  state: GameState;
  traces: AgentTrace[];
  round: number;
}) {
  const withText = traces.filter((t) => t.reasoning?.trim());
  if (round < 1 || withText.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        本回合还没有决策心路。点「下一回合」后，居民抢单时的思考会出现在这里（Cursor 模式下为真实 Agent 输出）。
      </p>
    );
  }

  return (
    <ul className="mind-stream">
      {withText.map((t) => {
        const found = findAgent(state, t.agentId);
        const label = SOURCE_LABEL[t.source] ?? t.source;
        return (
          <li key={t.agentId} className="mind-bubble">
            <div className="mind-bubble-head">
              <span className="mind-bubble-name">{found?.agent.displayName ?? t.agentId}</span>
              {found && (
                <span className="mind-bubble-civ">{formatCivName(found.civ.displayName)}</span>
              )}
              <span className={`mind-bubble-src mind-src-${t.source}`}>{label}</span>
            </div>
            {found && (
              <p className="mind-bubble-stats tabular-nums">
                编 {found.agent.abilities.coding} · 研 {found.agent.abilities.research} · 设{' '}
                {found.agent.abilities.design}
              </p>
            )}
            <p className="mind-bubble-text">{t.reasoning}</p>
          </li>
        );
      })}
    </ul>
  );
}
