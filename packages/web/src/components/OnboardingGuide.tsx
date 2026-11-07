import { useState } from 'react';

const STEPS = [
  {
    n: 1,
    title: '改规则（可选）',
    body: '中间「调整规则」拉滑块，点「保存规则」。左边偏自由市场，右边偏公共研发。',
  },
  {
    n: 2,
    title: '点「下一回合」',
    body: '居民会自动抢任务、领工资、买技能。看中间「本回合」和下方事件列表。',
  },
  {
    n: 3,
    title: '对比两座文明',
    body: '看左右谁赚得多、谁买的技能多。想重来就点「重新开始」。',
  },
];

export function OnboardingGuide() {
  const [open, setOpen] = useState(true);

  if (!open) {
    return (
      <button type="button" className="text-sm text-[var(--color-a)] underline" onClick={() => setOpen(true)}>
        显示新手指引
      </button>
    );
  }

  return (
    <section className="panel p-4 bg-[var(--color-a-soft)] border-[var(--color-a)]/30">
      <div className="flex justify-between items-start gap-2 mb-2">
        <h2 className="font-semibold text-base">怎么玩（3 步）</h2>
        <button type="button" className="text-xs text-[var(--color-muted)] hover:text-black" onClick={() => setOpen(false)}>
          收起
        </button>
      </div>
      <ol className="space-y-2 text-sm text-[var(--color-muted)]">
        {STEPS.map((s) => (
          <li key={s.n}>
            <span className="font-semibold text-[var(--color-text)]">{s.n}. {s.title}</span>
            — {s.body}
          </li>
        ))}
      </ol>
    </section>
  );
}
