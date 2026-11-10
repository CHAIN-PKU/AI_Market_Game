import { pushEvent } from '../core/events.js';
import { getSkillById } from '../core/skills.js';
import type { Abilities, AgentState, CivilizationState, GameState, TaskDomain } from '../core/types.js';

/** Small, always-affordable step between "no skill" and buying one outright. */
export const TRAINING_COST = 40;
export const TRAINING_BONUS = 4;

/**
 * Pay for hands-on training in one domain: cheaper than a skill, smaller gain.
 * This is what lets a resident that just won a 100-gold task actually improve
 * next round instead of sitting 16 gold short of the cheapest skill.
 */
export function trainAbility(
  state: GameState,
  agent: AgentState,
  domain: TaskDomain,
): boolean {
  if (agent.wallet < TRAINING_COST) return false;
  agent.wallet -= TRAINING_COST;
  agent.stats.skillSpend += TRAINING_COST;
  agent.abilities = { ...agent.abilities, [domain]: agent.abilities[domain] + TRAINING_BONUS } as Abilities;
  pushEvent(state, 'ability_trained', `${agent.displayName} trained ${domain} +${TRAINING_BONUS}`, {
    agentId: agent.id,
    domain,
    cost: TRAINING_COST,
    bonus: TRAINING_BONUS,
  });
  return true;
}

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
