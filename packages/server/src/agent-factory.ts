import type { AsyncAgentDecisionProvider } from '@ai-civ/simulation';
import {
  HybridAsyncAgentDecisionProvider,
  LlmAgentDecisionProvider,
  MockAsyncAgentDecisionProvider,
} from '@ai-civ/simulation';
import type { AgentMode } from './config.js';
import {
  CursorAsyncAgentDecisionProvider,
  type CursorProviderHooks,
} from './providers/cursor-async-provider.js';

export function createAsyncProvider(
  mode: AgentMode,
  options: {
    llm: { apiKey: string; baseUrl: string; model: string };
    cursor: {
      apiKey: string;
      model: string;
      repoRoot: string;
      onStreamChunk?: (text: string, civilizationId: string) => void;
    };
    cursorHooks?: CursorProviderHooks;
  },
): AsyncAgentDecisionProvider {
  if (mode === 'mock' || mode === 'practice') {
    return new MockAsyncAgentDecisionProvider();
  }
  if (mode === 'cursor') {
    const cfg = {
      apiKey: options.cursor.apiKey,
      model: options.cursor.model,
      repoRoot: options.cursor.repoRoot,
      onStreamChunk: options.cursor.onStreamChunk,
    };
    return new CursorAsyncAgentDecisionProvider(cfg, options.cursorHooks);
  }
  const llmProvider = new LlmAgentDecisionProvider({
    apiKey: options.llm.apiKey,
    baseUrl: options.llm.baseUrl,
    model: options.llm.model,
  });
  if (mode === 'openai') {
    return llmProvider;
  }
  if (mode === 'openai-hybrid') {
    return new HybridAsyncAgentDecisionProvider(llmProvider, { llmAgentCountPerCiv: 2 });
  }
  return new MockAsyncAgentDecisionProvider();
}
