import { randomUUID } from 'node:crypto';
import type { AgentDecision, GameState } from '@ai-civ/simulation';
import {
  clampRules,
  createDualCivilizationGame,
  postPlayerTask,
  runSingleRoundAsync,
  type RulesPatch,
} from '@ai-civ/simulation';
import type { TaskDomain } from '@ai-civ/simulation';
import { pushEvent } from '@ai-civ/simulation';
import type { AgentDecisionTrace } from '@ai-civ/simulation';
import { buildHandoffRequest, writeHandoffFile } from './cursor/handoff-payload.js';
import { buildHandoffBundleViaCursor } from './cursor/fill-handoff.js';
import {
  HandoffAsyncAgentDecisionProvider,
  HandoffPendingError,
} from './providers/handoff-async-provider.js';
import type { AgentMode } from './config.js';
import { createAsyncProvider } from './agent-factory.js';
import { writeActiveGame } from './active-game.js';
import type { MindStreamEvent } from './mind-stream.js';

export interface HandoffDecisionBundle {
  civilizations: Record<string, AgentDecision[]>;
  reasoning: Record<string, string>;
}

export interface GameSession {
  id: string;
  state: GameState;
  createdAt: string;
  totalLlmCalls: number;
  lastTraces: AgentDecisionTrace[];
  status: 'ready' | 'awaiting_cursor';
  handoffRequestPath?: string;
  handoffRequest?: ReturnType<typeof buildHandoffRequest>;
  pendingHandoff?: HandoffDecisionBundle;
}

export class GameStore {
  private sessions = new Map<string, GameSession>();

  constructor(
    private agentMode: AgentMode,
    private factoryOptions: Parameters<typeof createAsyncProvider>[1],
    private repoRoot: string,
    private mindBroadcast?: (gameId: string, ev: MindStreamEvent) => void,
  ) {}

  async create(_rounds = 30): Promise<GameSession> {
    const state = createDualCivilizationGame({ totalRounds: _rounds, seed: Date.now() % 100000 });
    const session: GameSession = {
      id: randomUUID(),
      state,
      createdAt: new Date().toISOString(),
      totalLlmCalls: 0,
      lastTraces: [],
      status: 'ready',
    };
    this.sessions.set(session.id, session);
    await writeActiveGame(this.repoRoot, session.id);
    return session;
  }

  get(id: string): GameSession | undefined {
    return this.sessions.get(id);
  }

  addPlayerTask(
    id: string,
    input: { title: string; domain: TaskDomain; reward: number },
  ): GameSession | undefined {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    postPlayerTask(session.state, input);
    return session;
  }

  updateRules(id: string, patches: Record<string, RulesPatch>): GameSession | undefined {
    const session = this.sessions.get(id);
    if (!session) return undefined;

    for (const civ of session.state.civilizations) {
      const patch = patches[civ.id];
      if (!patch) continue;
      civ.rules = clampRules(civ.rules, patch);
      pushEvent(session.state, 'rules_updated', `${civ.displayName} 法典修订：${civ.rules.name}`, {
        civilizationId: civ.id,
        rules: civ.rules,
      });
    }
    return session;
  }

  setHandoffDecisions(id: string, bundle: HandoffDecisionBundle): GameSession | undefined {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    session.pendingHandoff = bundle;
    session.status = 'ready';
    return session;
  }

  /** 下一纪元：Handoff 且已配 Cursor Key 时自动召唤 Agent，否则走原有 handoff 等待。 */
  async advance(id: string): Promise<
    | { session: GameSession; awaitingCursor: false }
    | { session: GameSession; awaitingCursor: true }
    | undefined
  > {
    const session = this.sessions.get(id);
    if (!session) return undefined;

    if (
      this.agentMode === 'handoff' &&
      !session.pendingHandoff &&
      this.factoryOptions.cursor.apiKey
    ) {
      const payload = buildHandoffRequest(session.id, session.state);
      session.handoffRequest = payload;
      const bundle = await buildHandoffBundleViaCursor(session.state, payload, {
        apiKey: this.factoryOptions.cursor.apiKey,
        model: this.factoryOptions.cursor.model,
        repoRoot: this.factoryOptions.cursor.repoRoot,
      });
      session.pendingHandoff = bundle;
      session.totalLlmCalls += payload.civilizations.length;
    }

    return this.step(id);
  }

