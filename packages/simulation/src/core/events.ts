import type { GameEventKind, GameState } from './types.js';

let eventCounter = 0;

export function resetEventCounter(): void {
  eventCounter = 0;
}

export function pushEvent(
  state: GameState,
  kind: GameEventKind,
  message: string,
  payload?: Record<string, unknown>,
): void {
  eventCounter += 1;
  state.events.push({
    id: `evt-${eventCounter}`,
    round: state.round,
    kind,
    message,
    payload,
  });
}
