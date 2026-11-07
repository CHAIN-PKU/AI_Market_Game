# Phase 0 审查报告

> 审查日：2026-11-07 · 审查人：Cursor（开发 Agent）  
> 依据：`docs/DECISIONS.md` · 标签目标：`pre-ux-3d`

---

## 1. 仓库与依赖

| 项 | 状态 |
|----|------|
| 根目录 | `D:\AICivilization` monorepo，`packages/simulation` `server` `web` |
| Node | 要求 20+（本机已用 24） |
| Git | 首次提交前为「无 commit」；本次建立初始历史 + `pre-ux-3d` |
| 远程 | `git@github.com:CHAIN-PKU/AI_Market_Game.git` |

---

## 2. 自动测试（2026-11-07）

```text
npm test  →  Vitest 4 files, 7 tests, ALL PASSED
```

---

## 3. 模块成熟度

### packages/simulation（权威）

- **已有：** 单轮/多轮引擎、共享市场、竞标、任务成败、税收、Skill 购买、公共研发、双文明 factory、确定性 Mock、`traits`（`investAggression`, `domainAffinity`）、`GameEvent` 种类见下表。
- **未做 / ROADMAP：** 协作任务、自由雇佣、市场阶段切换、公司实体、逐 Agent 公开决策事件流（需在 Adapter 层或增量事件扩展）。

### GameEventKind（当前）

`round_started` · `task_posted` · `bid_placed` · `task_assigned` · `task_completed` · `task_failed` · `tax_collected` · `skill_purchased` · `skill_shared` · `competition_checkpoint` · `rules_updated` · `story` · `simulation_finished`

**Playback 缺口（相对产品要求）：** 无独立 `bid_declined` / `agent_investment_choice` / `reward_paid` 细粒度事件；Slice 阶段可先 **从现有 payload + traces 合成** L2/L3，后续再拆事件。

### packages/server

- Fastify API：`POST /games` · `advance` · `rules` · `player-tasks` · SSE `/mind`（Cursor 研发向）
- 模式：`practice` / `cursor` / `handoff` / OpenAI hybrid
- 对局：**内存**为主；`runtime/active-game.json` 辅助；非完整 SQLite MVP

### packages/web（当前玩家面）

- React 19 + Vite 6 + Tailwind 4
- **2D 抽屉 UI**（`App.tsx`）：导览、筹备、剧场、心路、双文明 PK
- **无** Three / R3F / `/play-3d`
- ROADMAP 曾写 PixiJS → **决策改为 R3F**（见 `DECISIONS.md`）

---

## 4. 与产品 Vertical Slice 差距矩阵

| 能力 | 引擎 | 当前 UI | Slice 需要 |
|------|------|---------|------------|
| 单文明 8 人 | 支持（factory 可只展示一侧） | 固定双文明 | 改门面 + 状态 |
| 逐 Agent 竞标演出 | 部分（`bid_placed` 按人） | 无逐步动画 | Playback + 3D |
| 公开发布 reason_summary | traces（LLM/Mock） | 心路抽屉 | 与决策一致校验 |
| marketEscrow 玩家发单 | 部分 `player-task` | 有发单面板 | 预算账本 + 文案 |
| 制度三模板创建 | rules API | Codex 双文明 | 新建屏 |
| 3D 沙盘 | — | — | **待建** |
| 演示回放 | CLI sim | 无 | seed replay |

---

## 5. 技术债（P0 前已知）

1. Web 仍双文明-centric；Slice 需单文明产品路径。  
2. `ARCHITECTURE.md` 写 PixiJS，与决策不符 — 下一阶段改一句指向 R3F。  
3. Cursor SSE 心路不适合玩家主路径（已决策）。  
4. traits 字段需扩展并与 Mock 决策测试挂钩（决策 §10）。  
5. 无 `assets-manifest.json` 实体文件 — Walking Skeleton 前补齐。

---

## 6. Phase 0 结论

- **模拟核心可继续复用**；测试全绿。  
- **允许进入 Phase 1（仅文档）与 Phase 2（R3F 安装）**，条件：本文件 + `DECISIONS.md` 合入；`pre-ux-3d` 标签存在。  
- **禁止：** 未过 Playback 契约测试就上 Vertical Slice 经济新逻辑。

---

## 7. 基线命令备忘

```powershell
cd D:\AICivilization
npm install
npm test
npm run dev          # 5173 + 3001
npm run sim:dual     # CLI 双文明对照
```
