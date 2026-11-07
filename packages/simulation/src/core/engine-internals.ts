import { applyTaskPayout, markTaskFailed } from '../economy/settlement.js';
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

  const owned = agent.skills.map((s) => s.skillId);
  const abilities = effectiveAbility(agent.abilities, owned, civ.sharedSkillIds);
  const outcome = resolveTaskOutcome({
    abilities,
    domain: task.requirements.domain,
    difficulty: task.requirements.difficulty,
    minAbility: task.requirements.minAbility,
    rng,
  });

  if (outcome.success) {
    task.status = 'completed';
    applyTaskPayout(state, civ, agent, task, task.reward);
    pushEvent(state, 'task_completed', `${agent.displayName} completed ${task.title}`, {
      taskId: task.id,
      quality: outcome.quality,
    });
  } else {
    task.status = 'failed';
    markTaskFailed(state, civ, agent, task);
  }
}
