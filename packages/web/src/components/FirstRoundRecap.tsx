const RECAP_STEPS = [
  {
    emoji: '📜',
    title: '这是「本回合故事」',
    body: '一句话总结今天市集。想听八卦就点卡片进剧场，默认只有摘要；细节要自己展开。',
  },
  {
    emoji: '⚔️',
    title: '这是「文明 PK」',
    body: '比的是这一回合谁交差更多（当天产出），不是左边卡片上的累计总产出。领先的一方会标出来。',
  },
  {
    emoji: '🏛️',
    title: '这是「文明成绩牌」',
    body: '大数字 = 从开始到现在的总产出。下面名字 = 当前钱包最多的居民。点卡片可以认人、看能力。',
  },
  {
    emoji: '🧭',
    title: '接下来你可以…',
    body: '再点「下一回合」继续看戏；想插手就底部「规则」或「发任务」。过几天若财富太集中，会出现寡头提示——到时候再教你怎么办。',
  },
] as const;

export function FirstRoundRecap({
  step,
  onNext,
  onFinish,
}: {
  step: number;
  onNext: () => void;
  onFinish: () => void;
}) {
  const item = RECAP_STEPS[step];
  if (!item) return null;
  const isLast = step === RECAP_STEPS.length - 1;

  return (
    <div className="recap-root" role="dialog" aria-modal="true">
      <div className="recap-card">
        <span className="recap-emoji" aria-hidden>
          {item.emoji}
        </span>
        <p className="recap-step">
          第 1 天刚结束 · 认一认界面 ({step + 1}/{RECAP_STEPS.length})
        </p>
        <h2 className="recap-title">{item.title}</h2>
        <p className="recap-body">{item.body}</p>
        <button
          type="button"
          className="btn-primary recap-btn"
          onClick={isLast ? onFinish : onNext}
        >
          {isLast ? '知道了，我自己逛' : '下一块'}
        </button>
      </div>
    </div>
  );
}
