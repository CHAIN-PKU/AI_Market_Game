# 多人对抗的数据模型（A 路线地基）

> 用户提的问题：做 A（文明对抗）本质是**不同玩家对抗**，那每个玩家自己的文明要不要**分开做数据管理**？
> 答案：要。文明状态天然是"每个玩家一份"，只是现在存在内存里、没有落库。下面是把这件事定死的方案。

---

## 1. 现状（先说清家底）

| 层 | 现状 |
|----|------|
| 引擎 | `GameState.civilizations: CivilizationState[]`，每座文明独立持有国库/税率/技能策略/8 个居民；`metricsByCiv` 按文明分开统计 |
| 工厂 | 原来写死两座（`createDualCivilizationGame`），已改为 `createCivilizationGame(specs[])`，支持 N 座 |
| 竞争 | 抢单是**全局市场**：一张单所有文明的居民都能报，中标唯一 —— 对抗天然成立 |
| 存档 | 只在浏览器（fixture + 内存），**没有 SQLite** |

结论：**引擎的"每人一份"已经成立，缺的是落库和 UI 的第二座岛。**

---

## 2. 数据表（SQLite，一局一库或一库多局都可）

```sql
-- 一局游戏（房间）
games(
  id            TEXT PRIMARY KEY,
  seed          INTEGER NOT NULL,
  status        TEXT NOT NULL,          -- lobby | running | finished
  round         INTEGER NOT NULL DEFAULT 0,
  rules_json    TEXT NOT NULL,          -- 全局规则基线（税率上限等）
  created_at    TEXT NOT NULL,
  finished_at   TEXT
);

-- 每局每个玩家一座文明（这就是"分开管理"的落点）
civilizations(
  game_id       TEXT NOT NULL REFERENCES games(id),
  civ_id        TEXT NOT NULL,          -- civ-a / civ-b / civ-c
  player_id     TEXT NOT NULL,          -- 人类玩家或 AI 席位
  display_name  TEXT NOT NULL,
  rules_json    TEXT NOT NULL,          -- 该文明自己的制度（税率/共享/自由雇佣）
  treasury      INTEGER NOT NULL,
  research_pool INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL,
  PRIMARY KEY (game_id, civ_id)
);

-- 居民挂在文明下
agents(
  game_id       TEXT NOT NULL,
  agent_id      TEXT NOT NULL,
  civ_id        TEXT NOT NULL,
  display_name  TEXT NOT NULL,
  abilities_json TEXT NOT NULL,         -- {coding, research, design}
  wallet        INTEGER NOT NULL,
  stats_json    TEXT NOT NULL,          -- 完成/失败/背叛/训练花费
  PRIMARY KEY (game_id, agent_id)
);

-- 每轮的对局快照（复盘与"改规则再跑"靠它）
rounds(
  game_id       TEXT NOT NULL,
  round         INTEGER NOT NULL,
  rules_json    TEXT NOT NULL,          -- 本轮生效的规则（含改后）
  tasks_json    TEXT NOT NULL,
  bids_json     TEXT NOT NULL,
  settlement_json TEXT NOT NULL,
  wager_json    TEXT,                   -- 本轮对赌（见 §4）
  created_at    TEXT NOT NULL,
  PRIMARY KEY (game_id, round)
);

-- 事件流（回放/编年史）
events(
  game_id  TEXT NOT NULL,
  seq      INTEGER NOT NULL,
  round    INTEGER NOT NULL,
  kind     TEXT NOT NULL,               -- task_posted / bid / settled / ability_trained / wager_settled ...
  message  TEXT NOT NULL,
  payload  TEXT,
  PRIMARY KEY (game_id, seq)
);
```

**关键点**：`civilizations` 表以 `(game_id, civ_id)` 为主键 —— 每个玩家的文明是独立一行，
国库、规则、居民都挂在它下面，谁也不能改别人的。这就是"分别做数据库管理"。

---

## 3. 引擎与存储的边界

- 引擎仍是**唯一真相**：所有数值由 `@ai-civ/simulation` 算，DB 只存结果快照
- 写入时机：每轮结束写一条 `rounds` + 若干 `events`；文明/居民的最终态回写 `civilizations` / `agents`
- 读取时机：进入房间时按 `game_id` 载入到内存，之后按轮推进
- 禁止：前端直接算钱、DB 里存"预计收益"这类派生值

---

## 4. 对赌（赌局）在模型里的位置

已实现引擎规则（`packages/simulation/src/economy/wager.ts`）：

| 情况 | 结果 |
|------|------|
| 押注方中标且做成 | 赢家吞掉对方押注（+X） |
| 押注方中标但失败 | 押注归对方（−X） |
| 双方都没接单 | 各自退回 |

落库：`rounds.wager_json` 存本轮押注与结算，`events` 里写 `wager_opened` / `wager_settled` / `wager_refunded`。
**钱只在两座文明国库之间移动，总额守恒**（已有测试锁死）。

---

## 5. 需要改的代码清单（按依赖顺序）

1. `packages/server`：新增 SQLite 层（better-sqlite3 或 node:sqlite），建上面 5 张表；`GameStore` 从内存改为"内存 + 落库"
2. `packages/server`：`POST /games` 接受 `players: [{playerId, civName, rules}]`，创建 N 座文明
3. `packages/web`：场景加第二座岛（右侧已有小岛剪影位），居民用同一套 `GameAgent`
4. `packages/web`：顶栏显示多国库；对赌条（两侧国库实时扣减）
5. `packages/web`：跨文明的中标展示（"B 文明的 Echo 抢了 A 文明的单"）

---

## 6. 验收

- 建一局 3 玩家 → DB 里 `civilizations` 3 行、`agents` 24 行
- 跑 1 轮 → `rounds` 1 行、`events` 完整可回放
- 关掉进程重开，按 `game_id` 载入后状态完全一致
- 一方国库不足时对赌不开盘（不出现负国库）
