# Game Design Summary (MVP)

完整产品愿景见立项交接文档；此处仅记录 **当前引擎已实现** 的规则子集。

## 文明制度（可配置）

- `taxRate` — 任务毛收入税率
- `publicResearchShare` — 税额进入公共研发池比例
- `skillOwnership` — `private`（Agent 自持）| `shared`（购入后全文明共享）
- `allowFreeHire` / `allowCollaboration` — 已在类型中预留；协作雇佣下一迭代实现

默认对照实验：

- **文明 A**：低税、私有 Skill（自由市场）
- **文明 B**：高税、高公共研发比例、共享 Skill

## 任务市场

- 领域：Coding / Research / Design
- 每轮生成若干开放任务，两文明 **共享同一市场** 竞标
- 验收：能力 vs 难度 → 成功率（概率表），成功发放 `reward`

## Skill

- 目录见 `packages/simulation/src/core/skills.ts`
- 购买提升对应领域有效能力，影响后续任务成功率
- 公共研发池自动购买缺失的基础共享 Skill（文明 B）

## 竞争

- 每 `competitionInterval`（默认 10）轮写入 `competition_checkpoint` 事件
- **不硬编码** 哪种制度获胜 — 仅记录指标

## 胜利与 fun（MVP 不实现）

正式游戏的赛季、战争、外交见长期文档；当前只验证经济闭环与制度差异。
