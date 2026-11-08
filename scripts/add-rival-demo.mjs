/**
 * 给 demo fixture 注入「对手文明」：用引擎真的跑一遍对手的报价，而不是编数字。
 *
 * 做法：建一个双文明局，把 demo 里那张单（奖励 100 / 难度 40 / 写码）挂进市场，
 * 只让第二座文明的 Mock 决策器出价——这样对手报价与主文明报价出自同一套规则。
 *
 * 幂等：只替换 fixture.rival 这一段。
 * Run: node scripts/add-rival-demo.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  createDualCivilizationGame,
  buildDecisionContext,
  createRng,
  MockAgentDecisionProvider,
  effectiveAbility,
  scoreBid,
} from '../packages/simulation/dist/index.js';

const FIXTURE = path.resolve('packages/web/src/demo/bid-demo.fixture.json');
const fixture = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));

const task = {
  id: 'task-rival-1',
  roundCreated: 1,
  title: '修复网站登录问题',
  status: 'open',
  source: 'market',
  requirements: { domain: 'coding', difficulty: 40, minAbility: 30 },
  reward: 100,
};

const state = createDualCivilizationGame({ seed: fixture.seed ?? 42, totalRounds: 5 });
state.round = 1;
state.marketTasks.push(task);

const rivals = state.civilizations[1];
const rng = createRng((fixture.seed ?? 42) + 7);
const provider = new MockAgentDecisionProvider();
const decisions = provider.decideForCivilization(
  buildDecisionContext(state, rivals.id, [task.id], rng)
);

const abilitiesOf = (agent) =>
  effectiveAbility(agent.abilities, agent.skills.map((s) => s.skillId), rivals.sharedSkillIds);

const bids = [];
for (const decision of decisions) {
  for (const bid of decision.bids) {
    const agent = rivals.agents.find((a) => a.id === bid.agentId);
    if (!agent) continue;
    const ability = abilitiesOf(agent)[task.requirements.domain];
    bids.push({
      agentId: bid.agentId,
      displayName: agent.displayName,
      bidAmount: bid.bidAmount,
      expectedQuality: Number(bid.expectedQuality.toFixed(3)),
      successProbability: Number(
        Math.min(0.95, Math.max(0.05, ability / (task.requirements.difficulty * 2))).toFixed(3)
      ),
      estimatedCost: Math.round((task.reward * 0.42 * task.requirements.difficulty) / Math.max(1, ability)),
    });
  }
}

bids.sort((a, b) => b.bidAmount - a.bidAmount);

// 跨文明评分：主文明的报价也在同一把尺子上量一遍，看对手到底能不能抢走。
const mainBids = (fixture.bids ?? []).map((bid) => ({
  who: bid.displayName,
  civ: fixture.civilization.name,
  civId: fixture.civilization.id,
  amount: bid.bidAmount,
  quality: bid.expectedQuality,
  score: Number(scoreBid(bid, task).toFixed(3)),
}));
const rivalScored = bids.map((bid) => ({
  who: bid.displayName,
  civ: '远岸文明',
  civId: rivals.id,
  amount: bid.bidAmount,
  quality: bid.expectedQuality,
  score: Number(scoreBid(bid, task).toFixed(3)),
}));

const allScored = [...mainBids, ...rivalScored].sort((a, b) => b.score - a.score);
const crossCiv = {
  rule: '评分 = 0.55 × 质量 + 0.45 × 价格优势（引擎 scoreBid）',
  scores: allScored.slice(0, 4),
  winner: allScored[0] ?? null,
  /** 对手的最高分是否被主文明压住 */
  rivalLost: allScored[0]?.civId !== rivals.id,
};

fixture.rival = {
  crossCiv,
  id: rivals.id,
  name: '远岸文明',
  rules: {
    name: '公共研发',
    taxRate: rivals.rules.taxRate,
    publicResearchShare: rivals.rules.publicResearchShare,
    skillOwnership: rivals.rules.skillOwnership,
    allowFreeHire: rivals.rules.allowFreeHire,
    allowCollaboration: rivals.rules.allowCollaboration,
  },
  treasuryStart: rivals.treasury,
  treasuryAfter: rivals.treasury,
  generatedBy: 'scripts/add-rival-demo.mjs (engine mock decisions)',
  bids: bids.slice(0, 5),
};

fs.writeFileSync(FIXTURE, `${JSON.stringify(fixture, null, 2)}\n`);
console.log(`rival bids: ${bids.length}, top: ${bids[0]?.displayName ?? '-'} ${bids[0]?.bidAmount ?? '-'}`);
