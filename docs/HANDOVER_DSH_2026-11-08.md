# DSH 交接文案 — AI Market Game / AI Civilization

> 交接时间：2026-11-08（Asia/Shanghai） · 交接人：上一棒 DSH · 接手人：下一位 DSH
> 本地：`D:\AICivilization` · GitHub：https://github.com/CHAIN-PKU/AI_Market_Game
> **接手分支：`feat/visual-cozy-hud` @ `33e88f8`**（PR #2，未合并）
> 最权威的验收权在项目负责人（CEO）。本文是工程交接，不是验收通过声明。

---

## 0. 一页速览

| 项 | 值 |
|---|---|
| 产品 | **AI Market Game（AI Civilization）** — 玩家设计制度，AI 居民自主接单、赚钱、消费、投资、进化 |
| 核心口号 | **玩家设计规则，AI 自己创造历史。** · **AI 消费 = 自我进化。** |
| 当前分支 | `feat/visual-cozy-hud` @ **`33e88f8`** |
| PR | **#2** https://github.com/CHAIN-PKU/AI_Market_Game/pull/2（open，base `main`，10 commits） |
| 主视觉入口 | `/game`（引擎生成的竞标演出，**不需要 API**） |
| 测试 | `npm test` **11/11 通过** |
| Web 构建 | `npm run build -w @ai-civ/web` 通过（≈1.45 MB JS，>500 kB 警告未处理） |
| 现有证据 | `docs/screenshots/game-hud/`（31 张，1920/1366/仅地图/失败态）+ `docs/recordings/game-bid-demo-1280x720.mp4` |
| 当前程度 | Vertical Slice 的**经济演出与 HUD**已可演示；**尚未接真实 `advance`**；制度调整、5–7 轮闭环、建筑剪影未完成 |

---

## 1. 我们为什么做这个（愿景）

### 1.1 思想来源

最初不是想做 Benchmark，而是一个经济学构想：

> 未来会有大量能力、成本、经验各异的 AI Agent。任务进入市场后，多个 AI 依据比较优势自主决定是否接、如何报价、是否合作；完成后获得金币；金币不只储蓄，而是继续投资 Skill、工具、知识；投资改变下一次的能力与竞争力。

循环是：

**任务竞争 → 劳动赚钱 → 消费投资 → 能力进化 → 下一次竞争。**

不同 Agent 会逐渐专业化（Coding / Research / Design），也可能合作、成立组织，形成不同文明路径。

### 1.2 正式 AI Market 与游戏的关系

正式 AI Market 研究 **Dynamic Personal Benchmark**：按任务类型、难度、环境、真实表现与用户偏好持续评价模型能力，用于路由与经验进化。

游戏是**独立产品**，但同根同源：

- 游戏模拟结果 **≠** 真实 Benchmark。
- 虚拟经济中的「能力提升」主要是购买 Skill/工具/协作资源后的**游戏内能力变化**，**不是**模型权重更新；不得对外宣传成模型训练。

### 1.3 游戏定位

**一句话**：玩家创造一个 AI 文明，制定经济制度，让 AI 居民自主接单、赚钱、消费、投资和进化，再观察不同制度下的文明如何发展。

玩家不是每个 AI 的老板，而是**制度设计师**。玩家通过税率、公共研发、技能归属等规则间接影响居民行为。

### 1.4 长期四阶段（愿景，不是当前功能）

1. **AI 经济文明**：Agent 竞标、赚钱、消费、买 Skill，玩家调制度观察市场。
2. **持续性智能社会**：身份、资产、经历、合作关系；公司/团队/行业分工。
3. **多玩家文明世界**：文明之间竞争、交易、联盟。
4. **连接真实 AI 任务**：玩家授权、真实执行、可靠验收后，才可能为正式 AI Market 提供补充数据；当前不做。

### 1.5 当前 MVP 要验证什么

只验证最小的可玩循环：**玩家是否会因为 AI 自主劳动、赚钱、消费、进化而产生真正的策略兴趣？**

拆成三问：

