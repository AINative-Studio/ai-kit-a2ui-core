/**
 * A2UI Notification Handler (Issue #49)
 * Manages notification center operations with real-time support and AINative integration
 */

import type { A2UITransport } from '../transport/index.js'
import type {
  NotificationCreateMessage,
  NotificationCreatedMessage,
  NotificationUpdateMessage,
  NotificationUpdatedMessage,
  NotificationDeleteMessage,
  NotificationDeletedMessage,
  NotificationMarkAllReadMessage,
  NotificationAllMarkedReadMessage,
  NotificationDeleteAllMessage,
  NotificationAllDeletedMessage,
  NotificationActionMessage,
  NotificationListRequestMessage,
  NotificationListResponseMessage,
  NotificationGetRequestMessage,
  NotificationGetResponseMessage,
  NotificationSettingsUpdateMessage,
  NotificationSettingsUpdatedMessage,
  NotificationCountMessage,
  NotificationSubscribeMessage,
  NotificationUnsubscribeMessage,
  NotificationErrorMessage,
  NotificationData,
  NotificationUpdateData,
  NotificationFilters,
  NotificationListItem,
} from '../types/notification-messages.js'
import {
  isNotificationCreateMessage,
  isNotificationUpdateMessage,
  isNotificationDeleteMessage,
  isNotificationMarkAllReadMessage,
  isNotificationDeleteAllMessage,
  isNotificationActionMessage,
  isNotificationListRequestMessage,
  isNotificationGetRequestMessage,
  isNotificationSettingsUpdateMessage,
  isNotificationSubscribeMessage,
  isNotificationUnsubscribeMessage,
} from '../types/notification-messages.js'
import type { NotificationSettings } from '../types/notification-components.js'

/**
 * Notification event types
 */
export type NotificationEventType =
  | 'notificationCreated'
  | 'notificationUpdated'
  | 'notificationDeleted'
  | 'notificationAction'
  | 'allMarkedRead'
  | 'allDeleted'
  | 'countUpdated'
  | 'settingsUpdated'
  | 'error'

/**
 * Notification event data
 */
export interface NotificationEventData {
  componentId: string
  notificationId?: string
  notification?: NotificationData | NotificationListItem
  action?: string
  count?: {
    total: number
    unread: number
  }
  settings?: NotificationSettings
  error?: {
    message: string
    code: string
    details?: unknown
  }
}

/**
 * Notification event handler callback
 */
export type NotificationEventHandler = (data: NotificationEventData) => void

/**
 * Notification service interface for backend integration
 */
export interface NotificationService {
  /** Create a new notification */
  create(notification: NotificationData): Promise<string>
  /** Update an existing notification */
  update(id: string, updates: NotificationUpdateData): Promise<void>
  /** Delete a notification */
  delete(id: string): Promise<void>
  /** Get a single notification */
  get(id: string): Promise<NotificationListItem | null>
  /** List notifications with filters */
  list(filters: NotificationFilters, limit?: number, offset?: number): Promise<NotificationListItem[]>
  /** Get total count */
  count(filters?: NotificationFilters): Promise<{ total: number; unread: number }>
  /** Mark all as read */
  markAllRead(category?: string): Promise<number>
  /** Delete all notifications */
  deleteAll(category?: string): Promise<number>
  /** Update settings */
  updateSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings>
  /** Get settings */
  getSettings(): Promise<NotificationSettings>
}

/**
 * Storage interface for notification persistence
 */
export interface NotificationStorage {
  /** Save notifications */
  save(notifications: NotificationListItem[]): Promise<void>
  /** Load notifications */
  load(): Promise<NotificationListItem[]>
  /** Clear storage */
  clear(): Promise<void>
}

/**
 * Notification handler options
 */
export interface NotificationHandlerOptions {
  /** Notification service implementation */
  notificationService?: NotificationService
  /** Storage implementation for persistence */
  storage?: NotificationStorage
  /** Default auto-close behavior */
  defaultAutoClose?: boolean
  /** Default auto-close delay in milliseconds */
  defaultAutoCloseDelay?: number
  /** Maximum notifications to store */
  maxNotifications?: number
  /** Persist notifications to storage */
  persistNotifications?: boolean
  /** Default sound URL */
  defaultSoundUrl?: string
  /** Enable real-time sync */
  enableRealTimeSync?: boolean
  /** Real-time sync interval in milliseconds */
  syncInterval?: number
}

/**
 * Internal notification state
 */
