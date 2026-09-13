import { RefreshCw } from 'lucide-react';
import { useNow } from '../hooks/useMatchClock';
import { usePageVisibility } from '../hooks/usePageVisibility';
export function RefreshStatus({
  updatedAt,
  fetching,
  error,
  replay = false,
  stale = false,
}: {
  updatedAt?: string;
  fetching: boolean;
  error: boolean;
  replay?: boolean;
  stale?: boolean;
}) {
  const now = useNow();
  const visible = usePageVisibility();
  const age = updatedAt
    ? Math.max(0, Math.floor((now - Date.parse(updatedAt)) / 1000))
    : 0;
  return (
    <span className="refresh-status">
      <RefreshCw size={13} />
      {replay
        ? 'Historical replay'
        : !visible
          ? 'Updates paused'
          : fetching
            ? 'Updating…'
            : error
              ? 'Reconnecting'
              : stale
                ? 'Showing cached data'
                : updatedAt
                  ? `Updated ${age < 60 ? `${age}s` : `${Math.floor(age / 60)}m`} ago`
                  : 'Waiting for feed'}
    </span>
  );
}
