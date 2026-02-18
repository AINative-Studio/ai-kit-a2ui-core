import type { Request, Response, NextFunction } from 'express'
import type { AuthRequest } from '../types/express-types'

/**
 * Rate limit configuration
 */
export interface RateLimitOptions {
  windowMs?: number
  maxRequests?: number
}

/**
 * Rate limiter using token bucket algorithm
 */
class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map()

  constructor(
    private windowMs: number,
    private maxRequests: number
  ) {}

  /**
   * Check if request is allowed and increment counter
   */
  async check(key: string): Promise<boolean> {
    const now = Date.now()
    const record = this.requests.get(key)

    // Clean up expired records
    if (record && now > record.resetTime) {
      this.requests.delete(key)
    }

    const current = this.requests.get(key)

    if (!current) {
      // First request in window
      this.requests.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      })
      return true
    }

    // Check if limit exceeded
    if (current.count >= this.maxRequests) {
      return false
    }

    // Increment counter
    current.count++
    return true
  }

  /**
   * Clean up expired entries periodically
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(key)
      }
    }
  }
}

const limiters: Map<string, RateLimiter> = new Map()

/**
 * Create rate limit middleware
 */
export function createRateLimitMiddleware(options?: RateLimitOptions) {
  const windowMs = options?.windowMs || parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000')
  const maxRequests = options?.maxRequests || parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '60')

  const limiterKey = `${windowMs}-${maxRequests}`
  let limiter = limiters.get(limiterKey)

  if (!limiter) {
    limiter = new RateLimiter(windowMs, maxRequests)
    limiters.set(limiterKey, limiter)

    // Cleanup expired entries every minute
    setInterval(() => limiter!.cleanup(), 60000)
  }

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authReq = req as AuthRequest

    // Use user ID if authenticated, otherwise use IP
    const key = authReq.user?.id || req.ip || 'unknown'

    const allowed = await limiter!.check(key)

    if (!allowed) {
      res.status(429).json({
        error: 'Too many requests, please try again later',
        retryAfter: Math.ceil(windowMs / 1000),
      })
      return
    }

    next()
  }
}
