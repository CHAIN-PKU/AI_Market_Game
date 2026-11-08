import { describe, expect, it } from 'vitest';
import fixtureJson from '../demo/bid-demo.fixture.json';
import type { BidDemoFixture, RawEvent } from './types';
import { eventText } from './eventText';

const fixture = fixtureJson as unknown as BidDemoFixture;

describe('plain event text', () => {
  it('turns bid and decline events into short Chinese', () => {
    const bid = fixture.rawEvents.find((e) => e.kind === 'bid_placed')!;
    expect(eventText(bid, fixture)).toMatch(/报价 \d+ 金/);
    const decline = fixture.rawEvents.find((e) => e.kind === 'bid_declined')!;
    expect(eventText(decline, fixture)).toMatch(/不接/);
  });

  it('turns skill purchase into the skill name', () => {
    const skill = fixture.rawEvents.find((e) => e.kind === 'skill_purchased')!;
    expect(eventText(skill as RawEvent, fixture)).toMatch(/买了「.+」/);
  });
});
