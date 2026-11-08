# 3D 卡通角色管线试验 — Kenney Protagonists

> 2026-11-08 · 目标：把居民从 2D 纸片人升级到 3D 卡通角色，参考迪士尼式比例/大眼/圆润造型。
>
> **后续：Kenney FBX 放弃；`/game` 已改用 Mixamo glTF 原生角色，见 `docs/CHARACTER_ASSETS.md`。**

## 1. 用的公开资产 / 工具

- [Kenney 3D Protagonists](https://kenney.nl/assets/animated-characters-protagonists) — CC0
  - `Model/characterMedium.fbx`
  - `Animations/idle.fbx`、`run.fbx`
  - `Skins/*.png`（4 套皮肤）
- [Kenney Toon Characters](https://kenney.nl/assets/toon-characters) — CC0 2D，作为比例/大眼参考
- Blender 4.2.1 LTS arm64 — FBX → GLB
- `fbx2gltf` npm 包 — macOS 二进制是 x86_64，本机没装 Rosetta，未使用

## 2. 转换结果

```bash
# Blender background
bpy.ops.import_scene.fbx(filepath='characterMedium.fbx')
bpy.ops.export_scene.gltf(filepath='character.glb', export_format='GLB', export_animations=False)

# idle / run
bpy.ops.import_scene.fbx(filepath='idle.fbx')
arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
act = bpy.data.actions['Root|Root|Idle']   # 不是 Targeting Pose
arm.animation_data.action = act
bpy.ops.export_scene.gltf(filepath='idle.glb', export_format='GLB', export_animations=True)
```

关键发现：

- `idle.fbx` 里有两个 action：
  - `Root|Root|0.Targeting Pose`（T-pose，2 帧）
  - `Root|Root|Idle`（真正的 idle，33 帧）
- 第一次导出默认带的是 `Targeting Pose`，所以 GLB 里是 T-pose。
- 指定 `Idle` / `Run` 后 GLB 确实带上了正确 action；但把 `character.glb` 与 `idle.glb` 在 three.js 里用 `useAnimations` 绑定时，角色仍然 T-pose，说明 **GLB 动画 track 的节点路径与克隆后的角色根不匹配**。
- 这是动画重定向问题，不是模型/材质问题；继续硬接会出现 T-pose + 页面卡顿。

## 3. 为什么没有上线

- 3D Protagonists 只有 4 套皮肤，8 个居民会重复 4 套外观。
- idle/run 动画在 three.js 里绑定失败，T-pose 不可接受。
- 当前 2D paper-diorama 已经有 8 套独立脸/发型/服装/配件，并且能稳定两帧走路。

## 4. 下一步正确的做法

1. 在 Blender 里把 `Idle` / `Run` action **合并/重定向到 `characterMedium` 的同一套 armature**，导出一个带两个 NLA strip 的 GLB。
2. 或在 three.js 里用 `SkeletonUtils.retargetClip` 做显式重定向，而不是直接 `clipAction`。
3. 补 8 套皮肤/配色，避免 4 套重复。
4. 只有 1–3 都通过截图验证后再替换 2D。

---

当前上线的是 2D 纸片人：`docs/VISUAL_REBUILD_2026-11-08.md`

## 5. 后续两次尝试（仍未上线）

1. **NLA 合并**：在 Blender 里把 `Root.001|Root|Idle` 和 `Root.001|Root|Run` 挂到 `characterMedium` 的同一 armature，导出 `character_anim.glb`。
   - GLB 检查：`animations = ['Idle','Run']`，`meshes = 1`，`skins = 1`。
   - three.js `useAnimations` 播放后仍然是 T-pose，说明 action 没有绑定到克隆后的骨骼路径。
2. **烘焙姿势**：把 Idle 第 10 帧设为当前姿势，`pose.armature_apply()` 后导出 `character_posed.glb`（无动画）。
   - three.js 里仍然 T-pose，说明 glTF 的 skin bind/pose 与导出结果不一致，不能靠“烘焙一帧”绕过。

结论：需要 **显式 retarget**（`SkeletonUtils.retargetClip` 或 Blender 里重建骨骼动画），不是换模型/换 action 名能解决。当前继续用 2D paper-diorama。

## 6. 单 action 直接导出（仍失败）

- 把 `Idle` action 直接挂到 `characterMedium` 的 armature，删除 idle armature，`export_animation_mode='ACTIVE_ACTIONS'` 导出 `character_idle.glb`。
- GLB：`animations=['Animation']`，`meshes=1`，`skins=1`。
- three.js 播放后仍然 T-pose。

结论：Kenney 这套 FBX 的 skin/bind 与 glTF 导出在 three.js 里不兼容；不再在这套资产上继续投入，除非做显式 retarget 或换一套 glTF-native 角色。
