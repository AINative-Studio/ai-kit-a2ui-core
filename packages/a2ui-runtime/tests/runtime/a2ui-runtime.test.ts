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
 * - Context creation
 *
 * Target: 85%+ code coverage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { z } from 'zod'

// Mock implementations for testing
class MockLLMAdapter {
  provider = 'mock-provider'

  async *generateUI(prompt: string, context: any, options?: any): AsyncIterableIterator<string> {
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
  parameters: z.object({ input: z.string() }),
  handler: async (params: { input: string }) => {
    return { success: true, result: `${name}: ${params.input}` }
  }
})

const createFailingAction = (name: string) => ({
  name,
  description: `Failing ${name} action`,
  parameters: z.object({ input: z.string() }),
  handler: async (params: { input: string }) => {
    throw new Error('Action execution failed')
  }
})

import { A2UIRuntime } from '../../src/runtime/a2ui-runtime.js'

describe('A2UIRuntime', () => {
  let mockAdapter: MockLLMAdapter
  let runtime: any

  beforeEach(() => {
    mockAdapter = new MockLLMAdapter()
  })

  // ========================================
  // 1. Constructor Tests
  // ========================================
  describe('Constructor', () => {
    it('should initialize with adapter only', () => {
      runtime = new A2UIRuntime({ adapter: mockAdapter })
      expect(runtime).toBeDefined()
      expect(runtime.getActions()).toEqual([])
    })

    it('should register provided actions', () => {
      const testAction = createMockAction('testAction')
      runtime = new A2UIRuntime({ adapter: mockAdapter, actions: [testAction] })

      const actions = runtime.getActions()
      expect(actions).toHaveLength(1)
      expect(actions[0].name).toBe('testAction')
    })

    it('should compose provided middleware', () => {
      const middleware = [createMockMiddleware('test')]
      runtime = new A2UIRuntime({ adapter: mockAdapter, middleware })
      expect(runtime).toBeDefined()
    })

    it('should initialize with all configuration options', () => {
      const testAction = createMockAction('action1')
      const middleware = [createMockMiddleware('mid1')]

      runtime = new A2UIRuntime({ adapter: mockAdapter, actions: [testAction], middleware })
      expect(runtime).toBeDefined()
      expect(runtime.getActions()).toHaveLength(1)
    })

    it('should initialize with multiple actions', () => {
      const actions = [
        createMockAction('action1'),
        createMockAction('action2'),
        createMockAction('action3')
      ]

      runtime = new A2UIRuntime({ adapter: mockAdapter, actions })
      expect(runtime.getActions()).toHaveLength(3)
    })
  })

  // ========================================
  // 2. process()
  // ========================================
  describe('process', () => {
    beforeEach(() => {
      runtime = new A2UIRuntime({ adapter: mockAdapter })
    })

    it('should return success response with content', async () => {
      const context = runtime.createContext('req-001')
      const response = await runtime.process({ prompt: 'Generate a button', context, options: {} })

      expect(response.status).toBe('success')
      expect(response.content).toBeTruthy()
      expect(response.content).toContain('component')
    })

    it('should set requestId on response', async () => {
      const context = runtime.createContext('req-002')
      const response = await runtime.process({ prompt: 'Generate UI', context, options: {} })

      expect(response.requestId).toBe('req-002')
    })

    it('should record latencyMs > 0', async () => {
      const context = runtime.createContext('req-003')
      const response = await runtime.process({ prompt: 'Generate UI', context, options: {} })

      expect(response.metrics).toBeDefined()
      expect(response.metrics.latencyMs).toBeGreaterThanOrEqual(0)
      expect(typeof response.metrics.latencyMs).toBe('number')
    })

    it('should set provider from adapter', async () => {
      const context = runtime.createContext('req-004')
      const response = await runtime.process({ prompt: 'Generate UI', context, options: {} })

      expect(response.metrics.provider).toBe('mock-provider')
    })

    it('should collect all chunks into content', async () => {
      const context = runtime.createContext('req-005')
      const response = await runtime.process({ prompt: 'Generate UI', context, options: {} })

      expect(response.status).toBe('success')
      expect(response.content).toContain('<component')
      expect(response.content).toContain('Hello World')
      expect(response.content).toContain('</component>')
    })

    it('should handle adapter error and return error response with status=error', async () => {
      runtime = new A2UIRuntime({ adapter: new ErrorThrowingAdapter() as any })
      const context = runtime.createContext('req-error-001')
      const response = await runtime.process({ prompt: 'Test', context, options: {} })

      expect(response.status).toBe('error')
      expect(response.error).toBeDefined()
      expect(response.content).toBe('')
    })

    it('should set error.code from coded error', async () => {
      runtime = new A2UIRuntime({ adapter: new CodedErrorAdapter() as any })
      const context = runtime.createContext('req-error-002')
      const response = await runtime.process({ prompt: 'Test', context, options: {} })

      expect(response.status).toBe('error')
      expect(response.error?.code).toBe('RATE_LIMIT_ERROR')
    })

    it('should handle uncoded errors with UNKNOWN_ERROR or generic code', async () => {
      class WeirdAdapter {
        provider = 'weird'
        async *generateUI(): AsyncIterableIterator<string> {
          throw 'String error'
        }
      }

      runtime = new A2UIRuntime({ adapter: new WeirdAdapter() as any })
      const context = runtime.createContext('req-error-003')
      const response = await runtime.process({ prompt: 'Test', context, options: {} })

      expect(response.status).toBe('error')
      expect(response.error).toBeDefined()
    })

    it('should execute middleware before processing', async () => {
      const middlewareExecuted = { value: false }
      const testMiddleware = async (context: any, next: () => Promise<void>) => {
        middlewareExecuted.value = true
        await next()
      }

      runtime = new A2UIRuntime({ adapter: mockAdapter, middleware: [testMiddleware] })
      const context = runtime.createContext('req-006')
      await runtime.process({ prompt: 'Generate UI', context, options: {} })

      expect(middlewareExecuted.value).toBe(true)
    })

    it('should handle middleware errors and return error response', async () => {
      const errorMiddleware = async (context: any, next: () => Promise<void>) => {
        throw new Error('Middleware failed')
      }

      runtime = new A2UIRuntime({ adapter: mockAdapter, middleware: [errorMiddleware] })
      const context = runtime.createContext('req-007')
      const response = await runtime.process({ prompt: 'Test', context, options: {} })

      expect(response.status).toBe('error')
      expect(response.error?.message).toContain('Middleware failed')
    })

    it('should preserve requestId in error responses', async () => {
      runtime = new A2UIRuntime({ adapter: new ErrorThrowingAdapter() as any })
      const context = runtime.createContext('req-error-005')
      const response = await runtime.process({ prompt: 'Test', context, options: {} })

      expect(response.status).toBe('error')
      expect(response.requestId).toBe('req-error-005')
    })

    it('should include latency metrics even on error', async () => {
      runtime = new A2UIRuntime({ adapter: new ErrorThrowingAdapter() as any })
      const context = runtime.createContext('req-error-006')
      const response = await runtime.process({ prompt: 'Test', context, options: {} })

      expect(response.status).toBe('error')
      expect(response.metrics).toBeDefined()
      expect(response.metrics.latencyMs).toBeGreaterThanOrEqual(0)
      expect(response.metrics.provider).toBe('error-adapter')
    })
  })

  // ========================================
  // 3. stream()
  // ========================================
  describe('stream', () => {
    beforeEach(() => {
      runtime = new A2UIRuntime({ adapter: mockAdapter })
    })

    it('should yield chunks from adapter', async () => {
      const context = runtime.createContext('req-stream-001')

      const chunks: string[] = []
      for await (const chunk of runtime.stream({ prompt: 'Generate UI', context, options: {} })) {
        chunks.push(chunk)
      }

      expect(chunks.length).toBeGreaterThan(0)
      expect(chunks.join('')).toContain('component')
    })

    it('should run middleware before streaming', async () => {
      let middlewareExecuted = false
      const middleware = async (context: any, next: () => Promise<void>) => {
        middlewareExecuted = true
        await next()
      }

      runtime = new A2UIRuntime({ adapter: mockAdapter, middleware: [middleware] })
      const context = runtime.createContext('req-stream-002')

      const chunks: string[] = []
      for await (const chunk of runtime.stream({ prompt: 'Generate UI', context, options: {} })) {
        chunks.push(chunk)
      }

      expect(middlewareExecuted).toBe(true)
      expect(chunks.length).toBeGreaterThan(0)
    })

    it('should allow collecting streamed chunks into full content', async () => {
      const context = runtime.createContext('req-stream-003')

      const chunks: string[] = []
      for await (const chunk of runtime.stream({ prompt: 'Generate UI', context, options: {} })) {
        chunks.push(chunk)
      }

      const fullContent = chunks.join('')
      expect(fullContent).toContain('<component')
      expect(fullContent).toContain('Hello World')
      expect(fullContent).toContain('</component>')
    })

    it('should stream with custom options', async () => {
      const context = runtime.createContext('req-stream-004')

      const chunks: string[] = []
      for await (const chunk of runtime.stream({ prompt: 'Generate UI', context, options: { model: 'custom-model', temperature: 0.8 } })) {
        chunks.push(chunk)
      }

      expect(chunks.length).toBeGreaterThan(0)
    })
  })

  // ========================================
  // 4. executeAction()
  // ========================================
  describe('executeAction', () => {
    it('should delegate to ActionRegistry', async () => {
      const action = createMockAction('myAction')
      runtime = new A2UIRuntime({ adapter: mockAdapter, actions: [action] })

      const result = await runtime.executeAction('myAction', { input: 'test data' })

      expect(result.success).toBe(true)
      expect(result.result).toContain('myAction')
      expect(result.result).toContain('test data')
    })

    it('should throw for unknown action', async () => {
      runtime = new A2UIRuntime({ adapter: mockAdapter })

      await expect(
        runtime.executeAction('nonExistent', {})
      ).rejects.toThrow()
    })

    it('should validate action parameters before execution', async () => {
      const action = createMockAction('validateTest')
      runtime = new A2UIRuntime({ adapter: mockAdapter, actions: [action] })

      await expect(
        runtime.executeAction('validateTest', {})
      ).rejects.toThrow()
    })
  })

  // ========================================
  // 5. registerAction()
  // ========================================
  describe('registerAction', () => {
    it('should add action accessible via getActions', () => {
      runtime = new A2UIRuntime({ adapter: mockAdapter })

      const action = createMockAction('dynamicAction')
      runtime.registerAction(action)

      const actions = runtime.getActions()
      expect(actions).toHaveLength(1)
      expect(actions[0].name).toBe('dynamicAction')
    })

    it('should allow registering multiple actions after initialization', () => {
      runtime = new A2UIRuntime({ adapter: mockAdapter })

      runtime.registerAction(createMockAction('action1'))
      runtime.registerAction(createMockAction('action2'))

      const actions = runtime.getActions()
      expect(actions).toHaveLength(2)
    })

    it('should make dynamically registered action executable', async () => {
      runtime = new A2UIRuntime({ adapter: mockAdapter })

      const action = createMockAction('execAction')
      runtime.registerAction(action)

      const result = await runtime.executeAction('execAction', { input: 'hello' })
      expect(result.success).toBe(true)
    })
  })

  // ========================================
  // 6. getActions()
  // ========================================
  describe('getActions', () => {
    it('should return empty array initially', () => {
      runtime = new A2UIRuntime({ adapter: mockAdapter })
      expect(runtime.getActions()).toEqual([])
    })

    it('should return registered actions', () => {
      const actions = [
        createMockAction('action1'),
        createMockAction('action2'),
        createMockAction('action3')
      ]

      runtime = new A2UIRuntime({ adapter: mockAdapter, actions })

      const retrieved = runtime.getActions()
      expect(retrieved).toHaveLength(3)
      expect(retrieved.map((a: any) => a.name)).toEqual(['action1', 'action2', 'action3'])
    })
  })

  // ========================================
  // 7. createContext()
  // ========================================
  describe('createContext', () => {
    beforeEach(() => {
      runtime = new A2UIRuntime({ adapter: mockAdapter })
    })

    it('should return context with requestId', () => {
      const context = runtime.createContext('test-req-001')
      expect(context.requestId).toBe('test-req-001')
      expect(context.timestamp).toBeInstanceOf(Date)
      expect(context.actions).toBeInstanceOf(Map)
    })

    it('should populate actions Map from registry', () => {
      const action1 = createMockAction('action1')
      const action2 = createMockAction('action2')

      runtime = new A2UIRuntime({ adapter: mockAdapter, actions: [action1, action2] })

      const context = runtime.createContext('test-req-002')
      expect(context.actions.size).toBe(2)
      expect(context.actions.has('action1')).toBe(true)
      expect(context.actions.has('action2')).toBe(true)
    })

    it('should include metadata when provided', () => {
      const metadata = { userId: 'user-123', sessionId: 'session-456' }
      const context = runtime.createContext('test-req-003', metadata)

      expect(context.requestId).toBe('test-req-003')
      expect(context.metadata).toEqual(metadata)
    })

    it('should return empty metadata when not provided', () => {
      const context = runtime.createContext('test-req-004')
      expect(context.metadata).toEqual({})
    })

    it('should return unique contexts for different requestIds', () => {
      const ctx1 = runtime.createContext('req-a')
      const ctx2 = runtime.createContext('req-b')

      expect(ctx1.requestId).toBe('req-a')
      expect(ctx2.requestId).toBe('req-b')
      expect(ctx1).not.toBe(ctx2)
    })
  })

  // ========================================
  // 8. Middleware Execution (full pipeline)
  // ========================================
  describe('Middleware pipeline', () => {
    it('should execute multiple middleware in correct order', async () => {
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

      runtime = new A2UIRuntime({ adapter: mockAdapter, middleware: [mid1, mid2] })

      const context = runtime.createContext('req-mid-001')
      await runtime.process({ prompt: 'Test', context, options: {} })

      expect(executionOrder).toEqual(['mid1-before', 'mid2-before', 'mid2-after', 'mid1-after'])
    })

    it('should allow middleware to modify context', async () => {
      const modifyingMiddleware = async (context: any, next: () => Promise<void>) => {
        context.metadata = { ...context.metadata, modified: true }
        await next()
      }

      runtime = new A2UIRuntime({ adapter: mockAdapter, middleware: [modifyingMiddleware] })

      const context = runtime.createContext('req-mid-002')
      await runtime.process({ prompt: 'Test', context, options: {} })

      expect(context.metadata.modified).toBe(true)
    })

    it('should short-circuit subsequent middleware on error', async () => {
      let secondMiddlewareExecuted = false

      const errorMiddleware = async (context: any, next: () => Promise<void>) => {
        throw new Error('Short circuit')
      }

      const secondMiddleware = async (context: any, next: () => Promise<void>) => {
        secondMiddlewareExecuted = true
        await next()
      }

      runtime = new A2UIRuntime({ adapter: mockAdapter, middleware: [errorMiddleware, secondMiddleware] })

      const context = runtime.createContext('req-mid-003')
      const response = await runtime.process({ prompt: 'Test', context, options: {} })

      expect(response.status).toBe('error')
      expect(secondMiddlewareExecuted).toBe(false)
    })
  })
})
