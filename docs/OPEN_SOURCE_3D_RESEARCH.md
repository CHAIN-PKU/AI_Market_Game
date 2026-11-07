# 开源 3D 方案调研（AI Market Game）

> 日期：2026-11-07 · 分支：`feat/visual-cozy-hud`  
> 结论先行：**不 Fork 完整游戏仓库**；**Kenney GLB（tge-assets）+ 自研 R3F 场景** 为主接入路径；**Treehouse** 仅借鉴渲染/UI/测试模式；**Quaternius** 作为 B 方案视觉对照。

---

## 开发原则（已采纳）

| # | 原则 |
|---|------|
| 1 | 保留 React / TS / R3F / Three.js |
| 2 | 保留 Simulation、`GameState`、事件契约 |
| 3 | 正式美术不再用手写 Box/Sphere/Cylinder 拼建筑与角色 |
| 4 | 优先成熟 Starter、场景与 GLB 加载方案 |
| 5 | 优先许可明确的低多边形包（Kenney、Quaternius CC0） |
| 6 | 代码与素材 **分别** 核对授权 |
| 7 | 研发重心：规则、Agent 决策、经济反馈、交互 |
| 8 | 完整游戏工程仅在独立目录研究，不替换主仓 |

### 复用层级

| 层级 | 做法 |
|------|------|
| 3D 模型与场景 | 下载合法 GLB，导入 `packages/web/public/assets/glb/` |
| 相机、光照、动画、HUD 组件 | 参考开源实现，按许可证 **选择性移植** 到本仓 |
| 完整游戏工程 | 临时 clone 研究，**不** 覆盖 `package.json` / 服务器 / 部署 |

---

## 方案一：Hidencod/tge-assets（Kenney GLB 目录）

| 项 | 内容 |
|----|------|
| **地址** | https://github.com/Hidencod/tge-assets |
| **主要用途** | 浏览器可直接用的 Kenney GLB（1883 个），含 `catalog.json` 与缩略图 |
| **可运行 Demo** | GitHub Pages 浏览：https://hidencod.github.io/tge-assets/ |
| **代码许可证** | 仓库为资产索引；Kenney 模型 **CC0 1.0**（README 明示） |
| **素材许可证** | **CC0 1.0**（各 pack 链到 kenney.nl） |
| **R3F 兼容** | ✅ `useGLTF` / drei 直接加载 `.glb` |
| **glTF/GLB** | ✅ 自包含 GLB |
| **相机与光照** | ❌ 不含；需自研（本仓 `visual-lab/LabLighting.tsx`） |
| **动画角色** | ✅ Mini / Blocky Characters（多为静态；动画需另验 clips） |
| **风格匹配** | ✅ 轻快、统一、适合 cozy 策略岛 |
| **本地运行** | 无需 clone 全库；jsDelivr CDN 或 `npm run assets:visual-lab` 拉取精选文件 |
| **接入成本** | **低**：`GlbInstance` + 布局表 + scale 校准 |
| **需修改** | 统一比例、建筑功能映射、招牌/色标区分职能 |

**优点**：Cursor 可凭 `catalog.json` 精确选模型；包体可控；与 Kenney UI 未来一致。  
**缺点**：建筑偏现代郊区，非「奇幻文明」；角色需配件表达职业。

---

## 方案二：robertguss/treehouse（R3F 家庭游戏脚手架）

| 项 | 内容 |
|----|------|
| **地址** | https://github.com/robertguss/treehouse |
| **主要用途** | 完整 3D 游戏模板：多人房间、存档、`packages/kit` 渲染与 UI |
| **可运行 Demo** | 需 `pnpm install` + `pnpm verify`；**本机 clone 因 GitHub 443 暂未完成**（2026-11-07） |
| **代码许可证** | MIT（脚手架源码） |
| **素材许可证** | 模型为 **Quaternius CC0**（`CREDITS.md`）；**MIT 不覆盖模型** |
| **R3F 兼容** | ✅ R3F 9 + drei 10（版本略异，需对齐本仓 three 0.187） |
| **glTF/GLB** | ✅ `library/models/*.glb`（Blender 管线优化） |
| **相机与光照** | ✅ `SkyAndLights`、`FollowCamera`（可参考移植） |
| **动画角色** | ✅ Ultimate Animated Character Pack（Idle/Walk 等，见 `assets/catalog.json`） |
| **风格匹配** | ⚠️ 默认田园；建筑需另下 Quaternius Buildings |
| **本地运行** | 应在 `%TEMP%/treehouse-research` 独立 clone，**禁止**覆盖 AI Market Game |
| **接入成本** | **高**（若整包 Fork）：含 Cloudflare Worker、多人、独立 `defineGame`） |
| **需修改** | 仅借鉴：`GameCanvas` 思路、`MODELS` 类型表、Playwright 截图约定 |

