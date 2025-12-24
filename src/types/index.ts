/**
 * A2UI v0.9 Protocol Types
 */

// Component Types
export type {
  ComponentType,
  A2UIComponent,
  TypedA2UIComponent,
  ComponentProperties,
} from './components.js'

// Protocol Types
export type {
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
} from './protocol.js'

// Type Guards
export {
  isCreateSurfaceMessage,
  isUpdateComponentsMessage,
  isUpdateDataModelMessage,
  isDeleteSurfaceMessage,
  isUserActionMessage,
  isErrorMessage,
  isPingMessage,
  isPongMessage,
} from './protocol.js'
