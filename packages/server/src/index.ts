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
  failed: boolean;
  bid: number | null;
  tax: number | null;
  net: number | null;
  skill: string | null;
  abilityBefore: number | null;
  abilityAfter: number | null;
  walletAfter: number | null;
  incomes: { name: string; net: number }[];
  treasuryAfter: number;
  teams?: number;
  rings?: number;
  reports?: number;
  defections?: number;
  bids?: number;
  spread?: number;
};
type CampaignRecord = { campaign: BidDemoCampaign; fixture: DemoFixture; history: RoundHistory[] };

function summarizeFixture(fixture: DemoFixture): RoundHistory {
  const winner = fixture.winner;
  const skill = fixture.skillPurchase[0];
  const paid = new Map<string, number>();
  for (const event of fixture.rawEvents) {
    if (event.kind !== 'tax_collected') continue;
    const payload = (event.payload ?? {}) as Record<string, unknown>;
    const agentId = String(payload.agentId ?? '');
    const net = Number(payload.net ?? 0);
    if (agentId) paid.set(agentId, (paid.get(agentId) ?? 0) + net);
  }
  const incomes = fixture.agents.map((agent) => ({
    name: agent.displayName,
    net: paid.get(agent.id) ?? 0,
  }));
  return {
    round: fixture.demoRound,
    domain: fixture.scenario.domain,
    title: fixture.scenario.title,
    winner: winner?.displayName ?? null,
    failed: winner?.failed ?? false,
    bid: winner?.bidAmount ?? null,
    tax: fixture.settlement?.tax ?? null,
    net: fixture.settlement?.net ?? null,
    skill: skill?.name ?? null,
    abilityBefore: skill?.abilityBefore ?? fixture.nextRound.abilityBefore ?? null,
    abilityAfter: skill?.abilityAfter ?? fixture.nextRound.abilityAfter ?? null,
    walletAfter: fixture.settlement?.walletAfter ?? null,
    incomes,
    treasuryAfter: fixture.civilization.treasuryAfter,
    teams: fixture.bids.filter((b) => (b.teamAgentIds?.length ?? 0) > 1).length,
    rings: fixture.bids.filter((b) => (b.ringAgentIds?.length ?? 0) > 1).length,
    reports: fixture.rawEvents.filter((e) => e.kind === 'ring_reported').length,
    defections: fixture.rawEvents.filter((e) => e.kind === 'ring_defected').length,
    bids: fixture.bids.length,
    spread: fixture.bids.length
      ? Math.max(...fixture.bids.map((b) => b.bidAmount)) - Math.min(...fixture.bids.map((b) => b.bidAmount))
      : 0,
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
      marketDepth: true,
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

type DemoCreateBody = {
  demo?: boolean;
  seed?: number;
  maxRounds?: number;
  tasksPerRound?: number;
  initialAbility?: number;
  rules?: RulesPatch;
};

function startDemoCampaign(body: DemoCreateBody) {
  const maxRounds = Math.min(10, Math.max(1, Math.round(body.maxRounds ?? 5)));
  const campaign = createBidDemoCampaign({
    seed: body.seed,
    tasksPerRound: body.tasksPerRound ?? 2,
    initialAbility: body.initialAbility ?? 28,
    rules: body.rules,
    maxRounds,
    marketDepth: true,
  });
  const { fixture } = advanceBidDemoCampaign(campaign);
  const id = randomUUID();
  const record: CampaignRecord = { campaign, fixture, history: [summarizeFixture(fixture)] };
  campaigns.set(id, record);
  saveCampaign(id, record);
  return { id, record };
}

function demoGamePayload(id: string, record: CampaignRecord, status = 'running') {
  return {
    id,
    state: record.campaign.state,
    fixture: record.fixture,
    campaign: { ...campaignMeta(record.campaign), history: record.history },
    status,
    meta: { agentBrain: 'deterministic-mock', mode: 'demo' as const },
  };
}

function advanceDemoCampaign(id: string, record: CampaignRecord) {
  const { campaign } = record;
  if (campaign.completedRounds >= campaign.maxRounds) return null;
  const { fixture } = advanceBidDemoCampaign(campaign);
  record.fixture = fixture;
  record.history.push(summarizeFixture(fixture));
  saveCampaign(id, record);
  return demoGamePayload(id, record);
}

function gini(values: number[]): number {
  const clean = values.filter((v) => Number.isFinite(v) && v >= 0).sort((a, b) => a - b);
  const n = clean.length;
  if (!n || clean[n - 1] === 0) return 0;
  let sum = 0;
  for (let i = 0; i < n; i += 1) sum += (2 * (i + 1) - n - 1) * clean[i]!;
  return Math.round((sum / (n * clean.reduce((a, b) => a + b, 0))) * 1000) / 1000;
}

type ExperimentStats = {
  rounds: number;
  wins: number;
  totalNet: number;
  totalTax: number;
  avgWinningBid: number;
  teamBids: number;
  ringBids: number;
  reports: number;
  defections: number;
  skills: number;
  treasuryEnd: number;
  gini: number;
  uniqueWinners: number;
  finalWallets: number[];
};

function aggregateExperiment(
  fixtures: ReturnType<typeof advanceBidDemoCampaign>['fixture'][],
): ExperimentStats {
  const bids = fixtures.flatMap((f) => f.bids);
  const last = fixtures[fixtures.length - 1];
  const wallets = last ? last.agents.map((a) => a.walletAfter) : [];
  return {
    rounds: fixtures.length,
    wins: fixtures.filter((f) => !!f.winner).length,
    totalNet: fixtures.reduce((sum, f) => sum + (f.settlement?.net ?? 0), 0),
    totalTax: fixtures.reduce((sum, f) => sum + (f.settlement?.tax ?? 0), 0),
    avgWinningBid: fixtures.length
      ? Math.round(fixtures.reduce((sum, f) => sum + (f.winner?.bidAmount ?? 0), 0) / fixtures.length)
      : 0,
    teamBids: bids.filter((b) => (b.teamAgentIds?.length ?? 0) > 1).length,
    ringBids: bids.filter((b) => (b.ringAgentIds?.length ?? 0) > 1).length,
    reports: fixtures.flatMap((f) => f.rawEvents).filter((e) => e.kind === 'ring_reported').length,
    defections: fixtures.flatMap((f) => f.rawEvents).filter((e) => e.kind === 'ring_defected').length,
    skills: fixtures.reduce((sum, f) => sum + f.skillPurchase.length, 0),
    treasuryEnd: last?.civilization.treasuryAfter ?? 0,
    gini: gini(wallets),
    uniqueWinners: new Set(fixtures.map((f) => f.winner?.agentId).filter(Boolean)).size,
    finalWallets: wallets,
  };
}

function runExperiment(input: {
  seed?: number;
  maxRounds?: number;
  rulesA?: RulesPatch;
  rulesB?: RulesPatch;
}) {
  const seed = Math.round(input.seed ?? 1);
  const maxRounds = Math.min(10, Math.max(1, Math.round(input.maxRounds ?? 5)));
  const sides = [
    { key: 'a' as const, rules: input.rulesA },
    { key: 'b' as const, rules: input.rulesB },
  ];
  const out: Record<string, unknown> = { seed, maxRounds };
  for (const side of sides) {
    const campaign = createBidDemoCampaign({
      seed,
      maxRounds,
      tasksPerRound: 2,
      initialAbility: 28,
      rules: side.rules,
      marketDepth: true,
    });
    const fixtures: ReturnType<typeof advanceBidDemoCampaign>['fixture'][] = [];
    for (let i = 0; i < maxRounds; i += 1) {
      fixtures.push(advanceBidDemoCampaign(campaign).fixture);
    }
    out[side.key] = {
      rules: campaign.rules,
      stats: aggregateExperiment(fixtures),
    };
  }
  return out;
}

app.post<{
  Body: { seed?: number; maxRounds?: number; rulesA?: RulesPatch; rulesB?: RulesPatch };
}>('/api/experiment', async (req) => runExperiment(req.body ?? {}));

app.post<{
  Body: {
    seed?: number;
    maxRounds?: number;
    tasksPerRound?: number;
    initialAbility?: number;
    rules?: RulesPatch;
  };
}>('/api/campaign', async (req) => {
  const { id, record } = startDemoCampaign(req.body ?? {});
  return {
    id,
    fixture: record.fixture,
    campaign: { ...campaignMeta(record.campaign), history: record.history },
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

app.post<{ Body: DemoCreateBody & { rounds?: number } }>('/api/games', async (req) => {
  const body = req.body ?? {};
  if (body.demo) {
    const { id, record } = startDemoCampaign(body);
    return demoGamePayload(id, record);
  }
  const rounds = body.rounds ?? 30;
  const session = await store.create(rounds);
  return {
    id: session.id,
    state: session.state,
    meta: { agentBrain: cfg.agentMode, gameId: session.id },
  };
});

app.get<{ Params: { id: string } }>('/api/games/:id', async (req, reply) => {
  const demo = getCampaign(req.params.id);
  if (demo) return demoGamePayload(req.params.id, demo);
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
  const demo = getCampaign(req.params.id);
  if (demo) {
    const payload = advanceDemoCampaign(req.params.id, demo);
    if (!payload) return reply.code(409).send({ error: 'campaign_finished' });
    return payload;
  }
  const result = await store.step(req.params.id);
  return respondStepResult(reply, result);
});

app.post<{ Params: { id: string } }>('/api/games/:id/advance', async (req, reply) => {
  const demo = getCampaign(req.params.id);
  if (demo) {
    const payload = advanceDemoCampaign(req.params.id, demo);
    if (!payload) {
      return reply.code(409).send({ error: 'campaign_finished', campaign: { ...campaignMeta(demo.campaign), history: demo.history } });
    }
    return payload;
  }
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
