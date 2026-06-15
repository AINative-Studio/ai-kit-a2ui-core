/**
 * A2UIRuntime - manages the LLM provider lifecycle and provides a unified
 * API surface for completions and streaming across providers.
 *
 * The runtime acts as a registry of named providers and routes requests
 * to the appropriate one. It owns the provider lifecycle (init / shutdown)
 * and merges global default options with per-request overrides.
 */

import type { LLMProvider } from './providers/base';
import type {
  Message,
  CompletionOptions,
  CompletionResponse,
  StreamEvent,
  RuntimeConfig,
} from './types';

/**
 * Runtime status for health-check / observability.
 */
export type RuntimeStatus = 'created' | 'initializing' | 'ready' | 'shutting_down' | 'stopped';

/**
 * The main runtime class for the @ainative/a2ui-runtime package.
 *
 * Usage:
 * ```ts
 * const runtime = new Runtime({
 *   defaultProvider: 'openai',
 *   providers: [
 *     { name: 'openai', provider: new OpenAIProvider({ apiKey: '...' }) },
 *     { name: 'anthropic', provider: new AnthropicProvider({ apiKey: '...' }) },
 *   ],
 * });
 *
 * await runtime.initialize();
 * const response = await runtime.complete([{ role: 'user', content: 'Hello' }]);
 * await runtime.shutdown();
 * ```
 */
export class Runtime {
  private providers = new Map<string, LLMProvider>();
  private defaultProviderName: string;
  private defaultOptions: Partial<CompletionOptions>;
  private _status: RuntimeStatus = 'created';

  constructor(config: RuntimeConfig) {
    this.defaultProviderName = config.defaultProvider;
    this.defaultOptions = config.defaultOptions ?? {};

    for (const registration of config.providers) {
      if (this.providers.has(registration.name)) {
        throw new Error(
          `Duplicate provider name "${registration.name}". Each provider registration must have a unique name.`,
        );
      }
      this.providers.set(registration.name, registration.provider);
    }

    if (!this.providers.has(this.defaultProviderName)) {
      throw new Error(
        `Default provider "${this.defaultProviderName}" is not registered. ` +
        `Available providers: ${[...this.providers.keys()].join(', ')}`,
      );
    }
  }

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  /** Current runtime status. */
  get status(): RuntimeStatus {
    return this._status;
  }

  /**
   * Initialise all registered providers. Must be called before making
   * any completion or streaming requests.
   */
  async initialize(): Promise<void> {
    if (this._status === 'ready') {
      return; // already initialised -- idempotent
    }

    this._status = 'initializing';

    const initPromises = [...this.providers.values()].map((provider) =>
      provider.initialize(),
    );

    await Promise.all(initPromises);
    this._status = 'ready';
  }

  /**
   * Shut down all registered providers, releasing any held resources.
   */
  async shutdown(): Promise<void> {
    if (this._status === 'stopped') {
      return; // already stopped -- idempotent
    }

    this._status = 'shutting_down';

    const shutdownPromises = [...this.providers.values()].map((provider) =>
      provider.shutdown(),
    );

    await Promise.all(shutdownPromises);
    this._status = 'stopped';
  }

  // -------------------------------------------------------------------------
  // Core API
  // -------------------------------------------------------------------------

  /**
   * Perform a non-streaming completion using the specified (or default)
   * provider.
   *
   * @param messages     - Conversation messages to send.
   * @param options      - Per-request option overrides.
   * @param providerName - Name of the provider to use (defaults to the
   *                       runtime's default provider).
   */
  async complete(
    messages: Message[],
    options?: CompletionOptions,
    providerName?: string,
  ): Promise<CompletionResponse> {
    this.ensureReady();
    const provider = this.resolveProvider(providerName);
    const mergedOptions = this.mergeOptions(options);
    return provider.complete(messages, mergedOptions);
  }

  /**
   * Perform a streaming completion using the specified (or default)
   * provider.
   *
   * @param messages     - Conversation messages to send.
   * @param options      - Per-request option overrides.
   * @param providerName - Name of the provider to use (defaults to the
   *                       runtime's default provider).
   */
  stream(
    messages: Message[],
    options?: CompletionOptions,
    providerName?: string,
  ): AsyncIterable<StreamEvent> {
    this.ensureReady();
    const provider = this.resolveProvider(providerName);
    const mergedOptions = this.mergeOptions(options);
    return provider.stream(messages, mergedOptions);
  }

  // -------------------------------------------------------------------------
  // Provider Management
  // -------------------------------------------------------------------------

  /**
   * Register an additional provider at runtime.
   *
   * If the runtime is already initialised the new provider's initialize()
   * method is called immediately.
   */
  async registerProvider(name: string, provider: LLMProvider): Promise<void> {
    if (this.providers.has(name)) {
      throw new Error(`Provider "${name}" is already registered.`);
    }

    this.providers.set(name, provider);

    if (this._status === 'ready') {
      await provider.initialize();
    }
  }

  /**
   * Remove a registered provider.
   *
   * The provider's shutdown() method is called before removal. The default
   * provider cannot be removed.
   */
  async removeProvider(name: string): Promise<boolean> {
    if (name === this.defaultProviderName) {
      throw new Error('Cannot remove the default provider.');
    }

    const provider = this.providers.get(name);
    if (!provider) {
      return false;
    }

    await provider.shutdown();
    return this.providers.delete(name);
  }

  /**
   * Get a registered provider by name.
   */
  getProvider(name: string): LLMProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * List the names of all registered providers.
   */
  listProviders(): string[] {
    return [...this.providers.keys()];
  }

  /**
   * Change the default provider.
   *
   * @throws If the new default is not registered.
   */
  setDefaultProvider(name: string): void {
    if (!this.providers.has(name)) {
      throw new Error(
        `Provider "${name}" is not registered. ` +
        `Available providers: ${[...this.providers.keys()].join(', ')}`,
      );
    }
    this.defaultProviderName = name;
  }

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  private resolveProvider(name?: string): LLMProvider {
    const providerName = name ?? this.defaultProviderName;
    const provider = this.providers.get(providerName);

    if (!provider) {
      throw new Error(
        `Provider "${providerName}" is not registered. ` +
        `Available providers: ${[...this.providers.keys()].join(', ')}`,
      );
    }

    return provider;
  }

  private mergeOptions(options?: CompletionOptions): CompletionOptions {
    if (!options) {
      return { ...this.defaultOptions } as CompletionOptions;
    }

    return {
      ...this.defaultOptions,
      ...options,
    };
  }

  private ensureReady(): void {
    if (this._status !== 'ready') {
      throw new Error(
        `Runtime is not ready (status: ${this._status}). Call initialize() first.`,
      );
    }
  }
}
