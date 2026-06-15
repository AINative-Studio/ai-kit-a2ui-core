/**
 * @ainative/a2ui-react - Core TypeScript types and interfaces
 *
 * Re-exports all public types from the package's internal type modules.
 * Import from this file for the canonical type surface of the package.
 */

// Core context and provider types
export type {
  A2UIContextValue,
  A2UIProviderProps,
  SurfaceId,
  DataModel,
  Surface,
  A2UITransport,
} from './types/index.js'

// Protocol / message types (re-exported from core)
export type {
  ComponentType,
  A2UIComponent,
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
  UserActionMessage,
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
} from './types/index.js'

// Hook return types
export type {
  UseA2UIAgentReturn,
  UseA2UIStateReturn,
  UseA2UIActionReturn,
} from './types/index.js'

// CoAgent types
export type {
  CoAgentTransport,
  ConflictResolution,
  SyncDirection,
  StateConflict,
  CoAgentErrorCode,
  CoAgentError,
  CoAgentOptions,
  CoAgentHook,
} from './types/index.js'
