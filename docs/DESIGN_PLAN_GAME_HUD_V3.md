# Design plan — /game HUD v3（world-first · market notice board）

> Branch `feat/visual-cozy-hud` · 2026-11-07 · 依据 `frontend-design` skill + `docs/VISUAL_STYLE_GUIDE.md` / `docs/DECISIONS.md`
> This file is a decision record; code follows it.

## 1. Brief extraction

| Question | Answer |
|---|---|
| Product | AI Market Game / AI Civilization — a table-top micro-civilization economic sandbox |
| Audience | Chinese desktop player, first 10 minutes, 1920×1080 (1366 must not break); screenshot-only reviewer |
| Surface job | In one still: who lives here, what the market offers, who bid and why, where coin went, one next action |
| Real content | 8 residents, one 100-金 Coding task, 2 bids (Delta 71 / Grove 79), 6 declines, tax 8, skill 40→48, odds 35%→55% |
| Pinned | warm cream/teal palette, 3D diorama, Chinese player vocabulary, no network fonts, animation never changes settlement |
| Forbidden | silent fallback, fake numbers, advertised unimplemented features, black/neon, emoji world icons |
| Existing | `/game` HUD + 11-step playback + Kenney GLB scene; `/play-3d` legacy shell; `/classic` untouched |

## 2. Direction

**“This interface should feel like a ledger board standing in a table-top market square — paper notes, painted wood, coin alloy — because the game is about watching AI residents earn, spend, and evolve.”**

Implies (generic would not):
1. The **notice board in the 3D world** is the primary action, not a button in a panel.
2. **Gold is money**, not decoration: one CTA, all coin numbers; selection uses teal, tax uses coral.
3. HUD is **on-demand paper plates over a full-bleed world**, not permanent admin columns.

## 3. Color tokens

| Token | Hex | Role |
|---|---|---|
| `--g-paper` | `#F6EEDF` | plates / top strip |
| `--g-paper-2` | `#EFE3CE` | inset / secondary |
| `--g-ink` | `#23312E` | primary text |
| `--g-muted` | `#6D7A71` | secondary text |
| `--g-line` | `#D9C9AB` | paper edge / divider |
| `--g-gold` | `#C98A2E` | money values + the single publish action |
| `--g-teal` | `#2F6F75` | interaction, selection ring, playback, 中标 stamp |
| `--g-coral` | `#B85C3E` | tax / cost |
| `--g-green` | `#4F7A46` | gain / success |

Checked: states carry text labels (中标/已结算/风险不合), not colour alone.

## 4. Type

| Role | Family | Size / line-height | Weight | Use |
|---|---|---|---|---|
| Display | Bahnschrift SemiCondensed + CJK fallback | 30/36 | 700, tabular | money totals, step counter |
| Heading | Microsoft YaHei UI / PingFang SC | 22/30 | 700 | task title, resident name |
| Subheading | CJK UI | 17/24 | 700 | card heads |
| Body | CJK UI | 15/24 | 400 | quotes, copy |
| Data | Bahnschrift / tabular | 16–20 | 700 | coin, odds, quality |
| Caption | CJK UI | 12/18 | 500 | labels, world signboards |

Rules: no `text-transform: uppercase` / tracking on Han text; body < 80 chars; money always `1,234 金`.

## 5. Layout

Full-bleed world; 58px top strip; floating task plate top-left (308px, auto height); resident plate only on selection/focus (340px); one bottom dock (64px). World stays ≥75% and never scrolls the page. At 1366: plates 260/300, dock compresses.

```
┌──────────────────────────────────────────────────────────┐
│ 晨曦文明 · 自由市场    第 1 轮   国库 1,000 金  居民 8  ⚙ │ 58px
│ ┌─ 主任务 ────────┐                     [市集公告板]     │
│ │ 修复网站登录问题 │                       ↑ 唯一 CTA     │
│ │ 100 金 · 难度40  │                                      │
│ └─────────────────┘                                      │
│                                     ┌─ 居民档案 ─────┐   │
│                                     │ Astra 谨慎型    │   │
│                                     └────────────────┘   │
├──────────────────────────────────────────────────────────┤
│ ◀ ▐ ▶ ▷ 1x   步骤 3/11   ▏事件历史   重播          │ 64px  │
└──────────────────────────────────────────────────────────┘
```

Alignment left; rhythm 4/8/12/16/24/32; fixed = top/dock/plates, fluid = world.

## 6. Signature element

**市集公告板**: a wooden board at the square. Idle → pinned “发布第一笔任务” paper (the only gold CTA). Posted → task paper. Bidding → pinned bid slips. Assigned → teal **中标** stamp rotated −2°. Settled → **已结算** stamp + treasury number ticks.

Quiet around it deliberately: top strip is numbers only (no cards/pills); resident plate only appears on demand; no idle bob/pulse anywhere.

## 7. Motion

- Orchestrated moment: the **stamp** lands on the board at 决标 / 结算 (single spring, 180ms), and treasury number ticks once.
- Action-answering: resident plate slides from the right when a resident is selected; close reverses.
- Never moves: economy values before their event; world labels; dock.
- `prefers-reduced-motion: reduce` disables all animation and transitions.

## 8. Copy

- Primary action (board): **发布第一笔任务**
- Top strip: `第 1 轮` / `国库 1,000 金` / `居民 8`
- Task plate: **主任务**, title, `100 金 · 难度 40`
- Dock: `播放` / `暂停` / `单步` / `重播` / `事件历史`, `步骤 3 / 11`
- Resident plate: personality, `公开决策记录`, `公开履历`, `当前目标`
- Empty: `点击市集公告板，发布第一笔任务`
- Error: `3D 资源加载失败：<asset>。请检查网络或重试。` + **重试**
- Loading: `正在点亮晨曦文明…`

Task noun normalized to **任务** everywhere on `/game`; 轮 not 回合.

## 9. Uniqueness review

1. **Closest cluster:** SaaS card kit / dashboard-over-world. Changed: full-bleed world, on-demand paper plates, diegetic board, single CTA, material palette, no pill-everything.
2. **Swap test:** replacing the subject with another game would break the notice board + market/coin/tax material logic and the resident-decision copy → grounded.
3. **One choice a generic model would not make:** the publish action lives on a physical board inside the 3D scene, and 中标/已结算 are stamps on that board.
4. **Removed after first draft:** the persistent left/right admin columns, the second gold CTA, the 2.5D/2D toggle from player chrome, uppercase micro-headings, the 8-person card roster.
5. **Quality floor:** loading + blocking error (no silent null Suspense), keyboard focus-visible, reduced motion, 1366 layout, contrast on paper.

## 10. Build order

1. Structure: full-bleed stage + overlay plates + single dock
2. Type scale + kill uppercase/tracking
3. Color/material+ radius roles; gold = money
4. Signature notice board + stamps
5. Loading / error / empty states; reduced motion; focus-visible
6. Capture 1920 + 1366, critique, revise

## 11. Critique after render

See `docs/DESIGN_REVIEW_GAME_HUD_V3.md` for the full ten-dimension review, findings and evidence.

- **What works:** one primary action (board), world-first framing, paper plates, gold = money, failure plate.
- **What still reads generic:** Kenney suburban building silhouettes; right profile density; no coin path yet.
- **What I removed after first draft:** permanent admin columns, duplicate gold CTA, top-bar view toggle,
  disabled dock tabs, uppercase Han headings, pill resources, roster card.
- **Uniqueness check result:** the notice board + stamps and the paper task ledger are specific to this
  product; with the subject swapped they would not survive.