1. 玩家能否看懂 Agent 为什么这样竞价、放弃、买 Skill？
2. 玩家调整制度后，Agent 行为是否出现可解释的变化？
3. 玩家是否觉得这个文明有趣、愿意继续推进回合？

### 1.6 当前产品方向（重要）

- 不追求更复杂/更真实的 3D；追求**游戏感、交互感、角色生命力、经济行为可理解**。
- 采用 **Cozy Low-poly 2.5D Isometric Strategy**；保留已有 GLB 场景与资产。
- 当前 8 名居民不扩容（上一轮指令在「六、增加 Agent」处中断；未确认前保持 8 人）。
- 默认 **Deterministic Mock Agent**，零付费 LLM；未来再通过统一 Provider 接真实 LLM，并由引擎校验决策。

---

## 2. 现在做到哪一步（诚实版）

### 2.1 已实现

| 模块 | 状态 |
|---|---|
| Simulation Engine | 双文明、任务生成、竞价、决标、执行成败、结算、税收、公共研发、Skill 购买、确定性 Mock；**11/11 测试** |
| 性格驱动决策（本轮前） | `riskTolerance` 决定「风险安全线」与报价边际；`domainAffinity` 影响任务价值；`investAggression` 影响买 Skill；新增 `bid_declared` 结构化字段与 `bid_declined` 事件 |
| `/game` 经济剧场 | 10 步：任务公告 → Astra/Delta/Grove 逐个决策 → 公开报价 → 决标 → 反应 → 执行 → 结算 → 投资 Skill → 下一轮；可播放/暂停/单步/回退/重播 |
| 演示数据 | `scripts/gen-bid-demo.mjs` 调真实引擎生成 `packages/web/src/demo/bid-demo.fixture.json`（seed=20）；前端只回放，不重写经济 |
| HUD v3 | 全幅 3D 世界 + 市集公告板（唯一发布入口/任务纸/报价条/中标·已结算印章）+ 浮动任务纸板 + 按需居民档案 + 单行播放坞；纸/木材质、金币语义、12px 最小字号、失败/加载态 |
| 视觉资产 | Visual Lab：Kenney vs Quaternius A/B（v2 修复蒙皮克隆、统一尺度、微缩岛、相机预设、Idle） |
| 证据 | 31 张截图、MP4 录屏、设计计划与渲染复盘、事件 JSON |
| 文档 | `AGENTS.md`、`AGENTS_experience.md`、`DECISIONS.md`、`CURRENT_STATUS.md`、`EVENT_CONTRACT.md`、`VISUAL_STYLE_GUIDE.md`、`UI_LAYOUT_HUD.md`、`GAME_HUD_DEMO.md`、`DESIGN_PLAN_GAME_HUD_V3.md`、`DESIGN_REVIEW_GAME_HUD_V3.md`、`OPEN_SOURCE_3D_RESEARCH.md`、`ASSETS_LICENSE_MANIFEST.json` 等 |

### 2.2 当前可演示到什么程度

`/game` 可以完整演示：

> 100 金 Coding 任务 → Astra（谨慎，成功率 35% < 安全线 41%）放弃 → Delta（积极，差 80 金买 Skill）报价 71 → Grove（稳健）报价 79 → Delta 中标 → 到手 92 → 买 `Clean Code Patterns`（80）→ 写程序 40→48 → 同难度成功率 35%→55%。

**但**：这是引擎预生成的 fixture 回放，不是浏览器里实时 `advance`。

### 2.3 明确未做

- `/game` 未接真实 API `advance` / Event Playback 队列。
- 制度调整面板（税率/公共研发/技能归属）未接 HUD，也未验证「制度 → 行为差异」。
- 5–7 轮完整 Vertical Slice 未闭环（目前 1 轮演出 + 下一轮预览）。
- 建筑功能剪影仍未通过「隐藏文字也能分辨市集/技能铺/工坊」测试。
- 公司、雇佣、合作竞标、多人、真实 LLM 均未做，UI 不得宣传。
- `/play-3d` 仍是程序化或静态参考，不是最终美术；`/classic` 保留旧 2D 完整循环。

