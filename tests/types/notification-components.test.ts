/**
 * Notification Component Tests
 * Comprehensive tests for notification component types and helpers
 */

import { describe, it, expect } from 'vitest'
import type {
  ComponentType,
  NotificationCenterComponent,
  NotificationItemComponent,
  NotificationBadgeComponent,
  NotificationType,
  NotificationPriority,
} from '../../src/types/index.js'
import {
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
  describe('ComponentType Union', () => {
    it('includes notificationCenter in ComponentType union', () => {
      const type: ComponentType = 'notificationCenter'
      expect(type).toBe('notificationCenter')
    })

    it('includes notificationItem in ComponentType union', () => {
      const type: ComponentType = 'notificationItem'
      expect(type).toBe('notificationItem')
    })

    it('includes notificationBadge in ComponentType union', () => {
      const type: ComponentType = 'notificationBadge'
      expect(type).toBe('notificationBadge')
    })
  })

  describe('NotificationCenter Component', () => {
    it('creates notification center with minimal properties', () => {
      const component: NotificationCenterComponent = {
        id: 'notif-center-1',
        type: 'notificationCenter',
        properties: {},
      }

      expect(component.type).toBe('notificationCenter')
      expect(component.id).toBe('notif-center-1')
    })

    it('creates notification center with all properties', () => {
      const component: NotificationCenterComponent = {
        id: 'notif-center-2',
        type: 'notificationCenter',
        properties: {
          position: 'top-right',
          maxVisible: 5,
          autoClose: true,
          autoCloseDelay: 5000,
          types: ['success', 'error', 'warning', 'info', 'alert'],
          showFilters: true,
          filterBy: ['type', 'category', 'read/unread'],
          groupBy: 'category',
          allowMarkAsRead: true,
          allowMarkAllAsRead: true,
          allowDelete: true,
          allowDeleteAll: true,
          allowSnooze: true,
          showTimestamp: true,
          showAvatar: true,
          showActions: true,
          persistNotifications: true,
          maxNotifications: 100,
          soundEnabled: true,
          vibrationEnabled: false,
          soundUrl: '/sounds/notification.mp3',
          categories: [
            { id: 'system', label: 'System', icon: 'settings', color: '#3b82f6' },
            { id: 'alerts', label: 'Alerts', icon: 'bell', color: '#ef4444' },
          ],
        },
      }

      expect(component.properties?.position).toBe('top-right')
      expect(component.properties?.maxVisible).toBe(5)
      expect(component.properties?.autoClose).toBe(true)
      expect(component.properties?.categories).toHaveLength(2)
    })

    it('supports different positions', () => {
      const positions: Array<'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center'> = [
        'top-right',
        'top-left',
        'bottom-right',
        'bottom-left',
        'center',
      ]

      positions.forEach((position) => {
        const component: NotificationCenterComponent = {
          id: `notif-${position}`,
          type: 'notificationCenter',
          properties: { position },
        }
        expect(component.properties?.position).toBe(position)
      })
    })

    it('supports different grouping options', () => {
      const groupings: Array<'type' | 'category' | 'date' | 'none'> = ['type', 'category', 'date', 'none']

      groupings.forEach((groupBy) => {
        const component: NotificationCenterComponent = {
          id: `notif-group-${groupBy}`,
          type: 'notificationCenter',
          properties: { groupBy },
        }
        expect(component.properties?.groupBy).toBe(groupBy)
      })
    })
  })

  describe('NotificationItem Component', () => {
    it('creates notification item with required properties', () => {
      const component: NotificationItemComponent = {
        id: 'notif-item-1',
        type: 'notificationItem',
        properties: {
          type: 'success',
          title: 'Success',
          message: 'Operation completed successfully',
          timestamp: new Date('2024-01-01T00:00:00Z'),
          read: false,
        },
      }

      expect(component.type).toBe('notificationItem')
      expect(component.properties.type).toBe('success')
      expect(component.properties.title).toBe('Success')
      expect(component.properties.message).toBe('Operation completed successfully')
      expect(component.properties.read).toBe(false)
    })

    it('creates notification item with all properties', () => {
      const component: NotificationItemComponent = {
        id: 'notif-item-2',
        type: 'notificationItem',
        properties: {
          type: 'error',
          title: 'Error',
          message: 'An error occurred',
          category: 'system',
          timestamp: new Date(),
          read: true,
          icon: 'x-circle',
          avatar: 'https://example.com/avatar.jpg',
          image: 'https://example.com/image.jpg',
          color: '#ef4444',
          actions: [
            { label: 'Retry', action: 'retry', primary: true },
            { label: 'Dismiss', action: 'dismiss' },
          ],
          closable: true,
          autoClose: false,
          priority: 'high',
          richContent: {
            html: '<p>Error details</p>',
          },
          metadata: { errorCode: 'ERR_001' },
        },
      }

      expect(component.properties.type).toBe('error')
      expect(component.properties.priority).toBe('high')
      expect(component.properties.actions).toHaveLength(2)
      expect(component.properties.metadata?.errorCode).toBe('ERR_001')
    })

    it('supports all notification types', () => {
      const types: NotificationType[] = ['success', 'error', 'warning', 'info', 'alert']

      types.forEach((type) => {
        const component: NotificationItemComponent = {
          id: `notif-${type}`,
          type: 'notificationItem',
          properties: {
            type,
            title: 'Title',
            message: 'Message',
            timestamp: new Date(),
            read: false,
          },
        }
        expect(component.properties.type).toBe(type)
      })
    })

    it('supports all priority levels', () => {
      const priorities: NotificationPriority[] = ['low', 'normal', 'high', 'urgent']

      priorities.forEach((priority) => {
        const component: NotificationItemComponent = {
          id: `notif-priority-${priority}`,
          type: 'notificationItem',
          properties: {
            type: 'info',
            title: 'Title',
            message: 'Message',
            timestamp: new Date(),
            read: false,
            priority,
          },
        }
        expect(component.properties.priority).toBe(priority)
      })
    })

    it('supports action buttons', () => {
      const component: NotificationItemComponent = {
        id: 'notif-actions',
        type: 'notificationItem',
        properties: {
          type: 'info',
          title: 'Confirm Action',
          message: 'Please confirm this action',
          timestamp: new Date(),
          read: false,
          actions: [
            { label: 'Confirm', action: 'confirm', primary: true },
            { label: 'Cancel', action: 'cancel' },
            { label: 'Delete', action: 'delete', destructive: true },
          ],
        },
      }

      expect(component.properties.actions).toHaveLength(3)
      expect(component.properties.actions?.[0].primary).toBe(true)
      expect(component.properties.actions?.[2].destructive).toBe(true)
    })

    it('supports rich content', () => {
      const component: NotificationItemComponent = {
        id: 'notif-rich',
        type: 'notificationItem',
        properties: {
          type: 'info',
          title: 'Rich Content',
          message: 'This notification has rich content',
          timestamp: new Date(),
          read: false,
          richContent: {
            html: '<div><h3>Title</h3><p>Content</p></div>',
            markdown: '## Title\n\nContent',
            components: [
              {
                id: 'button-1',
                type: 'button',
                properties: { label: 'Click Me', action: 'click' },
              },
            ],
          },
        },
      }

      expect(component.properties.richContent).toBeDefined()
      expect(component.properties.richContent?.html).toContain('<h3>Title</h3>')
      expect(component.properties.richContent?.markdown).toContain('## Title')
      expect(component.properties.richContent?.components).toHaveLength(1)
    })
  })

  describe('NotificationBadge Component', () => {
    it('creates notification badge with count', () => {
      const component: NotificationBadgeComponent = {
        id: 'badge-1',
        type: 'notificationBadge',
        properties: {
          count: 5,
        },
      }

      expect(component.type).toBe('notificationBadge')
      expect(component.properties?.count).toBe(5)
    })

    it('creates notification badge with all properties', () => {
      const component: NotificationBadgeComponent = {
        id: 'badge-2',
        type: 'notificationBadge',
        properties: {
          count: 99,
          maxCount: 99,
          showZero: false,
          dot: false,
          position: 'top-right',
          color: '#ef4444',
          pulse: true,
        },
      }

      expect(component.properties?.count).toBe(99)
      expect(component.properties?.maxCount).toBe(99)
      expect(component.properties?.pulse).toBe(true)
    })

    it('supports dot mode', () => {
      const component: NotificationBadgeComponent = {
        id: 'badge-dot',
        type: 'notificationBadge',
        properties: {
          count: 1,
          dot: true,
        },
      }

      expect(component.properties?.dot).toBe(true)
    })

    it('supports different positions', () => {
      const positions: Array<'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'> = [
        'top-right',
        'top-left',
        'bottom-right',
        'bottom-left',
      ]

      positions.forEach((position) => {
        const component: NotificationBadgeComponent = {
          id: `badge-${position}`,
          type: 'notificationBadge',
          properties: {
            count: 5,
            position,
          },
        }
        expect(component.properties?.position).toBe(position)
      })
    })
  })

  describe('Type Guards', () => {
    it('identifies notification center components', () => {
      const component: NotificationCenterComponent = {
        id: 'center-1',
        type: 'notificationCenter',
      }

      expect(isNotificationCenterComponent(component)).toBe(true)
      expect(isNotificationItemComponent(component)).toBe(false)
      expect(isNotificationBadgeComponent(component)).toBe(false)
    })

    it('identifies notification item components', () => {
      const component: NotificationItemComponent = {
        id: 'item-1',
        type: 'notificationItem',
        properties: {
          type: 'info',
          title: 'Title',
          message: 'Message',
          timestamp: new Date(),
          read: false,
        },
      }

      expect(isNotificationCenterComponent(component)).toBe(false)
      expect(isNotificationItemComponent(component)).toBe(true)
      expect(isNotificationBadgeComponent(component)).toBe(false)
    })

    it('identifies notification badge components', () => {
      const component: NotificationBadgeComponent = {
        id: 'badge-1',
        type: 'notificationBadge',
        properties: {
          count: 5,
        },
      }

      expect(isNotificationCenterComponent(component)).toBe(false)
      expect(isNotificationItemComponent(component)).toBe(false)
      expect(isNotificationBadgeComponent(component)).toBe(true)
    })
  })

  describe('Helper Functions', () => {
    it('creates notification center with helper', () => {
      const component = createNotificationCenter('center-1', {
        position: 'top-right',
        maxVisible: 10,
      })

      expect(component.id).toBe('center-1')
      expect(component.type).toBe('notificationCenter')
      expect(component.properties?.position).toBe('top-right')
      expect(component.properties?.maxVisible).toBe(10)
    })

    it('creates notification item with helper', () => {
      const component = createNotificationItem('item-1', {
        type: 'success',
        title: 'Success',
        message: 'Operation completed',
        timestamp: new Date(),
        read: false,
      })

      expect(component.id).toBe('item-1')
      expect(component.type).toBe('notificationItem')
      expect(component.properties.type).toBe('success')
    })

    it('creates notification badge with helper', () => {
      const component = createNotificationBadge('badge-1', 5, {
        pulse: true,
        color: '#ef4444',
      })

      expect(component.id).toBe('badge-1')
      expect(component.type).toBe('notificationBadge')
      expect(component.properties?.count).toBe(5)
      expect(component.properties?.pulse).toBe(true)
    })

    it('formats notification timestamps correctly', () => {
      const now = new Date()
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000)
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      expect(formatNotificationTimestamp(oneMinuteAgo)).toBe('1 minute ago')
      expect(formatNotificationTimestamp(oneHourAgo)).toBe('1 hour ago')
      expect(formatNotificationTimestamp(oneDayAgo)).toBe('1 day ago')
    })

    it('gets correct icon for notification type', () => {
      expect(getNotificationIcon('success')).toBe('check-circle')
      expect(getNotificationIcon('error')).toBe('x-circle')
      expect(getNotificationIcon('warning')).toBe('alert-triangle')
      expect(getNotificationIcon('info')).toBe('info')
      expect(getNotificationIcon('alert')).toBe('bell')
    })

    it('gets correct color for notification type', () => {
      expect(getNotificationColor('success')).toBe('#10b981')
      expect(getNotificationColor('error')).toBe('#ef4444')
      expect(getNotificationColor('warning')).toBe('#f59e0b')
      expect(getNotificationColor('info')).toBe('#3b82f6')
      expect(getNotificationColor('alert')).toBe('#8b5cf6')
    })
  })

  describe('Default Properties', () => {
    it('provides default notification center properties', () => {
      expect(DEFAULT_NOTIFICATION_CENTER_PROPERTIES.position).toBe('top-right')
      expect(DEFAULT_NOTIFICATION_CENTER_PROPERTIES.maxVisible).toBe(5)
      expect(DEFAULT_NOTIFICATION_CENTER_PROPERTIES.autoClose).toBe(true)
      expect(DEFAULT_NOTIFICATION_CENTER_PROPERTIES.maxNotifications).toBe(100)
    })

    it('provides default notification badge properties', () => {
      expect(DEFAULT_NOTIFICATION_BADGE_PROPERTIES.maxCount).toBe(99)
      expect(DEFAULT_NOTIFICATION_BADGE_PROPERTIES.showZero).toBe(false)
      expect(DEFAULT_NOTIFICATION_BADGE_PROPERTIES.dot).toBe(false)
      expect(DEFAULT_NOTIFICATION_BADGE_PROPERTIES.pulse).toBe(true)
    })
  })

  describe('Categories', () => {
    it('supports notification categories', () => {
      const component: NotificationCenterComponent = {
        id: 'center-categories',
        type: 'notificationCenter',
        properties: {
          categories: [
            { id: 'system', label: 'System', icon: 'settings', color: '#3b82f6' },
            { id: 'security', label: 'Security', icon: 'shield', color: '#ef4444' },
            { id: 'updates', label: 'Updates', icon: 'download', color: '#10b981' },
          ],
        },
      }

      expect(component.properties?.categories).toHaveLength(3)
      expect(component.properties?.categories?.[0].id).toBe('system')
      expect(component.properties?.categories?.[1].label).toBe('Security')
      expect(component.properties?.categories?.[2].color).toBe('#10b981')
    })
  })
})
