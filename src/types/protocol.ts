/**
 * A2UI v0.9 Protocol Message Definitions
 */

import type { A2UIComponent } from './components.js'

/**
 * All protocol message types
 */
export type MessageType =
  | 'createSurface'
  | 'updateComponents'
  | 'updateDataModel'
  | 'deleteSurface'
  | 'userAction'
  | 'clientAction'
  | 'clientActionResponse'
  | 'error'
  | 'ping'
  | 'pong'
  | 'fileUploadStart'
  | 'fileUploadProgress'
  | 'fileUploadComplete'
  | 'fileUploadError'
  | 'fileUploadCancel'
  | 'fileDelete'
  | 'fileDeleteComplete'
  | 'notificationCreate'
  | 'notificationCreated'
  | 'notificationUpdate'
  | 'notificationUpdated'
  | 'notificationDelete'
  | 'notificationDeleted'
  | 'notificationMarkAllRead'
  | 'notificationAllMarkedRead'
  | 'notificationDeleteAll'
  | 'notificationAllDeleted'
  | 'notificationAction'
  | 'notificationListRequest'
  | 'notificationListResponse'
  | 'notificationGetRequest'
  | 'notificationGetResponse'
  | 'notificationSettingsUpdate'
  | 'notificationSettingsUpdated'
  | 'notificationCount'
  | 'notificationSubscribe'
  | 'notificationUnsubscribe'
  | 'notificationError'

/**
 * Base message structure
 */
export interface BaseMessage {
  /** Message type */
  type: MessageType
  /** Optional message ID for tracking */
  id?: string
  /** Timestamp */
  timestamp?: number
}

/**
 * Create Surface Message (Agent → UI)
 * Initializes a new UI surface with components and data model
 */
export interface CreateSurfaceMessage extends BaseMessage {
  type: 'createSurface'
  /** Surface identifier */
  surfaceId: string
  /** Initial components */
  components: A2UIComponent[]
  /** Initial data model */
  dataModel?: Record<string, unknown>
  /** Optional metadata */
  metadata?: Record<string, unknown>
}

/**
 * Update Components Message (Agent → UI)
 * Updates existing components or adds new ones
 */
export interface UpdateComponentsMessage extends BaseMessage {
  type: 'updateComponents'
  /** Surface identifier */
  surfaceId: string
  /** Component updates */
  updates: ComponentUpdate[]
}

export interface ComponentUpdate {
  /** Component ID to update */
  id: string
  /** Operation type */
  operation: 'add' | 'update' | 'remove'
  /** New/updated component (for add/update) */
  component?: A2UIComponent
}

/**
 * Update Data Model Message (Agent → UI)
 * Updates the data model using JSON Pointer paths
 */
export interface UpdateDataModelMessage extends BaseMessage {
  type: 'updateDataModel'
  /** Surface identifier */
  surfaceId: string
  /** Data updates */
  updates: DataUpdate[]
}

export interface DataUpdate {
  /** JSON Pointer path (RFC 6901) */
  path: string
  /** Operation type */
  operation: 'set' | 'remove'
  /** New value (for set operation) */
  value?: unknown
}

/**
 * Delete Surface Message (Agent → UI)
 * Removes an entire UI surface
 */
export interface DeleteSurfaceMessage extends BaseMessage {
  type: 'deleteSurface'
  /** Surface identifier */
  surfaceId: string
}

/**
 * User Action Message (UI → Agent)
 * Sent when user interacts with UI
 */
export interface UserActionMessage extends BaseMessage {
  type: 'userAction'
  /** Surface identifier */
  surfaceId: string
  /** Action name */
  action: string
  /** Component that triggered action */
  componentId?: string
  /** Action context data */
  context?: Record<string, unknown>
  /** Current data model snapshot */
  dataModel?: Record<string, unknown>
}

/**
 * Error Message (Bidirectional)
 * Communicates errors
 */
export interface ErrorMessage extends BaseMessage {
  type: 'error'
  /** Error code */
  code: string
  /** Error message */
  message: string
  /** Optional error details */
  details?: unknown
}

/**
 * Ping Message (Bidirectional)
 * Keep-alive ping
 */
export interface PingMessage extends BaseMessage {
  type: 'ping'
}

/**
 * Pong Message (Bidirectional)
 * Keep-alive pong
 */
export interface PongMessage extends BaseMessage {
  type: 'pong'
}

/**
 * Union of all message types
 */
export type A2UIMessage =
  | CreateSurfaceMessage
  | UpdateComponentsMessage
  | UpdateDataModelMessage
  | DeleteSurfaceMessage
  | UserActionMessage
  | ErrorMessage
  | PingMessage
  | PongMessage

/**
 * Type guards for message discrimination
 */
export function isCreateSurfaceMessage(msg: A2UIMessage): msg is CreateSurfaceMessage {
  return msg.type === 'createSurface'
}

export function isUpdateComponentsMessage(msg: A2UIMessage): msg is UpdateComponentsMessage {
  return msg.type === 'updateComponents'
}

export function isUpdateDataModelMessage(msg: A2UIMessage): msg is UpdateDataModelMessage {
  return msg.type === 'updateDataModel'
}

export function isDeleteSurfaceMessage(msg: A2UIMessage): msg is DeleteSurfaceMessage {
  return msg.type === 'deleteSurface'
}

export function isUserActionMessage(msg: A2UIMessage): msg is UserActionMessage {
  return msg.type === 'userAction'
}

export function isErrorMessage(msg: A2UIMessage): msg is ErrorMessage {
  return msg.type === 'error'
}

export function isPingMessage(msg: A2UIMessage): msg is PingMessage {
  return msg.type === 'ping'
}

export function isPongMessage(msg: A2UIMessage): msg is PongMessage {
  return msg.type === 'pong'
}

export function isClientActionMessage(msg: unknown): msg is { type: 'clientAction' } {
  return typeof msg === 'object' && msg !== null && (msg as { type: string }).type === 'clientAction'
}

export function isClientActionResponseMessage(msg: unknown): msg is { type: 'clientActionResponse' } {
  return typeof msg === 'object' && msg !== null && (msg as { type: string }).type === 'clientActionResponse'
}
