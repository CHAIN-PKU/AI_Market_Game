import { pushEvent } from '../core/events.js';
import type { AgentState, CivilizationState, GameState, MarketTask } from '../core/types.js';

export interface PayoutResult {
  gross: number;
  tax: number;
  net: number;
}

export function computePayout(
  civ: CivilizationState,
  grossReward: number,
): PayoutResult {
  const tax = Math.round(grossReward * civ.rules.taxRate);
  const net = grossReward - tax;
  return { gross: grossReward, tax, net };
}

export function applyTaskPayout(
  state: GameState,
  civ: CivilizationState,
  agent: AgentState,
  task: MarketTask,
  grossReward: number,
): void {
  const { tax, net } = computePayout(civ, grossReward);
  agent.wallet += net;
  agent.stats.grossEarnings += grossReward;
  agent.stats.taxPaid += tax;
  agent.stats.tasksCompleted += 1;

  civ.treasury += tax;
  const toPublic = Math.round(tax * civ.rules.publicResearchShare);
  civ.publicResearchPool += toPublic;
  civ.treasury -= toPublic;

  state.metricsByCiv[civ.id]!.totalGrossOutput += grossReward;
  state.metricsByCiv[civ.id]!.tasksSucceeded += 1;

  pushEvent(state, 'tax_collected', `${agent.displayName} paid ${tax} tax on ${task.title}`, {
    agentId: agent.id,
    civilizationId: civ.id,
    taskId: task.id,
    tax,
    net,
  });
}

export function markTaskFailed(
  state: GameState,
  civ: CivilizationState,
  agent: AgentState,
  task: MarketTask,
): void {
  agent.stats.tasksFailed += 1;
  state.metricsByCiv[civ.id]!.tasksFailed += 1;
  pushEvent(state, 'task_failed', `${agent.displayName} failed: ${task.title}`, {
    agentId: agent.id,
    taskId: task.id,
  });
}

/** Agents and treasuries must not go negative in MVP rules. */
export function assertNonNegativeWallets(state: GameState): void {
  for (const civ of state.civilizations) {
    if (civ.treasury < 0 || civ.publicResearchPool < 0) {
      throw new Error(`Negative treasury on ${civ.id}`);
    }
    for (const agent of civ.agents) {
      if (agent.wallet < 0) {
        throw new Error(`Negative wallet for agent ${agent.id}`);
      }
    }
  }
}

/**
 * Team payout: tax is computed once on the gross; net is split 70/30 between
 * lead and partner(s). Both get a completed-task mark for reputation.
 */
export function applyTeamPayout(
  state: GameState,
  civ: CivilizationState,
  team: AgentState[],
  task: MarketTask,
  grossReward: number,
): void {
  const { tax, net } = computePayout(civ, grossReward);
  const shares = team.length === 1 ? [1] : [0.7, 0.3];
  const lead = team[0]!;

  team.forEach((agent, i) => {
    const share = shares[i] ?? 0;
    agent.wallet += Math.round(net * share);
    agent.stats.grossEarnings += Math.round(grossReward * share);
    agent.stats.taxPaid += Math.round(tax * share);
    agent.stats.tasksCompleted += 1;
    pushEvent(state, 'tax_collected', `${agent.displayName} paid ${Math.round(tax * share)} tax on ${task.title}`, {
      agentId: agent.id,
      civilizationId: civ.id,
      taskId: task.id,
      tax: Math.round(tax * share),
      net: Math.round(net * share),
      teamLead: lead.id,
    });
  });

  civ.treasury += tax;
  const toPublic = Math.round(tax * civ.rules.publicResearchShare);
  civ.publicResearchPool += toPublic;
  civ.treasury -= toPublic;

  state.metricsByCiv[civ.id]!.totalGrossOutput += grossReward;
  state.metricsByCiv[civ.id]!.tasksSucceeded += 1;

  pushEvent(state, 'team_settled', `${team.map((a) => a.displayName).join(' + ')} split ${task.title}`, {
    agentId: lead.id,
    taskId: task.id,
    teamAgentIds: team.map((a) => a.id),
    gross: grossReward,
    tax,
    net,
  });
}

export function markTeamFailed(
  state: GameState,
  civ: CivilizationState,
  team: AgentState[],
  task: MarketTask,
): void {
  for (const agent of team) {
    agent.stats.tasksFailed += 1;
    pushEvent(state, 'task_failed', `${agent.displayName} failed: ${task.title}`, {
      agentId: agent.id,
      taskId: task.id,
      teamAgentIds: team.map((a) => a.id),
    });
  }
  state.metricsByCiv[civ.id]!.tasksFailed += 1;
}
