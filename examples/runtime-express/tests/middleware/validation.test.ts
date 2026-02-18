import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import {
  createValidationMiddleware,
  validateBody,
  validateQuery,
  validateParams,
  validateHeaders,
  commonSchemas,
  type ValidationErrorResponse,
} from '../../src/middleware/validation'

describe('validationMiddleware', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    mockReq = {
      body: {},
      query: {},
      params: {},
      headers: {},
    }
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }
    mockNext = vi.fn()
  })

  describe('Body Validation', () => {
    it('should validate valid request body', async () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      })

      mockReq.body = { name: 'John', age: 30 }

      const middleware = createValidationMiddleware(schema, { target: 'body' })
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
      expect(mockRes.status).not.toHaveBeenCalled()
    })

    it('should reject invalid request body', async () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      })

      mockReq.body = { name: 'John', age: 'invalid' }

      const middleware = createValidationMiddleware(schema, { target: 'body' })
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({
              path: 'age',
              message: expect.any(String),
            }),
          ]),
        })
      )
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should return multiple validation errors', async () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
        email: z.string().email(),
      })

      mockReq.body = { name: '', age: 'invalid', email: 'not-an-email' }

      const middleware = createValidationMiddleware(schema, { target: 'body' })
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      const response = (mockRes.json as any).mock.calls[0][0] as ValidationErrorResponse

      expect(response.details.length).toBeGreaterThan(1)
    })

    it('should use validateBody convenience wrapper', async () => {
      const schema = z.object({
        message: z.string(),
      })

      mockReq.body = { message: 'Hello' }

      const middleware = validateBody(schema)
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should transform data according to schema', async () => {
      const schema = z.object({
        count: z.coerce.number(),
        active: z.coerce.boolean(),
      })

      mockReq.body = { count: '42', active: 'true' }

      const middleware = createValidationMiddleware(schema, { target: 'body' })
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.body).toEqual({ count: 42, active: true })
      expect(mockNext).toHaveBeenCalled()
    })

    it('should handle nested object validation', async () => {
      const schema = z.object({
        user: z.object({
          name: z.string(),
          address: z.object({
            street: z.string(),
            city: z.string(),
          }),
        }),
      })

      mockReq.body = {
        user: {
          name: 'John',
          address: {
            street: '123 Main St',
            city: 'Springfield',
          },
        },
      }

      const middleware = createValidationMiddleware(schema, { target: 'body' })
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should report nested validation errors with correct path', async () => {
      const schema = z.object({
        user: z.object({
          address: z.object({
            zipCode: z.string().length(5),
          }),
        }),
      })

      mockReq.body = {
        user: {
          address: {
            zipCode: '123', // Invalid length
          },
        },
      }

      const middleware = createValidationMiddleware(schema, { target: 'body' })
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.arrayContaining([
            expect.objectContaining({
              path: 'user.address.zipCode',
            }),
          ]),
        })
      )
    })
  })

  describe('Query Parameter Validation', () => {
    it('should validate valid query parameters', async () => {
      const schema = z.object({
        page: z.coerce.number(),
        limit: z.coerce.number(),
      })

      mockReq.query = { page: '1', limit: '10' }

      const middleware = createValidationMiddleware(schema, { target: 'query' })
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
      expect(mockReq.query).toEqual({ page: 1, limit: 10 })
    })

    it('should reject invalid query parameters', async () => {
      const schema = z.object({
        page: z.coerce.number().positive(),
      })

      mockReq.query = { page: '-1' }

      const middleware = createValidationMiddleware(schema, { target: 'query' })
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should use validateQuery convenience wrapper', async () => {
      const schema = z.object({
        search: z.string(),
      })

      mockReq.query = { search: 'test' }

      const middleware = validateQuery(schema)
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should handle optional query parameters', async () => {
      const schema = z.object({
        search: z.string().optional(),
        filter: z.string().optional(),
      })

      mockReq.query = { search: 'test' }

      const middleware = createValidationMiddleware(schema, { target: 'query' })
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should handle default values in query parameters', async () => {
      const schema = z.object({
        page: z.coerce.number().default(1),
        limit: z.coerce.number().default(10),
      })

      mockReq.query = {}

      const middleware = createValidationMiddleware(schema, { target: 'query' })
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.query).toEqual({ page: 1, limit: 10 })
      expect(mockNext).toHaveBeenCalled()
    })
  })

  describe('URL Parameter Validation', () => {
    it('should validate valid URL parameters', async () => {
      const schema = z.object({
        id: z.string().uuid(),
      })

      mockReq.params = { id: '123e4567-e89b-12d3-a456-426614174000' }

      const middleware = createValidationMiddleware(schema, { target: 'params' })
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should reject invalid URL parameters', async () => {
      const schema = z.object({
        id: z.string().uuid(),
      })

      mockReq.params = { id: 'not-a-uuid' }

      const middleware = createValidationMiddleware(schema, { target: 'params' })
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should use validateParams convenience wrapper', async () => {
      const schema = z.object({
        userId: z.string(),
      })

      mockReq.params = { userId: '123' }

      const middleware = validateParams(schema)
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should transform param types', async () => {
      const schema = z.object({
        id: z.coerce.number(),
      })

      mockReq.params = { id: '42' }

      const middleware = createValidationMiddleware(schema, { target: 'params' })
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.params.id).toBe(42)
      expect(mockNext).toHaveBeenCalled()
    })
  })

  describe('Header Validation', () => {
    it('should validate valid headers', async () => {
      const schema = z.object({
        'content-type': z.string(),
        authorization: z.string(),
      })

      mockReq.headers = {
        'content-type': 'application/json',
        authorization: 'Bearer token',
      }

      const middleware = createValidationMiddleware(schema, { target: 'headers' })
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should reject invalid headers', async () => {
      const schema = z.object({
        'x-api-key': z.string().min(32),
      })

      mockReq.headers = { 'x-api-key': 'short' }

      const middleware = createValidationMiddleware(schema, { target: 'headers' })
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should use validateHeaders convenience wrapper', async () => {
      const schema = z.object({
        'user-agent': z.string(),
      })

      mockReq.headers = { 'user-agent': 'test-agent' }

      const middleware = validateHeaders(schema)
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })
  })

  describe('Validation Options', () => {
    it('should abort early when abortEarly is true', async () => {
      const schema = z.object({
        field1: z.string(),
        field2: z.string(),
        field3: z.string(),
      })

      mockReq.body = { field1: 123, field2: 456, field3: 789 }

      const middleware = createValidationMiddleware(schema, {
        target: 'body',
        abortEarly: true,
      })
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      const response = (mockRes.json as any).mock.calls[0][0] as ValidationErrorResponse

      expect(response.details).toHaveLength(1)
    })

    it('should return all errors when abortEarly is false', async () => {
      const schema = z.object({
        field1: z.string(),
        field2: z.string(),
        field3: z.string(),
      })

      mockReq.body = { field1: 123, field2: 456, field3: 789 }

      const middleware = createValidationMiddleware(schema, {
        target: 'body',
        abortEarly: false,
      })
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      const response = (mockRes.json as any).mock.calls[0][0] as ValidationErrorResponse

      expect(response.details.length).toBeGreaterThan(1)
    })
  })

  describe('Common Schemas', () => {
    it('should validate email using common schema', async () => {
      const schema = z.object({
        email: commonSchemas.email,
      })

      mockReq.body = { email: 'test@example.com' }

      const middleware = createValidationMiddleware(schema)
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should reject invalid email using common schema', async () => {
      const schema = z.object({
        email: commonSchemas.email,
      })

      mockReq.body = { email: 'not-an-email' }

      const middleware = createValidationMiddleware(schema)
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('should validate UUID using common schema', async () => {
      const schema = z.object({
        id: commonSchemas.uuid,
      })

      mockReq.body = { id: '123e4567-e89b-12d3-a456-426614174000' }

      const middleware = createValidationMiddleware(schema)
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should validate URL using common schema', async () => {
      const schema = z.object({
        website: commonSchemas.url,
      })

      mockReq.body = { website: 'https://example.com' }

      const middleware = createValidationMiddleware(schema)
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should validate positive integer using common schema', async () => {
      const schema = z.object({
        count: commonSchemas.positiveInt,
      })

      mockReq.body = { count: 42 }

      const middleware = createValidationMiddleware(schema)
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should reject negative integer using common schema', async () => {
      const schema = z.object({
        count: commonSchemas.positiveInt,
      })

      mockReq.body = { count: -1 }

      const middleware = createValidationMiddleware(schema)
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('should validate non-empty string using common schema', async () => {
      const schema = z.object({
        name: commonSchemas.nonEmptyString,
      })

      mockReq.body = { name: 'John' }

      const middleware = createValidationMiddleware(schema)
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should reject empty string using common schema', async () => {
      const schema = z.object({
        name: commonSchemas.nonEmptyString,
      })

      mockReq.body = { name: '' }

      const middleware = createValidationMiddleware(schema)
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('should use pagination schema with defaults', async () => {
      mockReq.query = {}

      const middleware = validateQuery(commonSchemas.pagination)
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.query).toEqual({ page: 1, limit: 10 })
      expect(mockNext).toHaveBeenCalled()
    })

    it('should enforce max limit in pagination schema', async () => {
      mockReq.query = { page: '1', limit: '1000' }

      const middleware = validateQuery(commonSchemas.pagination)
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(400)
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing required fields', async () => {
      const schema = z.object({
        required: z.string(),
      })

      mockReq.body = {}

      const middleware = createValidationMiddleware(schema)
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.arrayContaining([
            expect.objectContaining({
              path: 'required',
            }),
          ]),
        })
      )
    })

    it('should handle null values', async () => {
      const schema = z.object({
        value: z.string(),
      })

      mockReq.body = { value: null }

      const middleware = createValidationMiddleware(schema)
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('should handle undefined values', async () => {
      const schema = z.object({
        value: z.string(),
      })

      mockReq.body = { value: undefined }

      const middleware = createValidationMiddleware(schema)
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('should handle array validation', async () => {
      const schema = z.object({
        items: z.array(z.string()),
      })

      mockReq.body = { items: ['a', 'b', 'c'] }

      const middleware = createValidationMiddleware(schema)
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should reject invalid array items', async () => {
      const schema = z.object({
        items: z.array(z.number()),
      })

      mockReq.body = { items: [1, 2, 'invalid'] }

      const middleware = createValidationMiddleware(schema)
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('should handle enum validation', async () => {
      const schema = z.object({
        status: z.enum(['active', 'inactive', 'pending']),
      })

      mockReq.body = { status: 'active' }

      const middleware = createValidationMiddleware(schema)
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should reject invalid enum values', async () => {
      const schema = z.object({
        status: z.enum(['active', 'inactive']),
      })

      mockReq.body = { status: 'unknown' }

      const middleware = createValidationMiddleware(schema)
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('should handle union types', async () => {
      const schema = z.object({
        value: z.union([z.string(), z.number()]),
      })

      mockReq.body = { value: 'test' }

      const middleware = createValidationMiddleware(schema)
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()

      mockReq.body = { value: 123 }
      mockNext.mockClear()

      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should handle unknown validation errors gracefully', async () => {
      const schema = z.object({
        value: z.string(),
      })

      // Simulate an unexpected error by corrupting the schema
      const brokenSchema = {
        safeParse: () => {
          throw new Error('Unexpected validation error')
        },
      } as any

      const middleware = createValidationMiddleware(brokenSchema)

      mockReq.body = { value: 'test' }

      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation error',
        })
      )
    })

    it('should handle very large objects', async () => {
      const schema = z.object({
        data: z.record(z.string()),
      })

      const largeObject: Record<string, string> = {}
      for (let i = 0; i < 1000; i++) {
        largeObject[`key${i}`] = `value${i}`
      }

      mockReq.body = { data: largeObject }

      const middleware = createValidationMiddleware(schema)
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should handle deeply nested objects', async () => {
      const schema = z.object({
        level1: z.object({
          level2: z.object({
            level3: z.object({
              level4: z.object({
                value: z.string(),
              }),
            }),
          }),
        }),
      })

      mockReq.body = {
        level1: {
          level2: {
            level3: {
              level4: {
                value: 'deep',
              },
            },
          },
        },
      }

      const middleware = createValidationMiddleware(schema)
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })
  })

  describe('Type Coercion', () => {
    it('should coerce string to number', async () => {
      const schema = z.object({
        age: z.coerce.number(),
      })

      mockReq.body = { age: '42' }

      const middleware = createValidationMiddleware(schema)
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.body.age).toBe(42)
      expect(mockNext).toHaveBeenCalled()
    })

    it('should coerce string to boolean', async () => {
      const schema = z.object({
        active: z.coerce.boolean(),
      })

      mockReq.body = { active: 'true' }

      const middleware = createValidationMiddleware(schema)
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.body.active).toBe(true)
      expect(mockNext).toHaveBeenCalled()
    })

    it('should coerce string to date', async () => {
      const schema = z.object({
        birthdate: z.coerce.date(),
      })

      mockReq.body = { birthdate: '2000-01-01' }

      const middleware = createValidationMiddleware(schema)
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.body.birthdate).toBeInstanceOf(Date)
      expect(mockNext).toHaveBeenCalled()
    })
  })
})
