import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDualCivilizationGame } from '../src/core/factory.js';
import { LlmAgentDecisionProvider } from '../src/agents/llm-agent-decision-provider.js';
import { buildDecisionContext } from '../src/core/engine-internals.js';
import { createRng } from '../src/core/rng.js';
import { generateTasksForRound } from '../src/market/task-generator.js';

describe('LlmAgentDecisionProvider', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('parses OpenAI JSON and produces valid bids', async () => {
    const state = createDualCivilizationGame({ totalRounds: 5, seed: 1 });
    state.round = 1;
    const rng = createRng(1);
    const tasks = generateTasksForRound(state, rng);
    state.marketTasks.push(...tasks);
    const openTaskIds = tasks.map((t) => t.id);
    const agentId = state.civilizations[0]!.agents[0]!.id;

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  agents: [
                    {
                      agentId,
                      taskIds: [openTaskIds[0]],
                      bidFraction: 0.7,
                      reasoning: 'Good fit for my skills',
                    },
                  ],
                }),
              },
            },
          ],
        }),
      }),
    );

    const provider = new LlmAgentDecisionProvider({
      apiKey: 'test-key',
      baseUrl: 'https://example.com/v1',
      model: 'test-model',
    });

    const ctx = buildDecisionContext(state, 'civ-a', openTaskIds, rng);
    const result = await provider.decideWithTrace(ctx);
    expect(result.apiCalls).toBe(1);
    expect(result.decisions[0]!.bids.length).toBeGreaterThan(0);
    expect(result.traces[0]?.reasoning).toContain('skills');
  });
});
