import type { Abilities, TaskDomain } from '../core/types.js';
import { successProbability } from '../core/odds.js';

export interface TaskOutcomeInput {
  abilities: Abilities;
  domain: TaskDomain;
  difficulty: number;
  minAbility: number;
  rng: () => number;
}

export interface TaskOutcomeResult {
  success: boolean;
  quality: number;
  successProbability: number;
}

/** Rule-based task resolution (no LLM). */
export function resolveTaskOutcome(input: TaskOutcomeInput): TaskOutcomeResult {
  const ability = input.abilities[input.domain];
  const gap = ability - input.difficulty;
  const p = successProbability(ability, input.difficulty, input.minAbility);

  const roll = input.rng();
  const success = roll < p;
  const quality = success
    ? clamp(0.5 + gap * 0.03 + input.rng() * 0.2, 0, 1)
    : clamp(0.2 + ability * 0.01 + input.rng() * 0.1, 0, 0.45);

  return { success, quality, successProbability: p };
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
