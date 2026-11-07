# Mac 接手状态报告 — 2026-11-08

> 接手人：DSH（Mac mini，macOS 26.6.2 arm64）
> 仓库：`CHAIN-PKU/AI_Market_Game`，Mac 工作副本
> 接手分支：`feat/visual-cozy-hud` @ `3a861ab`（交接文档提交）
> 结论：**基线可复现**；本轮完成「制度实验台」、国库/税金拆解、右侧档案节奏、7 栋建筑功能剪影与 5 轮文明，测试 **18/18**，Web 构建通过。

---

## 1. 环境与 Git

| 项 | 值 |
|---|---|
| OS | macOS 26.6.2（25G83），arm64 |
| Node / npm | v22.23.3 / 10.9.9 |
| Git / gh | 2.50.1 / 2.102.0（已登录 `CHAIN-PKU`） |
| 浏览器 | Google Chrome（Playwright 驱动，1920×1080 / 1366×768） |
| 仓库 HEAD | `3a861ab`（与交接文档一致） |
| 工作分支 | `feat/institution-lab`（从 `feat/visual-cozy-hud` 切出） |

**与 Windows 交接的最大差异：**

- Mac 上 `npm install` 默认缓存 `~/.npm` 含 root-owned 文件，直接装会 `EPERM`。本轮改用仓库内缓存：
  `npm install --cache "$PWD/.npm-cache"`，未改全局权限。
- 交接里的 `TMP/TEMP`、esbuild `spawn EPERM`、系统代理 7897 等问题在 Mac 上**未出现**。
- Playwright 未装浏览器，直接复用系统 Chrome（`playwright-core` + `executablePath`），不需要下载 Chromium。

---

## 2. 基线验收（按交接 checklist）

| 检查 | 结果 | 证据 |
|---|---|---|
| `npm install` | 通过（273 packages，本地 cache） | — |
| `npm run build -w @ai-civ/simulation` | 通过 | — |
| `npm test` | **18/18**（原 11 + 新增 7） | `packages/simulation/tests/bid-demo.test.ts` |
| `npm run build -w @ai-civ/web` | 通过（1,458.63 kB / gzip 407.05 kB） | 仅有 >500 kB 既有警告 |
| `/game` 1920×1080 | 通过：公告→三性格→报价→决标→结算→技能→下一轮 | `docs/screenshots/mac-verify/2026-11-08-game-1920.png` |
| `/game` 1366×768 | 通过，布局不溢出；右栏为按需打开 | `docs/screenshots/mac-verify/2026-11-08-game-1366.png` |
| 控制台 | 仍有 drei/React `unmount` 警告与一个 404 资源；不影响演出 | 已知非阻断 |

---

## 3. 本轮改动（一个可独立验收的增量）

### 3.1 制度实验台（`/game`）

- 顶栏新增「制度实验」入口：税率、公共研发份额、技能归属、随机种子。
- 点击「用这套制度重跑」→ `POST /api/demo/round` → **simulation 引擎重新计算**竞价/中标/税/技能 → 返回一整套 fixture → 前端回到 `idle` 重新播放。
- API 失败时红条阻断并提示启动 `npm run dev:server`，**不静默回退**。
- 高税场景下，界面明确显示「Delta 税后剩 65 金，买不起 80 金的 Clean Code Patterns；能力停在 40」——制度直接改变消费与下一轮能力。

### 3.6 5 轮文明（真实引擎多轮）

- 顶栏「开 5 轮文明」→ 同一个 `GameState` 连跑 5 轮，钱包/技能/国库累积。
- 第 2 轮起会因上一轮结果换人中标（seed=20 实测：Delta → Grove → Delta → Grove → Grove）。
- fixture 的 `treasuryStart` 改为本轮开始值，跨轮国库不再从 1,000 重算。
- 文档：`docs/CAMPAIGN.md`；截图：`docs/screenshots/campaign/`
- 边界：状态在 API 内存，不是 `/api/games` 的 `createGame/advance`，也没有存档。

### 3.5 建筑功能剪影（隐藏文字可辨）

- 7 栋建筑各加一组低多边形道具：市集条纹棚、技能铺橱窗、程序坊服务器堆、研究所穹顶+望远镜、设计屋画架、公研仓共享旗、居民里木露台+凉棚。
- 开发者面板新增「隐藏标签」开关，可在游戏内做「不看文字也能分辨」验收。
- 截图：`docs/screenshots/buildings/silhouettes-unlabeled-1920.png`
- 细节：`docs/BUILDING_SILHOUETTES.md`

