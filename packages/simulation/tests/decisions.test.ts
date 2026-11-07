import { describe, expect, it } from 'vitest';
import {
  MockAgentDecisionProvider,
  buildDecisionContext,
  createDualCivilizationGame,
  postPlayerTask,
  runSingleRound,
  successProbability,
} from '../src/index.js';

function singleCivState(seed = 1) {
  const state = createDualCivilizationGame({ seed, totalRounds: 3, tasksPerRound: 0, initialAgentAbility: 28 });
  state.civilizations = [state.civilizations[0]!];
  return state;
}

describe('personality-aware bidding', () => {
  it('cautious residents decline when success is below their comfort floor; risk-takers bid', () => {
    const state = singleCivState();
    const civ = state.civilizations[0]!;
    const cautious = civ.agents[0]!;
    const aggressive = civ.agents[3]!;

    // Same coding ability (40) and the same risky task (p = 0.35).
    cautious.traits.riskTolerance = 0.1;
    aggressive.traits.riskTolerance = 0.9;

    const task = postPlayerTask(state, { title: 'login bug', domain: 'coding', reward: 100 });
    const ctx = buildDecisionContext(state, civ.id, [task.id], () => 0.5);
    const decisions = new MockAgentDecisionProvider().decideForCivilization(ctx);

    const cautiousDecision = decisions[0]!;
    const aggressiveDecision = decisions[3]!;

    expect(cautiousDecision.bids).toHaveLength(0);
    expect(cautiousDecision.declines?.[0]?.reasonCode).toBe('risk_above_comfort');
    expect(cautiousDecision.declines?.[0]?.successProbability).toBeCloseTo(0.35, 2);
    expect(aggressiveDecision.bids).toHaveLength(1);
    expect(aggressiveDecision.bids[0]!.successProbability).toBeCloseTo(0.35, 2);
    expect(aggressiveDecision.bids[0]!.reasonFactors?.length).toBeGreaterThan(4);
    expect(aggressiveDecision.bids[0]!.personalGoalLabel).toContain('攒钱');
  });

  it('risk appetite changes bid price: cautious bid keeps a higher margin', () => {
    const state = singleCivState();
    const civ = state.civilizations[0]!;
    const cautious = civ.agents[0]!;
    const aggressive = civ.agents[3]!;
    cautious.abilities = { ...cautious.abilities, coding: 50 };
    aggressive.abilities = { ...aggressive.abilities, coding: 50 };
    cautious.traits.riskTolerance = 0.2;
    aggressive.traits.riskTolerance = 0.8;

    const task = postPlayerTask(state, { title: 'login bug', domain: 'coding', reward: 100 });
    const ctx = buildDecisionContext(state, civ.id, [task.id], () => 0.5);
    const decisions = new MockAgentDecisionProvider().decideForCivilization(ctx);

    const cautiousBid = decisions[0]!.bids[0]!;
    const aggressiveBid = decisions[3]!.bids[0]!;
    expect(cautiousBid.bidAmount).toBeGreaterThan(aggressiveBid.bidAmount);
  });

  it('engine emits structured bid and decline events', () => {
    const state = singleCivState();
    const civ = state.civilizations[0]!;
    civ.agents[0]!.traits.riskTolerance = 0.05;
    const task = postPlayerTask(state, { title: 'login bug', domain: 'coding', reward: 100 });
    runSingleRound(state);

    const bidEvent = state.events.find((e) => e.kind === 'bid_placed' && e.payload?.taskId === task.id);
    const declineEvent = state.events.find((e) => e.kind === 'bid_declined' && e.payload?.taskId === task.id);
    expect(bidEvent?.payload?.successProbability).toBeTypeOf('number');
    expect(bidEvent?.payload?.reasonFactors).toBeInstanceOf(Array);
    expect(declineEvent?.payload?.reasonCode).toBeTypeOf('string');
    expect(declineEvent?.payload?.reasonFactors).toBeInstanceOf(Array);
  });

  it('shared odds formula matches the documented threshold', () => {
    expect(successProbability(40, 40, 25)).toBeCloseTo(0.35, 5);
    expect(successProbability(48, 40, 25)).toBeCloseTo(0.55, 5);
  });
});
