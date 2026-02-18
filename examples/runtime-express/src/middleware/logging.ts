import type { Request, Response, NextFunction } from 'express'
import type { AuthRequest } from '../types/express-types'

/**
 * Logging configuration options
 */
export interface LoggingOptions {
  logRequests?: boolean
  logResponses?: boolean
  logErrors?: boolean
  logBody?: boolean
  excludePaths?: string[]
}

/**
 * Log entry structure
 */
export interface LogEntry {
  timestamp: string
  method: string
  path: string
  statusCode?: number
  duration?: number
  userId?: string
  ip?: string
  userAgent?: string
  error?: string
  requestBody?: unknown
  responseBody?: unknown
}

/**
 * Logger interface for dependency injection
 */
export interface Logger {
  info: (message: string, meta?: Record<string, unknown>) => void
  error: (message: string, meta?: Record<string, unknown>) => void
  warn: (message: string, meta?: Record<string, unknown>) => void
}

/**
 * Default console logger implementation
 */
const defaultLogger: Logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    console.log(`[INFO] ${message}`, meta || '')
  },
  error: (message: string, meta?: Record<string, unknown>) => {
    console.error(`[ERROR] ${message}`, meta || '')
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn(`[WARN] ${message}`, meta || '')
  },
}

/**
 * Create logging middleware
 */
export function createLoggingMiddleware(options?: LoggingOptions, logger: Logger = defaultLogger) {
  const {
    logRequests = true,
    logResponses = true,
    logErrors = true,
    logBody = false,
    excludePaths = [],
  } = options || {}

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Skip logging for excluded paths
    if (excludePaths.some((path) => req.path.startsWith(path))) {
      next()
      return
    }

    const startTime = Date.now()
    const authReq = req as AuthRequest

    // Create base log entry
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      userId: authReq.user?.id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    }

    // Log request body if enabled
    if (logBody && req.body) {
      logEntry.requestBody = req.body
    }

    // Log incoming request
    if (logRequests) {
      logger.info(`${req.method} ${req.path}`, {
        ...logEntry,
        type: 'request',
      })
    }

    // Capture response
    const originalJson = res.json.bind(res)
    const originalSend = res.send.bind(res)

    res.json = function (body: any) {
      if (logBody) {
        logEntry.responseBody = body
      }
      return originalJson(body)
    }

    res.send = function (body: any) {
      if (logBody) {
        logEntry.responseBody = body
      }
      return originalSend(body)
    }

    // Log response after request completes
    res.on('finish', () => {
      const duration = Date.now() - startTime

      logEntry.statusCode = res.statusCode
      logEntry.duration = duration

      if (logResponses) {
        const level = res.statusCode >= 400 ? 'error' : 'info'
        logger[level](`${req.method} ${req.path} ${res.statusCode} ${duration}ms`, {
          ...logEntry,
          type: 'response',
        })
      }
    })

    // Error handling
    try {
      next()
    } catch (error) {
      if (logErrors) {
        logEntry.error = error instanceof Error ? error.message : String(error)
        logger.error(`Error processing ${req.method} ${req.path}`, {
          ...logEntry,
          type: 'error',
          stack: error instanceof Error ? error.stack : undefined,
        })
      }
      throw error
    }
  }
}

/**
 * Simple request logging middleware (convenience wrapper)
 */
export function loggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const middleware = createLoggingMiddleware()
  middleware(req, res, next)
}
