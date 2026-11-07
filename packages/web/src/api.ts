import type { AgentTrace, GameMeta, GameState } from './types';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetchMeta(): Promise<GameMeta> {
  const res = await fetch('/api/meta');
  if (!res.ok) throw new Error('API unreachable');
  return res.json() as Promise<GameMeta>;
}

export async function createGame(): Promise<{ id: string; state: GameState }> {
  const res = await fetch('/api/games', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rounds: 30 }),
  });
  if (!res.ok) throw new Error('create failed');
  return res.json() as Promise<{ id: string; state: GameState }>;
}

export type StepResult =
  | {
      kind: 'advanced';
      state: GameState;
      totalLlmCalls: number;
      lastTraces: AgentTrace[];
    }
  | {
      kind: 'awaiting_cursor';
      state: GameState;
      instruction?: string;
      handoffRequestPath?: string;
    };

export const ADVANCE_TIMEOUT_MS = 300_000;

export type AdvanceGameOptions = {
  /** User cancel (e.g. navigates away). */
  signal?: AbortSignal;
  /** Overrides default POST timeout; use server `/api/meta` advancePostTimeoutMs in Cursor mode. */
  timeoutMs?: number;
};

export async function advanceGame(id: string, options?: AdvanceGameOptions): Promise<StepResult> {
  const timeoutMs = options?.timeoutMs ?? ADVANCE_TIMEOUT_MS;
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const signal = options?.signal
    ? AbortSignal.any([options.signal, timeoutSignal])
    : timeoutSignal;
  const res = await fetch(`/api/games/${id}/advance`, {
    method: 'POST',
    signal,
  });
  if (res.status === 202) {
    const body = (await res.json()) as {
      state: GameState;
      instruction?: string;
      handoffRequestPath?: string;
    };
    return {
      kind: 'awaiting_cursor',
      state: body.state,
      instruction: body.instruction,
      handoffRequestPath: body.handoffRequestPath,
    };
  }
  if (res.status === 404) {
    throw new ApiError('game_not_found', 404);
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(body.error ?? 'advance_failed', res.status);
  }
  const body = await res.json();
  return {
    kind: 'advanced',
    state: body.state as GameState,
    totalLlmCalls: body.totalLlmCalls as number,
    lastTraces: body.lastTraces as AgentTrace[],
  };
}

export async function submitPlayerTask(
  id: string,
  task: { title: string; domain: 'coding' | 'research' | 'design'; reward: number },
): Promise<GameState> {
  const res = await fetch(`/api/games/${id}/player-tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  if (!res.ok) throw new Error('player task failed');
  const body = (await res.json()) as { state: GameState };
  return body.state;
}

export async function publishRules(
  id: string,
  civilizations: Record<
    string,
    {
      name?: string;
      taxRate?: number;
      publicResearchShare?: number;
      skillOwnership?: string;
    }
  >,
): Promise<GameState> {
  const res = await fetch(`/api/games/${id}/rules`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ civilizations }),
  });
  if (!res.ok) throw new Error('rules failed');
  const body = (await res.json()) as { state: GameState };
  return body.state;
}

export async function stepGame(id: string): Promise<StepResult> {
  return advanceGame(id);
}

export async function resetGame(id: string): Promise<{ id: string; state: GameState }> {
  const res = await fetch(`/api/games/${id}/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rounds: 30 }),
  });
  if (res.status === 404) {
    throw new ApiError('game_not_found', 404);
  }
  if (!res.ok) throw new Error('reset failed');
  return res.json() as Promise<{ id: string; state: GameState }>;
}
