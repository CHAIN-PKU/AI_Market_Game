import { MockAgentDecisionProvider } from './mock-decision-provider.js';
import type { AsyncAgentDecisionProvider, AgentDecisionTrace } from './async-types.js';
import type { AgentDecision, AgentDecisionContext } from './types.js';
import { agentExpectedQuality, personalGoalFor, successProbabilityFor } from '../market/bidding.js';
import { effectiveAbility } from '../core/skills.js';
import type { AgentState, CivilizationState, MarketTask } from '../core/types.js';

/**
 * Per-agent LLM decisions: one request per resident, all in parallel.
 *
 * Why not one batched request (see `LlmAgentDecisionProvider`): a single prompt
 * makes the model reason as "the civilization", so every resident shares one
 * viewpoint. This provider gives each resident its own view — its own endowment
 * first, the others only as public info — which is what produces genuine
 * bargaining (alliances, defection plots) instead of a collective plan.
 *
 * Discipline kept from the engine contract:
 * - the LLM only proposes intent/price; settlement stays in the engine;
 * - every proposal is validated, and a rejected proposal falls back to the
 *   deterministic mock for THAT agent only (never the whole round).
 */

export interface PerAgentLlmConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens?: number;
  timeoutMs?: number;
  temperature?: number;
}

export type BargainIntent = 'bid' | 'team' | 'watch' | 'betray';

export interface AgentThought {
  agentId: string;
  thinking: string;
  intent: BargainIntent;
  target: string[];
  share: number;
  deposit: number;
  fraction: number;
  confidence: number;
  source: 'llm' | 'fallback';
  /** Why the LLM proposal was rejected, when it was. */
  rejected?: string;
}

export interface PerAgentResult {
  decisions: AgentDecision[];
  traces: AgentDecisionTrace[];
  thoughts: AgentThought[];
  apiCalls: number;
}

const INTENTS: BargainIntent[] = ['bid', 'team', 'watch', 'betray'];

