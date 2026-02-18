import type Anthropic from '@anthropic-ai/sdk'
import { LLMAdapter } from './llm-adapter'
import type { RuntimeContext, GenerationOptions, StreamOptions, ChatMessage, ActionResult } from '../types/runtime-types'
import type { Action } from '../actions/action-registry'
import { LLMProviderError } from '../errors/runtime-errors'

/**
 * Anthropic adapter configuration
 */
export interface AnthropicConfig {
  /** Anthropic API key */
  apiKey: string
  /** Default model */
  defaultModel?: string
}

/**
 * Anthropic adapter for A2UI Runtime
 * Supports Claude 3.5 Sonnet, Claude 4 models with streaming
 */
export class AnthropicAdapter extends LLMAdapter {
  readonly provider = 'anthropic'
  private client: Anthropic
  private defaultModel: string

  constructor(config: AnthropicConfig, client?: Anthropic) {
    super()

    if (client) {
      this.client = client
    } else {
      // Dynamic import to avoid bundling if not used
      const AnthropicConstructor = require('@anthropic-ai/sdk').default
      this.client = new AnthropicConstructor({
        apiKey: config.apiKey,
      })
    }

    this.defaultModel = config.defaultModel || 'claude-3-5-sonnet-20241022'
  }

  async *generateUI(
    prompt: string,
    context: RuntimeContext,
    options?: GenerationOptions
  ): AsyncIterator<string> {
    try {
      const stream = await this.client.messages.create({
        model: options?.model || this.defaultModel,
        max_tokens: options?.maxTokens || 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: options?.temperature,
        top_p: options?.topP,
        stop_sequences: options?.stopSequences,
        stream: true,
      })

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          yield this.parseResponse(event.delta.text)
        }
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) {
        throw new LLMProviderError(
          `Anthropic API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'anthropic',
          typeof error.status === 'number' ? error.status : undefined
        )
      }
      throw error
    }
  }

  async executeAction(
    action: Action,
    parameters: Record<string, unknown>
  ): Promise<ActionResult> {
    // Validate and execute action
    const parseResult = action.parameters.safeParse(parameters)

    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.message,
      }
    }

    return action.handler(parseResult.data)
  }

  async *streamResponse(
    messages: ChatMessage[],
    options?: StreamOptions
  ): AsyncIterator<string> {
    try {
      const stream = await this.client.messages.create({
        model: options?.model || this.defaultModel,
        max_tokens: 4096,
        messages: messages
          .filter(msg => msg.role !== 'system')
          .map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' as const : 'user' as const,
            content: msg.content || '',
          })),
        stream: true,
      })

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          if (options?.onChunk) {
            options.onChunk(event.delta.text)
          }
          yield event.delta.text
        }
      }

      if (options?.onComplete) {
        options.onComplete()
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error')
      if (options?.onError) {
        options.onError(err)
      }
      throw new LLMProviderError(
        `Anthropic streaming error: ${err.message}`,
        'anthropic'
      )
    }
  }

  convertActionsToTools(actions: Map<string, Action>): unknown[] {
    // Anthropic uses a different tool format
    return Array.from(actions.values()).map(action => ({
      name: action.name,
      description: action.description,
      input_schema: this.zodToJsonSchema(action.parameters),
    }))
  }

  private zodToJsonSchema(schema: unknown): unknown {
    // Simplified JSON schema conversion
    // In production, use a proper zod-to-json-schema library
    return {
      type: 'object',
      properties: {},
      required: [],
    }
  }
}
