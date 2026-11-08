import { useEffect, useMemo, useState } from 'react';
import { buildNegotiation, type NegotiationKind } from './negotiation';
import type { BidDemoFixture } from './types';

const KIND_LABEL: Record<NegotiationKind, string> = {
  public: '公开',
  private: '心里',
  promise: '承诺',
  betrayal: '背叛',
  report: '举报',
  thought: '盘算',
};

const KIND_CLASS: Record<NegotiationKind, string> = {
  public: 'is-public',
  private: 'is-private',
  promise: 'is-promise',
  betrayal: 'is-betrayal',
  report: 'is-report',
  thought: 'is-thought',
};

export function NegotiationPanel({ fixture, onClose }: { fixture: BidDemoFixture; onClose: () => void }) {
  const lines = useMemo(() => buildNegotiation(fixture), [fixture]);
  const [visible, setVisible] = useState(1);

  useEffect(() => {
    setVisible(1);
    if (lines.length <= 1) return;
    const timer = window.setInterval(() => {
      setVisible((v) => {
        if (v >= lines.length) {
          window.clearInterval(timer);
          return v;
        }
        return v + 1;
      });
    }, 520);
    return () => window.clearInterval(timer);
  }, [lines]);

  return (
    <div className="g-nego-backdrop" onClick={onClose} role="presentation">
      <section className="g-nego" role="dialog" aria-modal="true" aria-label="谈判室" onClick={(e) => e.stopPropagation()}>
        <header className="g-nego-head">
          <div>
            <span className="g-nego-kicker">AGENT NEGOTIATION · 第 {fixture.demoRound} 轮</span>
            <h2>谈判室</h2>
            <p>每个 agent 按自己的成本、声誉、历史决定合作、承诺、压价、背叛；分成是谈出来的。</p>
          </div>
          <button type="button" className="g-nego-close" onClick={onClose} aria-label="关闭谈判室">×</button>
        </header>

        <div className="g-nego-roster">
          {fixture.agents.map((a) => (
            <span key={a.id} title={`${a.personalityBlurb} · 策略 ${a.strategy}`}>
              <b>{a.displayName}</b>
              <em>{a.strategy}</em>
              <i>{a.decision.action === 'bid' ? `报 ${a.decision.bidAmount ?? 0}` : '观望'}</i>
            </span>
          ))}
        </div>

        <div className="g-nego-list">
          {lines.slice(0, visible).map((line) => (
            <article key={line.id} className={`g-nego-line ${KIND_CLASS[line.kind]}`}>
              <div className="g-nego-avatar">{line.speaker.slice(0, 1)}</div>
              <div className="g-nego-body">
                <div className="g-nego-meta">
                  <b>{line.speaker}</b>
                  <span>{line.role}</span>
                  <em>{KIND_LABEL[line.kind]}</em>
                  <span className="g-nego-trust">信任 {Math.round(line.trust * 100)}</span>
                </div>
                <p>{line.text}</p>
                {line.terms && <span className="g-nego-terms">{line.terms}</span>}
              </div>
            </article>
          ))}
        </div>

        <footer className="g-nego-foot">
          <span>{visible < lines.length ? '正在说话…' : `${lines.length} 条对话 · 已显示完`}</span>
          <div>
            <button type="button" className="g-nego-replay" onClick={() => setVisible(1)}>重播</button>
            <button type="button" className="g-nego-done" onClick={onClose}>知道了</button>
          </div>
        </footer>
      </section>
    </div>
  );
}
