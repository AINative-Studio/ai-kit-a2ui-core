/**
 * Abstract base provider interface for LLM integrations.
 *
 * Every LLM provider (OpenAI, Anthropic, etc.) must implement this interface
 * so the runtime can interact with it in a provider-agnostic way.
 */

import type {
  Message,
  CompletionOptions,
  CompletionResponse,
  StreamEvent,
  ProviderConfig,
} from '../types';

/**
 * LLMProvider defines the contract that all provider implementations must
 * satisfy. It intentionally uses simple, framework-agnostic primitives
 * (Promise, AsyncIterable) so consumers are not coupled to any specific
 * streaming library.
 */
export abstract class LLMProvider<TConfig extends ProviderConfig = ProviderConfig> {
  /** Human-readable provider identifier (e.g. 'openai', 'anthropic'). */
  abstract readonly name: string;

  /** The configuration this provider was initialised with. */
  protected readonly config: TConfig;

  constructor(config: TConfig) {
    this.config = config;
  }

  // -------------------------------------------------------------------------
  // Core API
  // -------------------------------------------------------------------------

  /**
   * Perform a non-streaming completion.
   *
   * @param messages - The conversation history to send to the model.
   * @param options  - Optional overrides for this single request.
   * @returns A promise that resolves to the full completion response.
   */
  abstract complete(
    messages: Message[],
    options?: CompletionOptions,
  ): Promise<CompletionResponse>;

  /**
   * Perform a streaming completion.
   *
   * Returns an AsyncIterable of StreamEvent objects so the caller can
   * process incremental content, tool-call deltas, and completion signals
   * as they arrive.
   *
   * @param messages - The conversation history to send to the model.
   * @param options  - Optional overrides for this single request.
   * @returns An async iterable of stream events.
   */
  abstract stream(
    messages: Message[],
    options?: CompletionOptions,
  ): AsyncIterable<StreamEvent>;

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  /**
   * Initialise any resources the provider needs (HTTP clients, connection
   * pools, etc.). Called by the runtime before the first request.
   *
   * The default implementation is a no-op; providers override as needed.
   */
  async initialize(): Promise<void> {
    // No-op by default.
  }

  /**
   * Release resources held by the provider (close sockets, flush buffers,
   * etc.). Called by the runtime during shutdown.
   *
   * The default implementation is a no-op; providers override as needed.
   */
  async shutdown(): Promise<void> {
    // No-op by default.
  }

  // -------------------------------------------------------------------------
  // Introspection
  // -------------------------------------------------------------------------

  /**
   * Return the list of model identifiers this provider supports.
   *
   * Providers that cannot enumerate models at construction time may return
   * an empty array.
   */
  listModels(): string[] {
    return [];
  }

  /**
   * Return the default model for this provider, as configured or as a
   * built-in fallback.
   */
  getDefaultModel(): string {
    return this.config.defaultModel ?? this.getFallbackModel();
  }

  /**
   * Provider-specific fallback model used when no default is configured.
   * Each concrete provider must supply this.
   */
  protected abstract getFallbackModel(): string;
}
