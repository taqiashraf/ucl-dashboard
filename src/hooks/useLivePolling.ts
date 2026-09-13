import type { Match } from '../types';
import { ApiError } from '../lib/api';
import { backoff, pollingInterval } from '../lib/time';
export function intervalFor(
  matches: Match[],
  error: Error | null,
  visible: boolean,
  slow = false,
): number | false {
  if (!visible) return false;
  if (error instanceof ApiError) {
    if (error.code === 'feed_not_configured') return 300_000;
    return Math.max(backoff(error.failures), error.retryAfter * 1000);
  }
  return slow ? 300_000 : pollingInterval(matches);
}