interface NotificationState {
  id: string
  componentId: string
  notification: NotificationListItem
  createdAt: number
  autoCloseTimer?: ReturnType<typeof setTimeout>
}

/**
 * Notification Handler
 * Manages notification center operations with real-time support
 */
export class NotificationHandler {
  private readonly transport: A2UITransport
  private readonly options: Required<NotificationHandlerOptions>
  private readonly eventHandlers = new Map<NotificationEventType, Set<NotificationEventHandler>>()
  private readonly notifications = new Map<string, NotificationState>()
  private readonly subscriptions = new Set<string>()
  private syncTimer: ReturnType<typeof setInterval> | null = null
  private notificationCounter = 0

  constructor(transport: A2UITransport, options: NotificationHandlerOptions = {}) {
    this.transport = transport
    this.options = {
      notificationService: options.notificationService ?? this.createDefaultService(),
      storage: options.storage ?? this.createDefaultStorage(),
      defaultAutoClose: options.defaultAutoClose ?? true,
      defaultAutoCloseDelay: options.defaultAutoCloseDelay ?? 5000,
      maxNotifications: options.maxNotifications ?? 100,
      persistNotifications: options.persistNotifications ?? true,
      defaultSoundUrl: options.defaultSoundUrl ?? '',
      enableRealTimeSync: options.enableRealTimeSync ?? true,
      syncInterval: options.syncInterval ?? 30000,
    }
    this.initialize()
  }

  /**
   * Initialize the notification handler
   */
  private initialize(): void {
    // Register message handlers
    this.transport.on<NotificationCreateMessage>('notificationCreate', (msg) => {
      if (isNotificationCreateMessage(msg)) this.handleCreate(msg)
    })

    this.transport.on<NotificationUpdateMessage>('notificationUpdate', (msg) => {
      if (isNotificationUpdateMessage(msg)) this.handleUpdate(msg)
    })

    this.transport.on<NotificationDeleteMessage>('notificationDelete', (msg) => {
      if (isNotificationDeleteMessage(msg)) this.handleDelete(msg)
    })

    this.transport.on<NotificationMarkAllReadMessage>('notificationMarkAllRead', (msg) => {
      if (isNotificationMarkAllReadMessage(msg)) this.handleMarkAllRead(msg)
    })

    this.transport.on<NotificationDeleteAllMessage>('notificationDeleteAll', (msg) => {
      if (isNotificationDeleteAllMessage(msg)) this.handleDeleteAll(msg)
    })

    this.transport.on<NotificationActionMessage>('notificationAction', (msg) => {
      if (isNotificationActionMessage(msg)) this.handleAction(msg)
    })

    this.transport.on<NotificationListRequestMessage>('notificationListRequest', (msg) => {
      if (isNotificationListRequestMessage(msg)) this.handleListRequest(msg)
    })

    this.transport.on<NotificationGetRequestMessage>('notificationGetRequest', (msg) => {
      if (isNotificationGetRequestMessage(msg)) this.handleGetRequest(msg)
    })

    this.transport.on<NotificationSettingsUpdateMessage>('notificationSettingsUpdate', (msg) => {
      if (isNotificationSettingsUpdateMessage(msg)) this.handleSettingsUpdate(msg)
    })

    this.transport.on<NotificationSubscribeMessage>('notificationSubscribe', (msg) => {
      if (isNotificationSubscribeMessage(msg)) this.handleSubscribe(msg)
    })

    this.transport.on<NotificationUnsubscribeMessage>('notificationUnsubscribe', (msg) => {
      if (isNotificationUnsubscribeMessage(msg)) this.handleUnsubscribe(msg)
    })

    // Load persisted notifications
    if (this.options.persistNotifications) {
      this.loadNotifications()
    }

    // Start real-time sync if enabled
    if (this.options.enableRealTimeSync) {
      this.startRealTimeSync()
    }
  }

