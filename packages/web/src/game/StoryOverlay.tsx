import { useEffect, useState } from 'react';
import type { BidDemoFixture } from './types';
import { STEP_INDEX, type StepId } from './playback';
import { useCountUp } from './useCountUp';

/**
 * 大屏叙事：任务卡（发单时）与到手流水（结算时）。
 * 数字全部来自 fixture（reward / tax / net / wallet），不做任何前端估算。
 */
export function StoryOverlay({ fixture, step }: { fixture: BidDemoFixture; step: StepId }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (step !== 'settled') {
      setCount(0);
      return;
    }
    setCount(0);
    const timer = window.setInterval(() => {
      setCount((n) => (n >= 4 ? n : n + 1));
    }, 450);
    return () => window.clearInterval(timer);
  }, [step]);

  const settle = fixture.settlement;
  const winner = fixture.winner;

  // 每行到点后再滚动，形成「奖励 → 税 → 到手 → 钱包」的节奏
  const gross = useCountUp(settle?.gross ?? 0, count >= 1);
  const tax = useCountUp(settle?.tax ?? 0, count >= 2);
  const net = useCountUp(settle?.net ?? 0, count >= 3, 480);
  const wallet = useCountUp(settle?.walletAfter ?? 0, count >= 4);

  const inTaskPhase = STEP_INDEX[step] >= STEP_INDEX.posted && STEP_INDEX[step] < STEP_INDEX.bids;

  if (inTaskPhase) {
    return (
      <div className="g-story g-story--task">
        <span className="g-story-kicker">市集挂单</span>
        <h3>修复网站登录问题</h3>
        <div className="g-task-rows">
          <div className="g-task-row">
            <span className="g-task-icon" aria-hidden>⌨️</span>
            <label>领域</label>
            <b>写代码</b>
          </div>
          <div className="g-task-row">
            <span className="g-task-icon" aria-hidden>💰</span>
            <label>奖励</label>
            <b className="is-hero">100<i>金</i></b>
          </div>
          <div className="g-task-row">
            <span className="g-task-icon" aria-hidden>📈</span>
            <label>难度</label>
            <b>40</b>
          </div>
          <div className="g-task-row">
            <span className="g-task-icon" aria-hidden>🧑‍💻</span>
            <label>谁能接</label>
            <b>写码 ≥ 30</b>
          </div>
        </div>
        <p>客户网站登录入口一直报错，今天内修好。8 个居民各自算账：接不接、报多少、要不要拉人。</p>
      </div>
    );
  }

  if (step === 'settled' && settle) {
    return (
      <div className="g-story g-story--money">
        <span className="g-story-kicker">{winner?.displayName ?? '中标者'} 到账</span>
        <div className="g-story-lines">
          <div className={count >= 1 ? 'is-on' : ''}>
            <label>任务奖励</label>
            <b>{gross} 金</b>
          </div>
          <div className={count >= 2 ? 'is-on' : ''}>
            <label>税金 8%</label>
            <b className="is-minus">−{tax} 金</b>
          </div>
          <div className={`is-total ${count >= 3 ? 'is-on' : ''}`}>
            <label>到手</label>
            <b>{net} 金</b>
          </div>
          <div className={count >= 4 ? 'is-on' : ''}>
            <label>钱包</label>
            <b>
              {settle.walletBefore} → {wallet}
            </b>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