### 3.4 右侧档案信息节奏

- 把「公开决策记录」（自估成功率、风险安全线、报价、目标、结果）从底部移到钱包下方。
- 1080 高度实测：决策记录、性格参数、当前目标、能力、公开履历全部一屏可见，不再需要滚动。
- 截图：`docs/screenshots/mac-verify/2026-11-08-panel-order-1920.png`。

### 3.3 国库/税金拆解

- 结算状态卡直接解释跳变：`国库 1,000 → 1,032：本任务税 +8，其他任务 +27，公共研发 −3`。
- fixture 新增 `treasuryBreakdown`，由 `tax_collected` 事件汇总并对账（`start + toTreasury === end`）；不平会显示红字。
- 新增测试覆盖 32 金差额与高税 136 金差额。

### 3.2 引擎/工程

- 把 `scripts/gen-bid-demo.mjs` 里的 fixture 构建逻辑提取为 `packages/simulation/src/demo/bid-demo.ts`：
  CLI、API、测试共用同一条引擎路径；同一参数输出一致。
- 新增 `POST /api/demo/round`（Fastify），接受 `seed / tasksPerRound / warmupRounds / initialAbility / rules`，规则经 `clampRules` 约束。
- 修复引擎 ID 的进程级全局计数器：`task` / `player-task` / `event` 改为由 `GameState` 派生，同一状态序列可复现，避免多局/多次调用串号。
- 新增 4 条引擎测试：fixture 确定性、基线经济、**高税→买不起技能→能力停止增长**、越界规则被 clamp。

---

## 4. 同一批居民，不同制度（实测）

| 制度 | 中标 | 税 | 到手 | 技能 | 写程序能力 | 下轮成功率 |
|---|---|---|---|---|---|---|
| 自由市场 8% | Delta 71 | 8 | 92 | Clean Code Patterns 80 | 40 → 48 | 35% → 55% |
| 高税再分配 35% | Delta 71 | 35 | 65 | **未购买** | **40 → 40** | 35% → 35% |

竞价完全不变（Delta 71 / Grove 79），变化发生在**税后消费**：这是「制度改变行为，而不是改写市场」的清晰证据。

事件 JSON：`docs/evidence/institution-high-tax.json`
截图：`docs/screenshots/institution-lab/`、`docs/screenshots/treasury/`

---

## 5. 与交接文档的差异 / 仍需注意

- 交接写 PR 分支 tip 为 `33e88f8`；实际 tip 是 `3a861ab`（多一个交接文档提交）。
- `npm test` 从 11 条增至 15 条，不是回归。
- 国库跳变已拆解：结算状态卡显示「本任务税 / 其他任务税 / 公共研发」；详见 `INSTITUTION_LAB.md` §5。
- 右侧居民档案已把「公开决策记录」提到性格参数之前，1080 高度下决策因子、目标、能力、履历一屏可见（`docs/screenshots/mac-verify/2026-11-08-panel-order-1920.png`）。
- 三个既有问题未处理：drei portal `removeChild` 警告、404 资源、三套调色板未统一。
- 5 轮文明已跑通，但仍是内存 campaign，不是持久化 `createGame/advance`；Event Playback 队列仍未做。

---

## 6. 下一轮优先级

1. **`/game` 接 `createGame` / `advance` 与事件队列**（跳过动画不改 `GameState` 的契约测试）。
2. **5–7 轮连续实验**：每轮沿用上一轮的钱包/能力，制度对比才完整。
3. Event Playback 队列（rawEvents 驱动）+ 跳过动画契约测试。
4. campaign 持久化与刷新恢复。
5. 建筑状态与事件绑定（技能铺亮灯、市集成交）。

---

## 7. 复现命令（Mac）

```bash
cd <repo>
npm install --cache "$PWD/.npm-cache"
npm run build -w @ai-civ/simulation
npm test                                # 18/18
npm run build -w @ai-civ/web
npm run dev -w @ai-civ/server           # API 3001
npm run dev -w @ai-civ/web -- --port 5180 --strictPort
# http://127.0.0.1:5180/game
```

> `/game` 的默认 fixture 仍然离线可播；只有点「制度实验 → 重跑」才需要 API 3001。
