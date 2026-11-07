#!/usr/bin/env node
/** 一键推进：自动读当前对局 → Cursor 扮演（若有 Key）→ 进入下一纪元 */
import { readActiveGame } from '../active-game.js';
import { readServerConfig, repoRoot } from '../config.js';

const API = process.env.AI_CIV_API ?? 'http://127.0.0.1:3001';

const argGame = process.argv.includes('--game')
  ? process.argv[process.argv.indexOf('--game') + 1]
  : undefined;

const cfg = readServerConfig();
const gameId = argGame ?? (await readActiveGame(repoRoot));

if (!gameId) {
  console.error('没有找到对局。请先打开 http://127.0.0.1:5173 开新局，或：npm run civ:advance -- --game <ID>');
  process.exit(1);
}

const res = await fetch(`${API}/api/games/${gameId}/advance`, { method: 'POST' });
const body = await res.json();

if (res.status === 202) {
  console.log('⏳ 仍等待 Cursor。请配置 CURSOR_API_KEY 后重试，或在聊天里让 Agent 再跑一次本命令。');
  console.log(body.instruction ?? body);
  process.exit(2);
}

if (!res.ok) {
  console.error('推进失败', body);
  process.exit(1);
}

console.log(`✨ 第 ${body.state.round} 纪元已落定（对局 ${gameId.slice(0, 8)}…）`);
