# 游戏化 HUD + 第一段竞标交互演出 — 验收材料（2026-11-07）

> 分支：`feat/visual-cozy-hud` · PR #2 · 演示路由：`/game`
> 证据目录：`docs/screenshots/game-hud/`、`docs/recordings/`、`docs/screenshots/visual-lab/`

---

## 1. 本轮目标

把「Visual Lab 好看但不像游戏」推进到「像一款策略经营游戏」：

1. 游戏化 HUD（资源栏 / 主任务卡 / 居民卡 / 底部操作栏 / 镜头与视图切换）。
2. 8 位 AI 居民的**职业识别与状态**（Idle / 观望 / 竞标 / 已中标 / 工作中 / 去技能铺）。
3. 第一段可看、可暂停、可单步的**任务公告 → 竞标 → 中标 → 执行 → 结算 → 买 Skill**演出。
4. 同场景 **2.5D vs 2D 交互对照**（判断 3D 带来的体验增量）。

不在本轮范围：真实下一轮推进、完整 Event Playback、制度调整、合作/公司、真实 LLM。

---

## 2. 修改的主要文件 / 模块

| 模块 | 文件 | 作用 |
|------|------|------|
| 游戏页 | `packages/web/src/game/GamePage.tsx` | 页面壳、播放状态机、派生数值 |
| HUD | `packages/web/src/game/GameHud.tsx` | 顶栏 / 主任务卡 / 居民卡 / 底栏 / 事件抽屉 / Debug 面板 / 2D 棋盘 |
| 3D 场景 | `packages/web/src/game/GameScene.tsx` | 等距固定镜头、建筑职能标签、市场任务板 |
| 角色 | `packages/web/src/game/GameAgent.tsx` | Idle/Walk 动画、移动插值、状态气泡、职业徽章、点击选中 |
| 样式 | `packages/web/src/game/game.css` | 字号体系、暖色卡片、按钮状态、3D 标签、2D 棋盘 |
| 图标 | `packages/web/src/game/icons.tsx` | 统一 SVG 图标（金币/人口/轮次/任务/职业/播放控制等），不用 emoji |
| 播放 | `packages/web/src/game/playback.ts` | 8 步确定性时间线（时长仅影响演出，不影响数值） |
| 演示数据 | `packages/web/src/demo/bid-demo.fixture.json` | **由真实引擎生成**的确定性数据（含原始事件） |
| 生成器 | `scripts/gen-bid-demo.mjs` | 调 `packages/simulation/dist` 跑单文明一轮，生成 fixture |
| 路由 | `packages/web/src/main.tsx`、`HomePage.tsx` | 新增 `/game`，首屏入口改为主 CTA |
| 配置 | `packages/web/tsconfig.json`、根 `package.json` | JSON 导入、`npm run demo:fixture` |

复用了：`visual-lab/IslandBase`、`GlbInstance`、`assetScale`、`assetUrls`、`islandLayout`、GLB 资产（CC0）。

---

## 3. 分支 / commit / PR

- 分支：`feat/visual-cozy-hud`
- 前置提交：`afbb369`（Visual Lab v2）
- 本轮提交：提交后见 PR #2 最新 commit（`git log -1`）
- PR：https://github.com/CHAIN-PKU/AI_Market_Game/pull/2

---

## 4. 完整 1920×1080 主界面

![待机主界面](screenshots/game-hud/01-idle-1920x1080.png)

---

## 5. 真实浏览器录屏

`docs/recordings/game-bid-demo-1280x720.mp4`（约 19 秒，真实 Edge 浏览器 + 真实 WebGL 场景，非概念图/非剪辑摆拍）。

> 录制方式：CDP screencast 抓帧 → ffmpeg 编码。首尾含少量加载等待。帧率较低（约 6fps，软件渲染环境限制），用于核对交互顺序与状态变化，不代表最终性能。

---

## 6. 交互前 / 中 / 后关键截图（1920×1080）

| 阶段 | 截图 |
|------|------|
| 待机 + 新手目标 | `01-idle-1920x1080.png` |
| 任务公告 | `02-posted-1920x1080.png` |
| 竞标中（3 人报价 / 5 人观望） | `03-bidding-1920x1080.png` |
| 决标（右侧自动打开中标者卡） | `04-assigned-1920x1080.png` |
| 执行中（走向程序坊） | `05-working-1920x1080.png` |
| 结算（奖励 / 税金 / 到手） | `06-settled-1920x1080.png` |
| 自主购买 Skill + 能力提升 | `07-skill-1920x1080.png` |
| 本轮结束 | `08-next-1920x1080.png` |
| 2D 交互对照 | `09-2d-board-1920x1080.png` |

1366×768 可读性版本：`docs/screenshots/game-hud/1366/`（同一流程 10 张）。

### 2.5D vs 2D 对照（同一段竞标）

- 2.5D：`04-assigned-1920x1080.png` / `07-skill-1920x1080.png`
- 2D：`09-2d-board-1920x1080.png`

