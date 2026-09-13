import { createHmac, randomBytes } from 'node:crypto';
export class TokenBuckets {
  private buckets = new Map<string, { tokens: number; at: number }>();
  private salt = randomBytes(32);
  constructor(
    private capacity = 30,
    private perMinute = 30,
  ) {}
  take(ip: string, now = Date.now()) {
    const key = createHmac('sha256', this.salt).update(ip).digest('hex');
    for (const [id, b] of this.buckets)
      if (now - b.at > 60000) this.buckets.delete(id);
    const old = this.buckets.get(key) ?? { tokens: this.capacity, at: now };
    const tokens = Math.min(
      this.capacity,
      old.tokens + ((now - old.at) * this.perMinute) / 60000,
    );
    if (this.buckets.size >= 5000 && !this.buckets.has(key)) return false;
    this.buckets.set(key, {
      tokens: tokens >= 1 ? tokens - 1 : tokens,
      at: now,
    });
    return tokens >= 1;
  }
}
