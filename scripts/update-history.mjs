import { mkdir, readFile, writeFile } from 'node:fs/promises';
// Re-run with no arguments to refresh the static archive from ESPN.
// --local uses previously downloaded scoreboards for reproducible offline builds.
const now = new Date();
await mkdir('public/history', { recursive: true });
const current = now.getUTCFullYear() - (now.getUTCMonth() < 6 ? 1 : 0);
const seasons = [];
for (let year = current - 7; year <= current; year++) {
  const end = `${year + 1}0831`;
  const today = now.toISOString().slice(0, 10).replaceAll('-', '');
  const dates = `${year}0901-${today < end ? today : end}`;
  const source = `https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/scoreboard?dates=${dates}&limit=1000`;
  const raw =
    today < `${year}0901`
      ? { events: [] }
      : process.argv.includes('--local')
        ? JSON.parse(await readFile(`../../work/season${year}.json`, 'utf8'))
        : await fetch(source, { signal: AbortSignal.timeout(20000) }).then(
            (r) => {
              if (!r.ok) throw new Error(`Archive HTTP ${r.status}`);
              return r.json();
            },
          );
  const team = (c) => ({
    id: Number(c.team.id),
    name: c.team.displayName,
    shortName: c.team.shortDisplayName,
    tla: c.team.abbreviation,
    crest: null,
  });
  const matches = raw.events
    .filter(
      (e) =>
        e.season?.year === year &&
        !/qualif/i.test(e.season?.slug ?? '') &&
        e.status.type.completed &&
        new Date(e.date) <= now,
    )
    .map((e) => {
      const c = e.competitions[0];
      const h = c.competitors.find((t) => t.homeAway === 'home');
      const a = c.competitors.find((t) => t.homeAway === 'away');
      const score = { home: Number(h.score), away: Number(a.score) };
      const notes = [];
      if (h.shootoutScore != null && a.shootoutScore != null)
        notes.push(`Penalties: ${h.shootoutScore}–${a.shootoutScore}`);
      if (h.aggregateScore != null && a.aggregateScore != null)
        notes.push(`Aggregate: ${h.aggregateScore}–${a.aggregateScore}`);
      return {
        id: Number(e.id),
        utcDate: e.date,
        status: 'FINISHED',
        minute: null,
        period: null,
        stage: (c.altGameNote || 'Champions League').replace(
          'UEFA Champions League, ',
          '',
        ),
        matchday: null,
        venue: c.venue?.fullName ?? null,
        referee: null,
        home: team(h),
        away: team(a),
        score,
        halfTime: { home: null, away: null },
        fullTime: score,
        updatedAt: now.toISOString(),
        resultNote: notes.join(' · '),
        source: `https://www.espn.com/soccer/match/_/gameId/${e.id}`,
      };
    })
    .sort((a, b) => b.utcDate.localeCompare(a.utcDate));
  if (
    (year < current && !matches.length) ||
    matches.some(
      (m) => !Number.isFinite(m.score.home) || !Number.isFinite(m.score.away),
    )
  )
    throw new Error('Invalid archive');
  const ids = new Set(matches.map((m) => m.id));
  if (ids.size !== matches.length)
    throw new Error('Duplicate archive match IDs');
  const previous = await readFile(`public/history/${year}.json`, 'utf8')
    .then(JSON.parse)
    .catch(() => null);
  if (previous && matches.length < previous.matches.length)
    throw new Error(
      `Archive shrank for ${year}; inspect source before publishing`,
    );
  seasons.push({
    year,
    label: `${year}/${String(year + 1).slice(-2)}`,
    count: matches.length,
  });
  console.log(`${year}: ${matches.length} completed matches`);
  await writeFile(
    `public/history/${year}.json`,
    JSON.stringify(
      {
        season: `${year}/${String(year + 1).slice(-2)}`,
        updatedAt: now.toISOString(),
        source,
        coverage:
          'Completed group/league-phase and knockout matches. Qualifying rounds are excluded. Source snapshot; see update date.',
        matches,
      },
      null,
      2,
    ) + '\n',
  );
}

await writeFile(
  'public/history/index.json',
  JSON.stringify(
    { updatedAt: now.toISOString(), seasons: seasons.reverse() },
    null,
    2,
  ) + '\n',
);
