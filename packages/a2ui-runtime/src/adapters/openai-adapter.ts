import type OpenAI from 'openai'
import { LLMAdapter } from './llm-adapter'
import type { RuntimeContext, GenerationOptions, StreamOptions, ChatMessage, ActionResult } from '../types/runtime-types'
import type { Action } from '../actions/action-registry'
import { LLMProviderError } from '../errors/runtime-errors'

/**
 * OpenAI adapter configuration
 */
export interface OpenAIConfig {
  /** OpenAI API key */
  apiKey: string
  /** Optional organization ID */
  organization?: string
  /** Default model */
  defaultModel?: string
}

/**
 * OpenAI adapter for A2UI Runtime
 * Supports GPT-4, GPT-4o, GPT-4o-mini models with streaming
 */
export class OpenAIAdapter extends LLMAdapter {
  readonly provider = 'openai'
  private client: OpenAI
  private defaultModel: string

  constructor(config: OpenAIConfig, client?: OpenAI) {
    super()

    if (client) {
      this.client = client
    } else {
      // Dynamic import to avoid bundling if not used
      const OpenAIConstructor = require('openai').default
      this.client = new OpenAIConstructor({
        apiKey: config.apiKey,
        organization: config.organization,
      })
    }

    this.defaultModel = config.defaultModel || 'gpt-4o'
  }

  async *generateUI(
    prompt: string,
    context: RuntimeContext,
    options?: GenerationOptions
  ): AsyncIterator<string> {
    try {
      const stream = await this.client.chat.completions.create({
        model: options?.model || this.defaultModel,
        messages: [
          {
            role: 'system',
            content: 'You are an A2UI component generator. Generate UI components in A2UI protocol format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        stream: true,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
        top_p: options?.topP,
        frequency_penalty: options?.frequencyPenalty,
        presence_penalty: options?.presencePenalty,
        stop: options?.stopSequences,
        tools: this.convertActionsToTools(context.actions) as OpenAI.Chat.Completions.ChatCompletionTool[],
      })

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content
        if (content) {
          yield this.parseResponse(content)
        }
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) {
        throw new LLMProviderError(
          `OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'openai',
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
      const stream = await this.client.chat.completions.create({
        model: options?.model || this.defaultModel,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content || '',
          name: msg.name,
        })),
        stream: true,
      })

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content
        if (content) {
          if (options?.onChunk) {
            options.onChunk(content)
          }
          yield content
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
        `OpenAI streaming error: ${err.message}`,
        'openai'
      )
    }
  }

  convertActionsToTools(actions: Map<string, Action>): unknown[] {
    return Array.from(actions.values()).map(action => ({
      type: 'function',
      function: {
        name: action.name,
        description: action.description,
        parameters: this.zodToJsonSchema(action.parameters),
      },
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