---

## 3. 如何从 GitHub 拉取/复现（接手第一件事）

### 3.1 如果这台机器上已经有 `D:\AICivilization`

**先看状态，再拉取。不要在有未提交改动时直接 pull。**

```powershell
cd D:\AICivilization
git status                     # 应只有 runtime/active-game.json 为 modified
git branch --show-current      # 期望 feat/visual-cozy-hud
git fetch origin
git checkout feat/visual-cozy-hud
git pull --ff-only origin feat/visual-cozy-hud
git log -1 --oneline           # 期望 33e88f8
```

如果本地有其它未提交改动：先备份/提交/确认，再拉。不要 `git reset --hard`、不要 `git clean -fd`、不要强推 `main`。

### 3.2 如果是另一台机器

```powershell
git clone https://github.com/CHAIN-PKU/AI_Market_Game.git D:\AICivilization
cd D:\AICivilization
git checkout feat/visual-cozy-hud
# 或直接取 PR #2：
git fetch origin pull/2/head:pr-2
git checkout pr-2
```

> `main` 上没有 `/game` 与 `/play-3d`。**必须用 `feat/visual-cozy-hud` 或 PR #2 分支**。

如果没有 `git`：安装 Git for Windows；也可以用 GitHub 页面 “Code → Download ZIP”，但 ZIP 不含 Git 历史，后续无法优雅继续迭代。推荐 clone。

### 3.3 安装与运行

```powershell
cd D:\AICivilization
npm install
npm run build -w @ai-civ/simulation   # 生成 dist，供 fixture 生成器/测试使用
npm test                              # 期望 11/11
npm run build -w @ai-civ/web          # 期望通过（有 >500kB 警告）
npm run dev                           # API 3001 + Web 5173
```

只想看 `/game`（不需要 API）：

```powershell
npm run dev -w @ai-civ/web -- --port 5173 --strictPort
```

打开：**http://127.0.0.1:5173/game**

> `npm run dev` 会先构建 simulation 再并发启动 server/web。`/play-3d`、`/classic` 需要 API 3001；`/game` 不需要（fixture 已打包）。

### 3.4 环境要求

- Windows（当前验证环境），Node **≥20**（实测 v24.15，npm 11.12）
- Edge 157 已安装（截图/录屏用）；Playwright 未安装；puppeteer-core 不在仓库依赖中
- 离线优先：不要加网络字体/CDN 运行时依赖

---

## 4. 工程地图（接手先读）

```
D:\AICivilization
├─ packages/
│  ├─ simulation/       经济引擎（唯一真相）：core/ engine, market/bidding, economy/settlement, agents/
│  ├─ server/           Fastify API（createGame / advance 等）
│  └─ web/
│     ├─ src/game/      /game：GamePage、GameHud、GameScene、GameAgent、playback、presentation、game.css
│     ├─ src/play3d/    /play-3d：静态 3D 壳 + 真实 GameState 详情
│     ├─ src/visual-lab/ Kenney/Quaternius A/B 实验
│     ├─ src/demo/      bid-demo.fixture.json（引擎生成）
│     └─ src/App.tsx    /classic 旧 2D
├─ scripts/             gen-bid-demo.mjs、fetch-visual-lab-assets.mjs
├─ docs/                决策、现状、事件契约、视觉规范、设计计划/复盘、审计
└─ runtime/             本地运行数据（active-game.json 不提交）
```

**数据流（必须遵守）：**

```
Decision Layer   simulation 引擎（性格参数参与竞价/投资）
      ↓ GameEvent
Explanation Layer scripts/gen-bid-demo.mjs → fixture 的 decision 结构
      ↓
Presentation Layer web/src/game/presentation.ts（只转成对白，不改数值）
      ↓
UI / 3D 演出
```

规则：经济数值只来自引擎/fixture；动画与文案不得改 `GameState`；不得用假数据或随机对白替代真实决策。

---

## 5. 验证与证据（每轮必须提交）

