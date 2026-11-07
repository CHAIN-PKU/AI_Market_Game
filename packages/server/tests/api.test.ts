import { afterAll, describe, expect, it } from 'vitest';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { GameStore } from '../src/game-store.js';
import { repoRoot, readServerConfig } from '../src/config.js';

describe('game API smoke', () => {
  const cfg = readServerConfig();
  const store = new GameStore('mock', { llm: cfg.llm, cursor: { ...cfg.cursor, repoRoot } }, repoRoot);

  const app = Fastify();
  app.register(cors);

  app.post('/api/games', async () => {
    const s = await store.create(5);
    return { id: s.id, state: s.state };
  });
  app.patch<{ Params: { id: string }; Body: { civilizations: Record<string, { taxRate: number }> } }>(
    '/api/games/:id/rules',
    async (req, reply) => {
      const s = store.updateRules(req.params.id, req.body.civilizations);
      if (!s) return reply.code(404).send({ error: 'not_found' });
      return { state: s.state };
    },
  );
  app.post<{ Params: { id: string } }>('/api/games/:id/advance', async (req, reply) => {
    const r = await store.advance(req.params.id);
    if (!r) return reply.code(404).send({ error: 'not_found' });
    return { state: r.session.state, round: r.session.state.round };
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates game, updates rules, advances one round', async () => {
    await app.ready();
    const create = await app.inject({ method: 'POST', url: '/api/games' });
    const { id, state } = create.json() as { id: string; state: { civilizations: { id: string }[] } };
    const civId = state.civilizations[0]!.id;
    const rules = await app.inject({
      method: 'PATCH',
      url: `/api/games/${id}/rules`,
      payload: { civilizations: { [civId]: { taxRate: 0.3, name: '测试法典' } } },
    });
    expect(rules.statusCode).toBe(200);
    const step = await app.inject({ method: 'POST', url: `/api/games/${id}/advance` });
    expect(step.statusCode).toBe(200);
    const body = step.json() as { round: number };
    expect(body.round).toBe(1);
  });
});
