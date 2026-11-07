import { useState } from 'react';
import { parseRoundStory, type StorySection } from '../lib/roundStory';
import type { GameEvent, GameState } from '../types';

const SECTION_LABEL: Record<string, string> = {
  open: '开市',
  market: '市集',
  bids: '抢单',
  assign: '分单',
  work: '交差',
  shop: '技能铺',
  policy: '制度',
};

function BidContest({ section, civIds }: { section: StorySection; civIds: [string, string] }) {
  const c = section.contest;
  if (!c) return null;
  const [aId, bId] = civIds;
  const countA = c.bidders.filter((b) => b.civId === aId).length;
  const countB = c.bidders.filter((b) => b.civId === bId).length;
  const total = Math.max(1, countA + countB);
  const pctA = Math.round((countA / total) * 100);
  const pctB = 100 - pctA;

  return (
    <div className="bid-contest">
      <p className="bid-contest-title">「{c.taskLabel}」报价人气</p>
      <div className="bid-race">
        <div className="bid-race-side bid-race-a" style={{ width: `${pctA}%` }}>
          <span>A {countA}</span>
        </div>
        <div className="bid-race-side bid-race-b" style={{ width: `${pctB}%` }}>
          <span>B {countB}</span>
        </div>
      </div>
      {c.winnerNames.length > 0 && (
        <p className="bid-contest-win">🏆 {c.winnerNames.join('、')}</p>
      )}
    </div>
  );
}

function SectionRow({
  section,
  civIds,
}: {
  section: StorySection;
  civIds: [string, string];
}) {
  const [open, setOpen] = useState(false);
  const hasDetails = section.details.length > 0 || section.contest;
  const label = SECTION_LABEL[section.section] ?? section.section;

  return (
    <li className="story-section">
      <div className="story-section-head">
        <span className="story-section-tag">{label}</span>
        <p className="story-section-summary">{section.summary}</p>
      </div>
      {section.section === 'bids' && section.contest && (
        <BidContest section={section} civIds={civIds} />
      )}
      {hasDetails && (
        <>
          <button type="button" className="story-expand" onClick={() => setOpen((o) => !o)}>
            {open ? '收起细节' : '展开细节'}
          </button>
          {open && section.details.length > 0 && (
            <ul className="story-details">
              {section.details.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </li>
  );
}

export function StoryTheaterFull({
  events,
  round,
  state,
}: {
  events: GameEvent[];
  round: number;
  state?: GameState;
}) {
  const { headline, sections } = parseRoundStory(events, round);
  const civIds: [string, string] = [
    state?.civilizations[0]?.id ?? 'civ-a',
    state?.civilizations[1]?.id ?? 'civ-b',
  ];

  return (
    <div className="story-theater">
      {headline && <p className="story-theater-headline">{headline}</p>}
      {sections.length === 0 && (
        <p className="text-[var(--color-muted)] text-sm">本回合还没有故事，先点「下一回合」。</p>
      )}
      <ul className="story-section-list">
        {sections.map((s) => (
          <SectionRow key={s.id} section={s} civIds={civIds} />
        ))}
      </ul>
    </div>
  );
}
