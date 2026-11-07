# Visual Lab 截图验收（A/B 对照 · v2）

## 运行

```powershell
cd D:\AICivilization
npm run dev -w @ai-civ/web
```

打开：http://127.0.0.1:5173/visual-lab

素材已入库（`packages/web/public/assets/glb/`，CC0，见 `docs/ASSETS_LICENSE_MANIFEST.json`），**离线可跑**；`npm run assets:visual-lab` 仅用于重新拉取。

## 相同条件（两方案必须一致）

- 分辨率：**1920×1080**
- 角色：**8 人**（Helix … Ember，见 `islandLayout.ts`）
- 建筑：**7 栋**（市集、技能铺、程序坊、研究所、设计屋、公研仓、居民里）
- 镜头：页内 **默认 / 俯视 / 近景** 三个预设按钮（`VIEW_PRESETS`），A/B 共用
- 尺度：统一世界单位，见 `assetScale.ts`（Agent 高 ≈ 1.35；建筑按角色 2.4–3.2；树 2.0–3.2）

## 每个方案 3 张图

| 文件名 | 拍法 |
|--------|------|
| `main-1920x1080.png` | 方案默认镜头（页内「默认」） |
| `topdown.png` | 俯视（页内「俯视」） |
| `agent-closeup.png` | 人物近景（页内「近景」） |

保存路径：

```
docs/screenshots/visual-lab/kenney/
docs/screenshots/visual-lab/quaternius/
```

## v2 修复记录（2026-11-07）

1. **蒙皮模型实例化修复**：`gltf.scene.clone(true)` → `SkeletonUtils.clone`。此前 8 个 Agent 全部叠在原点，画面只剩 1 人。
2. **统一世界单位**：新增 `visual-lab/assetScale.ts`，按 GLB 实测高度把角色/建筑/树/石归一到同一尺度；删除散落的 magic number。
3. **岛屿构图**：草地厚度（土坡）+ 广场环形道路 + 水面；相机三预设；建筑按半径环布并朝向中心。
4. **Quaternius 材质统一**：原库 `metallicFactor = 0.4` 且颜色偏暗，导致建筑/角色发黑；现统一到 cozy 色板并关闭金属度（`cozyMaterials.ts`）。
5. **Idle 动画**：`AnimatedGlbInstance` 接入 `AnimationMixer`，播放 GLB 内 idle 剪辑（Kenney 32 clips / Quaternius 9 clips）。
6. **HUD 清理**：去掉玩家界面的开发词（GLB / 不接 Simulation / 素材外链）；新增镜头预设按钮。

## 技术对比（v2 实拍）

| 维度 | A · Kenney | B · Quaternius |
|------|-----------|----------------|
| 游戏感 | 轻快、统一、偏「郊区小镇」 | 建筑体量与门窗细节更像「文明城镇」 |
| 角色识别 | 8 人清楚可辨，职业靠配色/配件弱区分 | 8 人清楚可辨，服装/皮肤更接近角色 |
| 建筑辨识 | 7 栋均为郊区住宅，**功能剪影弱**（素材限制） | 体量/屋顶差异更明显，但部分建筑偏大 |
| 性能 | 资产约 3.0 MB | 资产约 10.7 MB |
| 扩展成本 | 尺度统一、替换简单 | 需持续按资产校准（已配置化） |

**当前判断（待负责人拍板）：** B 的建筑更有「文明感」，A 更轻且角色更统一。两套均已达到可对比的静态质量；若选 B，下一步优先替换「市集/公研仓」这类体量不匹配的建筑模型。

## 已知遗留（下一轮）

- Kenney 建筑功能剪影弱：需在建筑上加招牌/旗帜/职能装饰（2D 或附加 mesh）。
- Quaternius 建筑部分体量偏大，广场边缘略拥挤。
- 截图脚本未入库；当前可用页面镜头预设按钮手动复现，或用 Playwright/puppeteer 驱动。

## 产品决策

选定后更新 `docs/DECISIONS.md` 的 `artDirection`，再按 `docs/VISUAL_LAB_INTEGRATION.md` 接入 `/play-3d`。
