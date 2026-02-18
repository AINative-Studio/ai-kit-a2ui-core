/**
 * A2UIRuntime Comprehensive Test Suite
 *
 * Tests for the core A2UI runtime class covering:
 * - Runtime initialization
 * - Request processing
 * - Middleware execution
 * - Action handling
 * - Error scenarios
 * - Streaming responses
 *
 * Target: 90%+ code coverage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { z } from 'zod'

// Mock implementations for testing
class MockLLMAdapter {
  provider = 'mock-provider'

  async *generateUI(prompt: string, context: any, options?: any): AsyncIterableIterator<string> {
    // Simulate streaming response
    const chunks = ['<component', ' type="text"', ' id="t1">', 'Hello World', '</component>']
    for (const chunk of chunks) {
      yield chunk
    }
  }
}

class ErrorThrowingAdapter {
  provider = 'error-adapter'

  async *generateUI(prompt: string, context: any, options?: any): AsyncIterableIterator<string> {
    throw new Error('Adapter failed to generate UI')
  }
}

class CodedErrorAdapter {
  provider = 'coded-error-adapter'

  async *generateUI(prompt: string, context: any, options?: any): AsyncIterableIterator<string> {
    const error: any = new Error('Rate limit exceeded')
    error.code = 'RATE_LIMIT_ERROR'
    throw error
  }
}

// Mock middleware
const createMockMiddleware = (name: string, shouldModify = false) => {
  return async (context: any, next: () => Promise<void>) => {
    if (shouldModify) {
      context.metadata = { ...context.metadata, [name]: true }
    }
    await next()
  }
}

const createErrorMiddleware = () => {
  return async (context: any, next: () => Promise<void>) => {
    throw new Error('Middleware error')
  }
}

// Mock actions
const createMockAction = (name: string) => ({
  name,
  description: `Mock ${name} action`,
  parameters: z.object({
    input: z.string()
  }),
  handler: async (params: { input: string }) => {
    return { success: true, result: `${name}: ${params.input}` }
  }
})

const createFailingAction = (name: string) => ({
  name,
  description: `Failing ${name} action`,
  parameters: z.object({
    input: z.string()
  }),
  handler: async (params: { input: string }) => {
    throw new Error('Action execution failed')
  }
})

// Import the actual classes from source for coverage
import { A2UIRuntime } from '../../src/runtime/a2ui-runtime'
import { ActionRegistry } from '../../src/actions/action-registry'
import { composeMiddleware } from '../../src/middleware/middleware'

describe('A2UIRuntime', () => {
  let mockAdapter: MockLLMAdapter
  let runtime: any

  beforeEach(() => {
    mockAdapter = new MockLLMAdapter()
  })

  // ========================================
  // 1. Runtime Initialization (5 tests)
  // ========================================
  describe('Runtime Initialization', () => {
    it('should initialize runtime with adapter only', () => {
      runtime = new A2UIRuntime({
        adapter: mockAdapter
      })

      expect(runtime).toBeDefined()
      expect(runtime.getActions()).toEqual([])
    })

    it('should initialize runtime with adapter and actions', () => {
      const testAction = createMockAction('testAction')

      runtime = new A2UIRuntime({
        adapter: mockAdapter,
        actions: [testAction]
      })

      const actions = runtime.getActions()
      expect(actions).toHaveLength(1)
      expect(actions[0].name).toBe('testAction')
    })

    it('should initialize runtime with adapter and middleware', () => {
      const middleware = [createMockMiddleware('test')]

      runtime = new A2UIRuntime({
        adapter: mockAdapter,
        middleware
      })

      expect(runtime).toBeDefined()
    })

    it('should initialize runtime with all configuration options', () => {
      const testAction = createMockAction('action1')
      const middleware = [createMockMiddleware('mid1')]

      runtime = new A2UIRuntime({
        adapter: mockAdapter,
        actions: [testAction],
        middleware
      })

      expect(runtime).toBeDefined()
      expect(runtime.getActions()).toHaveLength(1)
    })

    it('should initialize with multiple actions', () => {
      const actions = [
        createMockAction('action1'),
        createMockAction('action2'),
        createMockAction('action3')
      ]

      runtime = new A2UIRuntime({
        adapter: mockAdapter,
        actions
      })

      expect(runtime.getActions()).toHaveLength(3)
    })
  })

  // ========================================
  // 2. Request Processing (10 tests)
  // ========================================
  describe('Request Processing', () => {
    beforeEach(() => {
      runtime = new A2UIRuntime({
        adapter: mockAdapter
      })
    })

    it('should process a basic UI generation request', async () => {
      const context = runtime.createContext('req-001')

      const response = await runtime.process({
        prompt: 'Generate a button',
        context,
        options: {}
      })

      expect(response.status).toBe('success')
      expect(response.requestId).toBe('req-001')
      expect(response.content).toBeTruthy()
      expect(response.content).toContain('component')
    })

    it('should process request with custom context metadata', async () => {
      const context = runtime.createContext('req-002', {
        userId: 'user-123',
        sessionId: 'session-456'
      })

      const response = await runtime.process({
        prompt: 'Generate UI',
        context,
        options: {}
      })

      expect(response.status).toBe('success')
      expect(response.requestId).toBe('req-002')
    })

    it('should process request with custom options', async () => {
      const context = runtime.createContext('req-003')

      const response = await runtime.process({
        prompt: 'Generate UI',
        context,
        options: {
          model: 'test-model',
          temperature: 0.5,
          maxTokens: 100
        }
      })

      expect(response.status).toBe('success')
    })

    it('should include metrics in successful response', async () => {
      const context = runtime.createContext('req-004')

      const response = await runtime.process({
        prompt: 'Generate UI',
        context,
        options: {}
      })

      expect(response.metrics).toBeDefined()
      expect(response.metrics.latencyMs).toBeGreaterThanOrEqual(0)
      expect(response.metrics.provider).toBe('mock-provider')
      expect(response.metrics.tokensUsed).toBeDefined()
    })

    it('should handle successful streaming that collects all chunks', async () => {
      const context = runtime.createContext('req-005')

      const response = await runtime.process({
        prompt: 'Generate UI',
        context,
        options: {}
      })

      expect(response.status).toBe('success')
      expect(response.content).toContain('<component')
      expect(response.content).toContain('Hello World')
      expect(response.content).toContain('</component>')
    })

    it('should set timestamp on response', async () => {
      const context = runtime.createContext('req-006')
      const before = new Date()

      const response = await runtime.process({
        prompt: 'Generate UI',
        context,
        options: {}
      })

      const after = new Date()
      expect(response.timestamp).toBeInstanceOf(Date)
      expect(response.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(response.timestamp.getTime()).toBeLessThanOrEqual(after.getTime())
    })

    it('should handle empty prompt', async () => {
      const context = runtime.createContext('req-007')

      const response = await runtime.process({
        prompt: '',
        context,
        options: {}
      })

      // Should still process, adapter decides what to do with empty prompt
      expect(response.status).toBe('success')
    })

    it('should handle request with no options', async () => {
      const context = runtime.createContext('req-008')

      const response = await runtime.process({
        prompt: 'Generate UI',
        context
      } as any)

      expect(response.status).toBe('success')
    })

    it('should execute middleware before processing', async () => {
      const middlewareExecuted = { value: false }
      const testMiddleware = async (context: any, next: () => Promise<void>) => {
        middlewareExecuted.value = true
        await next()
      }

      runtime = new A2UIRuntime({
        adapter: mockAdapter,
        middleware: [testMiddleware]
      })

      const context = runtime.createContext('req-009')
      await runtime.process({
        prompt: 'Generate UI',
        context,
        options: {}
      })

      expect(middlewareExecuted.value).toBe(true)
    })

    it('should measure latency correctly', async () => {
      const context = runtime.createContext('req-010')

      const response = await runtime.process({
        prompt: 'Generate UI',
        context,
        options: {}
      })

      expect(response.metrics.latencyMs).toBeGreaterThanOrEqual(0)
      expect(typeof response.metrics.latencyMs).toBe('number')
    })
  })

  // ========================================
  // 3. Middleware Execution (8 tests)
  // ========================================
  describe('Middleware Execution', () => {
    it('should execute single middleware', async () => {
      let executed = false
      const middleware = async (context: any, next: () => Promise<void>) => {
        executed = true
        await next()
      }

      runtime = new A2UIRuntime({
        adapter: mockAdapter,
        middleware: [middleware]
      })

      const context = runtime.createContext('req-mid-001')
      await runtime.process({
        prompt: 'Test',
        context,
        options: {}
      })

      expect(executed).toBe(true)
    })

    it('should execute multiple middleware in order', async () => {
      const executionOrder: string[] = []

      const mid1 = async (context: any, next: () => Promise<void>) => {
        executionOrder.push('mid1-before')
        await next()
        executionOrder.push('mid1-after')
      }

      const mid2 = async (context: any, next: () => Promise<void>) => {
        executionOrder.push('mid2-before')
        await next()
        executionOrder.push('mid2-after')
      }

      runtime = new A2UIRuntime({
        adapter: mockAdapter,
        middleware: [mid1, mid2]
      })

      const context = runtime.createContext('req-mid-002')
      await runtime.process({
        prompt: 'Test',
        context,
        options: {}
      })

      expect(executionOrder).toEqual([
        'mid1-before',
        'mid2-before',
        'mid2-after',
        'mid1-after'
      ])
    })

    it('should allow middleware to modify context', async () => {
      const modifyingMiddleware = async (context: any, next: () => Promise<void>) => {
        context.metadata = { ...context.metadata, modified: true }
        await next()
      }

      runtime = new A2UIRuntime({
        adapter: mockAdapter,
        middleware: [modifyingMiddleware]
      })

      const context = runtime.createContext('req-mid-003')
      await runtime.process({
        prompt: 'Test',
        context,
        options: {}
      })

      expect(context.metadata.modified).toBe(true)
    })

    it('should pass context through middleware chain', async () => {
      let receivedContext: any = null

      const contextCapture = async (context: any, next: () => Promise<void>) => {
        receivedContext = context
        await next()
      }

      runtime = new A2UIRuntime({
        adapter: mockAdapter,
        middleware: [contextCapture]
      })

      const context = runtime.createContext('req-mid-004', { test: 'data' })
      await runtime.process({
        prompt: 'Test',
        context,
        options: {}
      })

      expect(receivedContext).toBeDefined()
      expect(receivedContext.requestId).toBe('req-mid-004')
      expect(receivedContext.metadata.test).toBe('data')
    })

    it('should handle middleware errors and return error response', async () => {
      const errorMiddleware = async (context: any, next: () => Promise<void>) => {
        throw new Error('Middleware failed')
      }

      runtime = new A2UIRuntime({
        adapter: mockAdapter,
        middleware: [errorMiddleware]
      })

      const context = runtime.createContext('req-mid-005')
      const response = await runtime.process({
        prompt: 'Test',
        context,
        options: {}
      })

      expect(response.status).toBe('error')
      expect(response.error).toBeDefined()
      expect(response.error?.message).toContain('Middleware failed')
    })

    it('should allow middleware to access request metadata', async () => {
      let capturedMetadata: any = null

      const metadataMiddleware = async (context: any, next: () => Promise<void>) => {
        capturedMetadata = context.metadata
        await next()
      }

      runtime = new A2UIRuntime({
        adapter: mockAdapter,
        middleware: [metadataMiddleware]
      })

      const context = runtime.createContext('req-mid-006', {
        userId: 'user-789',
        role: 'admin'
      })

      await runtime.process({
        prompt: 'Test',
        context,
        options: {}
      })

      expect(capturedMetadata).toBeDefined()
      expect(capturedMetadata.userId).toBe('user-789')
      expect(capturedMetadata.role).toBe('admin')
    })

    it('should work with no middleware', async () => {
      runtime = new A2UIRuntime({
        adapter: mockAdapter,
        middleware: []
      })

      const context = runtime.createContext('req-mid-007')
      const response = await runtime.process({
        prompt: 'Test',
        context,
        options: {}
      })

      expect(response.status).toBe('success')
    })

    it('should allow middleware to short-circuit on errors', async () => {
      let secondMiddlewareExecuted = false

      const errorMiddleware = async (context: any, next: () => Promise<void>) => {
        throw new Error('Short circuit')
      }

      const secondMiddleware = async (context: any, next: () => Promise<void>) => {
        secondMiddlewareExecuted = true
        await next()
      }

      runtime = new A2UIRuntime({
        adapter: mockAdapter,
        middleware: [errorMiddleware, secondMiddleware]
      })

      const context = runtime.createContext('req-mid-008')
      const response = await runtime.process({
        prompt: 'Test',
        context,
        options: {}
      })

      expect(response.status).toBe('error')
      expect(secondMiddlewareExecuted).toBe(false)
    })
  })

  // ========================================
  // 4. Action Handling (8 tests)
  // ========================================
  describe('Action Handling', () => {
    it('should register actions on initialization', () => {
      const action = createMockAction('testAction')

      runtime = new A2UIRuntime({
        adapter: mockAdapter,
        actions: [action]
      })

      const actions = runtime.getActions()
      expect(actions).toHaveLength(1)
      expect(actions[0].name).toBe('testAction')
    })

    it('should register action after initialization', () => {
      runtime = new A2UIRuntime({
        adapter: mockAdapter
      })

      const action = createMockAction('dynamicAction')
      runtime.registerAction(action)

      const actions = runtime.getActions()
      expect(actions).toHaveLength(1)
      expect(actions[0].name).toBe('dynamicAction')
    })

    it('should execute registered action successfully', async () => {
      const action = createMockAction('executeTest')

      runtime = new A2UIRuntime({
        adapter: mockAdapter,
        actions: [action]
      })

      const result = await runtime.executeAction('executeTest', {
        input: 'test data'
      })

      expect(result.success).toBe(true)
      expect(result.result).toContain('executeTest')
      expect(result.result).toContain('test data')
    })

    it('should throw error when executing non-existent action', async () => {
      runtime = new A2UIRuntime({
        adapter: mockAdapter
      })

      await expect(
        runtime.executeAction('nonExistent', {})
      ).rejects.toThrow('not found')
    })

    it('should validate action parameters before execution', async () => {
      const action = createMockAction('validateTest')

      runtime = new A2UIRuntime({
        adapter: mockAdapter,
        actions: [action]
      })

      // Missing required 'input' parameter
      await expect(
        runtime.executeAction('validateTest', {})
      ).rejects.toThrow()
    })

    it('should handle action execution errors', async () => {
      const action = createFailingAction('failAction')

      runtime = new A2UIRuntime({
        adapter: mockAdapter,
        actions: [action]
      })

      await expect(
        runtime.executeAction('failAction', { input: 'test' })
      ).rejects.toThrow()
    })

    it('should get all registered actions', () => {
      const actions = [
        createMockAction('action1'),
        createMockAction('action2'),
        createMockAction('action3')
      ]

      runtime = new A2UIRuntime({
        adapter: mockAdapter,
        actions
      })

      const retrievedActions = runtime.getActions()
      expect(retrievedActions).toHaveLength(3)
      expect(retrievedActions.map((a: any) => a.name)).toEqual([
        'action1',
        'action2',
        'action3'
      ])
    })

    it('should include actions in runtime context', () => {
      const action = createMockAction('contextAction')

      runtime = new A2UIRuntime({
        adapter: mockAdapter,
        actions: [action]
      })

      const context = runtime.createContext('req-action-001')

      expect(context.actions).toBeInstanceOf(Map)
      expect(context.actions.has('contextAction')).toBe(true)
      expect(context.actions.get('contextAction')).toBeDefined()
    })
  })

  // ========================================
  // 5. Error Scenarios (5 tests)
  // ========================================
  describe('Error Scenarios', () => {
    it('should handle adapter errors gracefully', async () => {
      const errorAdapter = new ErrorThrowingAdapter()
      runtime = new A2UIRuntime({
        adapter: errorAdapter as any
      })

      const context = runtime.createContext('req-error-001')
      const response = await runtime.process({
        prompt: 'Test',
        context,
        options: {}
      })

      expect(response.status).toBe('error')
      expect(response.error).toBeDefined()
      expect(response.error?.message).toContain('failed')
      expect(response.content).toBe('')
    })

    it('should include error code in response when available', async () => {
      const codedAdapter = new CodedErrorAdapter()
      runtime = new A2UIRuntime({
        adapter: codedAdapter as any
      })

      const context = runtime.createContext('req-error-002')
      const response = await runtime.process({
        prompt: 'Test',
        context,
        options: {}
      })

      expect(response.status).toBe('error')
      expect(response.error?.code).toBe('RATE_LIMIT_ERROR')
    })

    it('should handle unknown error types', async () => {
      class WeirdErrorAdapter {
        provider = 'weird-adapter'

        async *generateUI(): AsyncIterableIterator<string> {
          throw 'String error' // Non-Error object
        }
      }

      runtime = new A2UIRuntime({
        adapter: new WeirdErrorAdapter() as any
      })

      const context = runtime.createContext('req-error-003')
      const response = await runtime.process({
        prompt: 'Test',
        context,
        options: {}
      })

      expect(response.status).toBe('error')
      expect(response.error?.message).toContain('Unknown error')
    })

    it('should include latency metrics even on error', async () => {
      const errorAdapter = new ErrorThrowingAdapter()
      runtime = new A2UIRuntime({
        adapter: errorAdapter as any
      })

      const context = runtime.createContext('req-error-004')
      const response = await runtime.process({
        prompt: 'Test',
        context,
        options: {}
      })

      expect(response.status).toBe('error')
      expect(response.metrics).toBeDefined()
      expect(response.metrics.latencyMs).toBeGreaterThanOrEqual(0)
      expect(response.metrics.provider).toBe('error-adapter')
    })

    it('should preserve request ID in error responses', async () => {
      const errorAdapter = new ErrorThrowingAdapter()
      runtime = new A2UIRuntime({
        adapter: errorAdapter as any
      })

      const context = runtime.createContext('req-error-005')
      const response = await runtime.process({
        prompt: 'Test',
        context,
        options: {}
      })

      expect(response.status).toBe('error')
      expect(response.requestId).toBe('req-error-005')
    })
  })

  // ========================================
  // 6. Streaming Responses (4 tests)
  // ========================================
  describe('Streaming Responses', () => {
    beforeEach(() => {
      runtime = new A2UIRuntime({
        adapter: mockAdapter
      })
    })

    it('should stream response chunks', async () => {
      const context = runtime.createContext('req-stream-001')

      const chunks: string[] = []
      for await (const chunk of runtime.stream({
        prompt: 'Generate UI',
        context,
        options: {}
      })) {
        chunks.push(chunk)
      }

      expect(chunks.length).toBeGreaterThan(0)
      expect(chunks.join('')).toContain('component')
    })

    it('should execute middleware before streaming', async () => {
      let middlewareExecuted = false
      const middleware = async (context: any, next: () => Promise<void>) => {
        middlewareExecuted = true
        await next()
      }

      runtime = new A2UIRuntime({
        adapter: mockAdapter,
        middleware: [middleware]
      })

      const context = runtime.createContext('req-stream-002')

      const chunks: string[] = []
      for await (const chunk of runtime.stream({
        prompt: 'Generate UI',
        context,
        options: {}
      })) {
        chunks.push(chunk)
      }

      expect(middlewareExecuted).toBe(true)
      expect(chunks.length).toBeGreaterThan(0)
    })

    it('should stream with custom options', async () => {
      const context = runtime.createContext('req-stream-003')

      const chunks: string[] = []
      for await (const chunk of runtime.stream({
        prompt: 'Generate UI',
        context,
        options: {
          model: 'custom-model',
          temperature: 0.8
        }
      })) {
        chunks.push(chunk)
      }

      expect(chunks.length).toBeGreaterThan(0)
    })

    it('should allow collecting streamed chunks', async () => {
      const context = runtime.createContext('req-stream-004')

      const chunks: string[] = []
      for await (const chunk of runtime.stream({
        prompt: 'Generate UI',
        context,
        options: {}
      })) {
        chunks.push(chunk)
      }

      const fullContent = chunks.join('')
      expect(fullContent).toContain('<component')
      expect(fullContent).toContain('Hello World')
      expect(fullContent).toContain('</component>')
    })
  })

  // ========================================
  // 7. Context Creation (3 tests)
  // ========================================
  describe('Context Creation', () => {
    beforeEach(() => {
      runtime = new A2UIRuntime({
        adapter: mockAdapter
      })
    })

    it('should create context with request ID', () => {
      const context = runtime.createContext('test-req-001')

      expect(context.requestId).toBe('test-req-001')
      expect(context.timestamp).toBeInstanceOf(Date)
      expect(context.actions).toBeInstanceOf(Map)
      expect(context.metadata).toEqual({})
    })

    it('should create context with metadata', () => {
      const metadata = {
        userId: 'user-123',
        sessionId: 'session-456',
        role: 'admin'
      }

      const context = runtime.createContext('test-req-002', metadata)

      expect(context.requestId).toBe('test-req-002')
      expect(context.metadata).toEqual(metadata)
    })

    it('should include registered actions in context', () => {
      const action1 = createMockAction('action1')
      const action2 = createMockAction('action2')

      runtime = new A2UIRuntime({
        adapter: mockAdapter,
        actions: [action1, action2]
      })

      const context = runtime.createContext('test-req-003')

      expect(context.actions.size).toBe(2)
      expect(context.actions.has('action1')).toBe(true)
      expect(context.actions.has('action2')).toBe(true)
    })
  })
})
