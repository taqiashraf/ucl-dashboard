import { describe, it, expect } from 'vitest';
import { summarizeMatches, valueScenario, csvCell } from '../src/lib/insights';
import archive from '../public/history/2025.json';
import type { Match } from '../src/types';
const base = archive.matches[0] as Match;
describe('BI metric definitions', () => {
  it('excludes incomplete and missing scores from rate denominators', () => {
    const s = summarizeMatches([
      { ...base, id: 1, score: { home: 2, away: 1 } },
      { ...base, id: 2, score: { home: null, away: null } },
      { ...base, id: 3, status: 'TIMED', score: { home: null, away: null } },
    ]);
    expect(s.completed).toBe(2);
    expect(s.scored).toBe(1);
    expect(s.goalsPerMatch).toBe(3);
    expect(s.closeRate).toBe(1);
    expect(s.scheduled).toBe(1);
  });
  it('returns unavailable rates for an empty population', () => {
    const s = summarizeMatches([]);
    expect(s.goalsPerMatch).toBeNull();
    expect(s.closeRate).toBeNull();
  });
  it('filters matches by club and retains both sides of each score', () => {
    const s = summarizeMatches(
      [
        { ...base, id: 1, score: { home: 2, away: 1 } },
        {
          ...base,
          id: 2,
          home: { ...base.home, id: 999 },
          away: { ...base.away, id: 998 },
        },
      ],
      String(base.home.id),
    );
    expect(s.completed).toBe(1);
    expect(s.goals).toBe(3);
  });
  it('models CPM equivalent value and protects zero fee division', () => {
    expect(valueScenario(1000000, 12, 50, 10000)).toEqual({
      mediaValue: 6000,
      coverage: 0.6,
    });
    expect(valueScenario(0, 12, 50, 0)).toEqual({
      mediaValue: 0,
      coverage: null,
    });
  });
  it('escapes quoted CSV and neutralizes spreadsheet formula cells', () => {
    expect(csvCell('a"b')).toBe('"a""b"');
    expect(csvCell('=SUM(A1)')).toBe('"\'=SUM(A1)"');
  });
});
