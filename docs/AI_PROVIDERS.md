# 游戏里到底用的是哪些「AI」？

## 为什么要用 Cursor？

**实验设计：** 同一份 `@cursor/sdk` 既用来 **搭建** 游戏，也用来 **扮演** 文明居民。  
写代码的 Agent 和抢单的 Agent 是同一类 Cursor Agent，只是 prompt 不同（「改代码」vs「你是文明统治者」）。

| 角色 | 是什么 |
|------|--------|
| **Cursor 里的对话 Agent** | 你正在聊天的助手、工程师 |
| **游戏居民（推荐）** | `Agent.prompt()` / `cursor:play` — **Cursor SDK 本地 Agent** |
| **OpenAI 兼容 API** | 备用（`AI_CIV_AGENT_MODE=openai-hybrid`） |
| **Mock 规则** | **仅** `npm test` 自动化，**玩家路径默认不用** |

任务成/败仍是引擎公式（下一步才接 LLM 交付）。

## 三种玩家模式

### 1. `cursor`（全自动，推荐）

`.env`：

```env
CURSOR_API_KEY=cursor_...   # Dashboard → Integrations
AI_CIV_AGENT_MODE=cursor
```

网页点「下一步」→ 服务器直接调 Cursor SDK → 居民显示 **Cursor / Live AI** 和 reasoning。

### 2. `handoff`（默认：无 Key 时）

没配 `CURSOR_API_KEY` 时自动进入。

1. 网页点「下一步」→ 黄条提示 + 写出 `runtime/handoff/<gameId>-request.json`
2. 在 **Cursor 终端** 或 **对聊天 Agent 说**：

   ```powershell
   npm run cursor:play -- --game <对局ID>
   ```

3. Cursor Agent 读市场、扮演两文明、提交竞标 → 再点「下一步」或脚本自动 step → 轮次前进

这就是「用 Cursor 当游戏角色」的手动触发版；聊天里的 Agent 和执行 `cursor:play` 的是同一 SDK。

### 3. OpenAI 兼容（可选）

```env
OPENAI_API_KEY=...
AI_CIV_AGENT_MODE=openai-hybrid
```

## Mock 去哪了？

只在 **Vitest** 里验证经济规则。**不要**用 mock 做玩法实验。

## 安全

- Key 在 `.env`，不进 Git
- Agent 只能返回竞标 JSON；改钱包仍由引擎校验
