# 游戏初衷（对齐 AI Market / AI Civilization）

## 玩家要看到什么

1. **真实 Agent 决策**：抢单、报价、买技能由 Cursor Agent（或 LLM API）输出 JSON + **reasoning**，不是写死的剧本。
2. **可读的心路历程**：每位居民为什么盯这单、是否想组队/分成/耍滑头，应在「心路」里逐条可见。
3. **制度 + 市场实验**：改税、共享技能、发悬赏 → 看两座文明谁更能活，不是看 UI 堆字。

## 当前实现状态

| 能力 | 状态 |
|------|------|
| Cursor 全自动 `AI_CIV_AGENT_MODE=cursor` | ✅ `Agent.prompt` + 心路 |
| Handoff / `civ:advance` | ✅ 同一 SDK，手动触发 |
| 练习模式（无 Key） | ⚠️ 规则机器人 + **模拟心路**（明示非 Live） |
| 居民能力分化（编/研/设） | ✅ 专精不同数值 |
| 协作竞标、分成、欺诈结算 | 🚧 叙事与 prompt 已预留，引擎下一迭代 |
| LLM 执行任务交付 | 🚧 成/败仍用引擎公式 |

## 不要做什么

- 不要把 **practice** 包装成「真 AI」。
- 不要在没有 reasoning 时堆 16 条重复剧场句。

## 接入 Cursor（玩家）

```env
CURSOR_API_KEY=cursor_...
AI_CIV_AGENT_MODE=cursor
```

重启 `npm run dev`，顶栏应显示 **Cursor 居民（真实 Agent 决策）**，心路标签为 **Cursor Agent · 实时**。