  /**
   * Handle notification create message
   */
  private async handleCreate(message: NotificationCreateMessage): Promise<void> {
    try {
      const notificationId = await this.options.notificationService.create(message.notification)

      const notificationItem: NotificationListItem = {
        id: notificationId,
        type: message.notification.type,
        title: message.notification.title,
        message: message.notification.message,
        category: message.notification.category,
        timestamp: new Date(),
        read: false,
        priority: message.notification.priority,
      }

      // Store notification
      const state: NotificationState = {
        id: notificationId,
        componentId: message.componentId,
        notification: notificationItem,
        createdAt: Date.now(),
      }

      this.notifications.set(notificationId, state)

      // Setup auto-close if enabled
      const autoClose = message.notification.autoClose ?? this.options.defaultAutoClose
      const autoCloseDelay = message.notification.autoCloseDelay ?? this.options.defaultAutoCloseDelay

      if (autoClose && autoCloseDelay > 0) {
        state.autoCloseTimer = setTimeout(() => {
          this.handleDelete({
            type: 'notificationDelete',
            componentId: message.componentId,
            notificationId,
            timestamp: Date.now(),
          })
        }, autoCloseDelay)
      }

      // Enforce max notifications limit
      this.enforceMaxNotifications()

      // Persist if enabled
      if (this.options.persistNotifications) {
        await this.saveNotifications()
      }

      // Send created message
      const createdMessage: NotificationCreatedMessage = {
        type: 'notificationCreated',
        componentId: message.componentId,
        notificationId,
        notification: message.notification,
        timestamp: Date.now(),
      }
      this.transport.send(createdMessage)

      // Emit event
      this.emit('notificationCreated', {
        componentId: message.componentId,
        notificationId,
        notification: message.notification,
      })

      // Update counts
      await this.updateCounts(message.componentId)
    } catch (error) {
      this.sendError(message.componentId, 'Failed to create notification', 'OPERATION_FAILED', error)
    }
  }

  /**
   * Handle notification update message
   */
  private async handleUpdate(message: NotificationUpdateMessage): Promise<void> {
    try {
      const state = this.notifications.get(message.notificationId)
      if (!state) {
        this.sendError(message.componentId, 'Notification not found', 'NOT_FOUND')
        return
      }

      await this.options.notificationService.update(message.notificationId, message.updates)

      // Update state
      if (message.updates.read !== undefined) {
        state.notification.read = message.updates.read
      }
      if (message.updates.snoozed !== undefined) {
        state.notification.snoozed = message.updates.snoozed
      }
      if (message.updates.snoozeUntil !== undefined) {
        state.notification.snoozeUntil = message.updates.snoozeUntil
      }
      if (message.updates.archived !== undefined) {
        state.notification.archived = message.updates.archived
      }

      // Persist if enabled
      if (this.options.persistNotifications) {
        await this.saveNotifications()
      }

      // Send updated message
      const updatedMessage: NotificationUpdatedMessage = {
        type: 'notificationUpdated',
        componentId: message.componentId,
        notificationId: message.notificationId,
        updates: message.updates,
        timestamp: Date.now(),
      }
      this.transport.send(updatedMessage)

      // Emit event
      this.emit('notificationUpdated', {
        componentId: message.componentId,
        notificationId: message.notificationId,
        notification: state.notification,
      })

      // Update counts
      await this.updateCounts(message.componentId)
    } catch (error) {
      this.sendError(message.componentId, 'Failed to update notification', 'OPERATION_FAILED', error)
    }
  }

  /**
   * Handle notification delete message
   */
  private async handleDelete(message: NotificationDeleteMessage): Promise<void> {
    try {
      const state = this.notifications.get(message.notificationId)
      if (!state) {
        this.sendError(message.componentId, 'Notification not found', 'NOT_FOUND')
        return
      }

      await this.options.notificationService.delete(message.notificationId)

      // Clear auto-close timer if exists
      if (state.autoCloseTimer) {
        clearTimeout(state.autoCloseTimer)
      }

      // Remove from state
      this.notifications.delete(message.notificationId)

      // Persist if enabled
      if (this.options.persistNotifications) {
        await this.saveNotifications()
      }

      // Send deleted message
      const deletedMessage: NotificationDeletedMessage = {
        type: 'notificationDeleted',
        componentId: message.componentId,
        notificationId: message.notificationId,
        timestamp: Date.now(),
      }
      this.transport.send(deletedMessage)

      // Emit event
      this.emit('notificationDeleted', {
        componentId: message.componentId,
        notificationId: message.notificationId,
      })

      // Update counts
      await this.updateCounts(message.componentId)
    } catch (error) {
      this.sendError(message.componentId, 'Failed to delete notification', 'OPERATION_FAILED', error)
    }
  }

