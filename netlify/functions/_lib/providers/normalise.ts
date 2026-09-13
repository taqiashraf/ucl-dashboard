import { z } from 'zod';
import { matchStatuses, type MatchStatus } from './types';
export const scoreSchema = z.object({
  home: z.number().nullable().optional(),
  away: z.number().nullable().optional(),
});
export const safeCrest = (value: string | null | undefined): string | null => {
  try {
    const url = new URL(value ?? '');
    return url.protocol === 'https:' &&
      ['crests.football-data.org', 'media.api-sports.io'].includes(url.hostname)
      ? url.href
      : null;
  } catch {
    return null;
  }
};
export function normaliseStatus(value: string): MatchStatus {
  if (!(matchStatuses as readonly string[]).includes(value))
    throw new Error('Unsupported match status');
  return value as MatchStatus;
}
