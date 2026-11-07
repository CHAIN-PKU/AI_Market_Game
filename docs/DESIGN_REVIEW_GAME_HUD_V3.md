# Render review — `/game` HUD v3（world-first design pass）

> Date 2026-11-07/08 · branch `feat/visual-cozy-hud` · plan: `docs/DESIGN_PLAN_GAME_HUD_V3.md`
> Evidence: `docs/screenshots/game-hud/` (1920×1080 + 1366×768), `map-only-1920x1080.png`,
> `failure-glb-blocked-1920x1080.png`, `docs/recordings/game-bid-demo-1280x720.mp4`
> Capture: Edge 157 headless + SwiftShader (software WebGL). Video ≈ 2–6 fps; not a performance measurement.

## Verdict

Direction is now legible in one still: island → 市集公告板 → 重点居民决策 → 金币. The world owns the frame;
the board is the single primary action; paper plates and the dock are tools. Remaining generic pressure is
the **Kenney suburban kit** (building silhouettes still do not pass the no-text test) and the **right profile
plate length**. No blocking hierarchy failure found; failure state is now visible and blocking.

## Ten dimensions (1–5, evidence per line)

| # | Dimension | Score | Evidence |
|---|---|---|---|
| 1 | 第一印象像游戏 | 4 | Full-bleed island with the notice board first; no admin frame. `01-idle` |
| 2 | 美术一致 | 3.5 | Paper/wood/coin HUD matches the warm diorama; buildings remain suburban Kenney kit. `map-only` |
| 3 | 空间层次 | 4 | Soil thickness, contact shadows, board physically in the square. `07-assigned` |
| 4 | 可读性 | 3.5 | 12px minimum; 1366 verified; some plate content needs scroll. `1366/01-idle`, `07-assigned` |
| 5 | 交互明确 | 4 | One gold-ish publish action on the board, one teal playback; duplicate CTA removed. `01-idle` |
| 6 | 经济反馈因果 | 4 | Receipt 100/8/92, skill 40→48, odds 35%→55% all from fixture; treasury jumps 1,000→1,032 (round truth includes other tasks) and is not itemised. `09-settled`, `10-skill` |
| 7 | 生动 | 3.5 | Idle/walk, bid lean, stamps; no coin path / skill-card travel yet. `07-assigned` |
| 8 | 性能 | 3 | Software-WebGL capture only; 2048 shadow map, DPR capped 1.6; no low-end toggle. Not measured on GPU. |
| 9 | 稳定 | 3 | 1920 run: only favicon 404. 1366/2D runs: drei Html portal unmount warning; no visual break. `browser-logs.txt` |
| 10 | 吸引力 | 3.5 | Clear loop and personalities; 下一轮 not wired, so the loop stops as a demo. |

Scores are self-review evidence, not product-owner acceptance.

## Findings

```
[P1] Right resident plate runs under the dock at 1080
Evidence: 07-assigned-1920x1080.png (公开履历 clipped at bottom); GameHud.tsx AgentPanel; game.css .g-right max-height
Why it matters: the profile is the evidence for “why did it bid”; losing its last rows weakens the still test.
Fix: collapse 公开履历 into a compact 2×2 strip above 公开决策记录 or cap profile sections; ensure no critical state below the fold.
Verify: 07-assigned shows all profile sections above the dock.
```

```
[P1] Building silhouettes still fail the no-text test
Evidence: map-only-1920x1080.png — seven similar suburban roofs; GameScene BuildingLabel signboards carry the function.
Why it matters: the project’s own acceptance requires identifying market / skill shop / workshop without labels.
Fix: next milestone gives each function one roof/prop in the same material language (open stall + awning, glazed shopfront, server stack, dome, easel, shared flag, terrace).
Verify: hide all text and the market, skill shop and workshop are still identifiable.
```

```
[P1] Treasury jump is not explained at settlement
Evidence: 09-settled-1920x1080.png top strip 1,032; fixture treasuryStart 1,000 / treasuryAfter 1,032 (round includes two other tasks); GamePage.tsx derived.treasury.
Why it matters: the HUD is honest to the engine but the player cannot see why 100−8 did not produce 1,032.
Fix: label the top number as “本轮结算后（含其他任务）” in the settled step, or add a 2-line treasury breakdown in the task plate.
Verify: settled still explains the delta.
```

```
[P2] Agent name tags collide with the board at 1366
Evidence: 1366/01-idle-1366x768.png — back-row tags sit on the board posts.
Why it matters: readability at the secondary width; not blocking at 1920.
Fix: show name tags only for focused/selected residents at ≤1280, keep role color decal at feet.
```

```
[P2] 2D comparison still lives in the debug panel
Evidence: 12-2d-debug-1920x1080.png; DebugPanel view chips.
Why it matters: correct per plan (lab-only), but the board’s three-column layout needs a clearer “lab” label when active.
Fix: add a thin “开发对照视图” banner inside the 2D board; never link it from player chrome.
```

## Working — do not change

- Full-bleed world + floating paper task plate + single dock.
- Notice board as the only publish action; 中标 / 已结算 stamps.
- Gold = money + publish; teal = interaction/selection; coral = tax.
- Focus cards and resident profile wording (personality → decision → factors).
- Blocking failure plate with asset name + 重试 (`failure-glb-blocked`); loading plate.
- Task noun normalized to 任务 on `/game`.

## What I changed after the first draft (Chanel rule)

Removed: persistent left/right admin columns, second gold CTA, top-bar 2.5D/2D toggle from player chrome,
dock tab graveyard (技能铺/制度/下一轮 disabled), uppercase/tracked Han headings, pill-everything resources,
the 8-person roster card. Kept only: task paper, resident paper on demand, one dock, one board.

## Still reads generic / next design pass

1. Kenney suburban roofs — function silhouettes (largest remaining gap).
2. Coin path / skill-card travel not implemented; motion still mostly badges.
3. Profile density needs a tighter information rhythm (P1 above).
4. No local display typeface; system CJK + Bahnschrift is honest but not distinctive yet.

## Verification

- `npm test` 11/11; `npm run build -w @ai-civ/web` passes.
- Captures inspected: `01-idle`, `03-focus-astra`, `06-bids`, `07-assigned`, `09-settled`, `12-2d-debug`,
  `map-only`, `failure-glb-blocked`, `1366/01-idle`, `1366/07-assigned`.
- Not verified: GPU frame rate; mobile (out of scope); real hardware shadow quality.
