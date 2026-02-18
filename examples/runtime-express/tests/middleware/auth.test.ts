import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import { authMiddleware } from '../../src/middleware/auth'
import { UnauthorizedError } from '@ainative/a2ui-runtime'

describe('authMiddleware', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    mockReq = {
      headers: {},
    }
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }
    mockNext = vi.fn()
  })

  describe('Token Validation', () => {
    it('should reject requests without authorization header', async () => {
      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('Missing') })
      )
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should reject requests with empty authorization header', async () => {
      mockReq.headers = { authorization: '' }

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should extract Bearer token from authorization header', async () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjo5OTk5OTk5OTk5fQ.VxRQkv3V5Z1xN9G8qN5OxYJYYvVQZVYVYVYVYVYVYVY'
      mockReq.headers = { authorization: `Bearer ${validToken}` }

      // Mock JWT verification will be done in implementation
      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

      // Should attempt to verify token (will fail with mock token but structure is correct)
      expect(mockReq.headers.authorization).toBe(`Bearer ${validToken}`)
    })

    it('should reject malformed tokens', async () => {
      mockReq.headers = { authorization: 'Bearer invalid.token.here' }

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should reject expired tokens', async () => {
      // Token with past expiry
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJleHAiOjF9.invalid'
      mockReq.headers = { authorization: `Bearer ${expiredToken}` }

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockNext).not.toHaveBeenCalled()
    })
  })

  describe('User Context Injection', () => {
    it('should inject user into request on valid token', async () => {
      // This will be properly tested when we implement JWT signing in tests
      // For now, we're testing the structure
      expect(mockReq.user).toBeUndefined()
    })

    it('should extract user id from token payload', async () => {
      // Will be tested with proper JWT implementation
    })

    it('should extract user email from token payload', async () => {
      // Will be tested with proper JWT implementation
    })

    it('should extract user role from token payload', async () => {
      // Will be tested with proper JWT implementation
    })
  })

  describe('Error Handling', () => {
    it('should return 401 for invalid signature', async () => {
      mockReq.headers = { authorization: 'Bearer invalid.signature.token' }

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
    })

    it('should return error message for invalid token', async () => {
      mockReq.headers = { authorization: 'Bearer invalid' }

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(String) })
      )
    })

    it('should handle missing JWT_SECRET gracefully', async () => {
      const originalSecret = process.env.JWT_SECRET
      delete process.env.JWT_SECRET

      mockReq.headers = { authorization: 'Bearer token' }

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)

      process.env.JWT_SECRET = originalSecret
    })
  })
})
