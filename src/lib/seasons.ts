import manifest from '../../public/history/index.json';
import type { Match } from '../types';
export { seasonStart, seasonLabel } from '../../netlify/functions/_lib/season';
export const archiveSeasons = manifest.seasons;
export function feedSeason(matches: Match[]) {
  return matches.find((m) => m.seasonStart != null)?.seasonStart;
}
