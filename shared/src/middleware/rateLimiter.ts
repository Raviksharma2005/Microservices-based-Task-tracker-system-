import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../utils/redis';
import { createLogger } from '../utils/logger';

const logger = createLogger('rate-limiter');

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export function rateLimiter(config?: Partial<RateLimitConfig>) {
  const windowMs = config?.windowMs || parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
  const maxRequests = config?.maxRequests || parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '60', 10);
  const windowSeconds = Math.ceil(windowMs / 1000);

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const redis = getRedisClient();
      const identifier = req.user?.userId || req.ip || 'anonymous';
      const key = `ratelimit:${identifier}`;

      const current = await redis.incr(key);

      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }

      // Set rate limit headers
      const ttl = await redis.ttl(key);
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - current).toString());
      res.setHeader('X-RateLimit-Reset', (Date.now() + ttl * 1000).toString());

      if (current > maxRequests) {
        logger.warn({ identifier, current, maxRequests }, 'Rate limit exceeded');
        res.status(429).json({
          success: false,
          error: 'Too many requests. Please try again later.',
          retryAfter: ttl,
        });
        return;
      }

      next();
    } catch (err) {
      // If Redis is down, allow the request through (fail-open)
      logger.error({ err }, 'Rate limiter error — allowing request');
      next();
    }
  };
}
