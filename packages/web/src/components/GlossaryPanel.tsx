import { useState } from 'react';

const ITEMS = [
  {
    term: '文明抽成',
    def: '居民交差后，先划给国库的一成比例——用来养公共技能、调节贫富差距，不是现实报税。',
  },
  { term: '公共研发池', def: '从税款里划出一部分，给全文明买共享技能。' },
  { term: '技能私有 / 共享', def: '私有=谁买的谁用；共享=买了全队都能用。' },
  { term: '总产出', def: '这座文明累计完成的任务报酬（毛收入）。' },
  { term: '胜/负', def: '任务成功次数 / 失败次数。' },
  { term: '练习模式', def: '没配 Cursor 密钥时，用内置逻辑模拟居民，方便先看清玩法。' },
];

export function GlossaryPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="text-sm">
      <button
        type="button"
        className="text-[var(--color-muted)] underline"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? '收起名词解释' : '名词解释（看不懂就点这里）'}
      </button>
      {open && (
        <ul className="mt-2 space-y-1.5 text-[var(--color-muted)] panel p-3">
          {ITEMS.map((i) => (
            <li key={i.term}>
              <strong className="text-[var(--color-text)]">{i.term}</strong>：{i.def}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
