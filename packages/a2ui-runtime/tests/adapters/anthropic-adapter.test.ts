/**
 * Anthropic Adapter Comprehensive Test Suite
 *
 * Tests for the Anthropic adapter covering:
 * - Constructor and initialization
 * - generateUI streaming
 * - executeAction validation
 * - streamResponse callbacks and system message filtering
 * - convertActionsToTools (Anthropic format)
 * - Error handling (LLMProviderError)
 *
 * Target: 85%+ code coverage
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { z } from 'zod'

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: { create: vi.fn() },
    })),
  }
})

import { AnthropicAdapter } from '../../src/adapters/anthropic-adapter.js'
import { LLMProviderError } from '../../src/errors/runtime-errors.js'

/**
 * Helper: create a mock async iterable stream of Anthropic SSE events
 */
function createMockStream(events: any[]): AsyncIterable<any> {
  return {
    [Symbol.asyncIterator]: async function* () {
      for (const event of events) {
        yield event
      }
    },
  }
}

const makeContext = (id = 'req-001') => ({
  requestId: id,
  timestamp: new Date(),
  actions: new Map(),
  metadata: {},
})

describe('AnthropicAdapter', () => {
  let adapter: any
  let mockClient: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockClient = {
      messages: { create: vi.fn() },
    }

    adapter = new AnthropicAdapter(
      { apiKey: 'sk-test', defaultModel: 'claude-3-5-sonnet-20241022' },
      mockClient
    )
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ========================================
  // 1. Constructor
  // ========================================
  describe('Constructor', () => {
    it('should create adapter with injected client', () => {
      expect(adapter).toBeDefined()
      expect(adapter.client).toBe(mockClient)
    })

    it('should create adapter with config only (no injected client)', () => {
      const a = new AnthropicAdapter({ apiKey: 'sk-test' })
      expect(a).toBeDefined()
      expect(a.provider).toBe('anthropic')
    })

    it('should set defaultModel to claude-3-5-sonnet-20241022 when not specified', () => {
      const a = new AnthropicAdapter({ apiKey: 'sk-test' }, mockClient)
      expect(a.defaultModel).toBe('claude-3-5-sonnet-20241022')
    })

    it('should use provided defaultModel', () => {
      const a = new AnthropicAdapter({ apiKey: 'sk-test', defaultModel: 'claude-4' }, mockClient)
      expect(a.defaultModel).toBe('claude-4')
    })

    it('should have provider set to anthropic', () => {
      expect(adapter.provider).toBe('anthropic')
    })
  })

  // ========================================
  // 2. generateUI
  // ========================================
  describe('generateUI', () => {
    it('should yield chunks from stream', async () => {
      const mockStream = createMockStream([
        { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hello' } },
        { type: 'content_block_delta', delta: { type: 'text_delta', text: ' World' } },
      ])

      mockClient.messages.create.mockResolvedValue(mockStream)

      const chunks: string[] = []
      for await (const chunk of adapter.generateUI('Test prompt', makeContext())) {
        chunks.push(chunk)
      }

      expect(chunks).toEqual(['Hello', ' World'])
      expect(mockClient.messages.create).toHaveBeenCalledTimes(1)
    })

    it('should use correct model from options', async () => {
      const mockStream = createMockStream([])
      mockClient.messages.create.mockResolvedValue(mockStream)

      for await (const _ of adapter.generateUI('Test', makeContext(), { model: 'claude-4' })) { /* consume */ }

      expect(mockClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'claude-4' })
      )
    })

    it('should use defaultModel when no options provided', async () => {
      const mockStream = createMockStream([])
      mockClient.messages.create.mockResolvedValue(mockStream)

      for await (const _ of adapter.generateUI('Test', makeContext())) { /* consume */ }

      expect(mockClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'claude-3-5-sonnet-20241022' })
      )
    })

    it('should pass temperature to Anthropic', async () => {
      const mockStream = createMockStream([])
      mockClient.messages.create.mockResolvedValue(mockStream)

      for await (const _ of adapter.generateUI('Test', makeContext(), { temperature: 0.7 })) { /* consume */ }

      expect(mockClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({ temperature: 0.7 })
      )
    })

    it('should pass maxTokens to Anthropic', async () => {
      const mockStream = createMockStream([])
      mockClient.messages.create.mockResolvedValue(mockStream)

      for await (const _ of adapter.generateUI('Test', makeContext(), { maxTokens: 2048 })) { /* consume */ }

      expect(mockClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({ max_tokens: 2048 })
      )
    })

    it('should use default max_tokens of 4096 when not specified', async () => {
      const mockStream = createMockStream([])
      mockClient.messages.create.mockResolvedValue(mockStream)

      for await (const _ of adapter.generateUI('Test', makeContext())) { /* consume */ }

      expect(mockClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({ max_tokens: 4096 })
      )
    })

    it('should pass topP to Anthropic', async () => {
      const mockStream = createMockStream([])
      mockClient.messages.create.mockResolvedValue(mockStream)

      for await (const _ of adapter.generateUI('Test', makeContext(), { topP: 0.9 })) { /* consume */ }

      expect(mockClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({ top_p: 0.9 })
      )
    })

    it('should enable streaming', async () => {
      const mockStream = createMockStream([])
      mockClient.messages.create.mockResolvedValue(mockStream)

      for await (const _ of adapter.generateUI('Test', makeContext())) { /* consume */ }

      expect(mockClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({ stream: true })
      )
    })

    it('should handle empty stream (no chunks)', async () => {
      const mockStream = createMockStream([])
      mockClient.messages.create.mockResolvedValue(mockStream)

      const chunks: string[] = []
      for await (const chunk of adapter.generateUI('Test', makeContext())) {
        chunks.push(chunk)
      }

      expect(chunks).toEqual([])
    })

    it('should skip non-text_delta events', async () => {
      const mockStream = createMockStream([
        { type: 'message_start', message: {} },
        { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hello' } },
        { type: 'content_block_stop', index: 0 },
        { type: 'message_stop' },
      ])

      mockClient.messages.create.mockResolvedValue(mockStream)

      const chunks: string[] = []
      for await (const chunk of adapter.generateUI('Test', makeContext())) {
        chunks.push(chunk)
      }

      expect(chunks).toEqual(['Hello'])
    })

    it('should skip content_block_delta events that are not text_delta type', async () => {
      const mockStream = createMockStream([
        { type: 'content_block_delta', delta: { type: 'input_json_delta', partial_json: '{}' } },
        { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Only this' } },
      ])

      mockClient.messages.create.mockResolvedValue(mockStream)

      const chunks: string[] = []
      for await (const chunk of adapter.generateUI('Test', makeContext())) {
        chunks.push(chunk)
      }

      expect(chunks).toEqual(['Only this'])
    })

    it('should throw LLMProviderError on API error with status', async () => {
      const apiError: any = new Error('Rate limit exceeded')
      apiError.status = 429

      mockClient.messages.create.mockRejectedValue(apiError)

      await expect(async () => {
        for await (const _ of adapter.generateUI('Test', makeContext())) { /* consume */ }
      }).rejects.toThrow(LLMProviderError)
    })

    it('should set provider to anthropic on LLMProviderError', async () => {
      const apiError: any = new Error('Auth failed')
      apiError.status = 401

      mockClient.messages.create.mockRejectedValue(apiError)

      try {
        for await (const _ of adapter.generateUI('Test', makeContext())) { /* consume */ }
      } catch (error: any) {
        expect(error).toBeInstanceOf(LLMProviderError)
        expect(error.provider).toBe('anthropic')
      }
    })

    it('should include status code in LLMProviderError', async () => {
      const apiError: any = new Error('Server error')
      apiError.status = 500

      mockClient.messages.create.mockRejectedValue(apiError)

      try {
        for await (const _ of adapter.generateUI('Test', makeContext())) { /* consume */ }
      } catch (error: any) {
        expect(error).toBeInstanceOf(LLMProviderError)
        expect(error.status).toBe(500)
      }
    })

    it('should rethrow non-status errors', async () => {
      const networkError = new Error('Network timeout')
      mockClient.messages.create.mockRejectedValue(networkError)

      await expect(async () => {
        for await (const _ of adapter.generateUI('Test', makeContext())) { /* consume */ }
      }).rejects.toThrow('Network timeout')
    })
  })

  // ========================================
  // 3. executeAction
  // ========================================
  describe('executeAction', () => {
    it('should return success result when schema valid', async () => {
      const action = {
        name: 'test_action',
        description: 'Test action',
        parameters: z.object({ value: z.string() }),
        handler: vi.fn().mockResolvedValue({ success: true, data: 'result' }),
      }

      const result = await adapter.executeAction(action, { value: 'test' })

      expect(result.success).toBe(true)
      expect(result.data).toBe('result')
      expect(action.handler).toHaveBeenCalledWith({ value: 'test' })
    })

    it('should return {success:false, error} when schema invalid', async () => {
      const action = {
        name: 'test_action',
        description: 'Test action',
        parameters: z.object({ value: z.string() }),
        handler: vi.fn(),
      }

      const result = await adapter.executeAction(action, { value: 123 })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(action.handler).not.toHaveBeenCalled()
    })

    it('should call action.handler with parsed data', async () => {
      const action = {
        name: 'complex_action',
        description: 'Complex parameters',
        parameters: z.object({ name: z.string(), count: z.number() }),
        handler: vi.fn().mockResolvedValue({ success: true }),
      }

      const params = { name: 'test', count: 5 }
      await adapter.executeAction(action, params)

      expect(action.handler).toHaveBeenCalledWith(params)
    })

    it('should return error for missing required fields', async () => {
      const action = {
        name: 'test_action',
        description: 'Test',
        parameters: z.object({ required: z.string() }),
        handler: vi.fn(),
      }

      const result = await adapter.executeAction(action, {})

      expect(result.success).toBe(false)
      expect(result.error).toContain('required')
    })

    it('should handle action handler returning error result', async () => {
      const action = {
        name: 'failing_action',
        description: 'Always fails',
        parameters: z.object({}),
        handler: vi.fn().mockResolvedValue({ success: false, error: 'Action failed' }),
      }

      const result = await adapter.executeAction(action, {})

      expect(result.success).toBe(false)
      expect(result.error).toBe('Action failed')
    })
  })

  // ========================================
  // 4. streamResponse
  // ========================================
  describe('streamResponse', () => {
    it('should yield text_delta chunks', async () => {
      const mockStream = createMockStream([
        { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Response' } },
        { type: 'content_block_delta', delta: { type: 'text_delta', text: ' text' } },
      ])

      mockClient.messages.create.mockResolvedValue(mockStream)

      const messages = [{ role: 'user' as const, content: 'Hello' }]

      const chunks: string[] = []
      for await (const chunk of adapter.streamResponse(messages)) {
        chunks.push(chunk)
      }

      expect(chunks).toEqual(['Response', ' text'])
    })

    it('should call onChunk callback', async () => {
      const mockStream = createMockStream([
        { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hello' } },
        { type: 'content_block_delta', delta: { type: 'text_delta', text: ' World' } },
      ])

      mockClient.messages.create.mockResolvedValue(mockStream)

      const onChunk = vi.fn()
      const messages = [{ role: 'user' as const, content: 'Test' }]

      for await (const _ of adapter.streamResponse(messages, { onChunk })) { /* consume */ }

      expect(onChunk).toHaveBeenCalledTimes(2)
      expect(onChunk).toHaveBeenNthCalledWith(1, 'Hello')
      expect(onChunk).toHaveBeenNthCalledWith(2, ' World')
    })

    it('should call onComplete callback', async () => {
      const mockStream = createMockStream([
        { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Done' } },
      ])

      mockClient.messages.create.mockResolvedValue(mockStream)

      const onComplete = vi.fn()
      const messages = [{ role: 'user' as const, content: 'Test' }]

      for await (const _ of adapter.streamResponse(messages, { onComplete })) { /* consume */ }

      expect(onComplete).toHaveBeenCalledTimes(1)
    })

    it('should call onError callback on failure', async () => {
      const apiError = new Error('Stream failed')
      mockClient.messages.create.mockRejectedValue(apiError)

      const onError = vi.fn()
      const messages = [{ role: 'user' as const, content: 'Test' }]

      try {
        for await (const _ of adapter.streamResponse(messages, { onError })) { /* consume */ }
      } catch { /* expected */ }

      expect(onError).toHaveBeenCalledWith(apiError)
    })

    it('should filter out system messages', async () => {
      const mockStream = createMockStream([])
      mockClient.messages.create.mockResolvedValue(mockStream)

      const messages = [
        { role: 'system' as const, content: 'System message' },
        { role: 'user' as const, content: 'User message' },
        { role: 'assistant' as const, content: 'Assistant message' },
      ]

      for await (const _ of adapter.streamResponse(messages)) { /* consume */ }

      const createCall = mockClient.messages.create.mock.calls[0][0]
      const roles = createCall.messages.map((m: any) => m.role)
      expect(roles).not.toContain('system')
      expect(roles).toContain('user')
      expect(roles).toContain('assistant')
    })

    it('should throw LLMProviderError on stream failure', async () => {
      const streamError = new Error('Connection lost')
      mockClient.messages.create.mockRejectedValue(streamError)

      const messages = [{ role: 'user' as const, content: 'Test' }]

      await expect(async () => {
        for await (const _ of adapter.streamResponse(messages)) { /* consume */ }
      }).rejects.toThrow(LLMProviderError)
    })

    it('should use options.model in streamResponse', async () => {
      const mockStream = createMockStream([])
      mockClient.messages.create.mockResolvedValue(mockStream)

      const messages = [{ role: 'user' as const, content: 'Test' }]

      for await (const _ of adapter.streamResponse(messages, { model: 'claude-4-opus' })) { /* consume */ }

      const createCall = mockClient.messages.create.mock.calls[0][0]
      expect(createCall.model).toBe('claude-4-opus')
    })

    it('should use default model in streamResponse when not specified', async () => {
      const mockStream = createMockStream([])
      mockClient.messages.create.mockResolvedValue(mockStream)

      const messages = [{ role: 'user' as const, content: 'Test' }]

      for await (const _ of adapter.streamResponse(messages)) { /* consume */ }

      const createCall = mockClient.messages.create.mock.calls[0][0]
      expect(createCall.model).toBe('claude-3-5-sonnet-20241022')
    })

    it('should handle null content in messages', async () => {
      const mockStream = createMockStream([])
      mockClient.messages.create.mockResolvedValue(mockStream)

      const messages = [{ role: 'user' as const, content: null }]

      for await (const _ of adapter.streamResponse(messages)) { /* consume */ }

      const createCall = mockClient.messages.create.mock.calls[0][0]
      expect(createCall.messages[0].content).toBe('')
    })
  })

  // ========================================
  // 5. convertActionsToTools
  // ========================================
  describe('convertActionsToTools', () => {
    it('should return correct Anthropic tool format', () => {
      const action = {
        name: 'get_weather',
        description: 'Get weather information',
        parameters: z.object({ city: z.string() }),
        handler: async () => ({ success: true }),
      }

      const tools = adapter.convertActionsToTools(new Map([['get_weather', action]]))

      expect(tools).toHaveLength(1)
      expect(tools[0]).toHaveProperty('name', 'get_weather')
      expect(tools[0]).toHaveProperty('description', 'Get weather information')
      expect(tools[0]).toHaveProperty('input_schema')
    })

    it('should not use OpenAI function wrapper format', () => {
      const action = {
        name: 'test_tool',
        description: 'Test',
        parameters: z.object({}),
        handler: async () => ({ success: true }),
      }

      const tools = adapter.convertActionsToTools(new Map([['test_tool', action]]))

      expect(tools[0]).not.toHaveProperty('type', 'function')
      expect(tools[0]).not.toHaveProperty('function')
    })

    it('should handle empty actions map', () => {
      const tools = adapter.convertActionsToTools(new Map())

      expect(tools).toEqual([])
    })

    it('should include input_schema with type object', () => {
      const action = {
        name: 'test',
        description: 'Test',
        parameters: z.object({ field: z.string() }),
        handler: async () => ({ success: true }),
      }

      const tools = adapter.convertActionsToTools(new Map([['test', action]]))

      expect(tools[0].input_schema).toBeDefined()
      expect(tools[0].input_schema).toHaveProperty('type', 'object')
    })

    it('should convert multiple actions', () => {
      const actions = new Map([
        ['action1', { name: 'action1', description: 'First', parameters: z.object({}), handler: async () => ({ success: true }) }],
        ['action2', { name: 'action2', description: 'Second', parameters: z.object({}), handler: async () => ({ success: true }) }],
      ])

      const tools = adapter.convertActionsToTools(actions)

      expect(tools).toHaveLength(2)
      expect(tools.map((t: any) => t.name)).toContain('action1')
      expect(tools.map((t: any) => t.name)).toContain('action2')
    })
  })
})
