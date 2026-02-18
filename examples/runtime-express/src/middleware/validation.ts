import type { Request, Response, NextFunction } from 'express'
import { z, ZodSchema, ZodError } from 'zod'

/**
 * Validation target (where to validate data from)
 */
export type ValidationTarget = 'body' | 'query' | 'params' | 'headers'

/**
 * Validation options
 */
export interface ValidationOptions {
  target?: ValidationTarget
  stripUnknown?: boolean
  abortEarly?: boolean
}

/**
 * Validation error response
 */
export interface ValidationErrorResponse {
  error: string
  details: Array<{
    path: string
    message: string
  }>
}

/**
 * Create validation middleware using Zod schema
 */
export function createValidationMiddleware<T>(
  schema: ZodSchema<T>,
  options?: ValidationOptions
) {
  const { target = 'body', stripUnknown = true, abortEarly = false } = options || {}

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get data from the specified target
      const data = req[target]

      // Validate data against schema
      const result = schema.safeParse(data)

      if (!result.success) {
        const errors = result.error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }))

        const response: ValidationErrorResponse = {
          error: 'Validation failed',
          details: abortEarly ? [errors[0]] : errors,
        }

        res.status(400).json(response)
        return
      }

      // Replace request data with validated (and potentially transformed) data
      ;(req as any)[target] = result.data

      next()
    } catch (error) {
      res.status(400).json({
        error: 'Validation error',
        details: [
          {
            path: '',
            message: error instanceof Error ? error.message : 'Unknown validation error',
          },
        ],
      })
    }
  }
}

/**
 * Validate request body (convenience wrapper)
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return createValidationMiddleware(schema, { target: 'body' })
}

/**
 * Validate query parameters (convenience wrapper)
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return createValidationMiddleware(schema, { target: 'query' })
}

/**
 * Validate URL parameters (convenience wrapper)
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return createValidationMiddleware(schema, { target: 'params' })
}

/**
 * Validate headers (convenience wrapper)
 */
export function validateHeaders<T>(schema: ZodSchema<T>) {
  return createValidationMiddleware(schema, { target: 'headers' })
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  email: z.string().email('Invalid email format'),
  uuid: z.string().uuid('Invalid UUID format'),
  url: z.string().url('Invalid URL format'),
  positiveInt: z.number().int().positive('Must be a positive integer'),
  nonEmptyString: z.string().min(1, 'String cannot be empty'),
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
  }),
}
