/**
 * Anthropic provider implementation for the A2UI runtime.
 *
 * This is a structural stub that satisfies the LLMProvider contract.
 * The actual HTTP calls to the Anthropic API should be wired up when the
 * `@anthropic-ai/sdk` package is available as a peer dependency.
 */

import { LLMProvider } from './base';
import type {
  Message,
  CompletionOptions,
  CompletionResponse,
  StreamEvent,
  AnthropicProviderConfig,
  ToolDefinition,
} from '../types';

/** Models known to be supported by Anthropic. */
const ANTHROPIC_MODELS = [
  'claude-sonnet-4-20250514',
  'claude-opus-4-20250514',
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
  'claude-3-opus-20240229',
] as const;

/**
 * Anthropic LLM provider.
 *
 * Usage:
 * ```ts
 * const anthropic = new AnthropicProvider({ apiKey: process.env.ANTHROPIC_API_KEY });
 * const response = await anthropic.complete([{ role: 'user', content: 'Hello' }]);
 * ```
 */
export class AnthropicProvider extends LLMProvider<AnthropicProviderConfig> {
  readonly name = 'anthropic' as const;

  /**
   * Lazily-resolved Anthropic client instance.
   * Set during initialize() or on first use.
   */
  private client: unknown = null;

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  override async initialize(): Promise<void> {
    // In a full implementation this would dynamically import the SDK
    // and instantiate the client:
    //
    // const { default: Anthropic } = await import('@anthropic-ai/sdk');
    // this.client = new Anthropic({
    //   apiKey: this.config.apiKey,
    //   baseURL: this.config.baseURL,
    //   timeout: this.config.timeoutMs,
    //   maxRetries: this.config.maxRetries,
    // });
    this.client = {}; // placeholder
  }

  override async shutdown(): Promise<void> {
    this.client = null;
  }

  // -------------------------------------------------------------------------
  // Core API
  // -------------------------------------------------------------------------

  async complete(
    messages: Message[],
    options?: CompletionOptions,
  ): Promise<CompletionResponse> {
    this.ensureInitialized();

    const model = options?.model ?? this.getDefaultModel();

    // Stub: In a real implementation this would call
    // this.client.messages.create({ ... })
    // and map the Anthropic response to our CompletionResponse type.

    const { system, conversationMessages } = this.splitSystemMessage(messages);
    const _anthropicMessages = this.toAnthropicMessages(conversationMessages);
    const _tools = options?.tools ? this.toAnthropicTools(options.tools) : undefined;

    return {
      id: `anthropic-${Date.now()}`,
      model,
      message: {
        role: 'assistant',
        content: null,
      },
      finishReason: 'stop',
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
    };
  }

  async *stream(
    messages: Message[],
    options?: CompletionOptions,
  ): AsyncIterable<StreamEvent> {
    this.ensureInitialized();

    const model = options?.model ?? this.getDefaultModel();

    // Emit start event
    yield {
      type: 'stream.start',
      id: `anthropic-stream-${Date.now()}`,
      model,
    };

    // Stub: In a real implementation this would call
    // this.client.messages.create({ ..., stream: true })
    // and yield content_block_delta events mapped to StreamEventDelta.

    const { system, conversationMessages } = this.splitSystemMessage(messages);
    const _anthropicMessages = this.toAnthropicMessages(conversationMessages);

    // Emit complete event
    yield {
      type: 'stream.complete',
      message: {
        role: 'assistant',
        content: null,
      },
      finishReason: 'stop',
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
    };
  }

  // -------------------------------------------------------------------------
  // Introspection
  // -------------------------------------------------------------------------

  override listModels(): string[] {
    return [...ANTHROPIC_MODELS];
  }

  protected getFallbackModel(): string {
    return 'claude-sonnet-4-20250514';
  }

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  /**
   * Anthropic's API takes the system prompt as a top-level parameter rather
   * than as a message. This helper splits it out.
   */
  private splitSystemMessage(
    messages: Message[],
  ): { system: string | undefined; conversationMessages: Message[] } {
    const systemMessages = messages.filter((m) => m.role === 'system');
    const conversationMessages = messages.filter((m) => m.role !== 'system');
    const system = systemMessages.length > 0
      ? systemMessages.map((m) => m.content ?? '').join('\n\n')
      : undefined;

    return { system, conversationMessages };
  }

  /**
   * Map our provider-agnostic Message[] to the shape the Anthropic SDK expects.
   */
  private toAnthropicMessages(
    messages: Message[],
  ): Array<{ role: 'user' | 'assistant'; content: string }> {
    return messages.map((msg) => ({
      role: msg.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: msg.content ?? '',
    }));
  }

  /**
   * Map our ToolDefinition[] to the Anthropic tools format.
   */
  private toAnthropicTools(
    tools: ToolDefinition[],
  ): Array<{ name: string; description: string; input_schema: Record<string, unknown> }> {
    return tools.map((tool) => ({
      name: tool.function.name,
      description: tool.function.description,
      input_schema: tool.function.parameters,
    }));
  }

  private ensureInitialized(): void {
    if (this.client === null) {
      throw new Error(
        'AnthropicProvider has not been initialized. Call initialize() before making requests.',
      );
    }
  }
}
