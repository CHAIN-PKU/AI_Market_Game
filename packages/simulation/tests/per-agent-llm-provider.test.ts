import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDualCivilizationGame } from '../src/core/factory.js';
import { buildDecisionContext } from '../src/core/engine-internals.js';
import { createRng } from '../src/core/rng.js';
import { generateTasksForRound } from '../src/market/task-generator.js';
import { PerAgentLlmProvider, estimateCost } from '../src/agents/per-agent-llm-provider.js';

function stateWithTasks(seed = 1) {
  const state = createDualCivilizationGame({ totalRounds: 5, seed });
  state.round = 1;
  const rng = createRng(seed);
  const tasks = generateTasksForRound(state, rng);
  state.marketTasks.push(...tasks);
  return { state, tasks, rng, openTaskIds: tasks.map((t) => t.id) };
}

function fakeJson(body: unknown) {
  return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify(body) } }] }) };
}

describe('PerAgentLlmProvider', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends one request per agent and keeps each view separate', async () => {
    const { state, rng, openTaskIds } = stateWithTasks();
    const civ = state.civilizations[0]!;
    const taskId = openTaskIds[0];

    const calls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (_url: string, init: { body: string }) => {
        const body = JSON.parse(init.body) as { messages: { content: string }[] };
        const user = body.messages[1]!.content;
        const who = /【你自己】(\S+?)[；;]/.exec(user)?.[1] ?? '?';
        calls.push(who);
        return fakeJson({
          thinking: `${who} 报到：我要抢这单`,
          intent: 'bid',
          target: [],
          share: 0,
          deposit: 0,
          fraction: 0.9,
          confidence: 0.6,
        });
      })
    );

    const provider = new PerAgentLlmProvider({
      apiKey: 'k',
      baseUrl: 'https://example.com/v1',
      model: 'm',
    });
    const ctx = buildDecisionContext(state, 'civ-a', [taskId], rng);
    const result = await provider.decideWithTrace(ctx);

    expect(calls.length).toBe(civ.agents.length);
    expect(new Set(calls).size).toBe(civ.agents.length);
    expect(result.apiCalls).toBe(civ.agents.length);
    expect(result.thoughts.every((t) => t.source === 'llm' || !!t.rejected)).toBe(true);
    // Every resident bid 90% of reward, which clears the cost line, so all bid.
    expect(result.decisions.filter((d) => d.bids.length > 0).length).toBeGreaterThan(0);
  });

  it('falls back for one agent only when its request fails', async () => {
    const { state, rng, openTaskIds } = stateWithTasks(2);
    const civ = state.civilizations[0]!;
    let n = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () => {
        n += 1;
        if (n === 2) throw new Error('timeout');
        return fakeJson({
          thinking: '照常报价',
          intent: 'bid',
          target: [],
          share: 0,
          deposit: 0,
          fraction: 0.88,
          confidence: 0.5,
        });
      })
    );

    const provider = new PerAgentLlmProvider({
      apiKey: 'k',
      baseUrl: 'https://example.com/v1',
      model: 'm',
    });
    const ctx = buildDecisionContext(state, 'civ-a', [openTaskIds[0]!], rng);
    const result = await provider.decideWithTrace(ctx);

    const failed = result.thoughts.filter((t) => t.source === 'fallback');
    // The agent whose request threw gives up immediately; others may still be
    // rejected by validation, but the thrown one is identifiable by its note.
    expect(failed.length).toBeGreaterThanOrEqual(1);
    expect(failed.some((t) => t.thinking.includes('没算准'))).toBe(true);
    expect(result.decisions.length).toBe(civ.agents.length);
    expect(result.thoughts.length).toBe(civ.agents.length);
  });

  it('rejects a bid priced below cost and marks the rejection', async () => {
    const { state, rng, openTaskIds } = stateWithTasks(3);
    const task = state.marketTasks.find((t) => t.id === openTaskIds[0])!;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () =>
        fakeJson({
          thinking: '低价抢单',
          intent: 'bid',
          target: [],
          share: 0,
          deposit: 0,
          fraction: 0.5,
          confidence: 0.9,
        })
      )
    );

    const provider = new PerAgentLlmProvider({
      apiKey: 'k',
      baseUrl: 'https://example.com/v1',
      model: 'm',
    });
    const ctx = buildDecisionContext(state, 'civ-a', [task.id], rng);
    const result = await provider.decideWithTrace(ctx);

    // Expected rejections are computable from the same cost model the provider uses.
    const civ = state.civilizations[0]!;
    const belowCost = civ.agents.filter(
      (a) => Math.round(task.reward * 0.5) < estimateCost(a, civ, task)
    ).length;
    const rejected = result.thoughts.filter((t) => t.rejected);
    expect(rejected.length).toBe(belowCost);
    for (const r of rejected) expect(r.rejected).toContain('below cost');
    expect(result.thoughts.filter((t) => t.source === 'fallback').length).toBe(rejected.length);
  });

  it('estimates cost from ability vs difficulty, matching the fixture scale', () => {
    const { state, openTaskIds } = stateWithTasks();
    const civ = state.civilizations[0]!;
    const task = state.marketTasks.find((t) => t.id === openTaskIds[0])!;
    const agent = civ.agents[0]!;
    const cost = estimateCost(agent, civ, task);
    expect(cost).toBeGreaterThan(0);
    expect(cost).toBeLessThan(task.reward * 2);
  });
});

describe('PerAgentLlmProvider 上下文完整性', () => {
  afterEach(() => vi.restoreAllMocks());

  it('每个角色的提示里都有：比赛规则、自己的处境与目标、其他人的情报、判断顺序', async () => {
    const { state, rng, openTaskIds } = stateWithTasks(5);
    const bodies: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (_u: string, init: { body: string }) => {
        const b = JSON.parse(init.body) as { messages: { content: string }[] };
        bodies.push(b.messages.map((m) => m.content).join('\n'));
        return fakeJson({ thinking: 'x', intent: 'watch', target: [], share: 0, deposit: 0, fraction: 0, confidence: 0.5 });
      })
    );

    const provider = new PerAgentLlmProvider({ apiKey: 'k', baseUrl: 'https://e/v1', model: 'm' });
    await provider.decideWithTrace(buildDecisionContext(state, 'civ-a', [openTaskIds[0]!], rng));

    expect(bodies.length).toBeGreaterThan(0);
    for (const body of bodies) {
      expect(body).toContain('这场比赛怎么玩');
      expect(body).toContain('你现在的位置');
      expect(body).toContain('判断顺序');
      expect(body).toMatch(/目标是「.+」/);
      // 必须能看到其他居民，否则谈不上博弈
      expect(body).toContain('其他居民');
    }
  });
});
