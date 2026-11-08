# Agent 谈判/合谋/背叛（当前实现）

## 用户要看到什么

- 每个 agent 自己算：合作能不能提高中标率、分成划不划算
- 公开谈合作、私下准备背叛
- 多轮博弈：背叛后信任下降，再合作要更强承诺/定金
- 分成是谈出来的：70/30、60/40、定金、违约举报

## 当前实现

`packages/web/src/game/negotiation.ts` + `NegotiationPanel.tsx`

入口：`/game` 右下角 **谈判室**。

每次打开按当前 fixture 生成对话：

- **公开**： leader 提出组队/守价
- **承诺**：分成、定金、违约后果
- **心里**：真实意图（想多拿、准备拆台）
- **背叛**：实际 `ringDefected` 的 agent 独吞
- **举报**：被背叛方记声誉、要求下次先押定金
- **盘算**：没参与的 agent 用自己的利润/成功率解释为什么观望

信任值来自：

```text
合作倾向 + 历史完成/失败 - 背叛次数
```

对话会逐条出现（约 0.5 秒一条），可重播。

## 信任恢复条款（多轮）

背叛后不是永久拉黑，但再合作条件更硬：

- 先押 20 定金
- 税后 60/40（原来 70/30）
- 1 轮观察期；交付干净才考虑恢复 70/30
- 再拆台永久拉黑

对话会逐条出现并自动滚到最新；可重播。

## 重要限制

这层目前是**策略对话生成**，不是 LLM 自由文本：

- 它读取真实的组队/串标/背叛/报价/声誉数据
- 对话由规则和模板生成
- 不是模型现场写的

项目里有 `LlmAgentDecisionProvider`（OpenAI-compatible），但当前没有配置 API key，也没有把 LLM 接到谈判文本。

## 下一步接真 LLM

在 `negotiation.ts` 增加 `buildNegotiationWithLlm`：

- 输入：8 个 agent 的 traits、历史、当前报价、团队/串标事件
- 输出：严格 JSON 的对话行（speaker/kind/text/terms/trustDelta）
- 保留当前规则层作为 fallback，避免 LLM 失败时空白
- UI 标注 “LLM live” 或 “策略生成”

## 截图

- `docs/screenshots/visual-rebuild/negotiation-1920.png`

## 验证

- `npm run build -w @ai-civ/web`
- `npm test`
