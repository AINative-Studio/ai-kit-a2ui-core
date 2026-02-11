/**
 * Notification Component Type Definitions for A2UI v0.9
 * Provides notification center, notification items, and badge components
 */

/**
 * Notification type for styling and icons
 */
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'system'

/**
 * Notification priority levels
 */
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent'

/**
 * Notification center position on screen
 */
export type NotificationPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'

/**
 * Notification filter types for categorization
 */
export type NotificationFilterType = 'all' | 'unread' | 'read' | 'info' | 'success' | 'warning' | 'error' | 'system'

/**
 * Notification grouping strategies
 */
export type NotificationGroupBy = 'none' | 'type' | 'priority' | 'category' | 'date'

/**
 * Badge position relative to parent element
 */
export type BadgePosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

/**
 * Notification category for business logic grouping
 */
export type NotificationCategory =
  | 'account'
  | 'billing'
  | 'security'
  | 'system'
  | 'social'
  | 'update'
  | 'message'
  | 'alert'
  | 'reminder'

/**
 * Action button for notification
 */
export interface NotificationAction {
  /** Action identifier */
  id: string
  /** Button label */
  label: string
  /** Action handler path */
  action: string
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  /** Whether action closes the notification */
  closeOnClick?: boolean
}

/**
 * Rich content for enhanced notifications
 */
export interface NotificationRichContent {
  /** Image URL */
  image?: string
  /** HTML content (sanitized) */
  html?: string
  /** Progress bar value (0-100) */
  progress?: number
  /** Icon name or URL */
  icon?: string
  /** Link URL */
  link?: string
  /** Link text */
  linkText?: string
  /** Additional metadata */
  metadata?: Record<string, unknown>
}

/**
 * Notification center component properties
 */
export interface NotificationCenterProperties {
  /** Maximum visible notifications (default: 10) */
  maxVisible?: number
  /** Position on screen (default: 'top-right') */
  position?: NotificationPosition
  /** Auto-hide notifications after duration (default: false) */
  autoHide?: boolean
  /** Auto-hide duration in milliseconds (default: 5000) */
  autoHideDuration?: number
  /** Group notifications by strategy (default: 'none') */
  groupBy?: NotificationGroupBy
  /** Filter by notification types */
  filterType?: NotificationFilterType[]
  /** Show unread badge (default: true) */
  showBadge?: boolean
  /** Play sound on new notification (default: false) */
  sound?: boolean
  /** Enable real-time updates (default: true) */
  realtime?: boolean
  /** Custom sound URL */
  soundUrl?: string
  /** Enable desktop notifications (default: false) */
  desktopNotifications?: boolean
  /** Width of notification panel */
  width?: string | number
  /** Maximum height of notification panel */
  maxHeight?: string | number
  /** Theme variant */
  theme?: 'light' | 'dark' | 'auto'
  /** Event handler for notification click */
  onNotificationClick?: string
  /** Event handler for notification dismiss */
  onNotificationDismiss?: string
  /** Event handler for action button click */
  onActionClick?: string
  /** Event handler for mark all read */
  onMarkAllRead?: string
}

/**
 * Notification center component
 */
export interface NotificationCenterComponent {
  /** Component type */
  type: 'notificationCenter'
  /** Unique component identifier */
  id: string
  /** Component properties */
  properties?: NotificationCenterProperties
  /** Child component IDs */
  children?: string[]
}

/**
 * Notification item properties
 */
export interface NotificationItemProperties {
  /** Notification unique identifier */
  notificationId: string
  /** Notification type */
  notificationType: NotificationType
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
  /** Dismissible (default: true) */
  dismissible?: boolean
  /** Avatar image URL */
  avatar?: string
  /** Sender name (for social notifications) */
  sender?: string
  /** Link URL for click-through */
  link?: string
  /** Expiration timestamp (auto-delete after) */
  expiresAt?: number
  /** Event handler for click */
  onClick?: string
  /** Event handler for dismiss */
  onDismiss?: string
  /** Event handler for action */
  onAction?: string
}

/**
 * Notification item component
 */
export interface NotificationItemComponent {
  /** Component type */
  type: 'notificationItem'
  /** Unique component identifier */
  id: string
  /** Component properties */
  properties: NotificationItemProperties
  /** Child component IDs */
  children?: string[]
}

/**
 * Notification badge properties
 */
export interface NotificationBadgeProperties {
  /** Unread count (0 hides badge) */
  count: number
  /** Maximum count to display (default: 99) */
  maxCount?: number
  /** Badge position (default: 'top-right') */
  position?: BadgePosition
  /** Show dot instead of count (default: false) */
  dot?: boolean
  /** Badge color */
  color?: string
  /** Badge background color */
  backgroundColor?: string
  /** Animate on count change (default: true) */
  animate?: boolean
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Custom label for accessibility */
  ariaLabel?: string
  /** Event handler for click */
  onClick?: string
}

/**
 * Notification badge component
 */