**初步判断：**

| 维度 | 2.5D 舞台 | 2D 竞标板 |
|------|-----------|-----------|
| 角色/建筑辨识 | 更强，有空间关系与走动 | 强，信息密度更高 |
| 经济信息可读性 | 需要 HUD 辅助 | 竞标/观望/结算一屏读完 |
| 制作与运行成本 | 高（3D + 动画 + 性能） | 低 |
| 情感/文明感 | **明显更强**（本原型的主要增益） | 更像数据面板 |

**建议：** 保留 2.5D 作为主舞台，但把「竞标/结算」这种高信息密度环节做成 2D 覆盖层（两者不是二选一）。下一步请项目负责人实机体验后拍板。

---

## 7. 真实事件日志与关键数值

数据来源：`packages/web/src/demo/bid-demo.fixture.json`（由 `scripts/gen-bid-demo.mjs` 调真实引擎生成，`seed=1`、`tasksPerRound=2`、`initialAbility=28`、单文明、无 LLM）。

关键数值：

| 项 | 值 |
|----|----|
| 任务 | 修复网站登录问题 · Coding · 难度 40 · 奖励 100 金 |
| 参与竞标 | Astra 80 金（质量 45% / 成功率 35%）、Delta 79 金、Grove 79 金 |
| 观望 | Boreal、Cinder、Echo、Flux、Helix（估分低于 25 接单门槛） |
| 中标 | **Delta**（同质量、报价更低 → 分数更高） |
| 结算 | 奖励 100 − 税 8（8%）= 到手 92 金；国库 1,000 → 1,007 |
| 自主投资 | Delta 花 80 金买 `Clean Code Patterns`，写程序能力 40 → 48，同难度成功率 35% → 55% |
| 原始事件 | fixture `rawEvents`：`task_posted` / `bid_placed`×3（重点任务）/ `task_assigned` / `task_completed` / `tax_collected` / `skill_purchased` |

> 注：fixture 中同一轮还有 2 个系统任务（用于让 Mock Agent 的「选前两单」逻辑真实发生），因此部分居民的 `walletAfter` 包含其他订单收入；演示聚焦玩家订单。

---

## 8. 构建 / 测试 / 浏览器自测

| 检查 | 结果 |
|------|------|
| `npm test`（simulation） | 7/7 通过 |
| `npm run build -w @ai-civ/web` | 通过（JS ≈1.41 MB，>500 kB 警告未处理） |
| 浏览器自测 | `/game` 全流程单步走通；A/B 视图切换、事件抽屉、Debug 面板可用 |
| 控制台 | 仅 `favicon.ico` 404；3D↔2D 切换时有 React“同步卸载 root”警告（功能无影响，下轮修） |

---

## 9. 尚未完成 / 不满意

1. **未接真实 advance**：演示数据由引擎脚本预生成（fixture），浏览器端播放；下一阶段接 `POST /api/advance` 生成真实事件流。
2. **竞标理由字段不足**：引擎 `bid_placed` payload 只有报价；质量/成功率是前端用引擎参数推导，`放弃` 事件未由引擎发出。需要最小增量字段（见 §10）。
3. 动画只有 Idle/Walk + 直线位移，无寻路/避障；工作动作未单独制作。
4. 3D↔2D 切换存在 React 警告；2D 板尚未做入场动画。
5. HUD 字体仍为系统字体；未引入游戏化字体（避免网络字体依赖）。
6. 1280/720 高度下左栏内容会滚动截断（信息完整，但需要滚动查看）。

---

## 10. 建议下一轮优先解决的三个问题

1. **真实 Event Playback 接线**：`/game` 从 API `createGame` + `advance` 拉取真实 `events`，前端只做播放队列；补齐“跳过动画不改变 GameState”的契约测试。
2. **引擎最小增量字段**：`bid_placed` 增加 `expectedQuality` / `successProbability` / `reasonSummary`，并新增 `bid_declined`（放弃）事件；所有文案必须来自这些字段，不另写解释。
3. **按产品方向裁剪 3D 投入**：先用 2.5D 舞台 + 2D 竞标覆盖层完成 Vertical Slice；3D 只保留固定等距镜头与 Idle/Walk，不再增加模型面数/自由相机。

---

## 11. 三层验收状态（自检，不等于通过）

- **技术验收：** 构建通过、测试通过；经济数值来自引擎生成文件；未发现运行错误（有非阻断警告）。
- **视觉验收：** HUD 已具备游戏化层级与暖色卡片；角色职业/状态可识别；建筑有职能标签。仍未达“正式美术定稿”（见 §9）。
- **体验验收：** 新手目标明确（发布第一笔订单）；能看懂谁报价/谁放弃/为什么中标/钱怎么花；制度影响未在本轮验证。

> 请项目负责人实机试玩后决定：是否进入真实 Playback 接线，以及 2.5D/2D 的最终取舍。
