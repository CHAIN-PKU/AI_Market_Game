import { describe, expect, it } from 'vitest';
import fixtureJson from '../demo/bid-demo.fixture.json';
import type { BidDemoFixture } from './types';
import {
  TIMELINE,
  advanceIfPlaying,
  buildPlaybackCues,
  durationAt,
  skipToEnd,
} from './playback';

const fixture = fixtureJson as unknown as BidDemoFixture;

describe('event playback cue queue', () => {
  it('maps every narrative step and attaches the real events', () => {
    const cues = buildPlaybackCues(fixture);
    expect(cues.map((c) => c.step)).toEqual(TIMELINE.map((s) => s.id));
    expect(cues.find((c) => c.step === 'posted')?.events.length).toBe(1);
    expect(cues.find((c) => c.step === 'assigned')?.events.length).toBe(1);
    expect(cues.find((c) => c.step === 'settled')?.events.length).toBe(2); // completed + tax
    expect(cues.find((c) => c.step === 'skill')?.events.length).toBe(1); // one skill_purchased
    expect(cues.find((c) => c.step === 'bids')?.events.length).toBeGreaterThanOrEqual(2);
  });

  it('skip is presentation-only: the fixture is untouched', () => {
    const before = structuredClone(fixture);
    expect(skipToEnd()).toBe('next');
    expect(fixture).toEqual(before);
    expect(fixture.settlement).toEqual(before.settlement);
    expect(fixture.skillPurchase).toEqual(before.skillPurchase);
  });

  it('pause does not advance the step', () => {
    expect(advanceIfPlaying('posted', false)).toBe('posted');
    expect(advanceIfPlaying('posted', true)).toBe('focus_astra');
  });

  it('2x only halves durations; the step list is unchanged', () => {
    const bids = TIMELINE.find((s) => s.id === 'bids')!;
    expect(durationAt('bids', 1)).toBe(bids.duration);
    expect(durationAt('bids', 2)).toBe(bids.duration / 2);
    expect(buildPlaybackCues(fixture).map((c) => c.step)).toEqual(TIMELINE.map((s) => s.id));
  });

  it('keeps a single skill cue for a single purchase (no double-charge display)', () => {
    const skillCue = buildPlaybackCues(fixture).find((c) => c.step === 'skill')!;
    expect(skillCue.events).toHaveLength(fixture.skillPurchase.length);
    expect(new Set(skillCue.events.map((e) => e.id)).size).toBe(skillCue.events.length);
  });
});
