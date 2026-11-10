# 事件契约 — 引擎 → Playback → 3D/HUD

> **原则：** Simulation `GameState` 为唯一真相；Playback 只解释、不结算。

---

## 1. 现有 `GameEventKind` → 播放意图

| Event kind | Playback 意图 | L1 气泡示例 | 3D 动作 |
|------------|---------------|-------------|---------|
| `task_posted` | `SHOW_TASK_CARD` | 新活儿来了！ | 卡飞向市场 |
| `bid_placed` | `AGENT_BID` | 我想试试这单 | Agent→市场 |
| `bid_declined` | `AGENT_PASS` | 这单风险高，算了 | 摇头/停留 |
| `task_assigned` | `BID_WON` | 中标！ | 高亮 winner |
| `task_completed` | `TASK_SUCCESS` | 交差了！ | 工坊动画 |
| `task_failed` | `TASK_FAIL` | 搞砸了… | 沮丧状态 |
| `tax_collected` | `TAX_FLOW` | （可选） | 金币→国库 |
| `skill_purchased` | `SKILL_BUY` | 买了一项新本事 | 商店→角色 |
| `rules_updated` | `RULES_FLASH` | 制度更新了 | 法典 UI |

`story`：仅 HUD 文本，无强制 3D。

### 公开决策字段（Explanation Layer 输入，2026-11-07 起）

`bid_placed` / `bid_declined` payload 必须携带同一套公开因子，UI 只能读取这些字段：

| 字段 | 含义 |
|------|------|
| `agentId` / `taskId` / `bidAmount?` | 谁、哪单、报价 |
| `expectedQuality` | 该居民对交付质量的预测 |
| `successProbability` | 由能力 / 难度 / 最低能力共同决定 |
| `riskComfortFloor` | 个人风险安全线（由 `riskTolerance` 决定） |
| `expectedReward` / `expectedValue` | 奖励与风险调整后的价值 |
| `personalGoalId` / `personalGoalLabel` | 当前目标（如攒钱买某 Skill） |
| `observedCompetitors` | 仅公开履历（更强同行人数、累计收入最高者） |
| `reasonFactors` | 结构化因子数组 `{ key, label, value }` |
| `reasonCode`（仅 declined） | `risk_above_comfort` \| `too_little_upside` \| `lower_priority` |

**约束：** Presentation Layer 只能把这些字段转成短对白/气泡；不得改写报价、结算、金币或 Skill；
不得解释未被观察到的信息；不得用随机文案替代真实决策。

---

## 2. Slice 增量（引擎或合成层）

在不大改引擎前，可在 **advance 响应 `lastTraces`** 合成逐步 `PlaybackStep[]`：

```typescript
interface PlaybackStep {
  id: string;
  round: number;
  agentId?: string;
  action: 'bid' | 'pass' | 'assign' | 'work' | 'pay' | 'tax' | 'invest' | 'skill';
  reason_summary: string;      // 公开，与决策一致
  expected_reward?: number;
  estimated_cost?: number;
  risk_estimate?: 'low' | 'mid' | 'high';
  skill_relevance?: number;
  outcome?: string;
  payload: Record<string, unknown>; // bidAmount, taskId, etc.
}
```

**校验：** Mock 生成 `reason_summary` 必须与 `bid_placed` payload 一致；单测覆盖。

---

## 3. 三层展示映射

| 层 | 来源 | UI |
|----|------|-----|
| L1 | 当前 step `reason_summary` 截断 | 世界气泡 |
| L2 | Playback 队列 | 左栏事件列表 |
| L3 | step 全字段 + Agent 状态 | 右栏详情 |

---

## 4. Vitest 契约（必须）

1. `skipAllAnimations(stateBefore) === stateAfter`  
2. `pause` 不触发第二次 `advance`  
3. `speed 2x` 不丢 step  
4. 同一 `skill_purchased` 不重复扣款展示  

路径（已落地 v1）：`packages/web/src/game/playback.test.ts`

---

## 4.5 cue-by-cue 落地（2026-11-08）

- `buildPlaybackCues(fixture)` 把 `rawEvents` 映射到 11 个 narrative step；`flattenPlaybackCues` 再展开为 19 个逐事件点。
- 播放坞显示 `事件 X / Y`；单步/回退按事件推进，跨 step 时叙事卡片同步切换。
- 「跳过动画」= 直接到 `next`，只改播放状态；测试断言 fixture 完全不变。
- 7 条契约测试通过：队列映射、逐事件覆盖全部步骤、skip 不改数据、pause 不推进、2x 只改时长、单 skill 只一个 cue。
- 尚未做：跳跃到任意事件、事件级 3D 动作绑定。

## 5. 演示 replay

- 文件：`packages/web/src/playback/fixtures/demo-seed-42.json`  
- 来源：`npm run sim` 导出事件 + 合成 steps  
- 入口：首屏「观看演示」

---

## 6. DEV-only

长篇 Cursor SSE `/mind` **不映射** 到玩家 L1/L2；仅 `/classic` 或 `?dev=cursor`.
