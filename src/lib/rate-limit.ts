import "server-only";
import { RateLimitError } from "@/lib/errors";
type Bucket = {
    count: number;
    resetAt: number;
};
const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();
const SWEEP_INTERVAL_MS = 60000;
function sweep(now: number) {
    if (now - lastSweep < SWEEP_INTERVAL_MS)
        return;
    lastSweep = now;
    for (const [key, bucket] of buckets) {
        if (bucket.resetAt <= now)
            buckets.delete(key);
    }
}
export type RateLimitOptions = {
    name: string;
    identifier: string;
    limit: number;
    windowMs: number;
};
export function enforceRateLimit({ name, identifier, limit, windowMs, }: RateLimitOptions): void {
    const now = Date.now();
    sweep(now);
    const key = `${name}:${identifier}`;
    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return;
    }
    bucket.count += 1;
    if (bucket.count > limit) {
        throw new RateLimitError(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)));
    }
}
export function resetRateLimit(name: string, identifier: string) {
    buckets.delete(`${name}:${identifier}`);
}
export function clientIdentifier(request: Request): string {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded)
        return forwarded.split(",")[0]!.trim();
    return (request.headers.get("x-real-ip") ??
        request.headers.get("cf-connecting-ip") ?? "unknown");
}
