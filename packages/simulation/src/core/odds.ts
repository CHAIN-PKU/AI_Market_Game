/** Shared success-odds formula used by task resolution and public bidding explanations. */
export function successProbability(ability: number, difficulty: number, minAbility: number): number {
  const gap = ability - difficulty;
  const meetMin = ability >= minAbility;
  const p = meetMin ? 0.35 + gap * 0.025 : 0.05 + ability * 0.005;
  return Math.max(0.03, Math.min(0.97, p));
}
