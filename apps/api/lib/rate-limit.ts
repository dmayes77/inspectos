/**
 * Simple in-memory rate limiting for API endpoints
 * For production, consider using Redis or a dedicated rate limiting service
 */

import { rateLimited } from './api-response';
import { logger } from './logger';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  keyPrefix?: string;    // Optional prefix for the rate limit key
}

// In-memory store - will reset on server restart
// For production, use Redis or similar
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Check if a request should be rate limited
 * Returns null if allowed, or a Response if rate limited
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Response | null {
  cleanup();

  const { windowMs, maxRequests, keyPrefix = '' } = config;
  const key = `${keyPrefix}:${identifier}`;
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    // First request or window expired
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return null;
  }

  if (entry.count >= maxRequests) {
    logger.warn('Rate limit exceeded', {
      identifier,
      keyPrefix,
      count: entry.count,
      maxRequests,
    });

    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    const response = rateLimited(`Rate limit exceeded. Try again in ${retryAfter} seconds`);
    response.headers.set('Retry-After', String(retryAfter));
    response.headers.set('X-RateLimit-Limit', String(maxRequests));
    response.headers.set('X-RateLimit-Remaining', '0');
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));
    return response;
  }

  entry.count++;
  return null;
}

/**
 * Rate limit by IP address
 * Default: 100 requests per minute
 */
export function rateLimitByIP(
  request: Request,
  config: Partial<RateLimitConfig> = {}
): Response | null {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  return checkRateLimit(ip, {
    windowMs: config.windowMs ?? 60 * 1000,      // 1 minute
    maxRequests: config.maxRequests ?? 100,       // 100 requests
    keyPrefix: config.keyPrefix ?? 'ip',
  });
}

/**
 * Rate limit by user ID (for authenticated endpoints)
 * Default: 200 requests per minute
 */
export function rateLimitByUser(
  userId: string,
  config: Partial<RateLimitConfig> = {}
): Response | null {
  return checkRateLimit(userId, {
    windowMs: config.windowMs ?? 60 * 1000,      // 1 minute
    maxRequests: config.maxRequests ?? 200,       // 200 requests
    keyPrefix: config.keyPrefix ?? 'user',
  });
}

/**
 * Rate limit by tenant ID
 * Default: 1000 requests per minute
 */
export function rateLimitByTenant(
  tenantId: string,
  config: Partial<RateLimitConfig> = {}
): Response | null {
  return checkRateLimit(tenantId, {
    windowMs: config.windowMs ?? 60 * 1000,      // 1 minute
    maxRequests: config.maxRequests ?? 1000,      // 1000 requests
    keyPrefix: config.keyPrefix ?? 'tenant',
  });
}

// Preset configurations for common use cases
export const RateLimitPresets = {
  // Strict rate limit for auth/login endpoints
  auth: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 10,           // 10 attempts
  },
  // Standard API rate limit
  api: {
    windowMs: 60 * 1000,       // 1 minute
    maxRequests: 100,
  },
  // Relaxed rate limit for sync operations
  sync: {
    windowMs: 60 * 1000,       // 1 minute
    maxRequests: 30,           // 30 syncs per minute
  },
  // Very strict for expensive operations
  expensive: {
    windowMs: 60 * 1000,       // 1 minute
    maxRequests: 10,
  },
} as const;
