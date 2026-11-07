import type { AgentDecision } from '@ai-civ/simulation';

export function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence?.[1]) return JSON.parse(fence[1].trim());
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error('No JSON object in agent output');
  }
}

export function mapToAgentDecisions(
  json: unknown,
  agentIds: string[],
  civilizationId: string,
): AgentDecision[] {
  const rows = normalizeRows(json);
  return agentIds.map((agentId) => {
    const row = rows.find((r) => r.agentId === agentId);
    const bids = (row?.taskIds ?? []).slice(0, 2).map((taskId) => ({
      taskId,
      agentId,
      civilizationId,
      bidAmount: Math.max(1, Math.round(row?.bidAmount ?? 80)),
      expectedQuality: 0.5,
    }));
    return { bids };
  });
}

function normalizeRows(json: unknown): {
  agentId: string;
  taskIds?: string[];
  bidAmount?: number;
  reasoning?: string;
}[] {
  if (!json || typeof json !== 'object') return [];
  const o = json as Record<string, unknown>;
  if (Array.isArray(o.agents)) {
    return o.agents as { agentId: string; taskIds?: string[]; bidAmount?: number; reasoning?: string }[];
  }
  return [];
}

export function reasoningByAgent(json: unknown): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of normalizeRows(json)) {
    if (row.reasoning) map.set(row.agentId, row.reasoning);
  }
  return map;
}
