const buckets = new Map<string, number[]>();

function prune(now: number, windowMs: number, stamps: number[]) {
  return stamps.filter((t) => now - t < windowMs);
}

export function rateLimitAllow(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const prev = buckets.get(key) ?? [];
  const recent = prune(now, windowMs, prev);
  if (recent.length >= max) {
    buckets.set(key, recent);
    return false;
  }
  recent.push(now);
  buckets.set(key, recent);
  return true;
}
