import { applyTaskPayout, applyTeamPayout, markTaskFailed, markTeamFailed } from '../economy/settlement.js';
import { resolveTaskOutcome } from '../evaluation/task-outcome.js';
import { effectiveAbility } from '../core/skills.js';
import { pushEvent } from '../core/events.js';
import type { AgentDecision } from '../agents/types.js';
import type { GameState, MarketTask } from '../core/types.js';

export function buildDecisionContext(
  state: GameState,
  civilizationId: string,
  openTaskIds: string[],
  rng: () => number,
) {
  const civ = state.civilizations.find((c) => c.id === civilizationId);
  return {
    round: state.round,
    civilizationId,
    openTaskIds,
    getTask: (id: string) => state.marketTasks.find((t) => t.id === id),
    getAgent: (id: string) => civ?.agents.find((a) => a.id === id),
    getCivilization: (id: string) => state.civilizations.find((c) => c.id === id),
    rng,
  };
}

export function mapDecisionsByAgent(
  agentIds: string[],
  decisions: AgentDecision[],
): Map<string, AgentDecision> {
  const map = new Map<string, AgentDecision>();
  for (let i = 0; i < agentIds.length; i += 1) {
    const id = agentIds[i]!;
    map.set(id, decisions[i] ?? { bids: [] });
  }
  return map;
}

export function executeAssignedTask(state: GameState, task: MarketTask, rng: () => number): void {
  const civ = state.civilizations.find((c) => c.id === task.assignedCivilizationId);
  const agent = civ?.agents.find((a) => a.id === task.assignedAgentId);
  if (!civ || !agent) return;

  const teamIds = task.assignedTeamIds?.length ? task.assignedTeamIds : [agent.id];
  const team = teamIds
    .map((id) => civ.agents.find((a) => a.id === id))
    .filter((a): a is NonNullable<typeof a> => !!a);
  const owned = agent.skills.map((s) => s.skillId);
  const abilities = { ...effectiveAbility(agent.abilities, owned, civ.sharedSkillIds) };
  if (team.length > 1) {
    const second = team[1]!;
    const secondOwned = second.skills.map((s) => s.skillId);
    const secondAbilities = effectiveAbility(second.abilities, secondOwned, civ.sharedSkillIds);
    const domain = task.requirements.domain;
    abilities[domain] =
      Math.max(abilities[domain], secondAbilities[domain]) +
      Math.min(abilities[domain], secondAbilities[domain]) * 0.25;
  }
  const outcome = resolveTaskOutcome({
    abilities,
    domain: task.requirements.domain,
    difficulty: task.requirements.difficulty,
    minAbility: task.requirements.minAbility,
    rng,
  });

  if (outcome.success) {
    task.status = 'completed';
    if (team.length > 1) {
      applyTeamPayout(state, civ, team, task, task.reward);
    } else {
      applyTaskPayout(state, civ, agent, task, task.reward);
    }
    pushEvent(state, 'task_completed', `${agent.displayName} completed ${task.title}`, {
      taskId: task.id,
      quality: outcome.quality,
      teamAgentIds: team.map((a) => a.id),
    });
  } else {
    task.status = 'failed';
    if (team.length > 1) {
      markTeamFailed(state, civ, team, task);
    } else {
      markTaskFailed(state, civ, agent, task);
    }
  }
}
