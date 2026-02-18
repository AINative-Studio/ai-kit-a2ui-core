import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { authMiddleware } from '../../src/middleware/auth'
import type { AuthRequest } from '../../src/types/express-types'

describe('authMiddleware', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: NextFunction
  let originalSecret: string | undefined

  beforeEach(() => {
    originalSecret = process.env.JWT_SECRET
    process.env.JWT_SECRET = 'test-secret-key-for-testing-only'

    mockReq = {
      headers: {},
    }
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }
    mockNext = vi.fn()
  })

  afterEach(() => {
    if (originalSecret) {
      process.env.JWT_SECRET = originalSecret
    }
  })

  describe('Token Validation', () => {
    it('should reject requests without authorization header', async () => {
      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Missing authorization token' })
      )
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should reject requests with empty authorization header', async () => {
      mockReq.headers = { authorization: '' }

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Missing authorization token' })
      )
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should reject requests with whitespace-only authorization header', async () => {
      mockReq.headers = { authorization: '   ' }

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Missing authorization token' })
      )
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should extract Bearer token from authorization header', async () => {
      const secret = process.env.JWT_SECRET!
      const validToken = jwt.sign(
        {
          sub: 'user-123',
          email: 'test@example.com',
          role: 'user',
        },
        secret,
        { expiresIn: '1h' }
      )

      mockReq.headers = { authorization: `Bearer ${validToken}` }

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
      expect(mockRes.status).not.toHaveBeenCalled()
    })

    it('should handle Bearer token with extra whitespace', async () => {
      const secret = process.env.JWT_SECRET!
      const validToken = jwt.sign(
        {
          sub: 'user-123',
          email: 'test@example.com',
          role: 'user',
        },
        secret,
        { expiresIn: '1h' }
      )

      mockReq.headers = { authorization: `  Bearer   ${validToken}  ` }

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
      expect(mockRes.status).not.toHaveBeenCalled()
    })

    it('should reject authorization header with only "Bearer" keyword', async () => {
      mockReq.headers = { authorization: 'Bearer' }

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(String) })
      )
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should reject authorization header with "Bearer " and whitespace', async () => {
      mockReq.headers = { authorization: 'Bearer   ' }

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(String) })
      )
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should reject malformed tokens', async () => {
      mockReq.headers = { authorization: 'Bearer invalid.token.here' }

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid token' })
      )
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should reject tokens with invalid format (not three parts)', async () => {
      mockReq.headers = { authorization: 'Bearer invalidtoken' }

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should reject expired tokens', async () => {
      const secret = process.env.JWT_SECRET!
      const expiredToken = jwt.sign(
        {
          sub: 'user-123',
          email: 'test@example.com',
          role: 'user',
        },
        secret,
        { expiresIn: '-1h' } // Expired 1 hour ago
      )

      mockReq.headers = { authorization: `Bearer ${expiredToken}` }

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Token expired' })
      )
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should reject tokens with invalid signature', async () => {
      const differentSecret = 'different-secret-key'
      const invalidToken = jwt.sign(
        {
          sub: 'user-123',
          email: 'test@example.com',
          role: 'user',
        },
        differentSecret,
        { expiresIn: '1h' }
      )

      mockReq.headers = { authorization: `Bearer ${invalidToken}` }

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid token' })
      )
      expect(mockNext).not.toHaveBeenCalled()
    })
  })

  describe('User Context Injection', () => {
    it('should inject user into request on valid token', async () => {
      const secret = process.env.JWT_SECRET!
      const userId = 'user-456'
      const userEmail = 'test@example.com'
      const userRole = 'admin'

      const validToken = jwt.sign(
        {
          sub: userId,
          email: userEmail,
          role: userRole,
        },
        secret,
        { expiresIn: '1h' }
      )

      mockReq.headers = { authorization: `Bearer ${validToken}` }

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

      const authReq = mockReq as AuthRequest
      expect(authReq.user).toBeDefined()
      expect(authReq.user?.id).toBe(userId)
      expect(authReq.user?.email).toBe(userEmail)
      expect(authReq.user?.role).toBe(userRole)
      expect(mockNext).toHaveBeenCalled()
    })

    it('should extract user id from token payload', async () => {
      const secret = process.env.JWT_SECRET!
      const userId = 'user-789'

      const validToken = jwt.sign(
        {
          sub: userId,
          email: 'test@example.com',
          role: 'user',
        },
        secret,
        { expiresIn: '1h' }
      )

      mockReq.headers = { authorization: `Bearer ${validToken}` }

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

      const authReq = mockReq as AuthRequest
      expect(authReq.user?.id).toBe(userId)
    })

    it('should extract user email from token payload', async () => {
      const secret = process.env.JWT_SECRET!
      const userEmail = 'admin@example.com'

      const validToken = jwt.sign(
        {
          sub: 'user-123',
          email: userEmail,
          role: 'user',
        },
        secret,
        { expiresIn: '1h' }
      )

      mockReq.headers = { authorization: `Bearer ${validToken}` }

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

      const authReq = mockReq as AuthRequest
      expect(authReq.user?.email).toBe(userEmail)
    })

    it('should extract user role from token payload', async () => {
      const secret = process.env.JWT_SECRET!
      const userRole = 'superuser'

      const validToken = jwt.sign(
        {
          sub: 'user-123',
          email: 'test@example.com',
          role: userRole,
        },
        secret,
        { expiresIn: '1h' }
      )

      mockReq.headers = { authorization: `Bearer ${validToken}` }

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

      const authReq = mockReq as AuthRequest
      expect(authReq.user?.role).toBe(userRole)
    })

    it('should handle different role types correctly', async () => {
      const secret = process.env.JWT_SECRET!
      const roles = ['user', 'admin', 'superuser'] as const

      for (const role of roles) {
        const validToken = jwt.sign(
          {
            sub: 'user-123',
            email: 'test@example.com',
            role,
          },
          secret,
          { expiresIn: '1h' }
        )

        mockReq.headers = { authorization: `Bearer ${validToken}` }
        mockNext.mockClear()

        await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

        const authReq = mockReq as AuthRequest
        expect(authReq.user?.role).toBe(role)
        expect(mockNext).toHaveBeenCalled()
      }
    })
  })

  describe('Error Handling', () => {
    it('should return 401 for invalid signature', async () => {
      const differentSecret = 'wrong-secret'
      const invalidToken = jwt.sign(
        {
          sub: 'user-123',
          email: 'test@example.com',
          role: 'user',
        },
        differentSecret
      )

      mockReq.headers = { authorization: `Bearer ${invalidToken}` }

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid token' })
      )
    })

    it('should return error message for invalid token', async () => {
      mockReq.headers = { authorization: 'Bearer invalid' }

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(String) })
      )
    })

    it('should handle missing JWT_SECRET gracefully', async () => {
      delete process.env.JWT_SECRET

      mockReq.headers = { authorization: 'Bearer token' }

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'JWT secret not configured' })
      )
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should handle empty JWT_SECRET gracefully', async () => {
      process.env.JWT_SECRET = ''

      mockReq.headers = { authorization: 'Bearer token' }

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'JWT secret not configured' })
      )
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should handle malformed JSON in token payload', async () => {
      // Create a token with invalid base64 in the payload section
      const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid-base64.signature'
      mockReq.headers = { authorization: `Bearer ${invalidToken}` }

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should not call next() on any authentication failure', async () => {
      const testCases = [
        { headers: {} }, // No auth header
        { headers: { authorization: '' } }, // Empty auth header
        { headers: { authorization: 'Bearer' } }, // No token
        { headers: { authorization: 'Bearer invalid' } }, // Invalid token
      ]

      for (const testCase of testCases) {
        mockNext.mockClear()
        mockReq.headers = testCase.headers

        await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

        expect(mockNext).not.toHaveBeenCalled()
      }
    })
  })

  describe('Edge Cases', () => {
    it('should handle token with missing required fields', async () => {
      const secret = process.env.JWT_SECRET!
      // Token without email field
      const incompleteToken = jwt.sign(
        {
          sub: 'user-123',
          role: 'user',
        } as any,
        secret,
        { expiresIn: '1h' }
      )

      mockReq.headers = { authorization: `Bearer ${incompleteToken}` }

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

      const authReq = mockReq as AuthRequest
      expect(authReq.user?.id).toBe('user-123')
      expect(authReq.user?.email).toBeUndefined()
      expect(mockNext).toHaveBeenCalled()
    })

    it('should handle token at exact expiration time', async () => {
      const secret = process.env.JWT_SECRET!
      const now = Math.floor(Date.now() / 1000)

      const token = jwt.sign(
        {
          sub: 'user-123',
          email: 'test@example.com',
          role: 'user',
          exp: now - 1, // Expired 1 second ago
        },
        secret
      )

      mockReq.headers = { authorization: `Bearer ${token}` }

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Token expired' })
      )
    })

    it('should handle very long tokens', async () => {
      const secret = process.env.JWT_SECRET!
      const longPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'user',
        metadata: 'x'.repeat(10000), // Very long metadata field
      }

      const longToken = jwt.sign(longPayload, secret, { expiresIn: '1h' })

      mockReq.headers = { authorization: `Bearer ${longToken}` }

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should preserve other request properties', async () => {
      const secret = process.env.JWT_SECRET!
      const validToken = jwt.sign(
        {
          sub: 'user-123',
          email: 'test@example.com',
          role: 'user',
        },
        secret,
        { expiresIn: '1h' }
      )

      mockReq = {
        headers: { authorization: `Bearer ${validToken}` },
        method: 'GET',
        path: '/api/test',
        query: { foo: 'bar' },
      }

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.method).toBe('GET')
      expect(mockReq.path).toBe('/api/test')
      expect(mockReq.query).toEqual({ foo: 'bar' })
      expect(mockNext).toHaveBeenCalled()
    })

    it('should handle concurrent requests with different tokens', async () => {
      const secret = process.env.JWT_SECRET!

      const token1 = jwt.sign(
        { sub: 'user-1', email: 'user1@example.com', role: 'user' },
        secret,
        { expiresIn: '1h' }
      )

      const token2 = jwt.sign(
        { sub: 'user-2', email: 'user2@example.com', role: 'admin' },
        secret,
        { expiresIn: '1h' }
      )

      const req1 = { headers: { authorization: `Bearer ${token1}` } }
      const req2 = { headers: { authorization: `Bearer ${token2}` } }

      await Promise.all([
        authMiddleware(req1 as Request, mockRes as Response, mockNext),
        authMiddleware(req2 as Request, mockRes as Response, mockNext),
      ])

      const authReq1 = req1 as AuthRequest
      const authReq2 = req2 as AuthRequest

      expect(authReq1.user?.id).toBe('user-1')
      expect(authReq2.user?.id).toBe('user-2')
      expect(mockNext).toHaveBeenCalledTimes(2)
    })
  })

  describe('Token Formats', () => {
    it('should accept token without Bearer prefix if starts with Bearer', async () => {
      const secret = process.env.JWT_SECRET!
      const validToken = jwt.sign(
        {
          sub: 'user-123',
          email: 'test@example.com',
          role: 'user',
        },
        secret,
        { expiresIn: '1h' }
      )

      // Test that 'Bearer ' is properly stripped
      mockReq.headers = { authorization: `Bearer ${validToken}` }

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
      expect(mockRes.status).not.toHaveBeenCalled()
    })

    it('should handle lowercase bearer keyword', async () => {
      const secret = process.env.JWT_SECRET!
      const validToken = jwt.sign(
        {
          sub: 'user-123',
          email: 'test@example.com',
          role: 'user',
        },
        secret,
        { expiresIn: '1h' }
      )

      // Note: The middleware uses exact string replacement 'Bearer '
      // so 'bearer' (lowercase) won't be stripped correctly
      mockReq.headers = { authorization: `bearer ${validToken}` }

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

      // This will fail because 'bearer' isn't replaced, testing edge case
      expect(mockRes.status).toHaveBeenCalledWith(401)
    })
  })
})
