// File: lib/rate-limiter.ts
import { NextResponse } from "next/server";

export interface RateLimitConfig {
  limit: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

// In-Memory Token Bucket / Window fallback cache for single-instance or when Redis is unconfigured
interface MemoryBucket {
  count: number;
  resetAt: number;
}

const memoryCache = new Map<string, MemoryBucket>();

// Periodic cleanup of expired in-memory keys to prevent memory leaks in long-running processes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of memoryCache.entries()) {
      if (bucket.resetAt <= now) {
        memoryCache.delete(key);
      }
    }
  }, 60000); // Cleanup every minute
}

/**
 * Extracts a unique client identifier from an incoming request.
 * Prefers authenticated userId if provided, otherwise uses X-Forwarded-For or X-Real-IP headers.
 */
export function getClientIdentifier(request: Request, userId?: string | null): string {
  if (userId) {
    return `user:${userId}`;
  }
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const primaryIp = forwardedFor.split(",")[0].trim();
    if (primaryIp) return `ip:${primaryIp}`;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return `ip:${realIp}`;
  }
  return "ip:anonymous";
}

/**
 * Checks rate limit for a specific identifier and configuration.
 * Automatically utilizes Upstash Redis REST API if environment variables are configured,
 * otherwise falls back to a fail-safe in-memory window bucket.
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { limit, windowSeconds } = config;
  const now = Date.now();
  const resetSeconds = windowSeconds;

  // 1. DISTRIBUTED UPSTASH REDIS REST CHECK (if configured)
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    try {
      const redisKey = `ratelimit:${identifier}`;
      // Execute Redis atomic INCR via REST API
      const incrRes = await fetch(`${redisUrl}/INCR/${encodeURIComponent(redisKey)}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${redisToken}`,
          "Content-Type": "application/json",
        },
      });

      if (incrRes.ok) {
        const incrData = await incrRes.json();
        const currentCount = Number(incrData.result || 1);

        // If this is the first request in the window, set expiry
        if (currentCount === 1) {
          await fetch(`${redisUrl}/EXPIRE/${encodeURIComponent(redisKey)}/${windowSeconds}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${redisToken}`,
              "Content-Type": "application/json",
            },
          });
        }

        const remaining = Math.max(0, limit - currentCount);
        const success = currentCount <= limit;

        return {
          success,
          limit,
          remaining,
          resetSeconds,
        };
      }
    } catch (redisError) {
      // Fail-open safety: if distributed Redis is unreachable, log warning and fall back to in-memory
      console.warn("Distributed rate limiter (Upstash) error, falling back to in-memory:", redisError);
    }
  }

  // 2. IN-MEMORY TOKEN BUCKET FALLBACK
  const key = `ratelimit:${identifier}`;
  const existing = memoryCache.get(key);

  if (!existing || existing.resetAt <= now) {
    const bucket: MemoryBucket = {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    };
    memoryCache.set(key, bucket);
    return {
      success: 1 <= limit,
      limit,
      remaining: Math.max(0, limit - 1),
      resetSeconds,
    };
  }

  existing.count += 1;
  const remaining = Math.max(0, limit - existing.count);
  const success = existing.count <= limit;
  const remainingWindowSeconds = Math.ceil((existing.resetAt - now) / 1000);

  return {
    success,
    limit,
    remaining,
    resetSeconds: remainingWindowSeconds > 0 ? remainingWindowSeconds : windowSeconds,
  };
}

/**
 * Generates an HTTP 429 Too Many Requests response with RFC-compliant RateLimit and Retry-After headers.
 */
export function rateLimitResponse(
  result: RateLimitResult,
  message?: string
): NextResponse {
  return NextResponse.json(
    {
      error: message || "Çok fazla istekte bulundunuz. Lütfen bir süre bekleyip tekrar deneyin.",
      retryAfterSeconds: result.resetSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.resetSeconds),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(result.resetSeconds),
      },
    }
  );
}
