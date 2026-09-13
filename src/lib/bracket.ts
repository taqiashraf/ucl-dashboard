import type { Match } from '../types';
const rounds = [
  'Play-offs',
  'Round of 16',
  'Quarter-finals',
  'Semi-finals',
  'Final',
];
export function knockoutRound(stage: string): number {
  const s = stage.toLowerCase().replaceAll('_', ' ').replaceAll('-', ' ');
  if (/qualif/.test(s)) return -1;
  if (/quarter/.test(s)) return 2;
  if (/semi/.test(s)) return 3;
  if (/round of 16|last 16/.test(s)) return 1;
  if (/play.?off|play off/.test(s)) return 0;
  return /(^|\s)final$/.test(s.trim()) ? 4 : -1;
}
export function buildBracket(matches: Match[]) {
  return rounds.map((name, index) => {
    const ties = new Map<string, Match[]>();
    matches
      .filter((m) => knockoutRound(m.stage) === index)
      .sort((a, b) => a.utcDate.localeCompare(b.utcDate))
      .forEach((m) => {
        // Unknown teams must not collapse into a single tie before the draw.
        const key =
          m.home.id && m.away.id
            ? [m.home.id, m.away.id].sort((a, b) => a - b).join(':')
            : `unassigned:${m.id}`;
        ties.set(key, [...(ties.get(key) ?? []), m]);
      });
    return { name, ties: [...ties.values()] };
  });
}
