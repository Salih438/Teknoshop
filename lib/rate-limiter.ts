// File: lib/rate-limiter.ts
import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export interface RateLimitConfig {
  limit: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
  storage: "distributed-redis" | "local-memory-fallback";
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
 * Validates whether a given string is a plausible IPv4 or IPv6 address.
 */
function isValidIp(ip: string): boolean {
  // Basic IPv4 check
  const ipv4Regex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
  // Basic IPv6 check
  const ipv6Regex = /^(?:[a-fA-F0-9]{1,4}:){1,7}[a-fA-F0-9]{1,4}$|^::1$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Extracts a unique client identifier from an incoming request.
 * 1. Prefers authenticated userId if provided (`user:<id>`).
 * 2. Checks trusted headers: `x-real-ip`, `cf-connecting-ip`, `x-vercel-ip`.
 * 3. Falls back to sanitized `x-forwarded-for` or anonymous fallback.
 */
export function getClientIdentifier(request: Request, userId?: string | null): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Trusted proxy headers (Vercel, Cloudflare, Nginx)
  const realIp = request.headers.get("x-real-ip");
  if (realIp && isValidIp(realIp.trim())) {
    return `ip:${realIp.trim()}`;
  }

  const vercelIp = request.headers.get("x-vercel-ip");
  if (vercelIp && isValidIp(vercelIp.trim())) {
    return `ip:${vercelIp.trim()}`;
  }

  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp && isValidIp(cfIp.trim())) {
    return `ip:${cfIp.trim()}`;
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const parts = forwardedFor.split(",").map((s) => s.trim());
    const candidate = parts[0];
    if (candidate && isValidIp(candidate)) {
      return `ip:${candidate}`;
    }
  }

  return "ip:anonymous";
}

/**
 * Checks rate limit for a specific identifier and configuration.
 * - Distributed Upstash Redis REST is utilized when credentials are present.
 * - In-Memory Window Bucket is utilized as a local development/single-instance fallback.
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { limit, windowSeconds } = config;
  const now = Date.now();
  const resetSeconds = windowSeconds;

  // 1. DISTRIBUTED UPSTASH REDIS REST CHECK (if configured)
  const redisUrl = env.UPSTASH_REDIS_REST_URL;
  const redisToken = env.UPSTASH_REDIS_REST_TOKEN;

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
          storage: "distributed-redis",
        };
      }
    } catch (redisError) {
      // Fail-open safety: if distributed Redis is unreachable, fall back to in-memory
      console.warn("Distributed rate limiter (Upstash) unreachable, using local fallback:", redisError);
    }
  }

  // 2. IN-MEMORY TOKEN BUCKET FALLBACK (Local Development / Single-Instance)
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
      storage: "local-memory-fallback",
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
    storage: "local-memory-fallback",
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
