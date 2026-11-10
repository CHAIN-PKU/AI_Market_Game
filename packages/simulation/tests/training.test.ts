import { describe, expect, it } from 'vitest';
import { createDualCivilizationGame } from '../src/core/factory.js';
import { TRAINING_BONUS, TRAINING_COST, trainAbility } from '../src/economy/skills.js';

function setup(wallet: number) {
  const state = createDualCivilizationGame({ totalRounds: 5, seed: 7 });
  const civ = state.civilizations[0]!;
  const agent = civ.agents[0]!;
  agent.wallet = wallet;
  return { state, civ, agent };
}

describe('trainAbility', () => {
  it('spends the training fee and raises exactly one domain', () => {
    const { state, agent } = setup(64);
    const before = { ...agent.abilities };

    expect(trainAbility(state, agent, 'coding')).toBe(true);

    expect(agent.wallet).toBe(64 - TRAINING_COST);
    expect(agent.abilities.coding).toBe(before.coding + TRAINING_BONUS);
    expect(agent.abilities.research).toBe(before.research);
    expect(agent.abilities.design).toBe(before.design);
    expect(agent.stats.skillSpend).toBe(TRAINING_COST);
  });

  it('refuses when the wallet cannot cover the fee', () => {
    const { state, agent } = setup(TRAINING_COST - 1);
    const before = { ...agent.abilities };

    expect(trainAbility(state, agent, 'coding')).toBe(false);
    expect(agent.wallet).toBe(TRAINING_COST - 1);
    expect(agent.abilities).toEqual(before);
  });

  it('emits an ability_trained event carrying the numbers', () => {
    const { state, agent } = setup(64);
    trainAbility(state, agent, 'design');

    const evt = state.events.find((e) => e.kind === 'ability_trained');
    expect(evt).toBeTruthy();
    expect(evt!.payload).toMatchObject({
      agentId: agent.id,
      domain: 'design',
      cost: TRAINING_COST,
      bonus: TRAINING_BONUS,
    });
  });

  it('lets a task winner who earned 64 actually improve (the demo gap)', () => {
    // The bidding demo pays the winner 64 net; the cheapest skill costs 80.
    const { state, agent } = setup(64);
    const codingBefore = agent.abilities.coding;

    expect(trainAbility(state, agent, 'coding')).toBe(true);
    expect(agent.abilities.coding).toBeGreaterThan(codingBefore);
  });
});
