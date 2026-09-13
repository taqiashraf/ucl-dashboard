import { useQuery } from '@tanstack/react-query';
import { getFeed, getDemo } from '../lib/api';
import type { Match, StandingRow, ScorerRow, Payload } from '../types';
import { usePageVisibility } from './usePageVisibility';
import { intervalFor } from './useLivePolling';
export const useDemo = (enabled: boolean) =>
  useQuery({
    queryKey: ['demo'],
    queryFn: ({ signal }) => getDemo(signal),
    enabled,
    staleTime: Infinity,
    retry: false,
  });
function useFeed<T>(route: string, enabled: boolean, slow = false) {
  const visible = usePageVisibility();
  return useQuery<Payload<T>, Error>({
    queryKey: ['feed', route],
    queryFn: ({ signal }) => getFeed<T>(route, signal),
    enabled: enabled && visible,
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: 'always',
    refetchIntervalInBackground: false,
    refetchInterval: (query) => {
      const interval = intervalFor(
        route === 'matches' ? ((query.state.data?.data as Match[]) ?? []) : [],
        query.state.error,
        visible,
        slow,
      );
      return interval === false
        ? false
        : Math.max(interval, (query.state.data?.retryAfter ?? 0) * 1000);
    },
  });
}
export const useMatches = (enabled = true) =>
  useFeed<Match[]>('matches', enabled);
export const useStandings = (enabled = true) =>
  useFeed<StandingRow[]>('standings', enabled, true);
export const useScorers = (enabled = true) =>
  useFeed<ScorerRow[]>('scorers?limit=20', enabled, true);
export const useMatch = (id: number | null, enabled = true) =>
  useFeed<Match>(`match/${id}`, enabled && id !== null);
