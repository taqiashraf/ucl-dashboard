import { writeFile } from 'node:fs/promises';
const origin = new URL(process.argv[2] ?? 'http://localhost:8888');
if (!['http:', 'https:'].includes(origin.protocol))
  throw new Error('Expected a web origin');
const read = async (route) => {
  const response = await fetch(new URL('/api/cl/' + route, origin));
  if (!response.ok)
    throw new Error(`Capture request failed (${response.status})`);
  return (await response.json()).data;
};
const matches = await read('matches');
const live = matches.filter((m) => ['IN_PLAY', 'PAUSED'].includes(m.status));
if (live.length < 2)
  throw new Error(
    'Wait for a matchday with at least two genuinely in-progress matches. Nothing was overwritten.',
  );
const standings = await read('standings');
const scorers = await read('scorers?limit=20');
const capturedAt = new Date().toISOString();
const date = new Date(live[0].utcDate);
const year = date.getUTCFullYear() - (date.getUTCMonth() < 6 ? 1 : 0);
const snapshot = {
  mode: 'live-capture',
  season: `${year}/${String(year + 1).slice(-2)}`,
  replayAt: capturedAt,
  capturedAt,
  provenance:
    'Normalized provider payload captured while at least two matches were in play. Scores may reflect the provider delay. No scores or statuses were rewritten.',
  sources: [new URL('/api/cl/matches', origin).href],
  standingsNote: 'League table at the time of capture.',
  scorersNote:
    'Scorer statistics at the time of capture. Missing fields remain unknown.',
  matches,
  standings,
  scorers,
};
await writeFile(
  'public/demo/snapshot.json',
  JSON.stringify(snapshot, null, 2) + '\n',
);
console.log(
  `Captured ${live.length} in-progress matches. Review the snapshot, then rebuild.`,
);
