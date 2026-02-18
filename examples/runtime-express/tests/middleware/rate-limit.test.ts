import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import { createRateLimitMiddleware } from '../../src/middleware/rate-limit'

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
  })

  describe('Configuration', () => {
    it('should accept custom window size', () => {
      const middleware = createRateLimitMiddleware({ windowMs: 30000, maxRequests: 10 })
      expect(middleware).toBeDefined()
    })

    it('should accept custom max requests', () => {
      const middleware = createRateLimitMiddleware({ windowMs: 60000, maxRequests: 100 })
      expect(middleware).toBeDefined()
    })

    it('should use default values from environment', () => {
      const middleware = createRateLimitMiddleware()
      expect(middleware).toBeDefined()
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
  })
})
