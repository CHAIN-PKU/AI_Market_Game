import { useEffect, useState } from 'react';
import type { MindStreamEvent } from '../lib/mindStreamTypes';

type CivPane = { label: string; text: string; done?: boolean; error?: string };

export function MindStreamLive({ gameId }: { gameId: string }) {
  const [panes, setPanes] = useState<Record<string, CivPane>>({});
  const [roundHint, setRoundHint] = useState<string | null>(null);

  useEffect(() => {
    const url = `/api/games/${gameId}/mind`;
    const es = new EventSource(url);

    const onMind = (ev: MessageEvent) => {
      try {
        const data = JSON.parse(ev.data as string) as MindStreamEvent;
        if (data.kind === 'round_start') {
          setRoundHint(`第 ${data.round} 天 · Cursor 正在推理`);
          setPanes({});
        }
        if (data.kind === 'civ_phase') {
          setPanes((p) => ({
            ...p,
            [data.civilizationId]: {
              label: data.label,
              text: p[data.civilizationId]?.text ?? '',
            },
          }));
        }
        if (data.kind === 'text') {
          setPanes((p) => {
            const prev = p[data.civilizationId] ?? { label: data.civilizationId, text: '' };
            return {
              ...p,
              [data.civilizationId]: {
                ...prev,
                text: prev.text + data.text,
              },
            };
          });
        }
        if (data.kind === 'civ_done') {
          setPanes((p) => ({
            ...p,
            [data.civilizationId]: {
              ...p[data.civilizationId],
              label: p[data.civilizationId]?.label ?? data.civilizationId,
              text: p[data.civilizationId]?.text ?? '',
              done: true,
              error: data.ok ? undefined : data.error,
            },
          }));
        }
        if (data.kind === 'round_done') {
          setRoundHint(`第 ${data.round} 天 · 推理已写入 JSON，正在结算`);
        }
        if (data.kind === 'error') {
          setRoundHint(data.message);
        }
      } catch {
        /* ignore */
      }
    };

    es.addEventListener('mind', onMind as EventListener);
    es.onerror = () => {
      /* EventSource 会自动重连 */
    };

    return () => {
      es.close();
    };
  }, [gameId]);

  const ids = Object.keys(panes);

  return (
    <div className="mind-live">
      {roundHint && <p className="mind-live-hint">{roundHint}</p>}
      <div className="mind-live-grid">
        {ids.length === 0 && (
          <p className="mind-live-placeholder">连接心路流… 稍候会出现文明推理窗口。</p>
        )}
        {ids.map((id) => {
          const p = panes[id]!;
          return (
            <div key={id} className="mind-live-pane">
              <div className="mind-live-pane-head">
                <span>{p.label}</span>
                {p.done && (
                  <span className={p.error ? 'mind-live-badge-err' : 'mind-live-badge-ok'}>
                    {p.error ? '失败' : '完成'}
                  </span>
                )}
              </div>
              <pre className="mind-live-pre">{p.text || '…'}</pre>
              {p.error && <p className="mind-live-err">{p.error}</p>}
            </div>
          );
        })}
      </div>
      <p className="mind-live-foot">
        上图多为模型在组织最终 JSON 前的中间输出；回合结束后「心路」里仍有每人一句决议台词。
      </p>
    </div>
  );
}
