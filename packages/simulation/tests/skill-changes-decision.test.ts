import { describe, expect, it } from 'vitest';
import { createCivilizationGame, createFreeMarketRules, createPublicResearchRules } from '../src/core/factory.js';
import { buildDecisionContext } from '../src/core/engine-internals.js';
import { createRng } from '../src/core/rng.js';
import { MockAgentDecisionProvider } from '../src/agents/mock-decision-provider.js';

/**
 * 比「能力提升」更强的一条：证明技能会改变**决策本身**。
 * 同一居民、同一张单、同一随机种子，唯一差别是「有没有这个技能」。
 */
describe('技能改变决策', () => {
  const task = {
    id: 'task-skill-check',
    roundCreated: 1,
    title: '修一个接口模块',
    status: 'open' as const,
    source: 'market' as const,
    requirements: { domain: 'coding' as const, difficulty: 40, minAbility: 25 },
    reward: 120,
    deadlineRound: 4,
  };

  function decisionFor(withSkill: boolean) {
    const state = createCivilizationGame({ seed: 7, totalRounds: 5 }, [
      { id: 'civ-a', displayName: 'A', rules: createFreeMarketRules() },
      { id: 'civ-b', displayName: 'B', rules: createPublicResearchRules() },
    ]);
    state.round = 1;
    state.marketTasks.push({ ...task });
    const civ = state.civilizations[0]!;
    const agent = civ.agents[0]!;
    if (withSkill) agent.skills.push({ skillId: 'skill_coding_basic', purchasedAtRound: 1 });

    const provider = new MockAgentDecisionProvider();
    const ctx = buildDecisionContext(state, civ.id, [task.id], createRng(11));
    const decisions = provider.decideForCivilization(ctx);
    const mine = decisions.find((d) => d.bids.some((b) => b.agentId === agent.id));
    const decline = decisions
      .flatMap((d) => d.declines ?? [])
      .find((x) => x.agentId === agent.id);
    return { bid: mine?.bids[0], decline, agent, civ };
  }

  it('有技能时成功率更高', () => {
    const without = decisionFor(false);
    const withSk = decisionFor(true);

    const pWithout = without.bid?.expectedQuality !== undefined ? without.bid.expectedQuality : null;
    const pWith = withSk.bid?.expectedQuality !== undefined ? withSk.bid.expectedQuality : null;

    // 期望质量直接来自能力，是最干净的观测量
    if (pWithout !== null && pWith !== null) {
      expect(pWith).toBeGreaterThan(pWithout);
    } else {
      // 没技能时压根不接、有技能才接，同样是「行为变了」
      expect(Boolean(without.bid) === false && Boolean(withSk.bid) === true).toBe(true);
    }
  });

  it('决策（接不接 / 报价）至少有一项发生变化', () => {
    const without = decisionFor(false);
    const withSk = decisionFor(true);

    const before = without.bid ? `bid:${without.bid.bidAmount}` : 'pass';
    const after = withSk.bid ? `bid:${withSk.bid.bidAmount}` : 'pass';
    const qualityChanged = (withSk.bid?.expectedQuality ?? 0) !== (without.bid?.expectedQuality ?? 0);

    expect(before !== after || qualityChanged).toBe(true);
  });
});
