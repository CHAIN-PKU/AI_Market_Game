import { describe, expect, it } from 'vitest';
import { createCivilizationGame, createDualCivilizationGame, createFreeMarketRules, createPublicResearchRules, DEFAULT_CONFIG } from '../src/core/factory.js';
import { generateTasksForRound } from '../src/market/task-generator.js';
import { createRng } from '../src/core/rng.js';

describe('多人（N 文明）对抗地基', () => {
  const rules = () => createFreeMarketRules();

  it('可以创建 3 座文明，各自有独立国库与居民', () => {
    const state = createCivilizationGame({}, [
      { id: 'civ-a', displayName: 'A', rules: rules() },
      { id: 'civ-b', displayName: 'B', rules: createPublicResearchRules() },
      { id: 'civ-c', displayName: 'C', rules: rules() },
    ]);

    expect(state.civilizations).toHaveLength(3);
    state.civilizations[1]!.treasury = 123;
    expect(state.civilizations[0]!.treasury).not.toBe(123);
    for (const civ of state.civilizations) {
      expect(civ.agents).toHaveLength(DEFAULT_CONFIG.agentsPerCivilization);
      expect(state.metricsByCiv[civ.id]).toBeTruthy();
    }
  });

  it('只有一座文明时直接报错（对抗需要对手）', () => {
    expect(() => createCivilizationGame({}, [{ id: 'solo', displayName: 'S', rules: rules() }])).toThrow();
  });

  it('双文明工厂仍按原样工作（向后兼容）', () => {
    const state = createDualCivilizationGame({ seed: 3 });
    expect(state.civilizations.map((c) => c.id)).toEqual(['civ-a', 'civ-b']);
  });

  it('全局市场对 N 座文明共享同一批可抢的单', () => {
    const state = createCivilizationGame({ seed: 5 }, [
      { id: 'civ-a', displayName: 'A', rules: rules() },
      { id: 'civ-b', displayName: 'B', rules: rules() },
      { id: 'civ-c', displayName: 'C', rules: rules() },
    ]);
    state.round = 1;
    const tasks = generateTasksForRound(state, createRng(5));
    state.marketTasks.push(...tasks);

    expect(state.marketTasks.length).toBeGreaterThan(0);
    // 单子不绑定文明：任何文明的居民都能来抢
    expect(state.marketTasks.every((t) => t.status === 'open')).toBe(true);
  });
});
