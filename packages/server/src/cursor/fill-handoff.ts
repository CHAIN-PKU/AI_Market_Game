import type { GameState } from '@ai-civ/simulation';
import { buildDecisionContext, createRng } from '@ai-civ/simulation';
import type { HandoffDecisionBundle } from '../game-store.js';
import { decideCivilizationWithCursor, type CursorBrainConfig } from './cursor-sdk-brain.js';
import type { HandoffRequestPayload } from './handoff-payload.js';

export async function buildHandoffBundleViaCursor(
  state: GameState,
  handoff: HandoffRequestPayload,
  cursor: CursorBrainConfig,
): Promise<HandoffDecisionBundle> {
  const rng = createRng(state.rngState);
  const openTaskIds = handoff.openTasks.map((t) => t.id);
  const civilizations: HandoffDecisionBundle['civilizations'] = {};
  const reasoning: Record<string, string> = {};

  for (const civSummary of handoff.civilizations) {
    const ctx = buildDecisionContext(state, civSummary.id, openTaskIds, rng);
    const result = await decideCivilizationWithCursor(ctx, cursor);
    civilizations[civSummary.id] = result.decisions;
    for (const t of result.traces) {
      if (t.reasoning) reasoning[t.agentId] = t.reasoning;
    }
  }

  return { civilizations, reasoning };
}
