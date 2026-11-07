# 事件契约 — 引擎 → Playback → 3D/HUD

> **原则：** Simulation `GameState` 为唯一真相；Playback 只解释、不结算。

---

## 1. 现有 `GameEventKind` → 播放意图

| Event kind | Playback 意图 | L1 气泡示例 | 3D 动作 |
|------------|---------------|-------------|---------|
| `task_posted` | `SHOW_TASK_CARD` | 新活儿来了！ | 卡飞向市场 |
| `bid_placed` | `AGENT_BID` | 我想试试这单 | Agent→市场 |
| *(待增)* `bid_declined` | `AGENT_PASS` | 这单风险高，算了 | 摇头/停留 |
| `task_assigned` | `BID_WON` | 中标！ | 高亮 winner |
| `task_completed` | `TASK_SUCCESS` | 交差了！ | 工坊动画 |
| `task_failed` | `TASK_FAIL` | 搞砸了… | 沮丧状态 |
| `tax_collected` | `TAX_FLOW` | （可选） | 金币→国库 |
| `skill_purchased` | `SKILL_BUY` | 买了一项新本事 | 商店→角色 |
| `rules_updated` | `RULES_FLASH` | 制度更新了 | 法典 UI |

`story`：仅 HUD 文本，无强制 3D。

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

路径（计划）：`packages/web/src/playback/__tests__/contract.test.ts`

---

## 5. 演示 replay

- 文件：`packages/web/src/playback/fixtures/demo-seed-42.json`  
- 来源：`npm run sim` 导出事件 + 合成 steps  
- 入口：首屏「观看演示」

---

## 6. DEV-only

长篇 Cursor SSE `/mind` **不映射** 到玩家 L1/L2；仅 `/classic` 或 `?dev=cursor`.
