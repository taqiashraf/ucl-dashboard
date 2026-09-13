import type { Payload } from './providers/types';
export class MemoryCache {
  private entries = new Map<
    string,
    { payload: Payload<unknown>; expires: number; discard: number }
  >();
  get(key: string, now = Date.now()) {
    const e = this.entries.get(key);
    if (e && e.discard <= now) {
      this.entries.delete(key);
      return undefined;
    }
    return e;
  }
  set(key: string, data: unknown, ttl: number, now = Date.now()) {
    if (this.entries.size >= 200)
      this.entries.delete(this.entries.keys().next().value!);
    const payload = {
      data,
      updatedAt: new Date(now).toISOString(),
      stale: false,
    };
    this.entries.set(key, {
      payload,
      expires: now + ttl * 1000,
      discard: now + 3600000,
    });
    return payload;
  }
}
