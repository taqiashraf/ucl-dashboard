import type { DemoSnapshot, Payload } from '../types';
export class ApiError extends Error {
  constructor(
    public status: number,
    public failures: number,
    public retryAfter: number,
    public code: string,
  ) {
    super('Match feed unavailable');
  }
}
const failures = new Map<string, number>();
export async function getFeed<T>(
  route: string,
  signal?: AbortSignal,
): Promise<Payload<T>> {
  let response: Response;
  try {
    response = await fetch('/api/cl/' + route, { signal, credentials: 'omit' });
  } catch (error) {
    if (signal?.aborted) throw error;
    const n = (failures.get(route) ?? 0) + 1;
    failures.set(route, n);
    throw new ApiError(0, n, 0, 'network_unavailable');
  }
  if (!response.ok) {
    const n = (failures.get(route) ?? 0) + 1;
    failures.set(route, n);
    const body = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      n,
      Math.min(
        3600,
        Math.max(0, Number(response.headers.get('retry-after')) || 0),
      ),
      typeof body.error === 'string' ? body.error : 'upstream_unavailable',
    );
  }
  failures.delete(route);
  return response.json();
}
export async function getDemo(signal?: AbortSignal): Promise<DemoSnapshot> {
  const response = await fetch('/demo/snapshot.json', {
    signal,
    credentials: 'omit',
  });
  if (!response.ok)
    throw new ApiError(response.status, 1, 0, 'demo_unavailable');
  return response.json();
}
export const demoMode = () =>
  new URLSearchParams(window.location.search).get('demo') === '1';
