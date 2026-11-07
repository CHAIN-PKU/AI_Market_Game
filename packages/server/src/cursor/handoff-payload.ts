import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { GameState } from '@ai-civ/simulation';

export interface HandoffRequestPayload {
  gameId: string;
  roundToPlay: number;
  instruction: string;
  civilizations: {
    id: string;
    displayName: string;
    rules: unknown;
    agents: { id: string; displayName: string; wallet: number }[];
  }[];
  openTasks: {
    id: string;
    title: string;
    domain: string;
    reward: number;
    difficulty: number;
  }[];
}

export function buildHandoffRequest(gameId: string, state: GameState): HandoffRequestPayload {
  const roundToPlay = state.round + 1;
  const openTasks = state.marketTasks
    .filter((t) => t.status === 'open' && t.deadlineRound >= roundToPlay)
    .map((t) => ({
      id: t.id,
      title: t.title,
      domain: t.requirements.domain,
      reward: t.reward,
      difficulty: t.requirements.difficulty,
    }));

  return {
    gameId,
    roundToPlay,
    instruction:
      '在 Cursor 聊天中对 Agent 说：「执行 npm run cursor:play -- --game ' +
      gameId +
      '」让 Cursor Agent 以文明居民身份提交本轮竞标。',
    civilizations: state.civilizations.map((c) => ({
      id: c.id,
      displayName: c.displayName,
      rules: c.rules,
      agents: c.agents.map((a) => ({
        id: a.id,
        displayName: a.displayName,
        wallet: a.wallet,
      })),
    })),
    openTasks,
  };
}

export async function writeHandoffFile(repoRoot: string, payload: HandoffRequestPayload) {
  const dir = resolve(repoRoot, 'runtime', 'handoff');
  await mkdir(dir, { recursive: true });
  const path = resolve(dir, `${payload.gameId}-round-${payload.roundToPlay}-request.json`);
  await writeFile(path, JSON.stringify(payload, null, 2), 'utf8');
  return path;
}
