# 场景参考：three.ws Diorama renderer

用户要求：按当前 Mixamo 3D 人物立绘的完成度找对应场景代码。

## 找到的参考

- [three.ws / src/diorama](https://github.com/nirholas/three.ws/tree/main/src/diorama)
- [renderer.js](https://raw.githubusercontent.com/nirholas/three.ws/main/src/diorama/renderer.js)
- [schema.js](https://raw.githubusercontent.com/nirholas/three.ws/main/src/diorama/schema.js)

它做的事情：

- 程序化浮空岛：顶面有起伏/rim 噪声，底部是收尖的岩石
- mood/palette 驱动天空、雾、灯光
- GLB 渐进 materialize，种子/光效
- 小尺度 diorama，不是大地图

## 我们已借鉴

- 不规则海岸（ShapeGeometry + 噪声）
- 岛底岩石收尖（本轮加的 rock underside + rim rocks）
- 沙滩带/湿沙/潮沫
- storybook 色彩分层

## 没有直接复制

- 未接它的 forge/LLM 场景生成后端
- 未用它的浮空岛相机/材质，保持我们现有 village 布局
- 未复制角色资产（角色仍是 Mixamo）

## 已借鉴光照

- 金色时刻天空/暖雾/暖环境光，参考 three.ws diorama 的 mood palette

## 下一步

- 从 renderer.js 借鉴 mood lighting / sky gradient，替换当前平面天空
- 用它的 `buildIslandGeometry` 思路做 undulating top，而不是平顶
- 建筑仍需独立设计，不能只靠道具

参考地址：
- https://github.com/nirholas/three.ws/tree/main/src/diorama
- https://github.com/nirholas/three.ws
