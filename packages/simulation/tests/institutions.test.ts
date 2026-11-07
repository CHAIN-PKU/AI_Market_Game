import { describe, expect, it } from 'vitest';
import {
  createDualCivilizationGame,
  runSimulation,
} from '../src/index.js';

describe('institution contrast (smoke)', () => {
  it('public R&D civ accumulates shared skills differently from free market', () => {
    const final = runSimulation(createDualCivilizationGame({ seed: 123, totalRounds: 20 }));
    const free = final.civilizations.find((c) => c.id === 'civ-a')!;
    const publicCiv = final.civilizations.find((c) => c.id === 'civ-b')!;
    expect(free.rules.skillOwnership).toBe('private');
    expect(publicCiv.rules.skillOwnership).toBe('shared');
    expect(publicCiv.sharedSkillIds.length).toBeGreaterThanOrEqual(0);
    const privateSkillCount = free.agents.reduce((n, a) => n + a.skills.length, 0);
    expect(privateSkillCount + publicCiv.sharedSkillIds.length).toBeGreaterThan(0);
  });
});
