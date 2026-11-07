# Visual Lab → `/play-3d` 接入方案（待风格选定）

## 前置条件

- 产品已在 `/visual-lab` 完成 **Kenney vs Quaternius** 视觉验收。
- `docs/DECISIONS.md` 记录选定方案（`artDirection: kenney | quaternius`）。

## 架构分层（不改动 Simulation）

```
packages/simulation     GameState、回合、竞价、技能（不变）
packages/server         API（不变）
packages/web/
  visual-lab/           静态对照（保留）
  play3d/
    sceneConfig.ts      建筑槽位、职能 ID（已有）
    CivilizationScene   事件驱动场景（逐步替换程序化 mesh）
    loaders/
      assetRegistry.ts  scheme → GLB path + scale
      AgentModel.tsx    useGLTF + 可选 AnimationMixer
      BuildingModel.tsx
```

## GameState → 3D 映射

| GameState | 3D |
|-----------|-----|
| `civilizations[0].agents[]` | 每个 agent 一个 `AgentModel` 实例 |
| `agent.displayName` | HUD 与选中卡（已有） |
| `agentSpecialty(agent)` | 服装/配件 variant（帽子、工具 GLB 或 material tint） |
| `agent.skills` | 升级 VFX / 挂件（只读，不改结算） |
| 建筑职能（market/skill/…） | `BUILDING_SLOTS` 与 `sceneConfig` 对齐 |
| 市场/竞价事件（Playback 阶段） | 位置插值、气泡 UI；**不** 改 `resolveTaskOutcome` |

## 迁移步骤（建议顺序）

1. **复制布局**：`visual-lab/islandLayout.ts` 数值合并进 `play3d/sceneConfig.ts`（单源 truth）。
2. **引入 `assetRegistry`**：根据 `artDirection` 返回 Kenney 或 Quaternius URL。
3. **替换 `ProceduralBuilding` / `AgentAvatar`**：保留旧组件为 `fallback=procedural` 直至 GLB 全绿。
4. **光照**：复用 `LabLighting` → `CivilizationScene`。
5. **HUD**：`Play3DPage` 布局向 `LabHud` 靠拢（左公告、右角色、底栏）。
6. **事件 Playback**：在动画层监听 `EventContract`，经济层零改动。

## 性能与加载

- `useGLTF.preload` 按职业/建筑批量预载。
- 同一 GLB 多实例：`scene.clone(true)`（与 visual-lab 一致）。
- 可选：Draco（Kenney GLB 已嵌入纹理，一般不必）。

## 验收（接入后）

- `/play-3d` 连接真实 API，点选 agent 仍显示人物卡。
- 推进回合（Classic）后，钱包/技能数与 3D 挂件一致。
- 动画仅反映状态，**不改变** 金币与技能结算。
