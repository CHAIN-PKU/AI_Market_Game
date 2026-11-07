# MVP Skeleton Implementation Plan

> **Goal:** Stand up `D:\AICivilization` monorepo with a headless, reproducible dual-civilization economic loop (Mock agents, no API).

**Architecture:** npm workspaces; all game truth in `@ai-civ/simulation`; server/web stubs for later phases.

**Tech Stack:** TypeScript, Vitest, tsx CLI; later Fastify, SQLite, React, PixiJS 8.

---

## Completed in this session

- [x] Root workspace + simulation package
- [x] Core types, factory, skills catalog
- [x] Task market, bidding, settlement, mock decisions
- [x] `runSimulation` / CLI `sim:dual`
- [x] Vitest invariants + institution smoke test
- [x] README, ARCHITECTURE, GAME_DESIGN, ROADMAP

## Next worker tasks

- [ ] Phase 1 engine depth (collaboration, market phases)
- [ ] Export JSON snapshot for UI
- [ ] Fastify game session API

**REQUIRED SUB-SKILL for follow-up:** superpowers:subagent-driven-development or executing-plans.
