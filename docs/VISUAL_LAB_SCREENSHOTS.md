# Visual Lab 截图验收（A/B 对照）

## 运行

```powershell
cd D:\AICivilization
npm run dev:web
# 或仅前端：npm run dev -w @ai-civ/web
```

打开：http://127.0.0.1:5173/visual-lab

可选离线资源：`npm run assets:visual-lab`（将 GLB 写入 `packages/web/public/assets/glb/`）

## 相同条件（两方案必须一致）

- 分辨率：**1920×1080**
- 角色：**8 人**（Helix … Ember，见 `islandLayout.ts`）
- 建筑：**7 栋**（市集、技能铺、程序坊、研究所、设计屋、公研仓、居民里）
- 默认镜头：`LAB_CAMERA`（页内切换 A/B 不改变布局）

## 每个方案 3 张图

| 文件名 | 拍法 |
|--------|------|
| `main-1920x1080.png` | 进入方案后默认视角，含 HUD |
| `topdown.png` | 俯视，见全岛道路与建筑环 |
| `agent-closeup.png` | 拉近 **Helix**（左前方第一居民） |

保存路径：

```
docs/screenshots/visual-lab/kenney/
docs/screenshots/visual-lab/quaternius/
```

## 优缺点（填写模板）

### 方案 A · Kenney

- **优点**：
- **缺点**：

### 方案 B · Quaternius

- **优点**：
- **缺点**：

## 产品决策

选定后更新 `docs/DECISIONS.md` 的 `artDirection`，再按 `VISUAL_LAB_INTEGRATION.md` 接入 `/play-3d`。
