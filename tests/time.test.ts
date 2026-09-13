import { describe, expect, it } from 'vitest';
import { isLive, matchClock, pollingInterval, backoff } from '../src/lib/time';
import { groupByDate, kickoff } from '../src/lib/format';
import {
  matchStatuses,
  type Match,
} from '../netlify/functions/_lib/providers/types';
const match = (overrides: Partial<Match> = {}): Match =>
  ({
    id: 1,
    utcDate: '2026-09-15T19:00:00Z',
    status: 'IN_PLAY',
    minute: 44,
    period: 'FIRST_HALF',
    ...overrides,
  }) as Match;
describe('live behavior', () => {
  it.each(matchStatuses)('detects %s honestly', (status) =>
    expect(isLive({ status })).toBe(['IN_PLAY', 'PAUSED'].includes(status)),
  );
  it('clamps both halves, shows HT, and resyncs to a server minute', () => {
    expect(matchClock(match(), 180000, 0)).toBe('45′');
    expect(
      matchClock(match({ minute: 88, period: 'SECOND_HALF' }), 180000, 0),
    ).toBe('90′');
    expect(matchClock(match({ status: 'PAUSED' }), 180000, 0)).toBe('HT');
    expect(
      matchClock(match({ minute: 67, period: 'SECOND_HALF' }), 60000, 60000),
    ).toBe('67′');
  });
  it('does not invent a second half when the delayed feed lacks a minute', () =>
    expect(
      matchClock(
        match({ minute: null, period: null }),
        Date.parse('2026-09-15T21:00Z'),
        0,
      ),
    ).toBe('~45′'));
  it('uses 30 seconds live, 5 minutes near kickoff, 15 minutes far away', () => {
    const now = Date.parse('2026-09-15T18:00Z');
    expect(pollingInterval([match()], now)).toBe(30000);
    expect(pollingInterval([match({ status: 'TIMED' })], now)).toBe(300000);
    expect(
      pollingInterval([match({ status: 'TIMED' })], now - 6 * 3600000),
    ).toBe(900000);
    expect(pollingInterval([], now)).toBe(300000);
  });
  it('caps exponential backoff', () =>
    expect([1, 2, 3, 4, 7, 10].map(backoff)).toEqual([
      1000, 2000, 4000, 8000, 60000, 60000,
    ]));
  it('groups by the visitor calendar date across midnight and DST', () => {
    const matches = [
      match({ utcDate: '2026-09-16T00:30Z' }),
      match({ id: 2, utcDate: '2026-09-15T20:00Z' }),
    ];
    expect(groupByDate(matches, 'America/New_York')).toHaveLength(1);
    expect(groupByDate(matches, 'UTC')).toHaveLength(2);
    expect(kickoff('2026-03-08T07:30Z', 'America/New_York')).toBe('03:30');
  });
});
