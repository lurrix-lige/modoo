import { FastifyRequest, FastifyReply } from 'fastify';
import { errorResponse, ErrorCodes } from '../utils/apiResponse';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  maxRequests: 100,
};

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function createRateLimiter(config: RateLimitConfig = DEFAULT_CONFIG) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const clientId = request.ip || (request.headers['x-forwarded-for'] as string) || 'unknown';
    const now = Date.now();

    let entry = rateLimitStore.get(clientId);

    if (!entry || now > entry.resetTime) {
      entry = {
        count: 1,
        resetTime: now + config.windowMs,
      };
    } else if (entry.count >= config.maxRequests) {
      const remainingTime = Math.ceil((entry.resetTime - now) / 1000);
      return reply.status(429).send(
        errorResponse(
          ErrorCodes.SYS_RATE_LIMITED,
          config.message || `请求过于频繁，请 ${remainingTime} 秒后再试`
        )
      );
    } else {
      entry.count++;
    }

    rateLimitStore.set(clientId, entry);

    reply.header('X-RateLimit-Limit', config.maxRequests);
    reply.header('X-RateLimit-Remaining', config.maxRequests - entry.count);
    reply.header('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));
  };
}

export function strictRateLimiter() {
  return createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 10,
    message: '请求过于频繁，请稍后重试',
  });
}
