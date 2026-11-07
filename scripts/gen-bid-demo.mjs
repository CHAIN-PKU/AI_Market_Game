/**
 * Generates the deterministic bidding-demo fixture from the REAL simulation engine.
 * Run: npm run demo:fixture   (requires `npm run build -w @ai-civ/simulation` first)
 *
 * The builder lives in packages/simulation/src/demo/bid-demo.ts so the API and tests
 * can reuse exactly the same engine path. This script only handles CLI + file output.
 */
import { buildBidDemoFixture } from '../packages/simulation/dist/index.js';
import fs from 'node:fs';
import path from 'node:path';

function summarize(fixture) {
  const focus = fixture.agents.filter((a) => a.isFocus);
  const lines = focus.map(
    (a) =>
      `${a.displayName}[${a.personalityLabel}] ${a.decision.action}${
        a.decision.bidAmount ? ':' + a.decision.bidAmount : ''
      } (${a.decision.reasonCode})`,
  );
  return [
    `seed=${fixture.seed} tasksPerRound=${fixture.tasksPerRound} warmup=${fixture.warmupRounds} ability=${fixture.initialAbility} round=${fixture.demoRound} rules=${JSON.stringify(fixture.civilization.rules)}`,
    `  focus: ${lines.join(' | ')}`,
    `  bids=${fixture.bids.length} winner=${fixture.winner?.displayName} completed=${fixture.winner?.completed}`,
    `  settlement=${JSON.stringify(fixture.settlement)}`,
    `  skill=${fixture.skillPurchase.map((s) => `${s.name} ${s.price}G ${s.abilityBefore}->${s.abilityAfter}`).join('; ') || 'none'}`,
  ].join('\n');
}

const explore = process.argv.includes('--explore');
if (explore) {
  const results = [];
  for (let seed = 1; seed <= 120; seed += 1) {
    for (const tasksPerRound of [2, 3]) {
      const f = buildBidDemoFixture({ seed, tasksPerRound, warmupRounds: 0, initialAbility: 28 });
      const astra = f.agents[0];
      const delta = f.agents[3];
      const grove = f.agents[6];
      const ok =
        astra.decision.action === 'pass' &&
        astra.decision.reasonCode === 'risk_above_comfort' &&
        delta.decision.action === 'bid' &&
        grove.decision.action === 'bid' &&
        delta.decision.bidAmount < grove.decision.bidAmount &&
        f.winner?.agentId === delta.id &&
        f.winner?.completed &&
        f.skillPurchase.length > 0 &&
        f.bids.length === 2;
      if (ok) results.push(summarize(f));
    }
  }
  console.log(results.slice(0, 10).join('\n---\n'));
  console.log('matches:', results.length);
  process.exit(0);
}

const seed = Number(process.env.DEMO_SEED ?? 12);
const tasksPerRound = Number(process.env.DEMO_TASKS ?? 3);
const warmupRounds = Number(process.env.DEMO_WARMUP ?? 0);
const initialAbility = Number(process.env.DEMO_ABILITY ?? 28);
const fixture = buildBidDemoFixture({ seed, tasksPerRound, warmupRounds, initialAbility });
const outDir = path.join(process.cwd(), 'packages/web/src/demo');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'bid-demo.fixture.json');
fs.writeFileSync(outFile, JSON.stringify(fixture, null, 2) + '\n');
console.log(summarize(fixture));
console.log('written:', outFile);
