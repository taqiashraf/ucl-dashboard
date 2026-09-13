import type { Match } from '../types';
export const isLive = (m: Pick<Match, 'status'>) =>
  m.status === 'IN_PLAY' || m.status === 'PAUSED';
export const backoff = (failures: number) =>
  Math.min(60_000, 1_000 * 2 ** Math.min(Math.max(0, failures - 1), 6));
export function pollingInterval(matches: Match[], now = Date.now()): number {
  if (
    matches.some(isLive) ||
    matches.some(
      (m) =>
        ['SCHEDULED', 'TIMED'].includes(m.status) &&
        Math.abs(Date.parse(m.utcDate) - now) <= 10 * 60_000,
    )
  )
    return 30_000;
  const next = matches
    .filter(
      (m) =>
        ['SCHEDULED', 'TIMED'].includes(m.status) &&
        Date.parse(m.utcDate) > now,
    )
    .sort((a, b) => a.utcDate.localeCompare(b.utcDate))[0];
  return next && Date.parse(next.utcDate) - now > 6 * 3600000
    ? 900_000
    : 300_000;
}
export function matchClock(
  match: Match,
  now: number,
  receivedAt: number,
): string {
  if (match.status === 'PAUSED')
    return match.period === 'EXTRA_TIME' ? 'ET break' : 'HT';
  if (match.status !== 'IN_PLAY')
    return match.status === 'FINISHED'
      ? 'FT'
      : match.status.toLowerCase().replaceAll('_', ' ');
  if (match.period === 'PENALTIES') return 'Pens';
  if (match.period === 'EXTRA_TIME')
    return match.minute == null ? 'ET' : `${Math.min(120, match.minute)}′ ET`;
  const elapsed = Math.max(0, Math.floor((now - receivedAt) / 60000));
  if (match.minute != null) {
    const boundary =
      match.period === 'SECOND_HALF' || match.minute > 45 ? 90 : 45;
    return `${Math.min(boundary, match.minute + elapsed)}${match.minute >= boundary ? '+' : ''}′`;
  }
  // A delayed score feed cannot establish the half from kickoff alone. Stay at 45 until a second-half anchor arrives.
  const minute = Math.max(
    0,
    Math.floor((now - Date.parse(match.utcDate)) / 60000),
  );
  return `~${Math.min(match.period === 'SECOND_HALF' ? 90 : 45, match.period === 'SECOND_HALF' ? Math.max(46, minute - 15) : minute)}′`;
}
export function countdown(date: string, now: number): string {
  const minutes = Math.max(0, Math.ceil((Date.parse(date) - now) / 60000));
  const days = Math.floor(minutes / 1440);
  return days
    ? `in ${days}d ${Math.floor((minutes % 1440) / 60)}h`
    : minutes >= 60
      ? `in ${Math.floor(minutes / 60)}h ${minutes % 60}m`
      : minutes
        ? `in ${minutes}m`
        : 'kickoff due';
}
