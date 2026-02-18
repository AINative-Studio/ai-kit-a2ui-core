import type { RuntimeContext } from '../types/runtime-types'

/**
 * Middleware function type
 * @param context - Runtime context
 * @param next - Function to call next middleware or final handler
 */
export type Middleware = (
  context: RuntimeContext,
  next: () => Promise<void>
) => Promise<void>

/**
 * Compose multiple middleware functions into a single middleware
 * @param middleware - Array of middleware functions to compose
 * @returns Composed middleware function
 */
export function composeMiddleware(middleware: Middleware[]): Middleware {
  if (middleware.length === 0) {
    return async (_context, next) => await next()
  }

  if (middleware.length === 1) {
    return middleware[0]
  }

  return async (context, next) => {
    let index = -1

    const dispatch = async (i: number): Promise<void> => {
      if (i <= index) {
        throw new Error('next() called multiple times')
      }

      index = i

      const fn = i === middleware.length ? next : middleware[i]

      if (!fn) {
        return
      }

      await fn(context, () => dispatch(i + 1))
    }

    await dispatch(0)
  }
}
