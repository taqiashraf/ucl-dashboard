import { RefreshCw, WifiOff } from 'lucide-react';
import { ApiError } from '../../lib/api';
import { backoff } from '../../lib/time';
import { useNow } from '../../hooks/useMatchClock';
export function ErrorState({
  error,
  retry,
  errorAt = 0,
  subject = 'match feed',
  fetching = false,
}: {
  error: Error;
  retry: () => void;
  errorAt?: number;
  subject?: string;
  fetching?: boolean;
}) {
  const now = useNow();
  const configured =
    error instanceof ApiError && error.code === 'feed_not_configured';
  const wait =
    error instanceof ApiError
      ? Math.max(backoff(error.failures), error.retryAfter * 1000)
      : 1000;
  const seconds = Math.max(1, Math.ceil((errorAt + wait - now) / 1000));
  return (
    <div className="error-state" role="status">
      <WifiOff size={22} />
      <div>
        <strong>
          {configured
            ? 'The live feed is not connected.'
            : `Couldn’t reach the ${subject}.`}
        </strong>
        <p>
          {configured
            ? 'Live scores need a server-side API key. Recent results are available in History without an account.'
            : `Retrying in ${seconds}s. The rest of your dashboard stays available.`}
        </p>
        <div className="state-actions">
          <button onClick={retry} disabled={fetching}>
            <RefreshCw size={14} />
            {fetching ? 'Connecting…' : 'Try again'}
          </button>
          {configured && <a href="?view=history">Browse recent results</a>}
        </div>
      </div>
    </div>
  );
}
