# 主场景设计方案 v1 — 单文明沙盘

> 世界尺度：约 **20 × 20** 单位（1 单位 ≈ 1m 视觉）  
> 相机：等距 40°，`position [12, 14, 12]` 看向 `[0,0,0]`（实现时微调）

---

## 1. 区块规划（鸟瞰）

```text
        [ Research 实验室 ]     [ 公研中心 ]
                 \               /
    [ Design ] ---+  中央广场  +--- [ Coding ]
                 /    + 市场    \
        [ Skill 店 ]         [ 住宅带 ]

     🚶 ×8 spawn 在住宅带东侧道路
```

- **中央广场 + 任务市场：** （0, 0）地标，最大 footprint 4×4  
- **道路：** 十字主路 + 环路，宽 1.2u，米色材质  
- **绿化：** 树木沿外圈，不挡点击  

---

## 2. 建筑占位（Walking Skeleton）

| ID | 位置 (x,z) | footprint | 备注 |
|----|------------|-----------|------|
| `bld-market` | 0, 0 | 4×4 | 任务旗顶点 |
| `bld-skill` | -6, 2 | 3×3 | 商店橱窗 |
| `bld-code` | 5, -5 | 3×4 | 冷色条灯 |
| `bld-research` | -5, -6 | 3×3 | 圆顶 |
| `bld-design` | 6, 5 | 3×3 | 彩色屋顶 |
| `bld-public-rd` | -2, 6 | 4×3 | 共享设施 |
| `bld-homes` | 7, 0 | 6×2 | 8 Agent 逻辑出生点 |

程序化阶段：组合 box + cylinder；屋顶 second mesh；统一 `MeshStandardMaterial`。

---

## 3. Agent 摆放

- 初始：homes 前一排 `spacing 1.5`  
- `agentId → mesh ref` Map  
- 路径：简单直线 lerp（Slice），后接 navmesh  

---

## 4. 比例规范

| 对象 | 高度 (y) |
|------|----------|
| Agent | 1.2 |
| 民宅 | 1.5 |
| 工坊 | 2.0 |
| 市场 | 2.5 |
| 公研 | 3.0 |

---

## 5. 素材路线（CC0）

Walking Skeleton：**程序化** + manifest 登记 `procedural-placeholder`。

美术验收版优先 **同一 Kenney 包**（如 City Kit Suburban）统一缩放至上表；备选 Quaternius Modular Sci-Fi **仅作科技装饰**，不与农舍风硬混——若混用需统一调色后 `VISUAL_STYLE_GUIDE` 再审。

详见 `packages/web/public/assets/assets-manifest.json`。

---

## 6. 进场镜头（P1）

1. 高空 → 2. 平移到市场上空 1.5s → 3. 玩家 orbit 接管  

Slice 可用 **fade-in** 代替。

---

## 7. 验收截图清单

- 全场景默认视角  
- 隐藏 UI 标签纯建筑识别  
- 8 角色选中态  
- 市场任务高亮态  
