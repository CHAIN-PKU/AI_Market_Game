# AGENTS.md — Cursor / 协作 Agent 执行手册

> **产品：** AI Market Game（工程目录 `D:\AICivilization`）  
> **决策源：** `docs/DECISIONS.md`（优先于本文件冲突处）  
> **经验库：** `AGENTS_experience.md`（验收反馈、视觉顺序、玩家文案纪律）  
> **远程：** https://github.com/CHAIN-PKU/AI_Market_Game

---

## 角色与门禁

| 角色 | 职责 |
|------|------|
| Cursor（本仓库开发） | 实现、自测、文档、截图/录屏/日志 |
| 产品方 | **最终**玩法与视觉验收 |
| 辅助 AI | 审查摘要、截图、方案（无 D 盘访问） |

**门禁：** Phase 0 文档 + `pre-ux-3d` 标签已建立 → 方可 `npm install` R3F 并写场景代码。

---

## 开发纪要（必须遵守）

1. **一次任务** = 一个会话内可独立验收的功能（见下方「一组任务」）。  
2. 纯文档改动 **不跑**全量测试；动引擎/playback/3D **必须**跑相关测试 + 浏览器走查。  
3. **审查认真一遍**；里程碑等产品方确认再进下一阶段。  
4. 本地 `npm run dev` 调通再 push。  
5. **Trunk / walking skeleton**；不并行三条互依大重构。  
6. **禁止静默 fallback**；加载失败要红条阻断。  
7. 决策 `reason_summary` 与引擎一致；结算只信 simulation。  
8. 动画与结算解耦；跳过动画不改变 `GameState`。

---

## 结构化 TODO

状态图例：`[ ]` 未开始 · `[~]` 进行中 · `[x]` 完成

### 第 0 组 — 审查与冻结

- [x] `docs/DECISIONS.md`
- [x] `docs/AUDIT_PHASE0.md`
- [x] `docs/reference/` 参考图
- [x] Git 初始提交 + tag `pre-ux-3d`
- [x] `README.md` / `AGENTS.md`
- [ ] 产品方签收 Phase 0

### 第 1 组 — UX 与视觉规范（文档）

- [x] `docs/UX_VERTICAL_SLICE.md`
- [x] `docs/VISUAL_STYLE_GUIDE.md`
- [x] `docs/UI_LAYOUT_HUD.md`
- [x] `docs/EVENT_CONTRACT.md`
- [x] `docs/SCENE_DESIGN_v1.md`
- [x] `assets-manifest.json` 壳
- [ ] 产品方签收文案与布局

### 第 2 组 — 3D Walking Skeleton（代码）

- [x] 安装 `three@0.187.0` `@react-three/fiber@9.8.2` `@react-three/drei@10.7.9`
- [x] 路由 `/`、`/play-3d`，保留 `/classic`
- [x] 场景：地形+光+影+相机约束（`SCENE_DESIGN_v1`）
- [x] 7 建筑占位 + 8 Agent 可点击
- [x] 右侧详情绑定 `GameState`（`createGame` 文明 A）
- [ ] 全屏截图提交视觉里程碑 **#1**（产品方）

### 第 3 组 — Event Playback

- [ ] `packages/web/src/playback/` 队列 + adapter
- [ ] Vitest 契约四维（见 `EVENT_CONTRACT.md`）
- [ ] 暂停/单步/加速/跳过 UI 接线
- [ ] 演示 `demo-seed-42.json` + 首屏「观看演示」

### 第 4 组 — Vertical Slice（P0 玩法）

- [ ] 首屏 + 创建文明（三模板）
- [ ] 旁白向导（可跳过）
- [ ] marketEscrow 玩家发单
- [ ] 逐 Agent 竞标演出 + 公开 `reason_summary`
- [ ] 执行/成败/税收 HUD
- [ ] 自主 Skill 购买 + 下轮能力对比
- [ ] 制度法典轻量面板
- [ ] **5–7 轮**可玩通；截图集 + 事件日志验收

### 第 5 组 — 扩展（P1+）

- [ ] traits 扩展 + 行为测试
- [ ] 市场阶段；建筑成长绑定事件
- [ ] 时间线；音效；低性能档
- [ ] 单文明→制度对照双跑 CLI/UI

### 第 6 组 — 正式 MVP

- [ ] 30 轮稳定；完整存档 SQLite
- [ ] 默认入口切 `/play-3d`；classic 降级

---

## P0 验收清单（摘自决策 §29）

1. 完整新手流（创建→发单→竞标→结算→投资→下轮变化→制度）  
2. 可交互 3D 主场景  
3. 8 Agent 可识、可点、数据一致  
4. 任务发布（模拟+escrow）  
5. 可见竞标与决标解释  
6. 引擎驱动执行与成败  
7. 金币与税收  
8. 自主买 Skill；能力/预测变化可见  
9. 制度影响行为  
10. 暂停/单步/快进/跳过动画  
11. `npm test` 通过  
12. 无阻断性 Bug  

---

## 里程碑交付物（给产品方 + 辅助 AI）

每组至少：

- `CHANGELOG` 式摘要（本组做了啥、没做啥）  
- 1920×1080 全屏截图（按 `VISUAL_STYLE_GUIDE` §10）  
- 若动画：短录屏或关键帧三连  
- 经济样例：任务 id、bids、中标、结算、skill、能力前后  

---

## 常用命令

```powershell
cd D:\AICivilization
npm install
npm test
npm run dev              # http://127.0.0.1:5173
npm run sim:dual
```

---

## 禁止项（Slice）

- 运行时默认 Cursor/付费 LLM  
- 用动画改经济结果  
- UI 宣传公司/合作（未实现）  
- 未验收即删 `/classic`
