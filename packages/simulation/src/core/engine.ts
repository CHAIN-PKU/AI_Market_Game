import { MockAgentDecisionProvider } from '../agents/mock-decision-provider.js';
import type { AgentDecisionProvider } from '../agents/types.js';
import { investPublicResearchPool, purchaseSkill } from '../economy/skills.js';
import { assertNonNegativeWallets } from '../economy/settlement.js';
import { nextAffordableSkill, selectWinningBids } from '../market/bidding.js';
import { createRng } from '../core/rng.js';
import { pushEvent } from '../core/events.js';
import { refreshCivilizationMetrics } from '../core/metrics.js';
import { generateTasksForRound } from '../market/task-generator.js';
import { narrateRound } from '../narrative/narrate-round.js';
import type { GameState } from '../core/types.js';
import {
  buildDecisionContext,
  executeAssignedTask,
  mapDecisionsByAgent,
} from './engine-internals.js';

export interface RunSimulationOptions {
  decisionProvider?: AgentDecisionProvider;
  onRoundComplete?: (state: GameState) => void;
}

export function runSingleRound(
  state: GameState,
  decisionProvider: AgentDecisionProvider = new MockAgentDecisionProvider(),
): GameState {
  if (state.round >= state.config.totalRounds) {
    return state;
  }

  const rng = createRng(state.rngState);
  state.round += 1;
  pushEvent(state, 'round_started', `Round ${state.round} started`);

  const newTasks = generateTasksForRound(state, rng);
  for (const task of newTasks) {
    state.marketTasks.push(task);
    pushEvent(state, 'task_posted', task.title, { taskId: task.id, reward: task.reward });
  }

  const openTasks = state.marketTasks.filter(
    (t) => t.status === 'open' && t.deadlineRound >= state.round,
  );
  const openTaskIds = openTasks.map((t) => t.id);

  const allBids = [];

  for (const civ of state.civilizations) {
    const decisions = decisionProvider.decideForCivilization(
      buildDecisionContext(state, civ.id, openTaskIds, rng),
    );
    const byAgent = mapDecisionsByAgent(civ.agents.map((a) => a.id), decisions);
    for (const agent of civ.agents) {
      const decision = byAgent.get(agent.id);
      if (!decision) continue;
      for (const bid of decision.bids) {
        allBids.push(bid);
        pushEvent(state, 'bid_placed', `${agent.displayName} bid on ${bid.taskId}`, {
          taskId: bid.taskId,
          agentId: agent.id,
          bidAmount: bid.bidAmount,
          decisionSource: 'mock',
          expectedQuality: bid.expectedQuality,
          successProbability: bid.successProbability,
          riskComfortFloor: bid.riskComfortFloor,
          expectedReward: bid.expectedReward,
          expectedValue: bid.expectedValue,
          estimatedCost: bid.estimatedCost,
          expectedProfit: bid.expectedProfit,
          reputation: bid.reputation,
          competitors: bid.competitors,
          personalGoalId: bid.personalGoalId,
          personalGoalLabel: bid.personalGoalLabel,
          observedCompetitors: bid.observedCompetitors,
          reasonFactors: bid.reasonFactors,
        });
      }
      for (const decline of decision.declines ?? []) {
        pushEvent(state, 'bid_declined', `${agent.displayName} passed on ${decline.taskId}`, {
          taskId: decline.taskId,
          agentId: agent.id,
          reasonCode: decline.reasonCode,
          successProbability: decline.successProbability,
          expectedQuality: decline.expectedQuality,
          riskComfortFloor: decline.riskComfortFloor,
          expectedReward: decline.expectedReward,
          expectedValue: decline.expectedValue,
          estimatedCost: decline.estimatedCost,
          expectedProfit: decline.expectedProfit,
          reputation: decline.reputation,
          competitors: decline.competitors,
          personalGoalId: decline.personalGoalId,
          personalGoalLabel: decline.personalGoalLabel,
          observedCompetitors: decline.observedCompetitors,
          reasonFactors: decline.reasonFactors,
        });
      }
    }
  }

  const winners = selectWinningBids(openTasks, allBids);
  for (const [taskId, bid] of winners) {
    const task = state.marketTasks.find((t) => t.id === taskId);
    if (!task) continue;
    task.status = 'assigned';
    task.assignedAgentId = bid.agentId;
    task.assignedCivilizationId = bid.civilizationId;
    task.winningBid = bid.bidAmount;
    pushEvent(state, 'task_assigned', `${bid.agentId} assigned ${task.title}`, {
      taskId,
      agentId: bid.agentId,
    });
  }

  const assigned = state.marketTasks.filter((t) => t.status === 'assigned');
  for (const task of assigned) {
    executeAssignedTask(state, task, rng);
  }

  for (const civ of state.civilizations) {
    investPublicResearchPool(state, civ);
    refreshCivilizationMetrics(civ, state.metricsByCiv[civ.id]!);
  }

  for (const civ of state.civilizations) {
    for (const agent of civ.agents) {
      const affordable = nextAffordableSkill(agent, civ);
      if (!affordable) continue;
      const investThreshold = 120 - agent.traits.investAggression * 80;
      const willing =
        agent.wallet >= investThreshold || rng() < agent.traits.investAggression;
      if (willing && agent.wallet >= affordable.price) {
        purchaseSkill(state, civ, agent, affordable.skillId);
      }
    }
  }

  if (state.round % state.config.competitionInterval === 0) {
    pushEvent(state, 'competition_checkpoint', 'Civilization comparison checkpoint', {
      metrics: state.metricsByCiv,
    });
  }

  narrateRound(state, state.round);

  state.rngState = Math.floor(rng() * 1_000_000_000);
  assertNonNegativeWallets(state);
  return state;
}

export function runSimulation(
  initial: GameState,
  options: RunSimulationOptions = {},
): GameState {
  const provider = options.decisionProvider ?? new MockAgentDecisionProvider();
  let state = structuredClone(initial);
  while (state.round < state.config.totalRounds) {
    state = runSingleRound(state, provider);
    options.onRoundComplete?.(state);
  }
  pushEvent(state, 'simulation_finished', 'Simulation finished');
  return state;
}

export {
  buildDecisionContext,
  executeAssignedTask,
  mapDecisionsByAgent,
} from './engine-internals.js';
