import { validate } from './validate';
import { MemoryCache } from './cache';
import { TokenBuckets } from './rateLimit';
import { footballData } from './providers/footballData';
import { apiFootball } from './providers/apiFootball';
import { createTransport, UpstreamError } from './providers/http';
import { logFailure } from './redact';
import type { Provider, Payload } from './providers/types';
interface Environment {
  FOOTBALL_API_KEY?: string;
  DATA_PROVIDER?: string;
  ALLOWED_ORIGIN?: string;
}
export function createHandler(
  options: { provider?: Provider; env?: Environment; now?: () => number } = {},
) {
  const cache = new MemoryCache();
  const visitors = new TokenBuckets();
  const budget = new TokenBuckets(8, 8);
  const pending = new Map<string, Promise<Payload<unknown>>>();
  let cooldown = 0;
  let failures = 0;
  return async (request: Request, ip = 'unknown'): Promise<Response> => {
    const env = options.env ?? process.env;
    const now = options.now?.() ?? Date.now();
    const headers = new Headers({
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      Vary: 'Origin',
    });
    const reply = (data: unknown, status = 200) =>
      new Response(JSON.stringify(data), { status, headers });
    if (env.ALLOWED_ORIGIN)
      headers.set('Access-Control-Allow-Origin', env.ALLOWED_ORIGIN);
    if (request.method !== 'GET') {
      headers.set('Allow', 'GET');
      return reply({ error: 'method_not_allowed' }, 405);
    }
    const origin = request.headers.get('origin');
    if (origin && origin !== env.ALLOWED_ORIGIN)
      return reply({ error: 'forbidden' }, 403);
    let route;
    try {
      route = validate(new URL(request.url), now);
    } catch {
      return reply({ error: 'invalid_request' }, 400);
    }
    if (!visitors.take(ip, now)) {
      headers.set('Retry-After', '2');
      return reply({ error: 'rate_limited' }, 429);
    }
    const providerName = env.DATA_PROVIDER ?? 'football-data';
    if (
      !['football-data', 'api-football'].includes(providerName) ||
      (!options.provider && (!env.FOOTBALL_API_KEY || !env.ALLOWED_ORIGIN))
    )
      return reply({ error: 'feed_not_configured' }, 503);
    const key = providerName + ':' + JSON.stringify(route);
    const cached = cache.get(key, now);
    const ttl =
      route.name === 'standings' || route.name === 'scorers'
        ? 300
        : route.name === 'matches' && route.season
          ? 1800
          : 25;
    const success = (payload: Payload<unknown>) => {
      headers.set(
        'Cache-Control',
        payload.stale
          ? 'public, s-maxage=20, stale-while-revalidate=60'
          : `public, s-maxage=${ttl}, stale-while-revalidate=60`,
      );
      return reply(payload);
    };
    if (cached && cached.expires > now) return success(cached.payload);
    const fallback = (retry: number, status = 429) => {
      headers.set('Retry-After', String(retry));
      return cached
        ? success({ ...cached.payload, stale: true, retryAfter: retry })
        : reply({ error: 'upstream_unavailable' }, status);
    };
    if (cooldown > now) return fallback(Math.ceil((cooldown - now) / 1000));
    let work = pending.get(key);
    if (!work) {
      if (!budget.take('provider', now)) return fallback(8);
      const provider =
        options.provider ??
        (providerName === 'football-data' ? footballData : apiFootball)(
          createTransport(providerName, env.FOOTBALL_API_KEY!),
        );
      work = (async () => {
        let data: unknown;
        switch (route.name) {
          case 'matches': {
            const { name: _, ...filter } = route;
            void _;
            data = await provider.matches(filter);
            break;
          }
          case 'match':
            data = await provider.match(route.id);
            break;
          case 'standings':
            data = await provider.standings();
            break;
          case 'scorers':
            data = await provider.scorers(route.limit);
            break;
        }
        failures = 0;
        return cache.set(key, data, ttl, options.now?.() ?? Date.now());
      })();
      pending.set(key, work);
    }
    try {
      return success(await work);
    } catch (error) {
      const status = error instanceof UpstreamError ? error.status : 502;
      const retry = Math.max(
        Math.min(60, 2 ** Math.min(failures++, 6)),
        error instanceof UpstreamError ? error.retryAfter : 0,
      );
      cooldown = now + retry * 1000;
      logFailure(status, env.FOOTBALL_API_KEY);
      return fallback(retry, status === 429 ? 429 : 502);
    } finally {
      pending.delete(key);
    }
  };
}
export const handleRequest = createHandler();
