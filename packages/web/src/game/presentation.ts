import { DOMAIN_LABEL, type BidDemoFixture, type DemoAgent } from './types';

/**
 * Presentation Layer.
 * Turns structured decision records into short public lines for the player.
 * It must not change prices, outcomes, wallets or skills.
 */

export function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export function gold(n: number): string {
  return `${n.toLocaleString('zh-CN')} 金`;
}

export function riskLabel(riskTolerance: number): string {
  if (riskTolerance >= 0.65) return '敢冒险';
  if (riskTolerance >= 0.45) return '中性';
  return '求稳';
}

export function investLabel(investAggression: number): string {
  if (investAggression >= 0.7) return '爱投资';
  if (investAggression >= 0.45) return '会权衡';
  return '先攒钱';
}

export function cooperationLabel(value: number): string {
  if (value >= 0.65) return '倾向合作';
  if (value >= 0.45) return '看情况';
  return '偏独立';
}

export function goalGap(agent: DemoAgent): number | null {
  if (agent.goal.price === null) return null;
  return Math.max(0, agent.goal.price - agent.walletBefore);
}

export function decisionHeadline(agent: DemoAgent): string {
  if (agent.decision.action === 'pass') return '不接';
  return `报价 ${agent.decision.bidAmount} 金`;
}

export function decisionBadge(agent: DemoAgent): { label: string; tone: 'pass' | 'bid' } {
  if (agent.decision.action === 'bid') return { label: '想接', tone: 'bid' };
  if (agent.decision.reasonCode === 'risk_above_comfort') return { label: '风险太高', tone: 'pass' };
  if (agent.decision.reasonCode === 'too_little_upside') return { label: '不划算', tone: 'pass' };
  return { label: '先做别的', tone: 'pass' };
}

/** Main public line — 1–2 sentences, generated from structured factors only. */
export function publicLine(agent: DemoAgent): string {
  const d = agent.decision;
  const probability = pct(d.successProbability);
  const floor = pct(d.riskComfortFloor);
  const domain = DOMAIN_LABEL[agent.specialty] ?? agent.specialty;

  if (d.action === 'pass') {
    if (d.reasonCode === 'risk_above_comfort') {
      if (agent.personality === 'cautious') {
        return `这单只有 ${probability} 把握，低于我要求的 ${floor}。报价再高，也不够补我的工具箱。`;
      }
      if (agent.personality === 'steady') {
        return `${probability} 的把握，太悬了。我宁愿先把本事练稳，也不接这单。`;
      }
      return `${probability} 的把握，风险偏高；这单我先不接。`;
    }
    if (d.reasonCode === 'too_little_upside') {
      return `算下来不划算，这单我不出手。`;
    }
    return '这轮我先去抢另一单，这单就不跟了。';
  }

  const gap = goalGap(agent);
  const skill = agent.goal.skillName;
  if (agent.personality === 'bold') {
    if (skill && gap !== null) {
      return `我差 ${gap} 金就能买「${skill}」。${gold(d.bidAmount ?? 0)}我接了，抢单得报狠一点。`;
    }
    return `${gold(d.bidAmount ?? 0)}我接了，先把这一单吃下来。`;
  }
  if (agent.personality === 'steady') {
    return `我不抢最低价。${gold(d.bidAmount ?? 0)}、${probability} 把握，拿下它我的${domain}能再强一点。`;
  }
  if (agent.personality === 'cautious') {
    return `风险可以接受，但报价要够安全：${gold(d.bidAmount ?? 0)}，否则不划算。`;
  }
  return `这单我能做，报 ${gold(d.bidAmount ?? 0)}。`;
}

/** One-line reaction after the decision. */
export function reactionLine(agent: DemoAgent, fixture: BidDemoFixture): string {
  const d = agent.decision;
  if (d.result === 'won') {
    const skill = fixture.skillPurchase[0];
    if (skill) return `拿下了！到手 ${fixture.settlement?.net ?? '?'} 金，刚好能把「${skill.name}」补上。`;
    return '拿下了，先按计划推进。';
  }
  if (d.result === 'failed') return '单是拿下了，但这单翻车了，下次得更谨慎。';
  if (d.result === 'lost') {
    return `我报了 ${gold(d.bidAmount ?? 0)} 还是没中。下次得把价格和风险算得更准。`;
  }
  return agent.personality === 'steady'
    ? '少赚一点没关系，我看的是长期能力。'
    : '这单我不接，等更稳的机会。';
}

/** Compact chips for the explanation panel. */
export function factorChips(agent: DemoAgent): { label: string; value: string; emphasis?: boolean }[] {
  const d = agent.decision;
  const chips: { label: string; value: string; emphasis?: boolean }[] = [
    { label: '有把握', value: pct(d.successProbability) },
    { label: '它要求', value: pct(d.riskComfortFloor) },
    { label: d.expectedProfit !== undefined ? '预计利润' : '这单值', value: String(d.expectedProfit ?? d.expectedValue) },
    { label: '钱包', value: gold(agent.walletBefore) },
  ];
  if (d.estimatedCost !== undefined) chips.push({ label: '预估成本', value: `${d.estimatedCost} 金` });
  if (d.reputation !== undefined) chips.push({ label: '履约声誉', value: `${Math.round(d.reputation * 100)}%` });
  if (d.competitors !== undefined) chips.push({ label: '同域对手', value: `${d.competitors} 人` });
  if (agent.busyUntilRound && agent.busyUntilRound > 0) {
    chips.push({ label: '档期', value: `忙到第 ${agent.busyUntilRound} 轮` });
  }
  if (agent.goal.price !== null) {
    chips.push({ label: '想要', value: agent.goal.label, emphasis: true });
  }
  return chips;
}

export function waitLabel(agent: DemoAgent): string {
  return agent.decision.action === 'bid' ? `${agent.decision.bidAmount} 金` : '观望';
}
