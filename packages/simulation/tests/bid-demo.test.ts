import { describe, expect, it } from 'vitest';
import { buildBidDemoFixture } from '../src/index.js';

const BASE = { seed: 20, tasksPerRound: 2, warmupRounds: 0, initialAbility: 28 };

describe('bid-demo fixture builder (engine truth)', () => {
  it('is deterministic for identical options', () => {
    const a = buildBidDemoFixture(BASE);
    const b = buildBidDemoFixture(BASE);
    expect(b).toEqual(a);
  });

  it('reproduces the baseline demo economics', () => {
    const f = buildBidDemoFixture(BASE);
    expect(f.winner?.displayName).toBe('Delta');
    expect(f.winner?.bidAmount).toBe(71);
    expect(f.settlement).toMatchObject({ gross: 100, tax: 8, net: 92 });
    expect(f.skillPurchase[0]?.name).toBe('Clean Code Patterns');
    expect(f.nextRound.abilityBefore).toBe(40);
    expect(f.nextRound.abilityAfter).toBe(48);
    expect(f.nextRound.successAfter).toBeGreaterThan(f.nextRound.successBefore!);
    expect(f.declines.some((d) => d.reasonCode === 'risk_above_comfort')).toBe(true);
  });

  it('high tax changes consumption and next-round ability (institution -> behavior)', () => {
    const base = buildBidDemoFixture(BASE);
    const highTax = buildBidDemoFixture({
      ...BASE,
      rules: { name: '高税再分配', taxRate: 0.35, publicResearchShare: 0.1, skillOwnership: 'private' },
    });

    // Bidding is unchanged: the same institutions do not rewrite the market.
    expect(highTax.bids.map((b) => [b.displayName, b.bidAmount])).toEqual(
      base.bids.map((b) => [b.displayName, b.bidAmount]),
    );
    // But the winner cannot afford the skill after tax, so ability growth stops.
    expect(highTax.settlement?.tax).toBe(35);
    expect(highTax.settlement?.net).toBe(65);
    expect(highTax.skillPurchase).toHaveLength(0);
    expect(highTax.nextRound.abilityAfter).toBe(highTax.nextRound.abilityBefore);
    expect(highTax.nextRound.successAfter).toBe(highTax.nextRound.successBefore);
    expect(highTax.civilization.rules.taxRate).toBe(0.35);
  });

  it('clamps out-of-range institutions instead of silently accepting them', () => {
    const f = buildBidDemoFixture({
      ...BASE,
      rules: { taxRate: 9, publicResearchShare: -1, skillOwnership: 'shared' },
    });
    expect(f.civilization.rules.taxRate).toBe(0.45);
    expect(f.civilization.rules.publicResearchShare).toBe(0);
    expect(f.civilization.rules.skillOwnership).toBe('shared');
  });
});
