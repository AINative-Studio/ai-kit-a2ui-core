import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { JWTPayload, AuthRequest } from '../types/express-types'

/**
 * JWT authentication middleware
 * Validates JWT tokens and injects user context into request
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || authHeader.trim() === '') {
      res.status(401).json({ error: 'Missing authorization token' })
      return
    }

    const token = authHeader.replace('Bearer ', '').trim()

    if (!token) {
      res.status(401).json({ error: 'Invalid authorization header format' })
      return
    }

    const secret = process.env.JWT_SECRET
    if (!secret) {
      res.status(401).json({ error: 'JWT secret not configured' })
      return
    }

    // Verify JWT token
    const payload = jwt.verify(token, secret) as JWTPayload

    // Inject user into request
    const authReq = req as AuthRequest
    authReq.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    }

    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' })
      return
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' })
      return
    }

    res.status(401).json({ error: 'Authentication failed' })
  }
}
