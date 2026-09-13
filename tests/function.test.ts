// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { createHandler } from '../netlify/functions/_lib/handler';
import { UpstreamError } from '../netlify/functions/_lib/providers/http';
import { redact } from '../netlify/functions/_lib/redact';
import type { Provider } from '../netlify/functions/_lib/providers/types';
const env = {
  FOOTBALL_API_KEY: 'test-credential-never-public',
  ALLOWED_ORIGIN: 'https://ucl.test',
};
const request = (path: string, method = 'GET') =>
  new Request('https://ucl.test/api/cl/' + path, { method });
const mock = () =>
  ({
    matches: vi.fn().mockResolvedValue([]),
    match: vi.fn(),
    standings: vi.fn().mockResolvedValue([]),
    scorers: vi.fn().mockResolvedValue([]),
  }) satisfies Provider;
describe('proxy boundary', () => {
  it.each([
    'https://evil.test',
    'teams',
    'match/-1',
    'match/0',
    'matches?url=https://evil.test',
    'matches?dateFrom=2026-02-30&dateTo=2026-03-01',
    'matches?dateFrom=2026-09-13',
    'scorers?limit=51',
    'scorers?limit=2&limit=3',
    'standings?foo=1',
    'match/1?season=2026',
  ])('rejects %s', async (path) => {
    const p = mock();
    expect(
      (await createHandler({ provider: p, env })(request(path))).status,
    ).toBe(400);
    expect(p.matches).not.toHaveBeenCalled();
  });
  it('rejects POST and foreign origins', async () => {
    const h = createHandler({ provider: mock(), env });
    expect((await h(request('matches', 'POST'))).status).toBe(405);
    expect(
      (
        await h(
          new Request('https://ucl.test/api/cl/matches', {
            headers: { origin: 'https://evil.test' },
          }),
        )
      ).status,
    ).toBe(403);
  });
  it('caches and coalesces requests without secret headers', async () => {
    const p = mock();
    const h = createHandler({ provider: p, env });
    await Promise.all([h(request('matches')), h(request('matches'))]);
    const response = await h(request('matches'));
    expect(p.matches).toHaveBeenCalledTimes(1);
    expect(await response.text()).not.toContain(env.FOOTBALL_API_KEY);
    expect(JSON.stringify([...response.headers])).not.toContain(
      env.FOOTBALL_API_KEY,
    );
    expect(response.headers.get('access-control-allow-origin')).toBe(
      env.ALLOWED_ORIGIN,
    );
  });
  it('serves stale on quota exhaustion and respects cooldown', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    let now = Date.parse('2026-09-13');
    const p = mock();
    const h = createHandler({ provider: p, env, now: () => now });
    await h(request('matches'));
    now += 26000;
    p.matches.mockRejectedValue(new UpstreamError(429, 60));
    const r = await h(request('matches'));
    expect((await r.json()).stale).toBe(true);
    await h(request('matches'));
    expect(p.matches).toHaveBeenCalledTimes(2);
  });
  it('never forwards upstream error details', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const p = mock();
    p.matches.mockRejectedValue(new Error(env.FOOTBALL_API_KEY));
    const r = await createHandler({ provider: p, env })(request('matches'));
    expect(await r.text()).toBe('{"error":"upstream_unavailable"}');
    expect(log.mock.calls.flat().join()).not.toContain(env.FOOTBALL_API_KEY);
  });
  it('rate limits one visitor', async () => {
    const h = createHandler({ provider: mock(), env });
    for (let i = 0; i < 30; i++)
      expect((await h(request('matches'), 'same')).status).toBe(200);
    expect((await h(request('matches'), 'same')).status).toBe(429);
  });
  it('redacts key occurrences and named credentials', () => {
    expect(redact('oops ' + env.FOOTBALL_API_KEY, env.FOOTBALL_API_KEY)).toBe(
      'oops [redacted]',
    );
    expect(redact('X-Auth-Token: secret')).toBe('X-Auth-Token: [redacted]');
  });
});
