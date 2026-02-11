/**
 * Notification Message Types for A2UI v0.9
 * Messages for notification center operations with real-time support
 */

import type { BaseMessage } from './protocol.js'
import type {
  NotificationType,
  NotificationPriority,
  NotificationAction,
  NotificationRichContent,
  NotificationSettings,
} from './notification-components.js'

/**
 * Notification data structure for creation
 */
export interface NotificationData {
  /** Notification type */
  type: NotificationType
  /** Notification title */
  title: string
  /** Notification message */
  message: string
  /** Category identifier */
  category?: string
  /** Priority level */
  priority?: NotificationPriority
  /** Icon name */
  icon?: string
  /** Avatar URL or name */
  avatar?: string
  /** Image URL */
  image?: string
  /** Action buttons */
  actions?: NotificationAction[]
  /** Auto-close notification */
  autoClose?: boolean
  /** Auto-close delay in milliseconds */
  autoCloseDelay?: number
  /** Rich content */
  richContent?: NotificationRichContent
  /** Additional metadata */
  metadata?: Record<string, unknown>
}

/**
 * Notification update data
 */
export interface NotificationUpdateData {
  /** Mark as read */
  read?: boolean
  /** Mark as snoozed */
  snoozed?: boolean
  /** Snooze until timestamp */
  snoozeUntil?: Date
  /** Mark as archived */
  archived?: boolean
}

/**
 * Notification filter options
 */
export interface NotificationFilters {
  /** Filter by type */
  type?: NotificationType[]
  /** Filter by category */
  category?: string[]
  /** Filter by read status */
  read?: boolean
  /** Filter from date */
  dateFrom?: Date
  /** Filter to date */
  dateTo?: Date
  /** Filter by priority */
  priority?: NotificationPriority[]
  /** Filter by archived status */
  archived?: boolean
}

/**
 * Notification list item (summary)
 */
export interface NotificationListItem {
  /** Notification ID */
  id: string
  /** Notification type */
  type: NotificationType
  /** Title */
  title: string
  /** Message */
  message: string
  /** Category */
  category?: string
  /** Timestamp */
  timestamp: Date
  /** Read status */
  read: boolean
  /** Priority */
  priority?: NotificationPriority
  /** Snoozed status */
  snoozed?: boolean
  /** Snooze until */
  snoozeUntil?: Date
  /** Archived status */
  archived?: boolean
}

/**
 * Create Notification Message (UI → Agent or Agent → UI)
 * Sent to create a new notification
 */
export interface NotificationCreateMessage extends BaseMessage {
  type: 'notificationCreate'
  /** Component identifier */
  componentId: string
  /** Notification data */
  notification: NotificationData
}

/**
 * Notification Created Message (Agent → UI)
 * Sent when notification is successfully created
 */
export interface NotificationCreatedMessage extends BaseMessage {
  type: 'notificationCreated'
  /** Component identifier */
  componentId: string
  /** Created notification ID */
  notificationId: string
  /** Notification data */
  notification: NotificationData
}

/**
 * Update Notification Message (UI → Agent)
 * Sent to update an existing notification
 */
export interface NotificationUpdateMessage extends BaseMessage {
  type: 'notificationUpdate'
  /** Component identifier */
  componentId: string
  /** Notification identifier */
  notificationId: string
  /** Update data */
  updates: NotificationUpdateData
}

/**
 * Notification Updated Message (Agent → UI)
 * Sent when notification is successfully updated
 */
export interface NotificationUpdatedMessage extends BaseMessage {
  type: 'notificationUpdated'
  /** Component identifier */
  componentId: string
  /** Notification identifier */
  notificationId: string
  /** Update data */
  updates: NotificationUpdateData
}

/**
 * Delete Notification Message (UI → Agent)
 * Sent to delete a notification
 */
export interface NotificationDeleteMessage extends BaseMessage {
  type: 'notificationDelete'
  /** Component identifier */
  componentId: string
  /** Notification identifier */
  notificationId: string
}

/**
 * Notification Deleted Message (Agent → UI)
 * Sent when notification is successfully deleted
 */
export interface NotificationDeletedMessage extends BaseMessage {
  type: 'notificationDeleted'
  /** Component identifier */
  componentId: string
  /** Notification identifier */
  notificationId: string
}

/**
 * Mark All Read Message (UI → Agent)
 * Sent to mark all notifications as read
 */
export interface NotificationMarkAllReadMessage extends BaseMessage {
  type: 'notificationMarkAllRead'
  /** Component identifier */
  componentId: string
  /** Optional category filter */
  category?: string
}

/**
 * All Marked Read Message (Agent → UI)
 * Sent when all notifications are marked as read
 */
export interface NotificationAllMarkedReadMessage extends BaseMessage {
  type: 'notificationAllMarkedRead'
  /** Component identifier */
  componentId: string
  /** Category that was marked (if filtered) */
  category?: string
  /** Number of notifications marked */
  count: number
}

