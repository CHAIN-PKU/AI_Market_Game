import { describe, expect, it } from 'vitest';
import { clampRules } from '../src/core/rules-clamp.js';
import { createFreeMarketRules } from '../src/core/factory.js';

describe('clampRules', () => {
  it('clamps tax and preserves name', () => {
    const base = createFreeMarketRules();
    const next = clampRules(base, { taxRate: 0.99, name: '高税实验' });
    expect(next.taxRate).toBe(0.45);
    expect(next.name).toBe('高税实验');
  });
});
