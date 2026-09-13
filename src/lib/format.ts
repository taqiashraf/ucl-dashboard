import type { Match } from '../types';
export const kickoff = (date: string, timeZone?: string) =>
  new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  }).format(new Date(date));
export const dateLabel = (date: string, timeZone?: string) =>
  new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone,
  }).format(new Date(date));
export function groupByDate(
  matches: Match[],
  timeZone?: string,
): [string, Match[]][] {
  const groups = new Map<string, Match[]>();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone,
  });
  for (const match of [...matches].sort((a, b) =>
    a.utcDate.localeCompare(b.utcDate),
  )) {
    const key = formatter.format(new Date(match.utcDate));
    groups.set(key, [...(groups.get(key) ?? []), match]);
  }
  return [...groups];
}
export const scoreText = (score: {
  home: number | null;
  away: number | null;
}) => `${score.home ?? '–'} — ${score.away ?? '–'}`;
export const stageLabel = (stage: string) =>
  stage
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/^./, (c) => c.toUpperCase());
