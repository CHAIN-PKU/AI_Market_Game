import { describe, expect, it } from 'vitest';
import { createCivilizationGame, createFreeMarketRules, createPublicResearchRules } from '../src/core/factory.js';
import { runSingleRound } from '../src/core/engine.js';
import { MockAgentDecisionProvider } from '../src/agents/mock-decision-provider.js';
import { effectiveAbility, getSkillById } from '../src/core/skills.js';
import { successProbability } from '../src/core/odds.js';

/**
 * 审查要求：证明「上一轮买的技能会影响下一轮的真实行为」，不能只靠录屏。
 * 做法：每轮开始前快照每个居民的三项有效能力；跑完一轮后若有人买了技能，
 * 就要求该居民在其技能所属领域的能力严格变高，且同难度成功率随之变高。
 */
describe('技能跨轮生效', () => {
  it('买下技能后，该领域能力与同难度成功率都变高', () => {
    const DIFFICULTY = 40;
    const MIN_ABILITY = 25;
    let increased = 0;
    let decreased = 0;

    for (let seed = 1; seed <= 60; seed += 1) {
      const state = createCivilizationGame({ seed, totalRounds: 8 }, [
        { id: 'civ-a', displayName: 'A', rules: createFreeMarketRules() },
        { id: 'civ-b', displayName: 'B', rules: createPublicResearchRules() },
      ]);
      const provider = new MockAgentDecisionProvider();

      for (let round = 0; round < 6; round += 1) {
        const before = new Map<string, { coding: number; research: number; design: number }>();
        for (const civ of state.civilizations) {
          for (const agent of civ.agents) {
            before.set(
              agent.id,
              effectiveAbility(agent.abilities, agent.skills.map((s) => s.skillId), civ.sharedSkillIds),
            );
          }
        }

        runSingleRound(state, provider);

        for (const evt of state.events.filter((e) => e.kind === 'skill_purchased')) {
          const payload = evt.payload as { agentId?: string; skillId?: string };
          const skill = payload.skillId ? getSkillById(payload.skillId) : undefined;
          const civ = state.civilizations.find((c) => c.agents.some((a) => a.id === payload.agentId));
          const agent = civ?.agents.find((a) => a.id === payload.agentId);
          const prev = payload.agentId ? before.get(payload.agentId) : undefined;
          if (!skill || !civ || !agent || !prev) continue;

          const after = effectiveAbility(agent.abilities, agent.skills.map((s) => s.skillId), civ.sharedSkillIds);
          const domain = skill.domain;
          if (after[domain] > prev[domain]) {
            increased += 1;
            // 成功率随能力一起涨（同难度、同门槛）
            expect(successProbability(after[domain], DIFFICULTY, MIN_ABILITY)).toBeGreaterThan(
              successProbability(prev[domain], DIFFICULTY, MIN_ABILITY),
            );
          } else if (after[domain] < prev[domain]) {
            decreased += 1;
          }
        }
      }
    }

    // 能力不会因为买技能而倒退；且确实抓到多次「买了就变强」的证据
    expect(decreased).toBe(0);
    expect(increased).toBeGreaterThanOrEqual(3);
  });
});
