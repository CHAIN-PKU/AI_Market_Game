#!/usr/bin/env node
/**
 * 由 Cursor Agent 在本地执行：读取 handoff 请求 → Cursor SDK 扮演文明 → 提交决策 → 推进 1 轮
 *
 * 用法：npm run cursor:play -- --game <uuid>
 */
import { readFile } from 'node:fs/promises';
import { resolveAgentMode, readServerConfig, repoRoot } from '../config.js';
import { decideCivilizationWithCursor } from '../cursor/cursor-sdk-brain.js';
import { buildDecisionContext } from '@ai-civ/simulation';
import { createRng } from '@ai-civ/simulation';

const API = process.env.AI_CIV_API ?? 'http://127.0.0.1:3001';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const gameId = arg('--game');
if (!gameId) {
  console.error('Usage: npm run cursor:play -- --game <game-uuid>');
  process.exit(1);
}

const cfg = readServerConfig();
if (resolveAgentMode() === 'handoff' && !cfg.cursor.configured) {
  console.error('Handoff 模式需要 CURSOR_API_KEY（Cursor Dashboard → Integrations）');
  process.exit(1);
}

const snap = await fetch(`${API}/api/games/${gameId}`);
if (!snap.ok) {
  console.error('Game not found. Start server + open web UI first.');
  process.exit(1);
}
const game = (await snap.json()) as {
  state: import('@ai-civ/simulation').GameState;
  handoffRequest?: import('../cursor/handoff-payload.js').HandoffRequestPayload;
};

let handoff = game.handoffRequest;
if (!handoff) {
  const stepProbe = await fetch(`${API}/api/games/${gameId}/step`, { method: 'POST' });
  const probeBody = (await stepProbe.json()) as { handoffRequest?: typeof handoff };
  handoff = probeBody.handoffRequest;
}

if (!handoff) {
  console.error('No handoff request. Click 「下一步」 in the web UI first.');
  process.exit(1);
}

const state = game.state;
const rng = createRng(state.rngState);
const openTaskIds = handoff.openTasks.map((t) => t.id);
const civilizations: Record<string, import('@ai-civ/simulation').AgentDecision[]> = {};
const reasoning: Record<string, string> = {};

for (const civSummary of handoff.civilizations) {
  const ctx = buildDecisionContext(state, civSummary.id, openTaskIds, rng);
  const result = await decideCivilizationWithCursor(ctx, {
    apiKey: cfg.cursor.apiKey,
    model: cfg.cursor.model,
    repoRoot,
  });
  civilizations[civSummary.id] = result.decisions;
  for (const t of result.traces) {
    if (t.reasoning) reasoning[t.agentId] = t.reasoning;
  }
}

const post = await fetch(`${API}/api/games/${gameId}/handoff`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ civilizations, reasoning }),
});
if (!post.ok) {
  console.error('Failed to submit handoff', await post.text());
  process.exit(1);
}

const step = await fetch(`${API}/api/games/${gameId}/step`, { method: 'POST' });
const final = await step.json();
console.log('Cursor Agent 已完成本轮决策并推进模拟');
console.log(`Round now: ${(final as { state: { round: number } }).state?.round ?? '?'}`);
