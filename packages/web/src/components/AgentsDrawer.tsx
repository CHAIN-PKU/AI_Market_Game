import { agentSpecialty } from '../lib/civDisplay';
import type { AgentTrace, CivilizationState } from '../types';

const AVATARS = ['🧑‍🎨', '🧑‍💻', '🧑‍🔬', '🧑‍🚀', '🦊', '🐻', '🦉', '🐯'];

function avatarFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) | 0;
  return AVATARS[Math.abs(h) % AVATARS.length]!;
}

export function AgentsDrawer({
  civ,
  onPickAgent,
}: {
  civ: CivilizationState;
  traces: AgentTrace[];
  onPickAgent: (agentId: string) => void;
}) {
  return (
    <ul className="space-y-1">
      {civ.agents.map((agent) => (
        <li key={agent.id}>
          <button type="button" className="agent-row" onClick={() => onPickAgent(agent.id)}>
            <span className="agent-row-main">
              <span className="agent-row-name">
                <span className="agent-avatar" aria-hidden>
                  {avatarFor(agent.displayName)}
                </span>
                {agent.displayName}
              </span>
              <span className="agent-row-tag">{agentSpecialty(agent)}专精</span>
              <span className="agent-ability-bar" aria-hidden>
                <span
                  className="agent-ability-fill agent-ab-coding"
                  style={{ width: `${Math.min(100, agent.abilities.coding)}%` }}
                />
                <span
                  className="agent-ability-fill agent-ab-research"
                  style={{ width: `${Math.min(100, agent.abilities.research)}%` }}
                />
                <span
                  className="agent-ability-fill agent-ab-design"
                  style={{ width: `${Math.min(100, agent.abilities.design)}%` }}
                />
              </span>
            </span>
            <span className="tabular-nums text-[var(--color-muted)]">{agent.wallet}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function AgentDetail({
  civ,
  agentId,
  traces,
}: {
  civ: CivilizationState;
  agentId: string;
  traces: AgentTrace[];
}) {
  const agent = civ.agents.find((a) => a.id === agentId);
  const trace = traces.find((t) => t.agentId === agentId);
  if (!agent) return null;
  const skillN =
    civ.rules.skillOwnership === 'shared' ? civ.sharedSkillIds.length : agent.skills.length;

  return (
    <div className="space-y-3 text-sm">
      <p className="text-2xl font-semibold tabular-nums">{agent.wallet} <span className="text-base font-normal text-[var(--color-muted)]">金</span></p>
      <div className="grid grid-cols-2 gap-2 text-[var(--color-muted)]">
        <div className="stat-pill">成单 {agent.stats.tasksCompleted}</div>
        <div className="stat-pill">失败 {agent.stats.tasksFailed}</div>
        <div className="stat-pill">技能 {skillN}</div>
        <div className="stat-pill">
          能力 {agent.abilities.coding}/{agent.abilities.research}/{agent.abilities.design}
        </div>
      </div>
      {trace?.reasoning && (
        <blockquote className="border-l-2 border-[var(--color-a)] pl-3 text-[var(--color-text)]">
          {trace.reasoning}
        </blockquote>
      )}
    </div>
  );
}
