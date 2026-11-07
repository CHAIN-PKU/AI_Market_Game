import Fastify from 'fastify';
import fs from 'node:fs';
import path from 'node:path';
import cors from '@fastify/cors';
import {
  advanceBidDemoCampaign,
  buildBidDemoFixture,
  createBidDemoCampaign,
  type BidDemoCampaign,
  type RulesPatch,
} from '@ai-civ/simulation';
import { randomUUID } from 'node:crypto';
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
  origin: ['http://127.0.0.1:5173', 'http://localhost:5173', 'http://127.0.0.1:5180', 'http://localhost:5180'],
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

type DemoFixture = ReturnType<typeof buildBidDemoFixture>;
type RoundHistory = {
  round: number;
  domain: string;
  title: string;
  winner: string | null;
  bid: number | null;
  tax: number | null;
  net: number | null;
  skill: string | null;
  treasuryAfter: number;
};
type CampaignRecord = { campaign: BidDemoCampaign; fixture: DemoFixture; history: RoundHistory[] };

function summarizeFixture(fixture: DemoFixture): RoundHistory {
  const winner = fixture.winner;
  const skill = fixture.skillPurchase[0];
  return {
    round: fixture.demoRound,
    domain: fixture.scenario.domain,
    title: fixture.scenario.title,
    winner: winner?.displayName ?? null,
    bid: winner?.bidAmount ?? null,
    tax: fixture.settlement?.tax ?? null,
    net: fixture.settlement?.net ?? null,
    skill: skill?.name ?? null,
    treasuryAfter: fixture.civilization.treasuryAfter,
  };
}

const campaigns = new Map<string, CampaignRecord>();
const CAMPAIGN_DIR = path.join(cfg.repoRoot, 'runtime', 'campaigns');

function saveCampaign(id: string, record: CampaignRecord): void {
  try {
    fs.mkdirSync(CAMPAIGN_DIR, { recursive: true });
    const c = record.campaign;
    const data = {
      state: c.state,
      scenario: c.scenario,
      seed: c.seed,
      tasksPerRound: c.tasksPerRound,
      initialAbility: c.initialAbility,
      rules: c.rules,
      scenarios: c.scenarios,
      maxRounds: c.maxRounds,
      completedRounds: c.completedRounds,
      lastFixture: record.fixture,
      history: record.history,
    };
    fs.writeFileSync(path.join(CAMPAIGN_DIR, `${id}.json`), JSON.stringify(data));
  } catch (err) {
    console.error('failed to persist campaign', id, err);
  }
}

function loadCampaign(id: string): CampaignRecord | null {
  try {
    const file = path.join(CAMPAIGN_DIR, `${id}.json`);
    if (!fs.existsSync(file)) return null;
    const data = JSON.parse(fs.readFileSync(file, 'utf8')) as {
      state: BidDemoCampaign['state'];
      scenario: BidDemoCampaign['scenario'];
      seed: number;
      tasksPerRound: number;
      initialAbility: number;
      rules: BidDemoCampaign['rules'];
      scenarios?: BidDemoCampaign['scenarios'];
      maxRounds: number;
      completedRounds: number;
      lastFixture: DemoFixture;
      history?: RoundHistory[];
    };
    const civ = data.state.civilizations[0];
    if (!civ) return null;
    const campaign: BidDemoCampaign = {
      state: data.state,
      civ,
      scenario: data.scenario,
      seed: data.seed,
      tasksPerRound: data.tasksPerRound,
      initialAbility: data.initialAbility,
      rules: data.rules,
      scenarios: data.scenarios ?? [data.scenario],
      maxRounds: data.maxRounds,
      completedRounds: data.completedRounds,
    };
    return {
      campaign,
      fixture: data.lastFixture,
      history: data.history ?? [summarizeFixture(data.lastFixture)],
    };
  } catch (err) {
    console.error('failed to load campaign', id, err);
    return null;
  }
}

function getCampaign(id: string): CampaignRecord | null {
  const memory = campaigns.get(id);
  if (memory) return memory;
  const loaded = loadCampaign(id);
  if (loaded) campaigns.set(id, loaded);
  return loaded;
}

function campaignMeta(campaign: BidDemoCampaign) {
  return {
    round: campaign.completedRounds,
    maxRounds: campaign.maxRounds,
    done: campaign.completedRounds >= campaign.maxRounds,
    seed: campaign.seed,
    rules: campaign.rules,
  };
}

app.post<{
  Body: {
    seed?: number;
    maxRounds?: number;
    tasksPerRound?: number;
    initialAbility?: number;
    rules?: RulesPatch;
  };
}>('/api/campaign', async (req) => {
  const body = req.body ?? {};
  const maxRounds = Math.min(10, Math.max(1, Math.round(body.maxRounds ?? 5)));
  const campaign = createBidDemoCampaign({
    seed: body.seed,
    tasksPerRound: body.tasksPerRound ?? 2,
    initialAbility: body.initialAbility ?? 28,
    rules: body.rules,
    maxRounds,
  });
  const { fixture } = advanceBidDemoCampaign(campaign);
  const id = randomUUID();
  const record = { campaign, fixture, history: [summarizeFixture(fixture)] };
  campaigns.set(id, record);
  saveCampaign(id, record);
  return {
    id,
    fixture,
    campaign: { ...campaignMeta(campaign), history: record.history },
    meta: { engine: 'deterministic-mock' },
  };
});

app.post<{ Params: { id: string } }>('/api/campaign/:id/next', async (req, reply) => {
  const record = getCampaign(req.params.id);
  if (!record) return reply.code(404).send({ error: 'not_found' });
  const { campaign } = record;
  if (campaign.completedRounds >= campaign.maxRounds) {
    return reply.code(409).send({ error: 'campaign_finished', campaign: campaignMeta(campaign) });
  }
  const { fixture } = advanceBidDemoCampaign(campaign);
  record.fixture = fixture;
  record.history.push(summarizeFixture(fixture));
  saveCampaign(req.params.id, record);
  return {
    id: req.params.id,
    fixture,
    campaign: { ...campaignMeta(campaign), history: record.history },
    meta: { engine: 'deterministic-mock' },
  };
});

app.get<{ Params: { id: string } }>('/api/campaign/:id', async (req, reply) => {
  const record = getCampaign(req.params.id);
  if (!record) return reply.code(404).send({ error: 'not_found' });
  return {
    id: req.params.id,
    campaign: { ...campaignMeta(record.campaign), history: record.history },
    fixture: record.fixture,
  };
});

app.post<{
  Body: {
    seed?: number;
    tasksPerRound?: number;
    warmupRounds?: number;
    initialAbility?: number;
    rules?: RulesPatch;
  };
}>('/api/demo/round', async (req) => {
  const body = req.body ?? {};
  const fixture = buildBidDemoFixture({
    seed: body.seed,
    tasksPerRound: body.tasksPerRound,
    warmupRounds: body.warmupRounds,
    initialAbility: body.initialAbility,
    rules: body.rules,
  });
  return {
    fixture,
    meta: {
      engine: 'deterministic-mock',
      generator: 'buildBidDemoFixture',
      rules: fixture.civilization.rules,
    },
  };
});

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
