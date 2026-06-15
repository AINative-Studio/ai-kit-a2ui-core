/**
 * @ainative/a2ui-react
 *
 * React bindings for the A2UI protocol. Provides a context provider,
 * base and specialized hooks, and TypeScript types for building
 * AI-agent-driven UIs in React.
 *
 * @example
 * ```tsx
 * import { A2UIProvider, useA2UI } from '@ainative/a2ui-react'
 *
 * function App() {
 *   return (
 *     <A2UIProvider url="wss://api.example.com/agent" autoConnect>
 *       <Dashboard />
 *     </A2UIProvider>
 *   )
 * }
 *
 * function Dashboard() {
 *   const { isConnected, surfaces } = useA2UI()
 *   return <div>{isConnected ? 'Connected' : 'Connecting...'}</div>
 * }
 * ```
 */

// Context provider and context accessor
export { A2UIProvider, A2UIContext, useA2UIContext } from './context/index.js'

// Hooks
export { useA2UI } from './hooks/useA2UI.js'
export { useA2UIAgent } from './hooks/useA2UIAgent.js'
export { useA2UIState } from './hooks/useA2UIState.js'
export { useA2UIAction } from './hooks/useA2UIAction.js'
export { useCoAgent } from './hooks/useCoAgent.js'
export { useHumanInTheLoop } from './hooks/useHumanInTheLoop.js'

// Core types
export type {
  // Context / provider
  A2UIContextValue,
  A2UIProviderProps,
  SurfaceId,
  DataModel,
  Surface,
  A2UITransport,
  // Protocol messages
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
  // Hook return types
  UseA2UIStateReturn,
  UseA2UIActionReturn,
} from './types/index.js'

export type {
  UseA2UIAgentOptions,
  UseA2UIAgentReturn,
} from './hooks/useA2UIAgent.js'

export type {
  PendingApproval,
  UseHumanInTheLoopReturn,
} from './hooks/useHumanInTheLoop.js'

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
} from './types/coagent.js'
