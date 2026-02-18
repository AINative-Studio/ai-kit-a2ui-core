/**
 * Anthropic Adapter Tests
 *
 * Comprehensive test suite for Anthropic LLM adapter
 * Target: 85%+ code coverage, 40+ tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AnthropicAdapter, type AnthropicConfig } from '../../src/adapters/anthropic-adapter'
import { LLMProviderError } from '../../src/errors/runtime-errors'
import type { RuntimeContext, GenerationOptions, StreamOptions, ChatMessage } from '../../src/types/runtime-types'
import { ActionRegistry } from '../../src/actions/action-registry'
import { z } from 'zod'

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn(),
      },
    })),
  }
})

describe('AnthropicAdapter', () => {
  let adapter: AnthropicAdapter
  let mockClient: any
  let context: RuntimeContext
  let config: AnthropicConfig

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()

    config = {
      apiKey: 'sk-test-key',
      defaultModel: 'claude-3-5-sonnet-20241022',
    }

    // Create mock Anthropic client
    mockClient = {
      messages: {
        create: vi.fn(),
      },
    }

    // Create adapter with mocked client
    adapter = new AnthropicAdapter(config, mockClient)

    // Setup runtime context
    context = {
      requestId: 'test-request-123',
      timestamp: new Date(),
      actions: new Map(),
      metadata: {},
    }
  })

  describe('Constructor and Initialization', () => {
    it('should create adapter with provided client', () => {
      expect(adapter).toBeInstanceOf(AnthropicAdapter)
      expect(adapter.provider).toBe('anthropic')
    })

    it('should use default model if not specified', () => {
      const adapterWithDefaults = new AnthropicAdapter(
        { apiKey: 'test-key' },
        mockClient
      )
      expect(adapterWithDefaults).toBeDefined()
    })

    it('should use custom default model when specified', () => {
      const customAdapter = new AnthropicAdapter(
        { apiKey: 'test-key', defaultModel: 'claude-4' },
        mockClient
      )
      expect(customAdapter).toBeDefined()
    })

    it('should have correct provider identifier', () => {
      expect(adapter.provider).toBe('anthropic')
    })
  })

  describe('Basic UI Generation', () => {
    it('should generate UI from simple prompt', async () => {
      const mockStream = createMockStream([
        { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hello' } },
        { type: 'content_block_delta', delta: { type: 'text_delta', text: ' World' } },
      ])

      mockClient.messages.create.mockResolvedValue(mockStream)

      const chunks: string[] = []
      for await (const chunk of adapter.generateUI('Test prompt', context)) {
        chunks.push(chunk)
      }

      expect(chunks).toEqual(['Hello', ' World'])
      expect(mockClient.messages.create).toHaveBeenCalledTimes(1)
    })

    it('should pass prompt to Anthropic API', async () => {
      const mockStream = createMockStream([])
      mockClient.messages.create.mockResolvedValue(mockStream)

      const generator = adapter.generateUI('Create a button', context)
      // Consume the generator
      for await (const _ of generator) {
        // Just consume
      }

      const createCall = mockClient.messages.create.mock.calls[0][0]
      expect(createCall.messages[0].content).toBe('Create a button')
    })

    it('should use default model when no options provided', async () => {
      const mockStream = createMockStream([])
      mockClient.messages.create.mockResolvedValue(mockStream)

      const generator = adapter.generateUI('Test', context)
      for await (const _ of generator) {
        // Consume
      }

      const createCall = mockClient.messages.create.mock.calls[0][0]
      expect(createCall.model).toBe('claude-3-5-sonnet-20241022')
    })

    it('should use custom model from options', async () => {
      const mockStream = createMockStream([])
      mockClient.messages.create.mockResolvedValue(mockStream)

      const options: GenerationOptions = { model: 'claude-4' }
      const generator = adapter.generateUI('Test', context, options)
      for await (const _ of generator) {
        // Consume
      }

      const createCall = mockClient.messages.create.mock.calls[0][0]
      expect(createCall.model).toBe('claude-4')
    })

    it('should handle temperature option', async () => {
      const mockStream = createMockStream([])
      mockClient.messages.create.mockResolvedValue(mockStream)

      const options: GenerationOptions = { temperature: 0.7 }
      const generator = adapter.generateUI('Test', context, options)
      for await (const _ of generator) {
        // Consume
      }

      const createCall = mockClient.messages.create.mock.calls[0][0]
      expect(createCall.temperature).toBe(0.7)
    })

    it('should handle maxTokens option', async () => {
      const mockStream = createMockStream([])
      mockClient.messages.create.mockResolvedValue(mockStream)

      const options: GenerationOptions = { maxTokens: 2048 }
      const generator = adapter.generateUI('Test', context, options)
      for await (const _ of generator) {
        // Consume
      }

      const createCall = mockClient.messages.create.mock.calls[0][0]
      expect(createCall.max_tokens).toBe(2048)
    })

    it('should use default max_tokens of 4096', async () => {
      const mockStream = createMockStream([])
      mockClient.messages.create.mockResolvedValue(mockStream)

      const generator = adapter.generateUI('Test', context)
      for await (const _ of generator) {
        // Consume
      }

      const createCall = mockClient.messages.create.mock.calls[0][0]
      expect(createCall.max_tokens).toBe(4096)
    })

    it('should handle topP option', async () => {
      const mockStream = createMockStream([])
      mockClient.messages.create.mockResolvedValue(mockStream)

      const options: GenerationOptions = { topP: 0.9 }
      const generator = adapter.generateUI('Test', context, options)
      for await (const _ of generator) {
        // Consume
      }

      const createCall = mockClient.messages.create.mock.calls[0][0]
      expect(createCall.top_p).toBe(0.9)
    })

    it('should handle stop sequences', async () => {
      const mockStream = createMockStream([])
      mockClient.messages.create.mockResolvedValue(mockStream)

      const options: GenerationOptions = { stopSequences: ['STOP', 'END'] }
      const generator = adapter.generateUI('Test', context, options)
      for await (const _ of generator) {
        // Consume
      }

      const createCall = mockClient.messages.create.mock.calls[0][0]
      expect(createCall.stop_sequences).toEqual(['STOP', 'END'])
    })

    it('should enable streaming', async () => {
      const mockStream = createMockStream([])
      mockClient.messages.create.mockResolvedValue(mockStream)

      const generator = adapter.generateUI('Test', context)
      for await (const _ of generator) {
        // Consume
      }

      const createCall = mockClient.messages.create.mock.calls[0][0]
      expect(createCall.stream).toBe(true)
    })

    it('should handle empty stream', async () => {
      const mockStream = createMockStream([])
      mockClient.messages.create.mockResolvedValue(mockStream)

      const chunks: string[] = []
      for await (const chunk of adapter.generateUI('Test', context)) {
        chunks.push(chunk)
      }

      expect(chunks).toEqual([])
    })

    it('should filter non-text-delta events', async () => {
      const mockStream = createMockStream([
        { type: 'message_start', message: {} },
        { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hello' } },
        { type: 'content_block_stop', index: 0 },
        { type: 'message_stop' },
      ])

      mockClient.messages.create.mockResolvedValue(mockStream)

      const chunks: string[] = []
      for await (const chunk of adapter.generateUI('Test', context)) {
        chunks.push(chunk)
      }

      expect(chunks).toEqual(['Hello'])
    })
  })

  describe('Error Handling', () => {
    it('should throw LLMProviderError on API error with status', async () => {
      const apiError = new Error('Rate limit exceeded')
      Object.assign(apiError, { status: 429 })

      mockClient.messages.create.mockRejectedValue(apiError)

      await expect(async () => {
        const generator = adapter.generateUI('Test', context)
        for await (const _ of generator) {
          // Consume
        }
      }).rejects.toThrow(LLMProviderError)
    })

    it('should include provider name in error', async () => {
      const apiError = new Error('Authentication failed')
      Object.assign(apiError, { status: 401 })

      mockClient.messages.create.mockRejectedValue(apiError)

      try {
        const generator = adapter.generateUI('Test', context)
        for await (const _ of generator) {
          // Consume
        }
      } catch (error) {
        expect(error).toBeInstanceOf(LLMProviderError)
        expect((error as LLMProviderError).provider).toBe('anthropic')
      }
    })

    it('should include status code in error', async () => {
      const apiError = new Error('Server error')
      Object.assign(apiError, { status: 500 })

      mockClient.messages.create.mockRejectedValue(apiError)

      try {
        const generator = adapter.generateUI('Test', context)
        for await (const _ of generator) {
          // Consume
        }
      } catch (error) {
        expect(error).toBeInstanceOf(LLMProviderError)
        expect((error as LLMProviderError).status).toBe(500)
      }
    })

    it('should re-throw non-API errors', async () => {
      const networkError = new Error('Network timeout')
      mockClient.messages.create.mockRejectedValue(networkError)

      await expect(async () => {
        const generator = adapter.generateUI('Test', context)
        for await (const _ of generator) {
          // Consume
        }
      }).rejects.toThrow('Network timeout')
    })

    it('should handle undefined error object', async () => {
      mockClient.messages.create.mockRejectedValue(undefined)

      await expect(async () => {
        const generator = adapter.generateUI('Test', context)
        for await (const _ of generator) {
          // Consume
        }
      }).rejects.toBeUndefined()
    })

    it('should handle error without status property', async () => {
      const simpleError = new Error('Something went wrong')
      mockClient.messages.create.mockRejectedValue(simpleError)

      await expect(async () => {
        const generator = adapter.generateUI('Test', context)
        for await (const _ of generator) {
          // Consume
        }
      }).rejects.toThrow('Something went wrong')
    })

    it('should handle malformed error objects', async () => {
      const malformedError = { weird: 'structure' }
      mockClient.messages.create.mockRejectedValue(malformedError)

      await expect(async () => {
        const generator = adapter.generateUI('Test', context)
        for await (const _ of generator) {
          // Consume
        }
      }).rejects.toBeDefined()
    })

    it('should wrap API error message', async () => {
      const apiError = new Error('Invalid request')
      Object.assign(apiError, { status: 400 })

      mockClient.messages.create.mockRejectedValue(apiError)

      try {
        const generator = adapter.generateUI('Test', context)
        for await (const _ of generator) {
          // Consume
        }
      } catch (error) {
        expect((error as Error).message).toContain('Anthropic API error')
        expect((error as Error).message).toContain('Invalid request')
      }
    })
  })

  describe('Streaming Response', () => {
    it('should stream chat messages', async () => {
      const mockStream = createMockStream([
        { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Response' } },
      ])

      mockClient.messages.create.mockResolvedValue(mockStream)

      const messages: ChatMessage[] = [
        { role: 'user', content: 'Hello' },
      ]

      const chunks: string[] = []
      for await (const chunk of adapter.streamResponse(messages)) {
        chunks.push(chunk)
      }

      expect(chunks).toEqual(['Response'])
    })

    it('should call onChunk callback', async () => {
      const mockStream = createMockStream([
        { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hello' } },
        { type: 'content_block_delta', delta: { type: 'text_delta', text: ' World' } },
      ])

      mockClient.messages.create.mockResolvedValue(mockStream)

      const onChunk = vi.fn()
      const options: StreamOptions = { onChunk }

      const messages: ChatMessage[] = [{ role: 'user', content: 'Test' }]

      for await (const _ of adapter.streamResponse(messages, options)) {
        // Consume
      }

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
      const options: StreamOptions = { onComplete }

      const messages: ChatMessage[] = [{ role: 'user', content: 'Test' }]

      for await (const _ of adapter.streamResponse(messages, options)) {
        // Consume
      }

      expect(onComplete).toHaveBeenCalledTimes(1)
    })

    it('should call onError callback on failure', async () => {
      const apiError = new Error('Stream failed')
      mockClient.messages.create.mockRejectedValue(apiError)

      const onError = vi.fn()
      const options: StreamOptions = { onError }

      const messages: ChatMessage[] = [{ role: 'user', content: 'Test' }]

      try {
        for await (const _ of adapter.streamResponse(messages, options)) {
          // Consume
        }
      } catch {
        // Expected
      }

      expect(onError).toHaveBeenCalledWith(apiError)
    })

    it('should filter out system messages', async () => {
      const mockStream = createMockStream([])
      mockClient.messages.create.mockResolvedValue(mockStream)

      const messages: ChatMessage[] = [
        { role: 'system', content: 'System message' },
        { role: 'user', content: 'User message' },
        { role: 'assistant', content: 'Assistant message' },
      ]

      for await (const _ of adapter.streamResponse(messages)) {
        // Consume
      }

      const createCall = mockClient.messages.create.mock.calls[0][0]
      expect(createCall.messages).toHaveLength(2)
      expect(createCall.messages[0].role).toBe('user')
      expect(createCall.messages[1].role).toBe('assistant')
    })

    it('should handle null content in messages', async () => {
      const mockStream = createMockStream([])
      mockClient.messages.create.mockResolvedValue(mockStream)

      const messages: ChatMessage[] = [
        { role: 'user', content: null },
      ]

      for await (const _ of adapter.streamResponse(messages)) {
        // Consume
      }

      const createCall = mockClient.messages.create.mock.calls[0][0]
      expect(createCall.messages[0].content).toBe('')
    })

    it('should throw LLMProviderError on stream failure', async () => {
      const streamError = new Error('Connection lost')
      mockClient.messages.create.mockRejectedValue(streamError)

      const messages: ChatMessage[] = [{ role: 'user', content: 'Test' }]

      await expect(async () => {
        for await (const _ of adapter.streamResponse(messages)) {
          // Consume
        }
      }).rejects.toThrow(LLMProviderError)
    })

    it('should include error message in LLMProviderError', async () => {
      const streamError = new Error('Timeout')
      mockClient.messages.create.mockRejectedValue(streamError)

      const messages: ChatMessage[] = [{ role: 'user', content: 'Test' }]

      try {
        for await (const _ of adapter.streamResponse(messages)) {
          // Consume
        }
      } catch (error) {
        expect((error as Error).message).toContain('Anthropic streaming error')
        expect((error as Error).message).toContain('Timeout')
      }
    })
  })

  describe('Action Execution', () => {
    it('should execute action with valid parameters', async () => {
      const action = {
        name: 'test_action',
        description: 'Test action',
        parameters: z.object({ value: z.string() }),
        handler: vi.fn().mockResolvedValue({ success: true, data: 'result' }),
      }

      const params = { value: 'test' }
      const result = await adapter.executeAction(action, params)

      expect(result.success).toBe(true)
      expect(result.data).toBe('result')
      expect(action.handler).toHaveBeenCalledWith(params)
    })

    it('should validate action parameters', async () => {
      const action = {
        name: 'test_action',
        description: 'Test action',
        parameters: z.object({ value: z.string() }),
        handler: vi.fn().mockResolvedValue({ success: true }),
      }

      const invalidParams = { value: 123 } // Should be string
      const result = await adapter.executeAction(action, invalidParams)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(action.handler).not.toHaveBeenCalled()
    })

    it('should return error for invalid parameters', async () => {
      const action = {
        name: 'test_action',
        description: 'Test action',
        parameters: z.object({
          required: z.string(),
          optional: z.number().optional()
        }),
        handler: vi.fn(),
      }

      const result = await adapter.executeAction(action, {})

      expect(result.success).toBe(false)
      expect(result.error).toContain('required')
    })

    it('should handle action handler returning success', async () => {
      const action = {
        name: 'success_action',
        description: 'Always succeeds',
        parameters: z.object({}),
        handler: vi.fn().mockResolvedValue({ success: true, data: { value: 42 } }),
      }

      const result = await adapter.executeAction(action, {})

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ value: 42 })
    })

    it('should handle action handler returning error', async () => {
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

    it('should pass validated parameters to handler', async () => {
      const action = {
        name: 'complex_action',
        description: 'Complex parameters',
        parameters: z.object({
          name: z.string(),
          count: z.number(),
          enabled: z.boolean().optional(),
        }),
        handler: vi.fn().mockResolvedValue({ success: true }),
      }

      const params = { name: 'test', count: 5, enabled: true }
      await adapter.executeAction(action, params)

      expect(action.handler).toHaveBeenCalledWith(params)
    })
  })

  describe('Configuration', () => {
    it('should use custom model in streamResponse', async () => {
      const mockStream = createMockStream([])
      mockClient.messages.create.mockResolvedValue(mockStream)

      const messages: ChatMessage[] = [{ role: 'user', content: 'Test' }]
      const options: StreamOptions = { model: 'claude-4-opus' }

      for await (const _ of adapter.streamResponse(messages, options)) {
        // Consume
      }

      const createCall = mockClient.messages.create.mock.calls[0][0]
      expect(createCall.model).toBe('claude-4-opus')
    })

    it('should use default model in streamResponse when not specified', async () => {
      const mockStream = createMockStream([])
      mockClient.messages.create.mockResolvedValue(mockStream)

      const messages: ChatMessage[] = [{ role: 'user', content: 'Test' }]

      for await (const _ of adapter.streamResponse(messages)) {
        // Consume
      }

      const createCall = mockClient.messages.create.mock.calls[0][0]
      expect(createCall.model).toBe('claude-3-5-sonnet-20241022')
    })

    it('should set max_tokens to 4096 in streamResponse', async () => {
      const mockStream = createMockStream([])
      mockClient.messages.create.mockResolvedValue(mockStream)

      const messages: ChatMessage[] = [{ role: 'user', content: 'Test' }]

      for await (const _ of adapter.streamResponse(messages)) {
        // Consume
      }

      const createCall = mockClient.messages.create.mock.calls[0][0]
      expect(createCall.max_tokens).toBe(4096)
    })
  })

  describe('Tools Conversion', () => {
    it('should convert actions to Anthropic tool format', () => {
      const registry = new ActionRegistry()

      registry.register({
        name: 'get_weather',
        description: 'Get weather information',
        parameters: z.object({ city: z.string() }),
        handler: async () => ({ success: true }),
      })

      const tools = adapter.convertActionsToTools(registry.getAll())

      expect(tools).toHaveLength(1)
      expect(tools[0]).toHaveProperty('name', 'get_weather')
      expect(tools[0]).toHaveProperty('description', 'Get weather information')
      expect(tools[0]).toHaveProperty('input_schema')
    })

    it('should convert multiple actions', () => {
      const registry = new ActionRegistry()

      registry.register({
        name: 'action1',
        description: 'First action',
        parameters: z.object({}),
        handler: async () => ({ success: true }),
      })

      registry.register({
        name: 'action2',
        description: 'Second action',
        parameters: z.object({}),
        handler: async () => ({ success: true }),
      })

      const tools = adapter.convertActionsToTools(registry.getAll())

      expect(tools).toHaveLength(2)
      expect(tools.map((t: any) => t.name)).toContain('action1')
      expect(tools.map((t: any) => t.name)).toContain('action2')
    })

    it('should handle empty actions map', () => {
      const tools = adapter.convertActionsToTools(new Map())

      expect(tools).toEqual([])
    })

    it('should include input_schema for each tool', () => {
      const registry = new ActionRegistry()

      registry.register({
        name: 'test',
        description: 'Test',
        parameters: z.object({ test: z.string() }),
        handler: async () => ({ success: true }),
      })

      const tools = adapter.convertActionsToTools(registry.getAll())

      expect(tools[0]).toHaveProperty('input_schema')
      expect(tools[0].input_schema).toHaveProperty('type', 'object')
    })
  })
})

/**
 * Helper function to create a mock async iterable stream
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
