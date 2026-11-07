import { pushEvent } from '../core/events.js';
import { getSkillById } from '../core/skills.js';
import type { AgentState, CivilizationState, GameState } from '../core/types.js';

export function purchaseSkill(
  state: GameState,
  civ: CivilizationState,
  agent: AgentState,
  skillId: string,
): boolean {
  const skill = getSkillById(skillId);
  if (!skill) return false;
  if (agent.wallet < skill.price) return false;
  if (agent.skills.some((s) => s.skillId === skillId)) return false;

  agent.wallet -= skill.price;
  agent.stats.skillSpend += skill.price;
  state.metricsByCiv[civ.id]!.skillPurchases += 1;

  if (civ.rules.skillOwnership === 'shared') {
    if (!civ.sharedSkillIds.includes(skillId)) {
      civ.sharedSkillIds.push(skillId);
      pushEvent(
        state,
        'skill_shared',
        `${civ.displayName} added shared skill ${skill.name}`,
        { skillId, civilizationId: civ.id },
      );
    }
  } else {
    agent.skills.push({ skillId, purchasedAtRound: state.round });
  }

  pushEvent(state, 'skill_purchased', `${agent.displayName} bought ${skill.name}`, {
    agentId: agent.id,
    skillId,
    price: skill.price,
  });
  return true;
}

/** Spend public R&D pool on a random missing shared basic skill. */
export function investPublicResearchPool(state: GameState, civ: CivilizationState): void {
  if (civ.publicResearchPool < 80) return;
  const basics = ['skill_coding_basic', 'skill_research_basic', 'skill_design_basic'];
  for (const skillId of basics) {
    if (civ.sharedSkillIds.includes(skillId)) continue;
    const skill = getSkillById(skillId);
    if (!skill || civ.publicResearchPool < skill.price) continue;
    civ.publicResearchPool -= skill.price;
    civ.sharedSkillIds.push(skillId);
    pushEvent(
      state,
      'skill_shared',
      `${civ.displayName} public R&D unlocked ${skill.name}`,
      { skillId, civilizationId: civ.id },
    );
    return;
  }
}
