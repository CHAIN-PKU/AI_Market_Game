# 制度实验台 — `/game` 的「改规则，重跑一回合」

> 2026-11-08 · Mac 接手增量
> 目标：让玩家第一次真正看到「制度 → AI 行为 → 下一轮能力」的因果，而不是只看一次写死的演示。

---

## 1. 玩家看到什么

1. `/game` 顶栏点「制度实验」。
2. 调整：
   - 税率 0–40%
   - 公共研发份额 0–100%
   - 技能归属：私人所有 / 文明共享
   - 随机种子（同一种子 = 同一批任务与决策）
3. 点「用这套制度重跑」。
4. 引擎重新计算竞价、决标、执行、税金、技能购买；界面回到待发布，重新播放这一回合。
5. 结算/技能步骤明确写出结果，例如：
   > Delta 税后剩 65 金，买不起 80 金的「Clean Code Patterns」；能力停在 40。

失败时显示红条并提示启动 API，**不会静默使用旧数据**。

---

## 2. 数据流

```
InstitutionPanel
  └─ POST /api/demo/round  { seed, tasksPerRound, warmupRounds, initialAbility, rules }
       └─ buildBidDemoFixture()            packages/simulation/src/demo/bid-demo.ts
            ├─ createDualCivilizationGame / clampRules
            ├─ postPlayerTask + runSingleRound（真实引擎）
            └─ 把公开事件整理成 BidDemoFixture
  ← fixture（含 civilization.rules / bids / settlement / skillPurchase / rawEvents）
  └─ GamePage 重置到 idle，按原 playback 时间线播放
```

- **结算只来自引擎**；动画、标签、对白不改数值。
- `rules` 经 `clampRules` 限制：税率 0–45%，公共研发 0–1，技能归属只接受 `private | shared`。
- 旧 `/game` 不开 API 也能播放仓库内 fixture；只有「重跑」依赖 API 3001。

---

## 3. 接口

`POST /api/demo/round`

```json
{
  "seed": 20,
  "tasksPerRound": 2,
  "warmupRounds": 0,
  "initialAbility": 28,
  "rules": {
    "name": "高税再分配",
    "taxRate": 0.35,
    "publicResearchShare": 0.1,
    "skillOwnership": "private"
  }
}
```

返回：

```json
{
  "fixture": { "...": "BidDemoFixture v2" },
  "meta": { "engine": "deterministic-mock", "generator": "buildBidDemoFixture", "rules": { "...": "..." } }
}
```

`name` 只用于 HUD 展示；经济行为由税率/公共研发/技能归属决定。

---

## 4. 已验证的制度对照

固定 `seed=20, tasksPerRound=2, warmup=0, initialAbility=28`：

| 制度 | bids | 中标 | 税 | 到手 | 技能 | 写程序 | 下轮成功率 |
|---|---|---|---|---|---|---|---|
| 自由市场 8% | Delta 71 / Grove 79 | Delta | 8 | 92 | Clean Code Patterns（80） | 40 → 48 | 35% → 55% |
| 高税 35% | Delta 71 / Grove 79 | Delta | 35 | 65 | **不买** | 40 → 40 | 35% → 35% |

关键结论：**竞价不变，税后消费改变，下一轮能力随之分叉。** 这正是 MVP 要验证的「玩家能看懂为什么、能影响」。

测试：`packages/simulation/tests/bid-demo.test.ts`（15/15 中的 4 条）。

---

## 5. 边界（不要过度宣传）

- 目前是**单轮快照**：每次重跑从同一初始状态开始，不继承上一轮钱包/能力。
- 不是 `createGame` / `advance` 的长局；没有存档、没有多回合状态机。
- 随机种子改变任务池与决策；「同一种子 + 同制度」结果稳定。
- 游戏内能力提升是**游戏数值**，不是模型训练，也不是正式 Benchmark。
- 5–7 轮连续实验、公司/合作/多人仍未做。

---

## 6. 证据

- 面板：`docs/screenshots/institution-lab/panel-tax35-1920.png`
- 重跑结果 toast：`docs/screenshots/institution-lab/after-run-toast-1920.png`
- 高税「买不起技能」：`docs/screenshots/institution-lab/high-tax-no-skill-1920.png`
- 事件 JSON：`docs/evidence/institution-high-tax.json`

---

## 7. 下一刀

1. 把单轮快照升级为 `createGame` + `advance` 的多轮状态；制度在局内可改。
2. Event Playback 队列由 `rawEvents` 驱动，补「跳过动画不改变 `GameState`」契约测试。
3. 对照模式：同一 seed 下左右并排「自由市场 vs 高税」，跑 5 轮看分化。
