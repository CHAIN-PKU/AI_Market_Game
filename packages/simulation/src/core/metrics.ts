import type { Abilities, CivilizationState, SimulationMetrics } from './types.js';

export function computeGini(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  if (sum === 0) return 0;
  let num = 0;
  for (let i = 0; i < sorted.length; i += 1) {
    num += (2 * (i + 1) - sorted.length - 1) * sorted[i]!;
  }
  return num / (sorted.length * sum);
}

export function averageAbilities(civ: CivilizationState): Abilities {
  const n = civ.agents.length || 1;
  const sum = civ.agents.reduce(
    (acc, a) => ({
      coding: acc.coding + a.abilities.coding,
      research: acc.research + a.abilities.research,
      design: acc.design + a.abilities.design,
    }),
    { coding: 0, research: 0, design: 0 },
  );
  return {
    coding: sum.coding / n,
    research: sum.research / n,
    design: sum.design / n,
  };
}

export function refreshCivilizationMetrics(civ: CivilizationState, metrics: SimulationMetrics): void {
  metrics.avgAbility = averageAbilities(civ);
  metrics.giniWealth = computeGini(civ.agents.map((a) => a.wallet + a.stats.grossEarnings * 0.1));
}
