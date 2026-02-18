import express, { type Express, type Request, type Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { A2UIRuntime, OpenAIAdapter, type Action } from '@ainative/a2ui-runtime'
import { authMiddleware } from './middleware/auth'
import { createRateLimitMiddleware } from './middleware/rate-limit'
import { searchDatabaseAction } from './actions/search-database'
import { updateRecordAction } from './actions/update-record'
import { sendEmailAction } from './actions/send-email'
import { generateReportAction } from './actions/generate-report'
import type { ChatRequestBody, ActionRequestBody, AuthRequest, HealthStatusResponse } from './types/express-types'

const startTime = Date.now()

/**
 * Server configuration options
 */
export interface ServerConfig {
  port?: number
  rateLimitMax?: number
  rateLimitWindowMs?: number
}

/**
 * Create and configure Express application
 */
export function createApp(config?: ServerConfig): Express {
  const app = express()

  // Middleware
  app.use(helmet())
  app.use(cors())
  app.use(express.json())

  // Rate limiting
  const rateLimitMiddleware = createRateLimitMiddleware({
    maxRequests: config?.rateLimitMax,
    windowMs: config?.rateLimitWindowMs,
  })
  app.use(rateLimitMiddleware)

  // Initialize A2UI Runtime
  const runtime = new A2UIRuntime({
    adapter: new OpenAIAdapter({
      apiKey: process.env.OPENAI_API_KEY || '',
      defaultModel: 'gpt-4o',
    }),
    actions: [
      searchDatabaseAction,
      updateRecordAction,
      sendEmailAction,
      generateReportAction,
    ],
  })

  // Health check endpoint (no auth required)
  app.get('/health', (_req: Request, res: Response) => {
    const uptime = Date.now() - startTime

    const health: HealthStatusResponse = {
      status: 'healthy',
      uptime,
      version: '0.1.0',
      adapter: 'openai',
      actionsRegistered: runtime.getActions().length,
      middlewareCount: 4, // helmet, cors, json, rate-limit
      timestamp: new Date().toISOString(),
    }

    res.json(health)
  })

  // Chat endpoint with streaming
  app.post('/api/agent/chat', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { message, context } = req.body as ChatRequestBody
      const authReq = req as AuthRequest

      // Validate request
      if (!message || typeof message !== 'string' || message.trim() === '') {
        res.status(400).json({ error: 'Message is required and must be non-empty' })
        return
      }

      // Create runtime context
      const runtimeContext = runtime.createContext(
        `req-${Date.now()}`,
        {
          user: authReq.user,
          ...context,
        }
      )

      // Set up SSE headers
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')

      // Stream response
      try {
        for await (const chunk of runtime.stream({
          prompt: message,
          context: runtimeContext,
          options: {
            model: 'gpt-4o',
            temperature: 0.7,
          },
        })) {
          res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`)
        }

        res.write('data: [DONE]\n\n')
        res.end()
      } catch (streamError) {
        res.write(`data: ${JSON.stringify({ error: streamError instanceof Error ? streamError.message : 'Stream error' })}\n\n`)
        res.end()
      }
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
      })
    }
  })

  // Direct action execution endpoint
  app.post('/api/agent/action', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { action, parameters } = req.body as ActionRequestBody
      const authReq = req as AuthRequest

      // Validate request
      if (!action || typeof action !== 'string') {
        res.status(400).json({ error: 'Action name is required' })
        return
      }

      if (!parameters || typeof parameters !== 'object') {
        res.status(400).json({ error: 'Parameters object is required' })
        return
      }

      // Check if action exists
      const actions = runtime.getActions()
      const actionExists = actions.some((a: Action) => a.name === action)

      if (!actionExists) {
        res.status(404).json({ error: `Action '${action}' not found` })
        return
      }

      // Execute action
      const result = await runtime.executeAction(action, {
        ...parameters,
        _context: { user: authReq.user },
      })

      res.json({
        success: true,
        result,
      })
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Action execution failed',
      })
    }
  })

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' })
  })

  return app
}

/**
 * Start the server
 */
export function startServer(config?: ServerConfig): void {
  const app = createApp(config)
  const port = config?.port || parseInt(process.env.PORT || '3001')

  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 A2UI Runtime server running on http://localhost:${port}`)
    // eslint-disable-next-line no-console
    console.log(`📊 Health check: http://localhost:${port}/health`)
    // eslint-disable-next-line no-console
    console.log(`🤖 Adapter: OpenAI (gpt-4o)`)
    // eslint-disable-next-line no-console
    console.log(`⚡ Actions: 4 registered`)
  })
}

// Start server if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer()
}
