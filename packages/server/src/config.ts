import { config as loadEnv } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
loadEnv({ path: resolve(repoRoot, '.env') });
loadEnv();

/** mock = 仅 vitest；practice = 玩家默认，内置居民自动抢单 */
export type AgentMode = 'cursor' | 'handoff' | 'openai' | 'openai-hybrid' | 'mock' | 'practice';

export function resolveAgentMode(): AgentMode {
  const explicit = process.env.AI_CIV_AGENT_MODE?.trim() as AgentMode | undefined;
  const cursorKey = process.env.CURSOR_API_KEY?.trim() ?? '';
  const openaiKey = process.env.OPENAI_API_KEY?.trim() ?? '';

  if (explicit) {
    if (explicit === 'mock') return 'mock';
    if (explicit === 'practice') return 'practice';
    if (explicit === 'cursor' && cursorKey) return 'cursor';
    if (explicit === 'handoff') return 'handoff';
    if (explicit === 'openai' && openaiKey) return 'openai';
    if (explicit === 'openai-hybrid' && openaiKey) return 'openai-hybrid';
    if (explicit === ('llm' as AgentMode) && openaiKey) return 'openai';
    if (explicit === ('hybrid' as AgentMode) && openaiKey) return 'openai-hybrid';
    if (explicit === 'cursor' && !cursorKey) return 'practice';
  }

  if (cursorKey) return 'cursor';
  if (openaiKey) return 'openai-hybrid';
  return 'practice';
}

export function readServerConfig() {
  const cursorApiKey = process.env.CURSOR_API_KEY?.trim() ?? '';
  const openaiKey = process.env.OPENAI_API_KEY?.trim() ?? '';
  const agentMode = resolveAgentMode();
  const cursorTimeoutMs = Number(process.env.AI_CIV_CURSOR_TIMEOUT_MS ?? 120_000);
  const advancePostBufferMs = Number(process.env.AI_CIV_ADVANCE_POST_BUFFER_MS ?? 30_000);
  /** Match simulation: two civilizations per game; Cursor runs one agent call per civ in parallel. */
  const civilizationsCount = 2;
  const advancePostTimeoutMs =
    agentMode === 'cursor' && cursorApiKey.length > 0
      ? Math.min(3_600_000, cursorTimeoutMs * civilizationsCount + advancePostBufferMs)
      : 300_000;

  return {
    host: process.env.HOST ?? '127.0.0.1',
    port: Number(process.env.PORT ?? 3001),
    agentMode,
    repoRoot,
    cursorTimeoutMs,
    advancePostTimeoutMs,
    cursor: {
      apiKey: cursorApiKey,
      model: process.env.AI_CIV_CURSOR_MODEL ?? 'composer-2.5',
      configured: cursorApiKey.length > 0,
    },
    llm: {
      apiKey: openaiKey,
      baseUrl: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
      model: process.env.AI_CIV_LLM_MODEL ?? 'gpt-4o-mini',
    },
    llmConfigured: openaiKey.length > 0,
  };
}

export function playerBrainLabel(mode: AgentMode): string {
  switch (mode) {
    case 'practice':
      return '练习模式（内置居民，无需密钥）';
    case 'cursor':
      return 'Cursor 居民（真实 Agent 决策）';
    case 'handoff':
      return 'Cursor 手动（需 npm run civ:advance）';
    case 'openai':
    case 'openai-hybrid':
      return 'OpenAI 兼容 API';
    default:
      return '测试用';
  }
}