/**
 * Delete All Notifications Message (UI → Agent)
 * Sent to delete all notifications
 */
export interface NotificationDeleteAllMessage extends BaseMessage {
  type: 'notificationDeleteAll'
  /** Component identifier */
  componentId: string
  /** Optional category filter */
  category?: string
}

/**
 * All Deleted Message (Agent → UI)
 * Sent when all notifications are deleted
 */
export interface NotificationAllDeletedMessage extends BaseMessage {
  type: 'notificationAllDeleted'
  /** Component identifier */
  componentId: string
  /** Category that was deleted (if filtered) */
  category?: string
  /** Number of notifications deleted */
  count: number
}

/**
 * Notification Action Message (UI → Agent)
 * Sent when user clicks a notification action
 */
export interface NotificationActionMessage extends BaseMessage {
  type: 'notificationAction'
  /** Component identifier */
  componentId: string
  /** Notification identifier */
  notificationId: string
  /** Action identifier */
  action: string
  /** Optional action context */
  context?: Record<string, unknown>
}

/**
 * List Notifications Request Message (UI → Agent)
 * Sent to request notification list
 */
export interface NotificationListRequestMessage extends BaseMessage {
  type: 'notificationListRequest'
  /** Component identifier */
  componentId: string
  /** Filter options */
  filters?: NotificationFilters
  /** Pagination limit */
  limit?: number
  /** Pagination offset */
  offset?: number
  /** Sort by field */
  sortBy?: 'timestamp' | 'priority' | 'type'
  /** Sort order */
  sortOrder?: 'asc' | 'desc'
}

/**
 * List Notifications Response Message (Agent → UI)
 * Sent with notification list
 */
export interface NotificationListResponseMessage extends BaseMessage {
  type: 'notificationListResponse'
  /** Component identifier */
  componentId: string
  /** Notification list */
  notifications: NotificationListItem[]
  /** Total count (before pagination) */
  total: number
  /** Unread count */
  unreadCount: number
  /** Pagination limit */
  limit?: number
  /** Pagination offset */
  offset?: number
}

/**
 * Get Notification Request Message (UI → Agent)
 * Sent to request a single notification's details
 */
export interface NotificationGetRequestMessage extends BaseMessage {
  type: 'notificationGetRequest'
  /** Component identifier */
  componentId: string
  /** Notification identifier */
  notificationId: string
}

/**
 * Get Notification Response Message (Agent → UI)
 * Sent with notification details
 */
export interface NotificationGetResponseMessage extends BaseMessage {
  type: 'notificationGetResponse'
  /** Component identifier */
  componentId: string
  /** Notification identifier */
  notificationId: string
  /** Full notification data */
  notification: NotificationListItem & {
    /** Actions (if any) */
    actions?: NotificationAction[]
    /** Rich content (if any) */
    richContent?: NotificationRichContent
    /** Full metadata */
    metadata?: Record<string, unknown>
  }
}

/**
 * Notification Settings Update Message (UI → Agent)
 * Sent to update notification settings
 */
export interface NotificationSettingsUpdateMessage extends BaseMessage {
  type: 'notificationSettingsUpdate'
  /** Component identifier */
  componentId: string
  /** Settings updates */
  settings: Partial<NotificationSettings>
}

/**
 * Notification Settings Updated Message (Agent → UI)
 * Sent when settings are successfully updated
 */
export interface NotificationSettingsUpdatedMessage extends BaseMessage {
  type: 'notificationSettingsUpdated'
  /** Component identifier */
  componentId: string
  /** Updated settings */
  settings: NotificationSettings
}

/**
 * Notification Count Message (Agent → UI)
 * Sent to update notification counts (real-time)
 */
export interface NotificationCountMessage extends BaseMessage {
  type: 'notificationCount'
  /** Component identifier */
  componentId: string
  /** Total notification count */
  total: number
  /** Unread count */
  unread: number
  /** Counts by category */
  byCategory?: Record<string, number>
  /** Counts by type */
  byType?: Record<NotificationType, number>
}

/**
 * Subscribe to Notifications Message (UI → Agent)
 * Sent to start real-time notification subscription
 */
export interface NotificationSubscribeMessage extends BaseMessage {
  type: 'notificationSubscribe'
  /** Component identifier */
  componentId: string
  /** Optional filter for subscription */
  filters?: NotificationFilters
}

/**
 * Unsubscribe from Notifications Message (UI → Agent)
 * Sent to stop real-time notification subscription
 */
export interface NotificationUnsubscribeMessage extends BaseMessage {
  type: 'notificationUnsubscribe'
  /** Component identifier */
  componentId: string
}

/**
 * Notification Error Message (Agent → UI)
 * Sent when a notification operation fails
 */
