import { MindStreamLive } from './MindStreamLive';

export function AdvanceWaitOverlay({
  liveBrain,
  gameId,
}: {
  liveBrain: boolean;
  gameId: string | null;
}) {
  return (
    <div className="advance-wait" role="status" aria-live="polite">
      <div className="advance-wait-card">
        <p className="advance-wait-title">
          {liveBrain ? 'Cursor 居民正在抢单…' : '市集运转中…'}
        </p>
        <p className="advance-wait-body">
          {liveBrain
            ? '每座文明各调用一次 Cursor（现为串行，一座完成再下一座）。本地 Agent 冷启动时可能 1～3 分钟无任何文字，属常见现象；有字后会持续刷出。按钮「…」表示仍在等待。'
            : '请稍候。'}
        </p>
        <div className="advance-wait-bar" aria-hidden>
          <span className="advance-wait-bar-fill" />
        </div>
        {liveBrain && gameId && <MindStreamLive gameId={gameId} />}
      </div>
    </div>
  );
}
