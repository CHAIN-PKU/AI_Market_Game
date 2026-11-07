# 7 栋建筑功能剪影 — 隐藏文字验收

> 2026-11-08 · Mac 接手增量
> 目标：不读标签，也能从屋顶/道具分辨每一栋建筑的功能。

---

## 1. 结果

| 建筑 | 角色 | 可辨识剪影 |
|---|---|---|
| 市集广场 | market | 红白条纹遮阳棚 + 水果货台 + 木箱 |
| 技能铺 | skill | 青绿雨棚 + 发光橱窗 + 三张技能卡 |
| 程序坊 | coding | 黑色服务器堆 + 4 条 LED + 木箱 |
| 研究所 | research | 穹顶 + 望远镜 + 天线 |
| 设计屋 | design | 画架（三色颜料）+ 凳子 |
| 公研仓 | public-rd | 高杆共享旗（红/金）+ 木箱 |
| 居民里 | homes | 木露台 + 凉棚 + 桌椅 |

道具全部用低多边形几何体，颜色沿用 HUD 的纸/木/青绿/珊瑚/金币色，不引入新素材或运行时依赖。

证据：

- 隐藏标签：`docs/screenshots/buildings/silhouettes-unlabeled-1920.png`
- 显示标签：`docs/screenshots/buildings/silhouettes-labeled-1920.png`

---

## 2. 怎么复验

1. 打开 `/game`
2. 右上角齿轮 → 开发者信息
3. 「建筑标签（剪影验收）」→ 点「隐藏标签」
4. 关闭面板，看 7 栋建筑是否仍可区分

也可以直接在 DevTools 注入：

```css
.bld-sign { display: none !important; }
```

---

## 3. 实现位置

- `packages/web/src/game/GameScene.tsx`
  - `BuildingProps`：按 `slot.role` 分派
  - `MarketStall` / `SkillDisplay` / `CodingServers` / `ResearchDome` / `DesignEasel` / `PublicFlag` / `HomesTerrace`
- 道具挂在建筑 group 下，随 `slot.position` / `slot.rotationY` 一起面向广场中心；不需要改 GLB。

---

## 4. 边界

- 目前是**静态剪影**，不随经济状态变化（例如技能铺不会因为有人买技能而亮灯）。
- 没有碰撞体，居民路径不会绕开摊棚；MVP 可接受。
- 不是最终美术，只是功能可读性验证；后续可替换为正式道具模型。

---

## 5. 下一刀

1. 让建筑状态与事件绑定：技能铺亮灯、研究所穹顶投影、市集挂出当日成交。
2. 建筑遮挡/居民路径避让。
3. `/play-3d` 复用同一套道具语言，统一调色板。
