# 接手审计报告 — DeepSeek Harness（2026-11-07）

> 审计对象：`D:\AICivilization`（AI Market Game / AI Civilization）
> 分支：`feat/visual-cozy-hud` @ `868e547` · 审计人：DeepSeek Harness
> 原则：只记录实测结果；「代码存在 / 构建通过 / 画面达标 / 可玩」四件事分开陈述。

---

## 0. 结论摘要

| 项 | 实测结果 |
|----|----------|
| 本地工程 | 真实存在、可运行；与远程 GitHub 仓库一致（`origin` 可达） |
| Git 工作区 | 分支 `feat/visual-cozy-hud`，HEAD `868e547` = `origin/feat/audit-and-persona-ui`；**12 个已改文件 + 一批未跟踪视觉成果**（含 41 个 GLB，13.7 MB） |
| 测试 | `npm test` **7/7 通过**（simulation） |
| 构建 | `npm run build -w @ai-civ/web` **通过**（JS 1.355 MB / CSS 34 KB，>500 kB 警告） |
| Visual Lab | 可运行，Kenney / Quaternius 均可加载；**发现并修复一个阻断级渲染 bug**（8 个 Agent 骨骼失效、全部叠在原点，画面只见 1 人） |
| 视觉质量 | **仍未达验收标准**：比例、站位、构图、HUD 细节需下一轮处理（见 §5） |
| GitHub 能力 | **commit / push / PR 已实测可用**（凭据有效、仓库 admin/push 权限）；本轮未执行任何提交/推送/PR |

---

## 1. 环境与 Git 实测

### 1.1 环境

| 项 | 值 |
|----|----|
| 工作目录 | `D:\AICivilization` |
| Node / npm | v24.15.0 / 11.12.1 |
| 远程 | `https://github.com/CHAIN-PKU/AI_Market_Game.git` |
| Git 凭据 | Windows Credential Manager（GCM）已存 `github.com` / `CHAIN-PKU`，可用 |
| `gh` CLI | **未安装**（PR 可改用 GitHub API，无需安装） |
| 端口占用 | `3001`（API）、`5173/5174/5175`（Vite）已有监听，**非本轮启动**，疑似历史开发实例；本轮临时实例 `5176` 已关闭 |

### 1.2 远程分支（`git ls-remote`）

| 远程分支 | Hash | 说明 |
|----------|------|------|
| `main` | `3669b9a` | **无** `/play-3d` |
| `feat/play-3d-skeleton` | `620b61f` | PR #1（open，未合并） |
| `feat/audit-and-persona-ui` | `868e547` | 本地 HEAD 即此提交 |

`origin/main...HEAD` = `0 behind / 2 ahead`。

### 1.3 工作区（`git status`）

- **已修改 12 个文件**（+570 / −184）：`index.css`(+331)、`Play3DPage`、`AgentAvatar`、`CivilizationScene`、`ProceduralBuilding`、`sceneConfig`、`AgentDetailPanel`、`HomePage`、`main.tsx`、`package.json`、`assets-manifest.json`、`runtime/active-game.json`
- **未跟踪**：`packages/web/src/visual-lab/`（10 文件）、`play3d/IslandEnvironment.tsx`、`docs/` 5 篇视觉文档、`scripts/`、`packages/web/public/assets/glb/`（41 个 GLB，13.7 MB）、`docs/screenshots/`（本轮新增）
- `runtime/active-game.json` **被 Git 跟踪且内容变了**（gameId / updatedAt）；按交接规则属于运行数据，**不应提交**
- `.env` 已被 `.gitignore` 忽略（现有 key 为 Cursor 相关，无 GitHub token 环境变量）

---

## 2. 文档阅读清单

**已读：** `AGENTS.md`、`AGENTS_experience.md`、`docs/DECISIONS.md`、`docs/CURRENT_STATUS.md`、`docs/OPEN_SOURCE_3D_RESEARCH.md`、`docs/VISUAL_LAB_INTEGRATION.md`、`docs/VISUAL_LAB_SCREENSHOTS.md`、`docs/VISUAL_ACCEPTANCE_v1.md`、`docs/VISUAL_STYLE_GUIDE.md`、`docs/UI_LAYOUT_HUD.md`、`docs/EVENT_CONTRACT.md`、`docs/ASSETS_LICENSE_MANIFEST.json`、`package.json`

**尚未读（如实记录）：** `README.md`、`docs/ARCHITECTURE.md`、`GAME_DESIGN.md`、`ROADMAP.md`、`ACCEPTANCE.md`、`AI_PROVIDERS.md`、`CORE_VISION.md`、`UI_REFERENCE.md`、`PLAY.md`、`AUDIT_PHASE0.md`、`UX_VERTICAL_SLICE.md`、`SCENE_DESIGN_v1.md`、`GIT_WINDOWS.md`，以及 `packages/simulation`、`packages/server` 源码。

---

## 3. 构建 / 测试实测

