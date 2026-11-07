#!/usr/bin/env node
import { createDualCivilizationGame, runSimulation } from '../index.js';
import { printAgentRoundDigest, printPlainLanguageIntro } from './format-agents.js';

interface CliOptions {
  rounds: number;
  seed: number;
  agents: boolean;
  quiet: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  let rounds = 30;
  let seed = 42;
  let agents = false;
  let quiet = false;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--rounds' && argv[i + 1]) {
      rounds = Number(argv[i + 1]);
      i += 1;
    } else if (arg === '--seed' && argv[i + 1]) {
      seed = Number(argv[i + 1]);
      i += 1;
    } else if (arg === '--agents' || arg === '-a') {
      agents = true;
    } else if (arg === '--quiet' || arg === '-q') {
      quiet = true;
    }
  }
  return { rounds, seed, agents, quiet };
}

const opts = parseArgs(process.argv.slice(2));
const game = createDualCivilizationGame({ totalRounds: opts.rounds, seed: opts.seed });

console.log('AI Civilization — 本地双文明模拟（终端版）');
console.log(`seed=${opts.seed}  rounds=${opts.rounds}`);
if (!opts.quiet) {
  printPlainLanguageIntro();
}

const final = runSimulation(game, {
  onRoundComplete(state) {
    if (opts.agents) {
      printAgentRoundDigest(state, state.round);
      return;
    }
    if (state.round % 5 !== 0) return;
    console.log(`--- Round ${state.round}（文明汇总）---`);
    for (const civ of state.civilizations) {
      const m = state.metricsByCiv[civ.id]!;
      console.log(
        `${civ.displayName} (${civ.rules.name}): 产出=${m.totalGrossOutput} 成/败=${m.tasksSucceeded}/${m.tasksFailed} 买Skill=${m.skillPurchases} 国库=${civ.treasury}`,
      );
    }
  },
});

console.log('\n=== 最终汇总（看制度有没有拉开差距）===');
for (const civ of final.civilizations) {
  const m = final.metricsByCiv[civ.id]!;
  const top = [...civ.agents].sort((a, b) => b.wallet - a.wallet)[0];
  console.log(`\n${civ.displayName} — ${civ.rules.name}`);
  console.log(`  税率 ${(civ.rules.taxRate * 100).toFixed(0)}%  |  Skill：${civ.rules.skillOwnership}`);
  console.log(`  总产出 ${m.totalGrossOutput}  |  任务 成/败 ${m.tasksSucceeded}/${m.tasksFailed}`);
  console.log(`  买 Skill 次数 ${m.skillPurchases}  |  共享 Skill ${civ.sharedSkillIds.length}`);
  console.log(`  国库 ${civ.treasury}  |  公共研发池 ${civ.publicResearchPool}`);
  console.log(`  贫富差距 Gini≈${m.giniWealth.toFixed(3)}`);
  if (top) {
    console.log(`  最富居民：${top.displayName}  钱包=${top.wallet}`);
  }
}

if (!opts.agents) {
  console.log('\n提示：要看「每个居民每一轮在干嘛」，请运行：');
  console.log('  npm run sim:agents -- --rounds 8');
}
