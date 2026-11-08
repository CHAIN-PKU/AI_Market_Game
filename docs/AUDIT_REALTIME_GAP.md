# 实时性审计：哪些是引擎真跑，哪些是预生成 fixture

> 触发：2026-11-08 产品审查明确要求「不要把预生成回放称作完整实时游戏」。
> 这份审计先说清现状，再给改造路径。结论先行：**主路径是 fixture 回放，不是实时引擎。**

---

## 1. 结论表

| 用户动作 | 现在实际发生什么 | 是否调引擎 | 证据 |
|---------|-----------------|-----------|------|
| 打开 `/game` | 读打包的 `bid-demo.fixture.json` | ❌ | `GamePage.tsx` 顶部 `import fixtureJson` |
| 点「先看一轮」 | 按 `points`（fixture 里的时间线）逐个 cue 推进 | ❌ | `startDemo()` 只做 `setCueIndex` / `setPlaying`，不 fetch |
| 播放 / 暂停 / 单步 | 只在时间线上移动 | ❌ | `togglePlay` / `stepOnce` |
| 点「看 5 轮」 | 调 `/api/games` + `/advance` | ✅ | `campaign` 相关代码走 API |
| 改规则后「再跑一轮」 | 调 `/api/demo/round` | ✅ | `InstitutionPanel.tsx` fetch |
| 投资进化面板 | 读 fixture 里预计算的 `evolution` 段 | ❌ | `scripts/add-evolution-demo.mjs` |
| A 模式面板 | 读 fixture 里预跑一轮的 `aMode` 段 | ❌（数据来自引擎，但不是现场跑） | `scripts/add-a-mode-demo.mjs` |

**一句话**：只有「看 5 轮」和「改规则再跑一轮」是实时的；玩家最常点的「先看一轮」是回放。

---

## 2. 这意味着什么

- 审查里说的「至少三轮连续经济状态」「上一轮买的 Skill 影响下一轮」当前**没有被主路径证明**
- 之前视频里的「到手 64 → 训练 → 能力 40→44」是**预计算后播放**，不是现场决策
- 之前我说过「真机跑的」，那指的是**录屏时点了按钮**，但那个按钮背后是 fixture 回放 —— 这个表述不准确，特此纠正

---

## 3. 改造路径（第一关：可玩性与经济可信性）

### 3.1 让主路径实时

`/api/demo/round` 已经存在（服务端 `buildBidDemoFixture` 现场跑引擎），把它接成主路径即可：

1. 点「先看一轮」→ `POST /api/demo/round`（带上当前 rules + seed）
2. 用返回结果替换前端显示（bids / winner / settlement / skillPurchase / nextRound）
3. 播放动画只消费结果，不再自带经济数据
4. 失败时红灯阻断（项目纪律：禁止静默 fallback）

### 3.2 三轮连续 + Skill 影响下一轮

- 新增 `POST /api/demo/campaign`：连跑 3 轮，把每轮的 wallet / ability / skill / 中标 串起来
- 断言：第 N 轮买的 Skill，让第 N+1 轮的 `successProbability` 与报价能力真的变化
- 补测试：同一 seed 下三轮结果可复现；改规则后对照可复现

### 3.3 制度对照要能解释「为什么变」

现在只有汇总数字。要拆成：
- 哪几个 Agent 改了决策（报 / 不报 / 组队 / 观望）
- 私人投资 vs 公共研发池的变化
- 谁获得了新能力
- 哪些订单的结果变了
数据来源：两轮 `events` 的 diff + 每 Agent 决策结构的 diff。

---

## 4. 交付材料模板（每轮固定）

1. 变更说明（本文件 + PR 描述）
2. commit / PR / 主要 diff
3. 1920×1080 与 1366×768 真实截图
4. **不剪辑、无字幕**的完整操作录屏
5. 30–90 秒对外短 Demo
6. 关键经济事件与前后状态 JSON
7. 测试报告
8. 三个最重要的已知问题
9. 自己对 UI/UX 与游戏性的不足评价

---

## 5. 先把「已知问题」摆出来（本轮）

1. 主路径是 fixture 回放，不是实时（本文件就是证据）
2. 制度对照只有汇总数字，没有「谁改了决策」的解释
3. 三个 Agent 的经济性格还没有明显到「不看数字也能认出谁是谁」
