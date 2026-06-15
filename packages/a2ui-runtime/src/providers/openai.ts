/**
 * OpenAI provider implementation for the A2UI runtime.
 *
 * This is a structural stub that satisfies the LLMProvider contract.
 * The actual HTTP calls to the OpenAI API should be wired up when the
 * `openai` SDK is available as a peer dependency.
 */

import { LLMProvider } from './base';
import type {
  Message,
  CompletionOptions,
  CompletionResponse,
  StreamEvent,
  OpenAIProviderConfig,
  ToolDefinition,
} from '../types';

/** Models known to be supported by OpenAI. */
const OPENAI_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
  'gpt-4',
  'gpt-3.5-turbo',
  'o1',
  'o1-mini',
  'o1-pro',
  'o3',
  'o3-mini',
] as const;

/**
 * OpenAI LLM provider.
 *
 * Usage:
 * ```ts
 * const openai = new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY });
 * const response = await openai.complete([{ role: 'user', content: 'Hello' }]);
 * ```
 */
export class OpenAIProvider extends LLMProvider<OpenAIProviderConfig> {
  readonly name = 'openai' as const;

  /**
   * Lazily-resolved OpenAI client instance.
   * Set during initialize() or on first use.
   */
  private client: unknown = null;

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  override async initialize(): Promise<void> {
    // In a full implementation this would dynamically import the openai
    // package and instantiate the client:
    //
    // const { default: OpenAI } = await import('openai');
    // this.client = new OpenAI({
    //   apiKey: this.config.apiKey,
    //   organization: this.config.organization,
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
    // this.client.chat.completions.create({ ... })
    // and map the response to our CompletionResponse type.

    const _openAIMessages = this.toOpenAIMessages(messages);
    const _tools = options?.tools ? this.toOpenAITools(options.tools) : undefined;

    return {
      id: `openai-${Date.now()}`,
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
      id: `openai-stream-${Date.now()}`,
      model,
    };

    // Stub: In a real implementation this would call
    // this.client.chat.completions.create({ ..., stream: true })
    // and yield StreamEventDelta / StreamEventToolCallDelta events
    // for each SSE chunk received.

    const _openAIMessages = this.toOpenAIMessages(messages);

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
    return [...OPENAI_MODELS];
  }

  protected getFallbackModel(): string {
    return 'gpt-4o';
  }

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  /**
   * Map our provider-agnostic Message[] to the shape the OpenAI SDK expects.
   */
  private toOpenAIMessages(
    messages: Message[],
  ): Array<{ role: string; content: string | null; name?: string; tool_call_id?: string }> {
    return messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
      ...(msg.name ? { name: msg.name } : {}),
      ...(msg.toolCallId ? { tool_call_id: msg.toolCallId } : {}),
    }));
  }

  /**
   * Map our ToolDefinition[] to the OpenAI tools format.
   */
  private toOpenAITools(
    tools: ToolDefinition[],
  ): Array<{ type: string; function: { name: string; description: string; parameters: Record<string, unknown> } }> {
    return tools.map((tool) => ({
      type: tool.type,
      function: {
        name: tool.function.name,
        description: tool.function.description,
        parameters: tool.function.parameters,
      },
    }));
  }

  private ensureInitialized(): void {
    if (this.client === null) {
      throw new Error(
        'OpenAIProvider has not been initialized. Call initialize() before making requests.',
      );
    }
  }
}
