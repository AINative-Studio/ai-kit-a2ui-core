/**
 * Notification Message Types for A2UI v0.9
 * Messages for notification operations, CRUD, real-time updates, and settings
 */

import type { BaseMessage } from './protocol.js'
import type {
  NotificationType,
  NotificationPriority,
  NotificationCategory,
  NotificationAction,
  NotificationRichContent,
  NotificationSettings,
} from './notification-components.js'

/**
 * Notification data structure for messages
 */
export interface NotificationData {
  /** Notification unique identifier */
  id: string
  /** Notification type */
  type: NotificationType
  /** Priority level */
  priority: NotificationPriority
  /** Notification title */
  title: string
  /** Notification message */
  message: string
  /** Timestamp (milliseconds since epoch) */
  timestamp: number
  /** Read status */
  read?: boolean
  /** Action buttons */
  actions?: NotificationAction[]
  /** Rich content */
  richContent?: NotificationRichContent
  /** Category */
  category?: NotificationCategory
  /** Dismissible */
  dismissible?: boolean
  /** Avatar image URL */
  avatar?: string
  /** Sender name */
  sender?: string
  /** Link URL */
  link?: string
  /** Expiration timestamp */
  expiresAt?: number
  /** Additional metadata */
  metadata?: Record<string, unknown>
}

/**
 * Partial notification data for updates
 */
export interface NotificationUpdateData {
  /** Notification identifier */
  id: string
  /** Updated read status */
  read?: boolean
  /** Updated actions */
  actions?: NotificationAction[]
  /** Updated metadata */
  metadata?: Record<string, unknown>
}

/**
 * Notification filters for querying
 */
export interface NotificationFilters {
  /** Filter by type */
  type?: NotificationType[]
  /** Filter by priority */
  priority?: NotificationPriority[]
  /** Filter by category */
  category?: NotificationCategory[]
  /** Filter by read status */
  read?: boolean
  /** Filter by date range - start */
  startDate?: number
  /** Filter by date range - end */
  endDate?: number
  /** Filter by sender */
  sender?: string
  /** Search query (title, message) */
  query?: string
}

/**
 * Notification list item (lightweight for lists)
 */
export interface NotificationListItem {
  /** Notification identifier */
  id: string
  /** Notification type */
  type: NotificationType
  /** Priority */
  priority: NotificationPriority
  /** Title */
  title: string
  /** Message preview (truncated) */
  message: string
  /** Timestamp */
  timestamp: number
  /** Read status */
  read: boolean
  /** Category */
  category?: NotificationCategory
  /** Avatar */
  avatar?: string
  /** Sender */
  sender?: string
}

/**
 * Notification Create Message (Agent → UI)
 * Creates a new notification
 */
export interface NotificationCreateMessage extends BaseMessage {
  type: 'notificationCreate'
  /** Surface identifier */
  surfaceId: string
  /** Component identifier */
  componentId: string
  /** Notification data */
  notification: NotificationData
}

/**
 * Notification Created Message (UI → Agent)
 * Confirms notification was created
 */
export interface NotificationCreatedMessage extends BaseMessage {
  type: 'notificationCreated'
  /** Surface identifier */
  surfaceId: string
  /** Component identifier */
  componentId: string
  /** Notification identifier */
  notificationId: string
  /** Success status */
  success: boolean
}

/**
 * Notification Update Message (Agent → UI or UI → Agent)
 * Updates existing notification
 */
export interface NotificationUpdateMessage extends BaseMessage {
  type: 'notificationUpdate'
  /** Surface identifier */
  surfaceId: string
  /** Component identifier */
  componentId: string
  /** Update data */
  update: NotificationUpdateData
}

/**
 * Notification Updated Message (UI → Agent)
 * Confirms notification was updated
 */
export interface NotificationUpdatedMessage extends BaseMessage {
  type: 'notificationUpdated'
  /** Surface identifier */
  surfaceId: string
  /** Component identifier */
  componentId: string
  /** Notification identifier */
  notificationId: string
  /** Success status */
  success: boolean
}

