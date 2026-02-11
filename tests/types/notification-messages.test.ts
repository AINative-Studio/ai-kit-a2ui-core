/**
 * Notification Message Tests
 * Comprehensive tests for notification message types and type guards
 */

import { describe, it, expect } from 'vitest'
import {
  NotificationData,
  NotificationUpdateData,
  NotificationFilters,
  NotificationListItem,
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
  isNotificationCreateMessage,
  isNotificationCreatedMessage,
  isNotificationUpdateMessage,
  isNotificationUpdatedMessage,
  isNotificationDeleteMessage,
  isNotificationDeletedMessage,
  isNotificationMarkAllReadMessage,
  isNotificationAllMarkedReadMessage,
  isNotificationDeleteAllMessage,
  isNotificationAllDeletedMessage,
  isNotificationActionMessage,
  isNotificationListRequestMessage,
  isNotificationListResponseMessage,
  isNotificationGetRequestMessage,
  isNotificationGetResponseMessage,
  isNotificationSettingsUpdateMessage,
  isNotificationSettingsUpdatedMessage,
  isNotificationCountMessage,
  isNotificationSubscribeMessage,
  isNotificationUnsubscribeMessage,
  isNotificationErrorMessage,
  createNotificationCreateMessage,
  createNotificationUpdateMessage,
  createNotificationDeleteMessage,
  createNotificationListRequestMessage,
  createNotificationActionMessage,
} from '../../src/types/notification-messages.js'

