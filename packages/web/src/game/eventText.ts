import type { BidDemoFixture, RawEvent } from './types';

const REASON: Record<string, string> = {
  risk_above_comfort: '风险太高',
  too_little_upside: '不划算',
  lower_priority: '先做别的',
  price_ring: '价格联盟',
};

export function eventText(event: RawEvent, fixture: BidDemoFixture): string {
  const p = (event.payload ?? {}) as Record<string, unknown>;
  const agentName = (id: unknown) =>
    fixture.agents.find((a) => a.id === id)?.displayName ?? (typeof id === 'string' ? id : '有人');
  const skillName = (id: unknown) => {
    const direct = fixture.skillPurchase.find((s) => s.skillId === id)?.name;
    if (direct) return direct;
    for (const agent of fixture.agents) {
      const skill = agent.skillsAfter.find((s) => s.id === id);
      if (skill) return skill.name;
    }
    return '新技能';
  };

  switch (event.kind) {
    case 'round_started':
      return `第 ${event.round} 轮开始`;
    case 'task_posted':
      return p.player
        ? `发任务：${fixture.scenario.title} · ${p.reward ?? fixture.scenario.reward} 金`
        : '市场出现了新任务';
    case 'bid_placed':
      return `${agentName(p.agentId)} 报价 ${p.bidAmount ?? '?'} 金`;
    case 'bid_declined':
      return `${agentName(p.agentId)} 不接（${REASON[String(p.reasonCode)] ?? '另有打算'}）`;
    case 'task_assigned': {
      const team = Array.isArray(p.teamAgentIds) ? p.teamAgentIds.map(agentName).join(' + ') : agentName(p.agentId);
      return `选中 ${team}`;
    }
    case 'team_formed': {
      const team = Array.isArray(p.teamAgentIds) ? p.teamAgentIds.map(agentName).join(' + ') : '两人';
      return `${team} 组队接单`;
    }
    case 'price_ring': {
      return `${agentName(p.agentId)} 遵守价格联盟`;
    }
    case 'ring_defected':
      return `${agentName(p.agentId)} 背叛了价格联盟`;
    case 'ring_payout':
      return `${agentName(p.agentId)} 给 ${agentName(p.partnerId)} 分了 ${p.amount ?? '?'} 金`;

    case 'team_settled': {
      const team = Array.isArray(p.teamAgentIds) ? p.teamAgentIds.map(agentName).join(' + ') : '队伍';
      return `${team} 分账 ${p.net ?? '?'} 金`;
    }
    case 'task_completed':
      return `任务做完了${fixture.winner ? `：${fixture.winner.displayName} 交差` : ''}`;
    case 'task_failed':
      return `任务搞砸了${fixture.winner ? `：${fixture.winner.displayName}` : ''}`;
    case 'tax_collected':
      return `${agentName(p.agentId)} 交税 ${p.tax ?? '?'} 金，到手 ${p.net ?? '?'} 金`;
    case 'skill_purchased':
      return `${agentName(p.agentId)} 买了「${skillName(p.skillId)}」`;
    case 'skill_shared':
      return `公共技能多了一个：${skillName(p.skillId)}`;
    case 'rules_updated':
      return '规则更新了';
    case 'competition_checkpoint':
      return '两个文明对比了一下';
    default:
      return event.message;
  }
}