```
npm test
  ✓ tests/rules.test.ts (1)      ✓ tests/llm-provider.test.ts (1)
  ✓ tests/institutions.test.ts (1)   ✓ tests/invariants.test.ts (4)
  Test Files 4 passed | Tests 7 passed | 2.24s

npm run build -w @ai-civ/web
  ✓ 639 modules transformed
  dist/assets/index-*.css   34.13 kB  (gzip 7.71 kB)
  dist/assets/index-*.js  1,355.06 kB (gzip 382.99 kB)
  ✓ built  (chunk >500 kB 警告，未处理)
```

**环境坑（必须记录）：**

1. 默认 `TMP=D:\hw7_tools\tmp\...` 下 esbuild 报 `Access is denied`；把 `TMP/TEMP` 指到工作区 `node_modules/.cache/tmp` 后构建通过。建议固定构建临时目录或修复该 ACL。
2. DSH 普通沙箱下 esbuild / Edge 子进程 `spawn EPERM`；本轮构建与截图使用一次性完整权限完成（非项目缺陷）。

---

## 4. Visual Lab 运行与截图

- 入口：`http://127.0.0.1:<port>/visual-lab`（本轮临时实例 5176，已关闭）
- A/B 切换正常；**无 GLB 加载失败**，浏览器日志仅有 `favicon.ico` 404
- 截图方式：`puppeteer-core` + 本机 Edge headless（SwiftShader WebGL），1920×1080；Canvas 实际渲染区 1504×928
- 截图脚本在 `node_modules/.cache/shot/shot.mjs`（**未入库**，下轮应移入 `scripts/` 以便复现）

**截图（6 张 + 日志）：**

```
docs/screenshots/visual-lab/kenney/{main-1920x1080,topdown,agent-closeup}.png
docs/screenshots/visual-lab/quaternius/{main-1920x1080,topdown,agent-closeup}.png
docs/screenshots/visual-lab/browser-logs.txt
```

---

## 5. 视觉问题清单（按严重度）

### P0 — 已修复

**Agent 堆叠 / 只见 1 人（根因 + 修复）**

- 现象：3 种视角下 8 个 Agent 只有 1 个可辨认，位置也不随 `AGENT_SLOTS` 变化。
- 根因：`GlbInstance` 对蒙皮模型使用 `gltf.scene.clone(true)`；`SkinnedMesh` 的骨骼不会随 clone 重新绑定，8 个实例共用原点骨骼 → 全部叠在原点。
- 修复：`visual-lab/GlbInstance.tsx` 改用 `SkeletonUtils.clone`（`three/examples/jsm/utils/SkeletonUtils.js`）。
- 复验：8 个 Agent 全部出现在各自站位；`npm run build` 通过；6 张截图已重拍。

### P0 — 未修复（下一轮）

1. **比例失调（魔法数）**：现有缩放 `BUILDING 1.35 / AGENT 0.85 / TREE 0.9 / ROAD 2.2`（Kenney）、`0.42 / 0.55 / 0.35 / 0.28`（Quaternius），均无 Bounding Box 归一化。
   - 实测原生高度：Kenney 角色 `0.671`、建筑 `0.83–1.14`、树 `0.567`；Quaternius 建筑 `3.2–5.9`、角色为独立大尺度。
   - 结果：Kenney 角色≈`0.57` 世界单位，在默认镜头下仅约 **18–20 px**，无法辨认；Quaternius 角色相对建筑偏大且头部发黑。
2. **8 人站位成一条直线**，无广场/建筑功能分区感；玩家无法通过位置理解「市场 / 工坊 / 技能铺」。

### P1 — 未修复

3. **构图**：水面半径 `15.5`、岛半径 `11`，默认镜头下大片空水面；岛是平面圆盘，**无厚度/台阶/地形层次**（与 `VISUAL_STYLE_GUIDE` §3 不符）。
4. **道路**：Kenney 用 `2.2×` 放大路面 tile，交叉路口在广场中央形成一块黑色沥青，与暖色岛面冲突。
5. **Quaternius 材质**：建筑偏暗、部分门面/屋檐发黑；角色头部黑色（疑似材质/贴图未正确加载），需逐模型核查。
6. **假动画**：`AnimatedGlbInstance` 没有 `AnimationMixer`；实测 GLB 内含动画（Quaternius 角色 9 条：Idle/Walk/Run…；Kenney Mini Characters 32 条），当前全部未播放。
7. **文档与代码不一致**：文档称「默认 CDN fallback」，但 `resolveGlbUrl()` 始终返回 `primary`，fallback 是死代码。
8. **资源加载策略**：`VisualLabPage` 预加载全部 40+ GLB（13.7 MB），与当前选中方案无关的资产也会下载。
9. **HUD**：玩家界面出现开发词（「GLB / A·Kenney / 不接 Simulation / tge-assets / 截图验收提示」）；右栏常驻、留白多；底部按钮无行为（占位数据已标注）。
10. **无相机预设/截图入口**：俯视、近景只能靠手势 orbit 实现，无法稳定复现验收截图。

