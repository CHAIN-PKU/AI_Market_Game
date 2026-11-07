import type { GameEventKind, GameState } from './types.js';

export function pushEvent(
  state: GameState,
  kind: GameEventKind,
  message: string,
  payload?: Record<string, unknown>,
): void {
  state.events.push({
    id: `evt-${state.events.length + 1}`,
    round: state.round,
    kind,
    message,
    payload,
  });
}