### 5.1 技术验收

```powershell
npm test                              # 11/11
npm run build -w @ai-civ/web          # 必须通过
```

浏览器自测 `/game`：播放/暂停/单步/回退、Astra/Delta/Grove 三种决策、2D/2.5D（开发者面板）、事件历史、失败态。

### 5.2 视觉与体验证据

- 1920×1080 全屏 + 1366×768 全套；仅地图诊断图；GLB 阻断失败态
- 真实浏览器录屏（不是 AI 生成图）
- 事件 JSON / 数值：`packages/web/src/demo/bid-demo.fixture.json` 的 `rawEvents`
- 设计任务额外提交：设计计划 + 渲染复盘（评分、findings、保留项）

当前证据目录：

```
docs/screenshots/game-hud/          1920 + 1366/ + map-only + failure
docs/recordings/game-bid-demo-1280x720.mp4
docs/GAME_HUD_DEMO.md
docs/DESIGN_PLAN_GAME_HUD_V3.md
docs/DESIGN_REVIEW_GAME_HUD_V3.md
```

### 5.3 验收权

- 项目负责人最终决定视觉/玩法/合并。
- 未经确认不要关闭/合并 PR、不要强推 `main`。
- 自测通过 ≠ 视觉/体验验收通过，三类验收分开写。

---

## 6. 已知坑（会浪费你半天时间的部分）

### 6.1 DSH 沙箱 / 构建

- 当前主机上 **workspace-write 沙箱后端不可用**（报 temp dir 不存在）→ 构建/截图命令需要 `danger-full-access` 一次性授权。
- esbuild 子进程在受限沙箱会 `spawn EPERM`；构建/启动 dev 必须完整权限。
- 默认 `TMP=D:\hw7_tools\tmp\...` 会导致 esbuild `Access is denied`。构建前：

```powershell
$env:TMP = "D:\AICivilization\node_modules\.cache\tmp"
$env:TEMP = $env:TMP
New-Item -ItemType Directory -Force -Path $env:TMP | Out-Null
```

### 6.2 网络 / GitHub

- GitHub HTTPS 直连间歇性 `Connection reset` / 443 超时。
- 若本机系统代理 `127.0.0.1:7897` 正在监听，可用：

```powershell
git -c http.proxy=http://127.0.0.1:7897 -c http.version=HTTP/1.1 `
    -c http.postBuffer=524288000 push origin feat/visual-cozy-hud
