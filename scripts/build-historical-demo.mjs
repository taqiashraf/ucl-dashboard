import { writeFile, mkdir } from 'node:fs/promises';
const base =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/';
const sources = [];
async function read(path) {
  const url = base + path;
  sources.push(url);
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Archive returned ${r.status}`);
  return r.json();
}
const days = ['20240917', '20240918', '20240919', '20241001', '20241002'];
const feeds = await Promise.all(
  days.map((date) => read('scoreboard?dates=' + date)),
);
const events = feeds.flatMap((d) => d.events);
if (events.length !== 36) throw new Error('Expected two complete matchdays');
const nullScore = { home: null, away: null };
const team = (t) => ({
  id: Number(t.id),
  name: t.displayName,
  shortName: t.shortDisplayName ?? t.displayName,
  tla: t.abbreviation ?? t.displayName.slice(0, 3).toUpperCase(),
  crest: null,
});
const rows = new Map(),
  scorers = new Map();
const evening = events.filter((e) => e.date === '2024-10-01T19:00Z');
const summaries = await Promise.all(
  evening.map((e) => read('summary?event=' + e.id)),
);
const summaryById = new Map(summaries.map((s) => [s.header.id, s]));
const matches = events.map((e) => {
  const c = e.competitions[0];
  const h = c.competitors.find((t) => t.homeAway === 'home'),
    a = c.competitors.find((t) => t.homeAway === 'away');
  const future = e.date.startsWith('2024-10-02');
  const paused = summaryById.has(e.id);
  const summary = summaryById.get(e.id);
  const getHalf = (side) => {
    const t = summary?.header.competitions[0].competitors.find(
      (t) => t.homeAway === side,
    );
    return t?.linescores?.[0]?.displayValue != null
      ? Number(t.linescores[0].displayValue)
      : null;
  };
  const score = future
    ? nullScore
    : paused
      ? { home: getHalf('home'), away: getHalf('away') }
      : { home: Number(h.score), away: Number(a.score) };
  if (paused && (score.home === null || score.away === null))
    throw new Error('Missing archival halftime score');
  const m = {
    id: Number(e.id),
    utcDate: new Date(e.date).toISOString(),
    status: future ? 'TIMED' : paused ? 'PAUSED' : 'FINISHED',
    minute: paused ? 45 : null,
    period: paused ? 'FIRST_HALF' : null,
    stage: 'LEAGUE_STAGE',
    matchday: e.date.startsWith('2024-09') ? 1 : 2,
    venue: summary?.gameInfo?.venue?.fullName ?? c.venue?.fullName ?? null,
    referee: summary?.gameInfo?.officials?.[0]?.displayName ?? null,
    home: team(h.team),
    away: team(a.team),
    score,
    halfTime: paused ? score : nullScore,
    fullTime: !future && !paused ? score : nullScore,
    updatedAt: '2024-10-01T19:50:00.000Z',
  };
  for (const t of [m.home, m.away])
    if (!rows.has(t.id))
      rows.set(t.id, {
        position: 0,
        team: t,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        awayGoals: 0,
        awayWins: 0,
      });
  if (!future && !paused) {
    for (const [t, gf, ga, isAway] of [
      [m.home, score.home, score.away, false],
      [m.away, score.away, score.home, true],
    ]) {
      const r = rows.get(t.id);
      r.played++;
      r.goalsFor += gf;
      r.goalsAgainst += ga;
      r.goalDifference = r.goalsFor - r.goalsAgainst;
      if (gf > ga) {
        r.won++;
        r.points += 3;
        if (isAway) r.awayWins++;
      } else if (gf === ga) {
        r.drawn++;
        r.points++;
      } else r.lost++;
      if (isAway) r.awayGoals += gf;
    }
  }
  if (!future)
    for (const goal of c.details ?? []) {
      if (
        !goal.scoringPlay ||
        goal.ownGoal ||
        goal.shootout ||
        (paused && goal.clock.value > 2700)
      )
        continue;
      const athlete = goal.athletesInvolved?.[0];
      if (!athlete) continue;
      const id = Number(athlete.id);
      const t = [m.home, m.away].find((t) => t.id === Number(goal.team.id));
      if (!t) continue;
      const r = scorers.get(id) ?? {
        id,
        name: athlete.displayName,
        team: t,
        goals: 0,
        assists: null,
        played: null,
      };
      r.goals++;
      scorers.set(id, r);
    }
  return m;
});
const standings = [...rows.values()]
  .sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor ||
      b.awayGoals - a.awayGoals ||
      b.won - a.won ||
      b.awayWins - a.awayWins ||
      a.team.name.localeCompare(b.team.name),
  )
  .map(({ awayGoals, awayWins, ...r }, i) => {
    void awayGoals;
    void awayWins;
    return { ...r, position: i + 1 };
  });
const snapshot = {
  mode: 'historical-reconstruction',
  season: '2024/25',
  replayAt: '2024-10-01T19:50:00.000Z',
  capturedAt: new Date().toISOString(),
  provenance:
    'Historical half-time reconstruction from ESPN archived match reports, retrieved after the matches. This is not an original live API capture. Original dates and score facts are retained. PAUSED denotes the reconstructed half-time state.',
  sources,
  standingsNote:
    'Before the evening matches on 1 October. Recomputed from completed results; unresolved ties are alphabetical, not official UEFA ranking.',
  scorersNote:
    'Goals through the reconstructed half-time on 1 October. Assists and appearances are unavailable in this archive.',
  matches,
  standings,
  scorers: [...scorers.values()]
    .sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name))
    .slice(0, 20),
};
await mkdir('public/demo', { recursive: true });
await writeFile(
  'public/demo/snapshot.json',
  JSON.stringify(snapshot, null, 2) + '\n',
);
console.log(
  JSON.stringify({
    matches: matches.length,
    replayed: evening.length,
    teams: standings.length,
    scorers: snapshot.scorers.length,
  }),
);
