/**
 * A2UI React Package Type Definitions
 */

// Re-export all types from core package
import type {
  // Component types
  ComponentType as CoreComponentType,
  A2UIComponent as CoreA2UIComponent,
  TypedA2UIComponent,
  ComponentProperties,
  // Protocol types
  MessageType,
  BaseMessage,
  CreateSurfaceMessage,
  UpdateComponentsMessage,
  ComponentUpdate,
  UpdateDataModelMessage,
  DataUpdate,
  DeleteSurfaceMessage,
  UserActionMessage as CoreUserActionMessage,
  ErrorMessage,
  PingMessage,
  PongMessage,
  A2UIMessage,
  // Client action types
  ClientActionType,
  ClientActionMessage,
  ClientActionResponseMessage,
} from '@ainative/ai-kit-a2ui-core/types'

import type {
  TransportStatus,
  TransportOptions,
  EventHandler,
} from '@ainative/ai-kit-a2ui-core/transport'

// Re-export with proper names
export type {
  CoreComponentType as ComponentType,
  CoreA2UIComponent as A2UIComponent,
  TypedA2UIComponent,
  ComponentProperties,
  MessageType,
  BaseMessage,
  CreateSurfaceMessage,
  UpdateComponentsMessage,
  ComponentUpdate,
  UpdateDataModelMessage,
  DataUpdate,
  DeleteSurfaceMessage,
  CoreUserActionMessage as UserActionMessage,
  ErrorMessage,
  PingMessage,
  PongMessage,
  A2UIMessage,
  ClientActionType,
  ClientActionMessage,
  ClientActionResponseMessage,
  TransportStatus,
  TransportOptions,
  EventHandler,
}

// Export CoAgent types
export type {
  CoAgentTransport,
  ConflictResolution,
  SyncDirection,
  StateConflict,
  CoAgentErrorCode,
  CoAgentError,
  CoAgentOptions,
  CoAgentHook,
} from './coagent.js'

// React-specific types

/**
 * Surface ID type
 */
export type SurfaceId = string

/**
 * Data model type (JSON-compatible)
 */
export type DataModel = Record<string, unknown>

/**
 * Surface with components and data model
 */
export interface Surface {
  surfaceId: SurfaceId
  components: CoreA2UIComponent[]
  dataModel?: DataModel
}

/**
 * A2UI Context value provided by A2UIProvider
 */
export interface A2UIContextValue {
  /** Transport instance for communication */
  transport: A2UITransport
  /** All active surfaces */
  surfaces: Map<SurfaceId, Surface>
  /** Connection status */
  isConnected: boolean
  /** Get a specific surface by ID */
  getSurface: (surfaceId: SurfaceId) => Surface | undefined
  /** Get a specific component */
  getComponent: (surfaceId: SurfaceId, componentId: string) => CoreA2UIComponent | undefined
}

/**
 * A2UIProvider component props
 */
export interface A2UIProviderProps {
  /** WebSocket URL for agent connection */
  url: string
  /** Transport options */
  options?: TransportOptions
  /** Auto-connect on mount */
  autoConnect?: boolean
  /** Children components */
  children: React.ReactNode
  /** Error callback */
  onError?: (error: Error) => void
  /** Connection callback */
  onConnect?: () => void
  /** Disconnection callback */
  onDisconnect?: () => void
}

/**
 * useA2UIAgent hook return type
 */
export interface UseA2UIAgentReturn {
  surfaces: Map<SurfaceId, Surface>
  send: (action: Omit<CoreUserActionMessage, 'type'>) => void
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  isConnected: boolean
  isConnecting: boolean
  error: Error | null
}

/**
 * useA2UIState hook return type
 */
export interface UseA2UIStateReturn<T = unknown> {
  /** Current value at the JSON pointer path */
  value: T | undefined
  /** Loading state */
  isLoading: boolean
  /** Error state */
  error: Error | null
  /** Manually refresh the value */
  refresh: () => void
}

/**
 * useA2UIAction hook return type
 */
export interface UseA2UIActionReturn {
  /** Execute a user action */
  executeAction: (componentId: string, event: string, data?: Record<string, unknown>) => void
  /** Action loading state */
  isLoading: boolean
  /** Action error */
  error: Error | null
  /** Clear error */
  clearError: () => void
}

/**
 * Re-import A2UITransport from core
 */
import type { A2UITransport as CoreA2UITransport } from '@ainative/ai-kit-a2ui-core/transport'
export type A2UITransport = CoreA2UITransport
