# AI Market Game

**Build a civilization. Let AI evolve.**

中文：你来制定经济制度，AI 居民自己抢单、赚钱、消费和投资；消费改变能力，能力改变下一轮的竞争结果。

---

## 这是什么？

**AI Market Game** 是一款 **AI 原生文明经济策略** 原型：玩家扮演 **制度设计师**，在共享任务市场中观察多个 AI Agent 如何竞标、工作、纳税、购买 Skill 并分化成长。

- **核心机制：** AI 的消费 = 自我进化（投资受能力、市场与制度约束，不是无脑加点）。
- **当前阶段：** 从「研究向 2D 仪表盘」重构为 **低多边形 3D 微缩沙盘 + 事件驱动演出**（见 `docs/DECISIONS.md`）。
- **与正式研究项目关系：** 本仓库与 **AI Market 正式 Benchmark / 生产代码完全隔离**，仅在 `D:\AICivilization` 与 GitHub 独立演进。

---

## 项目简史

| 时间 | 里程碑 |
|------|--------|
| 2026-11 初 | Monorepo 建立：`@ai-civ/simulation` 双文明引擎、Vitest 不变量、CLI `sim:dual` |
| 同期 | Fastify API + React Web（**classic**）：双文明抽屉 UI、导览、剧场/心路、practice / Cursor 研发路径 |
| 2026-11 中 | 产品方 + 多 Agent 协作定稿：**单文明 Vertical Slice**、R3F 3D、Mock 大脑、Playback 与经济解耦 |
| 2026-11-07 | Phase 0：决策文档、视觉规范、Git 远程 `CHAIN-PKU/AI_Market_Game`、标签 **`pre-ux-3d`** |

**研发向说明：** Cursor SDK 长跑式 SSE 仅适合 `/classic` 或开发模式；玩家主路径将采用 **公开 `reason_summary` + Mock/结构化决策**，见 `docs/EVENT_CONTRACT.md`。

---

## 仓库结构

```
packages/simulation   # 经济模拟引擎（权威状态）
packages/server       # Fastify API、对局、可选 Cursor 提供方
packages/web          # React UI — classic + 未来的 /play-3d
docs/                 # 决策、UX、视觉、事件契约、场景设计
AGENTS.md             # Cursor 协作与分阶段 TODO
```

---

## 快速开始

**要求：** Node.js 20+

```powershell
cd D:\AICivilization
npm install
npm test
npm run dev
```

| 地址 | 用途 |
|------|------|
| http://127.0.0.1:5173 | 游戏前端（当前默认 classic） |
| http://127.0.0.1:3001 | API（勿当主页面） |

无 UI 预览双文明 30 轮：

```powershell
npm run sim:dual
```

可选 `.env`（复制 `.env.example`）：practice 默认；研发可配 `CURSOR_API_KEY`。**Slice 验收为零付费 API。**

---

## 文档索引

| 文档 | 内容 |
|------|------|
| [DECISIONS.md](docs/DECISIONS.md) | 产品/技术正式决定 |
| [AUDIT_PHASE0.md](docs/AUDIT_PHASE0.md) | 现状审查与差距 |
| [UX_VERTICAL_SLICE.md](docs/UX_VERTICAL_SLICE.md) | 新手与闭环流程 |
| [VISUAL_STYLE_GUIDE.md](docs/VISUAL_STYLE_GUIDE.md) | 美术与验收 |
| [UI_LAYOUT_HUD.md](docs/UI_LAYOUT_HUD.md) | HUD 布局 |
| [EVENT_CONTRACT.md](docs/EVENT_CONTRACT.md) | 引擎事件 → 动画 |
| [SCENE_DESIGN_v1.md](docs/SCENE_DESIGN_v1.md) | 主场景 v1 |
| [GAME_DESIGN.md](docs/GAME_DESIGN.md) | 经济规则摘要 |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | 模块边界（部分将更新为 R3F） |
| [AGENTS.md](AGENTS.md) | 开发任务与验收 |

视觉参考：`docs/reference/`

---

## Git 与协作

- **远程：** `git@github.com:CHAIN-PKU/AI_Market_Game.git`
- **基线标签：** `pre-ux-3d`（3D/UX 重构前可运行快照）
- **分支建议：** 短周期功能提交；重大里程碑由产品方确认后合并
- **推送前：** `npm test`；涉及 UI 时附浏览器截图  
- **Windows 免重复输 SSH 口令：** 见 [docs/GIT_WINDOWS.md](docs/GIT_WINDOWS.md)

---

## 许可证与素材

游戏代码：仓库私有策略以 GitHub 为准。  
3D 素材计划使用 **CC0**（Kenney / Quaternius 等），详见 `packages/web/public/assets/assets-manifest.json`。

---

## 一句话愿景

> 玩家设计规则，AI 自己创造历史。

请先阅读 `AGENTS.md` 中的 **第 0–1 组** 状态，再拉取最新代码开始第 2 组（3D Walking Skeleton）。