  /**
   * Handle mark all as read message
   */
  private async handleMarkAllRead(message: NotificationMarkAllReadMessage): Promise<void> {
    try {
      const count = await this.options.notificationService.markAllRead(message.category)

      // Update local state
      for (const state of this.notifications.values()) {
        if (!message.category || state.notification.category === message.category) {
          state.notification.read = true
        }
      }

      // Persist if enabled
      if (this.options.persistNotifications) {
        await this.saveNotifications()
      }

      // Send response message
      const responseMessage: NotificationAllMarkedReadMessage = {
        type: 'notificationAllMarkedRead',
        componentId: message.componentId,
        category: message.category,
        count,
        timestamp: Date.now(),
      }
      this.transport.send(responseMessage)

      // Emit event
      this.emit('allMarkedRead', {
        componentId: message.componentId,
        count: { total: count, unread: 0 },
      })

      // Update counts
      await this.updateCounts(message.componentId)
    } catch (error) {
      this.sendError(
        message.componentId,
        'Failed to mark all as read',
        'OPERATION_FAILED',
        error
      )
    }
  }

  /**
   * Handle delete all message
   */
  private async handleDeleteAll(message: NotificationDeleteAllMessage): Promise<void> {
    try {
      const count = await this.options.notificationService.deleteAll(message.category)

      // Clear local state
      for (const [id, state] of this.notifications.entries()) {
        if (!message.category || state.notification.category === message.category) {
          if (state.autoCloseTimer) {
            clearTimeout(state.autoCloseTimer)
          }
          this.notifications.delete(id)
        }
      }

      // Persist if enabled
      if (this.options.persistNotifications) {
        await this.saveNotifications()
      }

      // Send response message
      const responseMessage: NotificationAllDeletedMessage = {
        type: 'notificationAllDeleted',
        componentId: message.componentId,
        category: message.category,
        count,
        timestamp: Date.now(),
      }
      this.transport.send(responseMessage)

      // Emit event
      this.emit('allDeleted', {
        componentId: message.componentId,
        count: { total: 0, unread: 0 },
      })

      // Update counts
      await this.updateCounts(message.componentId)
    } catch (error) {
      this.sendError(message.componentId, 'Failed to delete all', 'OPERATION_FAILED', error)
    }
  }

  /**
   * Handle notification action message
   */
  private async handleAction(message: NotificationActionMessage): Promise<void> {
    try {
      const state = this.notifications.get(message.notificationId)
      if (!state) {
        this.sendError(message.componentId, 'Notification not found', 'NOT_FOUND')
        return
      }

      // Emit action event
      this.emit('notificationAction', {
        componentId: message.componentId,
        notificationId: message.notificationId,
        action: message.action,
        notification: state.notification,
      })
    } catch (error) {
      this.sendError(message.componentId, 'Failed to handle action', 'OPERATION_FAILED', error)
    }
  }

  /**
   * Handle list request message
   */
  private async handleListRequest(message: NotificationListRequestMessage): Promise<void> {
    try {
      const notifications = await this.options.notificationService.list(
        message.filters || {},
        message.limit,
        message.offset
      )

      const { total, unread } = await this.options.notificationService.count(message.filters)

      // Send response message
      const responseMessage: NotificationListResponseMessage = {
        type: 'notificationListResponse',
        componentId: message.componentId,
        notifications,
        total,
        unreadCount: unread,
        limit: message.limit,
        offset: message.offset,
        timestamp: Date.now(),
      }
      this.transport.send(responseMessage)
    } catch (error) {
      this.sendError(message.componentId, 'Failed to list notifications', 'OPERATION_FAILED', error)
    }
  }

  /**
   * Handle get request message
   */
  private async handleGetRequest(message: NotificationGetRequestMessage): Promise<void> {
    try {
      const notification = await this.options.notificationService.get(message.notificationId)

      if (!notification) {
        this.sendError(message.componentId, 'Notification not found', 'NOT_FOUND')
        return
      }

      // Send response message
      const responseMessage: NotificationGetResponseMessage = {
        type: 'notificationGetResponse',
        componentId: message.componentId,
        notificationId: message.notificationId,
        notification,
        timestamp: Date.now(),
      }
      this.transport.send(responseMessage)
    } catch (error) {
      this.sendError(message.componentId, 'Failed to get notification', 'OPERATION_FAILED', error)
    }
  }

