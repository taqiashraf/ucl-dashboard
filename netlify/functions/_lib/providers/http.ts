export class UpstreamError extends Error {
  constructor(
    public status: number,
    public retryAfter = 0,
  ) {
    super('Provider request failed');
  }
}
export type Transport = (
  path: string,
  params?: Record<string, string | number>,
) => Promise<unknown>;
export function createTransport(provider: string, key: string): Transport {
  const base =
    provider === 'football-data'
      ? 'https://api.football-data.org/v4/'
      : 'https://v3.football.api-sports.io/';
  return async (path, params = {}) => {
    const url = new URL(path, base);
    for (const [name, value] of Object.entries(params))
      url.searchParams.set(name, String(value));
    const response = await fetch(url, {
      headers:
        provider === 'football-data'
          ? { 'X-Auth-Token': key }
          : { 'x-apisports-key': key },
      redirect: 'error',
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      const retry = response.headers.get('retry-after');
      const seconds =
        retry && /^\d+$/.test(retry)
          ? Number(retry)
          : retry
            ? Math.ceil((Date.parse(retry) - Date.now()) / 1000)
            : 0;
      throw new UpstreamError(
        response.status,
        Math.min(3600, Math.max(0, seconds || 0)),
      );
    }
    return response.json();
  };
}
