# AI Market Game — 正式决策记录

> **状态：** 2026-11-07 产品方 + 辅助 AI 答复已录入；后续变更在本文件追加版本小节，不静默改旧决定。  
> **工程目录：** `D:\AICivilization`（与正式 AI Market 研究仓库隔离）  
> **对外品牌：** AI Market Game · 副标题 AI Civilization  
> **远程仓库：** `git@github.com:CHAIN-PKU/AI_Market_Game.git`

---

## 协作方式

| 项 | 决定 |
|----|------|
| 开发与运行 | Windows 本地 D 盘；无云部署 MVP |
| Git | 独立仓库；短周期可运行提交；`pre-ux-3d` 标签为 3D 重构前基线 |
| 验收 | 产品方最终验收；另一位 AI 辅助玩法/视觉/方案审查 |
| 审查材料 | 截图、录屏、日志、变更摘要（另一位 AI 无法访问 localhost） |
| 通过标准 | 测试通过 ≠ 视觉/玩法验收通过 |

---

## A. 项目与仓库

1. **路径与命名：** 继续 `D:\AICivilization`；npm workspace `@ai-civ/*` 暂不重命名。首屏：**AI Market Game** — *Build a civilization. Let AI evolve.*  
2. **边界：** 与正式 AI Market 完全隔离；禁止改 Benchmark/正式路由。  
3. **Git：** 重构前打 `pre-ux-3d`；禁止强推覆盖未提交改动；不并行三条大型互依重构线。

---

## B. Vertical Slice

4. **文明数：** Slice = **单文明 · 8 Agent**；双文明引擎保留，UI 下一阶段。  
5. **创建流程：** 最小版 — 文明名 + 三制度模板（自由市场 / 公共研发 / 混合）；旗帜/主色/深度自定义延后。  
6. **观看演示：** 固定 seed + 引擎真实事件 **确定性回放**；可暂停/加速/跳过；非预录视频。  
7. **轮次：** Slice **5–7 轮**闭环；30 轮属正式 MVP。

---

## C. 引擎与前端

8. **事件：** 不重写引擎；先做 **Event Playback Adapter** 消费 `GameEvent`；缺类型再增量补。经济状态 **仅以引擎为准**。  
9. **竞标：** **逐 Agent 可重放**公开决策（参与/报价/能力/风险/合作意向/reason_summary/中标）；非 CoT；不要求每 Agent 一次 LLM。  
10. **性格：** `traits` 须影响行为（扩展 `riskTolerance`、`investmentPreference`、`cooperationPreference`、`specializationPreference` 等）；需测试。  
11. **公司/雇佣/合作竞标：** Slice **不做**；UI 不宣传未实现功能；预留事件接口。  
12. **双文明模式：** Slice 单文明；下一阶 **制度对照**（同条件分跑）；再后 **同池竞争**。  
13. **玩家发单：** 系统 **marketEscrow** 预算；奖励锁定；模拟任务明示；禁止无限印钞。

---

## D. AI / LLM

14. **Slice 大脑：** **Deterministic Mock**；Cursor IDE 非运行时大脑。  
15. **预算：** Slice **零付费 API**；LLM 开关默认关。  
16. **流式三层：** L1 地图气泡 + L2 事件面板 + L3 点击详情；长篇 Cursor SSE **不进玩家主流程**（可 DEV）。  
17. **校验：** 模型出结构化决策；**结算由引擎校验**；非法行为明确拒绝/记录，禁止静默改价冒充模型意图。

公开字段：`action`, `reason_summary`, `expected_reward`, `estimated_cost`, `risk_estimate`, `skill_relevance`, `outcome`。

---

## E. 3D 与素材

18. **素材：** Cursor 负责 CC0 检索与 `assets-manifest.json`；程序化占位仅 Walking Skeleton。  
19. **3D 依赖（React 19.1 已验证 peer）：**

| 包 | 锁定版本（2026-11-07 `npm view`） |
|----|-----------------------------------|
| `three` | **0.187.0** |
| `@react-three/fiber` | **9.8.2** |
| `@react-three/drei` | **10.7.9** |

安装后写入 `package-lock.json`；Walking Skeleton 里程碑再实际 `npm install`。

20. **地图：** 约 **20×20** 世界单位；必含：任务市场、Skill 店、Coding/Research/Design 工坊、公研中心、8 Agent、道路与装饰。  
21. **相机：** 35–45° 等距俯视；orbit + 约束边界；开场镜头为加分项非 P0。  
22. **移动端：** 非 Slice 验收；布局避免窄屏严重溢出。

---

## F. 前端架构

23. **状态：** React + API 为主；复杂时 **Zustand** 分三层：`SimulationState` | `PlaybackState` | `UIState`。  
24. **路由：** 新增 **`/play-3d`**；旧 UI **`/classic`**（或 dev 入口）；验收前不删。  
25. **Playback：** `packages/web/src/playback`；Vitest 契约：跳过动画不改变经济状态；不重复结算。  
26. **存档：** Slice 轻量本地档 + 事件可重放；完整 SQLite 属后续 MVP。

---

## G. 声音、性能、验收 P0/P1

27. **音效 P1：** 金币/升级/成功/失败；默认静音。  
28. **性能：** 降 DPR、关阴影/粒子（最小开关）。  
29. **P0 验收：** 见 `AGENTS.md` §验收清单。  
30. **测试：** 纯文档不跑全量；功能组结束跑 `npm test` + 浏览器走查。

---

## H. 流程

31. **一组任务** = 一个可独立验收的端到端能力。  
32. **审查：** Cursor 自测 + 里程碑产品方确认；关键模块一次正式审查。  
33. **设计稿：** 仓库内 `docs/UX_*`、`VISUAL_STYLE_GUIDE` + 截图；不阻塞于 Figma。

---

## 视觉方向（摘要）

低多边形微缩文明沙盘；温暖明亮；空间层次（地形厚度、道路、阴影）；建筑 silhouette 可辨识；Agent 有职业附件与行走/待机；动画由真实事件驱动；UI 像游戏不像 SaaS。

参考图（审查用）：`docs/reference/`（农场沙盘、职业角色、经营 UI 气质）。

---

## 实施顺序（冻结）

0 审查冻结 → 1 UX/视觉规范 → 2 3D Walking Skeleton → 3 Event Playback → 4 Vertical Slice → 5 深度扩展 → 6 正式 MVP。

**当前门禁：** 完成 Phase 0 文档 + `pre-ux-3d` 基线后，再开始安装 R3F 与场景代码。