  /**
   * Handle settings update message
   */
  private async handleSettingsUpdate(message: NotificationSettingsUpdateMessage): Promise<void> {
    try {
      const settings = await this.options.notificationService.updateSettings(message.settings)

      // Send response message
      const responseMessage: NotificationSettingsUpdatedMessage = {
        type: 'notificationSettingsUpdated',
        componentId: message.componentId,
        settings,
        timestamp: Date.now(),
      }
      this.transport.send(responseMessage)

      // Emit event
      this.emit('settingsUpdated', {
        componentId: message.componentId,
        settings,
      })
    } catch (error) {
      this.sendError(message.componentId, 'Failed to update settings', 'OPERATION_FAILED', error)
    }
  }

  /**
   * Handle subscribe message
   */
  private handleSubscribe(message: NotificationSubscribeMessage): void {
    this.subscriptions.add(message.componentId)
  }

  /**
   * Handle unsubscribe message
   */
  private handleUnsubscribe(message: NotificationUnsubscribeMessage): void {
    this.subscriptions.delete(message.componentId)
  }

  /**
   * Update notification counts
   */
  private async updateCounts(componentId: string): Promise<void> {
    try {
      const { total, unread } = await this.options.notificationService.count()

      const countMessage: NotificationCountMessage = {
        type: 'notificationCount',
        componentId,
        total,
        unread,
        timestamp: Date.now(),
      }
      this.transport.send(countMessage)

      this.emit('countUpdated', {
        componentId,
        count: { total, unread },
      })
    } catch (error) {
      console.error('Failed to update counts:', error)
    }
  }

  /**
   * Send error message
   */
  private sendError(
    componentId: string,
    message: string,
    code: NotificationErrorMessage['errorCode'],
    details?: unknown
  ): void {
    const errorMessage: NotificationErrorMessage = {
      type: 'notificationError',
      componentId,
      error: message,
      errorCode: code,
      details,
      timestamp: Date.now(),
    }
    this.transport.send(errorMessage)

    this.emit('error', {
      componentId,
      error: {
        message,
        code,
        details,
      },
    })
  }

  /**
   * Enforce maximum notifications limit
   */
  private enforceMaxNotifications(): void {
    const notifications = Array.from(this.notifications.values())
    if (notifications.length > this.options.maxNotifications) {
      // Sort by created time (oldest first)
      notifications.sort((a, b) => a.createdAt - b.createdAt)

      // Remove oldest notifications
      const toRemove = notifications.length - this.options.maxNotifications
      for (let i = 0; i < toRemove; i++) {
        const state = notifications[i]
        if (state.autoCloseTimer) {
          clearTimeout(state.autoCloseTimer)
        }
        this.notifications.delete(state.id)
      }
    }
  }

