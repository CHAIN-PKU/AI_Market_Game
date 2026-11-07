# AGENTS_experience — 开发与验收经验库

> 供 Cursor / 辅助 AI / 产品方共用。冲突时以 `docs/DECISIONS.md` 为准。  
> **更新：** 2026-11-07 并入正式验收反馈与视觉轮次安排。

---

## 1. 产品四问（每轮开发自问）

1. 玩家能不能看懂 Agent **为什么**这样竞标/花钱？（公开理由 ≡ 引擎参数）  
2. 劳动与消费是否 **真的** 改变下一轮能力与成败概率？（不能只改 UI 数字）  
3. 玩家定的制度是否 **真的** 改变行为与指标？  
4. 除技术新颖外，是否 **想再开一局**？

任一否 → 不加建筑、不加 Agent 数量、不加 LLM 调用。

---

## 2. 协作与交付纪律（摘自你的开发经验）

| 原则 | 执行方式 |
|------|----------|
| **一次任务** = 本会话可验收的一整块 | 例：静态主场景截图达标，而非「整个前端」 |
| **一组任务** = Agent Team 里程碑 | 例：Walking Skeleton PR；下一组 Cozy 视觉 |
| 重位检查在 **整组结束** | 纯文档不跑全量 test |
| **审查认真一遍** | 里程碑用截图 + 事件日志 + diff |
| 本地 `npm run dev` 调通再 PR | |
| **Walking skeleton → trunk** | 不并行三条互依大重构 |
| **少静默 fallback** | API 失败红条；不偷偷退回假数据 |
| **动画不改结算** | Playback 与 `GameState` 解耦 |
| Mock / LLM 明确标注 | 玩家不见 CoT、不见 `GameState` 术语 |

---

## 3. 验收材料标准（产品 §八）

每组里程碑向上提交：

- commit hash + `CURRENT_STATUS.md` 增量  
- 1920×1080：**全屏**、**仅地图**、**角色卡**、（若有）竞标/SKill  
- 真实 **事件 JSON 或终端 sim 日志**，禁止摆拍经济  
- `npm test` / `test:all` 输出  
- 录屏仅当流程 **真实可玩** 时录制；**禁止** 用未实现功能假演

---

## 4. 2026-11-07 Walking Skeleton 轮 — 教训

### 做对了

- `/play-3d` 接真 `createGame()`  
- `/classic` 保留  
- PR #1 作工程骨架，未宣称视觉终验

### 产品否决点（须下一轮优先）

- Agent = 球+棍；建筑 = 彩盒；岛被裁切  
- HUD 像 SaaS；右侧大片空；开发术语外露  
- 无竞标/赚钱/投资 **可见因果**  
- **先视觉静态验收，再 Event Playback**（顺序不可颠倒）

### 角色卡（玩家语言）

- 不说「编/研/设」→ 说 **写程序 / 做研究 / 做设计**（分数可保留）  
- 不展示 `civ-a-agent-7`  
- 展示 **一句性格独白** + **投资倾向**（由 traits/钱包推导，不冒充 LLM 决策）  
- 数值必须来自 API；文案说明「还没开工」当 stats 为 0

### 设计令牌（Cozy HUD 下一轮）

```
页面 #F8F3E8 · 卡片 #FFF9ED · 主字 #253C3A · 辅字 #71847B
草绿 #79AE87 · 科技青 #4C9FA8 · 金币 #E7B65A · 强调 #D77F54 · 描边 #DDCFB5
```

素材：Kenney / Quaternius **同一系列** GLB；禁止立方体终版。

---

## 5. 开发顺序（冻结至产品改口）

```text
Phase A  仓库审计 + CURRENT_STATUS     ← 当前
Phase B  feat/visual-cozy-hud 静态截图验收
Phase C  Event Playback + /play-3d 接 advance
Phase D  Vertical Slice 9 步闭环（Mock 大脑）
Phase E  双文明对照、存档、音效 P1…
```

**禁止：** 在 Phase B 未过前堆 Playback 经济新逻辑。  
**禁止：** 用动画改 `wallet` / `abilities`。

---

## 6. 给辅助 AI（无本机访问）审查话术

当只有截图时，检查：

- 是否 **整岛可见**、8 人可找、市场/Skill 店可辨认（无文字）  
- 角色卡是否 **像居民** 而非数据库行  
- 是否 **无** GameState/Walking Skeleton 等开发词  
- 是否 **没有** 假竞标 UI（若引擎未跑回合）

当只有日志时，检查：

- `bid_placed` → `task_assigned` → `task_completed` → `skill_purchased` 链  
- 同 seed 可复现  
- Skill 前后 `resolveTaskOutcome` 概率是否变化（sim 层）

---

## 7. Git / PR 约定

- `main` = 稳定文档 + classic  
- 骨架 PR 可 merge 或保留；**视觉** 单独分支  
- push：`gh` + HTTPS；大粒度 push  
- 合并前：产品方点验收截图

---

## 8. 开放问题（待产品拍板）

- [ ] PR #1 是否 merge 到 `main` 再开 visual 分支  
- [ ] 静态视觉过线后，默认入口是否从 `/classic` 改为 `/play-3d`  
- [ ] 截图由谁上传到 issue / 文档附件

---

*维护者：开发 Agent 按里程碑追加 §4 小节，不删历史教训。*
