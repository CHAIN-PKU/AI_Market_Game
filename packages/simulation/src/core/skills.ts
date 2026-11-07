import type { Abilities, TaskDomain } from './types.js';

export interface SkillDefinition {
  id: string;
  name: string;
  domain: TaskDomain;
  price: number;
  abilityBonus: number;
  description: string;
}

export const SKILL_CATALOG: SkillDefinition[] = [
  {
    id: 'skill_coding_basic',
    name: 'Clean Code Patterns',
    domain: 'coding',
    price: 80,
    abilityBonus: 8,
    description: 'Improves coding task success.',
  },
  {
    id: 'skill_coding_advanced',
    name: 'Systems Architecture',
    domain: 'coding',
    price: 180,
    abilityBonus: 15,
    description: 'Strong boost for hard coding tasks.',
  },
  {
    id: 'skill_research_basic',
    name: 'Literature Review',
    domain: 'research',
    price: 80,
    abilityBonus: 8,
    description: 'Improves research task success.',
  },
  {
    id: 'skill_research_advanced',
    name: 'Lab Methodology',
    domain: 'research',
    price: 180,
    abilityBonus: 15,
    description: 'Strong boost for hard research tasks.',
  },
  {
    id: 'skill_design_basic',
    name: 'Visual Composition',
    domain: 'design',
    price: 80,
    abilityBonus: 8,
    description: 'Improves design task success.',
  },
  {
    id: 'skill_design_advanced',
    name: 'Product UX Systems',
    domain: 'design',
    price: 180,
    abilityBonus: 15,
    description: 'Strong boost for hard design tasks.',
  },
];

export function getSkillById(id: string): SkillDefinition | undefined {
  return SKILL_CATALOG.find((s) => s.id === id);
}

/** Effective ability for a domain including owned + shared skills. */
export function effectiveAbility(
  base: Abilities,
  ownedSkillIds: string[],
  sharedSkillIds: string[],
): Abilities {
  const result = { ...base };
  const allIds = new Set([...ownedSkillIds, ...sharedSkillIds]);
  for (const skillId of allIds) {
    const skill = getSkillById(skillId);
    if (!skill) continue;
    result[skill.domain] += skill.abilityBonus;
  }
  return result;
}
