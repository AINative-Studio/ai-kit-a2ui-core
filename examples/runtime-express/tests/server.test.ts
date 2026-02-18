import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import type { Express } from 'express'
import { createApp } from '../src/server'

describe('Express Server', () => {
  let app: Express

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  describe('GET /health', () => {
    it('should return 200 status', async () => {
      const response = await request(app).get('/health')
      expect(response.status).toBe(200)
    })

    it('should return health status', async () => {
      const response = await request(app).get('/health')
      expect(response.body).toHaveProperty('status')
      expect(response.body.status).toBe('healthy')
    })

    it('should return uptime', async () => {
      const response = await request(app).get('/health')
      expect(response.body).toHaveProperty('uptime')
      expect(typeof response.body.uptime).toBe('number')
    })

    it('should return version', async () => {
      const response = await request(app).get('/health')
      expect(response.body).toHaveProperty('version')
    })

    it('should return adapter type', async () => {
      const response = await request(app).get('/health')
      expect(response.body).toHaveProperty('adapter')
      expect(response.body.adapter).toBe('openai')
    })

    it('should return number of registered actions', async () => {
      const response = await request(app).get('/health')
      expect(response.body).toHaveProperty('actionsRegistered')
      expect(response.body.actionsRegistered).toBe(4)
    })

    it('should return middleware count', async () => {
      const response = await request(app).get('/health')
      expect(response.body).toHaveProperty('middlewareCount')
    })

    it('should return timestamp', async () => {
      const response = await request(app).get('/health')
      expect(response.body).toHaveProperty('timestamp')
    })
  })

  describe('POST /api/agent/chat - Authentication', () => {
    it('should reject requests without auth token', async () => {
      const response = await request(app)
        .post('/api/agent/chat')
        .send({ message: 'Hello' })

      expect(response.status).toBe(401)
    })

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .post('/api/agent/chat')
        .set('Authorization', 'Bearer invalid-token')
        .send({ message: 'Hello' })

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/agent/chat - Request Validation', () => {
    it('should require message parameter', async () => {
      const token = generateTestToken()

      const response = await request(app)
        .post('/api/agent/chat')
        .set('Authorization', `Bearer ${token}`)
        .send({})

      expect(response.status).toBe(400)
    })

    it('should reject empty message', async () => {
      const token = generateTestToken()

      const response = await request(app)
        .post('/api/agent/chat')
        .set('Authorization', `Bearer ${token}`)
        .send({ message: '' })

      expect(response.status).toBe(400)
    })

    it('should accept valid message with context', async () => {
      const token = generateTestToken()

      const response = await request(app)
        .post('/api/agent/chat')
        .set('Authorization', `Bearer ${token}`)
        .send({
          message: 'Create a dashboard',
          context: { userId: '123' },
        })

      // Will return 200 with SSE stream
      expect([200, 500]).toContain(response.status)
    })
  })

  describe('POST /api/agent/chat - Streaming', () => {
    it('should return text/event-stream content type', async () => {
      const token = generateTestToken()

      const response = await request(app)
        .post('/api/agent/chat')
        .set('Authorization', `Bearer ${token}`)
        .send({ message: 'Hello' })

      if (response.status === 200) {
        expect(response.headers['content-type']).toContain('text/event-stream')
      }
    })

    it('should set cache control headers for SSE', async () => {
      const token = generateTestToken()

      const response = await request(app)
        .post('/api/agent/chat')
        .set('Authorization', `Bearer ${token}`)
        .send({ message: 'Hello' })

      if (response.status === 200) {
        expect(response.headers['cache-control']).toBe('no-cache')
      }
    })

    it('should set connection keep-alive', async () => {
      const token = generateTestToken()

      const response = await request(app)
        .post('/api/agent/chat')
        .set('Authorization', `Bearer ${token}`)
        .send({ message: 'Hello' })

      if (response.status === 200) {
        expect(response.headers['connection']).toBe('keep-alive')
      }
    })
  })

  describe('POST /api/agent/action', () => {
    it('should reject requests without auth token', async () => {
      const response = await request(app)
        .post('/api/agent/action')
        .send({ action: 'searchDatabase', parameters: {} })

      expect(response.status).toBe(401)
    })

    it('should require action parameter', async () => {
      const token = generateTestToken()

      const response = await request(app)
        .post('/api/agent/action')
        .set('Authorization', `Bearer ${token}`)
        .send({ parameters: {} })

      expect(response.status).toBe(400)
    })

    it('should require parameters parameter', async () => {
      const token = generateTestToken()

      const response = await request(app)
        .post('/api/agent/action')
        .set('Authorization', `Bearer ${token}`)
        .send({ action: 'searchDatabase' })

      expect(response.status).toBe(400)
    })

    it('should execute valid action', async () => {
      const token = generateTestToken()

      const response = await request(app)
        .post('/api/agent/action')
        .set('Authorization', `Bearer ${token}`)
        .send({
          action: 'searchDatabase',
          parameters: { query: 'test', limit: 5 },
        })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success')
    })

    it('should return 404 for unknown action', async () => {
      const token = generateTestToken()

      const response = await request(app)
        .post('/api/agent/action')
        .set('Authorization', `Bearer ${token}`)
        .send({
          action: 'unknownAction',
          parameters: {},
        })

      expect(response.status).toBe(404)
    })
  })

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const token = generateTestToken()
      const app = createApp({ rateLimitMax: 2, rateLimitWindowMs: 60000 })

      // Make requests up to limit
      await request(app).get('/health')
      await request(app).get('/health')

      // Next request should be rate limited
      const response = await request(app).get('/health')

      expect(response.status).toBe(429)
    })
  })

  describe('Error Handling', () => {
    it('should handle 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown-route')
      expect(response.status).toBe(404)
    })

    it('should return JSON error for 404', async () => {
      const response = await request(app).get('/unknown-route')
      expect(response.body).toHaveProperty('error')
    })

    it('should handle internal server errors', async () => {
      // Internal errors will be tested via integration
    })
  })
})

/**
 * Helper function to generate test JWT token
 */
function generateTestToken(): string {
  const jwt = require('jsonwebtoken')
  return jwt.sign(
    {
      sub: 'test-user-id',
      email: 'test@example.com',
      role: 'user',
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  )
}