export interface NotificationErrorMessage extends BaseMessage {
  type: 'notificationError'
  /** Component identifier */
  componentId: string
  /** Error message */
  error: string
  /** Error code */
  errorCode:
    | 'NOT_FOUND'
    | 'INVALID_DATA'
    | 'PERMISSION_DENIED'
    | 'OPERATION_FAILED'
    | 'SERVICE_UNAVAILABLE'
  /** Optional error details */
  details?: unknown
  /** Related operation type */
  operation?: string
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
export function isNotificationCreateMessage(
  msg: unknown
): msg is NotificationCreateMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'notificationCreate'
}

export function isNotificationCreatedMessage(
  msg: unknown
): msg is NotificationCreatedMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'notificationCreated'
}

export function isNotificationUpdateMessage(
  msg: unknown
): msg is NotificationUpdateMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'notificationUpdate'
}

export function isNotificationUpdatedMessage(
  msg: unknown
): msg is NotificationUpdatedMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'notificationUpdated'
}

export function isNotificationDeleteMessage(
  msg: unknown
): msg is NotificationDeleteMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'notificationDelete'
}

export function isNotificationDeletedMessage(
  msg: unknown
): msg is NotificationDeletedMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'notificationDeleted'
}

export function isNotificationMarkAllReadMessage(
  msg: unknown
): msg is NotificationMarkAllReadMessage {
  return (
    typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'notificationMarkAllRead'
  )
}

export function isNotificationAllMarkedReadMessage(
  msg: unknown
): msg is NotificationAllMarkedReadMessage {
  return (
    typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'notificationAllMarkedRead'
  )
}

export function isNotificationDeleteAllMessage(
  msg: unknown
): msg is NotificationDeleteAllMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'notificationDeleteAll'
}

export function isNotificationAllDeletedMessage(
  msg: unknown
): msg is NotificationAllDeletedMessage {
  return (
    typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'notificationAllDeleted'
  )
}

export function isNotificationActionMessage(msg: unknown): msg is NotificationActionMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'notificationAction'
}

export function isNotificationListRequestMessage(
  msg: unknown
): msg is NotificationListRequestMessage {
  return (
    typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'notificationListRequest'
  )
}

export function isNotificationListResponseMessage(
  msg: unknown
): msg is NotificationListResponseMessage {
  return (
    typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'notificationListResponse'
  )
}

export function isNotificationGetRequestMessage(
  msg: unknown
): msg is NotificationGetRequestMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'notificationGetRequest'
}

export function isNotificationGetResponseMessage(
  msg: unknown
): msg is NotificationGetResponseMessage {
  return (
    typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'notificationGetResponse'
  )
}

export function isNotificationSettingsUpdateMessage(
  msg: unknown
): msg is NotificationSettingsUpdateMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as BaseMessage).type === 'notificationSettingsUpdate'
  )
}

export function isNotificationSettingsUpdatedMessage(
  msg: unknown
): msg is NotificationSettingsUpdatedMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as BaseMessage).type === 'notificationSettingsUpdated'
  )
}

export function isNotificationCountMessage(msg: unknown): msg is NotificationCountMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'notificationCount'
}

export function isNotificationSubscribeMessage(
  msg: unknown
): msg is NotificationSubscribeMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'notificationSubscribe'
}

export function isNotificationUnsubscribeMessage(
  msg: unknown
): msg is NotificationUnsubscribeMessage {
  return (
    typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'notificationUnsubscribe'
  )
}

export function isNotificationErrorMessage(msg: unknown): msg is NotificationErrorMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'notificationError'
}

/**
 * Helper to create notification create message
 */
export function createNotificationCreateMessage(
  componentId: string,
  notification: NotificationData
): NotificationCreateMessage {
  return {
    type: 'notificationCreate',
    componentId,
    notification,
    timestamp: Date.now(),
  }
}

/**
 * Helper to create notification update message
 */
export function createNotificationUpdateMessage(
  componentId: string,
  notificationId: string,
  updates: NotificationUpdateData
): NotificationUpdateMessage {
  return {
    type: 'notificationUpdate',
    componentId,
    notificationId,
    updates,
    timestamp: Date.now(),
  }
}

/**
 * Helper to create notification delete message
 */
export function createNotificationDeleteMessage(
  componentId: string,
  notificationId: string
): NotificationDeleteMessage {
  return {
    type: 'notificationDelete',
    componentId,
    notificationId,
    timestamp: Date.now(),
  }
}

/**
 * Helper to create notification list request message
 */
export function createNotificationListRequestMessage(
  componentId: string,
  filters?: NotificationFilters,
  limit?: number,
  offset?: number
): NotificationListRequestMessage {
  return {
    type: 'notificationListRequest',
    componentId,
    filters,
    limit,
    offset,
    timestamp: Date.now(),
  }
}

/**
 * Helper to create notification action message
 */
export function createNotificationActionMessage(
  componentId: string,
  notificationId: string,
  action: string,
  context?: Record<string, unknown>
): NotificationActionMessage {
  return {
    type: 'notificationAction',
    componentId,
    notificationId,
    action,
    context,
    timestamp: Date.now(),
  }
}