/**
 * Notification Delete Message (UI → Agent)
 * Deletes a notification
 */
export interface NotificationDeleteMessage extends BaseMessage {
  type: 'notificationDelete'
  /** Surface identifier */
  surfaceId: string
  /** Component identifier */
  componentId: string
  /** Notification identifier */
  notificationId: string
}

/**
 * Notification Deleted Message (Agent → UI)
 * Confirms notification was deleted
 */
export interface NotificationDeletedMessage extends BaseMessage {
  type: 'notificationDeleted'
  /** Surface identifier */
  surfaceId: string
  /** Component identifier */
  componentId: string
  /** Notification identifier */
  notificationId: string
  /** Success status */
  success: boolean
}

/**
 * Notification Mark All Read Message (UI → Agent)
 * Marks all notifications as read
 */
export interface NotificationMarkAllReadMessage extends BaseMessage {
  type: 'notificationMarkAllRead'
  /** Surface identifier */
  surfaceId: string
  /** Component identifier */
  componentId: string
  /** Optional filters (mark only filtered notifications) */
  filters?: NotificationFilters
}

/**
 * Notification All Marked Read Message (Agent → UI)
 * Confirms all notifications were marked as read
 */
export interface NotificationAllMarkedReadMessage extends BaseMessage {
  type: 'notificationAllMarkedRead'
  /** Surface identifier */
  surfaceId: string
  /** Component identifier */
  componentId: string
  /** Number of notifications marked */
  count: number
  /** Success status */
  success: boolean
}

/**
 * Notification Delete All Message (UI → Agent)
 * Deletes all notifications
 */
export interface NotificationDeleteAllMessage extends BaseMessage {
  type: 'notificationDeleteAll'
  /** Surface identifier */
  surfaceId: string
  /** Component identifier */
  componentId: string
  /** Optional filters (delete only filtered notifications) */
  filters?: NotificationFilters
}

/**
 * Notification All Deleted Message (Agent → UI)
 * Confirms all notifications were deleted
 */
export interface NotificationAllDeletedMessage extends BaseMessage {
  type: 'notificationAllDeleted'
  /** Surface identifier */
  surfaceId: string
  /** Component identifier */
  componentId: string
  /** Number of notifications deleted */
  count: number
  /** Success status */
  success: boolean
}

/**
 * Notification Action Message (UI → Agent)
 * User clicked an action button
 */
export interface NotificationActionMessage extends BaseMessage {
  type: 'notificationAction'
  /** Surface identifier */
  surfaceId: string
  /** Component identifier */
  componentId: string
  /** Notification identifier */
  notificationId: string
  /** Action identifier */
  actionId: string
  /** Action handler path */
  action: string
}

/**
 * Notification List Request Message (UI → Agent)
 * Requests list of notifications
 */
export interface NotificationListRequestMessage extends BaseMessage {
  type: 'notificationListRequest'
  /** Surface identifier */
  surfaceId: string
  /** Component identifier */
  componentId: string
  /** Filters */
  filters?: NotificationFilters
  /** Limit (default: 50) */
  limit?: number
  /** Offset for pagination (default: 0) */
  offset?: number
  /** Sort order */
  sortOrder?: 'asc' | 'desc'
}

/**
 * Notification List Response Message (Agent → UI)
 * Returns list of notifications
 */
export interface NotificationListResponseMessage extends BaseMessage {
  type: 'notificationListResponse'
  /** Surface identifier */
  surfaceId: string
  /** Component identifier */
  componentId: string
  /** Notifications */
  notifications: NotificationListItem[]
  /** Total count (before pagination) */
  totalCount: number
  /** Unread count */
  unreadCount: number
  /** Has more results */
  hasMore: boolean
}

/**
 * Notification Get Request Message (UI → Agent)
 * Requests single notification details
 */
export interface NotificationGetRequestMessage extends BaseMessage {
  type: 'notificationGetRequest'
  /** Surface identifier */
  surfaceId: string
  /** Component identifier */
  componentId: string
  /** Notification identifier */
  notificationId: string
}

