import { pushEvent } from '../core/events.js';
import type { CivilizationState, GameState } from '../core/types.js';

/**
 * 文明对赌（Wager）：两座文明在开单前各押一笔国库筹码，抢同一单。
 *
 * 结算规则（简单、可解释）：
 * - 押注中标者所属文明 → 赢家吃掉对方押注（净赚 amount）
 * - 押注方中标但任务失败 → 押注归对方（雪上加霜）
 * - 双方都没中标 → 各自退回，不赚不赔
 *
 * 设计约束：钱只在国库之间移动，绝不凭空产生；任一方付不起就不开盘。
 */

export interface Wager {
  id: string;
  amount: number;
  /** 下注的两座文明 id */
  civIds: [string, string];
  settled: boolean;
}

export interface WagerResult {
  wager: Wager;
  winnerCivId: string | null;
  /** 'take' | 'lose' | 'refund' */
  outcome: 'take' | 'lose' | 'refund';
  /** 赢家国库净变化（已扣掉自己的押注再收回） */
  treasuryDelta: { [civId: string]: number };
}

export const WAGER_MIN = 20;

export function openWager(state: GameState, civIds: [string, string], amount: number): Wager | null {
  const [a, b] = civIds.map((id) => state.civilizations.find((c) => c.id === id));
  if (!a || !b) return null;
  if (amount < WAGER_MIN) return null;
  if (a.treasury < amount || b.treasury < amount) return null;

  a.treasury -= amount;
  b.treasury -= amount;

  const wager: Wager = {
    id: `wager-${state.round}-${state.events.length + 1}`,
    amount,
    civIds,
    settled: false,
  };

  pushEvent(state, 'wager_opened', `${a.displayName} 与 ${b.displayName} 各押 ${amount} 金对赌本轮`, {
    wagerId: wager.id,
    amount,
    civIds,
  });
  return wager;
}

/**
 * @param winnerCivId 中标者所属文明；null 表示这一轮没人接单
 * @param winnerSucceeded 中标者是否真的做成了；winnerCivId 为 null 时忽略
 */
export function settleWager(
  state: GameState,
  wager: Wager,
  winnerCivId: string | null,
  winnerSucceeded: boolean,
): WagerResult {
  const pot = wager.amount * 2;
  const delta: { [civId: string]: number } = {};
  for (const id of wager.civIds) delta[id] = 0;

  let outcome: WagerResult['outcome'];
  if (!winnerCivId) {
    // 没人接单：各退各的
    for (const id of wager.civIds) {
      const civ = state.civilizations.find((c) => c.id === id);
      if (civ) civ.treasury += wager.amount;
      delta[id] = 0;
    }
    outcome = 'refund';
    pushEvent(state, 'wager_refunded', `本轮无人接单，双方押注退回`, { wagerId: wager.id });
  } else {
    const taker = state.civilizations.find((c) => c.id === winnerCivId);
    const otherId = wager.civIds.find((id) => id !== winnerCivId);
    const other = state.civilizations.find((c) => c.id === otherId);

    if (winnerSucceeded) {
      if (taker) taker.treasury += pot;
      delta[winnerCivId] = wager.amount;
      if (otherId) delta[otherId] = -wager.amount;
      outcome = 'take';
      pushEvent(
        state,
        'wager_settled',
        `${taker?.displayName ?? winnerCivId} 中标并做成，吞掉对赌 ${pot} 金`,
        { wagerId: wager.id, amount: wager.amount, winnerCivId },
      );
    } else {
      if (other) other.treasury += pot;
      delta[winnerCivId] = -wager.amount;
      if (otherId) delta[otherId] = wager.amount;
      outcome = 'lose';
      pushEvent(
        state,
        'wager_settled',
        `${taker?.displayName ?? winnerCivId} 中标却失败，押注转给对手 ${pot} 金`,
        { wagerId: wager.id, amount: wager.amount, winnerCivId },
      );
    }
  }

  wager.settled = true;
  return { wager, winnerCivId, outcome, treasuryDelta: delta };
}

/** 给 UI 用：两座文明当前国库能否开盘 */
export function wagerAffordable(civs: CivilizationState[], amount: number): boolean {
  return amount >= WAGER_MIN && civs.every((c) => c.treasury >= amount);
}
