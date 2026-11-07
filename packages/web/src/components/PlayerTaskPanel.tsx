import { useState } from 'react';

export function PlayerTaskPanel({
  onSubmit,
  busy,
}: {
  onSubmit: (t: { title: string; domain: 'coding' | 'research' | 'design'; reward: number }) => void;
  busy: boolean;
}) {
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState<'coding' | 'research' | 'design'>('coding');
  const [reward, setReward] = useState(150);

  return (
    <div className="space-y-3">
      <input
        className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
        placeholder="任务描述，如：做一张海报"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <div className="flex gap-2">
        <select
          className="flex-1 border border-[var(--color-border)] rounded-lg px-2 py-2 text-sm"
          value={domain}
          onChange={(e) => setDomain(e.target.value as typeof domain)}
        >
          <option value="coding">编程</option>
          <option value="research">科研</option>
          <option value="design">设计</option>
        </select>
        <input
          type="number"
          min={50}
          max={500}
          className="w-24 border border-[var(--color-border)] rounded-lg px-2 py-2 text-sm"
          value={reward}
          onChange={(e) => setReward(Number(e.target.value))}
        />
      </div>
      <button
        type="button"
        className="btn-primary w-full text-sm py-2.5"
        style={{ borderRadius: '10px' }}
        disabled={busy || title.trim().length < 2}
        onClick={() => {
          onSubmit({ title: title.trim(), domain, reward });
          setTitle('');
        }}
      >
        发布到市集
      </button>
    </div>
  );
}
