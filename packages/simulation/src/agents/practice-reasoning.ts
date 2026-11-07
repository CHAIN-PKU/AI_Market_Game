import type { AgentState, CivilizationState, MarketTask, TaskDomain } from '../core/types.js';

const DOMAIN_ZH: Record<TaskDomain, string> = {
  coding: '编程',
  research: '科研',
  design: '设计',
};

function primaryDomain(agent: AgentState): TaskDomain {
  const { coding, research, design } = agent.abilities;
  if (coding >= research && coding >= design) return 'coding';
  if (research >= coding && research >= design) return 'research';
  return 'design';
}

function taskShortTitle(task: MarketTask): string {
  const base = task.title.replace(/\s*\([^)]+\)\s*$/, '').trim();
  const map: Record<string, string> = {
    'Build landing page': '官网落地页',
    'Fix API module': '接口修复',
    'Automate data pipeline': '数据流水线',
    'Survey energy tech': '新能源调研',
    'Analyze market trend': '市场趋势分析',
    'Prototype material': '材料原型',
    'Brand identity kit': '品牌套件',
    'Mobile UI flow': '手机界面流程',
    'Icon set refresh': '图标焕新',
  };
  return map[base] ?? base;
}

/** 练习模式：俏皮心路（非 LLM，但按专精/任务匹配）。 */
export function buildPracticeReasoning(
  agent: AgentState,
  _civ: CivilizationState,
  task: MarketTask,
  ctx: { partnerName?: string; bidAmount: number },
): string {
  const domain = task.requirements.domain;
  const zh = DOMAIN_ZH[domain];
  const title = taskShortTitle(task);
  const mine = agent.abilities[domain];
  const primary = primaryDomain(agent);
  const fit = mine - task.requirements.difficulty;

  if (primary === domain && fit >= -5) {
    return `【${agent.displayName}】嘿，${zh}是我的主场（${mine} 点），「${title}」${ctx.bidAmount} 金我敢报！${ctx.partnerName ? `正和 ${ctx.partnerName} 嘀咕三七分账～` : ''}`;
  }
  if (fit < -10) {
    return `【${agent.displayName}】「${title}」偏 ${zh}，我才 ${mine} 点…先报 ${ctx.bidAmount} 碰运气，不行就撤。`;
  }
  if (ctx.partnerName) {
    return `【${agent.displayName}】这单想拉 ${ctx.partnerName} 组队，谈好了我六他四，一起抬 ${ctx.bidAmount} 的价。`;
  }
  return `【${agent.displayName}】「${title}」看着还行，${zh} ${mine} 分，报 ${ctx.bidAmount} 金试试水～`;
}
