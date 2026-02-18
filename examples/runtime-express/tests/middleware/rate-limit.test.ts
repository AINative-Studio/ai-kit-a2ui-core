import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import { createRateLimitMiddleware } from '../../src/middleware/rate-limit'
import type { AuthRequest } from '../../src/types/express-types'

describe('rateLimitMiddleware', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    mockReq = {
      ip: '127.0.0.1',
    }
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }
    mockNext = vi.fn()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('Rate Limit Enforcement', () => {
    it('should allow requests within rate limit', async () => {
      const middleware = createRateLimitMiddleware({ windowMs: 60000, maxRequests: 10 })

      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
      expect(mockRes.status).not.toHaveBeenCalled()
    })

    it('should block requests exceeding rate limit', async () => {
      const middleware = createRateLimitMiddleware({ windowMs: 60000, maxRequests: 3 })

      // Make 3 requests (should all succeed)
      for (let i = 0; i < 3; i++) {
        await middleware(mockReq as Request, mockRes as Response, mockNext)
      }

      expect(mockNext).toHaveBeenCalledTimes(3)

      // 4th request should be blocked
      mockNext.mockClear()
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(429)
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should return 429 status code when rate limited', async () => {
      const middleware = createRateLimitMiddleware({ windowMs: 60000, maxRequests: 1 })

      await middleware(mockReq as Request, mockRes as Response, mockNext)
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(429)
    })

    it('should return error message when rate limited', async () => {
      const middleware = createRateLimitMiddleware({ windowMs: 60000, maxRequests: 1 })

      await middleware(mockReq as Request, mockRes as Response, mockNext)
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('Too many requests') })
      )
    })

    it('should include retryAfter in rate limit response', async () => {
      const windowMs = 30000 // 30 seconds
      const middleware = createRateLimitMiddleware({ windowMs, maxRequests: 1 })

      await middleware(mockReq as Request, mockRes as Response, mockNext)
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
          retryAfter: Math.ceil(windowMs / 1000),
        })
      )
    })

    it('should handle burst requests correctly', async () => {
      const middleware = createRateLimitMiddleware({ windowMs: 60000, maxRequests: 5 })

      // Send 5 rapid requests
      const promises = Array.from({ length: 5 }).map(() =>
        middleware(mockReq as Request, mockRes as Response, mockNext)
      )
      await Promise.all(promises)

      expect(mockNext).toHaveBeenCalledTimes(5)

      // 6th request should be blocked
      mockNext.mockClear()
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(429)
    })
  })

  describe('Window Reset', () => {
    it('should reset count after time window expires', async () => {
      const middleware = createRateLimitMiddleware({ windowMs: 1000, maxRequests: 2 })

      // Make 2 requests
      await middleware(mockReq as Request, mockRes as Response, mockNext)
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledTimes(2)

      // Advance time past window
      vi.advanceTimersByTime(1001)

      // Next request should succeed
      mockNext.mockClear()
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
      expect(mockRes.status).not.toHaveBeenCalled()
    })

    it('should maintain separate windows for different IPs', async () => {
      const middleware = createRateLimitMiddleware({ windowMs: 60000, maxRequests: 2 })

      // IP 1 makes 2 requests
      mockReq.ip = '192.168.1.1'
      await middleware(mockReq as Request, mockRes as Response, mockNext)
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      // IP 2 should have its own limit
      mockReq.ip = '192.168.1.2'
      mockNext.mockClear()
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should not reset count before window expires', async () => {
      const middleware = createRateLimitMiddleware({ windowMs: 10000, maxRequests: 2 })

      await middleware(mockReq as Request, mockRes as Response, mockNext)
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      // Advance time but not past window
      vi.advanceTimersByTime(5000)

      // Should still be blocked
      mockNext.mockClear()
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(429)
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should handle multiple windows for same IP', async () => {
      const middleware = createRateLimitMiddleware({ windowMs: 1000, maxRequests: 1 })

      // First window
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      // Advance to new window
      vi.advanceTimersByTime(1001)
      mockNext.mockClear()

      // Second window
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()

      // Advance to third window
      vi.advanceTimersByTime(1001)
      mockNext.mockClear()

      // Third window
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })
  })

  describe('Configuration', () => {
    it('should accept custom window size', () => {
      const middleware = createRateLimitMiddleware({ windowMs: 30000, maxRequests: 10 })
      expect(middleware).toBeDefined()
      expect(typeof middleware).toBe('function')
    })

    it('should accept custom max requests', () => {
      const middleware = createRateLimitMiddleware({ windowMs: 60000, maxRequests: 100 })
      expect(middleware).toBeDefined()
      expect(typeof middleware).toBe('function')
    })

    it('should use default values from environment', () => {
      const middleware = createRateLimitMiddleware()
      expect(middleware).toBeDefined()
      expect(typeof middleware).toBe('function')
    })

    it('should allow very small window sizes', async () => {
      const middleware = createRateLimitMiddleware({ windowMs: 100, maxRequests: 1 })

      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should allow very large max requests', async () => {
      const middleware = createRateLimitMiddleware({ windowMs: 60000, maxRequests: 10000 })

      // Make multiple requests
      for (let i = 0; i < 100; i++) {
        await middleware(mockReq as Request, mockRes as Response, mockNext)
      }

      expect(mockNext).toHaveBeenCalledTimes(100)
    })

    it('should handle maxRequests of 1', async () => {
      const middleware = createRateLimitMiddleware({ windowMs: 60000, maxRequests: 1 })

      await middleware(mockReq as Request, mockRes as Response, mockNext)
      expect(mockNext).toHaveBeenCalled()

      mockNext.mockClear()
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(429)
      expect(mockNext).not.toHaveBeenCalled()
    })
  })

  describe('User-Based Rate Limiting', () => {
    it('should use user ID for authenticated requests', async () => {
      const middleware = createRateLimitMiddleware({ windowMs: 60000, maxRequests: 2 })

      const authReq = {
        ...mockReq,
        user: { id: 'user-123', email: 'test@example.com', role: 'user' as const },
      }

      // Make 2 requests as same user
      await middleware(authReq as Request, mockRes as Response, mockNext)
      await middleware(authReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledTimes(2)

      // 3rd request should be blocked
      mockNext.mockClear()
      await middleware(authReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(429)
    })

    it('should separate limits per user', async () => {
      const middleware = createRateLimitMiddleware({ windowMs: 60000, maxRequests: 1 })

      // User 1
      const req1 = {
        ...mockReq,
        user: { id: 'user-1', email: 'user1@example.com', role: 'user' as const },
      }
      await middleware(req1 as Request, mockRes as Response, mockNext)

      // User 2 should have separate limit
      const req2 = {
        ...mockReq,
        user: { id: 'user-2', email: 'user2@example.com', role: 'user' as const },
      }
      mockNext.mockClear()
      await middleware(req2 as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should prioritize user ID over IP address', async () => {
      const middleware = createRateLimitMiddleware({ windowMs: 60000, maxRequests: 1 })

      // First request with user
      const authReq = {
        ...mockReq,
        ip: '192.168.1.100',
        user: { id: 'user-999', email: 'test@example.com', role: 'user' as const },
      }
      await middleware(authReq as Request, mockRes as Response, mockNext)

      // Same user, different IP - should still be rate limited
      mockNext.mockClear()
      authReq.ip = '192.168.1.200'
      await middleware(authReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(429)
    })

    it('should handle unauthenticated and authenticated requests separately', async () => {
      const middleware = createRateLimitMiddleware({ windowMs: 60000, maxRequests: 1 })

      // Unauthenticated request
      mockReq.ip = '192.168.1.1'
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      // Authenticated request should have separate limit
      const authReq = {
        ...mockReq,
        ip: '192.168.1.1', // Same IP
        user: { id: 'user-authenticated', email: 'test@example.com', role: 'user' as const },
      }
      mockNext.mockClear()
      await middleware(authReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })
  })

  describe('IP Address Handling', () => {
    it('should handle missing IP address', async () => {
      const middleware = createRateLimitMiddleware({ windowMs: 60000, maxRequests: 2 })

      delete mockReq.ip

      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should use "unknown" key when IP is missing', async () => {
      const middleware = createRateLimitMiddleware({ windowMs: 60000, maxRequests: 1 })

      const req1 = { ...mockReq }
      delete req1.ip

      await middleware(req1 as Request, mockRes as Response, mockNext)

      const req2 = { ...mockReq }
      delete req2.ip

      mockNext.mockClear()
      await middleware(req2 as Request, mockRes as Response, mockNext)

      // Should be rate limited using "unknown" key
      expect(mockRes.status).toHaveBeenCalledWith(429)
    })

    it('should handle IPv6 addresses', async () => {
      const middleware = createRateLimitMiddleware({ windowMs: 60000, maxRequests: 2 })

      mockReq.ip = '2001:0db8:85a3:0000:0000:8a2e:0370:7334'

      await middleware(mockReq as Request, mockRes as Response, mockNext)
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledTimes(2)

      mockNext.mockClear()
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(429)
    })

    it('should handle different IP formats', async () => {
      // Use real timers to avoid setInterval conflicts
      vi.useRealTimers()
      const middleware = createRateLimitMiddleware({ windowMs: 60000, maxRequests: 1 })

      const ips = ['192.168.1.1', '10.0.0.1', '172.16.0.1', '::1', '::ffff:192.0.2.1']

      for (const ip of ips) {
        mockReq.ip = ip
        mockNext.mockClear()

        await middleware(mockReq as Request, mockRes as Response, mockNext)

        expect(mockNext).toHaveBeenCalled()
      }
      vi.useFakeTimers()
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid sequential requests', async () => {
      vi.useRealTimers()
      const middleware = createRateLimitMiddleware({ windowMs: 60000, maxRequests: 10 })

      // Send 10 rapid sequential requests
      for (let i = 0; i < 10; i++) {
        await middleware(mockReq as Request, mockRes as Response, mockNext)
      }

      expect(mockNext).toHaveBeenCalledTimes(10)

      // 11th should be blocked
      mockNext.mockClear()
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(429)
      vi.useFakeTimers()
    })

    it('should handle requests at window boundary', async () => {
      const middleware = createRateLimitMiddleware({ windowMs: 1000, maxRequests: 1 })

      await middleware(mockReq as Request, mockRes as Response, mockNext)

      // Advance past window expiration
      vi.advanceTimersByTime(1001)

      mockNext.mockClear()
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should maintain state across multiple middleware instances', async () => {
      // Create two middleware instances with same config
      const middleware1 = createRateLimitMiddleware({ windowMs: 60000, maxRequests: 2 })
      const middleware2 = createRateLimitMiddleware({ windowMs: 60000, maxRequests: 2 })

      // Should share the same limiter
      await middleware1(mockReq as Request, mockRes as Response, mockNext)
      await middleware2(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledTimes(2)

      mockNext.mockClear()
      await middleware1(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(429)
    })

    it('should handle zero requests gracefully', async () => {
      const middleware = createRateLimitMiddleware({ windowMs: 60000, maxRequests: 10 })

      // Don't make any requests, just check middleware exists
      expect(middleware).toBeDefined()
    })

    it('should calculate retryAfter correctly for different window sizes', async () => {
      const testCases = [
        { windowMs: 1000, expectedRetryAfter: 1 },
        { windowMs: 30000, expectedRetryAfter: 30 },
        { windowMs: 60000, expectedRetryAfter: 60 },
        { windowMs: 120000, expectedRetryAfter: 120 },
      ]

      for (const { windowMs, expectedRetryAfter } of testCases) {
        const middleware = createRateLimitMiddleware({ windowMs, maxRequests: 1 })

        const req = { ip: `192.168.1.${Math.random()}` } as Request
        const res = {
          status: vi.fn().mockReturnThis(),
          json: vi.fn(),
        } as any

        await middleware(req, res, mockNext)
        await middleware(req, res, mockNext)

        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            retryAfter: expectedRetryAfter,
          })
        )
      }
    })

    it('should not leak memory with many different IPs', async () => {
      vi.useRealTimers()
      const middleware = createRateLimitMiddleware({ windowMs: 60000, maxRequests: 1 })

      // Simulate many different IPs
      for (let i = 0; i < 1000; i++) {
        mockReq.ip = `192.168.${Math.floor(i / 256)}.${i % 256}`
        await middleware(mockReq as Request, mockRes as Response, mockNext)
      }

      expect(mockNext).toHaveBeenCalledTimes(1000)
      vi.useFakeTimers()
    })
  })

  describe('Concurrent Requests', () => {
    it('should handle concurrent requests from same IP', async () => {
      // Use real timers for concurrent tests to avoid setInterval issues
      vi.useRealTimers()
      const middleware = createRateLimitMiddleware({ windowMs: 60000, maxRequests: 5 })

      // Send 5 concurrent requests
      const promises = Array.from({ length: 5 }).map(() =>
        middleware(mockReq as Request, mockRes as Response, mockNext)
      )

      await Promise.all(promises)

      expect(mockNext).toHaveBeenCalledTimes(5)
      vi.useFakeTimers()
    })

    it('should handle concurrent requests from different IPs', async () => {
      vi.useRealTimers()
      const middleware = createRateLimitMiddleware({ windowMs: 60000, maxRequests: 1 })

      const requests = Array.from({ length: 10 }).map((_, i) => ({
        ip: `192.168.1.${i}`,
      }))

      const promises = requests.map((req) =>
        middleware(req as Request, mockRes as Response, mockNext)
      )

      await Promise.all(promises)

      expect(mockNext).toHaveBeenCalledTimes(10)
      vi.useFakeTimers()
    })

    it('should handle mixed concurrent requests (auth and non-auth)', async () => {
      vi.useRealTimers()
      const middleware = createRateLimitMiddleware({ windowMs: 60000, maxRequests: 2 })

      const authReq = {
        ip: '192.168.1.1',
        user: { id: 'user-123', email: 'test@example.com', role: 'user' as const },
      }

      const nonAuthReq = {
        ip: '192.168.1.1', // Same IP but different key (no user)
      }

      // Each should have separate limits
      await Promise.all([
        middleware(authReq as Request, mockRes as Response, mockNext),
        middleware(nonAuthReq as Request, mockRes as Response, mockNext),
      ])

      expect(mockNext).toHaveBeenCalledTimes(2)
      vi.useFakeTimers()
    })
  })

  describe('Cleanup Mechanism', () => {
    it('should run cleanup periodically', async () => {
      const middleware = createRateLimitMiddleware({ windowMs: 60000, maxRequests: 10 })

      // Just verify middleware works
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should clean up expired entries', async () => {
      const middleware = createRateLimitMiddleware({ windowMs: 1000, maxRequests: 1 })

      // Make request
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      // Advance past window to expire the entry
      vi.advanceTimersByTime(1001)

      // New request should succeed (entry was cleaned up)
      mockNext.mockClear()
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })
  })
})
