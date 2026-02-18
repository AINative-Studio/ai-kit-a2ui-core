# Runtime Package Development Standards

**Package**: `@ainative/a2ui-runtime`
**Purpose**: Backend runtime abstraction for LLM providers and agent orchestration
**Status**: Mandatory for all runtime package development

---

## Core Principles

### 1. Framework Agnostic
- MUST work with Express, Fastify, Hono, Next.js API routes
- NO framework-specific dependencies in core
- Provide adapters for popular frameworks

### 2. LLM Provider Abstraction
- Abstract OpenAI, Anthropic, Google, Groq APIs
- Unified interface for all providers
- Support streaming and non-streaming responses

### 3. Zero Impact on Core Protocol
- Import `@ainative/ai-kit-a2ui-core` for types
- NO modifications to A2UI protocol messages
- Runtime is an ADDITION, not a replacement

---

## TypeScript Standards

### Strict Mode Requirements
```typescript
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": false
  }
}
```

### Adapter Interface
```typescript
/**
 * Base adapter for LLM providers
 * All provider adapters MUST extend this class
 */
export abstract class LLMAdapter {
  /**
   * Generate A2UI components from prompt
   * @param prompt - User prompt
   * @param context - Execution context
   * @returns Async iterator of A2UI messages
   */
  abstract generateUI(
    prompt: string,
    context: RuntimeContext,
    options?: GenerationOptions
  ): AsyncIterator<A2UIMessage>

  /**
   * Execute an action registered with the runtime
   * @param action - Action to execute
   * @param parameters - Action parameters
   * @returns Action result
   */
  abstract executeAction(
    action: Action,
    parameters: Record<string, unknown>
  ): Promise<ActionResult>

  /**
   * Stream responses for chat interfaces
   * @param messages - Chat message history
   * @param options - Streaming options
   * @returns Async iterator of response chunks
   */
  abstract streamResponse(
    messages: ChatMessage[],
    options?: StreamOptions
  ): AsyncIterator<string>
}
```

---

## Adapter Development

### OpenAI Adapter
```typescript
import OpenAI from 'openai'
import type { LLMAdapter } from '../runtime/LLMAdapter'

export class OpenAIAdapter extends LLMAdapter {
  private client: OpenAI

  constructor(config: OpenAIConfig) {
    super()
    this.client = new OpenAI({
      apiKey: config.apiKey,
      organization: config.organization,
    })
  }

  async *generateUI(
    prompt: string,
    context: RuntimeContext,
    options?: GenerationOptions
  ): AsyncIterator<A2UIMessage> {
    const stream = await this.client.chat.completions.create({
      model: options?.model || 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an A2UI component generator...'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      stream: true,
      tools: this.convertActionsToTools(context.actions)
    })

    for await (const chunk of stream) {
      if (chunk.choices[0]?.delta?.content) {
        yield this.parseA2UIMessage(chunk.choices[0].delta.content)
      }
    }
  }
}
```

### Anthropic Adapter
```typescript
import Anthropic from '@anthropic-ai/sdk'

export class AnthropicAdapter extends LLMAdapter {
  private client: Anthropic

  constructor(config: AnthropicConfig) {
    super()
    this.client = new Anthropic({
      apiKey: config.apiKey,
    })
  }

  async *generateUI(
    prompt: string,
    context: RuntimeContext,
    options?: GenerationOptions
  ): AsyncIterator<A2UIMessage> {
    const stream = await this.client.messages.create({
      model: options?.model || 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    })

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield this.parseA2UIMessage(event.delta.text)
      }
    }
  }
}
```

---

## Middleware System

### Middleware Interface
```typescript
/**
 * Middleware function for request/response pipeline
 */
export type Middleware = (
  context: RuntimeContext,
  next: () => Promise<void>
) => Promise<void>
```

### Authentication Middleware Example
```typescript
export const authMiddleware: Middleware = async (context, next) => {
  const token = context.request.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    throw new UnauthorizedError('Missing authorization token')
  }

  try {
    const user = await verifyToken(token)
    context.user = user
    await next()
  } catch (error) {
    throw new UnauthorizedError('Invalid token')
  }
}
```

