# 居民角色风格指南 — Disney-inspired Cartoon Appeal

> 2026-11-08 · 只参考迪士尼式卡通的比例、表情、线条、剪影、大鞋大眼等 **design language**；不复制任何受版权角色。

## 1. 一句话

**2.5 头身、圆润剪影、大眼高光、夸张大鞋、mitten 手、明确角色色。**

## 2. 比例

- 头身比：约 **2.5 头身**（不是 4 头身写实，也不是大头娃娃）
- 头：宽而圆，脸颊略收，留出下巴
- 身体：上窄下宽，轻微梨形
- 腿：短而粗，站姿稳定
- 脚：**夸张大圆头厚底鞋**，比真实脚大 1.3–1.5 倍
- 手：**mitten 手型**，有拇指和袖口，不做五根细手指

## 3. 脸

- 大眼：白色眼白 + 有色虹膜 + 深色瞳孔 + 双高光
- 上眼线、眼睑褶皱、下睫毛
- 眉毛短而弯，能表达挑眉/认真
- 鼻子只做一个小点/小弧，不做写实鼻梁
- 嘴：微笑 / 挑眉 / 张嘴笑三种
- 腮红低透明度，不抢眼睛

## 4. 剪影

- 先看黑色剪影能不能认出角色
- 8 个人靠 **发型 / 体型宽窄 / 姿势 / 配件** 区分
- 配件：程序坊耳机、研究所眼镜/白大褂、设计屋贝雷帽
- 禁止只靠换衣服颜色区分

## 5. 姿势

- idle 三种：双手叉腰 / 单手叉腰 / 自然垂手
- 走路：2 帧交替，手臂反向摆
- 移动方向：水平翻转
- 地面：blob shadow，不画写实脚底阴影

## 6. 色盘

- 皮肤 8 种，覆盖暖白到深棕
- 头发 8 种，含黑、棕、金、灰
- 角色色：程序坊青、研究所紫、设计屋橘
- 背景低饱和米/绿，角色保持高对比

## 7. 已试过的工具/资产

| 工具 | 结果 |
|---|---|
| [Kenney Toon Characters](https://kenney.nl/assets/toon-characters) CC0 | 偏简约，只做比例参考 |
| [Kenney 3D Protagonists](https://kenney.nl/assets/animated-characters-protagonists) CC0 | 模型/脸更好，FBX→GLB 动画在 three.js 仍 T-pose，未上线 |
| Blender 4.2.1 | 用于 FBX→GLB、NLA 合并、烘焙姿势；重定向仍未打通 |
| [Rive](https://rive.app/) | 2D 骨骼动画候选，尚未接入 |

3D 记录：`docs/CHARACTER_3D_PIPELINE.md`

## 8. 实现位置

- `packages/web/src/game/characterArt.ts` — 运行时 Canvas 角色/立绘/海报
- `packages/web/src/game/GameAgent.tsx` — 场景 sprite、移动、两帧走路
- `packages/web/src/game/CastPanel.tsx` — 图鉴/设定卡/海报
- `packages/web/src/game/agentLore.ts` — 口头禅/小传

## 9. 验收截图

- `docs/screenshots/visual-rebuild/cast-1920.png`
- `docs/screenshots/visual-rebuild/sheet-astra-1920.png`
- `docs/screenshots/visual-rebuild/cast-poster.png`
- `docs/screenshots/visual-rebuild/idle-1920.png`

## 10. 不要做

- 不复制迪士尼角色/服装/脸
- 不把 3D T-pose 硬塞进场景
- 不用写实比例 + 卡通大眼混搭
- 不靠缩小角色来掩盖比例问题