**优点**：工程化极强（Playwright、资产目录、动画裁剪列表）。  
**缺点**：与现有 Simulation + Express API **架构重叠**；不适合作为主仓库。

**推荐用法**：阅读 `docs/ARCHITECTURE.md`，选择性移植 **渲染层模式**，不引入 Worker/多人。

---

## 方案三：Quaternius 官方包 + trebeljahr/quaternius-showcase（B 方案建筑）

| 项 | 内容 |
|----|------|
| **地址** | https://quaternius.com/packs/ultimatetexturedbuildings.html · mirror：https://github.com/trebeljahr/quaternius-showcase |
| **主要用途** | 带贴图模块化建筑、自然包、动画角色 |
| **可运行 Demo** | showcase 站点可浏览单模；本仓 B 方案用 showcase 的 `buildings_pack_2` GLB |
| **代码许可证** | showcase：**MIT**（仅站点代码） |
| **素材许可证** | **CC0-1.0**（`LICENSES.md` 按 pack 列出） |
| **R3F 兼容** | ✅ |
| **glTF/GLB** | 官方多为 FBX/OBJ/Blend；**GLB 以 showcase/treehouse 优化版为准** |
| **相机与光照** | 需自研（同方案一） |
| **动画角色** | ✅ treehouse 已烘焙 `characters/*.glb` |
| **风格匹配** | ✅ 体积感、微缩城市质感强 |
| **本地运行** | `npm run assets:visual-lab` 或 CDN fallback |
| **接入成本** | **中**：模型尺度差异大，需 per-asset `scale` |
| **需修改** | 统一主视觉 **仅选一套** Quaternius 建筑包，不与 Kenney 混排 |

**优点**：建筑细节与「文明岛屿」辨识度更高。  
**缺点**：单文件较大；混搭 Kenney 会「第三种风格」。

---

## 方案对比摘要（≥3）

| 方案 | 角色 | 建筑 | 接入 | 与 Simulation | 推荐度 |
|------|------|------|------|----------------|--------|
| tge-assets / Kenney | Mini Characters | Suburban + Roads | 低 | 易映射 | **A 对照 + 候选主风格** |
| Treehouse kit | 动画 GLB | 需另下 | 高（整包） | 需重写游戏层 | **仅借鉴模式** |
| Quaternius + showcase | treehouse 角色 GLB | Ultimate Textured | 中 | 易映射 | **B 对照** |

---

## 推荐路线（本轮）

1. **`/visual-lab`**：相同 `islandLayout.ts`，A=Kenney，B=Quaternius（已实现）。
2. **你视觉验收** 后选定 A 或 B，再写入 `docs/DECISIONS.md`。
3. **接入 `/play-3d`**：按 `docs/VISUAL_LAB_INTEGRATION.md` 映射 `GameState` → GLB 实例；保留程序化场景直至切换日。
4. **资产**：`docs/ASSETS_LICENSE_MANIFEST.json` + `npm run assets:visual-lab`。
5. **Treehouse**：网络恢复后在临时目录 `pnpm verify`，补「本地运行结果」一节截图说明即可。

### 不推荐

- 将 Treehouse 整仓合并为 monorepo 主工程。
- 未验收前在 `/play-3d` 堆砌更多建筑/装饰。
- 无许可证文件就提交 `.glb`。

---

## UI 资源（HUD）

| 来源 | 许可证 | 用途 |
|------|--------|------|
| [Kenney UI Pack](https://kenney.nl/assets/ui-pack) | CC0 | 图标、按钮、面板（下一轮接入 HTML/CSS） |
| Treehouse `packages/kit/ui` | MIT | 布局参考（Panel、IconButton） |

本轮 HUD：`visual-lab/LabHud.tsx` 静态策略游戏壳，非仪表盘风格。

---

## 测试与已知问题

| 项 | 状态 |
|----|------|
| `npm run build -w packages/web` | 须在提交前通过 |
| GLB 首载 | 默认 **CDN fallback**，依赖外网；离线请先 `npm run assets:visual-lab` |
| GitHub clone/pull | 间歇 443 reset，push/拉模型需重试 |
| Quaternius 角色动画 | visual-lab v1 **未接** AnimationMixer；选定风格后在 play-3d 接 Idle |
| 截图 | 由你在 1920×1080 拍摄，放入 `docs/screenshots/visual-lab/{kenney,quaternius}/` |

---

## 附录：精选模型清单（约 20 个/方案）

见 `docs/ASSETS_LICENSE_MANIFEST.json` 与 `scripts/fetch-visual-lab-assets.mjs`。