### Logging Middleware Example
```typescript
export const loggingMiddleware: Middleware = async (context, next) => {
  const startTime = Date.now()

  console.log(`[${new Date().toISOString()}] ${context.request.method} ${context.request.path}`)

  try {
    await next()
    const duration = Date.now() - startTime
    console.log(`[${new Date().toISOString()}] Response: ${context.response.status} (${duration}ms)`)
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[${new Date().toISOString()}] Error: ${error.message} (${duration}ms)`)
    throw error
  }
}
```

### Rate Limiting Middleware Example
```typescript
export const rateLimitMiddleware = (options: RateLimitOptions): Middleware => {
  const limiter = new RateLimiter(options)

  return async (context, next) => {
    const key = context.user?.id || context.request.ip

    const allowed = await limiter.checkLimit(key)
    if (!allowed) {
      throw new RateLimitError('Too many requests')
    }

    await next()
  }
}
```

---

## Action System

### Defining Actions
```typescript
import { z } from 'zod'

export const searchDatabaseAction = defineAction({
  name: 'searchDatabase',
  description: 'Search the vector database for relevant documents',

  parameters: z.object({
    query: z.string().describe('Search query'),
    limit: z.number().min(1).max(100).optional().describe('Maximum results'),
    filters: z.record(z.unknown()).optional().describe('Additional filters')
  }),

  handler: async ({ query, limit = 10, filters }) => {
    const results = await vectorDB.search(query, {
      limit,
      filters
    })

    return {
      results: results.map(r => ({
        id: r.id,
        score: r.score,
        content: r.content
      }))
    }
  }
})
```

### Action Validation
```typescript
// ✅ CORRECT - Zod schema validation
parameters: z.object({
  email: z.string().email(),
  age: z.number().min(0).max(150)
})

// ❌ WRONG - No validation
parameters: {
  email: 'string',
  age: 'number'
}
```

---

## Runtime Configuration

### Main Runtime Class
```typescript
export class A2UIRuntime {
  private adapter: LLMAdapter
  private middleware: Middleware[] = []
  private actions: Map<string, Action> = new Map()

  constructor(config: RuntimeConfig) {
    this.adapter = config.adapter
    this.middleware = config.middleware || []

    config.actions?.forEach(action => {
      this.actions.set(action.name, action)
    })
  }

  /**
   * Process incoming request through middleware pipeline
   */
  async process(request: RuntimeRequest): Promise<RuntimeResponse> {
    const context = this.createContext(request)

    // Execute middleware chain
    await this.executeMiddleware(context, 0)

    // Generate response using adapter
    const response = await this.adapter.generateUI(
      request.prompt,
      context,
      request.options
    )

    return this.formatResponse(response)
  }

  private async executeMiddleware(context: RuntimeContext, index: number): Promise<void> {
    if (index >= this.middleware.length) {
      return
    }

    const current = this.middleware[index]!
    await current(context, () => this.executeMiddleware(context, index + 1))
  }
}
```

---

## Testing Requirements

### Adapter Testing
```typescript
describe('OpenAIAdapter', () => {
  let adapter: OpenAIAdapter
  let mockClient: MockOpenAI

  beforeEach(() => {
    mockClient = createMockOpenAI()
    adapter = new OpenAIAdapter({ apiKey: 'test-key' })
  })

  it('generates A2UI components from prompt', async () => {
    mockClient.mockResponse({
      content: JSON.stringify({
        type: 'createSurface',
        components: [{ type: 'text', id: 'text-1' }]
      })
    })

    const messages: A2UIMessage[] = []
    for await (const msg of adapter.generateUI('Create a dashboard', context)) {
      messages.push(msg)
    }

    expect(messages).toHaveLength(1)
    expect(messages[0].type).toBe('createSurface')
  })

  it('handles API errors gracefully', async () => {
    mockClient.mockError(new Error('API rate limit'))

    await expect(async () => {
      for await (const msg of adapter.generateUI('test', context)) {
        // Should throw
      }
    }).rejects.toThrow('API rate limit')
  })
})
```

### Middleware Testing
```typescript
describe('authMiddleware', () => {
  it('allows requests with valid token', async () => {
    const context = createMockContext({
      headers: { authorization: 'Bearer valid-token' }
    })

    const next = vi.fn()
    await authMiddleware(context, next)

    expect(next).toHaveBeenCalled()
    expect(context.user).toBeDefined()
  })

  it('rejects requests without token', async () => {
    const context = createMockContext({
      headers: {}
    })

    await expect(authMiddleware(context, vi.fn())).rejects.toThrow(UnauthorizedError)
  })
})
```

### Action Testing
```typescript
describe('searchDatabaseAction', () => {
  it('executes search with valid parameters', async () => {
    const result = await searchDatabaseAction.handler({
      query: 'machine learning',
      limit: 5
    })

    expect(result.results).toHaveLength(5)
    expect(result.results[0]).toHaveProperty('id')
    expect(result.results[0]).toHaveProperty('score')
  })

  it('validates parameters using Zod schema', async () => {
    await expect(searchDatabaseAction.handler({
      query: '',  // Invalid: empty string
      limit: 1000  // Invalid: exceeds max
    })).rejects.toThrow(ValidationError)
  })
})
```

### Test Coverage Requirements
- **Statements**: ≥90% (higher than React due to critical infrastructure)
- **Branches**: ≥90%
- **Functions**: ≥90%
- **Lines**: ≥90%

---

## Error Handling

### Custom Error Classes
```typescript
export class RuntimeError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'RuntimeError'
  }
}

