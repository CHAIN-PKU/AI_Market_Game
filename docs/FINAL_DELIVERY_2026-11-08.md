# AI Civilization MVP — 交付包（2026-11-08）

## 入口

- 本地：`http://127.0.0.1:5180/game`
- API：`http://127.0.0.1:3001`
- 分支：`feat/institution-lab`
- PR #3：https://github.com/CHAIN-PKU/AI_Market_Game/pull/3（Draft）

## 这版有什么

### 人物

- 8 个 Mixamo **glTF 原生 3D 居民**
- idle / walk（three.ws clip 重定向）
- wave / celebrate 一次性动作
- 512×768 Blender EEVEE 透明立绘
- 图鉴、人物设定卡、2400×1500 海报

### 竞争

- 预估成本 / 预计利润
- 履约声誉 / 举报惩罚
- 同域对手压力 / 报价下限
- 组队投标 + 70/30 分账
- 产能 / 档期 / 两轮任务
- 价格联盟 / 串标
- 联盟背叛 / 举报 / 声誉惩罚
- 赢家诅咒：报价不能低于成本线

### 制度实验

- 单轮改规则对比：报价人数/价差、组队、串标/举报
- 5 轮聚合：组队/串标/举报/平均报价
- 双文明 5 轮对抗：两个文明同场抢单，比较总到手、总税、平均中标价、基尼、组队、串标、举报、技能、唯一赢家
- 报告可导出 1600×1080 图片 + 分享文案

## 验证

- 模拟测试：`20/20`
- Web 测试：`12/12`
- Web build、server build 通过
- 5 轮 campaign 实际跑通

## 关键截图

- `docs/screenshots/visual-rebuild/idle-1920.png` — 3D 场景
- `docs/screenshots/visual-rebuild/cast-1920.png` — 8 人图鉴
- `docs/screenshots/visual-rebuild/celebrate-1920.png` — winner 庆祝
- `docs/screenshots/visual-rebuild/rich-bids-1920.png` — 组队/串标/成本/利润
- `docs/screenshots/visual-rebuild/institution-compare-1920.png` — 单轮制度对比
- `docs/screenshots/visual-rebuild/campaign-history-1920.png` — 5 轮聚合
- `docs/screenshots/visual-rebuild/experiment-card.png` — A/B 报告成品

## 资产与许可

- 角色：Mixamo / three.ws Character Library
- 动画：three.ws 公开 clip
- 项目内使用可以；**公开发行/商业化前需复核 Mixamo 当前条款**
- 详见 `docs/CHARACTER_ASSETS.md`

## 已知限制

- 动画是外部 clip 重定向，不是每个角色定制动画
- 部分角色贴图偏暗，已补正面光但仍有差异
- 5 轮 A/B 是确定性 mock provider，不是 LLM 自由博弈
- 飞书 DSH 群发正常；入站仍需应用侧 im:message.received 事件/权限
- drei `<Html>` 卸载时仍会打 `removeChild` 警告；不影响流程，已记录
- 没有录视频，按需求只发截图

## 常用命令

```bash
npm run dev:web
npm run dev:server
npm test
npm run demo:fixture
```

## 相关文档

- `docs/CHARACTER_ASSETS.md`
- `docs/COMPETITION_MODEL.md`
- `docs/VISUAL_REBUILD_2026-11-08.md`
- `docs/FINAL_ACCEPTANCE_2026-11-08.md`
- `docs/CHARACTER_3D_PIPELINE.md`

## 验收矩阵（2026-11-08）

| 目标 | 状态 | 证据 |
|---|---|---|
| 居民从 2D 纸片人换 3D | 完成 | 8 个 Mixamo GLB，`idle-1920.png` |
| glTF 原生动画 | 完成 | idle / walk / wave / celebrate |
| 更好看的立绘 | 完成 | 512×768 Blender 透明立绘，`cast-1920.png` |
| 真实报价 / 成本 / 利润 | 完成 | marketDepth fixture，面板显示成本/利润 |
| 声誉 / 对手压力 | 完成 | 报价面板 + 决策卡 |
| 组队 / 分账 | 完成 | Delta + Astra，70/30 |
| 产能 / 档期 | 完成 | durationRounds + busyUntilRound |
| 串标 / 背叛 / 举报 | 完成 | 串标标签、背叛标签、举报事件、声誉惩罚 |
| 制度差异 | 完成 | 单轮对比、5 轮聚合、双制度 A/B |
| 分享物料 | 完成 | 1600×1080 A/B 报告卡 + 文案 |
| 自动化测试 | 完成 | 20/20 模拟 + 12/12 web |
| 无视频 | 遵守 | 只发截图 |

## 20 轮最终交付快照

### 小岛

- 不规则海岸 + 跟随海岸的宽沙滩带（内侧干沙/外侧湿沙）
- 浅海环 + 三道波带 + 潮沫
- 礁石/海蚀柱/浮空岩底/低矮草坡
- 码头、船、灯塔、棕榈、海鸟、风车
- 金色时刻暖光、多层云

### 7 栋建筑

| 建筑 | 轮廓/功能/装饰 |
|---|---|
| 研究所 | 天文台塔 + 穹顶 |
| 程序坊 | 平屋顶 + 女儿墙 + 服务器/空调箱 |
| 市集 | 四柱棚顶 + 摊位 + 串灯 |
| 设计屋 | 平屋顶 + 三组锯齿天窗 |
| 公研仓 | 平屋顶 + 锯齿采光 + 筒仓/装卸台 |
| 居民里 | 前廊/二层 + 晾衣 |
| 技能铺 | 侧棚 + 工作台 |

所有建筑加石质墙基、角柱/横梁、角色门头招牌。

### 博弈

- 成本/利润/声誉/对手压力
- 组队 70/30、价格联盟、背叛、举报
- 产能/档期
- 策略随战绩/举报自适应
- 双文明同场抢单 + 5 轮 A/B 报告

### 验证

- 模拟 20/20
- Web 12/12
- Web build、server build 通过
- 最终截图：`docs/screenshots/visual-rebuild/island-buildings-1920.png`
- 无视频

### 已知限制

- 视觉仍是程序化低多边形，不是写实渲染；用户可继续给参考图
- 5 轮 A/B 仍是确定性 mock provider，不是 LLM 自由博弈
- 飞书群发正常；入站事件仍缺应用权限/事件订阅，不能自动收 @DSH
- 没有录视频，按要求只发截图

## 最新提交

- `bce8919` — 去掉 StrictMode，减少 Html 噪音
- `088c4d2` — 唯一 bid key + 最终 E2E 截图
- `23b5a2d` — 交付包 + 分享文案
- `9041628` — winner celebrate 验证
- `f310198` — 可导出 A/B 报告卡

## 已知非阻塞项

- drei `<Html>` 卸载时仍可能打 `removeChild` 警告；功能正常，已记录。
- 部分深色服装角色在场景中仍偏暗，已加正面补光。
- 飞书 DSH 收信权限未配置，当前只能单向推送。
- Mixamo 资产公开商用前需复核条款。