```

- `gh` CLI 未安装；Git Credential Manager 有 `CHAIN-PKU` 凭据。PR 可用 GitHub REST API 创建/更新。
- 不要因为网络失败就重建分支；先 `git fetch`/重试/检查代理，并确认本地分支存在。

### 6.3 端口 / 开发服务器

- 机器上可能有历史 Vite 实例占用 5173/5174/5175 与 API 3001。用 `--strictPort 5180` 起临时实例，或先确认并清理旧进程。
- 截图脚本：Playwright 未安装；可参考 `docs/DESIGN_REVIEW_GAME_HUD_V3.md`/项目 skill 的 CDP 脚本，或安装 `puppeteer-core` 到 `node_modules/.cache`（不属于仓库依赖）。

### 6.4 已存在的非阻断问题

- 1366/2D 切换时偶发 drei Html portal `removeChild` 控制台警告（视觉未坏）。
- 右侧居民档案在 1080 高度下需要滚动。
- 国库从 1,000 → 1,032 的结算跳变（fixture 含其他任务）未在 HUD 拆解说明。
- 三套近似调色板（`index.css` / `play3d` / `game.css`）尚未完全统一。
- `/play-3d` 仍是程序化参考；视觉 Lab 的 A/B 选型尚未由负责人最终拍板。

---

## 7. 下一轮优先级（建议任务包）

### P0（先做）

1. **`/game` 接真实 API 与 Event Playback**：`createGame`/`advance` → 事件队列 → 播放/暂停/单步/跳过；补「跳过动画不改变 `GameState`」契约测试。
2. **制度实验接线**：税率 / 公共研发 / 技能归属接入 HUD；同一批角色在不同制度下重跑，给出可观察差异。
3. **建筑功能剪影**：7 栋建筑各有一个可辨识屋顶/道具（市场遮阳棚、技能橱窗、服务器堆、圆顶、画架、共享旗、露台），隐藏文字测试通过。
4. **右侧居民档案信息节奏**：压缩履历、关键因子置顶；避免滚动才能看完。
5. **国库/税金拆解**：结算时显示本任务与其他任务的分解，或标明含其他任务。

### P1

- 5–7 轮完整循环 + 存档 + 重播演示。
- 金币路径/技能卡飞入等事件驱动动画（仍不改结算）。
- 统一三套调色板与字体 token；`/play-3d` 接入选定 GLB 美术。

### P2（暂缓）

- 增加 Agent 数量、公司/雇佣/合作、多人、真实 LLM 大规模调用。
- 更复杂 3D 模型/自由相机/大地图。

---

## 8. Git / 协作规则

1. **用户决定提交与合并节点**；未经明确授权不要 commit/push/merge（本交接默认你已获得拉取/开发授权）。
2. **禁止强推 `main`**；禁止覆盖本地未提交成果；不要 `git clean -fd`。
3. `runtime/active-game.json` 是运行数据，**不提交**；`.env` 永不提交。
4. GLB 资产仅 CC0，登记在 `docs/ASSETS_LICENSE_MANIFEST.json`；新增素材先核许可与体积。
5. 不访问/修改正式 AI Market Benchmark 项目；游戏与正式项目隔离。
6. 默认零付费 LLM；如接入，必须有预算/频率上限、引擎校验、不展示隐藏思维链。
7. 不要静默 fallback；资源/API 失败要可见、阻断、可重试。
8. 每轮交付：目标、改动文件、分支/commit/PR、1920 截图、真实录屏、事件/数值、测试结果、未完成项、下轮 3 个优先。

---

## 9. 接手第一天 checklist（照做即可）

```powershell
cd D:\AICivilization
git status
git fetch origin
git checkout feat/visual-cozy-hud
git pull --ff-only origin feat/visual-cozy-hud
git log -1 --oneline                    # 33e88f8

# 环境
$env:TMP = "D:\AICivilization\node_modules\.cache\tmp"
$env:TEMP = $env:TMP
New-Item -ItemType Directory -Force -Path $env:TMP | Out-Null

npm install
npm run build -w @ai-civ/simulation
npm test                                # 11/11
npm run build -w @ai-civ/web            # 通过

# 启动（只 web 也够 /game）
npm run dev -w @ai-civ/web -- --port 5180 --strictPort
# 打开 http://127.0.0.1:5180/game
```

然后读：

1. `AGENTS.md` + `AGENTS_experience.md`
2. `docs/DECISIONS.md`
3. `docs/CURRENT_STATUS.md`
4. `docs/EVENT_CONTRACT.md`
5. `docs/GAME_HUD_DEMO.md` + `docs/DESIGN_PLAN_GAME_HUD_V3.md` + `docs/DESIGN_REVIEW_GAME_HUD_V3.md`
6. `docs/VISUAL_STYLE_GUIDE.md` + `docs/UI_LAYOUT_HUD.md`

接手后的第一份产出：**一页接手状态报告**（实际 Git/测试/构建/`/game` 跑通情况 + 与本文差异），不要先做大改。

---

## 10. 给下一位 DSH 的一句话

这个项目不是「用代码搭一座 3D 城市」，也不是「让 8 个 Agent 自动聊天」。

它要做的是一款真正的 AI 文明策略游戏：**玩家设计规则，AI 自己创造历史**。每一次经济选择改变智能体的能力，能力变化又影响下一轮竞争，最终形成由制度、市场和 AI 自主行为共同写成的历史。

先把「玩家能看懂为什么、能影响、还想再来一轮」做出来，再谈更多 Agent、更复杂 3D、更多功能。

—— 上一棒 DSH
