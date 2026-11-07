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
