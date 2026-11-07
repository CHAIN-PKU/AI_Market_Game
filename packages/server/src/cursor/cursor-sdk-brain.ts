import type { AgentDecisionContext } from '@ai-civ/simulation';
import type { AgentDecisionTrace } from '@ai-civ/simulation';
import type { AgentDecision } from '@ai-civ/simulation';
import { agentExpectedQuality } from '@ai-civ/simulation';
import type { SDKMessage } from '@cursor/sdk';
import type { RunResult } from '@cursor/sdk';
import { extractJsonObject, mapToAgentDecisions, reasoningByAgent } from './parse-decisions.js';

export interface CursorBrainConfig {
  apiKey: string;
  model: string;
  repoRoot: string;
  /** 流式输出：模型/思考的文本片段（用于前端 SSE） */
  onStreamChunk?: (text: string, civilizationId: string) => void;
}

function textFromSdkMessage(msg: SDKMessage): string[] {
  if (msg.type === 'assistant') {
    const parts: string[] = [];
    for (const block of msg.message.content) {
      if (block.type === 'text' && block.text) parts.push(block.text);
    }
    return parts;
  }
  if (msg.type === 'thinking' && msg.text) {
    return [msg.text];
  }
  return [];
}

export async function decideCivilizationWithCursor(
  ctx: AgentDecisionContext,
  config: CursorBrainConfig,
): Promise<{ decisions: AgentDecision[]; traces: AgentDecisionTrace[]; apiCalls: number }> {
  const civ = ctx.getCivilization(ctx.civilizationId);
  if (!civ) return { decisions: [], traces: [], apiCalls: 0 };

  const tasks = ctx.openTaskIds
    .map((id) => ctx.getTask(id))
    .filter((t): t is NonNullable<ReturnType<typeof ctx.getTask>> => !!t && t.status === 'open');

  if (tasks.length === 0) {
    return {
      decisions: civ.agents.map(() => ({ bids: [] })),
      traces: civ.agents.map((a) => ({ agentId: a.id, source: 'cursor' as const })),
      apiCalls: 0,
    };
  }

  const { Agent } = await import('@cursor/sdk');

  const taskLines = tasks
    .map(
      (t) =>
        `- id=${t.id} title=${t.title} domain=${t.requirements.domain} reward=${t.reward} difficulty=${t.requirements.difficulty}`,
    )
    .join('\n');

  const agentLines = civ.agents
    .map(
      (a) =>
        `- ${a.id} name=${a.displayName} wallet=${a.wallet} coding=${a.abilities.coding} research=${a.abilities.research} design=${a.abilities.design}`,
    )
    .join('\n');

  const prompt = `你是经济模拟游戏「AI Civilization」中文明「${civ.displayName}」的**决策推演官**（不是写代码的助手）。

## 你的任务
先口头推演本文明在本轮如何抢单，再输出**严格 JSON**。推演过程会实时显示给人类玩家，请务必用**中文**，分段写清楚。

## 制度与轮次
- 制度: ${JSON.stringify(civ.rules)}
- 轮次: ${ctx.round}

## 居民（注意能力差异）
${agentLines}

## 开放任务
${taskLines}

## 输出格式（必须严格遵守顺序）
**第一部分 — 推理过程（中文 Markdown，多段）**
先写 3～8 段，每段可以是小标题 + 正文，至少覆盖：
- 任务里谁最该抢哪几单、为什么
- 是否想拉上队友、怎么谈分成 / 是否可能「耍滑」
- 与另一座文明在**共享市集**上竞争的考量

**第二部分 — 机器可读 JSON（仅此一段，放在 \`\`\`json 代码块里）**
\`\`\`json
{"agents":[
  {"agentId":"居民id","taskIds":["任务id"],"bidAmount":数字,"reasoning":"一句俏皮中文台词（角色口吻）"}
]}
\`\`\`

规则：
- 每个居民 0～2 个 taskId；bidAmount 约为任务 reward 的 55%～92%。
- reasoning 字段每人必须不同，并体现该居民的能力与任务领域。
- **除了 \`\`\`json 代码块外不要写其它 JSON**，避免解析失败。

现在开始输出（先写第一部分推理，再写 json 代码块）。`;

  console.info(`[cursor] Agent.create+send start civ=${civ.id} round=${ctx.round} tasks=${tasks.length}`);

  /** 默认 120s：避免无限挂起；流式读完再 wait，与 SDK 文档一致，且不会「wait 先返回但 stream 未关」死锁。 */
  const timeoutMs = Number(process.env.AI_CIV_CURSOR_TIMEOUT_MS ?? 120_000);

  const emit = (text: string) => {
    if (text && config.onStreamChunk) config.onStreamChunk(text, civ.id);
  };

  emit('🔧 正在启动本地 Cursor Agent（首次可能需 30～90 秒，与仓库大小有关）…\n');

  await using sdkAgent = await Agent.create({
    apiKey: config.apiKey,
    model: { id: config.model },
    local: { cwd: config.repoRoot },
  });

  emit('📤 Agent 已创建，正在发送本轮决策 Prompt…\n');

  const run = await sdkAgent.send(prompt);

  emit('⏳ Prompt 已发出，等待模型流式输出（若长时间空白，多半在本地读上下文，不是前端断了）…\n');

  let result: RunResult;
  try {
    result = await Promise.race([
      (async (): Promise<RunResult> => {
        let lastStreamAt = Date.now();
        const heartbeat = setInterval(() => {
          const silentSec = Math.round((Date.now() - lastStreamAt) / 1000);
          if (silentSec >= 25) {
            emit(
              `\n💤 已 ${silentSec}s 没有新字：本地 Agent 可能在索引仓库或工具链静默运行，终端应有 [cursor] 日志…\n`,
            );
            lastStreamAt = Date.now();
          }
        }, 12_000);
        try {
          let chunks = 0;
          for await (const msg of run.stream()) {
            if (msg.type !== 'assistant' && msg.type !== 'thinking') {
              if (chunks === 0) {
                console.info(`[cursor] stream event civ=${civ.id} type=${msg.type}`);
              }
            }
            for (const t of textFromSdkMessage(msg)) {
              chunks += 1;
              lastStreamAt = Date.now();
              if (chunks <= 3) console.info(`[cursor] stream chunk civ=${civ.id} len=${t.length}`);
              emit(t);
            }
          }
        } catch (e) {
          console.error(`[cursor] stream read error civ=${civ.id}`, e);
          emit(`\n❌ 读取流失败：${e instanceof Error ? e.message : String(e)}\n`);
        } finally {
          clearInterval(heartbeat);
        }
        return run.wait();
      })(),
      new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error(`Cursor Agent 超时（${Math.round(timeoutMs / 1000)}s），请重试或检查 Key/网络`)),
          timeoutMs,
        );
      }),
    ]);
  } catch (e) {
    await run.cancel().catch(() => undefined);
    throw e;
  }

  if (result.status === 'error') {
    console.error(`[cursor] Agent.run error civ=${civ.id} round=${ctx.round}`);
    const errMsg = result.error?.message ?? result.id ?? 'unknown';
    throw new Error(`Cursor agent run failed: ${errMsg}`);
  }

  console.info(`[cursor] Agent.run ok civ=${civ.id} round=${ctx.round}`);

  const text = typeof result.result === 'string' ? result.result : JSON.stringify(result.result);
  const json = extractJsonObject(text);
  const agentIds = civ.agents.map((a) => a.id);
  let decisions = mapToAgentDecisions(json, agentIds, civ.id);

  decisions = decisions.map((d, i) => {
    const agent = civ.agents[i];
    if (!agent) return d;
    const bids = d.bids.map((bid) => {
      const task = tasks.find((t) => t.id === bid.taskId);
      if (!task) return bid;
      return {
        ...bid,
        bidAmount: Math.min(task.reward, Math.max(1, bid.bidAmount)),
        expectedQuality: agentExpectedQuality(agent, civ, task),
      };
    });
    return { bids };
  });

  const reasons = reasoningByAgent(json);
  const traces: AgentDecisionTrace[] = civ.agents.map((a) => ({
    agentId: a.id,
    source: 'cursor',
    reasoning: reasons.get(a.id) ?? `${a.displayName}（Cursor 未返回 reasoning 字段）`,
  }));

  return { decisions, traces, apiCalls: 1 };
}
