import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import EventEmitter from 'events'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { authMiddleware } from '../../src/middleware/auth'
import { createRateLimitMiddleware } from '../../src/middleware/rate-limit'
import { createLoggingMiddleware, type Logger } from '../../src/middleware/logging'
import { validateBody } from '../../src/middleware/validation'
import type { AuthRequest } from '../../src/types/express-types'

describe('Middleware Integration Tests', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response> & EventEmitter
  let mockNext: NextFunction
  let mockLogger: Logger

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-key'

    mockReq = {
      method: 'POST',
      path: '/api/users',
      ip: '127.0.0.1',
      headers: {},
      body: {},
      query: {},
      params: {},
      get: vi.fn((header: string) => {
        if (header === 'user-agent') return 'test-agent'
        return undefined
      }),
    }

    mockRes = Object.assign(new EventEmitter(), {
      statusCode: 200,
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    })

    mockNext = vi.fn()

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    }

    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('Auth + Rate Limit + Logging Chain', () => {
    it('should process authenticated request through all middleware', async () => {
      const secret = process.env.JWT_SECRET!
      const token = jwt.sign(
        { sub: 'user-123', email: 'test@example.com', role: 'user' },
        secret,
        { expiresIn: '1h' }
      )

      mockReq.headers = { authorization: `Bearer ${token}` }

      const loggingMiddleware = createLoggingMiddleware({}, mockLogger)
      const rateLimitMiddleware = createRateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 10,
      })

      // Execute middleware chain
      await loggingMiddleware(mockReq as Request, mockRes as Response, mockNext)

      const authReq = mockReq as AuthRequest
      await authMiddleware(authReq, mockRes as Response, mockNext)

      expect(authReq.user).toBeDefined()
      expect(authReq.user?.id).toBe('user-123')

      await rateLimitMiddleware(authReq, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledTimes(3)
      expect(mockLogger.info).toHaveBeenCalled()
    })

    it('should stop chain when authentication fails', async () => {
      mockReq.headers = { authorization: 'Bearer invalid-token' }

      const loggingMiddleware = createLoggingMiddleware({}, mockLogger)
      const rateLimitMiddleware = createRateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 10,
      })

      await loggingMiddleware(mockReq as Request, mockRes as Response, mockNext)
      expect(mockNext).toHaveBeenCalledTimes(1)

      mockNext.mockClear()
      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockNext).not.toHaveBeenCalled()

      // Rate limit should not be reached
      mockNext.mockClear()
      await rateLimitMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled() // Would succeed but shouldn't be called in real chain
    })

    it('should rate limit authenticated users correctly', async () => {
      const secret = process.env.JWT_SECRET!
      const token = jwt.sign(
        { sub: 'user-456', email: 'test@example.com', role: 'user' },
        secret,
        { expiresIn: '1h' }
      )

      mockReq.headers = { authorization: `Bearer ${token}` }

      const loggingMiddleware = createLoggingMiddleware({}, mockLogger)
      const rateLimitMiddleware = createRateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 2,
      })

      // First request
      await loggingMiddleware(mockReq as Request, mockRes as Response, mockNext)
      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)
      await rateLimitMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledTimes(3)

      // Second request
      mockNext.mockClear()
      await loggingMiddleware(mockReq as Request, mockRes as Response, mockNext)
      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)
      await rateLimitMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledTimes(3)

      // Third request - should be rate limited
      mockNext.mockClear()
      await loggingMiddleware(mockReq as Request, mockRes as Response, mockNext)
      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)
      await rateLimitMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(429)
      expect(mockNext).toHaveBeenCalledTimes(2) // Logging and auth passed, rate limit blocked
    })

    it('should log all middleware operations', async () => {
      const secret = process.env.JWT_SECRET!
      const token = jwt.sign(
        { sub: 'user-789', email: 'test@example.com', role: 'user' },
        secret,
        { expiresIn: '1h' }
      )

      mockReq.headers = { authorization: `Bearer ${token}` }

      const loggingMiddleware = createLoggingMiddleware(
        { logRequests: true, logResponses: true },
        mockLogger
      )
      const rateLimitMiddleware = createRateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 10,
      })

      await loggingMiddleware(mockReq as Request, mockRes as Response, mockNext)
      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)
      await rateLimitMiddleware(mockReq as Request, mockRes as Response, mockNext)

      // Verify logging captured the request (userId is undefined at logging time, gets set by auth)
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('POST /api/users'),
        expect.objectContaining({
          method: 'POST',
          path: '/api/users',
          type: 'request',
        })
      )
    })
  })

  describe('Validation + Auth + Logging Chain', () => {
    it('should validate, authenticate, and log successful request', async () => {
      const secret = process.env.JWT_SECRET!
      const token = jwt.sign(
        { sub: 'user-123', email: 'test@example.com', role: 'user' },
        secret,
        { expiresIn: '1h' }
      )

      mockReq.headers = { authorization: `Bearer ${token}` }
      mockReq.body = { name: 'John Doe', email: 'john@example.com' }

      const schema = z.object({
        name: z.string(),
        email: z.string().email(),
      })

      const validationMiddleware = validateBody(schema)
      const loggingMiddleware = createLoggingMiddleware({}, mockLogger)

      await loggingMiddleware(mockReq as Request, mockRes as Response, mockNext)
      await validationMiddleware(mockReq as Request, mockRes as Response, mockNext)
      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledTimes(3)
      const authReq = mockReq as AuthRequest
      expect(authReq.user?.id).toBe('user-123')
    })

    it('should stop chain when validation fails', async () => {
      const secret = process.env.JWT_SECRET!
      const token = jwt.sign(
        { sub: 'user-123', email: 'test@example.com', role: 'user' },
        secret,
        { expiresIn: '1h' }
      )

      mockReq.headers = { authorization: `Bearer ${token}` }
      mockReq.body = { name: 'John Doe', email: 'invalid-email' }

      const schema = z.object({
        name: z.string(),
        email: z.string().email(),
      })

      const validationMiddleware = validateBody(schema)
      const loggingMiddleware = createLoggingMiddleware({}, mockLogger)

      await loggingMiddleware(mockReq as Request, mockRes as Response, mockNext)
      await validationMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockNext).toHaveBeenCalledTimes(1) // Only logging passed

      // Auth should not be reached in real chain
      mockNext.mockClear()
      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)
      expect(mockNext).toHaveBeenCalled() // Would succeed but shouldn't be called
    })

    it('should log validation errors', async () => {
      mockReq.body = { invalid: 'data' }

      const schema = z.object({
        name: z.string(),
        email: z.string().email(),
      })

      const validationMiddleware = validateBody(schema)
      const loggingMiddleware = createLoggingMiddleware(
        { logRequests: true, logBody: true },
        mockLogger
      )

      await loggingMiddleware(mockReq as Request, mockRes as Response, mockNext)
      await validationMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          requestBody: { invalid: 'data' },
        })
      )
    })
  })

  describe('Complete Middleware Stack', () => {
    it('should process request through all middleware successfully', async () => {
      const secret = process.env.JWT_SECRET!
      const token = jwt.sign(
        { sub: 'user-complete', email: 'complete@example.com', role: 'admin' },
        secret,
        { expiresIn: '1h' }
      )

      mockReq.headers = { authorization: `Bearer ${token}` }
      mockReq.body = { action: 'create', data: { name: 'Test' } }

      const schema = z.object({
        action: z.enum(['create', 'update', 'delete']),
        data: z.object({
          name: z.string(),
        }),
      })

      const loggingMiddleware = createLoggingMiddleware(
        { logRequests: true, logResponses: true, logBody: true },
        mockLogger
      )
      const validationMiddleware = validateBody(schema)
      const rateLimitMiddleware = createRateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 100,
      })

      // Execute complete middleware stack
      await loggingMiddleware(mockReq as Request, mockRes as Response, mockNext)
      await validationMiddleware(mockReq as Request, mockRes as Response, mockNext)
      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)
      await rateLimitMiddleware(mockReq as Request, mockRes as Response, mockNext)

      // All middleware should pass
      expect(mockNext).toHaveBeenCalledTimes(4)

      // Verify auth context
      const authReq = mockReq as AuthRequest
      expect(authReq.user?.id).toBe('user-complete')
      expect(authReq.user?.role).toBe('admin')

      // Verify validation transformed data
      expect(mockReq.body).toEqual({ action: 'create', data: { name: 'Test' } })

      // Verify logging
      expect(mockLogger.info).toHaveBeenCalled()
    })

    it('should handle multiple failures in chain gracefully', async () => {
      mockReq.headers = { authorization: 'Bearer invalid-token' }
      mockReq.body = { invalid: 'data' }

      const schema = z.object({
        name: z.string(),
      })

      const loggingMiddleware = createLoggingMiddleware({}, mockLogger)
      const validationMiddleware = validateBody(schema)
      const rateLimitMiddleware = createRateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 10,
      })

      // Logging should pass
      await loggingMiddleware(mockReq as Request, mockRes as Response, mockNext)
      expect(mockNext).toHaveBeenCalledTimes(1)

      // Validation should fail
      mockNext.mockClear()
      await validationMiddleware(mockReq as Request, mockRes as Response, mockNext)
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockNext).not.toHaveBeenCalled()

      // Auth would also fail (but wouldn't be reached in real chain)
      mockNext.mockClear()
      mockRes.status = vi.fn().mockReturnThis()
      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)
      expect(mockRes.status).toHaveBeenCalledWith(401)
    })

    it('should maintain correct request context through chain', async () => {
      const secret = process.env.JWT_SECRET!
      const token = jwt.sign(
        { sub: 'context-user', email: 'context@example.com', role: 'user' },
        secret,
        { expiresIn: '1h' }
      )

      mockReq.headers = { authorization: `Bearer ${token}` }
      mockReq.body = { id: 123 }
      mockReq.query = { filter: 'active' }
      mockReq.params = { userId: '456' }

      const schema = z.object({
        id: z.number(),
      })

      const loggingMiddleware = createLoggingMiddleware({}, mockLogger)
      const validationMiddleware = validateBody(schema)
      const rateLimitMiddleware = createRateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 10,
      })

      await loggingMiddleware(mockReq as Request, mockRes as Response, mockNext)
      await validationMiddleware(mockReq as Request, mockRes as Response, mockNext)
      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)
      await rateLimitMiddleware(mockReq as Request, mockRes as Response, mockNext)

      // Verify all context is preserved
      const authReq = mockReq as AuthRequest
      expect(authReq.user?.id).toBe('context-user')
      expect(authReq.body).toEqual({ id: 123 })
      expect(authReq.query).toEqual({ filter: 'active' })
      expect(authReq.params).toEqual({ userId: '456' })
      expect(authReq.headers?.authorization).toBe(`Bearer ${token}`)
    })
  })

  describe('Performance and Concurrency', () => {
    it('should handle concurrent requests independently', async () => {
      const secret = process.env.JWT_SECRET!

      const requests = Array.from({ length: 5 }, (_, i) => {
        const token = jwt.sign(
          { sub: `user-${i}`, email: `user${i}@example.com`, role: 'user' },
          secret,
          { expiresIn: '1h' }
        )

        return {
          req: {
            ...mockReq,
            headers: { authorization: `Bearer ${token}` },
            body: { userId: i },
          } as Request,
          res: Object.assign(new EventEmitter(), {
            statusCode: 200,
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis(),
          }) as Response,
          next: vi.fn(),
        }
      })

      const loggingMiddleware = createLoggingMiddleware({}, mockLogger)
      const rateLimitMiddleware = createRateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 10,
      })

      await Promise.all(
        requests.map(async ({ req, res, next }) => {
          await loggingMiddleware(req, res, next)
          await authMiddleware(req, res, next)
          await rateLimitMiddleware(req, res, next)
        })
      )

      // All requests should succeed
      requests.forEach(({ next }) => {
        expect(next).toHaveBeenCalledTimes(3)
      })

      // Each request should have unique user context
      requests.forEach(({ req }, i) => {
        const authReq = req as AuthRequest
        expect(authReq.user?.id).toBe(`user-${i}`)
      })
    })

    it('should handle rapid sequential requests', async () => {
      const secret = process.env.JWT_SECRET!
      const token = jwt.sign(
        { sub: 'rapid-user', email: 'rapid@example.com', role: 'user' },
        secret,
        { expiresIn: '1h' }
      )

      const loggingMiddleware = createLoggingMiddleware({}, mockLogger)
      const rateLimitMiddleware = createRateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 5,
      })

      for (let i = 0; i < 5; i++) {
        mockReq.headers = { authorization: `Bearer ${token}` }
        mockNext.mockClear()

        await loggingMiddleware(mockReq as Request, mockRes as Response, mockNext)
        await authMiddleware(mockReq as Request, mockRes as Response, mockNext)
        await rateLimitMiddleware(mockReq as Request, mockRes as Response, mockNext)

        expect(mockNext).toHaveBeenCalledTimes(3)
      }

      // 6th request should be rate limited
      mockNext.mockClear()
      mockRes.status = vi.fn().mockReturnThis()
      await loggingMiddleware(mockReq as Request, mockRes as Response, mockNext)
      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)
      await rateLimitMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(429)
    })
  })

  describe('Error Propagation', () => {
    it('should handle errors from middleware chain', async () => {
      const loggingMiddleware = createLoggingMiddleware({ logErrors: true }, mockLogger)

      mockNext = vi.fn(() => {
        throw new Error('Downstream error')
      })

      try {
        await loggingMiddleware(mockReq as Request, mockRes as Response, mockNext)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Downstream error')
      }

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error processing'),
        expect.objectContaining({
          error: 'Downstream error',
        })
      )
    })

    it('should log response status on error responses', async () => {
      const loggingMiddleware = createLoggingMiddleware({ logResponses: true }, mockLogger)

      await loggingMiddleware(mockReq as Request, mockRes as Response, mockNext)

      mockRes.statusCode = 500
      mockRes.emit('finish')

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('500'),
        expect.objectContaining({
          statusCode: 500,
        })
      )
    })
  })
})
