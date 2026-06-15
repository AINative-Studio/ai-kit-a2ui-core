/**
 * Core types for the @ainative/a2ui-runtime LLM provider abstraction.
 *
 * These types define the contract between the runtime and any LLM provider,
 * enabling a clean separation of concerns and easy provider swapping.
 */

// ---------------------------------------------------------------------------
// Message Types
// ---------------------------------------------------------------------------

/** Roles that can appear in a conversation message. */
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

/**
 * A single message in a conversation thread.
 * Supports both text content and tool-call results.
 */
export interface Message {
  /** The role of the message sender. */
  role: MessageRole;

  /** Text content of the message. Null when the message is a pure tool call. */
  content: string | null;

  /** Optional display name for the message sender. */
  name?: string;

  /** Tool calls requested by the assistant (populated by provider responses). */
  toolCalls?: ToolCall[];

  /** Identifier of the tool call this message is responding to. */
  toolCallId?: string;
}

// ---------------------------------------------------------------------------
// Tool / Function-calling Types
// ---------------------------------------------------------------------------

/** A tool call requested by the LLM. */
export interface ToolCall {
  /** Provider-assigned identifier for this tool call. */
  id: string;

  /** The type of tool (currently always 'function'). */
  type: 'function';

  /** Function call details. */
  function: {
    /** Name of the function to invoke. */
    name: string;

    /** JSON-encoded arguments string. */
    arguments: string;
  };
}

/** Definition of a tool that can be passed to the LLM. */
export interface ToolDefinition {
  /** The type of tool (currently always 'function'). */
  type: 'function';

  /** Function metadata. */
  function: {
    /** Unique function name. */
    name: string;

    /** Human-readable description for the LLM. */
    description: string;

    /** JSON Schema describing the function parameters. */
    parameters: Record<string, unknown>;
  };
}

// ---------------------------------------------------------------------------
// Completion Options
// ---------------------------------------------------------------------------

/**
 * Options controlling LLM completion behavior.
 * All fields are optional so callers only override what they need.
 */
export interface CompletionOptions {
  /** Model identifier (e.g. 'gpt-4o', 'claude-sonnet-4-20250514'). */
  model?: string;

  /** Sampling temperature (0 = deterministic, higher = more creative). */
  temperature?: number;

  /** Maximum number of tokens to generate. */
  maxTokens?: number;

  /** Nucleus sampling threshold. */
  topP?: number;

  /** Penalize tokens by their existing frequency in the text so far. */
  frequencyPenalty?: number;

  /** Penalize tokens that have already appeared in the text. */
  presencePenalty?: number;

  /** Sequences that will cause the model to stop generating. */
  stopSequences?: string[];

  /** Tools available for the model to call. */
  tools?: ToolDefinition[];

  /** Arbitrary provider-specific options (escape hatch). */
  providerOptions?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Completion Response
// ---------------------------------------------------------------------------

/** Token usage breakdown returned after a completion. */
export interface TokenUsage {
  /** Tokens consumed by the prompt / input. */
  promptTokens: number;

  /** Tokens generated in the completion / output. */
  completionTokens: number;

  /** Total tokens (prompt + completion). */
  totalTokens: number;
}

/** The finish reason reported by the provider. */
export type FinishReason = 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'error';

/**
 * A non-streaming completion response from the LLM.
 */
export interface CompletionResponse {
  /** Provider-assigned response identifier. */
  id: string;

  /** The model that produced this response. */
  model: string;

  /** The generated message. */
  message: Message;

  /** Why the model stopped generating. */
  finishReason: FinishReason;

  /** Token usage statistics. */
  usage: TokenUsage;
}

// ---------------------------------------------------------------------------
// Streaming Types
// ---------------------------------------------------------------------------

/** Discriminated union of events emitted during a streaming completion. */
export type StreamEvent =
  | StreamEventStart
  | StreamEventDelta
  | StreamEventToolCallDelta
  | StreamEventComplete
  | StreamEventError;

/** Emitted once at the beginning of a stream. */
export interface StreamEventStart {
  type: 'stream.start';

  /** Provider-assigned response identifier. */
  id: string;

  /** The model handling this stream. */
  model: string;
}

/** Emitted for each chunk of text content. */
export interface StreamEventDelta {
  type: 'stream.delta';

  /** The incremental text content. */
  content: string;
}

/** Emitted for incremental tool-call argument data. */
export interface StreamEventToolCallDelta {
  type: 'stream.tool_call.delta';

  /** Index of the tool call in the response (for parallel tool calls). */
  index: number;

  /** Tool call identifier (may only be present on the first delta). */
  toolCallId?: string;

  /** Function name (may only be present on the first delta). */
  functionName?: string;

  /** Incremental JSON arguments string. */
  argumentsDelta: string;
}

/** Emitted once when the stream finishes successfully. */
export interface StreamEventComplete {
  type: 'stream.complete';

  /** The fully assembled response message. */
  message: Message;

  /** Why the model stopped generating. */
  finishReason: FinishReason;

  /** Token usage statistics (if available from the provider). */
  usage?: TokenUsage;
}

/** Emitted if the stream encounters an error. */
export interface StreamEventError {
  type: 'stream.error';

  /** The error that occurred. */
  error: Error;
}

// ---------------------------------------------------------------------------
// Provider Configuration
// ---------------------------------------------------------------------------

/** Base configuration shared across all LLM providers. */
export interface ProviderConfig {
  /** API key for authentication. */
  apiKey: string;

  /** Base URL override (useful for proxies or self-hosted models). */
  baseURL?: string;

  /** Default model to use when none is specified in CompletionOptions. */
  defaultModel?: string;

  /** Request timeout in milliseconds. */
  timeoutMs?: number;

  /** Maximum number of automatic retries on transient failures. */
  maxRetries?: number;
}

/** Configuration specific to the OpenAI provider. */
export interface OpenAIProviderConfig extends ProviderConfig {
  /** OpenAI organization identifier. */
  organization?: string;
}

/** Configuration specific to the Anthropic provider. */
export interface AnthropicProviderConfig extends ProviderConfig {
  /** Anthropic API version header. */
  apiVersion?: string;
}

// ---------------------------------------------------------------------------
// Runtime Configuration
// ---------------------------------------------------------------------------

/** Registered provider entry in the runtime. */
export interface ProviderRegistration {
  /** Unique name for this provider registration. */
  name: string;

  /** The provider instance. */
  provider: import('./providers/base').LLMProvider;
}

/**
 * Configuration for the A2UI Runtime.
 */
export interface RuntimeConfig {
  /** The default provider name to use. */
  defaultProvider: string;

  /** Provider registrations. */
  providers: ProviderRegistration[];

  /** Global default completion options applied to every request. */
  defaultOptions?: Partial<CompletionOptions>;
}
