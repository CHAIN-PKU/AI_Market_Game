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
  if (agent.decision.action === 'pass') return '观望';
  return `竞标 ${agent.decision.bidAmount} 金`;
}

export function decisionBadge(agent: DemoAgent): { label: string; tone: 'pass' | 'bid' } {
  if (agent.decision.action === 'bid') return { label: '参与竞标', tone: 'bid' };
  if (agent.decision.reasonCode === 'risk_above_comfort') return { label: '风险不合', tone: 'pass' };
  if (agent.decision.reasonCode === 'too_little_upside') return { label: '收益太低', tone: 'pass' };
  return { label: '优先他单', tone: 'pass' };
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
        return `这单成功率只有 ${probability}，低于我能接受的安全线 ${floor}。报价再高，也不够补我的工具箱。`;
      }
      if (agent.personality === 'steady') {
        return `成功率 ${probability}，波动太大。我宁愿把长期能力先练稳，也不接这单。`;
      }
      return `成功率 ${probability}，风险偏高；这单我先观望。`;
    }
    if (d.reasonCode === 'too_little_upside') {
      return `算下来风险评估后的价值只有 ${d.expectedValue}，不值得我出手。`;
    }
    return '这轮我先去抢另一单，这单就不跟了。';
  }

  const gap = goalGap(agent);
  const skill = agent.goal.skillName;
  if (agent.personality === 'bold') {
    if (skill && gap !== null) {
      return `我差 ${gap} 金就能买「${skill}」。${gold(d.bidAmount ?? 0)}我接了，抢单就得报得狠一点。`;
    }
    return `${gold(d.bidAmount ?? 0)}我接了，先把这一单吃下来。`;
  }
  if (agent.personality === 'steady') {
    return `我不抢最低价。${gold(d.bidAmount ?? 0)}、成功率 ${probability}，拿下它我的${domain}能再长一截。`;
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
    { label: '自估成功率', value: pct(d.successProbability) },
    { label: '风险安全线', value: pct(d.riskComfortFloor) },
    { label: '风险调整价值', value: String(d.expectedValue) },
    { label: '钱包', value: gold(agent.walletBefore) },
    { label: '更强同行', value: `${d.observedCompetitors.strongerSpecialists} 人` },
  ];
  if (agent.goal.price !== null) {
    chips.push({ label: '目标', value: agent.goal.label, emphasis: true });
  }
  return chips;
}

export function waitLabel(agent: DemoAgent): string {
  return agent.decision.action === 'bid' ? `${agent.decision.bidAmount} 金` : '观望';
}
