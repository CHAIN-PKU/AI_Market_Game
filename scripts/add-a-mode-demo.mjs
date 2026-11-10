/**
 * 用引擎真跑一轮「双文明同场抢单」，把结果写进 demo fixture 的 aMode 字段。
 *
 * 这不是演示数据拼凑：createCivilizationGame 建两座文明 → generateTasksForRound 出单
 * → Mock 决策器各自动脑 → selectWinningBids 定标 → 结算。产物只是把这一轮的结果抄下来。
 *
 * 幂等：只替换 fixture.aMode。
 * Run: node scripts/add-a-mode-demo.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  createCivilizationGame,
  createFreeMarketRules,
  createPublicResearchRules,
  runSingleRound,
  MockAgentDecisionProvider,
} from '../packages/simulation/dist/index.js';

const FIXTURE = path.resolve('packages/web/src/demo/bid-demo.fixture.json');
const fixture = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));

const seed = fixture.seed ?? 42;
const state = createCivilizationGame({ seed, totalRounds: 5 }, [
  { id: 'civ-a', displayName: '晨曦文明', rules: createFreeMarketRules() },
  { id: 'civ-b', displayName: '远岸文明', rules: createPublicResearchRules() },
]);

runSingleRound(state, new MockAgentDecisionProvider());

const bids = state.marketTasks.flatMap((task) => task.bids ?? []);
const assigned = state.marketTasks.filter((t) => t.status === 'assigned' || t.status === 'completed' || t.status === 'failed');

const civOf = (agentId) =>
  state.civilizations.find((c) => c.agents.some((a) => a.id === agentId))?.id ?? null;

const winnerRows = assigned.map((task) => {
  const agentId = task.assignedAgentId ?? null;
  const agent = state.civilizations.flatMap((c) => c.agents).find((a) => a.id === agentId);
  return {
    taskId: task.id,
    title: task.title,
    reward: task.reward,
    winnerAgentId: agentId,
    winnerName: agent?.displayName ?? null,
    winnerCivId: task.assignedCivilizationId ?? (agentId ? civOf(agentId) : null),
    winningBid: task.winningBid?.bidAmount ?? null,
    status: task.status,
  };
});

fixture.aMode = {
  generatedBy: 'scripts/add-a-mode-demo.mjs (engine runSingleRound)',
  seed,
  round: state.round,
  civilizations: state.civilizations.map((c) => ({
    id: c.id,
    name: c.displayName,
    rules: c.rules.name,
    taxRate: c.rules.taxRate,
    treasury: c.treasury,
    agents: c.agents.length,
  })),
  tasksPlayed: state.marketTasks.length,
  bidsByCiv: state.civilizations.map((c) => ({
    civId: c.id,
    name: c.displayName,
    bids: bids.filter((b) => civOf(b.agentId) === c.id).length,
  })),
  winners: winnerRows,
  /** 这一轮有多少单被对岸抢走 */
  wonByRival: winnerRows.filter((r) => r.winnerCivId === 'civ-b').length,
  wonByHome: winnerRows.filter((r) => r.winnerCivId === 'civ-a').length,
};

fs.writeFileSync(FIXTURE, `${JSON.stringify(fixture, null, 2)}\n`);
console.log(
  `A mode: round ${state.round}, tasks ${state.marketTasks.length}, ` +
    `home wins ${fixture.aMode.wonByHome}, rival wins ${fixture.aMode.wonByRival}`
);
