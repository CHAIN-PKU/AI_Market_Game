import type { AgentState } from '../types';
import { agentSpecialty } from './civDisplay';

const VOICE: Record<string, string[]> = {
  编程: [
    '坚信多写几行代码，世界就会乖一点。',
    '钱包可以瘦，但仓库不能乱。',
    '看见悬赏单先算性价比，再决定要不要卷。',
  ],
  科研: [
    '理想很大，先看兜里有多少金币支撑。',
    '愿意赌一把高难任务，但亏多了会收手。',
    '觉得公共研发池是文明的希望（如果有人往里投钱）。',
  ],
  设计: [
    '好作品得先好看，钱包好看是第二件事。',
    '爱拉人组队，一个人抠图太闷。',
    '配色挑刺专家，竞标时偏爱创意单。',
  ],
};

function pickStableLine(agent: AgentState, lines: string[]): string {
  let h = 0;
  for (let i = 0; i < agent.id.length; i += 1) h = (h * 31 + agent.id.charCodeAt(i)) | 0;
  return lines[Math.abs(h) % lines.length]!;
}

/** 玩家可读的性格独白，由 traits 推导，非 LLM 编造。 */
export function agentMoodLine(agent: AgentState): string {
  const spec = agentSpecialty(agent);
  const base = pickStableLine(agent, VOICE[spec] ?? VOICE['编程']!);
  const risk = agent.traits?.riskTolerance ?? 0.5;
  const invest = agent.traits?.investAggression ?? 0.5;
  if (risk > 0.65) return `${base} 这几天心气儿高，敢接更硬的活儿。`;
  if (risk < 0.4) return `${base} 最近偏稳，不太想接亏本买卖。`;
  if (invest > 0.55) return `${base} 手里一有闲钱就想买技能提升自己。`;
  if (invest < 0.35) return `${base} 更想先把金币攒着，等情况明朗。`;
  return base;
}

export function agentThinkingPreface(agent: AgentState): string {
  const spec = agentSpecialty(agent);
  const labels = {
    编程: '写程序',
    科研: '做研究',
    设计: '做设计',
  } as const;
  const main = labels[spec as keyof typeof labels] ?? '干活';
  const { coding, research, design } = agent.abilities;
  return `我主修「${main}」（写程序 ${coding} · 做研究 ${research} · 做设计 ${design}）。抢单时会先算自己能不能赚、敢不敢赌。`;
}

export function skillWishLine(agent: AgentState): string {
  if (agent.skills.length > 0) {
    return `已经学过的本事会优先用到下一单里，不会白花钱。`;
  }
  if (agent.wallet < 40) {
    return `现在兜里还紧，得先靠接活儿攒钱，再考虑投资。`;
  }
  if ((agent.traits?.investAggression ?? 0.5) > 0.5) {
    return `有单赚完之后，大概率会去买跟主业相关的技能。`;
  }
  return `不急着乱买课——会等市集上真正划算的机会。`;
}
