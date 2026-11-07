import type { GameEvent } from '../types';

export type StorySection = {
  id: string;
  section: string;
  summary: string;
  details: string[];
  contest?: {
    taskLabel: string;
    bidderCount: number;
    bidders: { name: string; civId: string }[];
    winnerNames: string[];
  };
};

export type OligarchyAlert = {
  civilizationId: string;
  civilizationName: string;
  richestName?: string;
  wealthShare: number;
};

export function parseRoundStory(events: GameEvent[], round: number) {
  const stories = events.filter((e) => e.kind === 'story' && e.round === round);
  const headline = stories.find((e) => e.payload?.storyRole === 'headline')?.message ?? null;
  const sections: StorySection[] = stories
    .filter((e) => e.payload?.storyRole === 'section')
    .map((e) => ({
      id: e.id,
      section: String(e.payload?.section ?? 'misc'),
      summary: String(e.payload?.summary ?? e.message),
      details: (e.payload?.details as string[] | undefined) ?? [],
      contest: e.payload?.contest as StorySection['contest'],
    }));
  const oligarchy: OligarchyAlert[] = stories
    .filter((e) => e.payload?.storyRole === 'oligarchy')
    .map((e) => ({
      civilizationId: String(e.payload?.civilizationId),
      civilizationName: String(e.payload?.civilizationName ?? ''),
      richestName: e.payload?.richestName as string | undefined,
      wealthShare: Number(e.payload?.wealthShare ?? 0),
    }));
  return { headline, sections, oligarchy };
}