export interface NotificationBadgeComponent {
  /** Component type */
  type: 'notificationBadge'
  /** Unique component identifier */
  id: string
  /** Component properties */
  properties: NotificationBadgeProperties
  /** Child component IDs (element to attach badge to) */
  children?: string[]
}

/**
 * Notification state for managing notifications
 */
export interface NotificationState {
  /** All notifications */
  notifications: NotificationItemProperties[]
  /** Unread count */
  unreadCount: number
  /** Total count */
  totalCount: number
  /** Last update timestamp */
  lastUpdate: number
  /** Filter active */
  activeFilter?: NotificationFilterType
  /** Sort order */
  sortOrder?: 'asc' | 'desc'
}

/**
 * Notification settings
 */
export interface NotificationSettings {
  /** Enable notifications */
  enabled: boolean
  /** Enable sound */
  sound: boolean
  /** Enable desktop notifications */
  desktop: boolean
  /** Auto-mark as read on view */
  autoMarkRead: boolean
  /** Notification channels enabled/disabled */
  channels: {
    [key in NotificationCategory]?: boolean
  }
  /** Do not disturb mode */
  doNotDisturb?: boolean
  /** DND start time (24h format, e.g., "22:00") */
  dndStartTime?: string
  /** DND end time (24h format, e.g., "08:00") */
  dndEndTime?: string
}

/**
 * Default notification center properties
 */
export const DEFAULT_NOTIFICATION_CENTER_PROPERTIES: Partial<NotificationCenterProperties> = {
  maxVisible: 10,
  position: 'top-right',
  autoHide: false,
  autoHideDuration: 5000,
  groupBy: 'none',
  showBadge: true,
  sound: false,
  realtime: true,
  desktopNotifications: false,
  theme: 'auto',
}

/**
 * Default notification badge properties
 */
export const DEFAULT_NOTIFICATION_BADGE_PROPERTIES: Partial<NotificationBadgeProperties> = {
  maxCount: 99,
  position: 'top-right',
  dot: false,
  animate: true,
  size: 'md',
}

/**
 * Type guard for NotificationCenterComponent
 */
export function isNotificationCenterComponent(component: unknown): component is NotificationCenterComponent {
  return (
    typeof component === 'object' &&
    component !== null &&
    (component as NotificationCenterComponent).type === 'notificationCenter'
  )
}

/**
 * Type guard for NotificationItemComponent
 */
export function isNotificationItemComponent(component: unknown): component is NotificationItemComponent {
  return (
    typeof component === 'object' &&
    component !== null &&
    (component as NotificationItemComponent).type === 'notificationItem'
  )
}

/**
 * Type guard for NotificationBadgeComponent
 */
export function isNotificationBadgeComponent(component: unknown): component is NotificationBadgeComponent {
  return (
    typeof component === 'object' &&
    component !== null &&
    (component as NotificationBadgeComponent).type === 'notificationBadge'
  )
}

/**
 * Helper to create notification center component
 */
export function createNotificationCenter(
  id: string,
  properties?: NotificationCenterProperties
): NotificationCenterComponent {
  return {
    type: 'notificationCenter',
    id,
    properties: { ...DEFAULT_NOTIFICATION_CENTER_PROPERTIES, ...properties },
  }
}

/**
 * Helper to create notification item component
 */
export function createNotificationItem(
  id: string,
  properties: NotificationItemProperties
): NotificationItemComponent {
  return {
    type: 'notificationItem',
    id,
    properties: {
      dismissible: true,
      read: false,
      ...properties,
    },
  }
}

/**
 * Helper to create notification badge component
 */
export function createNotificationBadge(
  id: string,
  count: number,
  properties?: Partial<NotificationBadgeProperties>
): NotificationBadgeComponent {
  return {
    type: 'notificationBadge',
    id,
    properties: {
      count,
      ...DEFAULT_NOTIFICATION_BADGE_PROPERTIES,
      ...properties,
    },
  }
}

/**
 * Format notification timestamp into human-readable format
 */
export function formatNotificationTimestamp(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) {
    return 'just now'
  } else if (minutes < 60) {
    return `${minutes}m ago`
  } else if (hours < 24) {
    return `${hours}h ago`
  } else if (days < 7) {
    return `${days}d ago`
  } else {
    const date = new Date(timestamp)
    return date.toLocaleDateString()
  }
}

/**
 * Get notification icon based on type
 */
export function getNotificationIcon(type: NotificationType): string {
  const icons: Record<NotificationType, string> = {
    info: 'info',
    success: 'check-circle',
    warning: 'alert-triangle',
    error: 'x-circle',
    system: 'settings',
  }
  return icons[type] || 'bell'
}

/**
 * Get notification color based on type
 */
export function getNotificationColor(type: NotificationType): string {
  const colors: Record<NotificationType, string> = {
    info: '#3b82f6', // blue
    success: '#10b981', // green
    warning: '#f59e0b', // amber
    error: '#ef4444', // red
    system: '#6366f1', // indigo
  }
  return colors[type] || '#6b7280'
}
