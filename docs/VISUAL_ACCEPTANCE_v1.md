# Visual acceptance v1 — `/play-3d`（feat/visual-cozy-hud）

Scope: **static cozy island + HUD shell only**. No bid theater, skill shop loop, or Event Playback in this milestone.

## Prerequisites

1. Repo: `D:\AICivilization`
2. Branch: `feat/visual-cozy-hud`
3. Terminal: `npm run dev` (API `3001` + Vite `5173`)
4. Browser: Chromium or Edge, window **1920×1080** (or full screen + note resolution)

## Open

- http://127.0.0.1:5173/play-3d

Backend must be up; if you see the red API error banner, start `npm run dev` from repo root and click **重试**.

## Player checklist (human)

| # | What to check | Pass criteria |
|---|----------------|---------------|
| 1 | First impression | Warm page (`#F8F3E8` feel), sky + island readable in one view without extreme zoom |
| 2 | Island layout | Green disk, plaza ring, water ring, a few trees; buildings + **8** agents on the plaza arc |
| 3 | Buildings | Market / skill / job sites distinguishable by silhouette (awning, sign, dome, etc.) **without** relying only on labels |
| 4 | Agents | Chibi bodies, face dots, cozy palette; selected agent shows ground ring |
| 5 | Camera | Orbit works; polar angle capped (no under-island flip); distance limits feel snug |
| 6 | HUD | Top bar: gold, round, headcount; left rail (🏝️ active); bottom **下一轮** disabled + helper text; **no** empty right column before click |
| 7 | Click agent | Right panel opens: display name, job in 写程序/做研究/做设计, mood quote, wallet/skills — **no** raw agent IDs or dev jargon |
| 8 | Click building | Building name + short flavor text; public R&D shows pool if applicable |
| 9 | Close panel | **收起** → canvas goes full width again |
| 10 | Classic fallback | Link **Classic UI** still works for advancing rounds |

## Screenshots to capture (for product sign-off)

Save under `docs/screenshots/visual-v1/` (create folder locally; optional commit):

1. **full** — default camera, whole island + HUD
2. **top-down** — orbit above, plaza + agents visible
3. **agent** — zoom on one resident (e.g. Helix) with detail panel open

Do **not** claim screenshots for live bidding or skill purchase until Playback phase.

## GPT / offline reviewer (no localhost)

Reviewer can use:

- This file + `docs/CURRENT_STATUS.md` + branch diff on `packages/web/src/play3d/*` and `index.css` play3d block
- User-attached screenshots from the three angles above
- Confirm: cozy tokens in CSS; `Play3DPage` hides detail until selection; `AgentDetailPanel` returns `null` when empty; `IslandEnvironment` + `CivilizationScene` Sky/fog/camera limits present

## Out of scope (explicit)

- Event Playback, per-agent bid animation, market escrow UI
- GLB art pack (Kenney/Quaternius) — procedural placeholder only
- Advancing rounds from `/play-3d` dock

## Commands

```powershell
cd D:\AICivilization
git checkout feat/visual-cozy-hud
npm run dev
```

Smoke (optional):

```powershell
npm test
```