describe('Notification Message Types', () => {
  describe('NotificationData', () => {
    it('creates valid notification data', () => {
      const notification: NotificationData = {
        id: 'notif-1',
        type: 'info',
        priority: 'medium',
        title: 'Test Notification',
        message: 'This is a test message',
        timestamp: Date.now(),
        read: false,
      }

      expect(notification.id).toBe('notif-1')
      expect(notification.type).toBe('info')
      expect(notification.priority).toBe('medium')
      expect(notification.title).toBe('Test Notification')
      expect(notification.message).toBe('This is a test message')
      expect(notification.read).toBe(false)
    })

    it('creates notification with all optional fields', () => {
      const notification: NotificationData = {
        id: 'notif-2',
        type: 'success',
        priority: 'high',
        title: 'Success',
        message: 'Operation completed',
        timestamp: Date.now(),
        read: false,
        actions: [
          {
            id: 'action-1',
            label: 'View',
            action: '/handlers/view',
          },
        ],
        richContent: {
          image: '/images/success.png',
          progress: 100,
        },
        category: 'system',
        dismissible: true,
        avatar: '/avatars/system.png',
        sender: 'System',
        link: '/details',
        expiresAt: Date.now() + 86400000,
        metadata: { customField: 'value' },
      }

      expect(notification.actions).toHaveLength(1)
      expect(notification.richContent?.progress).toBe(100)
      expect(notification.category).toBe('system')
      expect(notification.metadata?.customField).toBe('value')
    })
  })

  describe('NotificationUpdateData', () => {
    it('creates valid update data', () => {
      const update: NotificationUpdateData = {
        id: 'notif-1',
        read: true,
      }

      expect(update.id).toBe('notif-1')
      expect(update.read).toBe(true)
    })

    it('creates update with multiple fields', () => {
      const update: NotificationUpdateData = {
        id: 'notif-2',
        read: true,
        actions: [
          {
            id: 'action-1',
            label: 'Done',
            action: '/handlers/done',
          },
        ],
        metadata: { updated: true },
      }

      expect(update.actions).toHaveLength(1)
      expect(update.metadata?.updated).toBe(true)
    })
  })

  describe('NotificationFilters', () => {
    it('creates valid filters', () => {
      const filters: NotificationFilters = {
        type: ['info', 'success'],
        priority: ['high', 'urgent'],
        category: ['system', 'security'],
        read: false,
        startDate: Date.now() - 86400000,
        endDate: Date.now(),
        sender: 'System',
        query: 'test',
      }

      expect(filters.type).toHaveLength(2)
      expect(filters.priority).toHaveLength(2)
      expect(filters.category).toHaveLength(2)
      expect(filters.read).toBe(false)
      expect(filters.query).toBe('test')
    })
  })

  describe('NotificationCreateMessage', () => {
    it('creates valid create message', () => {
      const notification: NotificationData = {
        id: 'notif-1',
        type: 'info',
        priority: 'medium',
        title: 'Test',
        message: 'Test message',
        timestamp: Date.now(),
      }

      const message: NotificationCreateMessage = {
        type: 'notificationCreate',
        surfaceId: 'surface-1',
        componentId: 'notification-center-1',
        notification,
        timestamp: Date.now(),
      }

      expect(message.type).toBe('notificationCreate')
      expect(message.surfaceId).toBe('surface-1')
      expect(message.componentId).toBe('notification-center-1')
      expect(message.notification.id).toBe('notif-1')
    })

    it('is identified by type guard', () => {
      const message = {
        type: 'notificationCreate',
        surfaceId: 'surface-1',
        componentId: 'comp-1',
        notification: {
          id: 'notif-1',
          type: 'info',
          priority: 'medium',
          title: 'Test',
          message: 'Test',
          timestamp: Date.now(),
        },
      }
      expect(isNotificationCreateMessage(message)).toBe(true)
      expect(isNotificationCreateMessage({ type: 'other' })).toBe(false)
    })
  })

  describe('NotificationCreatedMessage', () => {
    it('creates valid created message', () => {
      const message: NotificationCreatedMessage = {
        type: 'notificationCreated',
        surfaceId: 'surface-1',
        componentId: 'notification-center-1',
        notificationId: 'notif-1',
        success: true,
        timestamp: Date.now(),
      }

      expect(message.type).toBe('notificationCreated')
      expect(message.notificationId).toBe('notif-1')
      expect(message.success).toBe(true)
    })

    it('is identified by type guard', () => {
      const message = {
        type: 'notificationCreated',
        surfaceId: 'surface-1',
        componentId: 'comp-1',
        notificationId: 'notif-1',
        success: true,
      }
      expect(isNotificationCreatedMessage(message)).toBe(true)
    })
  })

  describe('NotificationUpdateMessage', () => {
    it('creates valid update message', () => {
      const message: NotificationUpdateMessage = {
        type: 'notificationUpdate',
        surfaceId: 'surface-1',
        componentId: 'notification-center-1',
        update: {
          id: 'notif-1',
          read: true,
        },
        timestamp: Date.now(),
      }

      expect(message.type).toBe('notificationUpdate')
      expect(message.update.id).toBe('notif-1')
      expect(message.update.read).toBe(true)
    })

    it('is identified by type guard', () => {
      const message = {
        type: 'notificationUpdate',
        surfaceId: 'surface-1',
        componentId: 'comp-1',
        update: { id: 'notif-1', read: true },
      }
      expect(isNotificationUpdateMessage(message)).toBe(true)
    })
  })

  describe('NotificationDeleteMessage', () => {
    it('creates valid delete message', () => {
      const message: NotificationDeleteMessage = {
        type: 'notificationDelete',
        surfaceId: 'surface-1',
        componentId: 'notification-center-1',
        notificationId: 'notif-1',
        timestamp: Date.now(),
      }

      expect(message.type).toBe('notificationDelete')
      expect(message.notificationId).toBe('notif-1')
    })

    it('is identified by type guard', () => {
      const message = {
        type: 'notificationDelete',
        surfaceId: 'surface-1',
        componentId: 'comp-1',
        notificationId: 'notif-1',
      }
      expect(isNotificationDeleteMessage(message)).toBe(true)
    })
  })

  describe('NotificationMarkAllReadMessage', () => {
    it('creates valid mark all read message', () => {
      const message: NotificationMarkAllReadMessage = {
        type: 'notificationMarkAllRead',
        surfaceId: 'surface-1',
        componentId: 'notification-center-1',
        timestamp: Date.now(),
      }

      expect(message.type).toBe('notificationMarkAllRead')
    })

    it('creates message with filters', () => {
      const message: NotificationMarkAllReadMessage = {
        type: 'notificationMarkAllRead',
        surfaceId: 'surface-1',
        componentId: 'notification-center-1',
        filters: {
          type: ['info'],
          read: false,
        },
        timestamp: Date.now(),
      }

      expect(message.filters?.type).toEqual(['info'])
    })

    it('is identified by type guard', () => {
      const message = {
        type: 'notificationMarkAllRead',
        surfaceId: 'surface-1',
        componentId: 'comp-1',
      }
      expect(isNotificationMarkAllReadMessage(message)).toBe(true)
    })
  })

  describe('NotificationDeleteAllMessage', () => {
    it('creates valid delete all message', () => {
      const message: NotificationDeleteAllMessage = {
        type: 'notificationDeleteAll',
        surfaceId: 'surface-1',
        componentId: 'notification-center-1',
        timestamp: Date.now(),
      }

      expect(message.type).toBe('notificationDeleteAll')
    })

    it('creates message with filters', () => {
      const message: NotificationDeleteAllMessage = {
        type: 'notificationDeleteAll',
        surfaceId: 'surface-1',
        componentId: 'notification-center-1',
        filters: {
          read: true,
        },
        timestamp: Date.now(),
      }

      expect(message.filters?.read).toBe(true)
    })

    it('is identified by type guard', () => {
      const message = {
        type: 'notificationDeleteAll',
        surfaceId: 'surface-1',
        componentId: 'comp-1',
      }
      expect(isNotificationDeleteAllMessage(message)).toBe(true)
    })
  })

  describe('NotificationActionMessage', () => {
    it('creates valid action message', () => {
      const message: NotificationActionMessage = {
        type: 'notificationAction',
        surfaceId: 'surface-1',
        componentId: 'notification-center-1',
        notificationId: 'notif-1',
        actionId: 'action-1',
        action: '/handlers/action',
        timestamp: Date.now(),
      }

      expect(message.type).toBe('notificationAction')
      expect(message.notificationId).toBe('notif-1')
      expect(message.actionId).toBe('action-1')
      expect(message.action).toBe('/handlers/action')
    })

    it('is identified by type guard', () => {
      const message = {
        type: 'notificationAction',
        surfaceId: 'surface-1',
        componentId: 'comp-1',
        notificationId: 'notif-1',
        actionId: 'action-1',
        action: '/handlers/action',
      }
      expect(isNotificationActionMessage(message)).toBe(true)
    })
  })

  describe('NotificationListRequestMessage', () => {
    it('creates valid list request message', () => {
      const message: NotificationListRequestMessage = {
        type: 'notificationListRequest',
        surfaceId: 'surface-1',
        componentId: 'notification-center-1',
        limit: 50,
        offset: 0,
        sortOrder: 'desc',
        timestamp: Date.now(),
      }

      expect(message.type).toBe('notificationListRequest')
      expect(message.limit).toBe(50)
      expect(message.offset).toBe(0)
      expect(message.sortOrder).toBe('desc')
    })

    it('creates message with filters', () => {
      const message: NotificationListRequestMessage = {
        type: 'notificationListRequest',
        surfaceId: 'surface-1',
        componentId: 'notification-center-1',
        filters: {
          type: ['info', 'success'],
          read: false,
        },
        limit: 20,
        offset: 0,
        timestamp: Date.now(),
      }

      expect(message.filters?.type).toHaveLength(2)
      expect(message.filters?.read).toBe(false)
    })

    it('is identified by type guard', () => {
      const message = {
        type: 'notificationListRequest',
        surfaceId: 'surface-1',
        componentId: 'comp-1',
      }
      expect(isNotificationListRequestMessage(message)).toBe(true)
    })
  })

  describe('NotificationListResponseMessage', () => {
    it('creates valid list response message', () => {
      const notifications: NotificationListItem[] = [
        {
          id: 'notif-1',
          type: 'info',
          priority: 'medium',
          title: 'Test 1',
          message: 'Message 1',
          timestamp: Date.now(),
          read: false,
        },
        {
          id: 'notif-2',
          type: 'success',
          priority: 'high',
          title: 'Test 2',
          message: 'Message 2',
          timestamp: Date.now(),
          read: true,
        },
      ]

      const message: NotificationListResponseMessage = {
        type: 'notificationListResponse',
        surfaceId: 'surface-1',
        componentId: 'notification-center-1',
        notifications,
        totalCount: 100,
        unreadCount: 50,
        hasMore: true,
        timestamp: Date.now(),
      }

      expect(message.type).toBe('notificationListResponse')
      expect(message.notifications).toHaveLength(2)
      expect(message.totalCount).toBe(100)
      expect(message.unreadCount).toBe(50)
      expect(message.hasMore).toBe(true)
    })

    it('is identified by type guard', () => {
      const message = {
        type: 'notificationListResponse',
        surfaceId: 'surface-1',
        componentId: 'comp-1',
        notifications: [],
        totalCount: 0,
        unreadCount: 0,
        hasMore: false,
      }
      expect(isNotificationListResponseMessage(message)).toBe(true)
    })
  })

  describe('NotificationGetRequestMessage', () => {
    it('creates valid get request message', () => {
      const message: NotificationGetRequestMessage = {
        type: 'notificationGetRequest',
        surfaceId: 'surface-1',
        componentId: 'notification-center-1',
        notificationId: 'notif-1',
        timestamp: Date.now(),
      }

      expect(message.type).toBe('notificationGetRequest')
      expect(message.notificationId).toBe('notif-1')
    })

    it('is identified by type guard', () => {
      const message = {
        type: 'notificationGetRequest',
        surfaceId: 'surface-1',
        componentId: 'comp-1',
        notificationId: 'notif-1',
      }
      expect(isNotificationGetRequestMessage(message)).toBe(true)
    })
  })

  describe('NotificationGetResponseMessage', () => {
    it('creates valid get response message', () => {
      const notification: NotificationData = {
        id: 'notif-1',
        type: 'info',
        priority: 'medium',
        title: 'Test',
        message: 'Test message',
        timestamp: Date.now(),
      }

      const message: NotificationGetResponseMessage = {
        type: 'notificationGetResponse',
        surfaceId: 'surface-1',
        componentId: 'notification-center-1',
        notification,
        success: true,
        timestamp: Date.now(),
      }

      expect(message.type).toBe('notificationGetResponse')
      expect(message.notification?.id).toBe('notif-1')
      expect(message.success).toBe(true)
    })

    it('creates message with null notification', () => {
      const message: NotificationGetResponseMessage = {
        type: 'notificationGetResponse',
        surfaceId: 'surface-1',
        componentId: 'notification-center-1',
        notification: null,
        success: false,
        timestamp: Date.now(),
      }

      expect(message.notification).toBeNull()
      expect(message.success).toBe(false)
    })

    it('is identified by type guard', () => {
      const message = {
        type: 'notificationGetResponse',
        surfaceId: 'surface-1',
        componentId: 'comp-1',
        notification: null,
        success: false,
      }
      expect(isNotificationGetResponseMessage(message)).toBe(true)
    })
  })

  describe('NotificationSettingsUpdateMessage', () => {
    it('creates valid settings update message', () => {
      const message: NotificationSettingsUpdateMessage = {
        type: 'notificationSettingsUpdate',
        surfaceId: 'surface-1',
        componentId: 'notification-center-1',
        settings: {
          enabled: true,
          sound: false,
        },
        timestamp: Date.now(),
      }

      expect(message.type).toBe('notificationSettingsUpdate')
      expect(message.settings.enabled).toBe(true)
      expect(message.settings.sound).toBe(false)
    })

    it('is identified by type guard', () => {
      const message = {
        type: 'notificationSettingsUpdate',
        surfaceId: 'surface-1',
        componentId: 'comp-1',
        settings: {},
      }
      expect(isNotificationSettingsUpdateMessage(message)).toBe(true)
    })
  })

  describe('NotificationSettingsUpdatedMessage', () => {
    it('creates valid settings updated message', () => {
      const message: NotificationSettingsUpdatedMessage = {
        type: 'notificationSettingsUpdated',
        surfaceId: 'surface-1',
        componentId: 'notification-center-1',
        settings: {
          enabled: true,
          sound: false,
          desktop: false,
          autoMarkRead: true,
          channels: {},
        },
        success: true,
        timestamp: Date.now(),
      }

      expect(message.type).toBe('notificationSettingsUpdated')
      expect(message.settings.enabled).toBe(true)
      expect(message.success).toBe(true)
    })

    it('is identified by type guard', () => {
      const message = {
        type: 'notificationSettingsUpdated',
        surfaceId: 'surface-1',
        componentId: 'comp-1',
        settings: {
          enabled: true,
          sound: false,
          desktop: false,
          autoMarkRead: false,
          channels: {},
        },
        success: true,
      }
      expect(isNotificationSettingsUpdatedMessage(message)).toBe(true)
    })
  })

  describe('NotificationCountMessage', () => {
    it('creates valid count message', () => {
      const message: NotificationCountMessage = {
        type: 'notificationCount',
        surfaceId: 'surface-1',
        componentId: 'notification-center-1',
        unreadCount: 5,
        totalCount: 20,
        timestamp: Date.now(),
      }

      expect(message.type).toBe('notificationCount')
      expect(message.unreadCount).toBe(5)
      expect(message.totalCount).toBe(20)
    })

    it('is identified by type guard', () => {
      const message = {
        type: 'notificationCount',
        surfaceId: 'surface-1',
        componentId: 'comp-1',
        unreadCount: 5,
        totalCount: 20,
      }
      expect(isNotificationCountMessage(message)).toBe(true)
    })
  })

  describe('NotificationSubscribeMessage', () => {
    it('creates valid subscribe message', () => {
      const message: NotificationSubscribeMessage = {
        type: 'notificationSubscribe',
        surfaceId: 'surface-1',
        componentId: 'notification-center-1',
        timestamp: Date.now(),
      }

      expect(message.type).toBe('notificationSubscribe')
    })

    it('creates subscribe message with filters', () => {
      const message: NotificationSubscribeMessage = {
        type: 'notificationSubscribe',
        surfaceId: 'surface-1',
        componentId: 'notification-center-1',
        filters: {
          type: ['info', 'warning'],
        },
        timestamp: Date.now(),
      }

      expect(message.filters?.type).toEqual(['info', 'warning'])
    })

    it('is identified by type guard', () => {
      const message = {
        type: 'notificationSubscribe',
        surfaceId: 'surface-1',
        componentId: 'comp-1',
      }
      expect(isNotificationSubscribeMessage(message)).toBe(true)
    })
  })

  describe('NotificationUnsubscribeMessage', () => {
    it('creates valid unsubscribe message', () => {
      const message: NotificationUnsubscribeMessage = {
        type: 'notificationUnsubscribe',
        surfaceId: 'surface-1',
        componentId: 'notification-center-1',
        timestamp: Date.now(),
      }

      expect(message.type).toBe('notificationUnsubscribe')
    })

    it('is identified by type guard', () => {
      const message = {
        type: 'notificationUnsubscribe',
        surfaceId: 'surface-1',
        componentId: 'comp-1',
      }
      expect(isNotificationUnsubscribeMessage(message)).toBe(true)
    })
  })

  describe('NotificationErrorMessage', () => {
    it('creates valid error message', () => {
      const message: NotificationErrorMessage = {
        type: 'notificationError',
        surfaceId: 'surface-1',
        componentId: 'notification-center-1',
        error: 'Notification not found',
        errorCode: 'NOT_FOUND',
        timestamp: Date.now(),
      }

      expect(message.type).toBe('notificationError')
      expect(message.error).toBe('Notification not found')
      expect(message.errorCode).toBe('NOT_FOUND')
    })

    it('creates error message with details', () => {
      const message: NotificationErrorMessage = {
        type: 'notificationError',
        surfaceId: 'surface-1',
        componentId: 'notification-center-1',
        error: 'Server error',
        errorCode: 'SERVER_ERROR',
        details: {
          statusCode: 500,
          message: 'Internal server error',
        },
        timestamp: Date.now(),
      }

      expect(message.details).toBeDefined()
    })

    it('supports all error codes', () => {
      const errorCodes: NotificationErrorMessage['errorCode'][] = [
        'NOT_FOUND',
        'PERMISSION_DENIED',
        'INVALID_DATA',
        'SERVER_ERROR',
        'RATE_LIMITED',
      ]

      errorCodes.forEach((errorCode) => {
        const message: NotificationErrorMessage = {
          type: 'notificationError',
          surfaceId: 'surface-1',
          componentId: 'notification-center-1',
          error: 'Test error',
          errorCode,
          timestamp: Date.now(),
        }
        expect(message.errorCode).toBe(errorCode)
      })
    })

    it('is identified by type guard', () => {
      const message = {
        type: 'notificationError',
        surfaceId: 'surface-1',
        componentId: 'comp-1',
        error: 'Test error',
        errorCode: 'SERVER_ERROR',
      }
      expect(isNotificationErrorMessage(message)).toBe(true)
    })
  })

  describe('Helper Functions', () => {
    describe('createNotificationCreateMessage', () => {
      it('creates notification create message', () => {
        const notification: NotificationData = {
          id: 'notif-1',
          type: 'info',
          priority: 'medium',
          title: 'Test',
          message: 'Test message',
          timestamp: Date.now(),
        }

        const message = createNotificationCreateMessage('surface-1', 'comp-1', notification)

        expect(message.type).toBe('notificationCreate')
        expect(message.surfaceId).toBe('surface-1')
        expect(message.componentId).toBe('comp-1')
        expect(message.notification).toEqual(notification)
        expect(message.timestamp).toBeDefined()
      })
    })

    describe('createNotificationUpdateMessage', () => {
      it('creates notification update message', () => {
        const update: NotificationUpdateData = {
          id: 'notif-1',
          read: true,
        }

        const message = createNotificationUpdateMessage('surface-1', 'comp-1', update)

        expect(message.type).toBe('notificationUpdate')
        expect(message.surfaceId).toBe('surface-1')
        expect(message.componentId).toBe('comp-1')
        expect(message.update).toEqual(update)
        expect(message.timestamp).toBeDefined()
      })
    })

    describe('createNotificationDeleteMessage', () => {
      it('creates notification delete message', () => {
        const message = createNotificationDeleteMessage('surface-1', 'comp-1', 'notif-1')

        expect(message.type).toBe('notificationDelete')
        expect(message.surfaceId).toBe('surface-1')
        expect(message.componentId).toBe('comp-1')
        expect(message.notificationId).toBe('notif-1')
        expect(message.timestamp).toBeDefined()
      })
    })

    describe('createNotificationListRequestMessage', () => {
      it('creates list request message with defaults', () => {
        const message = createNotificationListRequestMessage('surface-1', 'comp-1')

        expect(message.type).toBe('notificationListRequest')
        expect(message.surfaceId).toBe('surface-1')
        expect(message.componentId).toBe('comp-1')
        expect(message.limit).toBe(50)
        expect(message.offset).toBe(0)
        expect(message.sortOrder).toBe('desc')
        expect(message.timestamp).toBeDefined()
      })

      it('creates list request message with custom parameters', () => {
        const filters: NotificationFilters = {
          type: ['info'],
          read: false,
        }

        const message = createNotificationListRequestMessage('surface-1', 'comp-1', filters, 20, 10)

        expect(message.filters).toEqual(filters)
        expect(message.limit).toBe(20)
        expect(message.offset).toBe(10)
      })
    })

    describe('createNotificationActionMessage', () => {
      it('creates notification action message', () => {
        const message = createNotificationActionMessage(
          'surface-1',
          'comp-1',
          'notif-1',
          'action-1',
          '/handlers/action'
        )

        expect(message.type).toBe('notificationAction')
        expect(message.surfaceId).toBe('surface-1')
        expect(message.componentId).toBe('comp-1')
        expect(message.notificationId).toBe('notif-1')
        expect(message.actionId).toBe('action-1')
        expect(message.action).toBe('/handlers/action')
        expect(message.timestamp).toBeDefined()
      })
    })
  })

  describe('Type Guard Coverage', () => {
    it('all type guards return false for null/undefined', () => {
      expect(isNotificationCreateMessage(null)).toBe(false)
      expect(isNotificationCreatedMessage(undefined)).toBe(false)
      expect(isNotificationUpdateMessage(null)).toBe(false)
      expect(isNotificationUpdatedMessage(undefined)).toBe(false)
      expect(isNotificationDeleteMessage(null)).toBe(false)
      expect(isNotificationDeletedMessage(undefined)).toBe(false)
      expect(isNotificationMarkAllReadMessage(null)).toBe(false)
      expect(isNotificationAllMarkedReadMessage(undefined)).toBe(false)
      expect(isNotificationDeleteAllMessage(null)).toBe(false)
      expect(isNotificationAllDeletedMessage(undefined)).toBe(false)
      expect(isNotificationActionMessage(null)).toBe(false)
      expect(isNotificationListRequestMessage(undefined)).toBe(false)
      expect(isNotificationListResponseMessage(null)).toBe(false)
      expect(isNotificationGetRequestMessage(undefined)).toBe(false)
      expect(isNotificationGetResponseMessage(null)).toBe(false)
      expect(isNotificationSettingsUpdateMessage(undefined)).toBe(false)
      expect(isNotificationSettingsUpdatedMessage(null)).toBe(false)
      expect(isNotificationCountMessage(undefined)).toBe(false)
      expect(isNotificationSubscribeMessage(null)).toBe(false)
      expect(isNotificationUnsubscribeMessage(undefined)).toBe(false)
      expect(isNotificationErrorMessage(null)).toBe(false)
    })

    it('all type guards return false for wrong type', () => {
      const wrongMessage = { type: 'wrongType' }
      expect(isNotificationCreateMessage(wrongMessage)).toBe(false)
      expect(isNotificationCreatedMessage(wrongMessage)).toBe(false)
      expect(isNotificationUpdateMessage(wrongMessage)).toBe(false)
      expect(isNotificationUpdatedMessage(wrongMessage)).toBe(false)
      expect(isNotificationDeleteMessage(wrongMessage)).toBe(false)
      expect(isNotificationDeletedMessage(wrongMessage)).toBe(false)
      expect(isNotificationMarkAllReadMessage(wrongMessage)).toBe(false)
      expect(isNotificationAllMarkedReadMessage(wrongMessage)).toBe(false)
      expect(isNotificationDeleteAllMessage(wrongMessage)).toBe(false)
      expect(isNotificationAllDeletedMessage(wrongMessage)).toBe(false)
      expect(isNotificationActionMessage(wrongMessage)).toBe(false)
      expect(isNotificationListRequestMessage(wrongMessage)).toBe(false)
      expect(isNotificationListResponseMessage(wrongMessage)).toBe(false)
      expect(isNotificationGetRequestMessage(wrongMessage)).toBe(false)
      expect(isNotificationGetResponseMessage(wrongMessage)).toBe(false)
      expect(isNotificationSettingsUpdateMessage(wrongMessage)).toBe(false)
      expect(isNotificationSettingsUpdatedMessage(wrongMessage)).toBe(false)
      expect(isNotificationCountMessage(wrongMessage)).toBe(false)
      expect(isNotificationSubscribeMessage(wrongMessage)).toBe(false)
      expect(isNotificationUnsubscribeMessage(wrongMessage)).toBe(false)
      expect(isNotificationErrorMessage(wrongMessage)).toBe(false)
    })
  })
})
