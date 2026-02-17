/**
 * Notification Center Component Type Definitions for A2UI v0.9
 * Provides comprehensive notification management with AINative integration
 */

import type { A2UIComponent } from './components.js'

/**
 * Notification types
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'alert'

/**
 * Notification priority levels
 */
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'

/**
 * Notification display position
 */
export type NotificationPosition =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'
  | 'center'

/**
 * Notification filter types
 */
export type NotificationFilterType = 'type' | 'category' | 'date' | 'read/unread'

/**
 * Notification grouping options
 */
export type NotificationGroupBy = 'type' | 'category' | 'date' | 'none'

/**
 * Badge position options
 */
export type BadgePosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

/**
 * Notification category definition
 */
export interface NotificationCategory {
  /** Unique category identifier */
  id: string
  /** Display label */
  label: string
  /** Optional icon name */
  icon?: string
  /** Optional category color */
  color?: string
}

/**
 * Notification action button
 */
export interface NotificationAction {
  /** Action label */
  label: string
  /** Action identifier */
  action: string
  /** Whether this is the primary action */
  primary?: boolean
  /** Whether this action is destructive (e.g., delete) */
  destructive?: boolean
}

/**
 * Rich content options for notifications
 */
export interface NotificationRichContent {
  /** HTML content */
  html?: string
  /** Markdown content */
  markdown?: string
  /** Embedded A2UI components */
  components?: A2UIComponent[]
}

/**
 * Notification Center Component Properties
 */
export interface NotificationCenterProperties {
  /** Display position */
  position?: NotificationPosition
  /** Maximum visible notifications at once */
  maxVisible?: number
  /** Auto-close notifications */
  autoClose?: boolean
  /** Auto-close delay in milliseconds */
  autoCloseDelay?: number
  /** Allowed notification types */
  types?: NotificationType[]
  /** Show filter controls */
  showFilters?: boolean
  /** Available filter types */
  filterBy?: NotificationFilterType[]
  /** Group notifications by */
  groupBy?: NotificationGroupBy
  /** Allow marking notifications as read */
  allowMarkAsRead?: boolean
  /** Allow mark all as read action */
  allowMarkAllAsRead?: boolean
  /** Allow deleting notifications */
  allowDelete?: boolean
  /** Allow delete all action */
  allowDeleteAll?: boolean
  /** Allow snoozing notifications */
  allowSnooze?: boolean
  /** Show timestamps on notifications */
  showTimestamp?: boolean
  /** Show avatars on notifications */
  showAvatar?: boolean
  /** Show action buttons on notifications */
  showActions?: boolean
  /** Persist notifications across sessions */
  persistNotifications?: boolean
  /** Maximum stored notifications */
  maxNotifications?: number
  /** Enable sound for new notifications */
  soundEnabled?: boolean
  /** Enable vibration for new notifications */
  vibrationEnabled?: boolean
  /** Custom sound URL */
  soundUrl?: string
  /** Available categories */
  categories?: NotificationCategory[]
  /** Additional metadata */
  metadata?: Record<string, unknown>
}

/**
 * Notification Center Component
 */
export interface NotificationCenterComponent extends A2UIComponent {
  type: 'notificationCenter'
  properties?: NotificationCenterProperties
}

/**
 * Notification Item Component Properties
 */
export interface NotificationItemProperties {
  /** Notification type */
  type: NotificationType
  /** Notification title */
  title: string
  /** Notification message */
  message: string
  /** Category identifier */
  category?: string
  /** Timestamp */
  timestamp: Date
  /** Read status */
  read: boolean
  /** Icon name */
  icon?: string
  /** Avatar URL or name */
  avatar?: string
  /** Image URL */
  image?: string
  /** Custom color */
  color?: string
  /** Action buttons */
  actions?: NotificationAction[]
  /** Can be closed by user */
  closable?: boolean
  /** Auto-close this notification */
  autoClose?: boolean
  /** Auto-close delay in milliseconds */
  autoCloseDelay?: number
  /** Priority level */
  priority?: NotificationPriority
  /** Rich content */
  richContent?: NotificationRichContent
  /** Additional metadata */
  metadata?: Record<string, unknown>
}

/**
 * Notification Item Component
 */
export interface NotificationItemComponent extends A2UIComponent {
  type: 'notificationItem'
  properties: NotificationItemProperties
}

/**
 * Notification Badge Component Properties
 */
export interface NotificationBadgeProperties {
  /** Notification count */
  count: number
  /** Maximum count to display (e.g., 99 for "99+") */
  maxCount?: number
  /** Show badge even when count is zero */
  showZero?: boolean
  /** Show as dot instead of number */
  dot?: boolean
  /** Badge position relative to parent */
  position?: BadgePosition
  /** Badge color */
  color?: string
  /** Pulse animation for new notifications */
  pulse?: boolean
  /** Additional metadata */
  metadata?: Record<string, unknown>
}

