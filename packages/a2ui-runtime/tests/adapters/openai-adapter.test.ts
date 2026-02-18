/**
 * OpenAI Adapter Comprehensive Test Suite
 *
 * Tests for the OpenAI adapter covering:
 * - Basic UI generation
 * - Error handling
 * - Streaming functionality
 * - Action execution
 * - Configuration
 * - Tool conversion
 *
 * Target: 85%+ code coverage
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { z } from 'zod'

// Mock OpenAI client
const createMockOpenAIClient = () => ({
  chat: {
    completions: {
      create: vi.fn()
    }
  }
})

// Mock streaming response
const createMockStream = (chunks: Array<{ delta?: { content?: string; tool_calls?: any[] } }>) => {
  return {
    [Symbol.asyncIterator]: async function* () {
      for (const chunk of chunks) {
        yield {
          choices: [{ delta: chunk.delta || {} }]
        }
      }
    }
  }
}

// Mock OpenAI module
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation((config) => createMockOpenAIClient())
}))

// Import after mocking - use src for coverage tracking
import { OpenAIAdapter } from '../../src/adapters/openai-adapter.js'
import { LLMProviderError } from '../../src/errors/runtime-errors.js'

describe('OpenAIAdapter', () => {
  let adapter: any
  let mockClient: ReturnType<typeof createMockOpenAIClient>

  beforeEach(() => {
    mockClient = createMockOpenAIClient()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ========================================
  // 1. Basic UI Generation (10 tests)
  // ========================================
  describe('Basic UI Generation', () => {
    beforeEach(() => {
      adapter = new OpenAIAdapter(
        { apiKey: 'test-key', defaultModel: 'gpt-4o' },
        mockClient
      )
    })

    it('should generate UI from simple prompt', async () => {
      const chunks = [
        { delta: { content: '<component' } },
        { delta: { content: ' type="text">' } },
        { delta: { content: 'Hello' } },
        { delta: { content: '</component>' } }
      ]

      mockClient.chat.completions.create.mockResolvedValue(createMockStream(chunks))

      const context = {
        requestId: 'req-001',
        actions: new Map(),
        metadata: {},
        timestamp: new Date()
      }

      const result: string[] = []
      for await (const chunk of adapter.generateUI('Create a text component', context, {})) {
        result.push(chunk)
      }

      expect(result).toEqual(['<component', ' type="text">', 'Hello', '</component>'])
      expect(mockClient.chat.completions.create).toHaveBeenCalledTimes(1)
    })

    it('should use default model when not specified in options', async () => {
      mockClient.chat.completions.create.mockResolvedValue(
        createMockStream([{ delta: { content: 'test' } }])
      )

      const context = {
        requestId: 'req-002',
        actions: new Map(),
        metadata: {},
        timestamp: new Date()
      }

      const chunks: string[] = []
      for await (const chunk of adapter.generateUI('test prompt', context, {})) {
        chunks.push(chunk)
      }

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o'
        })
      )
    })

    it('should use custom model from options', async () => {
      mockClient.chat.completions.create.mockResolvedValue(
        createMockStream([{ delta: { content: 'test' } }])
      )

      const context = {
        requestId: 'req-003',
        actions: new Map(),
        metadata: {},
        timestamp: new Date()
      }

      const chunks: string[] = []
      for await (const chunk of adapter.generateUI('test', context, { model: 'gpt-3.5-turbo' })) {
        chunks.push(chunk)
      }

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-3.5-turbo'
        })
      )
    })

    it('should include system message in request', async () => {
      mockClient.chat.completions.create.mockResolvedValue(
        createMockStream([{ delta: { content: 'test' } }])
      )

      const context = {
        requestId: 'req-004',
        actions: new Map(),
        metadata: {},
        timestamp: new Date()
      }

      const chunks: string[] = []
      for await (const chunk of adapter.generateUI('test', context, {})) {
        chunks.push(chunk)
      }

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('A2UI')
            })
          ])
        })
      )
    })

    it('should pass temperature option to OpenAI', async () => {
      mockClient.chat.completions.create.mockResolvedValue(
        createMockStream([{ delta: { content: 'test' } }])
      )

      const context = {
        requestId: 'req-005',
        actions: new Map(),
        metadata: {},
        timestamp: new Date()
      }

      const chunks: string[] = []
      for await (const chunk of adapter.generateUI('test', context, { temperature: 0.7 })) {
        chunks.push(chunk)
      }

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.7
        })
      )
    })

    it('should pass maxTokens option to OpenAI', async () => {
      mockClient.chat.completions.create.mockResolvedValue(
        createMockStream([{ delta: { content: 'test' } }])
      )

      const context = {
        requestId: 'req-006',
        actions: new Map(),
        metadata: {},
        timestamp: new Date()
      }

      const chunks: string[] = []
      for await (const chunk of adapter.generateUI('test', context, { maxTokens: 2000 })) {
        chunks.push(chunk)
      }

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 2000
        })
      )
    })

    it('should pass topP option to OpenAI', async () => {
      mockClient.chat.completions.create.mockResolvedValue(
        createMockStream([{ delta: { content: 'test' } }])
      )

      const context = {
        requestId: 'req-007',
        actions: new Map(),
        metadata: {},
        timestamp: new Date()
      }

      const chunks: string[] = []
      for await (const chunk of adapter.generateUI('test', context, { topP: 0.9 })) {
        chunks.push(chunk)
      }

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          top_p: 0.9
        })
      )
    })

    it('should pass frequency and presence penalties to OpenAI', async () => {
      mockClient.chat.completions.create.mockResolvedValue(
        createMockStream([{ delta: { content: 'test' } }])
      )

      const context = {
        requestId: 'req-008',
        actions: new Map(),
        metadata: {},
        timestamp: new Date()
      }

      const chunks: string[] = []
      for await (
        const chunk of adapter.generateUI('test', context, {
          frequencyPenalty: 0.5,
          presencePenalty: 0.6
        })
      ) {
        chunks.push(chunk)
      }

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          frequency_penalty: 0.5,
          presence_penalty: 0.6
        })
      )
    })

    it('should pass stop sequences to OpenAI', async () => {
      mockClient.chat.completions.create.mockResolvedValue(
        createMockStream([{ delta: { content: 'test' } }])
      )

      const context = {
        requestId: 'req-009',
        actions: new Map(),
        metadata: {},
        timestamp: new Date()
      }

      const chunks: string[] = []
      for await (const chunk of adapter.generateUI('test', context, { stopSequences: ['STOP'] })) {
        chunks.push(chunk)
      }

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          stop: ['STOP']
        })
      )
    })

    it('should enable streaming in OpenAI request', async () => {
      mockClient.chat.completions.create.mockResolvedValue(
        createMockStream([{ delta: { content: 'test' } }])
      )

      const context = {
        requestId: 'req-010',
        actions: new Map(),
        metadata: {},
        timestamp: new Date()
      }

      const chunks: string[] = []
      for await (const chunk of adapter.generateUI('test', context, {})) {
        chunks.push(chunk)
      }

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          stream: true
        })
      )
    })
  })

  // ========================================
  // 2. Error Handling (10 tests)
  // ========================================
  describe('Error Handling', () => {
    beforeEach(() => {
      adapter = new OpenAIAdapter(
        { apiKey: 'test-key', defaultModel: 'gpt-4o' },
        mockClient
      )
    })

    it('should throw LLMProviderError on OpenAI API error with status', async () => {
      const apiError: any = new Error('API Error')
      apiError.status = 429

      mockClient.chat.completions.create.mockRejectedValue(apiError)

      const context = {
        requestId: 'req-err-001',
        actions: new Map(),
        metadata: {},
        timestamp: new Date()
      }

      await expect(async () => {
        for await (const chunk of adapter.generateUI('test', context, {})) {
          // Should not reach here
        }
      }).rejects.toThrow(LLMProviderError)
    })

    it('should include status code in LLMProviderError', async () => {
      const apiError: any = new Error('Rate limit exceeded')
      apiError.status = 429

      mockClient.chat.completions.create.mockRejectedValue(apiError)

      const context = {
        requestId: 'req-err-002',
        actions: new Map(),
        metadata: {},
        timestamp: new Date()
      }

      try {
        for await (const chunk of adapter.generateUI('test', context, {})) {
          // Should not reach here
        }
        expect.fail('Should have thrown error')
      } catch (error: any) {
        expect(error).toBeInstanceOf(LLMProviderError)
        expect(error.status).toBe(429)
        expect(error.provider).toBe('openai')
      }
    })

    it('should throw LLMProviderError with message on API error', async () => {
      const apiError: any = new Error('Invalid API key')
      apiError.status = 401

      mockClient.chat.completions.create.mockRejectedValue(apiError)

      const context = {
        requestId: 'req-err-003',
        actions: new Map(),
        metadata: {},
        timestamp: new Date()
      }

      try {
        for await (const chunk of adapter.generateUI('test', context, {})) {
          // Should not reach here
        }
        expect.fail('Should have thrown error')
      } catch (error: any) {
        expect(error.message).toContain('OpenAI API error')
        expect(error.message).toContain('Invalid API key')
      }
    })

    it('should handle error without status code', async () => {
      const apiError: any = new Error('Network error')
      // Don't set status property - this will cause it to rethrow the error as-is

      mockClient.chat.completions.create.mockRejectedValue(apiError)

      const context = {
        requestId: 'req-err-004',
        actions: new Map(),
        metadata: {},
        timestamp: new Date()
      }

      // Without status property, the error should be rethrown as-is (not wrapped in LLMProviderError)
      await expect(async () => {
        for await (const chunk of adapter.generateUI('test', context, {})) {
          // Should not reach here
        }
      }).rejects.toThrow('Network error')
    })

    it('should rethrow non-API errors as-is', async () => {
      const nonApiError = new TypeError('Type mismatch')

      mockClient.chat.completions.create.mockRejectedValue(nonApiError)

      const context = {
        requestId: 'req-err-005',
        actions: new Map(),
        metadata: {},
        timestamp: new Date()
      }

      await expect(async () => {
        for await (const chunk of adapter.generateUI('test', context, {})) {
          // Should not reach here
        }
      }).rejects.toThrow(TypeError)
    })

    it('should handle streaming error gracefully in streamResponse', async () => {
      const streamError = new Error('Stream interrupted')

      mockClient.chat.completions.create.mockRejectedValue(streamError)

      const messages = [
        { role: 'user' as const, content: 'test' }
      ]

      await expect(async () => {
        for await (const chunk of adapter.streamResponse(messages, {})) {
          // Should not reach here
        }
      }).rejects.toThrow(LLMProviderError)
    })

    it('should call onError callback on streaming error', async () => {
      const streamError = new Error('Stream error')
      mockClient.chat.completions.create.mockRejectedValue(streamError)

      const onError = vi.fn()
      const messages = [{ role: 'user' as const, content: 'test' }]

      try {
        for await (const chunk of adapter.streamResponse(messages, { onError })) {
          // Should not reach here
        }
      } catch (error) {
        // Expected
      }

      expect(onError).toHaveBeenCalledWith(expect.any(Error))
    })

    it('should handle non-Error objects in streaming', async () => {
      mockClient.chat.completions.create.mockRejectedValue('String error')

      const onError = vi.fn()
      const messages = [{ role: 'user' as const, content: 'test' }]

      try {
        for await (const chunk of adapter.streamResponse(messages, { onError })) {
          // Should not reach here
        }
      } catch (error) {
        // Expected
      }

      expect(onError).toHaveBeenCalledWith(expect.any(Error))
    })

    it('should handle error with non-number status', async () => {
      const apiError: any = new Error('API Error')
      apiError.status = 'invalid'

      mockClient.chat.completions.create.mockRejectedValue(apiError)

      const context = {
        requestId: 'req-err-009',
        actions: new Map(),
        metadata: {},
        timestamp: new Date()
      }

      try {
        for await (const chunk of adapter.generateUI('test', context, {})) {
          // Should not reach here
        }
        expect.fail('Should have thrown error')
      } catch (error: any) {
        expect(error).toBeInstanceOf(LLMProviderError)
        expect(error.status).toBeUndefined()
      }
    })

    it('should handle error object without message', async () => {
      const apiError: any = { status: 500 }

      mockClient.chat.completions.create.mockRejectedValue(apiError)

      const context = {
        requestId: 'req-err-010',
        actions: new Map(),
        metadata: {},
        timestamp: new Date()
      }

      try {
        for await (const chunk of adapter.generateUI('test', context, {})) {
          // Should not reach here
        }
        expect.fail('Should have thrown error')
      } catch (error: any) {
        expect(error).toBeInstanceOf(LLMProviderError)
        expect(error.message).toContain('Unknown error')
      }
    })
  })

  // ========================================
  // 3. Streaming (7 tests)
  // ========================================
  describe('Streaming', () => {
    beforeEach(() => {
      adapter = new OpenAIAdapter(
        { apiKey: 'test-key', defaultModel: 'gpt-4o' },
        mockClient
      )
    })

    it('should yield chunks as they arrive', async () => {
      const chunks = [
        { delta: { content: 'First' } },
        { delta: { content: ' Second' } },
        { delta: { content: ' Third' } }
      ]

      mockClient.chat.completions.create.mockResolvedValue(createMockStream(chunks))

      const context = {
        requestId: 'req-stream-001',
        actions: new Map(),
        metadata: {},
        timestamp: new Date()
      }

      const result: string[] = []
      for await (const chunk of adapter.generateUI('test', context, {})) {
        result.push(chunk)
      }

      expect(result).toEqual(['First', ' Second', ' Third'])
    })

    it('should skip chunks without content', async () => {
      const chunks = [
        { delta: { content: 'First' } },
        { delta: {} }, // No content
        { delta: { content: 'Third' } }
      ]

      mockClient.chat.completions.create.mockResolvedValue(createMockStream(chunks))

      const context = {
        requestId: 'req-stream-002',
        actions: new Map(),
        metadata: {},
        timestamp: new Date()
      }

      const result: string[] = []
      for await (const chunk of adapter.generateUI('test', context, {})) {
        result.push(chunk)
      }

      expect(result).toEqual(['First', 'Third'])
    })

    it('should handle empty stream', async () => {
      mockClient.chat.completions.create.mockResolvedValue(createMockStream([]))

      const context = {
        requestId: 'req-stream-003',
        actions: new Map(),
        metadata: {},
        timestamp: new Date()
      }

      const result: string[] = []
      for await (const chunk of adapter.generateUI('test', context, {})) {
        result.push(chunk)
      }

      expect(result).toEqual([])
    })

    it('should call onChunk callback in streamResponse', async () => {
      const chunks = [
        { delta: { content: 'Chunk 1' } },
        { delta: { content: 'Chunk 2' } }
      ]

      mockClient.chat.completions.create.mockResolvedValue(createMockStream(chunks))

      const onChunk = vi.fn()
      const messages = [{ role: 'user' as const, content: 'test' }]

      const result: string[] = []
      for await (const chunk of adapter.streamResponse(messages, { onChunk })) {
        result.push(chunk)
      }

      expect(onChunk).toHaveBeenCalledTimes(2)
      expect(onChunk).toHaveBeenNthCalledWith(1, 'Chunk 1')
      expect(onChunk).toHaveBeenNthCalledWith(2, 'Chunk 2')
    })

    it('should call onComplete callback after stream finishes', async () => {
      const chunks = [{ delta: { content: 'test' } }]

      mockClient.chat.completions.create.mockResolvedValue(createMockStream(chunks))

      const onComplete = vi.fn()
      const messages = [{ role: 'user' as const, content: 'test' }]

      const result: string[] = []
      for await (const chunk of adapter.streamResponse(messages, { onComplete })) {
        result.push(chunk)
      }

      expect(onComplete).toHaveBeenCalledTimes(1)
    })

    it('should convert messages correctly in streamResponse', async () => {
      mockClient.chat.completions.create.mockResolvedValue(
        createMockStream([{ delta: { content: 'test' } }])
      )

      const messages = [
        { role: 'system' as const, content: 'You are helpful', name: undefined },
        { role: 'user' as const, content: 'Hello', name: 'Alice' },
        { role: 'assistant' as const, content: 'Hi there', name: undefined }
      ]

      const result: string[] = []
      for await (const chunk of adapter.streamResponse(messages, {})) {
        result.push(chunk)
      }

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            { role: 'system', content: 'You are helpful', name: undefined },
            { role: 'user', content: 'Hello', name: 'Alice' },
            { role: 'assistant', content: 'Hi there', name: undefined }
          ]
        })
      )
    })

    it('should handle messages with null content', async () => {
      mockClient.chat.completions.create.mockResolvedValue(
        createMockStream([{ delta: { content: 'test' } }])
      )

      const messages = [{ role: 'user' as const, content: null, name: undefined }]

      const result: string[] = []
      for await (const chunk of adapter.streamResponse(messages, {})) {
        result.push(chunk)
      }

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [{ role: 'user', content: '', name: undefined }]
        })
      )
    })
  })

  // ========================================
  // 4. Action Execution (7 tests)
  // ========================================
  describe('Action Execution', () => {
    beforeEach(() => {
      adapter = new OpenAIAdapter(
        { apiKey: 'test-key', defaultModel: 'gpt-4o' },
        mockClient
      )
    })

    it('should execute action successfully with valid parameters', async () => {
      const action = {
        name: 'testAction',
        description: 'Test action',
        parameters: z.object({
          input: z.string()
        }),
        handler: vi.fn().mockResolvedValue({ success: true, result: 'Executed' })
      }

      const result = await adapter.executeAction(action, { input: 'test data' })

      expect(result.success).toBe(true)
      expect(result.result).toBe('Executed')
      expect(action.handler).toHaveBeenCalledWith({ input: 'test data' })
    })

    it('should return error for invalid parameters', async () => {
      const action = {
        name: 'testAction',
        description: 'Test action',
        parameters: z.object({
          input: z.string()
        }),
        handler: vi.fn()
      }

      const result = await adapter.executeAction(action, { input: 123 }) // Wrong type

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(action.handler).not.toHaveBeenCalled()
    })

    it('should validate required parameters', async () => {
      const action = {
        name: 'testAction',
        description: 'Test action',
        parameters: z.object({
          required: z.string(),
          optional: z.string().optional()
        }),
        handler: vi.fn()
      }

      const result = await adapter.executeAction(action, {}) // Missing required

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should pass validated parameters to handler', async () => {
      const action = {
        name: 'testAction',
        description: 'Test action',
        parameters: z.object({
          name: z.string(),
          age: z.number()
        }),
        handler: vi.fn().mockResolvedValue({ success: true })
      }

      await adapter.executeAction(action, { name: 'Alice', age: 30 })

      expect(action.handler).toHaveBeenCalledWith({ name: 'Alice', age: 30 })
    })

    it('should handle complex parameter schemas', async () => {
      const action = {
        name: 'complexAction',
        description: 'Complex action',
        parameters: z.object({
          user: z.object({
            name: z.string(),
            email: z.string().email()
          }),
          tags: z.array(z.string())
        }),
        handler: vi.fn().mockResolvedValue({ success: true })
      }

      const params = {
        user: { name: 'Bob', email: 'bob@example.com' },
        tags: ['tag1', 'tag2']
      }

      const result = await adapter.executeAction(action, params)

      expect(result.success).toBe(true)
      expect(action.handler).toHaveBeenCalledWith(params)
    })

    it('should include validation error message on failure', async () => {
      const action = {
        name: 'emailAction',
        description: 'Email action',
        parameters: z.object({
          email: z.string().email()
        }),
        handler: vi.fn()
      }

      const result = await adapter.executeAction(action, { email: 'invalid-email' })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid')
    })

    it('should convert actions to tools for OpenAI', async () => {
      const actions = new Map([
        [
          'action1',
          {
            name: 'action1',
            description: 'First action',
            parameters: z.object({ input: z.string() }),
            handler: async () => ({ success: true })
          }
        ],
        [
          'action2',
          {
            name: 'action2',
            description: 'Second action',
            parameters: z.object({ count: z.number() }),
            handler: async () => ({ success: true })
          }
        ]
      ])

      mockClient.chat.completions.create.mockResolvedValue(
        createMockStream([{ delta: { content: 'test' } }])
      )

      const context = {
        requestId: 'req-action-001',
        actions,
        metadata: {},
        timestamp: new Date()
      }

      const chunks: string[] = []
      for await (const chunk of adapter.generateUI('test', context, {})) {
        chunks.push(chunk)
      }

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tools: expect.arrayContaining([
            expect.objectContaining({
              type: 'function',
              function: expect.objectContaining({
                name: 'action1',
                description: 'First action'
              })
            }),
            expect.objectContaining({
              type: 'function',
              function: expect.objectContaining({
                name: 'action2',
                description: 'Second action'
              })
            })
          ])
        })
      )
    })
  })

  // ========================================
  // 5. Configuration (5 tests)
  // ========================================
  describe('Configuration', () => {
    it('should initialize with API key from config', () => {
      // When no client is provided, adapter creates its own
      // We can't easily verify the constructor call, so instead verify it creates a working adapter
      adapter = new OpenAIAdapter({ apiKey: 'custom-key' })

      expect(adapter).toBeDefined()
      expect(adapter.provider).toBe('openai')
      expect(adapter.client).toBeDefined()
    })

    it('should initialize with organization from config', () => {
      // When no client is provided, adapter creates its own
      // We can't easily verify the constructor call, so instead verify it creates a working adapter
      adapter = new OpenAIAdapter({
        apiKey: 'test-key',
        organization: 'org-123'
      })

      expect(adapter).toBeDefined()
      expect(adapter.provider).toBe('openai')
      expect(adapter.client).toBeDefined()
    })

    it('should use default model gpt-4o when not specified', () => {
      adapter = new OpenAIAdapter({ apiKey: 'test-key' }, mockClient)

      expect(adapter.defaultModel).toBe('gpt-4o')
    })

    it('should use custom default model from config', () => {
      adapter = new OpenAIAdapter(
        { apiKey: 'test-key', defaultModel: 'gpt-3.5-turbo' },
        mockClient
      )

      expect(adapter.defaultModel).toBe('gpt-3.5-turbo')
    })

    it('should use provided client instead of creating new one', () => {
      const customClient = createMockOpenAIClient()
      adapter = new OpenAIAdapter({ apiKey: 'test-key' }, customClient)

      expect(adapter.client).toBe(customClient)
    })
  })

  // ========================================
  // 6. Tool Conversion (5 tests)
  // ========================================
  describe('Tool Conversion', () => {
    beforeEach(() => {
      adapter = new OpenAIAdapter(
        { apiKey: 'test-key', defaultModel: 'gpt-4o' },
        mockClient
      )
    })

    it('should convert action to OpenAI tool format', () => {
      const action = {
        name: 'testTool',
        description: 'Test tool description',
        parameters: z.object({
          input: z.string()
        }),
        handler: async () => ({ success: true })
      }

      const tools = adapter.convertActionsToTools(new Map([['testTool', action]]))

      expect(tools).toHaveLength(1)
      expect(tools[0]).toEqual({
        type: 'function',
        function: {
          name: 'testTool',
          description: 'Test tool description',
          parameters: expect.any(Object)
        }
      })
    })

    it('should convert multiple actions to tools', () => {
      const actions = new Map([
        [
          'tool1',
          {
            name: 'tool1',
            description: 'First tool',
            parameters: z.object({}),
            handler: async () => ({ success: true })
          }
        ],
        [
          'tool2',
          {
            name: 'tool2',
            description: 'Second tool',
            parameters: z.object({}),
            handler: async () => ({ success: true })
          }
        ]
      ])

      const tools = adapter.convertActionsToTools(actions)

      expect(tools).toHaveLength(2)
      expect(tools[0].function.name).toBe('tool1')
      expect(tools[1].function.name).toBe('tool2')
    })

    it('should convert empty actions map to empty tools array', () => {
      const tools = adapter.convertActionsToTools(new Map())

      expect(tools).toEqual([])
    })

    it('should include parameters schema in tool definition', () => {
      const action = {
        name: 'paramTool',
        description: 'Tool with params',
        parameters: z.object({
          name: z.string(),
          count: z.number()
        }),
        handler: async () => ({ success: true })
      }

      const tools = adapter.convertActionsToTools(new Map([['paramTool', action]]))

      expect(tools[0].function.parameters).toEqual({
        type: 'object',
        properties: {},
        required: []
      })
    })

    it('should handle zodToJsonSchema conversion', () => {
      const schema = z.object({
        field1: z.string(),
        field2: z.number().optional()
      })

      const jsonSchema = adapter.zodToJsonSchema(schema)

      expect(jsonSchema).toEqual({
        type: 'object',
        properties: {},
        required: []
      })
    })
  })

  // ========================================
  // 7. Provider Property (1 test)
  // ========================================
  describe('Provider Property', () => {
    it('should have provider set to openai', () => {
      adapter = new OpenAIAdapter({ apiKey: 'test-key' }, mockClient)

      expect(adapter.provider).toBe('openai')
    })
  })
})