/** Rough cost model, matching the fixture numbers the UI shows. */
export function estimateCost(agent: AgentState, civ: CivilizationState, task: MarketTask): number {
  const abilities = effectiveAbility(
    agent.abilities,
    agent.skills.map((s) => s.skillId),
    civ.sharedSkillIds
  );
  const ability = Math.max(1, abilities[task.requirements.domain]);
  const raw = (task.reward * 0.42 * task.requirements.difficulty) / ability;
  return Math.max(1, Math.round(raw));
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Public trust signal derived from lifetime stats (the engine keeps no single field). */
export function publicTrust(agent: AgentState): number {
  const s = agent.stats;
  const raw = 0.6 + 0.02 * s.tasksCompleted - 0.04 * s.tasksFailed - 0.08 * (s.ringDefections ?? 0);
  return clamp(raw, 0, 1);
}

export class PerAgentLlmProvider implements AsyncAgentDecisionProvider {
  readonly label = 'llm-per-agent';
  apiCalls = 0;
  private fallback = new MockAgentDecisionProvider();

  constructor(private config: PerAgentLlmConfig) {}

  async decideForCivilization(ctx: AgentDecisionContext): Promise<AgentDecision[]> {
    const result = await this.decideWithTrace(ctx);
    return result.decisions;
  }

  async decideWithTrace(ctx: AgentDecisionContext): Promise<PerAgentResult> {
    const civ = ctx.getCivilization(ctx.civilizationId);
    if (!civ) return { decisions: [], traces: [], thoughts: [], apiCalls: 0 };

    const openTasks = ctx.openTaskIds
      .map((id) => ctx.getTask(id))
      .filter((t): t is MarketTask => !!t && t.status === 'open');
    if (openTasks.length === 0) {
      return {
        decisions: civ.agents.map(() => ({ bids: [] })),
        traces: civ.agents.map((a) => ({ agentId: a.id, source: 'mock' as const })),
        thoughts: [],
        apiCalls: 0,
      };
    }

    // Fallback plan is computed once, per agent, so a rejected proposal can be
    // replaced without touching the other residents.
    const fallbackDecisions = this.fallback.decideForCivilization(ctx);

    const settled = await Promise.all(
      civ.agents.map((agent, index) =>
        this.decideForAgent(agent, civ, openTasks).then((candidate) => ({
          agent,
          candidate,
          fallbackDecision: fallbackDecisions[index] ?? { bids: [] },
        }))
      )
    );

    const decisions: AgentDecision[] = [];
    const traces: AgentDecisionTrace[] = [];
    const thoughts: AgentThought[] = [];

    for (const { agent, candidate, fallbackDecision } of settled) {
      const task = openTasks.find((t) => t.id === candidate.taskId) ?? openTasks[0]!;
      const cost = estimateCost(agent, civ, task);
      const bidAmount = Math.round(task.reward * candidate.fraction);
      const rejection = this.validate(candidate, agent, task, cost, civ);

      if (rejection) {
        decisions.push(fallbackDecision);
        traces.push({ agentId: agent.id, source: 'mock', reasoning: candidate.thinking });
        thoughts.push({ ...candidate, source: 'fallback', rejected: rejection });
        continue;
      }

      const wantsBid = candidate.intent === 'bid' || candidate.intent === 'team' || candidate.intent === 'betray';
      decisions.push(
        wantsBid
          ? {
              bids: [
                {
                  taskId: task.id,
                  agentId: agent.id,
                  civilizationId: civ.id,
                  bidAmount,
                  expectedQuality: agentExpectedQuality(agent, civ, task),
                },
              ],
            }
          : { bids: [] }
      );
      traces.push({
        agentId: agent.id,
        source: candidate.source === 'llm' ? 'llm' : 'mock',
        reasoning: candidate.thinking,
      });
      thoughts.push(candidate);
    }

    return { decisions, traces, thoughts, apiCalls: this.apiCalls };
  }

  private validate(
    c: AgentThought & { taskId: string },
    agent: AgentState,
    task: MarketTask,
    cost: number,
    civ: CivilizationState
  ): string | undefined {
    if (!INTENTS.includes(c.intent)) return `unknown intent ${c.intent}`;
    if (!Number.isFinite(c.fraction)) return 'fraction not a number';
    if (!Number.isFinite(c.share)) return 'share not a number';
    if (!Number.isFinite(c.deposit)) return 'deposit not a number';

    const wantsBid = c.intent === 'bid' || c.intent === 'team' || c.intent === 'betray';
    if (!wantsBid) return undefined;

    if (c.fraction < 0.5 || c.fraction > 0.95) return `fraction ${c.fraction} out of 0.5-0.95`;
    const bidAmount = Math.round(task.reward * c.fraction);
    if (bidAmount < cost) return `bid ${bidAmount} below cost ${cost}`;
    if (c.share < 0 || c.share > 1) return `share ${c.share} out of 0-1`;
    // Deposit is a commitment against this round's payout, not the wallet:
    // residents start with 0 gold, so cap it at the bid instead of the balance.
    if (c.deposit < 0 || c.deposit > bidAmount) return `deposit ${c.deposit} out of range`;
    for (const t of c.target) {
      if (t === agent.id) return 'target is self';
      if (!civ.agents.some((a) => a.id === t)) return `unknown target ${t}`;
    }
    if ((c.intent === 'team' || c.intent === 'betray') && c.target.length === 0) {
      return `${c.intent} without target`;
    }
    return undefined;
  }

  private async decideForAgent(
    agent: AgentState,
    civ: CivilizationState,
    tasks: MarketTask[]
  ): Promise<AgentThought & { taskId: string }> {
    const task = tasks[0]!;
    const cost = estimateCost(agent, civ, task);
    const p = successProbabilityFor(agent, civ, task);
    const prompt = this.buildPrompt(agent, civ, task, cost, p);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs ?? 2500);

    try {
      const res = await fetch(`${this.config.baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          temperature: this.config.temperature ?? 0.8,
          max_tokens: this.config.maxTokens ?? 220,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: prompt.system },
            { role: 'user', content: prompt.user },
          ],
        }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const content = body.choices?.[0]?.message?.content;
      if (!content) throw new Error('empty response');
      this.apiCalls += 1;
      const raw = JSON.parse(content) as Record<string, unknown>;

      const target = Array.isArray(raw.target) ? raw.target.map(String) : [];
      return {
        agentId: agent.id,
        thinking: String(raw.thinking ?? '').slice(0, 60),
        intent: (INTENTS.includes(raw.intent as BargainIntent) ? raw.intent : 'watch') as BargainIntent,
        target,
        share: Number(raw.share ?? 0),
        deposit: Number(raw.deposit ?? 0),
        fraction: Number(raw.fraction ?? 0),
        confidence: clamp(Number(raw.confidence ?? 0.5), 0, 1),
        source: 'llm',
        taskId: task.id,
      };
    } catch {
      // Per-agent degradation: this resident falls back, nobody else is affected.
      return {
        agentId: agent.id,
        thinking: '没算准，这轮先按老规矩走。',
        intent: 'watch',
        target: [],
        share: 0,
        deposit: 0,
        fraction: 0,
        confidence: 0,
        source: 'fallback',
        taskId: task.id,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  private buildPrompt(
    agent: AgentState,
    civ: CivilizationState,
    task: MarketTask,
    cost: number,
    p: number,
  ): { system: string; user: string } {
    const abilities = effectiveAbility(
      agent.abilities,
      agent.skills.map((s) => s.skillId),
      civ.sharedSkillIds
    );
    const others = civ.agents
      .filter((a) => a.id !== agent.id)
      .map((a) => {
        const ab = effectiveAbility(
          a.abilities,
          a.skills.map((s) => s.skillId),
          civ.sharedSkillIds
        );
        return `- ${a.id}｜写码${ab.coding}/研究${ab.research}/设计${ab.design}｜声誉${Math.round(
          publicTrust(a) * 100
        )}%｜完成${a.stats.tasksCompleted}失败${a.stats.tasksFailed}｜背叛${a.stats.ringDefections ?? 0}次`;
      })
      .join('\n');

    const system =
      '你是模拟经济里的一个居民，不是助手。只输出 JSON，形如 ' +
      '{"thinking":"40字以内的第一人称盘算","intent":"bid|team|watch|betray",' +
      '"target":["居民id"],"share":0.7,"deposit":0,"fraction":0.78,"confidence":0.6}。' +
      '不许解释规则，不许客套，不许输出 JSON 以外的字。';

    const user = `【你自己】${agent.id}；能力 写码${abilities.coding}/研究${abilities.research}/设计${abilities.design}；
钱包 ${agent.wallet} 金；声誉 ${Math.round(publicTrust(agent) * 100)}%；完成 ${agent.stats.tasksCompleted} 单、失败 ${agent.stats.tasksFailed} 单。

【本轮这一单】${task.title}；领域 ${task.requirements.domain}；奖励 ${task.reward}；难度 ${task.requirements.difficulty}。
你自己算的账：成功率约 ${Math.round(p * 100)}%，预估成本 ${cost} 金，报满净赚约 ${task.reward - cost}（再扣税）。

【其他居民（公开信息）】
${others}

【这场比赛怎么玩】8 个居民抢同一单；不是报价最低就赢，而是「靠不靠谱 × 报价」一起算；报价低于成本必亏；可以做私下的合作与背叛，被背叛方会记账；赚到钱的人可以买技能或训练自己，长期看谁越赚越多、谁变强。
【你现在的位置】钱包 ${agent.wallet} 金；本文明国库 ${civ.treasury} 金；税率 ${Math.round(civ.rules.taxRate * 100)}%；目标是「${personalGoalFor(agent, civ).label}」，所以这一单不只是赚不赚，还要看能不能让你离目标更近。
【判断顺序】先算这单能不能做（成功率、成本）→ 再想拉不拉人、拉谁、给什么条件 → 最后定报价和要不要留后手。
【规则】可拉 1 人组队、分成自定；答应合作后独吞=背叛。

【你选】单干 bid / 结盟 team / 观望 watch / 假意结盟再独吞 betray。`;
    return { system, user };
  }
}