/**
 * Notification Get Response Message (Agent → UI)
 * Returns single notification details
 */
export interface NotificationGetResponseMessage extends BaseMessage {
  type: 'notificationGetResponse'
  /** Surface identifier */
  surfaceId: string
  /** Component identifier */
  componentId: string
  /** Notification data */
  notification: NotificationData | null
  /** Success status */
  success: boolean
}

/**
 * Notification Settings Update Message (UI → Agent)
 * Updates notification settings
 */
export interface NotificationSettingsUpdateMessage extends BaseMessage {
  type: 'notificationSettingsUpdate'
  /** Surface identifier */
  surfaceId: string
  /** Component identifier */
  componentId: string
  /** Settings to update */
  settings: Partial<NotificationSettings>
}

/**
 * Notification Settings Updated Message (Agent → UI)
 * Confirms settings were updated
 */
export interface NotificationSettingsUpdatedMessage extends BaseMessage {
  type: 'notificationSettingsUpdated'
  /** Surface identifier */
  surfaceId: string
  /** Component identifier */
  componentId: string
  /** Updated settings */
  settings: NotificationSettings
  /** Success status */
  success: boolean
}

/**
 * Notification Count Message (Agent → UI)
 * Real-time notification count update
 */
export interface NotificationCountMessage extends BaseMessage {
  type: 'notificationCount'
  /** Surface identifier */
  surfaceId: string
  /** Component identifier */
  componentId: string
  /** Unread count */
  unreadCount: number
  /** Total count */
  totalCount: number
}

/**
 * Notification Subscribe Message (UI → Agent)
 * Subscribe to real-time notification updates
 */
export interface NotificationSubscribeMessage extends BaseMessage {
  type: 'notificationSubscribe'
  /** Surface identifier */
  surfaceId: string
  /** Component identifier */
  componentId: string
  /** Filters for subscription */
  filters?: NotificationFilters
}

/**
 * Notification Unsubscribe Message (UI → Agent)
 * Unsubscribe from real-time notification updates
 */
export interface NotificationUnsubscribeMessage extends BaseMessage {
  type: 'notificationUnsubscribe'
  /** Surface identifier */
  surfaceId: string
  /** Component identifier */
  componentId: string
}

/**
 * Notification Error Message (Agent → UI)
 * Error during notification operation
 */
export interface NotificationErrorMessage extends BaseMessage {
  type: 'notificationError'
  /** Surface identifier */
  surfaceId: string
  /** Component identifier */
  componentId: string
  /** Error message */
  error: string
  /** Error code */
  errorCode: 'NOT_FOUND' | 'PERMISSION_DENIED' | 'INVALID_DATA' | 'SERVER_ERROR' | 'RATE_LIMITED'
  /** Optional error details */
  details?: unknown
}

/**
 * Union of all notification message types
 */
export type NotificationMessage =
  | NotificationCreateMessage
  | NotificationCreatedMessage
  | NotificationUpdateMessage
  | NotificationUpdatedMessage
  | NotificationDeleteMessage
  | NotificationDeletedMessage
  | NotificationMarkAllReadMessage
  | NotificationAllMarkedReadMessage
  | NotificationDeleteAllMessage
  | NotificationAllDeletedMessage
  | NotificationActionMessage
  | NotificationListRequestMessage
  | NotificationListResponseMessage
  | NotificationGetRequestMessage
  | NotificationGetResponseMessage
  | NotificationSettingsUpdateMessage
  | NotificationSettingsUpdatedMessage
  | NotificationCountMessage
  | NotificationSubscribeMessage
  | NotificationUnsubscribeMessage
  | NotificationErrorMessage

/**
 * Type guards for message discrimination
 */
export function isNotificationCreateMessage(msg: unknown): msg is NotificationCreateMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'notificationCreate'
}

export function isNotificationCreatedMessage(msg: unknown): msg is NotificationCreatedMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'notificationCreated'
}

export function isNotificationUpdateMessage(msg: unknown): msg is NotificationUpdateMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'notificationUpdate'
}

