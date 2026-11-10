/**
 * Injects the post-win "invest & evolve" step into the bidding demo fixture.
 *
 * The committed fixture wins the task but cannot afford the cheapest skill
 * (64 net < 80), so the skill stage used to show nothing. Training costs 40 and
 * adds +4 to one domain, which the winner CAN afford — so the evolution step now
 * has real numbers behind it.
 *
 * Idempotent: re-running replaces the `evolution` block only.
 * Run: node scripts/add-evolution-demo.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { successProbability, TRAINING_BONUS, TRAINING_COST, SKILL_CATALOG } from '../packages/simulation/dist/index.js';

const FIXTURE = path.resolve('packages/web/src/demo/bid-demo.fixture.json');
const fixture = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));

const winner = fixture.winner;
const settlement = fixture.settlement;
if (!winner || !settlement) {
  console.error('fixture is missing winner/settlement — nothing to evolve');
  process.exit(1);
}

const agent = fixture.agents.find((a) => a.id === winner.agentId) ?? fixture.agents[0];
const domain = 'coding';
const difficulty = 40;
const minAbility = 30;
const abilityBefore = agent.abilities[domain];
const abilityAfter = abilityBefore + TRAINING_BONUS;
const cheapest = Math.min(...SKILL_CATALOG.map((s) => s.price));

fixture.evolution = {
  agentId: winner.agentId,
  displayName: winner.displayName,
  domain,
  // the resident's own goal, not a scripted excuse
  reason: agent.goal?.label ?? `把 ${domain} 练强`,
  taskTitle: '修复网站登录问题',
  taskReward: 100,
  bidAmount: winner.bidAmount,
  walletBefore: settlement.walletAfter,
  taxPaid: settlement.tax,
  trainingCost: TRAINING_COST,
  trainingBonus: TRAINING_BONUS,
  walletAfter: settlement.walletAfter - TRAINING_COST,
  abilityBefore,
  abilityAfter,
  successBefore: successProbability(abilityBefore, difficulty, minAbility),
  successAfter: successProbability(abilityAfter, difficulty, minAbility),
  cheapestSkillPrice: cheapest,
  shortfallToSkill: Math.max(0, cheapest - settlement.walletAfter),
  // what the civilization now leans towards
  civLean: {
    coding: abilityAfter,
    research: agent.abilities.research,
    design: agent.abilities.design,
  },
};

fs.writeFileSync(FIXTURE, `${JSON.stringify(fixture, null, 2)}\n`);
console.log(
  `evolution: ${fixture.evolution.displayName} ${abilityBefore}->${abilityAfter} ` +
    `wallet ${fixture.evolution.walletBefore}->${fixture.evolution.walletAfter} ` +
    `p ${fixture.evolution.successBefore.toFixed(2)}->${fixture.evolution.successAfter.toFixed(2)}`,
);
