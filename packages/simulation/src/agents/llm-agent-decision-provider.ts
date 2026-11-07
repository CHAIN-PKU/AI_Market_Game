import { MockAgentDecisionProvider } from './mock-decision-provider.js';
import type { AsyncAgentDecisionProvider, AgentDecisionTrace } from './async-types.js';
import type { AgentDecision, AgentDecisionContext } from './types.js';
import { agentExpectedQuality } from '../market/bidding.js';
import type { MarketTask } from '../core/types.js';

export interface LlmAgentConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens?: number;
}

export interface LlmProviderResult {
  decisions: AgentDecision[];
  traces: AgentDecisionTrace[];
  apiCalls: number;
}

/** OpenAI-compatible chat — one request per civilization per round. */
export class LlmAgentDecisionProvider implements AsyncAgentDecisionProvider {
  readonly label = 'llm';
  private fallback = new MockAgentDecisionProvider();
  apiCalls = 0;

  constructor(private config: LlmAgentConfig) {}

  async decideForCivilization(ctx: AgentDecisionContext): Promise<AgentDecision[]> {
    const result = await this.decideWithTrace(ctx);
    return result.decisions;
  }

  async decideWithTrace(ctx: AgentDecisionContext): Promise<LlmProviderResult> {
    const civ = ctx.getCivilization(ctx.civilizationId);
    if (!civ) {
      return { decisions: [], traces: [], apiCalls: 0 };
    }

    const tasks = ctx.openTaskIds
      .map((id) => ctx.getTask(id))
      .filter((t): t is MarketTask => !!t && t.status === 'open');

    if (tasks.length === 0) {
      const empty = civ.agents.map(() => ({ bids: [] }));
      return {
        decisions: empty,
        traces: civ.agents.map((a) => ({ agentId: a.id, source: 'mock' as const })),
        apiCalls: 0,
      };
    }

    try {
      const parsed = await this.callLlm(civ.agents.map((a) => a.id), tasks, ctx);
      this.apiCalls += 1;
      const decisions = civ.agents.map((agent) => {
        const row = parsed.find((p) => p.agentId === agent.id);
        const bids = (row?.taskIds ?? [])
          .slice(0, 2)
          .map((taskId) => {
            const task = tasks.find((t) => t.id === taskId);
            if (!task) return undefined;
            const fraction = row?.bidFraction ?? 0.8;
            const bidAmount = Math.min(
              task.reward,
              Math.max(1, Math.round(task.reward * fraction)),
            );
            return {
              taskId,
              agentId: agent.id,
              civilizationId: civ.id,
              bidAmount,
              expectedQuality: agentExpectedQuality(agent, civ, task),
            };
          })
          .filter((b): b is NonNullable<typeof b> => !!b);
        return { bids };
      });

      const traces: AgentDecisionTrace[] = civ.agents.map((agent) => {
        const row = parsed.find((p) => p.agentId === agent.id);
        return {
          agentId: agent.id,
          source: 'llm',
          reasoning: row?.reasoning,
        };
      });

      return { decisions, traces, apiCalls: 1 };
    } catch {
      const decisions = this.fallback.decideForCivilization(ctx);
      return {
        decisions,
        traces: civ.agents.map((a) => ({ agentId: a.id, source: 'mock' })),
        apiCalls: 0,
      };
    }
  }

  private async callLlm(
    agentIds: string[],
    tasks: MarketTask[],
    ctx: AgentDecisionContext,
  ): Promise<{ agentId: string; taskIds: string[]; bidFraction?: number; reasoning?: string }[]> {
    const taskLines = tasks
      .map(
        (t) =>
          `- id=${t.id} domain=${t.requirements.domain} reward=${t.reward} difficulty=${t.requirements.difficulty}`,
      )
      .join('\n');

    const system = `You are the collective strategist for one civilization in an economic simulation.
Return ONLY valid JSON: {"agents":[{"agentId":"...","taskIds":["task-id",...],"bidFraction":0.75,"reasoning":"one short sentence"}]}
Rules: each agent picks 0-2 task ids from the list; bidFraction is 0.5-0.95 of reward; stay in character as workers seeking profit.`;

    const user = `Round ${ctx.round}. Civilization ${ctx.civilizationId}.
Agents: ${agentIds.join(', ')}
Open tasks:
${taskLines}`;

    const url = `${this.config.baseUrl.replace(/\/$/, '')}/chat/completions`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        temperature: 0.7,
        max_tokens: this.config.maxTokens ?? 1200,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });

    if (!res.ok) {
      throw new Error(`LLM HTTP ${res.status}`);
    }

    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = body.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty LLM response');

    const json = JSON.parse(content) as {
      agents?: {
        agentId: string;
        taskIds?: string[];
        bidFraction?: number;
        reasoning?: string;
      }[];
    };

    return (json.agents ?? []).map((a) => ({
      agentId: a.agentId,
      taskIds: a.taskIds ?? [],
      bidFraction: a.bidFraction,
      reasoning: a.reasoning,
    }));
  }
}
