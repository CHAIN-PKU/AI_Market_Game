import { pickOne, randInt } from '../core/rng.js';
import type { GameState, MarketTask, TaskDomain } from '../core/types.js';

const DOMAIN_LABELS: Record<TaskDomain, string> = {
  coding: 'Coding',
  research: 'Research',
  design: 'Design',
};

const TASK_TEMPLATES: Record<TaskDomain, string[]> = {
  coding: ['Build landing page', 'Fix API module', 'Automate data pipeline'],
  research: ['Survey energy tech', 'Analyze market trend', 'Prototype material'],
  design: ['Brand identity kit', 'Mobile UI flow', 'Icon set refresh'],
};

let taskCounter = 0;

export function resetTaskCounter(): void {
  taskCounter = 0;
}

export function generateTasksForRound(state: GameState, rng: () => number): MarketTask[] {
  const created: MarketTask[] = [];
  for (let i = 0; i < state.config.tasksPerRound; i += 1) {
    taskCounter += 1;
    const domain = pickOne(rng, ['coding', 'research', 'design'] as const);
    const difficulty = randInt(rng, 30, 55);
    const minAbility = Math.max(20, difficulty - 15);
    const reward = Math.round(60 + difficulty * 2.2 + randInt(rng, 0, 40));
    const title = `${pickOne(rng, TASK_TEMPLATES[domain])} (${DOMAIN_LABELS[domain]})`;

    const task: MarketTask = {
      id: `task-r${state.round + 1}-${taskCounter}`,
      roundCreated: state.round + 1,
      title,
      requirements: { domain, minAbility, difficulty },
      reward,
      deadlineRound: state.round + 3,
      status: 'open',
    };
    created.push(task);
  }
  return created;
}

/** Bias task mix by phase (for future market shift experiments). */
export function domainWeightsForRound(round: number): Record<TaskDomain, number> {
  if (round <= 10) {
    return { coding: 0.55, research: 0.25, design: 0.2 };
  }
  if (round <= 20) {
    return { coding: 0.25, research: 0.5, design: 0.25 };
  }
  return { coding: 0.33, research: 0.34, design: 0.33 };
}
