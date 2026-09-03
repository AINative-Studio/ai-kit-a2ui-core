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
  // 1. Constructor Tests
  // ========================================
  describe('Constructor', () => {
    it('should create adapter with config only', () => {
      adapter = new OpenAIAdapter({ apiKey: 'test-key' })
      expect(adapter).toBeDefined()
      expect(adapter.provider).toBe('openai')
    })

    it('should create adapter with injected client', () => {
      adapter = new OpenAIAdapter({ apiKey: 'test-key' }, mockClient)
      expect(adapter.client).toBe(mockClient)
    })

    it('should set defaultModel to gpt-4o when not specified', () => {
      adapter = new OpenAIAdapter({ apiKey: 'test-key' }, mockClient)
      expect(adapter.defaultModel).toBe('gpt-4o')
    })

    it('should use provided defaultModel', () => {
      adapter = new OpenAIAdapter({ apiKey: 'test-key', defaultModel: 'gpt-3.5-turbo' }, mockClient)
      expect(adapter.defaultModel).toBe('gpt-3.5-turbo')
    })

    it('should initialize with organization from config', () => {
      adapter = new OpenAIAdapter({ apiKey: 'test-key', organization: 'org-123' })
      expect(adapter).toBeDefined()
      expect(adapter.provider).toBe('openai')
    })
  })

  // ========================================
  // 2. Basic UI Generation
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

    it('should use correct model from options', async () => {
      mockClient.chat.completions.create.mockResolvedValue(
        createMockStream([{ delta: { content: 'test' } }])
      )

      const context = { requestId: 'req-002', actions: new Map(), metadata: {}, timestamp: new Date() }
      const chunks: string[] = []
      for await (const chunk of adapter.generateUI('test', context, { model: 'gpt-3.5-turbo' })) {
        chunks.push(chunk)
      }

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'gpt-3.5-turbo' })
      )
    })

    it('should use defaultModel when no options provided', async () => {
      mockClient.chat.completions.create.mockResolvedValue(
        createMockStream([{ delta: { content: 'test' } }])
      )

      const context = { requestId: 'req-003', actions: new Map(), metadata: {}, timestamp: new Date() }
      const chunks: string[] = []
      for await (const chunk of adapter.generateUI('test prompt', context, {})) {
        chunks.push(chunk)
      }

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'gpt-4o' })
      )
    })

    it('should pass temperature to OpenAI', async () => {
      mockClient.chat.completions.create.mockResolvedValue(
        createMockStream([{ delta: { content: 'test' } }])
      )

      const context = { requestId: 'req-004', actions: new Map(), metadata: {}, timestamp: new Date() }
      const chunks: string[] = []
      for await (const chunk of adapter.generateUI('test', context, { temperature: 0.7 })) {
        chunks.push(chunk)
      }

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({ temperature: 0.7 })
      )
    })

    it('should pass maxTokens to OpenAI', async () => {
      mockClient.chat.completions.create.mockResolvedValue(
        createMockStream([{ delta: { content: 'test' } }])
      )

      const context = { requestId: 'req-005', actions: new Map(), metadata: {}, timestamp: new Date() }
      const chunks: string[] = []
      for await (const chunk of adapter.generateUI('test', context, { maxTokens: 2000 })) {
        chunks.push(chunk)
      }

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({ max_tokens: 2000 })
      )
    })

    it('should pass topP to OpenAI', async () => {
      mockClient.chat.completions.create.mockResolvedValue(
        createMockStream([{ delta: { content: 'test' } }])
      )

      const context = { requestId: 'req-006', actions: new Map(), metadata: {}, timestamp: new Date() }
      const chunks: string[] = []
      for await (const chunk of adapter.generateUI('test', context, { topP: 0.9 })) {
        chunks.push(chunk)
      }

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({ top_p: 0.9 })
      )
    })

    it('should handle empty content chunks (skips undefined)', async () => {
      const chunks = [
        { delta: { content: 'First' } },
        { delta: {} },
        { delta: { content: 'Third' } }
      ]

      mockClient.chat.completions.create.mockResolvedValue(createMockStream(chunks))

      const context = { requestId: 'req-007', actions: new Map(), metadata: {}, timestamp: new Date() }

      const result: string[] = []
      for await (const chunk of adapter.generateUI('test', context, {})) {
        result.push(chunk)
      }

      expect(result).toEqual(['First', 'Third'])
    })

    it('should handle empty stream', async () => {
      mockClient.chat.completions.create.mockResolvedValue(createMockStream([]))

      const context = { requestId: 'req-008', actions: new Map(), metadata: {}, timestamp: new Date() }

      const result: string[] = []
      for await (const chunk of adapter.generateUI('test', context, {})) {
        result.push(chunk)
      }

      expect(result).toEqual([])
    })

    it('should enable streaming in OpenAI request', async () => {
      mockClient.chat.completions.create.mockResolvedValue(
        createMockStream([{ delta: { content: 'test' } }])
      )

      const context = { requestId: 'req-009', actions: new Map(), metadata: {}, timestamp: new Date() }
      const chunks: string[] = []
      for await (const chunk of adapter.generateUI('test', context, {})) {
        chunks.push(chunk)
      }

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({ stream: true })
      )
    })

    it('should pass stop sequences to OpenAI', async () => {
      mockClient.chat.completions.create.mockResolvedValue(
        createMockStream([{ delta: { content: 'test' } }])
      )

      const context = { requestId: 'req-010', actions: new Map(), metadata: {}, timestamp: new Date() }
      const chunks: string[] = []
      for await (const chunk of adapter.generateUI('test', context, { stopSequences: ['STOP'] })) {
        chunks.push(chunk)
      }

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({ stop: ['STOP'] })
      )
    })
  })

  // ========================================
  // 3. Error Handling
  // ========================================
  describe('Error Handling', () => {
    beforeEach(() => {
      adapter = new OpenAIAdapter(
        { apiKey: 'test-key', defaultModel: 'gpt-4o' },
        mockClient
      )
    })

    it('should throw LLMProviderError on API error with status', async () => {
      const apiError: any = new Error('API Error')
      apiError.status = 429

      mockClient.chat.completions.create.mockRejectedValue(apiError)

      const context = { requestId: 'req-err-001', actions: new Map(), metadata: {}, timestamp: new Date() }

      await expect(async () => {
        for await (const chunk of adapter.generateUI('test', context, {})) { /* consume */ }
      }).rejects.toThrow(LLMProviderError)
    })

    it('should include status code and provider in LLMProviderError', async () => {
      const apiError: any = new Error('Rate limit exceeded')
      apiError.status = 429

      mockClient.chat.completions.create.mockRejectedValue(apiError)

      const context = { requestId: 'req-err-002', actions: new Map(), metadata: {}, timestamp: new Date() }

      try {
        for await (const chunk of adapter.generateUI('test', context, {})) { /* consume */ }
        expect.fail('Should have thrown error')
      } catch (error: any) {
        expect(error).toBeInstanceOf(LLMProviderError)
        expect(error.status).toBe(429)
        expect(error.provider).toBe('openai')
      }
    })

    it('should wrap error message with OpenAI API error context', async () => {
      const apiError: any = new Error('Invalid API key')
      apiError.status = 401

      mockClient.chat.completions.create.mockRejectedValue(apiError)

      const context = { requestId: 'req-err-003', actions: new Map(), metadata: {}, timestamp: new Date() }

      try {
        for await (const chunk of adapter.generateUI('test', context, {})) { /* consume */ }
        expect.fail('Should have thrown error')
      } catch (error: any) {
        expect(error.message).toContain('OpenAI API error')
        expect(error.message).toContain('Invalid API key')
      }
    })

    it('should rethrow non-status errors as-is', async () => {
      const apiError: any = new Error('Network error')

      mockClient.chat.completions.create.mockRejectedValue(apiError)

      const context = { requestId: 'req-err-004', actions: new Map(), metadata: {}, timestamp: new Date() }

      await expect(async () => {
        for await (const chunk of adapter.generateUI('test', context, {})) { /* consume */ }
      }).rejects.toThrow('Network error')
    })

    it('should handle error object without message', async () => {
      const apiError: any = { status: 500 }

      mockClient.chat.completions.create.mockRejectedValue(apiError)

      const context = { requestId: 'req-err-005', actions: new Map(), metadata: {}, timestamp: new Date() }

      try {
        for await (const chunk of adapter.generateUI('test', context, {})) { /* consume */ }
        expect.fail('Should have thrown error')
      } catch (error: any) {
        expect(error).toBeInstanceOf(LLMProviderError)
        expect(error.message).toContain('Unknown error')
      }
    })

    it('should call onError callback on streaming error', async () => {
      const streamError = new Error('Stream error')
      mockClient.chat.completions.create.mockRejectedValue(streamError)

      const onError = vi.fn()
      const messages = [{ role: 'user' as const, content: 'test' }]

      try {
        for await (const chunk of adapter.streamResponse(messages, { onError })) { /* consume */ }
      } catch (error) { /* expected */ }

      expect(onError).toHaveBeenCalledWith(expect.any(Error))
    })

    it('should handle streaming error and throw LLMProviderError', async () => {
      const streamError = new Error('Stream interrupted')

      mockClient.chat.completions.create.mockRejectedValue(streamError)

      const messages = [{ role: 'user' as const, content: 'test' }]

      await expect(async () => {
        for await (const chunk of adapter.streamResponse(messages, {})) { /* consume */ }
      }).rejects.toThrow(LLMProviderError)
    })
  })

  // ========================================
  // 4. executeAction Tests
  // ========================================
  describe('executeAction', () => {
    beforeEach(() => {
      adapter = new OpenAIAdapter(
        { apiKey: 'test-key', defaultModel: 'gpt-4o' },
        mockClient
      )
    })

    it('should return success result when schema valid', async () => {
      const action = {
        name: 'testAction',
        description: 'Test action',
        parameters: z.object({ input: z.string() }),
        handler: vi.fn().mockResolvedValue({ success: true, result: 'Executed' })
      }

      const result = await adapter.executeAction(action, { input: 'test data' })

      expect(result.success).toBe(true)
      expect(result.result).toBe('Executed')
      expect(action.handler).toHaveBeenCalledWith({ input: 'test data' })
    })

    it('should return {success:false, error} when schema invalid', async () => {
      const action = {
        name: 'testAction',
        description: 'Test action',
        parameters: z.object({ input: z.string() }),
        handler: vi.fn()
      }

      const result = await adapter.executeAction(action, { input: 123 })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(action.handler).not.toHaveBeenCalled()
    })

    it('should call action.handler with parsed data on success', async () => {
      const action = {
        name: 'complexAction',
        description: 'Complex action',
        parameters: z.object({ name: z.string(), age: z.number() }),
        handler: vi.fn().mockResolvedValue({ success: true })
      }

      await adapter.executeAction(action, { name: 'Alice', age: 30 })

      expect(action.handler).toHaveBeenCalledWith({ name: 'Alice', age: 30 })
    })

    it('should return error for missing required fields', async () => {
      const action = {
        name: 'testAction',
        description: 'Test action',
        parameters: z.object({ required: z.string(), optional: z.string().optional() }),
        handler: vi.fn()
      }

      const result = await adapter.executeAction(action, {})

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should include validation error message on failure', async () => {
      const action = {
        name: 'emailAction',
        description: 'Email action',
        parameters: z.object({ email: z.string().email() }),
        handler: vi.fn()
      }

      const result = await adapter.executeAction(action, { email: 'invalid-email' })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid')
    })
  })

  // ========================================
  // 5. streamResponse Tests
  // ========================================
  describe('streamResponse', () => {
    beforeEach(() => {
      adapter = new OpenAIAdapter(
        { apiKey: 'test-key', defaultModel: 'gpt-4o' },
        mockClient
      )
    })

    it('should yield chunks from stream', async () => {
      const chunks = [
        { delta: { content: 'Chunk 1' } },
        { delta: { content: 'Chunk 2' } }
      ]

      mockClient.chat.completions.create.mockResolvedValue(createMockStream(chunks))

      const messages = [{ role: 'user' as const, content: 'test' }]

      const result: string[] = []
      for await (const chunk of adapter.streamResponse(messages, {})) {
        result.push(chunk)
      }

      expect(result).toEqual(['Chunk 1', 'Chunk 2'])
    })

    it('should call onChunk callback for each chunk', async () => {
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

    it('should call onError and throw LLMProviderError on failure', async () => {
      const streamError = new Error('Stream error')
      mockClient.chat.completions.create.mockRejectedValue(streamError)

      const onError = vi.fn()
      const messages = [{ role: 'user' as const, content: 'test' }]

      await expect(async () => {
        for await (const chunk of adapter.streamResponse(messages, { onError })) { /* consume */ }
      }).rejects.toThrow(LLMProviderError)

      expect(onError).toHaveBeenCalledWith(expect.any(Error))
    })

    it('should use options.model in streamResponse', async () => {
      mockClient.chat.completions.create.mockResolvedValue(
        createMockStream([{ delta: { content: 'test' } }])
      )

      const messages = [{ role: 'user' as const, content: 'test' }]

      for await (const chunk of adapter.streamResponse(messages, { model: 'gpt-4-turbo' })) { /* consume */ }

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'gpt-4-turbo' })
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
  // 6. convertActionsToTools Tests
  // ========================================
  describe('convertActionsToTools', () => {
    beforeEach(() => {
      adapter = new OpenAIAdapter(
        { apiKey: 'test-key', defaultModel: 'gpt-4o' },
        mockClient
      )
    })

    it('should return correct tool format', () => {
      const action = {
        name: 'testTool',
        description: 'Test tool description',
        parameters: z.object({ input: z.string() }),
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
        ['tool1', { name: 'tool1', description: 'First tool', parameters: z.object({}), handler: async () => ({ success: true }) }],
        ['tool2', { name: 'tool2', description: 'Second tool', parameters: z.object({}), handler: async () => ({ success: true }) }]
      ])

      const tools = adapter.convertActionsToTools(actions)

      expect(tools).toHaveLength(2)
      expect(tools[0].function.name).toBe('tool1')
      expect(tools[1].function.name).toBe('tool2')
    })

    it('should handle empty actions map', () => {
      const tools = adapter.convertActionsToTools(new Map())

      expect(tools).toEqual([])
    })

    it('should set type to function for each tool', () => {
      const action = {
        name: 'myTool',
        description: 'My tool',
        parameters: z.object({ val: z.number() }),
        handler: async () => ({ success: true })
      }

      const tools = adapter.convertActionsToTools(new Map([['myTool', action]]))

      expect(tools[0].type).toBe('function')
    })
  })

  // ========================================
  // 7. Provider Property
  // ========================================
  describe('Provider Property', () => {
    it('should have provider set to openai', () => {
      adapter = new OpenAIAdapter({ apiKey: 'test-key' }, mockClient)
      expect(adapter.provider).toBe('openai')
    })
  })
})
