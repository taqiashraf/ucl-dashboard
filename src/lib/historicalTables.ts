import type { Match, StandingRow } from '../types';
export function historicalTables(matches: Match[]) {
  const groups = new Map<string, Map<number, StandingRow>>();
  for (const m of matches) {
    const group = m.stage.match(/group\s+([a-h])/i)?.[1]?.toUpperCase();
    if (!group && !/league.phase|league.stage/i.test(m.stage)) continue;
    if (
      m.status !== 'FINISHED' ||
      m.score.home === null ||
      m.score.away === null
    )
      continue;
    const key = group ? `Group ${group}` : 'League phase';
    const rows = groups.get(key) ?? new Map<number, StandingRow>();
    groups.set(key, rows);
    for (const [team, gf, ga] of [
      [m.home, m.score.home, m.score.away],
      [m.away, m.score.away, m.score.home],
    ] as const) {
      const r = rows.get(team.id) ?? {
        position: 0,
        team,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      };
      r.played++;
      r.goalsFor += gf;
      r.goalsAgainst += ga;
      r.goalDifference += gf - ga;
      if (gf > ga) {
        r.won++;
        r.points += 3;
      } else if (gf === ga) {
        r.drawn++;
        r.points++;
      } else r.lost++;
      rows.set(team.id, r);
    }
  }
  return [...groups]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, values]) => ({
      name,
      rows: [...values.values()]
        .sort(
          (a, b) =>
            b.points - a.points ||
            b.goalDifference - a.goalDifference ||
            b.goalsFor - a.goalsFor ||
            a.team.name.localeCompare(b.team.name),
        )
        .map((r, i) => ({ ...r, position: i + 1 })),
    }));
}
