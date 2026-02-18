import type { Action } from '../actions/action-registry'

/**
 * Runtime context for request processing
 */
export interface RuntimeContext {
  /** Unique request identifier */
  requestId: string
  /** Request timestamp */
  timestamp: Date
  /** Registered actions available for execution */
  actions: Map<string, Action>
  /** Additional metadata for the request */
  metadata: Record<string, unknown>
}

/**
 * Chat message for conversation context
 */
export interface ChatMessage {
  /** Message role */
  role: 'system' | 'user' | 'assistant' | 'function'
  /** Message content */
  content: string | null
  /** Optional function/action name */
  name?: string
}

/**
 * Options for UI generation
 */
export interface GenerationOptions {
  /** LLM model to use */
  model?: string
  /** Temperature for randomness (0-2) */
  temperature?: number
  /** Maximum tokens to generate */
  maxTokens?: number
  /** Top-p nucleus sampling */
  topP?: number
  /** Frequency penalty */
  frequencyPenalty?: number
  /** Presence penalty */
  presencePenalty?: number
  /** Stop sequences */
  stopSequences?: string[]
}

/**
 * Options for streaming responses
 */
export interface StreamOptions {
  /** LLM model to use */
  model?: string
  /** Callback for each chunk */
  onChunk?: (chunk: string) => void
  /** Callback on completion */
  onComplete?: () => void
  /** Callback on error */
  onError?: (error: Error) => void
}

/**
 * Result of action execution
 */
export interface ActionResult {
  /** Whether action succeeded */
  success: boolean
  /** Action result data */
  data?: unknown
  /** Error message if failed */
  error?: string
}

/**
 * Runtime performance metrics
 */
export interface RuntimeMetrics {
  /** Request processing duration */
  duration: number
  /** Tokens used */
  tokens?: number
  /** Model used */
  model?: string
}

/**
 * Runtime request structure
 */
export interface RuntimeRequest {
  /** User prompt for UI generation */
  prompt: string
  /** Runtime context */
  context: RuntimeContext
  /** Generation options */
  options?: GenerationOptions
}

/**
 * Token usage metrics
 */
export interface TokenMetrics {
  /** Tokens used in prompt */
  prompt: number
  /** Tokens used in completion */
  completion: number
  /** Total tokens used */
  total: number
}

/**
 * Response metrics
 */
export interface ResponseMetrics {
  /** Token usage information */
  tokensUsed: TokenMetrics
  /** Latency in milliseconds */
  latencyMs: number
  /** LLM provider used */
  provider: string
}

/**
 * Error information
 */
export interface ErrorInfo {
  /** Error code */
  code: string
  /** Error message */
  message: string
  /** Additional error details */
  details?: unknown
}

/**
 * Runtime response structure
 */
export interface RuntimeResponse {
  /** Request ID this response is for */
  requestId: string
  /** Generated UI content */
  content: string
  /** Response status */
  status: 'success' | 'error'
  /** Response timestamp */
  timestamp: Date
  /** Error information (if status is 'error') */
  error?: ErrorInfo
  /** Response metrics */
  metrics: ResponseMetrics
}
