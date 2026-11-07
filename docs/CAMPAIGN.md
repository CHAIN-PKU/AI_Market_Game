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
- fixture 的 `civilization.treasuryStart` 现在是**本轮开始**的国库，不再是 1,000；因此能直接看到跨轮累积。
- 每轮的 `walletBefore` 等于上一轮对应居民的 `walletAfter`；测试已断言。
- 引擎事件与结算仍是唯一真相；UI 只播放。

---

## 3. API

`POST /api/campaign`

```json
{ "seed": 20, "maxRounds": 5, "tasksPerRound": 2, "initialAbility": 28,
  "rules": { "name": "自由市场", "taxRate": 0.08, "publicResearchShare": 0.1, "skillOwnership": "private" } }
```

返回 `{ id, fixture, campaign: { round, maxRounds, done, seed, rules } }`。

`POST /api/campaign/:id/next`（空 body，不要带 `Content-Type: application/json`）
返回同样结构；跑满后返回 `409 campaign_finished`。

`GET /api/campaign/:id` 只返回进度，不返回完整状态。

---

## 4. 实测（seed=20，2 任务/轮，5 轮）

| 轮 | 中标 | 国库结束 |
|---|---|---|
| 1 | Delta | 1,032 |
| 2 | Grove | 1,042 |
| 3 | Delta | 1,060 |
| 4 | Grove | 1,090 |
| 5 | Grove | 1,100 |

结果不是写死的：同一批居民在第 2 轮开始因为钱包/技能变化而换人中标，这是跨轮状态真的在起作用。

---

## 5. 边界（诚实版）

- campaign 状态在 **API 进程内存**里；重启 API 会丢，刷新网页不会自动恢复当前 campaign（页面会回到 bundled fixture）。
- 这是 `runSingleRound` 的真实多轮推进，但**不是** `/api/games` 的 `createGame` / `advance` 协议，也没有 SQLite 存档。
- Event Playback 已支持逐事件播放（`事件 X / 19`）与「跳过动画」；campaign 仍是内存状态（见 `EVENT_CONTRACT.md` §4.5）。
- 每轮固定发布同一张玩家任务；还没有市场阶段、公司、合作。
- 重开方式：刷新页面，或在「制度实验」里重跑（会清掉 campaign）。

---

## 6. 下一刀

1. 由 `rawEvents` 生成播放队列，补 pause/step/skip 契约测试。
2. campaign 持久化（JSON/SQLite），刷新可恢复。
3. 每轮任务类型变化，观察专业化。
