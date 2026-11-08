# 审查包索引（第一关）

> 给外部审查者：这里是一条按顺序读的路径，所有结论都能追到代码或证据文件。
> 提交范围：PR #4（`feat/llm-gameplay-loop`，并入 `feat/institution-lab`）与 PR #5（`feat/rival-civilization`）。

---

## 1. 先看结论（3 分钟）

| 问题 | 答案 | 证据 |
|------|------|------|
| 主路径是实时引擎吗？ | **是**（本轮改的） | `AUDIT_REALTIME_GAP.md` §1 改动后对照；页面提示「引擎开始实时跑：第 N / 5 轮」 |
| 三轮连续跑得通吗？ | 通，且技能影响下一轮 | `EVIDENCE_GATE1.md` + `evidence/campaign-3-rounds.json` |
| 制度改动能解释吗？ | 能：谁的决策变了 + 钱去哪了 | `evidence/rule-diff-1920.png`、`evidence/rule-compare-full-1920.png` |
| 两种分辨率可读吗？ | 1920 / 1366 均无横向溢出 | `evidence/live-round-1920.png`、`evidence/live-round-1366.png` |
| 测试 | simulation 39 / web 12 全绿 | `npm test` |

---

## 2. 阅读顺序

1. `REVIEW_2026-11-08.md` —— 审查原文（本轮依据）
2. `AUDIT_REALTIME_GAP.md` —— **先看这份**：哪些是引擎、哪些曾是 fixture 回放、改了什么
3. `EVIDENCE_GATE1.md` —— 三轮连续 + 技能生效的数据表
4. `VISUAL_SPEC.md` —— 第二关的视觉规范（尚未实施）
5. `MULTIPLAYER_MODEL.md` —— 多人数据模型（A 路线设计稿）
6. `UI_POLISH_PLAN.md` —— 保留的 UI TODO 与已修/未修项

---

## 3. 代码入口（审查重点）

| 关注点 | 文件 | 说明 |
|--------|------|------|
| 主路径实时化 | `packages/web/src/game/GamePage.tsx` | `startDemo` 建 campaign；`nextRound` 推进 |
| 服务端进化计算 | `packages/server/src/index.ts` | `/api/demo/round` 返回 `evolution`（训练只在付得起时发生） |
| 训练机制 | `packages/simulation/src/economy/skills.ts` | `trainAbility`：40 金 / +4 能力 |
| 对赌 | `packages/simulation/src/economy/wager.ts` | 总额守恒有测试锁死 |
| 多人地基 | `packages/simulation/src/core/factory.ts` | `createCivilizationGame(specs[])` |
| 每 agent 决策 | `packages/simulation/src/agents/per-agent-llm-provider.ts` | 校验失败只降级该 agent，保留 `llm/fallback` 来源 |
| 规则对照拆分 | `packages/web/src/game/GameHud.tsx`、`InstitutionPanel.tsx` | `diffDecisions` + 「钱去哪了」 |

---

## 3.5 第二关进展（UI/UX 第一轮）

| 项 | 状态 | 证据 |
|----|------|------|
| 角色身份三件套（座右铭 / 性格色条 / 经济目标） | 完成 | `evidence/agent-identity-1920.png` |
| 竞标演出（报价逐条出现 + 中标金环与徽章） | 完成 | `evidence/winner-highlight-1920.png` |
| 政策卡后果预览（拖动即时显示到手/公共研发/技能含义） | 完成 | `evidence/rules-consequence-1920.png` |
| 1366×768 适配（改规则面板按钮曾被裁掉） | 完成 | `evidence/winner-1366.png`、`evidence/rules-1366.png` |
| 颜色令牌化 | 进行中：459 → 423 处十六进制；剩余按组件推进 | — |

## 4. 已知问题（不藏）

1. 1366×768 下操作排位于顶部，会压住公告板上沿（可接受，但记录在案）
   注：该分辨率下「改规则」面板底部按钮被裁的问题**已修**（矮屏压缩 + sticky 底栏）
2. 「私人买技能」支出按基础价 80 金/件估算，是量级近似，不是逐笔账本
3. 剧场台词仍是子 agent 预生成的脚本，不是每轮实时生成
4. 3D 场景加载后约 2.3 秒有一次 `removeChild` 报错（生产构建同样复现），
   已定位为 Suspense fallback 使用 drei `Html` 门户，**已修**；如仍复现请优先看这里

---

## 5. 自我评价（UI / 游戏性不足）

- **UI**：令牌化完成后一致性明显改善，但信息密度仍偏高；证据：1366 截图里左栏四张卡同时出现
- **游戏性**：单轮决策的"看头"仍偏弱——玩家主要在看数字，而不是看角色在做什么；
  剧场气泡是补这个短板的尝试，但台词与实时决策还没打通
- **最该先补的**：三个核心角色的性格差异要能被一眼认出（第二关第 1 项）

---

## 6. 复现命令

```bash
npm install
npm test                          # 39 + 12
npm run build -w @ai-civ/web
npm run dev                       # API 3001 + 前端 5173，打开 /game
# 静态包需要：
VITE_API_BASE=http://127.0.0.1:3001 npm run build -w @ai-civ/web
DSH_WEB_ORIGINS=http://127.0.0.1:5399 npm run dev:server
```
