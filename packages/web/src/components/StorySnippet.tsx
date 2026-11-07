import { parseRoundStory } from '../lib/roundStory';
import type { GameEvent } from '../types';

export function StorySnippet({
  events,
  round,
  onOpenFull,
}: {
  events: GameEvent[];
  round: number;
  onOpenFull: () => void;
}) {
  const { headline } = parseRoundStory(events, round);
  const text =
    headline ?? (round === 0 ? '点下方「下一回合」开局' : '轻触查看本回合剧场');

  return (
    <button type="button" className="story-hero" onClick={onOpenFull}>
      <span className="story-hero-kicker">本回合</span>
      <p className="story-hero-text">{text}</p>
      <span className="story-hero-hint">展开剧场 · 摘要与细节</span>
    </button>
  );
}
