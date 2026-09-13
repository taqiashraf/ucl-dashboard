import type { Match } from '../types';
export function summarizeMatches(matches: Match[], club = 'all') {
  const scope = matches.filter(
    (m) =>
      club === 'all' ||
      String(m.home.id) === club ||
      String(m.away.id) === club,
  );
  const completed = scope.filter((m) => m.status === 'FINISHED');
  const scored = completed.filter(
    (m) => m.score.home !== null && m.score.away !== null,
  );
  const goals = scored.reduce(
    (sum, m) => sum + m.score.home! + m.score.away!,
    0,
  );
  const clubs = new Map<
    number,
    { name: string; goals: number; played: number }
  >();
  for (const m of scored)
    for (const [team, goals] of [
      [m.home, m.score.home!],
      [m.away, m.score.away!],
    ] as const) {
      const row = clubs.get(team.id) ?? {
        name: team.shortName,
        goals: 0,
        played: 0,
      };
      row.goals += goals;
      row.played++;
      clubs.set(team.id, row);
    }
  const months = new Map<string, { completed: number; scheduled: number }>();
  for (const m of scope) {
    if (!['FINISHED', 'TIMED', 'SCHEDULED'].includes(m.status)) continue;
    const key = m.utcDate.slice(0, 7);
    const row = months.get(key) ?? { completed: 0, scheduled: 0 };
    if (m.status === 'FINISHED') row.completed++;
    else row.scheduled++;
    months.set(key, row);
  }
  return {
    scope,
    completed: completed.length,
    scored: scored.length,
    goals,
    goalsPerMatch: scored.length ? goals / scored.length : null,
    closeRate: scored.length
      ? scored.filter((m) => Math.abs(m.score.home! - m.score.away!) <= 1)
          .length / scored.length
      : null,
    scheduled: scope.filter((m) => ['TIMED', 'SCHEDULED'].includes(m.status))
      .length,
    clubs: [...clubs.values()].sort(
      (a, b) => b.goals - a.goals || a.name.localeCompare(b.name),
    ),
    months: [...months]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, row]) => ({ month, ...row })),
  };
}
export function valueScenario(
  impressions: number,
  cpm: number,
  quality: number,
  fee: number,
) {
  const mediaValue = ((impressions / 1000) * cpm * quality) / 100;
  return { mediaValue, coverage: fee > 0 ? mediaValue / fee : null };
}
// Quote every cell and neutralize spreadsheet formula prefixes before export.
export function csvCell(value: string | number) {
  const text = String(value);
  return (
    '"' +
    (/^[=+\-@\t\r]/.test(text) ? "'" + text : text).replaceAll('"', '""') +
    '"'
  );
}
