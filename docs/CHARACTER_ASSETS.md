# 居民 3D 角色资产 — Mixamo / three.ws Character Library

## 结论

`/game` 的居民已从 2D 纸片人替换为 **8 个 glTF 原生 3D 角色**。每个角色带完整骨骼、贴图和一个内嵌 idle 动画，直接由 `useGLTF` + `useAnimations` 播放，没有 FBX 重定向问题。

## 来源

角色来自 [three.ws Character Library](https://three.ws/character-library) 的 Mixamo 集合，原始来源为 Adobe Mixamo。仓库只保留运行所需的本地 GLB 和缩略图。

| 场景角色 | 资产 | 文件 |
|---|---|---|
| Astra | Arissa | `arissa.glb` |
| Boreal | Medea | `medea-by-m-arrebola.glb` |
| Cinder | AJ | `aj.glb` |
| Delta | Alex | `alex.glb` |
| Echo | Claire | `claire.glb` |
| Flux | Ty | `ty.glb` |
| Grove | Akai | `akai-e-espiritu.glb` |
| Helix | Lola | `lola-b-styperek.glb` |

## 许可

- Mixamo 资产由 Adobe 提供，Mixamo 服务条款允许在游戏/项目中使用；**不把原始资产当作独立素材包再分发**。
- 这份仓库是原型/比赛项目；如果后续要公开发行或商业化，需由项目负责人复核 Mixamo/three.ws 的当前条款。
- 没有使用迪士尼受版权角色；之前 2D 版本只参考 design language。

## 动画

每个 GLB 内嵌一个 `mixamo.com` 动画（idle）。移动时叠加程序化的腿/臂摆动 + 上下浮动（`GameAgent.tsx`），不是下载的 walk clip；下一步可换成真实 walk/run 动画。

## 缩略图

`public/assets/mixamo/thumbs/*.png` 由原缩略图去背景得到，用于图鉴/人物设定卡/海报。因为原图分辨率只有 220px，放大到 1920 卡面会偏软；追求印刷级可再做 512/1024 的离屏渲染。

## 对比

- 旧：2D Canvas 纸片人，8 套手绘，风格统一但细节少、动作只有 2 帧。
- 新：3D Mixamo 角色，真实骨骼/贴图/idle，细节和体积感明显更强；但风格不再统一为同一种卡通，且步行待补。
