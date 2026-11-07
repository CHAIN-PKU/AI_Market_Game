import type { AsyncAgentDecisionProvider } from '../agents/async-types.js';
import type { AgentDecisionTrace } from '../agents/async-types.js';
import type { AgentDecision } from '../agents/types.js';
import { investPublicResearchPool, purchaseSkill } from '../economy/skills.js';
import { assertNonNegativeWallets } from '../economy/settlement.js';
import { nextAffordableSkill, selectWinningBids } from '../market/bidding.js';
import { createRng } from '../core/rng.js';
import { pushEvent } from '../core/events.js';
import { refreshCivilizationMetrics } from '../core/metrics.js';
import { generateTasksForRound } from '../market/task-generator.js';
import { narrateRound } from '../narrative/narrate-round.js';
import type { GameState } from '../core/types.js';
import { buildDecisionContext, executeAssignedTask, mapDecisionsByAgent } from './engine-internals.js';

export interface RoundStepResult {
  state: GameState;
  traces: AgentDecisionTrace[];
  llmApiCalls: number;
}

export async function runSingleRoundAsync(
  state: GameState,
  decisionProvider: AsyncAgentDecisionProvider,
): Promise<RoundStepResult> {
  if (state.round >= state.config.totalRounds) {
    return { state, traces: [], llmApiCalls: 0 };
  }

  const rng = createRng(state.rngState);
  state.round += 1;
  pushEvent(state, 'round_started', `Round ${state.round} started`, {
    agentBrain: decisionProvider.label,
  });

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
  const allTraces: AgentDecisionTrace[] = [];
  let llmApiCalls = 0;

  const hasTrace =
    'decideWithTrace' in decisionProvider &&
    typeof decisionProvider.decideWithTrace === 'function';

  type CivDecisionBundle = {
    civId: string;
    decisions: AgentDecision[];
    traces: AgentDecisionTrace[];
    apiCalls: number;
  };

  const decideForCiv = async (civId: string): Promise<CivDecisionBundle> => {
    const civ = state.civilizations.find((c) => c.id === civId);
    if (!civ) {
      return { civId, decisions: [], traces: [], apiCalls: 0 };
    }
    const ctx = buildDecisionContext(state, civId, openTaskIds, rng);
    if (hasTrace) {
      const wrapped = await (
        decisionProvider as {
          decideWithTrace: (c: typeof ctx) => Promise<{
            decisions: AgentDecision[];
            traces: AgentDecisionTrace[];
            apiCalls: number;
          }>;
        }
      ).decideWithTrace(ctx);
      return {
        civId,
        decisions: wrapped.decisions,
        traces: wrapped.traces,
        apiCalls: wrapped.apiCalls,
      };
    }
    const decisions = await decisionProvider.decideForCivilization(ctx);
    return { civId, decisions, traces: [], apiCalls: 0 };
  };

  /** Cursor 本地 Agent 同时起两个进程时冷启动极慢且常长时间无流式输出；按文明串行更稳。 */
  const bundles: CivDecisionBundle[] =
    decisionProvider.label === 'cursor'
      ? await (async () => {
          const out: CivDecisionBundle[] = [];
          for (const c of state.civilizations) {
            out.push(await decideForCiv(c.id));
          }
          return out;
        })()
      : await Promise.all(state.civilizations.map((c) => decideForCiv(c.id)));

  for (const bundle of bundles) {
    const civ = state.civilizations.find((c) => c.id === bundle.civId);
    if (!civ) continue;
    allTraces.push(...bundle.traces);
    llmApiCalls += bundle.apiCalls;
    const byAgent = mapDecisionsByAgent(civ.agents.map((a) => a.id), bundle.decisions);
    for (const agent of civ.agents) {
      const decision = byAgent.get(agent.id);
      if (!decision) continue;
      const trace = bundle.traces.find((t) => t.agentId === agent.id);
      for (const bid of decision.bids) {
        allBids.push(bid);
        pushEvent(state, 'bid_placed', `${agent.displayName} bid on ${bid.taskId}`, {
          taskId: bid.taskId,
          agentId: agent.id,
          bidAmount: bid.bidAmount,
          decisionSource: trace?.source ?? decisionProvider.label,
          llmReasoning: trace?.reasoning,
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
  return { state, traces: allTraces, llmApiCalls };
}
