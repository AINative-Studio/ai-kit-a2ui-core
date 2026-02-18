import type { Request } from 'express'

/**
 * User information in JWT token
 */
export interface JWTUser {
  id: string
  email: string
  role: 'user' | 'admin' | 'superuser'
}

/**
 * JWT payload structure
 */
export interface JWTPayload extends JWTUser {
  sub: string
  iat: number
  exp: number
}

/**
 * Extended Express request with user context
 */
export interface AuthRequest extends Request {
  user?: JWTUser
}

/**
 * Chat request body
 */
export interface ChatRequestBody {
  message: string
  context?: Record<string, unknown>
}

/**
 * Action execution request body
 */
export interface ActionRequestBody {
  action: string
  parameters: Record<string, unknown>
}

/**
 * Health status response
 */
export interface HealthStatusResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  uptime: number
  version: string
  adapter: string
  actionsRegistered: number
  middlewareCount: number
  timestamp: string
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  error: string
  code?: string
  details?: unknown
}

/**
 * Action execution response
 */
export interface ActionExecutionResponse {
  success: boolean
  result?: unknown
  error?: string
}
