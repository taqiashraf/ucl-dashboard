import { describe, it, expect } from 'vitest';
import { seasonStart, seasonLabel } from '../netlify/functions/_lib/season';
import { buildBracket, knockoutRound } from '../src/lib/bracket';
import { historicalTables } from '../src/lib/historicalTables';
import { campaignMetrics } from '../src/lib/campaign';
import { pollingInterval } from '../src/lib/time';
import old from '../public/history/2019.json';
import recent from '../public/history/2025.json';
import campaign from '../public/case-study/campaign.json';
import type { Match } from '../src/types';
describe('season and bracket behavior', () => {
  it('rolls the fallback season in July and keeps January in the previous start year', () => {
    expect(seasonStart(new Date('2027-01-15'))).toBe(2026);
    expect(seasonStart(new Date('2027-07-01'))).toBe(2027);
    expect(seasonLabel(2027)).toBe('2027/28');
  });
  it('handles legacy final labels and single-leg 2020 quarterfinals', () => {
    expect(knockoutRound('Champions League Final')).toBe(4);
    const rounds = buildBracket(old.matches as Match[]);
    expect(rounds[2].ties).toHaveLength(4);
    expect(rounds[2].ties.every((t) => t.length === 1)).toBe(true);
    expect(rounds[4].ties).toHaveLength(1);
  });
  it('groups reversed home/away legs into a single tie', () => {
    const rounds = buildBracket(recent.matches as Match[]);
    expect(rounds[3].ties).toHaveLength(2);
    expect(rounds[3].ties.every((t) => t.length === 2)).toBe(true);
  });
  it('does not invent drawn ties from unknown teams', () => {
    const m = {
      ...recent.matches[0],
      home: { ...recent.matches[0].home, id: 0 },
      away: { ...recent.matches[0].away, id: 0 },
    } as Match;
    expect(buildBracket([m, { ...m, id: 999 }])[4].ties).toHaveLength(2);
  });
  it('reconstructs eight separate old-format groups and balances goals', () => {
    const groups = historicalTables(old.matches as Match[]);
    expect(groups).toHaveLength(8);
    for (const g of groups) {
      expect(g.rows).toHaveLength(4);
      expect(g.rows.every((r) => r.played === 6)).toBe(true);
      expect(g.rows.reduce((s, r) => s + r.goalsFor, 0)).toBe(
        g.rows.reduce((s, r) => s + r.goalsAgainst, 0),
      );
    }
  });
  it('checks every thirty seconds around kickoff before a LIVE status arrives', () => {
    const now = Date.parse('2027-02-01T20:00Z');
    expect(
      pollingInterval(
        [
          {
            ...recent.matches[0],
            status: 'TIMED',
            utcDate: '2027-02-01T20:01Z',
          } as Match,
        ],
        now,
      ),
    ).toBe(30000);
  });
});
describe('partner recap calculations', () => {
  it('caps overdelivery so it cannot hide shortfalls on other assets', () => {
    const s = campaignMetrics(campaign.assets);
    expect(s.gaps).toHaveLength(3);
    expect(s.fulfillment).toBeCloseTo(45000 / 55000);
    expect(s.socialRate).toBeCloseTo(0.04);
    expect(s.tracked).toBe(4);
  });
  it('retains unknown rates when the filtered sample has no denominator', () => {
    const s = campaignMetrics([]);
    expect(s.fulfillment).toBeNull();
    expect(s.socialRate).toBeNull();
  });
});
