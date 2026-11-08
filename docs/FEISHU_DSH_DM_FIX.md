# DSH 机器人飞书单聊 — 诊断与修复清单

> 2026-11-08 · 陈润材反馈「不能在飞书私发 DSH」

## 1. 已确认

- DSH 机器人 `bot/v3/info` 返回 `activate_status: 2`，应用已激活。
- DSH 凭据可以**向外发消息**：
  - 私聊 chat：`oc_05656dbd2e82242f35a10b92b0811221`
  - 文本、图片发送 API 都返回成功。
- 当前 DSH 应用**缺少读取能力**：
  - `im:chat:readonly` / `im:chat.members:read`：无法查询会话和成员。
  - `im:resource:upload`：无法上传图片/文件作为附件（我们临时用 Claude 应用上传图片，再用 DSH 发消息）。
- 当前机器人是**只发不收**：没有事件订阅 `im.message.receive_v1`，所以用户发过去的消息不会进入 DSH，也不会被回复。

## 2. 这不是代码能打开的开关

飞书应用的权限、事件订阅、可用范围都在**开放平台控制台**，不能用 tenant_access_token 直接开启。需要在飞书开放平台操作，并发布版本。

## 3. 控制台操作

应用：`cli_aa6453bceff81c1c`（DSH）

### 3.1 权限管理

添加并开通：

- `im:message.p2p_msg:readonly` — 读取单聊消息
- `im:chat:readonly` — 读取会话信息
- `im:chat.members:read` — 读取会话成员
- `im:resource:upload` — 上传图片/文件
- `im:resource` — 资源读取

### 3.2 事件与回调

- 订阅 `im.message.receive_v1`
- 订阅方式选**长连接**（不需要公网回调地址）
- 如果只做单聊，不需要群事件

### 3.3 应用发布

- 版本管理与发布 → 创建版本
- 可用范围包含陈润材（以及需要测试的账号）
- 发布后，用户重新搜索/打开 DSH 机器人

### 3.4 机器人能力

- 应用功能 → 机器人：确认已启用
- 机器人菜单可以加「打开游戏」等入口

## 4. 配好之后

告诉 DSH 一声，我可以：

1. 起一个长连接监听 `im.message.receive_v1`
2. 把收到的消息写进一个本地队列
3. DSH 回复时再调用 `im/v1/messages` 发回同一 chat

这样才是真正的双向私聊，而不是现在这种「DSH 单向推送」。

## 5. 为什么截图能发、视频不能

- 图片：Claude 应用上传拿到 `image_key`，DSH 用这个 key 发送成功（跨应用 image_key 可用）。
- 视频：Claude 上传拿到 `file_key`，DSH 发送时报 `230017 Bot is NOT the owner of the resource`——文件 key 不能跨应用。
- 所以当前视频只能发仓库链接；等 DSH 拿到 `im:resource:upload` 后，DSH 自己上传即可作为单聊附件。
