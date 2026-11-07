import { PassThrough } from 'node:stream';
import type { MindStreamEvent } from './mind-stream.js';

type Client = { id: string; write: (chunk: string) => void; close: () => void };

function sseEncode(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export class MindStreamHub {
  private clients = new Map<string, Set<Client>>();
  private pending = new Map<string, MindStreamEvent[]>();
  private maxPending = 400;

  subscribe(gameId: string): { stream: PassThrough; clientId: string } {
    const clientId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const stream = new PassThrough();

    const client: Client = {
      id: clientId,
      write: (chunk: string) => {
        if (!stream.writableEnded) stream.write(chunk);
      },
      close: () => stream.end(),
    };

    let set = this.clients.get(gameId);
    if (!set) {
      set = new Set();
      this.clients.set(gameId, set);
    }
    set.add(client);

    const backlog = this.pending.get(gameId);
    if (backlog?.length) {
      for (const ev of backlog) {
        client.write(sseEncode('mind', ev));
      }
    }

    stream.on('close', () => {
      const s = this.clients.get(gameId);
      if (!s) return;
      s.delete(client);
      if (s.size === 0) this.clients.delete(gameId);
    });

    return { stream, clientId };
  }

  emit(gameId: string, ev: MindStreamEvent): void {
    const q = this.pending.get(gameId) ?? [];
    q.push(ev);
    if (q.length > this.maxPending) q.splice(0, q.length - this.maxPending);
    this.pending.set(gameId, q);

    const payload = sseEncode('mind', ev);
    const set = this.clients.get(gameId);
    if (!set) return;
    for (const c of set) c.write(payload);
  }

  clearGame(gameId: string): void {
    this.pending.delete(gameId);
  }
}
