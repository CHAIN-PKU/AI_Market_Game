import { describe, expect, it } from 'vitest';
import { createDualCivilizationGame, runSimulation } from '../src/index.js';

describe('economic invariants', () => {
  it('completes 30 rounds without negative balances', () => {
    const initial = createDualCivilizationGame({ seed: 7, totalRounds: 30 });
    const final = runSimulation(initial);
    expect(final.round).toBe(30);
    for (const civ of final.civilizations) {
      expect(civ.treasury).toBeGreaterThanOrEqual(0);
      for (const agent of civ.agents) {
        expect(agent.wallet).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('is reproducible with the same seed', () => {
    const a = runSimulation(createDualCivilizationGame({ seed: 99, totalRounds: 10 }));
    const b = runSimulation(createDualCivilizationGame({ seed: 99, totalRounds: 10 }));
    expect(a.metricsByCiv['civ-a']!.totalGrossOutput).toBe(
      b.metricsByCiv['civ-a']!.totalGrossOutput,
    );
    expect(a.metricsByCiv['civ-b']!.tasksSucceeded).toBe(
      b.metricsByCiv['civ-b']!.tasksSucceeded,
    );
  });

  it('does not double-pay the same completed task', () => {
    const final = runSimulation(createDualCivilizationGame({ seed: 3, totalRounds: 5 }));
    const completed = final.marketTasks.filter((t) => t.status === 'completed');
    const ids = new Set(completed.map((t) => t.id));
    expect(ids.size).toBe(completed.length);
  });

  it('both civilizations earn income over 15 rounds (shared market not monopolized)', () => {
    const final = runSimulation(createDualCivilizationGame({ seed: 42, totalRounds: 15 }));
    const outA = final.metricsByCiv['civ-a']!.totalGrossOutput;
    const outB = final.metricsByCiv['civ-b']!.totalGrossOutput;
    expect(outA).toBeGreaterThan(0);
    expect(outB).toBeGreaterThan(0);
  });
});
