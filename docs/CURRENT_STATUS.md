# AI Market Game — 仓库现状审计

> **审计基准时间：** 2026-11-07  
> **说明：** 如实反映代码与可玩性，不夸大进度。

---

## 0. Commit 与分支

| 引用 | Hash | 内容 |
|------|------|------|
| **`origin/main`（GitHub 默认分支）** | `3669b9a` | Phase 0 文档、classic 2D UI、模拟引擎、无 `/play-3d` |
| **`feat/play-3d-skeleton`（PR #1，未合并）** | `620b61f` | R3F 行走骨架、`/play-3d`、程序化几何体 |
| **本地工作区（审计后小改）** | 未 push | `CURRENT_STATUS.md`、`AGENTS_experience.md`、居民卡片文案 |

最近功能（`620b61f` 相对 `3669b9a`）：

- React Router：`/`、`/classic`、`/play-3d`
- Three.js + R3F + Drei（锁定版本见 `DECISIONS.md`）
- `createGame()` 驱动文明 A 的 8 人展示与点击详情
- **无**回合推进、无竞标演出、无 Playback

---

## 1. Simulation Engine — 经济规则

### 已实现并验证（Vitest / CLI）

| 能力 | 说明 |
|------|------|
| 双文明初始状态、制度差异 | 税率、公共研发、Skill 私有/共享 |
| 每轮任务生成、开放市场 | `task-generator` |
| 竞标与决标 | 质量、报价、`expectedQuality` |
| 任务成败 | `resolveTaskOutcome`（规则 + RNG，**非 LLM 交付**） |
| 结算、税收、国库、公共池 | `settlement` |
| Skill 购买 | 扣钱包、写 `skill_purchased` 事件；影响有效能力 |
| 投资门槛 | `investAggression` 等 traits 影响是否买 Skill |
| 确定性 Mock / practice | 可复现，`npm test` 7/7 通过 |
| 可选 Cursor / OpenAI | 研发向，**非 Slice 玩家路径** |

### 已实现但未验证（缺 UI 串联或缺测试）

| 能力 | 缺口 |
|------|------|
| 玩家发单 + escrow | `player-task.ts` 有逻辑；**无** marketEscrow 产品 UI |
| 单文明 Slice | 引擎仍 **双文明**；3D 只展示 A |
| traits 扩展决策 | 有 `riskTolerance`/`investAggression`；**未**验收「性格→不同投资」测试 |
| 逐 Agent 公开 `reason_summary` | practice 有模拟台词；**无**可重放竞价逐步事件 |

### 尚未实现（文档/ROADMAP 已规划）

| 能力 | 状态 |
|------|------|
| 合作竞标、自由雇佣 | `allowCollaboration` 等字段存在，**引擎未完整** |
| 公司实体、破产 | 无 |
| 市场阶段切换（Coding 热→Research 热） | ROADMAP Phase 1 未做 |
| marketEscrow 新手预算账本 | 未做 |
| Event Playback Adapter | 未做 |
| 制度对照双跑 UI | 仅 CLI `sim:dual` |

**「消费 = 进化」引擎层面：** Skill 购买 **会** 改变有效能力与 `resolveTaskOutcome` 输入；**Web 3D 未演示**下一轮成功率变化。

---

## 2. Web 前端

| 页面 | 状态 |
|------|------|
| `/classic` | **完整 2D**：双文明、导览、发任务、规则、心路、剧场、`advance` |
| `/play-3d` | **仅 PR 分支**：3D 沙盘 + 点击详情；**不能**点「下一回合」 |
| `/` | 两个入口链接 |
| 创建文明三模板 | **未做** |
| 9 步新手闭环 | **未做** |

**3D 是否真正接入：** 在 `feat/play-3d-skeleton` **是**（Canvas + 真 API）；`main` **否**。

**旧 2D 仪表盘：** **仍在** `/classic`，且仍是默认「能玩一局」的入口。

---

## 3. 核心玩法链是否串联？

| 环节 | Classic 2D | /play-3d |
|------|------------|----------|
| 任务出现 | ✅ 引擎 | ❌ 仅静态场景 |
| Agent 竞价 | ✅ 后台批量（无逐步演出） | ❌ |
| 执行成败 | ✅ | ❌ |
| 收入/税 | ✅ | ❌ |
| 自主买 Skill | ✅ 引擎每轮末 | ❌ |
| Skill→下轮能力 | ✅ 引擎 | ❌ 无 UI 对比 |
| 制度调整 | ✅ Codex | ❌ |

