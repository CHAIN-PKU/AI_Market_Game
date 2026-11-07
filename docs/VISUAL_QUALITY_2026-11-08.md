# 视觉升级 — 从低多边形到风格化卡通

> 2026-11-08 · 回应「2.5D 不够好看、人物不清晰、提高分辨率」
> 参考原神的**渲染思路**（分层阴影、卡通光照、边缘光、高饱和、角色轮廓清晰），不复制其素材或私有 shader。

---

## 1. 这轮改了什么

### 角色

- 角色从 Kenney mini-figure 换成 **Quaternius casual / worker**（自带 Idle / Walk 动画，人体比例更接近角色而非积木）。
- 按材质名重上色：肤色、发色、按职业（coding / research / design）区分衣服颜色。
- 角色材质换成 **3 阶 toon ramp**（硬边卡通明暗），保留面部与衣服的清晰色块。
- 加按距离缩放的眼睛/嘴贴片（distanceFactor），默认视角是小点，聚焦特写时放大，近看能读出表情。
- 角色高度 1.68，镜头拉近；1366 下按舞台宽高比自动拉远，避免岛屿被裁。

### 渲染

- Canvas：`dpr=[1.5, 2]`、antialias、`ACESFilmicToneMapping`、exposure 1.08。
- 光照：暖色 key + 冷色 fill + 青色 rim light，`SoftShadows`、`ContactShadows`、4096 shadow map。
- 环境：`Sparkles` 微光粒子、雾、天空；CSS vignette + 右上暖光叠加。
- 相机：默认更近（15.4 / 20.8，fov 40），窄舞台自动拉远；三性格决策步骤自动切到角色正面特写（fov 34），说完再回岛屿。

### 分辨率

- CSS 1920×1080，deviceScaleFactor=2 → **3840×2160** 实际截图。
- 1366×768 也重新验证，岛屿完整在框内。

---

## 2. 证据

| 内容 | 文件 |
|---|---|
| 升级后 1920 | `docs/screenshots/visual-hq/after-1920.png` |
| 升级后 1366 | `docs/screenshots/visual-hq/after-1366.png` |
| 升级后 3840×2160 | `docs/screenshots/visual-hq/after-2x-3840.png` |
| 角色 2x 近景 | `docs/screenshots/visual-hq/characters-2x.png` |
| 决策特写（Astra） | `docs/screenshots/visual-hq/focus-astra-2x.png` |
| 升级前（Kenney 低模） | `docs/screenshots/mac-verify/2026-11-08-game-1920.png` |

---

## 3. 为什么不是「原神同款」

- 当前资产是 CC0 低多边形包，没有原神级别的角色模型、面部贴图、法线/材质分层。
- 原神的角色渲染依赖多层阴影、面部 SDF、描边、Bloom、DOF 等自定义管线；本仓库没有引入私有 shader。
- 试过 `@react-three/postprocessing` 的 Bloom/Vignette：在 1366/2560 的 headless WebGL 下 EffectComposer 输出异常（画面空白），已移除，避免为了 glow 牺牲可用性。
- 目前是「风格化卡通 + 软阴影 + 边缘光 + 高 DPI」的近似，不是 1:1 复刻。

参考阅读：

- [UnityGenshinToonShader](https://github.com/kaze-mio/unitygenshintoonshader)
- [《原神》部分渲染效果分析](https://www.gameres.com/874408.html)
- [Genshin rendering technology on Console](https://indie-guider.games/article/DevStudy-Genshin-Impact)
- [Three.js anime shader](https://zaneatega.github.io/Three-js-Anime-Shader/)

---

## 4. 代价与边界

- DPR 2 + 4096 阴影对低端机有成本；后续需要「画质档」开关（高/中/低）。
- 面部是简单贴片，不是绑定骨骼的面部动画；近看仍能看出低模。
- 建筑仍是 Kenney/Quaternius 低模；这轮只强化了角色、光照、镜头与色彩，没有重做建筑资产。
- 没有 Bloom/DOF/描边；这三项是下一步视觉上限的关键。

---

## 5. 下一刀

1. **描边（inverted hull）+ 可选 Bloom**：在 1920 下验证稳定后再开；配画质档。
2. **角色资产升级**：更精细的 CC0/自建角色，带面部贴图与头发分层。
3. **建筑材质分层**：屋顶/墙面/木头三套 toon 材质，减少“塑料感”。
4. 画质档：DPR 1 / 1.5 / 2、阴影 1024/2048/4096。
