# 5 轮文明 — 真实引擎多轮推进

> 2026-11-08 · Mac 接手增量
> 目标：让「任务 → 赚钱 → 消费 → 能力变化 → 下一轮」连续发生 5 次，且钱包、技能、国库真的累积。

---

## 1. 玩家流程

1. `/game` 顶栏点「开 5 轮文明」。
2. 引擎创建文明并立即跑第 1 轮，页面自动播放。
3. 顶栏出现 `文明 1/5`；点「下一轮」继续。
4. 每轮沿用上一轮的钱包、技能与国库；第 5 轮后按钮变为「本轮完成」。

截图：

- 第 1 轮：`docs/screenshots/campaign/round1-1920.png`
- 第 2 轮：`docs/screenshots/campaign/round2-1920.png`
- 刷新恢复后继续第 2 轮：`docs/screenshots/campaign/restore-round2-1920.png`
- 第 2 轮 research 执行中（研究所穹顶亮）：`docs/screenshots/campaign/research-working-1920.png`

---

## 2. 数据流

```
POST /api/campaign
  → createBidDemoCampaign（同一批 authored 居民）
  → advanceBidDemoCampaign：postPlayerTask + runSingleRound
  → snapshotBidDemo → BidDemoFixture（第 1 轮）

POST /api/campaign/:id/next
  → 同一个 GameState 上再 runSingleRound
  → 新 fixture（第 2..N 轮）
```

- `createBidDemoCampaign` / `advanceBidDemoCampaign` 在 `packages/simulation/src/demo/bid-demo.ts`。
- 服务端把 campaign 写入 `runtime/campaigns/<id>.json`（含 state + lastFixture），内存 Map 只是缓存；API 重启后 `GET`/`next` 会从磁盘恢复。
- fixture 的 `civilization.treasuryStart` 现在是**本轮开始**的国库，不再是 1,000；因此能直接看到跨轮累积。
- 每轮的 `walletBefore` 等于上一轮对应居民的 `walletAfter`；测试已断言。
- 引擎事件与结算仍是唯一真相；UI 只播放。

---

## 2.5 文明编年史

- 顶栏 `文明 N/5` 现在是按钮，点开「文明编年史」。
- 表格：轮次、任务域/标题、中标者、报价、税/到手、技能、本事变化、国库。
- 顶部汇总：轮数、有人接单轮数、累计税、买技能次数、最大本事提升、期末国库。
- 「谁接过单」按中标次数排序；中标但任务失败的显示「搞砸」。
- 「谁赚到了钱」按累计到手排序，同时显示没赚到钱的人数。
- 第 5 轮结束后有「再跑 5 轮」按钮，直接开下一局。
- 第 5 轮结束自动打开；刷新恢复 campaign 后也能查看。
- 历史由服务端从每轮 fixture 汇总并落盘，动画不会改写。
- 截图：`docs/screenshots/campaign/history-1920.png`

## 2.7 导出编年史

「文明编年史」底部提供：

- **导出 Markdown**：标题 + 制度/税率 + 表格 + 累计税 + 引擎声明
- **导出 JSON**：完整 meta + history + `exportedAt`
- **复制分享文案**：适合直接发飞书

文件由浏览器本地生成，不经过服务器；截图：`docs/screenshots/campaign/history-export-1920.png`

## 3. API

`/game` 现在走正式 `createGame` / `advance` 路由的 **demo 模式**：

`POST /api/games`

```json
{ "demo": true, "seed": 20, "maxRounds": 5, "tasksPerRound": 2, "initialAbility": 28,
  "rules": { "name": "自由市场", "taxRate": 0.08, "publicResearchShare": 0.1, "skillOwnership": "private" } }
```

返回 `{ id, state, fixture, campaign: { round, maxRounds, done, seed, rules, history }, status }`。

`POST /api/games/:id/advance` 推进一轮；跑满后返回 `409 campaign_finished`。
`GET /api/games/:id` 返回进度 + history + 最近一轮 fixture。
不带 `demo` 的 `/api/games` 仍然走经典双文明 `GameStore`，`/classic` 不受影响。

兼容别名：`POST /api/campaign`、`POST /api/campaign/:id/next`、`GET /api/campaign/:id` 行为相同。

---

## 4. 实测（seed=20，2 任务/轮，5 轮）

| 轮 | 中标 | 国库结束 |
|---|---|---|
| 1 | coding · 修复登录 | Delta | 1,032 |
| 2 | research · 竞品研究 | Echo | 1,050 |
| 3 | design · 品牌视觉 | Flux | 1,071 |
| 4 | coding · 修复登录 | Delta | 1,071 |
| 5 | research · 竞品研究 | Boreal | 1,084 |

任务按 **coding → research → design** 轮换；同一批居民因钱包/技能变化而换人中标，这是跨轮状态真的在起作用。

---

## 5. 边界（诚实版）

- campaign 状态已落盘到 `runtime/campaigns/`；刷新网页会通过 `localStorage` 里的 campaign id + `GET /api/campaign/:id` 恢复当前轮（不自动播放，可重看）。
- 没有 SQLite 存档/版本迁移；删除 `runtime/campaigns/` 会丢失 campaign。
- 这是 `runSingleRound` 的真实多轮推进，但**不是** `/api/games` 的 `createGame` / `advance` 协议，也没有 SQLite 存档。
- Event Playback 已支持逐事件播放（`事件 X / 19`）与「跳过动画」；campaign 仍是内存状态（见 `EVENT_CONTRACT.md` §4.5）。
- 每轮固定发布同一张玩家任务；还没有市场阶段、公司、合作。
- 重开方式：5 轮结束后顶栏「再开 5 轮」；或在「制度实验」里重跑（会清掉 campaign 并删除 localStorage id）。

---

## 6. 下一刀

1. 由 `rawEvents` 生成播放队列，补 pause/step/skip 契约测试。
2. campaign 持久化（JSON/SQLite），刷新可恢复。
3. 每轮任务类型变化，观察专业化。
