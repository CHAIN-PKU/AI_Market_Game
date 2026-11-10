import { useState } from 'react';
import { CloseIcon } from './icons';
import { gold, investLabel, riskLabel } from './presentation';
import { ROLE_KEY, ROLE_LABEL, type BidDemoFixture } from './types';
import { MIXAMO_AVATARS } from './avatarAssets';
import { loreFor } from './agentLore';
import { downloadCastPoster } from './castPoster';

export function CastPanel({
  fixture,
  onClose,
  onSelect,
}: {
  fixture: BidDemoFixture;
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const [pickedId, setPickedId] = useState<string | null>(null);
  const pickedIndex = pickedId ? fixture.agents.findIndex((a) => a.id === pickedId) : -1;
  const picked = pickedIndex >= 0 ? fixture.agents[pickedIndex] : null;

  if (picked) {
    const lore = loreFor(picked.displayName);
    const role = ROLE_KEY[picked.role];
    return (
      <div className="g-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <section className="g-cast g-cast--sheet" role="dialog" aria-modal="true" aria-labelledby="g-cast-title">
          <header className="g-cast-head">
            <div>
              <span className="g-guide-kicker">人物设定卡</span>
              <h2 id="g-cast-title">{picked.displayName}</h2>
              <p>{lore.motto}</p>
            </div>
            <button type="button" className="g-icon-btn" onClick={onClose} aria-label="关闭居民图鉴">
              <CloseIcon size={16} />
            </button>
          </header>

          <div className="g-sheet">
            <img className="g-sheet-portrait" src={MIXAMO_AVATARS[pickedIndex % MIXAMO_AVATARS.length]!.thumb} alt={`${picked.displayName} 立绘`} />
            <div className="g-sheet-body">
              <span className={`g-cast-role g-cast-role--${role}`}>
                {ROLE_LABEL[picked.role]} · {picked.personalityLabel} · {picked.strategy}
              </span>
              <p className="g-sheet-bio">{lore.bio}</p>
              <div className="g-sheet-stats">
                <span>钱包 <b>{gold(picked.walletBefore)}</b></span>
                <span>技能 <b>{picked.skillsAfter.length}</b></span>
                <span>敢冒险 <b>{riskLabel(picked.traits.riskTolerance)}</b></span>
                <span>爱花钱 <b>{investLabel(picked.traits.investAggression)}</b></span>
              </div>
              <div className="g-sheet-abilities">
                {[
                  ['写程序', picked.abilities.coding, '#3f8f96'],
                  ['做研究', picked.abilities.research, '#8f7cc9'],
                  ['做设计', picked.abilities.design, '#d97a52'],
                ].map(([label, value, color]) => (
                  <div key={label} className="g-sheet-ability">
                    <span>{label}</span>
                    <div className="g-bar">
                      <i className="g-bar-fill" style={{ width: `${Math.min(100, Number(value) * 1.5)}%`, background: color }} />
                    </div>
                    <b>{value}</b>
                  </div>
                ))}
              </div>
              <div className="g-sheet-actions">
                <button type="button" className="g-btn g-btn--ghost" onClick={() => setPickedId(null)}>
                  返回图鉴
                </button>
                <button
                  type="button"
                  className="g-btn g-btn--primary"
                  onClick={() => {
                    onSelect(picked.id);
                    onClose();
                  }}
                >
                  打开档案
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

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
              onClick={() => setPickedId(agent.id)}
            >
              <img src={MIXAMO_AVATARS[i % MIXAMO_AVATARS.length]!.thumb} alt={`${agent.displayName} 立绘`} />
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
          <span className="g-muted">点一个人，打开它的人物设定卡。</span>
          <div className="g-cast-actions">
            <button type="button" className="g-btn g-btn--ghost" onClick={() => void downloadCastPoster(fixture)}>
              存成海报
            </button>
            <button type="button" className="g-btn g-btn--ghost" onClick={onClose}>
              关闭
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
