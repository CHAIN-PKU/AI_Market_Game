export type MindStreamEvent =
  | { kind: 'round_start'; round: number }
  | { kind: 'civ_phase'; civilizationId: string; label: string }
  | { kind: 'text'; civilizationId: string; text: string }
  | { kind: 'civ_done'; civilizationId: string; ok: boolean; error?: string }
  | { kind: 'round_done'; round: number }
  | { kind: 'error'; message: string };
