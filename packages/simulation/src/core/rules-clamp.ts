import type { CivilizationRules, SkillOwnership } from './types.js';

export type RulesPatch = Partial<
  Pick<
    CivilizationRules,
    'name' | 'taxRate' | 'publicResearchShare' | 'skillOwnership' | 'allowFreeHire' | 'allowCollaboration'
  >
>;

export function clampRules(base: CivilizationRules, patch: RulesPatch): CivilizationRules {
  const taxRate =
    patch.taxRate !== undefined ? clamp(patch.taxRate, 0, 0.45) : base.taxRate;
  let publicResearchShare =
    patch.publicResearchShare !== undefined
      ? clamp(patch.publicResearchShare, 0, 1)
      : base.publicResearchShare;
  if (publicResearchShare > taxRate && taxRate === 0) {
    publicResearchShare = 0;
  }

  const skillOwnership = patch.skillOwnership ?? base.skillOwnership;
  assertSkillOwnership(skillOwnership);

  return {
    name: patch.name?.slice(0, 40) ?? base.name,
    taxRate,
    publicResearchShare: clamp(publicResearchShare, 0, 1),
    skillOwnership,
    allowFreeHire: patch.allowFreeHire ?? base.allowFreeHire,
    allowCollaboration: patch.allowCollaboration ?? base.allowCollaboration,
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function assertSkillOwnership(v: SkillOwnership): void {
  if (v !== 'private' && v !== 'shared') {
    throw new Error('skillOwnership must be private or shared');
  }
}
