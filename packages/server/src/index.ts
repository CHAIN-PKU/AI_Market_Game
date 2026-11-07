import Fastify from 'fastify';
import cors from '@fastify/cors';
import type { RulesPatch } from '@ai-civ/simulation';
import { playerBrainLabel, readServerConfig } from './config.js';
import { GameStore } from './game-store.js';
import { createAsyncProvider } from './agent-factory.js';
import { readActiveGame } from './active-game.js';
import { MindStreamHub } from './mind-hub.js';

const cfg = readServerConfig();

const mindHub = new MindStreamHub();

const store = new GameStore(
  cfg.agentMode,
  { llm: cfg.llm, cursor: { ...cfg.cursor, repoRoot: cfg.repoRoot } },
  cfg.repoRoot,
  (gameId, ev) => mindHub.emit(gameId, ev),
);

const providerPreview = createAsyncProvider(cfg.agentMode, {
  llm: cfg.llm,
  cursor: { ...cfg.cursor, repoRoot: cfg.repoRoot },
});

function metaHint(): string {
  switch (cfg.agentMode) {
    case 'cursor':
      return '每一纪元由 Cursor Agent 亲自决策（全自动）';
    case 'practice':
      return '直接点「下一回合」即可看到居民抢单、赚钱。想接 Cursor 时在 .env 配置 CURSOR_API_KEY';
    case 'handoff':
      return cfg.cursor.configured
        ? '点「下一回合」可自动召唤 Cursor；或运行 npm run civ:advance'
        : '配置 CURSOR_API_KEY 后，居民将由 Cursor 扮演';
    case 'openai':
    case 'openai-hybrid':
      return '备用：OpenAI 兼容 API';
    default:
      return 'mock 仅用于自动化测试';
  }
}

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: ['http://127.0.0.1:5173', 'http://localhost:5173'],
});

const WEB_URL = 'http://127.0.0.1:5173';