  async step(id: string): Promise<
    | { session: GameSession; awaitingCursor: false }
    | { session: GameSession; awaitingCursor: true }
    | undefined
  > {
    const session = this.sessions.get(id);
    if (!session) return undefined;

    if (this.agentMode === 'handoff' && !session.pendingHandoff) {
      const payload = buildHandoffRequest(session.id, session.state);
      const path = await writeHandoffFile(this.repoRoot, payload);
      session.handoffRequest = payload;
      session.handoffRequestPath = path;
      session.status = 'awaiting_cursor';
      return { session, awaitingCursor: true };
    }

    const provider = this.buildProviderForSession(session);

    try {
      const nextRound = session.state.round + 1;
      this.mindBroadcast?.(id, { kind: 'round_start', round: nextRound });
      if (this.agentMode === 'cursor' && this.mindBroadcast) {
        for (const civ of session.state.civilizations) {
          this.mindBroadcast(id, {
            kind: 'civ_phase',
            civilizationId: civ.id,
            label: this.civLabel(session, civ.id),
          });
          this.mindBroadcast(id, {
            kind: 'text',
            civilizationId: civ.id,
            text: `⏳ 已排队调用 Cursor（${this.civLabel(session, civ.id)}）…\n本地 Agent 正在读任务与居民能力，可能需几十秒到两分钟。\n\n`,
          });
        }
      }
      console.info(`[game] round advance start game=${id} mode=${this.agentMode}`);
      const result = await runSingleRoundAsync(session.state, provider);
      console.info(`[game] round advance done game=${id} round=${result.state.round}`);
      session.state = result.state;
      session.totalLlmCalls += result.llmApiCalls;
      session.lastTraces = result.traces;
      session.pendingHandoff = undefined;
      session.status = 'ready';
      session.handoffRequest = undefined;
      this.mindBroadcast?.(id, { kind: 'round_done', round: result.state.round });
      return { session, awaitingCursor: false };
    } catch (err) {
      this.mindBroadcast?.(id, {
        kind: 'error',
        message: err instanceof Error ? err.message : 'advance_failed',
      });
      if (err instanceof HandoffPendingError) {
        throw new Error('Handoff decisions missing after submit');
      }
      throw err;
    }
  }

  async reset(id: string, rounds = 30): Promise<GameSession | undefined> {
    if (!this.sessions.has(id)) return undefined;
    const fresh = await this.create(rounds);
    fresh.id = id;
    this.sessions.set(id, fresh);
    return fresh;
  }

  private civLabel(session: GameSession, civilizationId: string): string {
    return session.state.civilizations.find((c) => c.id === civilizationId)?.displayName ?? civilizationId;
  }

  private buildProviderForSession(session: GameSession) {
    if (this.agentMode === 'handoff') {
      return new HandoffAsyncAgentDecisionProvider(
        (civId) => session.pendingHandoff?.civilizations[civId],
        (agentId) => session.pendingHandoff?.reasoning[agentId],
      );
    }
    if (this.agentMode === 'cursor') {
      const gid = session.id;
      const mb = this.mindBroadcast;
      type FactoryOpts = Parameters<typeof createAsyncProvider>[1];
      const cursorBase = this.factoryOptions.cursor;
      const merged: FactoryOpts = mb
        ? {
            ...this.factoryOptions,
            cursorHooks: {
              onCivilizationStart: (civId: string) => {
                mb(gid, {
                  kind: 'civ_phase',
                  civilizationId: civId,
                  label: this.civLabel(session, civId),
                });
              },
              onCivilizationDone: (civId: string, ok: boolean, err?: string) => {
                mb(gid, { kind: 'civ_done', civilizationId: civId, ok, error: err });
              },
            },
            cursor: {
              ...cursorBase,
              onStreamChunk: (text: string, civilizationId: string) => {
                mb(gid, { kind: 'text', civilizationId, text });
              },
            },
          }
        : { ...this.factoryOptions };
      return createAsyncProvider('cursor', merged);
    }
    return createAsyncProvider(this.agentMode, this.factoryOptions);
  }
}