  /**
   * Load persisted notifications
   */
  private async loadNotifications(): Promise<void> {
    try {
      const notifications = await this.options.storage.load()
      for (const notification of notifications) {
        const state: NotificationState = {
          id: notification.id,
          componentId: '',
          notification,
          createdAt: notification.timestamp.getTime(),
        }
        this.notifications.set(notification.id, state)
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    }
  }

  /**
   * Save notifications to storage
   */
  private async saveNotifications(): Promise<void> {
    try {
      const notifications = Array.from(this.notifications.values()).map((state) => state.notification)
      await this.options.storage.save(notifications)
    } catch (error) {
      console.error('Failed to save notifications:', error)
    }
  }

  /**
   * Start real-time sync
   */
  private startRealTimeSync(): void {
    if (this.syncTimer) {
      return
    }

    this.syncTimer = setInterval(async () => {
      for (const componentId of this.subscriptions) {
        await this.updateCounts(componentId)
      }
    }, this.options.syncInterval)
  }

  /**
   * Stop real-time sync
   */
  private stopRealTimeSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
      this.syncTimer = null
    }
  }

  /**
   * Register event handler
   */
  public on(event: NotificationEventType, handler: NotificationEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(handler)
  }

  /**
   * Unregister event handler
   */
  public off(event: NotificationEventType, handler: NotificationEventHandler): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.delete(handler)
    }
  }

  /**
   * Emit event
   */
  private emit(event: NotificationEventType, data: NotificationEventData): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(data)
        } catch (error) {
          console.error('Error in event handler:', error)
        }
      }
    }
  }

  /**
   * Create default notification service (in-memory)
   */
  private createDefaultService(): NotificationService {
    const notifications = new Map<string, NotificationListItem>()
    let counter = 0

    return {
      async create(notification: NotificationData): Promise<string> {
        const id = `notif_${++counter}_${Date.now()}`
        const item: NotificationListItem = {
          id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          category: notification.category,
          timestamp: new Date(),
          read: false,
          priority: notification.priority,
        }
        notifications.set(id, item)
        return id
      },

      async update(id: string, updates: NotificationUpdateData): Promise<void> {
        const notification = notifications.get(id)
        if (!notification) {
          throw new Error('Notification not found')
        }
        Object.assign(notification, updates)
      },

      async delete(id: string): Promise<void> {
        notifications.delete(id)
      },

      async get(id: string): Promise<NotificationListItem | null> {
        return notifications.get(id) || null
      },

      async list(
        filters: NotificationFilters,
        limit?: number,
        offset?: number
      ): Promise<NotificationListItem[]> {
        let items = Array.from(notifications.values())

        // Apply filters
        if (filters.type && filters.type.length > 0) {
          items = items.filter((item) => filters.type!.includes(item.type))
        }
        if (filters.category && filters.category.length > 0) {
          items = items.filter((item) => item.category && filters.category!.includes(item.category))
        }
        if (filters.read !== undefined) {
          items = items.filter((item) => item.read === filters.read)
        }
        if (filters.archived !== undefined) {
          items = items.filter((item) => item.archived === filters.archived)
        }

        // Sort by timestamp (newest first)
        items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

        // Apply pagination
        if (offset !== undefined) {
          items = items.slice(offset)
        }
        if (limit !== undefined) {
          items = items.slice(0, limit)
        }

        return items
      },

      async count(filters?: NotificationFilters): Promise<{ total: number; unread: number }> {
        let items = Array.from(notifications.values())

        if (filters) {
          if (filters.type && filters.type.length > 0) {
            items = items.filter((item) => filters.type!.includes(item.type))
          }
          if (filters.category && filters.category.length > 0) {
            items = items.filter((item) => item.category && filters.category!.includes(item.category))
          }
          if (filters.archived !== undefined) {
            items = items.filter((item) => item.archived === filters.archived)
          }
        }

        const total = items.length
        const unread = items.filter((item) => !item.read).length
        return { total, unread }
      },

      async markAllRead(category?: string): Promise<number> {
        let count = 0
        for (const notification of notifications.values()) {
          if (!category || notification.category === category) {
            notification.read = true
            count++
          }
        }
        return count
      },

      async deleteAll(category?: string): Promise<number> {
        let count = 0
        for (const [id, notification] of notifications.entries()) {
          if (!category || notification.category === category) {
            notifications.delete(id)
            count++
          }
        }
        return count
      },

      async updateSettings(
        settings: Partial<NotificationSettings>
      ): Promise<NotificationSettings> {
        // Return default settings (in-memory implementation)
        return {
          enabled: true,
          soundEnabled: false,
          vibrationEnabled: false,
          categories: {},
          ...settings,
        }
      },

      async getSettings(): Promise<NotificationSettings> {
        return {
          enabled: true,
          soundEnabled: false,
          vibrationEnabled: false,
          categories: {},
        }
      },
    }
  }

  /**
   * Create default storage (localStorage/sessionStorage)
   */
  private createDefaultStorage(): NotificationStorage {
    const STORAGE_KEY = 'a2ui_notifications'

    return {
      async save(notifications: NotificationListItem[]): Promise<void> {
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
          }
        } catch (error) {
          console.error('Failed to save to storage:', error)
        }
      },

      async load(): Promise<NotificationListItem[]> {
        try {
          if (typeof localStorage !== 'undefined') {
            const data = localStorage.getItem(STORAGE_KEY)
            if (data) {
              const notifications = JSON.parse(data) as NotificationListItem[]
              // Convert timestamp strings back to Date objects
              return notifications.map((n) => ({
                ...n,
                timestamp: new Date(n.timestamp),
                snoozeUntil: n.snoozeUntil ? new Date(n.snoozeUntil) : undefined,
              }))
            }
          }
        } catch (error) {
          console.error('Failed to load from storage:', error)
        }
        return []
      },

      async clear(): Promise<void> {
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY)
          }
        } catch (error) {
          console.error('Failed to clear storage:', error)
        }
      },
    }
  }

  /**
   * Destroy the notification handler
   */
  public destroy(): void {
    // Clear all auto-close timers
    for (const state of this.notifications.values()) {
      if (state.autoCloseTimer) {
        clearTimeout(state.autoCloseTimer)
      }
    }

    // Stop real-time sync
    this.stopRealTimeSync()

    // Clear all event handlers
    this.eventHandlers.clear()

    // Clear notifications
    this.notifications.clear()

    // Clear subscriptions
    this.subscriptions.clear()
  }
}