app.get('/', async (_req, reply) => {
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8"/>
  <meta http-equiv="refresh" content="2;url=${WEB_URL}"/>
  <title>AI Civilization — API</title>
  <style>
    body{font-family:Georgia,serif;background:#1a1612;color:#e8dcc8;padding:2rem;max-width:36rem;margin:auto}
    a{color:#c9a227}
    code{background:#0003;padding:.2em .4em;border-radius:4px}
  </style>
</head>
<body>
  <h1>这是「世界引擎」，不是游戏画面</h1>
  <p>你打开的是 API 端口 <strong>3001</strong>。文明界面在：</p>
  <p><a href="${WEB_URL}">${WEB_URL}</a></p>
  <p>若拒绝连接，请在另一个终端执行：<code>npm run dev:web</code><br/>
  或一条命令同时开引擎+界面：<code>npm run dev</code></p>
  <p>API 自检：<a href="/health">/health</a> · <a href="/api/meta">/api/meta</a></p>
</body>
</html>`;
  return reply.type('text/html; charset=utf-8').send(html);
});

app.get('/favicon.ico', async (_req, reply) => reply.code(204).send());

app.get('/health', async () => ({ ok: true }));

app.get('/api/meta', async () => ({
  agentMode: cfg.agentMode,
  playerBrainLabel: playerBrainLabel(cfg.agentMode),
  liveAgentBrain:
    cfg.agentMode === 'cursor' || cfg.agentMode === 'openai' || cfg.agentMode === 'openai-hybrid',
  needsCursorKey: cfg.agentMode === 'handoff' || cfg.agentMode === 'cursor',
  cursorConfigured: cfg.cursor.configured,
  cursorModel: cfg.cursor.configured ? cfg.cursor.model : null,
  cursorTimeoutMs: cfg.cursorTimeoutMs,
  advancePostTimeoutMs: cfg.advancePostTimeoutMs,
  llmConfigured: cfg.llmConfigured,
  llmModel: cfg.llmConfigured ? cfg.llm.model : null,
  httpOnly: true,
  hint: metaHint(),
}));

app.get('/api/active-game', async () => ({
  gameId: (await readActiveGame(cfg.repoRoot)) ?? null,
}));

app.get<{ Params: { id: string } }>('/api/games/:id/mind', async (req, reply) => {
  const session = store.get(req.params.id);
  if (!session) return reply.code(404).send({ error: 'not_found' });

  reply.hijack();
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const { stream } = mindHub.subscribe(req.params.id);
  stream.pipe(reply.raw, { end: false });

  const ping = setInterval(() => {
    if (!reply.raw.writableEnded) reply.raw.write(': ping\n\n');
  }, 25000);

  req.raw.on('close', () => {
    clearInterval(ping);
    stream.destroy();
  });
});

app.post<{ Body: { rounds?: number } }>('/api/games', async (req) => {
  const rounds = req.body?.rounds ?? 30;
  const session = await store.create(rounds);
  return {
    id: session.id,
    state: session.state,
    meta: { agentBrain: cfg.agentMode, gameId: session.id },
  };
});

app.get<{ Params: { id: string } }>('/api/games/:id', async (req, reply) => {
  const session = store.get(req.params.id);
  if (!session) return reply.code(404).send({ error: 'not_found' });
  return {
    id: session.id,
    state: session.state,
    status: session.status,
    totalLlmCalls: session.totalLlmCalls,
    lastTraces: session.lastTraces,
    handoffRequest: session.handoffRequest,
    handoffRequestPath: session.handoffRequestPath,
    meta: { agentBrain: cfg.agentMode },
  };
});

app.post<{
  Params: { id: string };
  Body: { title: string; domain: 'coding' | 'research' | 'design'; reward: number };
}>('/api/games/:id/player-tasks', async (req, reply) => {
  const session = store.addPlayerTask(req.params.id, req.body);
  if (!session) return reply.code(404).send({ error: 'not_found' });
  return { id: session.id, state: session.state };
});

app.patch<{
  Params: { id: string };
  Body: { civilizations: Record<string, RulesPatch> };
}>('/api/games/:id/rules', async (req, reply) => {
  const session = store.updateRules(req.params.id, req.body.civilizations ?? {});
  if (!session) return reply.code(404).send({ error: 'not_found' });
  return { id: session.id, state: session.state };
});

async function respondStepResult(
  reply: { code: (n: number) => { send: (b: unknown) => unknown } },
  result: Awaited<ReturnType<GameStore['step']>>,
) {
  if (!result) return reply.code(404).send({ error: 'not_found' });
  if (result.awaitingCursor) {
    return reply.code(202).send({
      id: result.session.id,
      status: 'awaiting_cursor',
      state: result.session.state,
      handoffRequest: result.session.handoffRequest,
      handoffRequestPath: result.session.handoffRequestPath,
      instruction:
        '在 Cursor 聊天说：「执行 npm run civ:advance」或配置 CURSOR_API_KEY 后直接点下一纪元',
    });
  }
  return {
    id: result.session.id,
    status: result.session.status,
    state: result.session.state,
    totalLlmCalls: result.session.totalLlmCalls,
    lastTraces: result.session.lastTraces,
    meta: { agentBrain: cfg.agentMode },
  };
}

app.post<{ Params: { id: string } }>('/api/games/:id/step', async (req, reply) => {
  const result = await store.step(req.params.id);
  return respondStepResult(reply, result);
});

app.post<{ Params: { id: string } }>('/api/games/:id/advance', async (req, reply) => {
  try {
    const result = await store.advance(req.params.id);
    return respondStepResult(reply, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'advance_failed';
    req.log.error({ err }, 'advance failed');
    return reply.code(500).send({ error: message });
  }
});

app.post<{
  Params: { id: string };
  Body: {
    civilizations: Record<string, import('@ai-civ/simulation').AgentDecision[]>;
    reasoning?: Record<string, string>;
  };
}>('/api/games/:id/handoff', async (req, reply) => {
  const session = store.setHandoffDecisions(req.params.id, {
    civilizations: req.body.civilizations,
    reasoning: req.body.reasoning ?? {},
  });
  if (!session) return reply.code(404).send({ error: 'not_found' });
  return { ok: true, status: session.status };
});

app.post<{ Params: { id: string }; Body: { rounds?: number } }>(
  '/api/games/:id/reset',
  async (req, reply) => {
    const session = await store.reset(req.params.id, req.body?.rounds ?? 30);
    if (!session) return reply.code(404).send({ error: 'not_found' });
    mindHub.clearGame(req.params.id);
    return { id: session.id, state: session.state };
  },
);

await app.listen({ host: cfg.host, port: cfg.port });
console.log(
  `AI Civilization API http://${cfg.host}:${cfg.port}  brain=${cfg.agentMode}  cursor=${cfg.cursor.configured}`,
);
