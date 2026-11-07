# MVP Roadmap & 验收手册

每完成一个阶段，在 `D:\AICivilization` 根目录执行对应命令。全部通过再进入下一阶段。

---

## Phase 0 — 骨架（当前）

**交付**：Monorepo、`@ai-civ/simulation`、文档、Git。

| 验收 | 命令 | 通过标准 |
|------|------|----------|
| 依赖安装 | `npm install` | 无报错 |
| 单元测试 | `npm test` | 全绿 |
| 双文明模拟 | `npm run sim:dual` | 跑满 30 轮，有汇总输出 |
| 编译 | `npm run build` | `packages/simulation/dist` 生成 |

---

## Phase 1 — Simulation Engine 加深

- [ ] 协作任务（多 Agent 同一任务）
- [ ] 自由雇佣（`allowFreeHire`）
- [ ] 市场阶段切换（Coding 密集 → Research 密集）
- [ ] 更完整账本（每笔交易 id）
- [ ] `TEST_REPORT.md` 制度对照实验数据

**验收**：`npm test` + `npm run sim:dual -- --seed 1` 与 `--seed 1` 第二次输出指标完全一致。

---

## Phase 2 — 制度编辑器（CLI）

- [ ] `npm run sim -w @ai-civ/simulation -- --rules-a rules.json`

**验收**：改 taxRate 后对比两次 sim 的 `totalGrossOutput` / Gini 有可见差异（不必固定谁赢）。

---

## Phase 3 — Fastify + SQLite

- [ ] REST：`POST /games` `POST /games/:id/step` `GET /games/:id`
- [ ] 保存 / 加载

**验收**：

```powershell
npm run dev:server
curl http://localhost:3001/health
```

浏览器或 curl 创建游戏、单步 5 次，重启服务后 load 状态一致。

---

## Phase 4 — React UI（最小可玩）

- [ ] 文明面板、Agent 列表、任务市场、事件时间线
- [ ] 暂停 / 单步 / 自动 / 速度

**验收**：

```powershell
npm run dev:server
npm run dev:web
```

浏览器 `http://localhost:5173`：点「运行」能看到 Agent 接任务、余额变化、Skill 购买事件。

---

## Phase 5 — PixiJS 地图

- [ ] 简单 2D 文明地图 + Agent 点位

**验收**：地图上 Agent 状态与左侧面板数据一致。

---

## Phase 6 — LLM Provider（Hybrid）

- [ ] `.env` 配置 API；默认仍 Mock
- [ ] 调用预算计数

**验收**：无 `.env` 时零外部调用；开启后仅战略轮次有 HTTP 请求。

---

## Phase 7 — 试玩准备

- [ ] `TEST_REPORT.md` 四类验证实验
- [ ] README 安装说明终版

---

## 建议的日常开发循环

1. 改 `packages/simulation` 代码  
2. `npm test`  
3. `npm run sim -w @ai-civ/simulation -- --rounds 5 --seed 0` 快速目视  
4. 阶段节点：`npm run sim:dual` + 更新 ROADMAP 勾选  
