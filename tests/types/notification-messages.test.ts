/**
 * Notification Message Tests
 * Comprehensive tests for notification message types and helpers
 */

import { describe, it, expect } from 'vitest'
import type {
  NotificationCreateMessage,
  NotificationUpdateMessage,
  NotificationDeleteMessage,
  NotificationMarkAllReadMessage,
  NotificationDeleteAllMessage,
  NotificationActionMessage,
  NotificationListRequestMessage,
  NotificationGetRequestMessage,
  NotificationSettingsUpdateMessage,
  NotificationMessage,
} from '../../src/types/index.js'
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
  createNotificationCreateMessage,
  createNotificationUpdateMessage,
  createNotificationDeleteMessage,
  createNotificationListRequestMessage,
  createNotificationActionMessage,
} from '../../src/types/notification-messages.js'

describe('Notification Message Types', () => {
  describe('Create Notification Message', () => {
    it('creates valid notification create message', () => {
      const message: NotificationCreateMessage = {
        type: 'notificationCreate',
        componentId: 'notif-center-1',
        notification: {
          type: 'success',
          title: 'Success',
          message: 'Operation completed successfully',
        },
        timestamp: Date.now(),
      }

      expect(message.type).toBe('notificationCreate')
      expect(message.componentId).toBe('notif-center-1')
      expect(message.notification.type).toBe('success')
      expect(message.notification.title).toBe('Success')
    })

    it('creates notification with all properties', () => {
      const message: NotificationCreateMessage = {
        type: 'notificationCreate',
        componentId: 'notif-center-1',
        notification: {
          type: 'error',
          title: 'Error',
          message: 'An error occurred',
          category: 'system',
          priority: 'high',
          icon: 'x-circle',
          avatar: 'https://example.com/avatar.jpg',
          image: 'https://example.com/error.jpg',
          actions: [
            { label: 'Retry', action: 'retry', primary: true },
            { label: 'Dismiss', action: 'dismiss' },
          ],
          autoClose: false,
          richContent: {
            html: '<p>Error details</p>',
          },
          metadata: { errorCode: 'ERR_001' },
        },
        timestamp: Date.now(),
      }

      expect(message.notification.category).toBe('system')
      expect(message.notification.priority).toBe('high')
      expect(message.notification.actions).toHaveLength(2)
      expect(message.notification.metadata?.errorCode).toBe('ERR_001')
    })

    it('creates message using helper function', () => {
      const message = createNotificationCreateMessage('notif-center-1', {
        type: 'info',
        title: 'Info',
        message: 'Information message',
      })

      expect(message.type).toBe('notificationCreate')
      expect(message.componentId).toBe('notif-center-1')
      expect(message.notification.type).toBe('info')
      expect(message.timestamp).toBeDefined()
    })
  })

  describe('Update Notification Message', () => {
    it('creates valid notification update message', () => {
      const message: NotificationUpdateMessage = {
        type: 'notificationUpdate',
        componentId: 'notif-center-1',
        notificationId: 'notif-123',
        updates: {
          read: true,
        },
        timestamp: Date.now(),
      }

      expect(message.type).toBe('notificationUpdate')
      expect(message.notificationId).toBe('notif-123')
      expect(message.updates.read).toBe(true)
    })

    it('creates message with all update fields', () => {
      const snoozeUntil = new Date(Date.now() + 3600000)
      const message: NotificationUpdateMessage = {
        type: 'notificationUpdate',
        componentId: 'notif-center-1',
        notificationId: 'notif-123',
        updates: {
          read: true,
          snoozed: true,
          snoozeUntil,
          archived: false,
        },
        timestamp: Date.now(),
      }

      expect(message.updates.read).toBe(true)
      expect(message.updates.snoozed).toBe(true)
      expect(message.updates.snoozeUntil).toBe(snoozeUntil)
      expect(message.updates.archived).toBe(false)
    })

    it('creates message using helper function', () => {
      const message = createNotificationUpdateMessage('notif-center-1', 'notif-123', {
        read: true,
      })

      expect(message.type).toBe('notificationUpdate')
      expect(message.notificationId).toBe('notif-123')
      expect(message.updates.read).toBe(true)
      expect(message.timestamp).toBeDefined()
    })
  })

  describe('Delete Notification Message', () => {
    it('creates valid notification delete message', () => {
      const message: NotificationDeleteMessage = {
        type: 'notificationDelete',
        componentId: 'notif-center-1',
        notificationId: 'notif-123',
        timestamp: Date.now(),
      }

      expect(message.type).toBe('notificationDelete')
      expect(message.notificationId).toBe('notif-123')
    })

    it('creates message using helper function', () => {
      const message = createNotificationDeleteMessage('notif-center-1', 'notif-123')

      expect(message.type).toBe('notificationDelete')
      expect(message.notificationId).toBe('notif-123')
      expect(message.timestamp).toBeDefined()
    })
  })

  describe('Mark All Read Message', () => {
    it('creates mark all read message without category', () => {
      const message: NotificationMarkAllReadMessage = {
        type: 'notificationMarkAllRead',
        componentId: 'notif-center-1',
        timestamp: Date.now(),
      }

      expect(message.type).toBe('notificationMarkAllRead')
      expect(message.category).toBeUndefined()
    })

    it('creates mark all read message with category', () => {
      const message: NotificationMarkAllReadMessage = {
        type: 'notificationMarkAllRead',
        componentId: 'notif-center-1',
        category: 'system',
        timestamp: Date.now(),
      }

      expect(message.type).toBe('notificationMarkAllRead')
      expect(message.category).toBe('system')
    })
  })

  describe('Delete All Message', () => {
    it('creates delete all message without category', () => {
      const message: NotificationDeleteAllMessage = {
        type: 'notificationDeleteAll',
        componentId: 'notif-center-1',
        timestamp: Date.now(),
      }

      expect(message.type).toBe('notificationDeleteAll')
      expect(message.category).toBeUndefined()
    })

    it('creates delete all message with category', () => {
      const message: NotificationDeleteAllMessage = {
        type: 'notificationDeleteAll',
        componentId: 'notif-center-1',
        category: 'alerts',
        timestamp: Date.now(),
      }

      expect(message.type).toBe('notificationDeleteAll')
      expect(message.category).toBe('alerts')
    })
  })

  describe('Notification Action Message', () => {
    it('creates notification action message', () => {
      const message: NotificationActionMessage = {
        type: 'notificationAction',
        componentId: 'notif-center-1',
        notificationId: 'notif-123',
        action: 'retry',
        timestamp: Date.now(),
      }

      expect(message.type).toBe('notificationAction')
      expect(message.notificationId).toBe('notif-123')
      expect(message.action).toBe('retry')
    })

    it('creates action message with context', () => {
      const message: NotificationActionMessage = {
        type: 'notificationAction',
        componentId: 'notif-center-1',
        notificationId: 'notif-123',
        action: 'retry',
        context: { attemptNumber: 2, errorCode: 'ERR_001' },
        timestamp: Date.now(),
      }

      expect(message.context?.attemptNumber).toBe(2)
      expect(message.context?.errorCode).toBe('ERR_001')
    })

    it('creates message using helper function', () => {
      const message = createNotificationActionMessage(
        'notif-center-1',
        'notif-123',
        'dismiss',
        { reason: 'user_dismissed' }
      )

      expect(message.type).toBe('notificationAction')
      expect(message.action).toBe('dismiss')
      expect(message.context?.reason).toBe('user_dismissed')
      expect(message.timestamp).toBeDefined()
    })
  })

  describe('List Notifications Request Message', () => {
    it('creates list request without filters', () => {
      const message: NotificationListRequestMessage = {
        type: 'notificationListRequest',
        componentId: 'notif-center-1',
        timestamp: Date.now(),
      }

      expect(message.type).toBe('notificationListRequest')
      expect(message.filters).toBeUndefined()
    })

    it('creates list request with filters', () => {
      const message: NotificationListRequestMessage = {
        type: 'notificationListRequest',
        componentId: 'notif-center-1',
        filters: {
          type: ['error', 'warning'],
          category: ['system', 'security'],
          read: false,
        },
        limit: 20,
        offset: 0,
        sortBy: 'timestamp',
        sortOrder: 'desc',
        timestamp: Date.now(),
      }

      expect(message.filters?.type).toEqual(['error', 'warning'])
      expect(message.filters?.category).toEqual(['system', 'security'])
      expect(message.filters?.read).toBe(false)
      expect(message.limit).toBe(20)
      expect(message.sortBy).toBe('timestamp')
    })

    it('creates list request with date filters', () => {
      const dateFrom = new Date('2024-01-01')
      const dateTo = new Date('2024-12-31')

      const message: NotificationListRequestMessage = {
        type: 'notificationListRequest',
        componentId: 'notif-center-1',
        filters: {
          dateFrom,
          dateTo,
        },
        timestamp: Date.now(),
      }

      expect(message.filters?.dateFrom).toBe(dateFrom)
      expect(message.filters?.dateTo).toBe(dateTo)
    })

    it('creates message using helper function', () => {
      const message = createNotificationListRequestMessage(
        'notif-center-1',
        { type: ['success'], read: true },
        10,
        5
      )

      expect(message.type).toBe('notificationListRequest')
      expect(message.filters?.type).toEqual(['success'])
      expect(message.limit).toBe(10)
      expect(message.offset).toBe(5)
      expect(message.timestamp).toBeDefined()
    })
  })

  describe('Get Notification Request Message', () => {
    it('creates get notification request', () => {
      const message: NotificationGetRequestMessage = {
        type: 'notificationGetRequest',
        componentId: 'notif-center-1',
        notificationId: 'notif-123',
        timestamp: Date.now(),
      }

      expect(message.type).toBe('notificationGetRequest')
      expect(message.notificationId).toBe('notif-123')
    })
  })

  describe('Settings Update Message', () => {
    it('creates settings update message', () => {
      const message: NotificationSettingsUpdateMessage = {
        type: 'notificationSettingsUpdate',
        componentId: 'notif-center-1',
        settings: {
          enabled: true,
          soundEnabled: false,
          vibrationEnabled: true,
          categories: {
            system: true,
            alerts: false,
          },
        },
        timestamp: Date.now(),
      }

      expect(message.type).toBe('notificationSettingsUpdate')
      expect(message.settings.enabled).toBe(true)
      expect(message.settings.soundEnabled).toBe(false)
      expect(message.settings.categories?.system).toBe(true)
    })

    it('creates partial settings update', () => {
      const message: NotificationSettingsUpdateMessage = {
        type: 'notificationSettingsUpdate',
        componentId: 'notif-center-1',
        settings: {
          soundEnabled: true,
        },
        timestamp: Date.now(),
      }

      expect(message.settings.soundEnabled).toBe(true)
      expect(message.settings.enabled).toBeUndefined()
    })
  })

  describe('Type Guards', () => {
    it('identifies notification create messages', () => {
      const message: NotificationMessage = {
        type: 'notificationCreate',
        componentId: 'notif-center-1',
        notification: {
          type: 'info',
          title: 'Info',
          message: 'Message',
        },
        timestamp: Date.now(),
      }

      expect(isNotificationCreateMessage(message)).toBe(true)
      expect(isNotificationUpdateMessage(message)).toBe(false)
      expect(isNotificationDeleteMessage(message)).toBe(false)
    })

    it('identifies notification update messages', () => {
      const message: NotificationMessage = {
        type: 'notificationUpdate',
        componentId: 'notif-center-1',
        notificationId: 'notif-123',
        updates: { read: true },
        timestamp: Date.now(),
      }

      expect(isNotificationCreateMessage(message)).toBe(false)
      expect(isNotificationUpdateMessage(message)).toBe(true)
      expect(isNotificationDeleteMessage(message)).toBe(false)
    })

    it('identifies notification delete messages', () => {
      const message: NotificationMessage = {
        type: 'notificationDelete',
        componentId: 'notif-center-1',
        notificationId: 'notif-123',
        timestamp: Date.now(),
      }

      expect(isNotificationCreateMessage(message)).toBe(false)
      expect(isNotificationUpdateMessage(message)).toBe(false)
      expect(isNotificationDeleteMessage(message)).toBe(true)
    })

    it('identifies mark all read messages', () => {
      const message: NotificationMessage = {
        type: 'notificationMarkAllRead',
        componentId: 'notif-center-1',
        timestamp: Date.now(),
      }

      expect(isNotificationMarkAllReadMessage(message)).toBe(true)
      expect(isNotificationDeleteAllMessage(message)).toBe(false)
    })

    it('identifies delete all messages', () => {
      const message: NotificationMessage = {
        type: 'notificationDeleteAll',
        componentId: 'notif-center-1',
        timestamp: Date.now(),
      }

      expect(isNotificationMarkAllReadMessage(message)).toBe(false)
      expect(isNotificationDeleteAllMessage(message)).toBe(true)
    })

    it('identifies action messages', () => {
      const message: NotificationMessage = {
        type: 'notificationAction',
        componentId: 'notif-center-1',
        notificationId: 'notif-123',
        action: 'retry',
        timestamp: Date.now(),
      }

      expect(isNotificationActionMessage(message)).toBe(true)
      expect(isNotificationCreateMessage(message)).toBe(false)
    })

    it('identifies list request messages', () => {
      const message: NotificationMessage = {
        type: 'notificationListRequest',
        componentId: 'notif-center-1',
        timestamp: Date.now(),
      }

      expect(isNotificationListRequestMessage(message)).toBe(true)
      expect(isNotificationGetRequestMessage(message)).toBe(false)
    })

    it('identifies get request messages', () => {
      const message: NotificationMessage = {
        type: 'notificationGetRequest',
        componentId: 'notif-center-1',
        notificationId: 'notif-123',
        timestamp: Date.now(),
      }

      expect(isNotificationGetRequestMessage(message)).toBe(true)
      expect(isNotificationListRequestMessage(message)).toBe(false)
    })

    it('identifies settings update messages', () => {
      const message: NotificationMessage = {
        type: 'notificationSettingsUpdate',
        componentId: 'notif-center-1',
        settings: { enabled: true },
        timestamp: Date.now(),
      }

      expect(isNotificationSettingsUpdateMessage(message)).toBe(true)
      expect(isNotificationCreateMessage(message)).toBe(false)
    })
  })

  describe('Filters', () => {
    it('supports type filtering', () => {
      const message: NotificationListRequestMessage = {
        type: 'notificationListRequest',
        componentId: 'notif-center-1',
        filters: {
          type: ['error', 'warning'],
        },
        timestamp: Date.now(),
      }

      expect(message.filters?.type).toContain('error')
      expect(message.filters?.type).toContain('warning')
    })

    it('supports category filtering', () => {
      const message: NotificationListRequestMessage = {
        type: 'notificationListRequest',
        componentId: 'notif-center-1',
        filters: {
          category: ['system', 'security', 'updates'],
        },
        timestamp: Date.now(),
      }

      expect(message.filters?.category).toHaveLength(3)
    })

    it('supports priority filtering', () => {
      const message: NotificationListRequestMessage = {
        type: 'notificationListRequest',
        componentId: 'notif-center-1',
        filters: {
          priority: ['high', 'urgent'],
        },
        timestamp: Date.now(),
      }

      expect(message.filters?.priority).toEqual(['high', 'urgent'])
    })

    it('supports archived filtering', () => {
      const message: NotificationListRequestMessage = {
        type: 'notificationListRequest',
        componentId: 'notif-center-1',
        filters: {
          archived: false,
        },
        timestamp: Date.now(),
      }

      expect(message.filters?.archived).toBe(false)
    })
  })

  describe('Pagination and Sorting', () => {
    it('supports pagination', () => {
      const message: NotificationListRequestMessage = {
        type: 'notificationListRequest',
        componentId: 'notif-center-1',
        limit: 25,
        offset: 50,
        timestamp: Date.now(),
      }

      expect(message.limit).toBe(25)
      expect(message.offset).toBe(50)
    })

    it('supports sorting by timestamp', () => {
      const message: NotificationListRequestMessage = {
        type: 'notificationListRequest',
        componentId: 'notif-center-1',
        sortBy: 'timestamp',
        sortOrder: 'desc',
        timestamp: Date.now(),
      }

      expect(message.sortBy).toBe('timestamp')
      expect(message.sortOrder).toBe('desc')
    })

    it('supports sorting by priority', () => {
      const message: NotificationListRequestMessage = {
        type: 'notificationListRequest',
        componentId: 'notif-center-1',
        sortBy: 'priority',
        sortOrder: 'asc',
        timestamp: Date.now(),
      }

      expect(message.sortBy).toBe('priority')
      expect(message.sortOrder).toBe('asc')
    })
  })
})
