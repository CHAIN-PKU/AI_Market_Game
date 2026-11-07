export type StepId =
  | 'idle'
  | 'posted'
  | 'focus_astra'
  | 'focus_delta'
  | 'focus_grove'
  | 'bids'
  | 'assigned'
  | 'working'
  | 'settled'
  | 'skill'
  | 'next';

export type TimelineStep = {
  id: StepId;
  label: string;
  hint: string;
  /** ms at 1x */
  duration: number;
};

/** One deterministic playback timeline. Durations are presentation-only; economy values are fixed. */
export const TIMELINE: TimelineStep[] = [
  { id: 'idle', label: '等待任务', hint: '市场还没开张', duration: 0 },
  { id: 'posted', label: '任务公告', hint: '市集挂出：修复网站登录问题', duration: 1800 },
  { id: 'focus_astra', label: '居民 1/3 · Astra', hint: '谨慎型先算风险，再决定接不接', duration: 3200 },
  { id: 'focus_delta', label: '居民 2/3 · Delta', hint: '积极型在算：差多少能买新 Skill', duration: 3200 },
  { id: 'focus_grove', label: '居民 3/3 · Grove', hint: '稳健型看长期能力，而不是最低价', duration: 3200 },
  { id: 'bids', label: '公开报价', hint: '报价与放弃理由全部公开', duration: 3200 },
  { id: 'assigned', label: '决标', hint: '系统按「质量预测 × 报价」选出中标者', duration: 2800 },
  { id: 'working', label: '执行中', hint: '中标者走向程序坊，开始干活', duration: 2400 },
  { id: 'settled', label: '结算', hint: '奖励到账，税金进入国库', duration: 2600 },
  { id: 'skill', label: '投资 Skill', hint: '赚到钱后，它决定把钱花在能力上', duration: 2800 },
  { id: 'next', label: '下一轮', hint: '能力变化会带进下一轮竞争', duration: 0 },
];

export const STEP_INDEX = Object.fromEntries(TIMELINE.map((s, i) => [s.id, i])) as Record<StepId, number>;

export const FOCUS_STEPS: { step: StepId; agentIndex: number; number: number }[] = [
  { step: 'focus_astra', agentIndex: 0, number: 1 },
  { step: 'focus_delta', agentIndex: 3, number: 2 },
  { step: 'focus_grove', agentIndex: 6, number: 3 },
];

export function focusAgentIndexForStep(step: StepId): number | null {
  return FOCUS_STEPS.find((f) => f.step === step)?.agentIndex ?? null;
}

export function focusNumberForStep(step: StepId): number | null {
  return FOCUS_STEPS.find((f) => f.step === step)?.number ?? null;
}

export function atLeast(step: StepId, target: StepId): boolean {
  return STEP_INDEX[step] >= STEP_INDEX[target];
}

export function nextStep(step: StepId): StepId | null {
  const i = STEP_INDEX[step];
  return i < TIMELINE.length - 1 ? TIMELINE[i + 1]!.id : null;
}

export function prevStep(step: StepId): StepId | null {
  const i = STEP_INDEX[step];
  return i > 0 ? TIMELINE[i - 1]!.id : null;
}
