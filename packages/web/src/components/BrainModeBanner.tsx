import type { GameMeta } from '../types';

export function BrainModeBanner({ meta }: { meta: GameMeta }) {
  const live = meta.agentMode === 'cursor' || meta.agentMode === 'openai' || meta.agentMode === 'openai-hybrid';

  if (live) {
    return (
      <div className="brain-banner brain-banner-live">
        <span className="brain-dot" aria-hidden />
        <div>
          <p className="brain-title">{meta.playerBrainLabel}</p>
          <p className="brain-sub">抢单心路来自真实 API 调用 · 打开「心路」查看本回合思考</p>
        </div>
      </div>
    );
  }

  return (
    <div className="brain-banner brain-banner-practice">
      <p className="brain-title">当前：练习模式（规则机器人，不是 Cursor Agent）</p>
      <p className="brain-sub">
        游戏初衷是<strong> AI 居民真实决策</strong>。在项目根目录 <code>.env</code> 配置：
      </p>
      <pre className="brain-env">
        {`CURSOR_API_KEY=cursor_你的密钥
AI_CIV_AGENT_MODE=cursor`}
      </pre>
      <p className="brain-sub">重启 <code>npm run dev</code> 后，心路会显示 Cursor 实时 reasoning。</p>
    </div>
  );
}
