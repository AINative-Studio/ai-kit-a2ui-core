import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import EventEmitter from 'events'
import {
  createLoggingMiddleware,
  loggingMiddleware,
  type Logger,
  type LoggingOptions,
} from '../../src/middleware/logging'
import type { AuthRequest } from '../../src/types/express-types'

describe('loggingMiddleware', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response> & EventEmitter
  let mockNext: NextFunction
  let mockLogger: Logger

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      path: '/api/test',
      ip: '127.0.0.1',
      get: vi.fn((header: string) => {
        if (header === 'user-agent') return 'test-agent'
        return undefined
      }),
      body: {},
    }

    mockRes = Object.assign(new EventEmitter(), {
      statusCode: 200,
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    })

    mockNext = vi.fn()

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Request Logging', () => {
    it('should log incoming requests', async () => {
      const middleware = createLoggingMiddleware({}, mockLogger)

      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockLogger.info).toHaveBeenCalledWith(
        'GET /api/test',
        expect.objectContaining({
          method: 'GET',
          path: '/api/test',
          type: 'request',
        })
      )
    })

    it('should include timestamp in log entry', async () => {
      const middleware = createLoggingMiddleware({}, mockLogger)

      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        })
      )
    })

    it('should include IP address in log entry', async () => {
      const middleware = createLoggingMiddleware({}, mockLogger)

      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          ip: '127.0.0.1',
        })
      )
    })

    it('should include user agent in log entry', async () => {
      const middleware = createLoggingMiddleware({}, mockLogger)

      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          userAgent: 'test-agent',
        })
      )
    })

    it('should include user ID for authenticated requests', async () => {
      const authReq = {
        ...mockReq,
        user: { id: 'user-123', email: 'test@example.com', role: 'user' as const },
      } as AuthRequest

      const middleware = createLoggingMiddleware({}, mockLogger)

      await middleware(authReq as Request, mockRes as Response, mockNext)

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          userId: 'user-123',
        })
      )
    })

    it('should not include user ID for unauthenticated requests', async () => {
      const middleware = createLoggingMiddleware({}, mockLogger)

      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          userId: undefined,
        })
      )
    })

    it('should log different HTTP methods correctly', async () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
      const middleware = createLoggingMiddleware({}, mockLogger)

      for (const method of methods) {
        mockReq.method = method
        mockLogger.info = vi.fn()

        await middleware(mockReq as Request, mockRes as Response, mockNext)

        expect(mockLogger.info).toHaveBeenCalledWith(
          expect.stringContaining(method),
          expect.objectContaining({
            method,
          })
        )
      }
    })
  })

  describe('Response Logging', () => {
    it('should log response with status code', async () => {
      const middleware = createLoggingMiddleware({}, mockLogger)

      await middleware(mockReq as Request, mockRes as Response, mockNext)

      mockRes.statusCode = 200
      mockRes.emit('finish')

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('200'),
        expect.objectContaining({
          statusCode: 200,
          type: 'response',
        })
      )
    })

    it('should log response duration', async () => {
      const middleware = createLoggingMiddleware({}, mockLogger)

      await middleware(mockReq as Request, mockRes as Response, mockNext)

      mockRes.emit('finish')

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringMatching(/\d+ms/),
        expect.objectContaining({
          duration: expect.any(Number),
        })
      )
    })

    it('should log errors for 4xx status codes', async () => {
      const middleware = createLoggingMiddleware({}, mockLogger)

      await middleware(mockReq as Request, mockRes as Response, mockNext)

      mockRes.statusCode = 404
      mockRes.emit('finish')

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('404'),
        expect.objectContaining({
          statusCode: 404,
        })
      )
    })

    it('should log errors for 5xx status codes', async () => {
      const middleware = createLoggingMiddleware({}, mockLogger)

      await middleware(mockReq as Request, mockRes as Response, mockNext)

      mockRes.statusCode = 500
      mockRes.emit('finish')

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('500'),
        expect.objectContaining({
          statusCode: 500,
        })
      )
    })

    it('should use info level for 2xx status codes', async () => {
      const middleware = createLoggingMiddleware({}, mockLogger)

      await middleware(mockReq as Request, mockRes as Response, mockNext)

      mockRes.statusCode = 201
      mockRes.emit('finish')

      expect(mockLogger.info).toHaveBeenCalled()
      expect(mockLogger.error).not.toHaveBeenCalled()
    })

    it('should use info level for 3xx status codes', async () => {
      const middleware = createLoggingMiddleware({}, mockLogger)

      await middleware(mockReq as Request, mockRes as Response, mockNext)

      mockRes.statusCode = 302
      mockRes.emit('finish')

      expect(mockLogger.info).toHaveBeenCalled()
      expect(mockLogger.error).not.toHaveBeenCalled()
    })
  })

  describe('Configuration Options', () => {
    it('should respect logRequests option when false', async () => {
      const middleware = createLoggingMiddleware({ logRequests: false }, mockLogger)

      await middleware(mockReq as Request, mockRes as Response, mockNext)

      const requestLogs = (mockLogger.info as any).mock.calls.filter((call: any[]) =>
        call[1]?.type === 'request'
      )

      expect(requestLogs).toHaveLength(0)
    })

    it('should respect logResponses option when false', async () => {
      const middleware = createLoggingMiddleware({ logResponses: false }, mockLogger)

      await middleware(mockReq as Request, mockRes as Response, mockNext)

      mockRes.emit('finish')

      const responseLogs = (mockLogger.info as any).mock.calls.filter((call: any[]) =>
        call[1]?.type === 'response'
      )

      expect(responseLogs).toHaveLength(0)
    })

    it('should log request body when logBody is true', async () => {
      mockReq.body = { foo: 'bar', test: 123 }

      const middleware = createLoggingMiddleware({ logBody: true }, mockLogger)

      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          requestBody: { foo: 'bar', test: 123 },
        })
      )
    })

    it('should not log request body when logBody is false', async () => {
      mockReq.body = { sensitive: 'data' }

      const middleware = createLoggingMiddleware({ logBody: false }, mockLogger)

      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.not.objectContaining({
          requestBody: expect.anything(),
        })
      )
    })

    it('should exclude paths specified in excludePaths', async () => {
      const middleware = createLoggingMiddleware(
        { excludePaths: ['/health', '/metrics'] },
        mockLogger
      )

      mockReq.path = '/health'
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockLogger.info).not.toHaveBeenCalled()
      expect(mockNext).toHaveBeenCalled()
    })

    it('should log paths not in excludePaths', async () => {
      const middleware = createLoggingMiddleware({ excludePaths: ['/health'] }, mockLogger)

      mockReq.path = '/api/users'
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockLogger.info).toHaveBeenCalled()
    })

    it('should handle multiple excluded paths', async () => {
      const middleware = createLoggingMiddleware(
        { excludePaths: ['/health', '/metrics', '/readiness'] },
        mockLogger
      )

      const paths = ['/health', '/metrics', '/readiness']

      for (const path of paths) {
        mockLogger.info = vi.fn()
        mockReq.path = path

        await middleware(mockReq as Request, mockRes as Response, mockNext)

        expect(mockLogger.info).not.toHaveBeenCalled()
      }
    })
  })

  describe('Response Body Capture', () => {
    it('should capture JSON response body when logBody is true', async () => {
      const middleware = createLoggingMiddleware({ logBody: true }, mockLogger)

      await middleware(mockReq as Request, mockRes as Response, mockNext)

      const responseData = { success: true, data: [1, 2, 3] }
      mockRes.json(responseData)
      mockRes.emit('finish')

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          responseBody: responseData,
        })
      )
    })

    it('should capture send response body when logBody is true', async () => {
      const middleware = createLoggingMiddleware({ logBody: true }, mockLogger)

      await middleware(mockReq as Request, mockRes as Response, mockNext)

      const responseData = 'Plain text response'
      mockRes.send(responseData)
      mockRes.emit('finish')

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          responseBody: responseData,
        })
      )
    })

    it('should not capture response body when logBody is false', async () => {
      const middleware = createLoggingMiddleware({ logBody: false }, mockLogger)

      await middleware(mockReq as Request, mockRes as Response, mockNext)

      mockRes.json({ secret: 'data' })
      mockRes.emit('finish')

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.not.objectContaining({
          responseBody: expect.anything(),
        })
      )
    })
  })

  describe('Error Handling', () => {
    it('should log errors when logErrors is true', async () => {
      const middleware = createLoggingMiddleware({ logErrors: true }, mockLogger)

      const error = new Error('Test error')
      mockNext = vi.fn(() => {
        throw error
      })

      try {
        await middleware(mockReq as Request, mockRes as Response, mockNext)
      } catch (e) {
        // Expected to throw
      }

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error processing'),
        expect.objectContaining({
          error: 'Test error',
          type: 'error',
        })
      )
    })

    it('should include error stack trace', async () => {
      const middleware = createLoggingMiddleware({ logErrors: true }, mockLogger)

      const error = new Error('Test error with stack')
      mockNext = vi.fn(() => {
        throw error
      })

      try {
        await middleware(mockReq as Request, mockRes as Response, mockNext)
      } catch (e) {
        // Expected to throw
      }

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          stack: expect.stringContaining('Error: Test error with stack'),
        })
      )
    })

    it('should handle non-Error objects', async () => {
      const middleware = createLoggingMiddleware({ logErrors: true }, mockLogger)

      mockNext = vi.fn(() => {
        throw 'String error'
      })

      try {
        await middleware(mockReq as Request, mockRes as Response, mockNext)
      } catch (e) {
        // Expected to throw
      }

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          error: 'String error',
        })
      )
    })

    it('should not log errors when logErrors is false', async () => {
      const middleware = createLoggingMiddleware({ logErrors: false }, mockLogger)

      mockNext = vi.fn(() => {
        throw new Error('Test error')
      })

      try {
        await middleware(mockReq as Request, mockRes as Response, mockNext)
      } catch (e) {
        // Expected to throw
      }

      const errorLogs = (mockLogger.error as any).mock.calls.filter((call: any[]) =>
        call[1]?.type === 'error'
      )

      expect(errorLogs).toHaveLength(0)
    })

    it('should re-throw errors after logging', async () => {
      const middleware = createLoggingMiddleware({ logErrors: true }, mockLogger)

      const error = new Error('Test error')
      mockNext = vi.fn(() => {
        throw error
      })

      await expect(
        middleware(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow('Test error')
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing IP address', async () => {
      delete mockReq.ip

      const middleware = createLoggingMiddleware({}, mockLogger)

      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          ip: undefined,
        })
      )
    })

    it('should handle missing user agent', async () => {
      mockReq.get = vi.fn(() => undefined)

      const middleware = createLoggingMiddleware({}, mockLogger)

      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          userAgent: undefined,
        })
      )
    })

    it('should handle empty request body', async () => {
      mockReq.body = undefined

      const middleware = createLoggingMiddleware({ logBody: true }, mockLogger)

      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.not.objectContaining({
          requestBody: expect.anything(),
        })
      )
    })

    it('should handle very long paths', async () => {
      mockReq.path = '/api/v1/' + 'long/'.repeat(100) + 'endpoint'

      const middleware = createLoggingMiddleware({}, mockLogger)

      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining(mockReq.path),
        expect.any(Object)
      )
    })

    it('should handle concurrent requests', async () => {
      const middleware = createLoggingMiddleware({}, mockLogger)

      const req1 = { ...mockReq, path: '/api/endpoint1' }
      const req2 = { ...mockReq, path: '/api/endpoint2' }
      const res1 = Object.assign(new EventEmitter(), mockRes)
      const res2 = Object.assign(new EventEmitter(), mockRes)

      await Promise.all([
        middleware(req1 as Request, res1 as Response, mockNext),
        middleware(req2 as Request, res2 as Response, mockNext),
      ])

      expect(mockLogger.info).toHaveBeenCalledTimes(2)
    })

    it('should measure duration accurately', async () => {
      const middleware = createLoggingMiddleware({}, mockLogger)

      await middleware(mockReq as Request, mockRes as Response, mockNext)

      // Simulate some processing time
      await new Promise((resolve) => setTimeout(resolve, 10))

      mockRes.emit('finish')

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          duration: expect.any(Number),
        })
      )

      const call = (mockLogger.info as any).mock.calls.find((c: any[]) => c[1]?.type === 'response')
      expect(call[1].duration).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Simple Logging Middleware', () => {
    it('should work as standalone middleware', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await loggingMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('Custom Logger', () => {
    it('should use custom logger when provided', async () => {
      const customLogger: Logger = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
      }

      const middleware = createLoggingMiddleware({}, customLogger)

      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(customLogger.info).toHaveBeenCalled()
      expect(mockLogger.info).not.toHaveBeenCalled()
    })

    it('should call all logger methods appropriately', async () => {
      const customLogger: Logger = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
      }

      const middleware = createLoggingMiddleware({}, customLogger)

      await middleware(mockReq as Request, mockRes as Response, mockNext)

      mockRes.statusCode = 404
      mockRes.emit('finish')

      expect(customLogger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ type: 'request' })
      )
      expect(customLogger.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ type: 'response' })
      )
    })
  })

  describe('Path Matching', () => {
    it('should match paths with startsWith for exclusion', async () => {
      const middleware = createLoggingMiddleware({ excludePaths: ['/api'] }, mockLogger)

      mockReq.path = '/api/users/123'
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockLogger.info).not.toHaveBeenCalled()
    })

    it('should not exclude paths that do not match prefix', async () => {
      const middleware = createLoggingMiddleware({ excludePaths: ['/api'] }, mockLogger)

      mockReq.path = '/v1/api/users'
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockLogger.info).toHaveBeenCalled()
    })
  })
})
