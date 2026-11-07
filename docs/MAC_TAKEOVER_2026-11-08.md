# Mac 接手状态报告 — 2026-11-08

> 接手人：DSH（Mac mini，macOS 26.6.2 arm64）
> 仓库：`CHAIN-PKU/AI_Market_Game`，Mac 工作副本
> 接手分支：`feat/visual-cozy-hud` @ `3a861ab`（交接文档提交）
> 结论：**基线可复现**；本轮完成「制度实验台」、国库/税金拆解、右侧档案节奏、7 栋建筑功能剪影与 5 轮文明、Event Playback cue-by-cue、建筑状态绑定、2.5D 视觉升级、文明编年史与编年史导出、大白话 UI（含改规则常驻对比/编年史本事变化），测试 **31/31**，Web 构建通过。

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
| `npm test` | **31/31**（simulation 19 + web 12） | `packages/simulation/tests/bid-demo.test.ts` |
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

### 3.14 大白话 UI 与演示视频

- 首屏加「你是制度设计师」；顶栏/左右栏/规则/编年史全部换成口语化短句。
- 右侧移除未实现的「合作偏好」，决策因子压缩到 4 个。
- 47 秒 1080p MP4：`docs/recordings/ai-civ-demo-2026-11-08.mp4`
- 详情：`docs/PLAIN_LANGUAGE_UI_2026-11-08.md`

### 3.13 编年史导出

- 编年史支持 Markdown / JSON 下载与分享文案复制，浏览器本地生成。
- 3 条纯函数测试：Markdown 表格、JSON 结构、分享摘要。
- 截图：`docs/screenshots/campaign/history-export-1920.png`

### 3.12 接上 `/api/games` 的 createGame / advance

- `/game` 的 5 轮文明改为调用 `POST /api/games`（`demo:true`）与 `POST /api/games/:id/advance`。
- 返回 `{ state, fixture, campaign, status }`；`GET /api/games/:id` 支持刷新恢复。
- 不带 `demo` 的 `/api/games` 继续走经典双文明 GameStore，`/classic` 不受影响。
- 兼容旧 `/api/campaign` 路由。
- 仍是一个 demo adapter，不是把 campaign 塞进经典 GameStore；两套状态后续统一。

### 3.11 文明编年史

- 5 轮文明每轮记录：任务域/标题、中标者、报价、税/到手、技能、国库。
- 顶栏「文明 N/5」点开表格；第 5 轮自动打开；刷新恢复后仍可看。
- history 随 campaign 落盘，服务端从 fixture 汇总，动画不参与。
- 截图：`docs/screenshots/campaign/history-1920.png`

### 3.10 2.5D 视觉升级（回应「像原神一点、人物更清晰」）

- 角色换 Quaternius（带 Idle/Walk），按职业/肤色/发色重上色，3 阶 toon 材质 + 简单面部。
- DPR 2、ACES tone mapping、暖 key + 冷 fill + 青色 rim、SoftShadows/ContactShadows、4096 阴影。
- 相机更近且按舞台宽高比自适应；1366 不再裁掉岛屿；三性格评估时自动切角色正面特写。
- 角色加 inverted-hull 描边，提升轮廓可读性。
- 开发者面板新增「高/中/低」画质档（DPR、阴影、SoftShadows、ContactShadows、Sparkles、描边），存 localStorage。
- 3840×2160 实际截图：`docs/screenshots/visual-hq/after-2x-3840.png`
- 取舍与边界：`docs/VISUAL_QUALITY_2026-11-08.md`（Bloom 在 1366/2560 下不稳定，已移除）

### 3.9 建筑状态绑定

- 市集结算后出现金币；技能铺在购买技能后亮灯；程序坊 LED 在执行中变亮；公研仓共享旗按私人/共享变色；居民里结算后灯笼亮。
- 状态来自 `fixture + step`，不改经济；截图：`docs/screenshots/buildings/state-*.png`
- 文档：`docs/BUILDING_STATE.md`
- 边界：当前任务固定 coding，research/design 分支未实机截图。

### 3.8 Campaign 持久化

- 服务端每次 create/next 写 `runtime/campaigns/<id>.json`（state + lastFixture）；内存 Map 只是缓存。
- API 重启后 `GET /api/campaign/:id` / `next` 从磁盘恢复，钱包/技能/国库继续累积。
- 网页把 campaign id 存 localStorage；刷新后恢复当前轮（不自动播放），可继续或重看。
- 5 轮跑完后顶栏「再开 5 轮」。
- 截图：`docs/screenshots/campaign/restore-round2-1920.png`

### 3.7 Event Playback cue-by-cue

- 新增 `buildPlaybackCues` + `flattenPlaybackCues`：把 `rawEvents` 映射成 19 个逐事件点，同时保留 11 个叙事步骤。
- 播放坞新增「跳过动画」（⏭），直接到本轮结束；跳过只改播放状态，不动 fixture/经济。
- 事件抽屉显示当前步骤队列条数与总事件数；开发者面板显示 `步骤:事件数` 的队列分布。
- 播放坞显示「事件 X / 19」；单步按钮现在是逐事件步进。
- 新增 7 条播放契约测试：队列映射、逐事件覆盖全部步骤、跳过不改数据、暂停不推进、2x 只改时长、单次购买只一个技能 cue。
- 测试文件：`packages/web/src/game/playback.test.ts`；截图：`docs/screenshots/playback/`
- 边界：跳过是到「下一轮」，不是任意步骤；campaign 仍是内存状态。

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
- 5 轮文明已跑通且落盘恢复（`runtime/campaigns/`），并通过 `/api/games` 的 demo 模式使用 `createGame/advance` 路由；仍不是经典双文明 `GameStore`。
- Event Playback 已到 cue-by-cue：`rawEvents → 逐事件点`、播放坞显示「事件 X/Y」、跳过/暂停/倍速契约已测。

---

## 6. 下一轮优先级

1. **`/game` 接 `createGame` / `advance` 与事件队列**（跳过动画不改 `GameState` 的契约测试）。
2. **5–7 轮连续实验**：每轮沿用上一轮的钱包/能力，制度对比才完整。
3. 统一 demo campaign 与经典 `/api/games` 的 GameStore（避免两套状态）。
4. 更精细的角色资产与建筑材质分层。
5. 文明编年史导出（Markdown/JSON）。

---

## 7. 复现命令（Mac）

```bash
cd <repo>
npm install --cache "$PWD/.npm-cache"
npm run build -w @ai-civ/simulation
npm test                                # 31/31
npm run build -w @ai-civ/web
npm run dev -w @ai-civ/server           # API 3001
npm run dev -w @ai-civ/web -- --port 5180 --strictPort
# http://127.0.0.1:5180/game
```

> `/game` 的默认 fixture 仍然离线可播；只有点「制度实验 → 重跑」才需要 API 3001。
