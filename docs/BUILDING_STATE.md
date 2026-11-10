# 建筑状态绑定 — 经济事件改变世界

> 2026-11-08 · Mac 接手增量
> 目标：建筑不只是静态剪影，而是能反映这一轮「谁在干活、谁买了技能、市集有没有成交」。

---

## 1. 绑定规则

| 建筑 | 状态 | 视觉变化 |
|---|---|---|
| 市集广场 | 本轮已结算 | 货台上出现 3 枚金币 |
| 技能铺 | 已购买技能（skill 步骤后） | 橱窗变亮、技能卡发光、暖色点光 |
| 程序坊 | 执行中且任务属于 coding | 服务器 LED 由暗变亮 |
| 研究所 | 执行中且任务属于 research | 穹顶淡青自发光 + 点光 |
| 公研仓 | 制度为文明共享 | 共享旗变青绿（私人制为珊瑚红） |
| 居民里 | 本轮已结算 | 凉棚灯笼亮起 + 暖色点光 |
| 设计屋 | — | 画架保持静态（本轮无 design 任务） |

状态来自 `fixture` + `step`，不新增任何经济数值。

---

## 2. 证据

- 待机：`docs/screenshots/buildings/state-idle-1920.png`
- 执行中（程序坊 LED 亮）：`docs/screenshots/buildings/state-working-1920.png`
- 技能步骤（技能铺亮 + 居民里灯笼）：`docs/screenshots/buildings/state-skill-1920.png`

---

## 3. 实现

- `packages/web/src/game/GameScene.tsx`：`BuildingProps` 接收 `fixture` / `step`，分发到各道具组件。
- 使用 `meshStandardMaterial.emissive` + `pointLight` 做状态差异；没有引入新贴图或运行时依赖。
- 状态优先级：`working` > `settled` > 默认；技能铺只在 `skill` 步骤后点亮。
- 动画仍未做：不做闪烁/粒子，避免影响低端机与「动画不结算」边界。

---

## 4. 边界

- campaign 任务现在按 coding → research → design 轮换；research 穹顶状态已实机（见 campaign 截图），design 屋只有静态画架，暂无专属状态灯。
- 没有建筑升级/成长；只是同一轮内的状态灯。
- 不影响结算、金币、技能价格；纯展示层。

---

## 5. 下一刀

1. 每轮任务类型轮换（coding → research → design），让研究所/设计屋状态可见。
2. 技能铺点亮时长与事件 cue 绑定（当前按 step）。
3. 市集成交金币与 `treasuryBreakdown` 联动。
