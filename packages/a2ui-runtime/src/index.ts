// ---------------------------------------------------------------------------
// LLM Provider Abstraction (Issue #89)
// ---------------------------------------------------------------------------
export { LLMProvider } from './providers/base'
export { OpenAIProvider } from './providers/openai'
export { AnthropicProvider } from './providers/anthropic'
export { Runtime } from './runtime'
export type { RuntimeStatus } from './runtime'

export type {
  // Message types
  Message,
  MessageRole,
  // Tool / function-calling types
  ToolCall,
  ToolDefinition,
  // Completion types
  CompletionOptions,
  CompletionResponse,
  TokenUsage,
  FinishReason,
  // Streaming types
  StreamEvent,
  StreamEventStart,
  StreamEventDelta,
  StreamEventToolCallDelta,
  StreamEventComplete,
  StreamEventError,
  // Configuration types
  ProviderConfig,
  OpenAIProviderConfig,
  AnthropicProviderConfig,
  ProviderRegistration,
  RuntimeConfig,
} from './types'

// ---------------------------------------------------------------------------
// Legacy Adapter API (preserved for backward compatibility)
// ---------------------------------------------------------------------------
export { AnthropicAdapter } from './adapters/anthropic-adapter'
export { OpenAIAdapter } from './adapters/openai-adapter'
export { LLMAdapter } from './adapters/llm-adapter'
export type { AnthropicConfig } from './adapters/anthropic-adapter'
export type { OpenAIConfig } from './adapters/openai-adapter'
export type { RuntimeContext, GenerationOptions, StreamOptions, ChatMessage, ActionResult } from './types/runtime-types'
export type { Action } from './actions/action-registry'
export { ActionRegistry } from './actions/action-registry'
export { LLMProviderError, ActionExecutionError, ValidationError, RuntimeError } from './errors/runtime-errors'
