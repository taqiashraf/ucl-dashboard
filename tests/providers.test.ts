import { describe, expect, it, vi } from 'vitest';
import {
  footballData,
  normaliseFootballDataMatch,
} from '../netlify/functions/_lib/providers/footballData';
import { normaliseApiFootballMatch } from '../netlify/functions/_lib/providers/apiFootball';
// Contract fixture; deliberately synthetic, never shipped as match data.
export const rawMatch = {
  id: 1,
  utcDate: '2026-09-15T19:00:00Z',
  status: 'IN_PLAY',
  minute: 67,
  stage: 'LEAGUE_STAGE',
  lastUpdated: '2026-09-15T20:22:00Z',
  competition: { code: 'CL' },
  homeTeam: { id: 1, name: 'Test Home', crest: 'https://evil.test/track' },
  awayTeam: { id: 2, name: 'Test Away' },
  score: { fullTime: { home: 2, away: 1 }, halfTime: { home: 1, away: 0 } },
  privateAccount: 'never forward',
};
describe('provider contracts', () => {
  it('normalises an in-progress score without pretending it is final', () => {
    const m = normaliseFootballDataMatch(rawMatch);
    expect(m.score).toEqual({ home: 2, away: 1 });
    expect(m.fullTime.home).toBeNull();
    expect(m.period).toBe('SECOND_HALF');
    expect(m.home.crest).toBeNull();
    expect(m).not.toHaveProperty('privateAccount');
  });
  it('rejects non-CL single matches', () =>
    expect(() =>
      normaliseFootballDataMatch({ ...rawMatch, competition: { code: 'PL' } }),
    ).toThrow());
  it('uses a fixed competition route', async () => {
    const transport = vi.fn().mockResolvedValue({ matches: [rawMatch] });
    expect(
      await footballData(transport).matches({ season: 2026 }),
    ).toHaveLength(1);
    expect(transport).toHaveBeenCalledWith('competitions/CL/matches', {
      season: 2026,
    });
  });
  it('ignores knockout/group tables instead of calling them league phase', async () => {
    const transport = vi.fn().mockResolvedValue({
      standings: [{ stage: 'GROUP_STAGE', type: 'TOTAL', table: [] }],
    });
    expect(await footballData(transport).standings()).toEqual([]);
  });
  it('normalises API-Football half time and strips extra fields', () => {
    const m = normaliseApiFootballMatch({
      fixture: {
        id: 7,
        date: rawMatch.utcDate,
        referee: null,
        venue: { name: null },
        status: { short: 'HT', elapsed: 45 },
      },
      league: { id: 2, round: 'League Stage - 2' },
      teams: {
        home: { id: 1, name: 'Test Home' },
        away: { id: 2, name: 'Test Away' },
      },
      goals: { home: 1, away: 0 },
      score: {
        halftime: { home: 1, away: 0 },
        fulltime: { home: null, away: null },
      },
    });
    expect(m.status).toBe('PAUSED');
    expect(m.matchday).toBe(2);
  });
});
