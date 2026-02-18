/**
 * Base error class for A2UI Runtime errors
 */
export class RuntimeError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'RuntimeError'
  }
}

/**
 * Error specific to LLM provider failures
 */
export class LLMProviderError extends RuntimeError {
  constructor(
    message: string,
    public provider: string,
    public status?: number
  ) {
    super(message, 'LLM_PROVIDER_ERROR', { provider, status })
    this.name = 'LLMProviderError'
  }
}

/**
 * Error for action execution failures
 */
export class ActionExecutionError extends RuntimeError {
  constructor(
    message: string,
    public actionName: string,
    details?: unknown
  ) {
    super(message, 'ACTION_EXECUTION_ERROR', { actionName, ...details })
    this.name = 'ActionExecutionError'
  }
}

/**
 * Error for validation failures
 */
export class ValidationError extends RuntimeError {
  constructor(
    message: string,
    public field?: string,
    details?: unknown
  ) {
    super(message, 'VALIDATION_ERROR', { field, ...details })
    this.name = 'ValidationError'
  }
}
