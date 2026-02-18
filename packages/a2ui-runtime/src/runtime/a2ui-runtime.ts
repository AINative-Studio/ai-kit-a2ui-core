import type { LLMAdapter } from '../adapters/llm-adapter'
import type { Middleware } from '../middleware/middleware'
import { composeMiddleware } from '../middleware/middleware'
import type { Action } from '../actions/action-registry'
import { ActionRegistry } from '../actions/action-registry'
import type { RuntimeRequest, RuntimeResponse, RuntimeContext } from '../types/runtime-types'

/**
 * Runtime configuration
 */
export interface RuntimeConfig {
  /** LLM adapter (OpenAI, Anthropic, etc.) */
  adapter: LLMAdapter
  /** Middleware functions */
  middleware?: Middleware[]
  /** Actions to register */
  actions?: Action[]
}

/**
 * A2UI Runtime
 * Main runtime class for processing UI generation requests
 */
export class A2UIRuntime {
  private adapter: LLMAdapter
  private middleware: Middleware
  private actionRegistry: ActionRegistry

  constructor(config: RuntimeConfig) {
    this.adapter = config.adapter
    this.actionRegistry = new ActionRegistry()

    // Register actions
    if (config.actions) {
      this.actionRegistry.registerMany(config.actions)
    }

    // Compose middleware
    this.middleware = composeMiddleware(config.middleware || [])
  }

  /**
   * Process a runtime request
   * @param request - Runtime request
   * @returns Runtime response
   */
  async process(request: RuntimeRequest): Promise<RuntimeResponse> {
    const startTime = Date.now()

    try {
      // Execute middleware pipeline
      await this.middleware(request.context, async () => {})

      // Generate UI using adapter
      const chunks: string[] = []
      for await (const chunk of this.adapter.generateUI(
        request.prompt,
        request.context,
        request.options
      )) {
        chunks.push(chunk)
      }

      const content = chunks.join('')
      const latencyMs = Date.now() - startTime

      return {
        requestId: request.context.requestId,
        content,
        status: 'success',
        timestamp: new Date(),
        metrics: {
          tokensUsed: {
            prompt: 0, // Would be populated by adapter
            completion: 0,
            total: 0,
          },
          latencyMs,
          provider: this.adapter.provider,
        },
      }
    } catch (error) {
      const latencyMs = Date.now() - startTime

      return {
        requestId: request.context.requestId,
        content: '',
        status: 'error',
        timestamp: new Date(),
        error: {
          code: error instanceof Error && 'code' in error ? (error as { code: string }).code : 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error,
        },
        metrics: {
          tokensUsed: {
            prompt: 0,
            completion: 0,
            total: 0,
          },
          latencyMs,
          provider: this.adapter.provider,
        },
      }
    }
  }

  /**
   * Stream a response
   * @param request - Runtime request
   * @returns Async iterator of response chunks
   */
  async *stream(request: RuntimeRequest): AsyncIterator<string> {
    // Execute middleware pipeline
    await this.middleware(request.context, async () => {})

    // Stream using adapter
    yield* this.adapter.generateUI(
      request.prompt,
      request.context,
      request.options
    )
  }

  /**
   * Execute an action by name
   * @param actionName - Name of action to execute
   * @param parameters - Action parameters
   * @returns Action result
   */
  async executeAction(actionName: string, parameters: Record<string, unknown>) {
    return this.actionRegistry.execute(actionName, parameters)
  }

  /**
   * Register an action
   * @param action - Action to register
   */
  registerAction(action: Action): void {
    this.actionRegistry.register(action)
  }

  /**
   * Get all registered actions
   * @returns Array of actions
   */
  getActions(): Action[] {
    return this.actionRegistry.list()
  }

  /**
   * Create a runtime context
   * @param requestId - Request identifier
   * @param metadata - Optional metadata
   * @returns Runtime context
   */
  createContext(
    requestId: string,
    metadata: Record<string, unknown> = {}
  ): RuntimeContext {
    return {
      requestId,
      timestamp: new Date(),
      actions: new Map(
        this.actionRegistry.list().map(action => [action.name, action])
      ),
      metadata,
    }
  }
}
