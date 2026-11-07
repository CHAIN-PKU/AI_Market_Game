export type StepId =
  | 'idle'
  | 'posted'
  | 'bidding'
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
  { id: 'idle', label: '等待订单', hint: '市场还没开张', duration: 0 },
  { id: 'posted', label: '新订单', hint: '市集公告：修复网站登录问题', duration: 1800 },
  { id: 'bidding', label: '竞标中', hint: '居民自己判断要不要接、报多少价', duration: 4200 },
  { id: 'assigned', label: '决标', hint: '系统按质量 × 报价选出中标者', duration: 2400 },
  { id: 'working', label: '执行中', hint: '中标者去程序坊干活', duration: 2600 },
  { id: 'settled', label: '结算', hint: '奖励到账，税进入国库', duration: 2600 },
  { id: 'skill', label: '投资 Skill', hint: '赚到钱后自主购买能力', duration: 2800 },
  { id: 'next', label: '下一轮', hint: '能力变化将影响下一次竞标', duration: 0 },
];

export const STEP_INDEX = Object.fromEntries(TIMELINE.map((s, i) => [s.id, i])) as Record<StepId, number>;

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
