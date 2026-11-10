import { pickOne, randInt } from '../core/rng.js';
import type { GameState, MarketTask, TaskDomain } from '../core/types.js';

const DOMAIN_LABELS: Record<TaskDomain, string> = {
  coding: '写程序',
  research: '做研究',
  design: '做设计',
};

/**
 * 任务标题统一用中文：这是给中国观众看的 Demo，英文标题在片子里很跳。
 * 模板按领域分组，措辞保持「客户委托」的口吻。
 */
const TASK_TEMPLATES: Record<TaskDomain, string[]> = {
  coding: ['做一个落地页', '修一个接口模块', '把数据流程自动化'],
  research: ['调研新能源方案', '分析市场走势', '做一个材料原型'],
  design: ['做一套品牌视觉', '画一版手机界面', '重做一套图标'],
};

export function generateTasksForRound(state: GameState, rng: () => number): MarketTask[] {
  const created: MarketTask[] = [];
  for (let i = 0; i < state.config.tasksPerRound; i += 1) {
    const domain = pickOne(rng, ['coding', 'research', 'design'] as const);
    const difficulty = randInt(rng, 30, 55);
    const minAbility = Math.max(20, difficulty - 15);
    const reward = Math.round(60 + difficulty * 2.2 + randInt(rng, 0, 40));
    const title = `${pickOne(rng, TASK_TEMPLATES[domain])} (${DOMAIN_LABELS[domain]})`;

    const task: MarketTask = {
      id: `task-r${state.round + 1}-${state.marketTasks.length + i + 1}`,
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
