import { describe, expect, it } from 'vitest';
import { createDualCivilizationGame } from '../src/core/factory.js';
import { WAGER_MIN, openWager, settleWager, wagerAffordable } from '../src/economy/wager.js';

function game() {
  const state = createDualCivilizationGame({ totalRounds: 5, seed: 11 });
  const [a, b] = state.civilizations;
  a!.treasury = 500;
  b!.treasury = 500;
  return { state, a: a!, b: b! };
}

describe('文明对赌', () => {
  it('开盘时双方各扣押注，钱进对赌池', () => {
    const { state, a, b } = game();
    const wager = openWager(state, [a.id, b.id], 50);

    expect(wager).toBeTruthy();
    expect(a.treasury).toBe(450);
    expect(b.treasury).toBe(450);
    expect(state.events.some((e) => e.kind === 'wager_opened')).toBe(true);
  });

  it('中标且做成：赢家吞掉对手押注', () => {
    const { state, a, b } = game();
    const wager = openWager(state, [a.id, b.id], 50)!;
    const res = settleWager(state, wager, a.id, true);

    expect(res.outcome).toBe('take');
    expect(a.treasury).toBe(550); // 500 - 50 + 100
    expect(b.treasury).toBe(450);
    expect(res.treasuryDelta[a.id]).toBe(50);
    expect(res.treasuryDelta[b.id]).toBe(-50);
    expect(wager.settled).toBe(true);
  });

  it('中标但失败：押注转给对手', () => {
    const { state, a, b } = game();
    const wager = openWager(state, [a.id, b.id], 50)!;
    const res = settleWager(state, wager, a.id, false);

    expect(res.outcome).toBe('lose');
    expect(a.treasury).toBe(450);
    expect(b.treasury).toBe(550);
  });

  it('无人接单：双方各退回，国库回到原点', () => {
    const { state, a, b } = game();
    const wager = openWager(state, [a.id, b.id], 50)!;
    const res = settleWager(state, wager, null, false);

    expect(res.outcome).toBe('refund');
    expect(a.treasury).toBe(500);
    expect(b.treasury).toBe(500);
    expect(state.events.some((e) => e.kind === 'wager_refunded')).toBe(true);
  });

  it('钱只在国库之间移动，总额守恒', () => {
    const { state, a, b } = game();
    const before = a.treasury + b.treasury;
    const wager = openWager(state, [a.id, b.id], 70)!;
    settleWager(state, wager, b.id, true);
    expect(a.treasury + b.treasury).toBe(before);
  });

  it('付不起或低于下限就不开盘', () => {
    const { state, a, b } = game();
    expect(openWager(state, [a.id, b.id], WAGER_MIN - 1)).toBeNull();

    b.treasury = 10;
    expect(openWager(state, [a.id, b.id], 50)).toBeNull();
    expect(wagerAffordable([a, b], 50)).toBe(false);
    expect(wagerAffordable([a, b], 10)).toBe(false);
  });
});