export function isNotificationUpdatedMessage(msg: unknown): msg is NotificationUpdatedMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'notificationUpdated'
}

export function isNotificationDeleteMessage(msg: unknown): msg is NotificationDeleteMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'notificationDelete'
}

export function isNotificationDeletedMessage(msg: unknown): msg is NotificationDeletedMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'notificationDeleted'
}

export function isNotificationMarkAllReadMessage(msg: unknown): msg is NotificationMarkAllReadMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'notificationMarkAllRead'
}

export function isNotificationAllMarkedReadMessage(msg: unknown): msg is NotificationAllMarkedReadMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'notificationAllMarkedRead'
}

export function isNotificationDeleteAllMessage(msg: unknown): msg is NotificationDeleteAllMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'notificationDeleteAll'
}

export function isNotificationAllDeletedMessage(msg: unknown): msg is NotificationAllDeletedMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'notificationAllDeleted'
}

export function isNotificationActionMessage(msg: unknown): msg is NotificationActionMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'notificationAction'
}

export function isNotificationListRequestMessage(msg: unknown): msg is NotificationListRequestMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'notificationListRequest'
}

export function isNotificationListResponseMessage(msg: unknown): msg is NotificationListResponseMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'notificationListResponse'
}

export function isNotificationGetRequestMessage(msg: unknown): msg is NotificationGetRequestMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'notificationGetRequest'
}

export function isNotificationGetResponseMessage(msg: unknown): msg is NotificationGetResponseMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'notificationGetResponse'
}

export function isNotificationSettingsUpdateMessage(msg: unknown): msg is NotificationSettingsUpdateMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'notificationSettingsUpdate'
}

export function isNotificationSettingsUpdatedMessage(msg: unknown): msg is NotificationSettingsUpdatedMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'notificationSettingsUpdated'
}

export function isNotificationCountMessage(msg: unknown): msg is NotificationCountMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'notificationCount'
}

export function isNotificationSubscribeMessage(msg: unknown): msg is NotificationSubscribeMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'notificationSubscribe'
}

export function isNotificationUnsubscribeMessage(msg: unknown): msg is NotificationUnsubscribeMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'notificationUnsubscribe'
}

export function isNotificationErrorMessage(msg: unknown): msg is NotificationErrorMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'notificationError'
}

/**
 * Helper to create notification create message
 */
export function createNotificationCreateMessage(
  surfaceId: string,
  componentId: string,
  notification: NotificationData
): NotificationCreateMessage {
  return {
    type: 'notificationCreate',
    surfaceId,
    componentId,
    notification,
    timestamp: Date.now(),
  }
}

/**
 * Helper to create notification update message
 */
export function createNotificationUpdateMessage(
  surfaceId: string,
  componentId: string,
  update: NotificationUpdateData
): NotificationUpdateMessage {
  return {
    type: 'notificationUpdate',
    surfaceId,
    componentId,
    update,
    timestamp: Date.now(),
  }
}

/**
 * Helper to create notification delete message
 */
export function createNotificationDeleteMessage(
  surfaceId: string,
  componentId: string,
  notificationId: string
): NotificationDeleteMessage {
  return {
    type: 'notificationDelete',
    surfaceId,
    componentId,
    notificationId,
    timestamp: Date.now(),
  }
}

/**
 * Helper to create notification list request message
 */
export function createNotificationListRequestMessage(
  surfaceId: string,
  componentId: string,
  filters?: NotificationFilters,
  limit?: number,
  offset?: number
): NotificationListRequestMessage {
  return {
    type: 'notificationListRequest',
    surfaceId,
    componentId,
    filters,
    limit: limit || 50,
    offset: offset || 0,
    sortOrder: 'desc',
    timestamp: Date.now(),
  }
}

/**
 * Helper to create notification action message
 */
export function createNotificationActionMessage(
  surfaceId: string,
  componentId: string,
  notificationId: string,
  actionId: string,
  action: string
): NotificationActionMessage {
  return {
    type: 'notificationAction',
    surfaceId,
    componentId,
    notificationId,
    actionId,
    action,
    timestamp: Date.now(),
  }
}
