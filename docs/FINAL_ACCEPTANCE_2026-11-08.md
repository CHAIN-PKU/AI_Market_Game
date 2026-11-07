# AI Civilization — Mac 接手验收页

> 验收时间：2026-11-08 · 接手人：DSH（Mac mini, macOS 26.6.2 arm64）
> 仓库：`CHAIN-PKU/AI_Market_Game`
> 分支：`feat/institution-lab`（从 `feat/visual-cozy-hud` @ `3a861ab` 切出）
> PR：**#3** https://github.com/CHAIN-PKU/AI_Market_Game/pull/3（Draft，未合并）
> 最新代码提交：`83e65db`；验收文档随后落盘。

---

## 0. 一分钟结论

`/game` 已经能完整演出一轮 AI 经济，并支持 **5 轮文明、制度实验、逐事件播放、落盘恢复、文明编年史与导出**。

- 测试：**31/31**（simulation 19 + web 12）
- 构建：simulation / server / web 全部通过
- 视觉：Quaternius 角色 + toon + 描边 + 决策特写 + 高/中/低画质档
- 证据：1920 / 1366 / 3840×2160 截图、事件 JSON、编年史导出

P0 五项均有可运行版本，**最后一项 `/game`→`createGame/advance` 是 demo adapter，不是经典双文明 GameStore**（见 §6）。

---

## 1. 如何验收

```bash
cd <repo>
npm install --cache "$PWD/.npm-cache"
npm run build -w @ai-civ/simulation
npm test                              # 31/31
npm run build -w @ai-civ/web
npm run dev -w @ai-civ/server         # API 3001
npm run dev -w @ai-civ/web -- --port 5180 --strictPort
# http://127.0.0.1:5180/game
```

- `/game` 默认 fixture 可离线播放；制度实验 / 5 轮文明 / 编年史需要 API 3001。
- campaign 落盘在 `runtime/campaigns/`（已 gitignore）。
- 视觉画质在右上角齿轮 → 开发者信息 → 高/中/低。

---

## 2. 可演示剧本

1. 打开 `/game`，点市集公告板「发布第一笔任务」。
2. 播放：任务公告 → Astra 放弃 → Delta 报价 71 → Grove 报价 79 → Delta 中标 → 执行 → 结算 → 买技能 → 能力 40→48。
3. 暂停/单步/回退/2x/跳过；播放坞显示 `事件 X/19`。
4. 点「制度实验」：税率 35% → 重跑 → Delta 税后 65，买不起 80 金技能，能力停在 40。
5. 点「开 5 轮文明」：连续 5 轮，任务按 coding → research → design 轮换；钱/技能/国库累积。
6. 刷新页面：campaign 从 `localStorage + /api/games/:id` 恢复。
7. 点顶栏「文明 N/5」：编年史表格；可导出 Markdown/JSON、复制分享文案。

---

## 3. P0 对照

| P0 | 状态 | 证据 |
|---|---|---|
| `/game` 接真实 advance | ✅ demo adapter：`/api/games {demo:true}` + `/advance` | `docs/CAMPAIGN.md` §3 |
| 制度面板 + 行为差异 | ✅ 税率/公共研发/技能归属/种子 | `docs/INSTITUTION_LAB.md` |
| 7 栋建筑剪影 | ✅ 隐藏文字可辨 + 状态灯 | `docs/BUILDING_SILHOUETTES.md`、`BUILDING_STATE.md` |
| 右侧档案节奏 | ✅ 决策记录置顶，1080 一屏 | `docs/MAC_TAKEOVER_2026-11-08.md` §3.4 |
| 国库/税金拆解 | ✅ 本任务/其他任务/公共研发 | `docs/screenshots/treasury/` |

---

## 4. 额外完成

- **Event Playback**：`rawEvents → 19 个事件点`，暂停/单步/回退/跳过/2x；7 条契约测试。`docs/EVENT_CONTRACT.md`
- **5 轮 campaign**：真实 `runSingleRound`，钱包/技能/国库承接；JSON 落盘 + API 重启恢复；`docs/CAMPAIGN.md`
- **文明编年史**：每轮任务/中标/报价/税/技能/国库；自动打开；Markdown/JSON/分享导出；`docs/CAMPAIGN.md` §2.5/2.7
- **视觉**：Quaternius 角色、toon、描边、决策特写、DPR 2、ACES、soft/contact shadow、画质档；`docs/VISUAL_QUALITY_2026-11-08.md`
- **任务域轮换**：coding → research → design，domain-aware 技能文案。

---

## 5. 证据索引

- 视觉：`docs/screenshots/visual-hq/after-1920.png`、`after-1366.png`、`after-2x-3840.png`、`focus-astra-2x.png`、`quality-panel-1920.png`
- 制度：`docs/screenshots/institution-lab/`
- 国库：`docs/screenshots/treasury/`
- 建筑：`docs/screenshots/buildings/`
- 5 轮/编年史：`docs/screenshots/campaign/`
- 播放：`docs/screenshots/playback/`
- 大白话 UI：`docs/screenshots/plain-ui/`
- 演示视频：`docs/recordings/ai-civ-demo-2026-11-08.mp4`
- 事件 JSON：`docs/evidence/institution-high-tax.json`
- 接入报告：`docs/MAC_TAKEOVER_2026-11-08.md`

---

## 6. 已知边界（下一棒重点）

1. **两套游戏状态**：`/api/games` 的经典 `GameStore`（双文明）与 demo campaign 并存；demo 用同一 `/api/games` 路由但不是同一个 store。
2. **存档**：campaign 是 `runtime/campaigns/*.json`，没有 SQLite/版本迁移；删目录即丢。
3. **轮次**：固定 5 轮、每轮一张玩家任务；没有 5–7 轮可配置、市场阶段、公司/雇佣/合作、多人。
4. **Agent/LLM**：默认确定性 Mock，零付费 LLM；没有真实 LLM 大规模调用。
5. **视觉**：CC0 低模，没有原神级角色/材质；Bloom 在 1366/2560 下不稳定已移除；描边使角色 draw call 翻倍。
6. **测试**：29 条单测/契约测试通过，但没有 Playwright E2E / CI 视觉回归；1366 左侧长列表仍可能滚动。
7. **PR**：#3 仍是 Draft，未合并；按交接规则未合并、未强推 main。

---

## 7. 下一棒优先级

1. 统一经典 `GameStore` 与 demo campaign（一个 `/api/games` 状态模型）。
2. Playwright E2E：5 轮 + 刷新恢复 + 制度重跑 + 导出。
3. 公司/雇佣/合作最小原型，验证「组织」是否带来新策略。
4. 更精细角色资产 / 建筑材质分层；保留画质档。
5. 存档 SQLite + 编年史导出服务端版本。

---

## 8. 协作记录

- 所有进展通过 **DSH bot** 单聊发给陈润材（非 Claude bot、非群 @）。
- 分支/PR 只做增量，不合并、不关闭、不强推 `main`。
- 运行数据 `runtime/active-game.json` 未提交；`runtime/campaigns/` 已忽略。
