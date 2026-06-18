import { LRUCache } from "lru-cache";
import { NextResponse, type NextRequest } from "next/server";

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  auth: { limit: 5, windowMs: 15 * 60 * 1000 },
  upload: { limit: 5, windowMs: 60 * 1000 },
  ai: { limit: 10, windowMs: 60 * 1000 },
  general: { limit: 60, windowMs: 60 * 1000 },
};

function getRouteCategory(pathname: string): keyof typeof RATE_LIMITS {
  if (pathname.startsWith("/api/auth")) return "auth";
  if (pathname.startsWith("/api/upload")) return "upload";
  if (pathname.startsWith("/api/ai") || pathname.startsWith("/api/llm")) return "ai";
  return "general";
}

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

const caches = Object.fromEntries(
  Object.entries(RATE_LIMITS).map(([key, config]) => [
    key,
    new LRUCache<string, TokenBucket>({
      max: 5000,
      ttl: config.windowMs,
    }),
  ])
) as Record<keyof typeof RATE_LIMITS, LRUCache<string, TokenBucket>>;

export function checkRateLimit(
  ip: string,
  category: keyof typeof RATE_LIMITS
): { allowed: boolean; remaining: number; retryAfterSec: number } {
  const config = RATE_LIMITS[category];
  const cache = caches[category];
  const now = Date.now();

  let bucket = cache.get(ip);

  if (!bucket) {
    bucket = { tokens: config.limit - 1, lastRefill: now };
    cache.set(ip, bucket);
    return { allowed: true, remaining: bucket.tokens, retryAfterSec: 0 };
  }

  const elapsed = now - bucket.lastRefill;
  const refillRate = config.limit / config.windowMs;
  const tokensToAdd = elapsed * refillRate;
  bucket.tokens = Math.min(config.limit, bucket.tokens + tokensToAdd);
  bucket.lastRefill = now;

  if (bucket.tokens < 1) {
    const waitMs = (1 - bucket.tokens) / refillRate;
    cache.set(ip, bucket);
    return { allowed: false, remaining: 0, retryAfterSec: Math.ceil(waitMs / 1000) };
  }

  bucket.tokens -= 1;
  cache.set(ip, bucket);
  return { allowed: true, remaining: Math.floor(bucket.tokens), retryAfterSec: 0 };
}

export function rateLimitRequest(request: NextRequest): NextResponse | null {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const category = getRouteCategory(request.nextUrl.pathname);
  const { allowed, remaining, retryAfterSec } = checkRateLimit(ip, category);

  if (!allowed) {
    return NextResponse.json(
      {
        error: "Too Many Requests",
        message: `Rate limit exceeded. Try again in ${retryAfterSec} seconds.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSec),
          "X-RateLimit-Limit": String(RATE_LIMITS[category].limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  return null;
}
