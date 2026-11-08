import { useMemo } from 'react';
import { CloseIcon } from './icons';
import { gold } from './presentation';
import { ROLE_KEY, ROLE_LABEL, type BidDemoFixture } from './types';
import { makeResidentPortrait } from './characterArt';
import { loreFor } from './agentLore';

export function CastPanel({
  fixture,
  onClose,
  onSelect,
}: {
  fixture: BidDemoFixture;
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const portraits = useMemo(
    () => fixture.agents.map((agent, i) => makeResidentPortrait(i, ROLE_KEY[agent.role])),
    [fixture.agents],
  );

  return (
    <div className="g-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="g-cast" role="dialog" aria-modal="true" aria-labelledby="g-cast-title">
        <header className="g-cast-head">
          <div>
            <span className="g-guide-kicker">居民图鉴</span>
            <h2 id="g-cast-title">这 8 个人，自己决定接不接</h2>
            <p>同一个制度下，不同性格、不同本事、不同钱包。</p>
          </div>
          <button type="button" className="g-icon-btn" onClick={onClose} aria-label="关闭居民图鉴">
            <CloseIcon size={16} />
          </button>
        </header>

        <div className="g-cast-grid">
          {fixture.agents.map((agent, i) => (
            <button
              key={agent.id}
              type="button"
              className="g-cast-card"
              onClick={() => {
                onSelect(agent.id);
                onClose();
              }}
            >
              <img src={portraits[i]} alt={`${agent.displayName} 立绘`} />
              <strong>{agent.displayName}</strong>
              <span className={`g-cast-role g-cast-role--${ROLE_KEY[agent.role]}`}>
                {ROLE_LABEL[agent.role]} · {agent.personalityLabel}
              </span>
              <em className="g-cast-motto">「{loreFor(agent.displayName).motto}」</em>
              <span className="g-cast-meta">
                {gold(agent.walletBefore)} · 技能 {agent.skillsAfter.length}
              </span>
            </button>
          ))}
        </div>

        <footer className="g-cast-foot">
          <span className="g-muted">点一个人，打开它的档案。</span>
          <button type="button" className="g-btn g-btn--ghost" onClick={onClose}>
            关闭
          </button>
        </footer>
      </section>
    </div>
  );
}