export class LLMProviderError extends RuntimeError {
  constructor(message: string, public provider: string) {
    super(message, 'LLM_PROVIDER_ERROR')
  }
}

export class ActionExecutionError extends RuntimeError {
  constructor(message: string, public actionName: string) {
    super(message, 'ACTION_EXECUTION_ERROR')
  }
}

export class RateLimitError extends RuntimeError {
  constructor(message: string) {
    super(message, 'RATE_LIMIT_ERROR')
  }
}
```

### Error Handling in Adapters
```typescript
// ✅ CORRECT - Wrap provider errors
try {
  const response = await this.client.chat.completions.create(params)
  return response
} catch (error) {
  if (error instanceof OpenAI.APIError) {
    throw new LLMProviderError(
      `OpenAI API error: ${error.message}`,
      'openai'
    )
  }
  throw error
}
```

---

## Security Requirements

### API Key Management
```typescript
// ✅ CORRECT - Environment variables
const adapter = new OpenAIAdapter({
  apiKey: process.env.OPENAI_API_KEY!
})

// ❌ WRONG - Hardcoded keys
const adapter = new OpenAIAdapter({
  apiKey: 'sk-...'  // NEVER DO THIS
})
```

### Input Validation
```typescript
// ✅ CORRECT - Validate all inputs
export const validatePrompt = (prompt: string): string => {
  if (!prompt || prompt.trim().length === 0) {
    throw new ValidationError('Prompt cannot be empty')
  }

  if (prompt.length > 10000) {
    throw new ValidationError('Prompt exceeds maximum length')
  }

  return prompt.trim()
}
```

### Rate Limiting
```typescript
// ✅ REQUIRED - Rate limit all endpoints
const runtime = new A2UIRuntime({
  adapter: openaiAdapter,
  middleware: [
    rateLimitMiddleware({
      windowMs: 60000,  // 1 minute
      maxRequests: 60   // 60 requests per minute
    })
  ]
})
```

---

## Documentation Requirements

### Adapter Documentation
```typescript
/**
 * OpenAI adapter for A2UI Runtime
 *
 * Supports GPT-4, GPT-4o, GPT-4o-mini models with streaming.
 *
 * @example
 * ```typescript
 * const adapter = new OpenAIAdapter({
 *   apiKey: process.env.OPENAI_API_KEY,
 *   organization: 'org-123'
 * })
 *
 * const runtime = new A2UIRuntime({ adapter })
 * ```
 */
export class OpenAIAdapter extends LLMAdapter { }
```

### Integration Examples
Create examples for:
- Express.js integration
- Fastify integration
- Next.js API routes
- Standalone HTTP server

---

## Pre-commit Checklist

Before committing runtime package code:

- [ ] All tests passing (`npm test`)
- [ ] Coverage ≥90% (`npm run test:coverage`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Security audit passed (`npm audit`)
- [ ] API keys not committed
- [ ] All adapters tested with mocks (no real API calls)
- [ ] Middleware execution order verified
- [ ] Error handling comprehensive
- [ ] Documentation updated

---

## Summary

**Runtime Package MUST**:
1. Abstract LLM provider differences
2. Support streaming and non-streaming
3. Provide middleware system
4. Validate all inputs with Zod schemas
5. Achieve 90%+ test coverage
6. Never commit API keys
7. Rate limit all endpoints
8. Comprehensive error handling
9. Framework-agnostic core
10. Complete integration examples

---

**Last Updated**: 2026-02-17
**Status**: Mandatory
**Enforcement**: Pre-commit hooks + CI/CD