/**
 * Notification Badge Component
 */
export interface NotificationBadgeComponent extends A2UIComponent {
  type: 'notificationBadge'
  properties?: NotificationBadgeProperties
}

/**
 * Notification state for tracking
 */
export interface NotificationState {
  /** Unique notification identifier */
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
  /** Snoozed status */
  snoozed?: boolean
  /** Snooze until timestamp */
  snoozeUntil?: Date
  /** Archived status */
  archived?: boolean
  /** Priority */
  priority?: NotificationPriority
  /** Actions */
  actions?: NotificationAction[]
  /** Metadata */
  metadata?: Record<string, unknown>
}

/**
 * Notification settings
 */
export interface NotificationSettings {
  /** Global notifications enabled */
  enabled: boolean
  /** Sound enabled */
  soundEnabled: boolean
  /** Vibration enabled */
  vibrationEnabled: boolean
  /** Category-specific settings */
  categories: Record<string, boolean>
}

/**
 * Default notification center properties
 */
export const DEFAULT_NOTIFICATION_CENTER_PROPERTIES: Partial<NotificationCenterProperties> = {
  position: 'top-right',
  maxVisible: 5,
  autoClose: true,
  autoCloseDelay: 5000,
  types: ['success', 'error', 'warning', 'info', 'alert'],
  showFilters: true,
  filterBy: ['type', 'category', 'read/unread'],
  groupBy: 'none',
  allowMarkAsRead: true,
  allowMarkAllAsRead: true,
  allowDelete: true,
  allowDeleteAll: true,
  allowSnooze: true,
  showTimestamp: true,
  showAvatar: false,
  showActions: true,
  persistNotifications: true,
  maxNotifications: 100,
  soundEnabled: false,
  vibrationEnabled: false,
}

/**
 * Default notification badge properties
 */
export const DEFAULT_NOTIFICATION_BADGE_PROPERTIES: Partial<NotificationBadgeProperties> = {
  maxCount: 99,
  showZero: false,
  dot: false,
  position: 'top-right',
  pulse: true,
}

/**
 * Type guard for NotificationCenterComponent
 */
export function isNotificationCenterComponent(
  component: A2UIComponent
): component is NotificationCenterComponent {
  return component.type === 'notificationCenter'
}

/**
 * Type guard for NotificationItemComponent
 */
export function isNotificationItemComponent(
  component: A2UIComponent
): component is NotificationItemComponent {
  return component.type === 'notificationItem'
}

/**
 * Type guard for NotificationBadgeComponent
 */
export function isNotificationBadgeComponent(
  component: A2UIComponent
): component is NotificationBadgeComponent {
  return component.type === 'notificationBadge'
}

/**
 * Helper to create a notification center component
 */
export function createNotificationCenter(
  id: string,
  properties?: NotificationCenterProperties
): NotificationCenterComponent {
  return {
    id,
    type: 'notificationCenter',
    properties: {
      ...DEFAULT_NOTIFICATION_CENTER_PROPERTIES,
      ...properties,
    },
  }
}

/**
 * Helper to create a notification item component
 */
export function createNotificationItem(
  id: string,
  properties: NotificationItemProperties
): NotificationItemComponent {
  return {
    id,
    type: 'notificationItem',
    properties,
  }
}

/**
 * Helper to create a notification badge component
 */
export function createNotificationBadge(
  id: string,
  count: number,
  properties?: Partial<NotificationBadgeProperties>
): NotificationBadgeComponent {
  return {
    id,
    type: 'notificationBadge',
    properties: {
      ...DEFAULT_NOTIFICATION_BADGE_PROPERTIES,
      count,
      ...properties,
    },
  }
}

/**
 * Helper to format notification timestamp
 */
export function formatNotificationTimestamp(timestamp: Date): string {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) {
    return 'Just now'
  } else if (minutes < 60) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  } else if (hours < 24) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  } else if (days < 7) {
    return `${days} day${days > 1 ? 's' : ''} ago`
  } else {
    return timestamp.toLocaleDateString()
  }
}

/**
 * Helper to get notification icon by type
 */
export function getNotificationIcon(type: NotificationType): string {
  const icons: Record<NotificationType, string> = {
    success: 'check-circle',
    error: 'x-circle',
    warning: 'alert-triangle',
    info: 'info',
    alert: 'bell',
  }
  return icons[type]
}

/**
 * Helper to get notification color by type
 */
export function getNotificationColor(type: NotificationType): string {
  const colors: Record<NotificationType, string> = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    alert: '#8b5cf6',
  }
  return colors[type]
}
