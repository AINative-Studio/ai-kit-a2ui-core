/**
 * Notification Component Tests
 * Comprehensive tests for notification component types and utilities
 */

import { describe, it, expect } from 'vitest'
import {
  NotificationType,
  NotificationPriority,
  NotificationPosition,
  NotificationFilterType,
  NotificationGroupBy,
  BadgePosition,
  NotificationCategory,
  NotificationAction,
  NotificationRichContent,
  NotificationCenterProperties,
  NotificationCenterComponent,
  NotificationItemProperties,
  NotificationItemComponent,
  NotificationBadgeProperties,
  NotificationBadgeComponent,
  NotificationState,
  NotificationSettings,
  DEFAULT_NOTIFICATION_CENTER_PROPERTIES,
  DEFAULT_NOTIFICATION_BADGE_PROPERTIES,
  isNotificationCenterComponent,
  isNotificationItemComponent,
  isNotificationBadgeComponent,
  createNotificationCenter,
  createNotificationItem,
  createNotificationBadge,
  formatNotificationTimestamp,
  getNotificationIcon,
  getNotificationColor,
} from '../../src/types/notification-components.js'

describe('Notification Component Types', () => {
  describe('NotificationType', () => {
    it('validates all notification types', () => {
      const types: NotificationType[] = ['info', 'success', 'warning', 'error', 'system']
      types.forEach((type) => {
        expect(['info', 'success', 'warning', 'error', 'system']).toContain(type)
      })
    })
  })

  describe('NotificationPriority', () => {
    it('validates all priority levels', () => {
      const priorities: NotificationPriority[] = ['low', 'medium', 'high', 'urgent']
      priorities.forEach((priority) => {
        expect(['low', 'medium', 'high', 'urgent']).toContain(priority)
      })
    })
  })

  describe('NotificationPosition', () => {
    it('validates all positions', () => {
      const positions: NotificationPosition[] = [
        'top-right',
        'top-left',
        'bottom-right',
        'bottom-left',
        'top-center',
        'bottom-center',
      ]
      positions.forEach((position) => {
        expect([
          'top-right',
          'top-left',
          'bottom-right',
          'bottom-left',
          'top-center',
          'bottom-center',
        ]).toContain(position)
      })
    })
  })

  describe('NotificationCenterComponent', () => {
    it('creates valid notification center with minimal properties', () => {
      const component: NotificationCenterComponent = {
        type: 'notificationCenter',
        id: 'notification-center-1',
      }

      expect(component.type).toBe('notificationCenter')
      expect(component.id).toBe('notification-center-1')
    })

    it('creates valid notification center with all properties', () => {
      const component: NotificationCenterComponent = {
        type: 'notificationCenter',
        id: 'notification-center-2',
        properties: {
          maxVisible: 20,
          position: 'top-right',
          autoHide: true,
          autoHideDuration: 3000,
          groupBy: 'type',
          filterType: ['info', 'success'],
          showBadge: true,
          sound: true,
          realtime: true,
          soundUrl: '/sounds/notification.mp3',
          desktopNotifications: true,
          width: 400,
          maxHeight: 600,
          theme: 'dark',
          onNotificationClick: '/handlers/notificationClick',
          onNotificationDismiss: '/handlers/notificationDismiss',
          onActionClick: '/handlers/actionClick',
          onMarkAllRead: '/handlers/markAllRead',
        },
      }

      expect(component.type).toBe('notificationCenter')
      expect(component.properties?.maxVisible).toBe(20)
      expect(component.properties?.position).toBe('top-right')
      expect(component.properties?.autoHide).toBe(true)
      expect(component.properties?.autoHideDuration).toBe(3000)
      expect(component.properties?.groupBy).toBe('type')
      expect(component.properties?.filterType).toEqual(['info', 'success'])
      expect(component.properties?.showBadge).toBe(true)
      expect(component.properties?.sound).toBe(true)
      expect(component.properties?.realtime).toBe(true)
      expect(component.properties?.soundUrl).toBe('/sounds/notification.mp3')
      expect(component.properties?.desktopNotifications).toBe(true)
      expect(component.properties?.width).toBe(400)
      expect(component.properties?.maxHeight).toBe(600)
      expect(component.properties?.theme).toBe('dark')
    })

    it('supports different grouping strategies', () => {
      const groupByOptions: NotificationGroupBy[] = ['none', 'type', 'priority', 'category', 'date']
      groupByOptions.forEach((groupBy) => {
        const component: NotificationCenterComponent = {
          type: 'notificationCenter',
          id: `center-${groupBy}`,
          properties: { groupBy },
        }
        expect(component.properties?.groupBy).toBe(groupBy)
      })
    })

    it('supports different positions', () => {
      const positions: NotificationPosition[] = ['top-right', 'bottom-left', 'top-center']
      positions.forEach((position) => {
        const component: NotificationCenterComponent = {
          type: 'notificationCenter',
          id: `center-${position}`,
          properties: { position },
        }
        expect(component.properties?.position).toBe(position)
      })
    })
  })

  describe('NotificationItemComponent', () => {
    it('creates valid notification item with required properties', () => {
      const properties: NotificationItemProperties = {
        notificationId: 'notif-123',
        notificationType: 'info',
        priority: 'medium',
        title: 'Test Notification',
        message: 'This is a test message',
        timestamp: Date.now(),
      }

      const component: NotificationItemComponent = {
        type: 'notificationItem',
        id: 'item-1',
        properties,
      }

      expect(component.type).toBe('notificationItem')
      expect(component.properties.notificationId).toBe('notif-123')
      expect(component.properties.notificationType).toBe('info')
      expect(component.properties.priority).toBe('medium')
      expect(component.properties.title).toBe('Test Notification')
      expect(component.properties.message).toBe('This is a test message')
    })

    it('creates notification item with all optional properties', () => {
      const actions: NotificationAction[] = [
        {
          id: 'action-1',
          label: 'View',
          action: '/handlers/view',
          variant: 'primary',
          closeOnClick: true,
        },
        {
          id: 'action-2',
          label: 'Dismiss',
          action: '/handlers/dismiss',
          variant: 'ghost',
          closeOnClick: true,
        },
      ]

      const richContent: NotificationRichContent = {
        image: '/images/notification.png',
        progress: 75,
        icon: 'bell',
        link: '/details',
        linkText: 'View Details',
        metadata: { customField: 'value' },
      }

      const properties: NotificationItemProperties = {
        notificationId: 'notif-456',
        notificationType: 'success',
        priority: 'high',
        title: 'Upload Complete',
        message: 'Your file has been successfully uploaded',
        timestamp: Date.now(),
        read: false,
        actions,
        richContent,
        category: 'system',
        dismissible: true,
        avatar: '/avatars/system.png',
        sender: 'System',
        link: '/uploads',
        expiresAt: Date.now() + 86400000, // 24 hours
        onClick: '/handlers/onClick',
        onDismiss: '/handlers/onDismiss',
        onAction: '/handlers/onAction',
      }

      const component: NotificationItemComponent = {
        type: 'notificationItem',
        id: 'item-2',
        properties,
      }

      expect(component.properties.actions).toHaveLength(2)
      expect(component.properties.richContent?.progress).toBe(75)
      expect(component.properties.category).toBe('system')
      expect(component.properties.dismissible).toBe(true)
      expect(component.properties.sender).toBe('System')
    })

    it('supports all notification types', () => {
      const types: NotificationType[] = ['info', 'success', 'warning', 'error', 'system']
      types.forEach((type) => {
        const properties: NotificationItemProperties = {
          notificationId: `notif-${type}`,
          notificationType: type,
          priority: 'medium',
          title: 'Test',
          message: 'Test message',
          timestamp: Date.now(),
        }
        expect(properties.notificationType).toBe(type)
      })
    })

    it('supports all priority levels', () => {
      const priorities: NotificationPriority[] = ['low', 'medium', 'high', 'urgent']
      priorities.forEach((priority) => {
        const properties: NotificationItemProperties = {
          notificationId: `notif-${priority}`,
          notificationType: 'info',
          priority,
          title: 'Test',
          message: 'Test message',
          timestamp: Date.now(),
        }
        expect(properties.priority).toBe(priority)
      })
    })

    it('supports all categories', () => {
      const categories: NotificationCategory[] = [
        'account',
        'billing',
        'security',
        'system',
        'social',
        'update',
        'message',
        'alert',
        'reminder',
      ]
      categories.forEach((category) => {
        const properties: NotificationItemProperties = {
          notificationId: `notif-${category}`,
          notificationType: 'info',
          priority: 'medium',
          title: 'Test',
          message: 'Test message',
          timestamp: Date.now(),
          category,
        }
        expect(properties.category).toBe(category)
      })
    })
  })

  describe('NotificationBadgeComponent', () => {
    it('creates valid badge with minimal properties', () => {
      const component: NotificationBadgeComponent = {
        type: 'notificationBadge',
        id: 'badge-1',
        properties: {
          count: 5,
        },
      }

      expect(component.type).toBe('notificationBadge')
      expect(component.properties.count).toBe(5)
    })

    it('creates badge with all properties', () => {
      const component: NotificationBadgeComponent = {
        type: 'notificationBadge',
        id: 'badge-2',
        properties: {
          count: 99,
          maxCount: 99,
          position: 'top-right',
          dot: false,
          color: '#ffffff',
          backgroundColor: '#ef4444',
          animate: true,
          size: 'md',
          ariaLabel: '99 unread notifications',
          onClick: '/handlers/badgeClick',
        },
      }

      expect(component.properties.count).toBe(99)
      expect(component.properties.maxCount).toBe(99)
      expect(component.properties.position).toBe('top-right')
      expect(component.properties.dot).toBe(false)
      expect(component.properties.color).toBe('#ffffff')
      expect(component.properties.backgroundColor).toBe('#ef4444')
      expect(component.properties.animate).toBe(true)
      expect(component.properties.size).toBe('md')
    })

    it('supports all badge positions', () => {
      const positions: BadgePosition[] = ['top-right', 'top-left', 'bottom-right', 'bottom-left']
      positions.forEach((position) => {
        const component: NotificationBadgeComponent = {
          type: 'notificationBadge',
          id: `badge-${position}`,
          properties: {
            count: 1,
            position,
          },
        }
        expect(component.properties.position).toBe(position)
      })
    })

    it('supports all badge sizes', () => {
      const sizes: ('sm' | 'md' | 'lg')[] = ['sm', 'md', 'lg']
      sizes.forEach((size) => {
        const component: NotificationBadgeComponent = {
          type: 'notificationBadge',
          id: `badge-${size}`,
          properties: {
            count: 1,
            size,
          },
        }
        expect(component.properties.size).toBe(size)
      })
    })

    it('supports dot mode instead of count', () => {
      const component: NotificationBadgeComponent = {
        type: 'notificationBadge',
        id: 'badge-dot',
        properties: {
          count: 0,
          dot: true,
        },
      }
      expect(component.properties.dot).toBe(true)
    })
  })

  describe('NotificationState', () => {
    it('creates valid notification state', () => {
      const state: NotificationState = {
        notifications: [],
        unreadCount: 0,
        totalCount: 0,
        lastUpdate: Date.now(),
      }

      expect(state.notifications).toHaveLength(0)
      expect(state.unreadCount).toBe(0)
      expect(state.totalCount).toBe(0)
    })

    it('tracks notifications with filter and sort', () => {
      const notifications: NotificationItemProperties[] = [
        {
          notificationId: '1',
          notificationType: 'info',
          priority: 'medium',
          title: 'Test 1',
          message: 'Message 1',
          timestamp: Date.now(),
          read: false,
        },
        {
          notificationId: '2',
          notificationType: 'success',
          priority: 'high',
          title: 'Test 2',
          message: 'Message 2',
          timestamp: Date.now(),
          read: true,
        },
      ]

      const state: NotificationState = {
        notifications,
        unreadCount: 1,
        totalCount: 2,
        lastUpdate: Date.now(),
        activeFilter: 'unread',
        sortOrder: 'desc',
      }

      expect(state.notifications).toHaveLength(2)
      expect(state.unreadCount).toBe(1)
      expect(state.totalCount).toBe(2)
      expect(state.activeFilter).toBe('unread')
      expect(state.sortOrder).toBe('desc')
    })
  })

  describe('NotificationSettings', () => {
    it('creates valid notification settings', () => {
      const settings: NotificationSettings = {
        enabled: true,
        sound: true,
        desktop: false,
        autoMarkRead: true,
        channels: {
          account: true,
          billing: true,
          security: true,
          system: true,
        },
      }

      expect(settings.enabled).toBe(true)
      expect(settings.sound).toBe(true)
      expect(settings.desktop).toBe(false)
      expect(settings.autoMarkRead).toBe(true)
      expect(settings.channels.account).toBe(true)
    })

    it('supports do not disturb mode', () => {
      const settings: NotificationSettings = {
        enabled: true,
        sound: false,
        desktop: false,
        autoMarkRead: false,
        channels: {},
        doNotDisturb: true,
        dndStartTime: '22:00',
        dndEndTime: '08:00',
      }

      expect(settings.doNotDisturb).toBe(true)
      expect(settings.dndStartTime).toBe('22:00')
      expect(settings.dndEndTime).toBe('08:00')
    })
  })

  describe('Default Properties', () => {
    it('has valid default notification center properties', () => {
      expect(DEFAULT_NOTIFICATION_CENTER_PROPERTIES.maxVisible).toBe(10)
      expect(DEFAULT_NOTIFICATION_CENTER_PROPERTIES.position).toBe('top-right')
      expect(DEFAULT_NOTIFICATION_CENTER_PROPERTIES.autoHide).toBe(false)
      expect(DEFAULT_NOTIFICATION_CENTER_PROPERTIES.autoHideDuration).toBe(5000)
      expect(DEFAULT_NOTIFICATION_CENTER_PROPERTIES.groupBy).toBe('none')
      expect(DEFAULT_NOTIFICATION_CENTER_PROPERTIES.showBadge).toBe(true)
      expect(DEFAULT_NOTIFICATION_CENTER_PROPERTIES.sound).toBe(false)
      expect(DEFAULT_NOTIFICATION_CENTER_PROPERTIES.realtime).toBe(true)
    })

    it('has valid default notification badge properties', () => {
      expect(DEFAULT_NOTIFICATION_BADGE_PROPERTIES.maxCount).toBe(99)
      expect(DEFAULT_NOTIFICATION_BADGE_PROPERTIES.position).toBe('top-right')
      expect(DEFAULT_NOTIFICATION_BADGE_PROPERTIES.dot).toBe(false)
      expect(DEFAULT_NOTIFICATION_BADGE_PROPERTIES.animate).toBe(true)
      expect(DEFAULT_NOTIFICATION_BADGE_PROPERTIES.size).toBe('md')
    })
  })

  describe('Type Guards', () => {
    it('identifies notification center component', () => {
      const component: NotificationCenterComponent = {
        type: 'notificationCenter',
        id: 'center-1',
      }
      expect(isNotificationCenterComponent(component)).toBe(true)
      expect(isNotificationCenterComponent({ type: 'other' })).toBe(false)
      expect(isNotificationCenterComponent(null)).toBe(false)
      expect(isNotificationCenterComponent(undefined)).toBe(false)
    })

    it('identifies notification item component', () => {
      const component: NotificationItemComponent = {
        type: 'notificationItem',
        id: 'item-1',
        properties: {
          notificationId: '1',
          notificationType: 'info',
          priority: 'medium',
          title: 'Test',
          message: 'Test',
          timestamp: Date.now(),
        },
      }
      expect(isNotificationItemComponent(component)).toBe(true)
      expect(isNotificationItemComponent({ type: 'other' })).toBe(false)
      expect(isNotificationItemComponent(null)).toBe(false)
    })

    it('identifies notification badge component', () => {
      const component: NotificationBadgeComponent = {
        type: 'notificationBadge',
        id: 'badge-1',
        properties: { count: 5 },
      }
      expect(isNotificationBadgeComponent(component)).toBe(true)
      expect(isNotificationBadgeComponent({ type: 'other' })).toBe(false)
      expect(isNotificationBadgeComponent(null)).toBe(false)
    })
  })

  describe('Helper Functions', () => {
    describe('createNotificationCenter', () => {
      it('creates notification center with default properties', () => {
        const component = createNotificationCenter('center-1')
        expect(component.type).toBe('notificationCenter')
        expect(component.id).toBe('center-1')
        expect(component.properties?.maxVisible).toBe(10)
        expect(component.properties?.position).toBe('top-right')
      })

      it('creates notification center with custom properties', () => {
        const component = createNotificationCenter('center-2', {
          maxVisible: 20,
          position: 'bottom-right',
          sound: true,
        })
        expect(component.properties?.maxVisible).toBe(20)
        expect(component.properties?.position).toBe('bottom-right')
        expect(component.properties?.sound).toBe(true)
      })
    })

    describe('createNotificationItem', () => {
      it('creates notification item with required properties', () => {
        const properties: NotificationItemProperties = {
          notificationId: 'notif-1',
          notificationType: 'info',
          priority: 'medium',
          title: 'Test',
          message: 'Test message',
          timestamp: Date.now(),
        }
        const component = createNotificationItem('item-1', properties)
        expect(component.type).toBe('notificationItem')
        expect(component.id).toBe('item-1')
        expect(component.properties.dismissible).toBe(true)
        expect(component.properties.read).toBe(false)
      })
    })

    describe('createNotificationBadge', () => {
      it('creates badge with default properties', () => {
        const component = createNotificationBadge('badge-1', 5)
        expect(component.type).toBe('notificationBadge')
        expect(component.id).toBe('badge-1')
        expect(component.properties.count).toBe(5)
        expect(component.properties.maxCount).toBe(99)
        expect(component.properties.position).toBe('top-right')
      })

      it('creates badge with custom properties', () => {
        const component = createNotificationBadge('badge-2', 150, {
          maxCount: 200,
          position: 'bottom-right',
          dot: true,
        })
        expect(component.properties.count).toBe(150)
        expect(component.properties.maxCount).toBe(200)
        expect(component.properties.position).toBe('bottom-right')
        expect(component.properties.dot).toBe(true)
      })
    })

    describe('formatNotificationTimestamp', () => {
      it('formats timestamps correctly', () => {
        const now = Date.now()

        // Just now
        expect(formatNotificationTimestamp(now - 30 * 1000)).toBe('just now')

        // Minutes ago
        expect(formatNotificationTimestamp(now - 5 * 60 * 1000)).toBe('5m ago')

        // Hours ago
        expect(formatNotificationTimestamp(now - 3 * 60 * 60 * 1000)).toBe('3h ago')

        // Days ago
        expect(formatNotificationTimestamp(now - 2 * 24 * 60 * 60 * 1000)).toBe('2d ago')

        // More than 7 days ago - should be a date string
        const oldDate = now - 10 * 24 * 60 * 60 * 1000
        const formatted = formatNotificationTimestamp(oldDate)
        expect(formatted).toContain('/')
      })
    })

    describe('getNotificationIcon', () => {
      it('returns correct icons for each type', () => {
        expect(getNotificationIcon('info')).toBe('info')
        expect(getNotificationIcon('success')).toBe('check-circle')
        expect(getNotificationIcon('warning')).toBe('alert-triangle')
        expect(getNotificationIcon('error')).toBe('x-circle')
        expect(getNotificationIcon('system')).toBe('settings')
      })
    })

    describe('getNotificationColor', () => {
      it('returns correct colors for each type', () => {
        expect(getNotificationColor('info')).toBe('#3b82f6')
        expect(getNotificationColor('success')).toBe('#10b981')
        expect(getNotificationColor('warning')).toBe('#f59e0b')
        expect(getNotificationColor('error')).toBe('#ef4444')
        expect(getNotificationColor('system')).toBe('#6366f1')
      })
    })
  })

  describe('NotificationAction', () => {
    it('creates valid notification action', () => {
      const action: NotificationAction = {
        id: 'action-1',
        label: 'View',
        action: '/handlers/view',
        variant: 'primary',
        closeOnClick: true,
      }

      expect(action.id).toBe('action-1')
      expect(action.label).toBe('View')
      expect(action.action).toBe('/handlers/view')
      expect(action.variant).toBe('primary')
      expect(action.closeOnClick).toBe(true)
    })
  })

  describe('NotificationRichContent', () => {
    it('creates valid rich content', () => {
      const richContent: NotificationRichContent = {
        image: '/images/notification.png',
        progress: 50,
        icon: 'upload',
        link: '/details',
        linkText: 'View Details',
        metadata: {
          uploadId: '123',
          fileName: 'document.pdf',
        },
      }

      expect(richContent.image).toBe('/images/notification.png')
      expect(richContent.progress).toBe(50)
      expect(richContent.icon).toBe('upload')
      expect(richContent.link).toBe('/details')
      expect(richContent.linkText).toBe('View Details')
      expect(richContent.metadata?.uploadId).toBe('123')
    })
  })
})
