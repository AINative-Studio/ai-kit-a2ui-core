/**
 * CoAgent Hook Types
 * Bidirectional state synchronization between React UI and AI agents
 */

/**
 * Transport interface for sending/receiving messages
 */
export interface CoAgentTransport {
  send: (message: unknown) => void
  on: (event: string, handler: (data: unknown) => void) => void
  off: (event: string, handler: (data: unknown) => void) => void
  isConnected?: () => boolean
}

/**
 * Conflict resolution strategies
 */
export type ConflictResolution = 'client-wins' | 'agent-wins' | 'last-write-wins' | 'manual'

/**
 * Sync direction
 */
export type SyncDirection = 'client-to-agent' | 'agent-to-client'

/**
 * State conflict information
 */
export interface StateConflict<T> {
  clientState: T
  agentState: T
  clientVersion: number
  agentVersion: number
  timestamp: number
}

/**
 * Error codes for CoAgent operations
 */
export type CoAgentErrorCode =
  | 'SEND_ERROR'
  | 'AGENT_UPDATE_ERROR'
  | 'STATE_CONFLICT'
  | 'VALIDATION_ERROR'
  | 'TRANSFORM_ERROR'
  | 'NETWORK_ERROR'

/**
 * CoAgent error object
 */
export interface CoAgentError {
  code: CoAgentErrorCode
  message: string
  details?: unknown
  timestamp: number
}

/**
 * CoAgent hook options
 */
export interface CoAgentOptions<T> {
  /** Transport layer for communication */
  transport: CoAgentTransport

  /** Use optimistic updates */
  optimistic?: boolean

  /** Conflict resolution strategy */
  conflictResolution?: ConflictResolution

  /** Resync state on reconnect */
  resyncOnReconnect?: boolean

  /** Debounce delay for state updates (ms) */
  debounce?: number

  /** Throttle delay for incoming updates (ms) */
  throttle?: number

  /** Retry failed sends */
  retryOnError?: boolean

  /** Max retry attempts */
  maxRetries?: number

  /** State validation function */
  validate?: (state: T) => boolean

  /** Transform state before applying */
  transform?: (state: T) => T

  /** Custom middleware for state updates */
  middleware?: (next: (state: T) => void, state: T) => void

  /** Custom serialization */
  serialize?: (state: T) => string

  /** Custom deserialization */
  deserialize?: (data: string) => T

  /** State change callback */
  onChange?: (newState: T, prevState: T) => void

  /** Sync callback */
  onSync?: (direction: SyncDirection, state: T) => void

  /** Conflict callback */
  onConflict?: (conflict: StateConflict<T>) => void

  /** Reconnect callback */
  onReconnect?: () => void

  /** Error callback */
  onError?: (error: CoAgentError) => void
}

/**
 * CoAgent hook return interface
 */
export interface CoAgentHook<T> {
  /** Current state */
  state: T

  /** Update state and sync to agent */
  setState: (newState: T | ((prevState: T) => T)) => void

  /** Connection status */
  isConnected: boolean

  /** Current error */
  error: CoAgentError | null

  /** State version number */
  version: number

  /** Manually trigger resync */
  resync: () => void

  /** Clear current error */
  clearError: () => void
}
