import { pushEvent } from '../core/events.js';
import type { GameState, MarketTask, TaskDomain } from '../core/types.js';

export function postPlayerTask(
  state: GameState,
  input: { title: string; domain: TaskDomain; reward: number },
): MarketTask {
  const difficulty = 40;
  const task: MarketTask = {
    id: `player-task-${state.marketTasks.length + 1}-r${state.round}`,
    roundCreated: state.round,
    title: input.title,
    playerTitle: input.title,
    source: 'player',
    requirements: {
      domain: input.domain,
      minAbility: 25,
      difficulty,
    },
    reward: Math.max(50, Math.min(500, Math.round(input.reward))),
    deadlineRound: state.round + 4,
    status: 'open',
  };
  state.marketTasks.push(task);
  pushEvent(state, 'task_posted', input.title, {
    taskId: task.id,
    reward: task.reward,
    player: true,
  });
  return task;
}
