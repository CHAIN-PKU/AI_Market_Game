import type { CivilizationState } from '../types';

export function formatCivName(name: string): string {
  return name
    .replace(/^Civilization A$/i, '文明 A')
    .replace(/^Civilization B$/i, '文明 B');
}

export function agentSpecialty(agent: { abilities: { coding: number; research: number; design: number } }): string {
  const { coding, research, design } = agent.abilities;
  const max = Math.max(coding, research, design);
  if (coding === max) return '编程';
  if (research === max) return '科研';
  return '设计';
}

export function topAgents(civ: CivilizationState, n = 4) {
  return [...civ.agents].slice(0, n);
}