**结论：** 玩法闭环 **在 `/classic` + API 可跑通**；**产品要求的 3D Vertical Slice 未串联**。

---

## 4. 测试与构建

| 命令 | 结果（2026-11-07） |
|------|---------------------|
| `npm test` | 7/7 通过（simulation） |
| `npm run test:all` | + server API smoke 1/1 |
| `npm run build -w @ai-civ/web` | 通过（含 3D 分支）；bundle ~1.25MB 警告 |

**已知问题（未修）：**

- 双实例 `npm run dev` → 3001 占用、`advance` 404
- Cursor 模式本地 Agent 慢/静默（已部分缓解，非玩家路径）
- 3D：角色被建筑遮挡、比例失调（产品反馈）
- `main` 与 PR 分支功能不一致

**无自动化：** 浏览器 E2E、视觉回归、Playback 契约测试（计划未写）。

---

## 5. UI 展示 vs 引擎绑定

| 展示 | 绑定 |
|------|------|
| Classic 文明面板、钱包 | ✅ GameState |
| 心路 traces | ✅ 回合后 traces（practice/cursor） |
| /play-3d 8 人能力/钱包 | ✅ `createGame()` 初始轮（多为 0） |
| 居民「内心独白」 | ⚠️ 由 **traits/能力推导** 的文案，非对局内真实决策日志 |
| 建筑说明 | 叙事文案；建筑形态 **不** 反映引擎状态 |
| 竞标剧场、金币动画 | ❌ 未实现 |

---

## 6. P0 验收对照（诚实）

| P0 项 | 状态 |
|-------|------|
| 单文明完整新手流 | ❌ |
| 8 可点击 Agent | ⚠️ 仅 `/play-3d` PR；无玩法 |
| 可操作任务市场 | ❌ 3D；Classic 有发单 |
| 引擎驱动竞标演出 | ❌ |
| 自主买 Skill 可见 | ❌ 3D |
| Skill 影响下轮 | ❌ 无 UI 证明 |
| 基本制度调整 | Classic ✅ / 3D ❌ |
| 暂停/回放 | ❌ |

---

## 7. 验收材料清单（提交状态）

| # | 材料 | 状态 |
|---|------|------|
| 1 | 本文 + commit hash | ✅ |
| 2 | 功能清单 | ✅ 上文 |
| 3–6 | 截图（全屏/近景/竞标/Skill） | ⏳ **需产品方** 在合并 PR 后截取；当前无竞标/SKill 可截 |
| 7 | 经济事件日志样例 | ⏳ 可用 `npm run sim:dual` 导出；Web 未导出 |
| 8 | 测试结果 | ✅ 见 §4 |
| 9 | 录屏（创建→投资进化） | ❌ **流程不存在**，无法诚实录制 |
| 10 | 三大问题 + 最小修复 | ✅ 见 §8 |

---

## 8. 当前最需要改进的三件事（最小下一步）

1. **视觉与 HUD 第一步（产品明确要求先于 Playback）**  
   - 新分支 `feat/visual-cozy-hud`：设计令牌、完整小岛构图、相机比例、角色卡片（已完成文案方向）。  
   - **验收：** 1920 全屏 + 俯视 + 角色近景截图，**不要求动画**。

2. **玩法不在 3D 上叠假数据**  
   - 视觉过线后，再在 3D 上接 `advance` + Event Playback（`EVENT_CONTRACT.md`）。  
   - **验收：** 跳动画不改变 `GameState` 的 Vitest。

3. **合并策略**  
   - PR #1 保留为 **工程骨架**；视觉分支基于其开；**勿** 将 PR #1 标为视觉终验通过。

---

## 9. 四问自检（产品纲领）

| 问题 | 现状 |
|------|------|
| 玩家能看懂 Agent 为什么这样做？ | Classic 有部分心路；3D 仅有性格衍生文案，**无竞标理由** |
| 劳动与消费真的改变未来能力？ | **引擎可以**；**玩家看不见**（尤其 3D） |
| 制度改变文明？ | Classic 改税可测；未做对照叙事 |
| 有趣到想继续玩？ | **尚未**；当前像技术样机 + 2D 实验台 |

---

*本文件随里程碑更新；下一次审计应在 `feat/visual-cozy-hud` 截图后补充 §7。*