### P2

11. 光照偏灰白；Kenney 与 Quaternius 共用同一套 `LabLighting`，导致两者明暗观感差异大。
12. 树/石等装饰落在水边或岛缘，接地关系不严谨。

---

## 6. A/B 技术对比（修复后截图，供初判）

| 维度 | A · Kenney | B · Quaternius |
|------|-----------|----------------|
| 游戏感 | 清爽、统一，但偏「郊区玩具」，岛内容偏小 | 建筑体量/门窗细节更像「文明城镇」 |
| 角色识别 | GLB 修复后 8 人可见，但**过小**、职业难区分 | 8 人清楚可见，但**偏大**、头部材质发黑 |
| 建筑辨识 | 剪影简单、功能靠命名 | 剪影丰富、市场/研究所更好辨认 |
| 性能 | 资产共约 3.0 MB，轻 | 资产共约 10.7 MB，纹理/网格更重 |
| 扩展成本 | 尺度统一、替换简单 | 单资产尺度差异大，必须先做归一化 |
| 主要风险 | 角色可读性 | 材质/比例/性能 |

**初判（待比例统一后复核）：** Quaternius 更接近产品要的「AI 文明」气质；Kenney 在性能与一致性上更稳。**两者当前都不应直接定案**——先统一世界单位、重排站位、修正构图，再拍同一组图让 CEO 选。

**建议的世界单位参照（供下一轮实现）：**
Agent 高 ≈ `1.5–1.8` 世界单位 · 建筑高 ≈ `3–4.5` · 道路宽 ≈ `1.8–2.2` · 岛半径 ≈ `9–10`；所有模型用 Bounding Box 计算 `scale` 与落地偏移，写入 `Asset Placement Config`，禁止散落 magic number。

---

## 7. GitHub commit / push / PR 能力核查（实测）

| 检查 | 结果 |
|------|------|
| `git fetch` / `git ls-remote` | ✅ 正常（`main` / 两个 feature 分支） |
| `git push --dry-run` | ✅ exit 0（凭据通过，会创建分支；**未实际推送**） |
| GitHub API 仓库权限 | ✅ `admin / maintain / push / triage / pull` 全为 `true` |
| 现有 PR | 仅 **PR #1**：`feat/play-3d-skeleton → main`（open，未合并） |
| `gh` CLI | ❌ 未安装；**不阻塞**，可用 REST API 建 PR |
| 网络说明 | 普通沙箱下 .NET/curl 的 Schannel TLS 被拒；完整权限下 API 正常 → 属沙箱限制，不是网络故障 |

### 建议提交拆分（等待授权后执行）

1. `feat(web): visual lab — Kenney/Quaternius A/B + skinned-mesh clone fix + screenshots + asset license manifest`
   - `packages/web/src/visual-lab/**`、`GlbInstance` 修复、`public/assets/glb/**`（41 文件，CC0 已在清单）、`scripts/fetch-visual-lab-assets.mjs`、`package.json` 脚本、5 篇视觉文档、`docs/screenshots/**`
2. `feat(web): cozy HUD + island environment for /play-3d`
   - `play3d/**`、`index.css`、`main.tsx`、`HomePage.tsx`、`assets-manifest.json`
3. 后续单独确认：`chore: stop tracking runtime/active-game.json`（会从 Git 移除该运行数据）

**明确排除：** 本次 `runtime/active-game.json` 的工作区改动。
**PR 目标建议：** `feat/visual-cozy-hud → main`（会包含 PR #1 的两个提交，需同时决定 PR #1 关闭或先合并）。**未执行任何 commit / push / PR。**

---

## 8. 本轮改动清单（DeepSeek Harness）

| 文件 | 改动 |
|------|------|
| `packages/web/src/visual-lab/GlbInstance.tsx` | 修复蒙皮模型克隆：`SkeletonUtils.clone`；注释说明原因 |
| `docs/screenshots/visual-lab/**` | 新增 A/B 六张真实浏览器截图 + 日志 |
| `docs/HANDOVER_AUDIT_2026-11-07.md` | 本报告 |

未提交、未推送；临时诊断改动（AGENT_SCALE、站位）已全部还原。

---

## 9. 建议下一步

1. **CEO 授权**后按 §7 计划提交 / 推送 / 建 PR（含 GLB 是否入库的决策）。
2. **Visual Lab 比例与构图修复**：统一世界单位 + BBox 归一化 + Asset Placement Config + 站位重排 + 相机预设 + 岛体厚度。
3. 重拍 6 张验收图 → CEO 确认 A/B 风格。
4. 按 `VISUAL_LAB_INTEGRATION.md` 接入 `/play-3d`（保留 GameState 映射）。
5. 进入 Event Playback（Phase C），仍以引擎为唯一结算源。
