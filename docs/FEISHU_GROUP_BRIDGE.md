# 飞书 AI Market Game 群 ↔ DSH

## 当前链路

1. **常驻长连接**：`tools/lark-mcp/feishu_ws_listener.js`
   - 使用飞书 `im.message.receive_v1` 长连接
   - 只接收群消息，且带 `@DSH` / mention DSH
   - 写入 `runtime/feishu-inbox.jsonl`
   - 立即回一条“已进入处理队列（3 分钟内处理）”
2. **3 分钟处理循环**：DSH scheduled task `飞书 @DSH 消息处理与进度同步`
   - `python3 ops/feishu_queue.py list`
   - 有 pending 才处理并回复
   - 回复后 `ack`
   - 无 pending 不刷屏
3. **主动同步**
   - `python3 ops/feishu_queue.py group-send "..."` 发到 AI Market Game 群
   - 或 `DSH_LARK_CHAT=<chat_id> python3 ops/lark_mcp.py send "..."`
   - 图片：`DSH_LARK_CHAT=<chat_id> python3 ops/lark_media.py image <path>`（已验证群图）

## 群 ID

默认：`oc_5e43db36ee32790f386ed608fdcf6ce5`

## 启动/保活

```bash
cd /Users/aibasis/Documents/deepseek-harness/default-workspace
ops/ensure_feishu_listener.sh
tail -f runtime/feishu-listener.log
```

## 状态

- 长连接：已连接（ws client ready）
- 3 分钟任务：已创建 `schedule-4a50210c-1610-42e7-a3b0-af29cf09fd57`
- 群发：已验证可发出
- 收信：需要飞书后台已开启 `im.message.receive_v1` 长连接；若用户 @DSH 后没有进入 inbox，说明事件订阅/版本发布还没生效
- 群图：已通过 `DSH_LARK_CHAT` 支持并实测发出

## 测试

在群里发：

```text
@DSH 汇报当前进度
```

应看到：

1. DSH 立刻回“已进入处理队列（3 分钟内处理）”
2. 3 分钟内 scheduled worker 读取并回复
3. `runtime/feishu-inbox.jsonl` 出现记录
