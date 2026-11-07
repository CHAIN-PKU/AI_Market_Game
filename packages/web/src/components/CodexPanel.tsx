import type { CivilizationRules, CivilizationState } from '../types';

export type RulesDraft = Pick<
  CivilizationRules,
  'name' | 'taxRate' | 'publicResearchShare' | 'skillOwnership'
>;

const PRESETS: { label: string; rules: RulesDraft }[] = [
  {
    label: '自由市场',
    rules: { name: '自由市场', taxRate: 0.08, publicResearchShare: 0.1, skillOwnership: 'private' },
  },
  {
    label: '公共研发',
    rules: { name: '公共研发', taxRate: 0.22, publicResearchShare: 0.65, skillOwnership: 'shared' },
  },
];

function CivRules({
  title,
  draft,
  onChange,
  onPreset,
}: {
  title: string;
  draft: RulesDraft;
  onChange: (d: RulesDraft) => void;
  onPreset: (p: RulesDraft) => void;
}) {
  return (
    <div className="space-y-3 pb-4 border-b border-[var(--color-border)] last:border-0">
      <p className="font-medium text-sm">{title}</p>
      <div className="flex gap-1">
        {PRESETS.map((p) => (
          <button key={p.label} type="button" className="btn-secondary text-xs py-1" onClick={() => onPreset(p.rules)}>
            {p.label}
          </button>
        ))}
      </div>
      <label className="block text-xs text-[var(--color-muted)]">
        抽成 {(draft.taxRate * 100).toFixed(0)}%
        <input
          type="range"
          min={0}
          max={45}
          value={Math.round(draft.taxRate * 100)}
          className="w-full accent-[var(--color-accent)]"
          onChange={(e) => onChange({ ...draft, taxRate: Number(e.target.value) / 100 })}
        />
      </label>
      <label className="block text-xs text-[var(--color-muted)]">
        公共池 {(draft.publicResearchShare * 100).toFixed(0)}%
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(draft.publicResearchShare * 100)}
          className="w-full accent-[var(--color-accent)]"
          onChange={(e) =>
            onChange({ ...draft, publicResearchShare: Number(e.target.value) / 100 })
          }
        />
      </label>
      <select
        className="w-full border border-[var(--color-border)] rounded-lg px-2 py-1.5 text-sm"
        value={draft.skillOwnership}
        onChange={(e) =>
          onChange({ ...draft, skillOwnership: e.target.value as 'private' | 'shared' })
        }
      >
        <option value="private">技能私有</option>
        <option value="shared">技能共享</option>
      </select>
    </div>
  );
}

export function CodexPanel({
  draftA,
  draftB,
  setDraftA,
  setDraftB,
  onPublish,
  busy,
}: {
  draftA: RulesDraft;
  draftB: RulesDraft;
  setDraftA: (d: RulesDraft) => void;
  setDraftB: (d: RulesDraft) => void;
  onPublish: () => void;
  busy: boolean;
}) {
  return (
    <div>
      <CivRules title="文明 A" draft={draftA} onChange={setDraftA} onPreset={setDraftA} />
      <CivRules title="文明 B" draft={draftB} onChange={setDraftB} onPreset={setDraftB} />
      <button
        type="button"
        className="btn-primary w-full mt-4 text-sm py-2.5"
        style={{ borderRadius: '10px' }}
        disabled={busy}
        onClick={onPublish}
      >
        保存
      </button>
    </div>
  );
}

export function rulesFromCiv(civ: CivilizationState): RulesDraft {
  return {
    name: civ.rules.name,
    taxRate: civ.rules.taxRate,
    publicResearchShare: civ.rules.publicResearchShare,
    skillOwnership: civ.rules.skillOwnership as 'private' | 'shared',
  };
}
