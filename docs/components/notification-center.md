# Notification Center Component

Complete guide to implementing notification management in A2UI applications with AINative integration.

## Overview

The A2UI Notification Center provides comprehensive notification management capabilities including:

- **Real-time notifications** with WebSocket support
- **Multi-channel delivery** (in-app, Slack, PagerDuty, email, webhooks)
- **Rich notification types** with actions and rich content
- **Advanced filtering** and grouping
- **Persistent storage** with auto-cleanup
- **AINative integration** for enterprise notification management

## Table of Contents

1. [Component Types](#component-types)
2. [Message Types](#message-types)
3. [NotificationHandler](#notificationhandler)
4. [AINative Integration](#ainative-integration)
5. [Usage Examples](#usage-examples)
6. [Best Practices](#best-practices)

---

## Component Types

### 1. NotificationCenter Component

The main notification center container that displays and manages notifications.

```typescript
interface NotificationCenterComponent {
  type: 'notificationCenter'
  id: string
  properties?: {
    // Display options
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center'
    maxVisible?: number           // Max notifications shown at once (default: 5)
    autoClose?: boolean           // Auto-close notifications (default: true)
    autoCloseDelay?: number       // Auto-close delay in ms (default: 5000)

    // Notification types
    types?: Array<'success' | 'error' | 'warning' | 'info' | 'alert'>

    // Filtering
    showFilters?: boolean         // Show filter controls (default: true)
    filterBy?: Array<'type' | 'category' | 'date' | 'read/unread'>

    // Grouping
    groupBy?: 'type' | 'category' | 'date' | 'none'

    // Features
    allowMarkAsRead?: boolean     // Allow marking as read (default: true)
    allowMarkAllAsRead?: boolean  // Show "mark all as read" button (default: true)
    allowDelete?: boolean         // Allow deleting notifications (default: true)
    allowDeleteAll?: boolean      // Show "delete all" button (default: true)
    allowSnooze?: boolean         // Allow snoozing (default: true)
    showTimestamp?: boolean       // Show timestamps (default: true)
    showAvatar?: boolean          // Show avatars (default: false)
    showActions?: boolean         // Show action buttons (default: true)

    // Persistence
    persistNotifications?: boolean  // Persist across sessions (default: true)
    maxNotifications?: number       // Max stored notifications (default: 100)

    // Sound & vibration
    soundEnabled?: boolean          // Enable sound (default: false)
    vibrationEnabled?: boolean      // Enable vibration (default: false)
    soundUrl?: string               // Custom sound URL

    // Categories
    categories?: Array<{
      id: string
      label: string
      icon?: string
      color?: string
    }>

    metadata?: Record<string, any>
  }
}
```

**Example:**
```typescript
const notificationCenter = createNotificationCenter('notif-center-1', {
  position: 'top-right',
  maxVisible: 5,
  autoClose: true,
  autoCloseDelay: 5000,
  categories: [
    { id: 'system', label: 'System', icon: 'settings', color: '#3b82f6' },
    { id: 'security', label: 'Security', icon: 'shield', color: '#ef4444' },
    { id: 'updates', label: 'Updates', icon: 'download', color: '#10b981' },
  ],
})
```

### 2. NotificationItem Component

Individual notification items with rich content support.

```typescript
interface NotificationItemComponent {
  type: 'notificationItem'
  id: string
  properties: {
    // Required
    type: 'success' | 'error' | 'warning' | 'info' | 'alert'
    title: string
    message: string
    timestamp: Date
    read: boolean

    // Optional
    category?: string
    icon?: string
    avatar?: string
    image?: string
    color?: string

    // Actions
    actions?: Array<{
      label: string
      action: string
      primary?: boolean
      destructive?: boolean
    }>

    // Behavior
    closable?: boolean
    autoClose?: boolean
    autoCloseDelay?: number

    // Priority
    priority?: 'low' | 'normal' | 'high' | 'urgent'

    // Rich content
    richContent?: {
      html?: string
      markdown?: string
      components?: A2UIComponent[]
    }

    metadata?: Record<string, any>
  }
}
```

**Example:**
```typescript
const notification = createNotificationItem('notif-1', {
  type: 'error',
  title: 'Deployment Failed',
  message: 'The deployment to production failed with error code ERR_001',
  timestamp: new Date(),
  read: false,
  category: 'system',
  priority: 'high',
  actions: [
    { label: 'Retry', action: 'retry', primary: true },
    { label: 'View Logs', action: 'view_logs' },
    { label: 'Dismiss', action: 'dismiss' },
  ],
  metadata: {
    errorCode: 'ERR_001',
    deploymentId: 'deploy-123',
  },
})
```

### 3. NotificationBadge Component

Badge showing unread notification count.

```typescript
interface NotificationBadgeComponent {
  type: 'notificationBadge'
  id: string
  properties?: {
    count: number
    maxCount?: number             // Show "99+" for counts above this (default: 99)
    showZero?: boolean            // Show badge when count is 0 (default: false)
    dot?: boolean                 // Show dot instead of number (default: false)
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
    color?: string
    pulse?: boolean               // Pulse animation for new notifications (default: true)
    metadata?: Record<string, any>
  }
}
```

**Example:**
```typescript
const badge = createNotificationBadge('badge-1', 5, {
  maxCount: 99,
  pulse: true,
  color: '#ef4444',
})
```

---

## Message Types

### Create Notification

```typescript
interface NotificationCreateMessage {
  type: 'notificationCreate'
  componentId: string
  notification: {
    type: 'success' | 'error' | 'warning' | 'info' | 'alert'
    title: string
    message: string
    category?: string
    priority?: 'low' | 'normal' | 'high' | 'urgent'
    icon?: string
    avatar?: string
    image?: string
    actions?: Array<{
      label: string
      action: string
    }>
    autoClose?: boolean
    autoCloseDelay?: number
    richContent?: {
      html?: string
      markdown?: string
      components?: A2UIComponent[]
    }
  }
}
```

### Update Notification

```typescript
interface NotificationUpdateMessage {
  type: 'notificationUpdate'
  componentId: string
  notificationId: string
  updates: {
    read?: boolean
    snoozed?: boolean
    snoozeUntil?: Date
    archived?: boolean
  }
}
```

### Delete Notification

```typescript
interface NotificationDeleteMessage {
  type: 'notificationDelete'
  componentId: string
  notificationId: string
}
```

### Mark All as Read

```typescript
interface NotificationMarkAllReadMessage {
  type: 'notificationMarkAllRead'
  componentId: string
  category?: string  // Optional: mark only specific category
}
```

### List Notifications

```typescript
interface NotificationListRequestMessage {
  type: 'notificationListRequest'
  componentId: string
  filters?: {
    type?: string[]
    category?: string[]
    read?: boolean
    dateFrom?: Date
    dateTo?: Date
    priority?: string[]
    archived?: boolean
  }
  limit?: number
  offset?: number
  sortBy?: 'timestamp' | 'priority' | 'type'
  sortOrder?: 'asc' | 'desc'
}
```

### Notification Action

```typescript
interface NotificationActionMessage {
  type: 'notificationAction'
  componentId: string
  notificationId: string
  action: string
  context?: Record<string, unknown>
}
```

---

## NotificationHandler

The `NotificationHandler` class manages notification operations with real-time support.

### Initialization

```typescript
import { A2UITransport, NotificationHandler } from '@ainative/ai-kit-a2ui-core'

const transport = new A2UITransport(/* transport config */)
const handler = new NotificationHandler(transport, {
  // Default settings
  defaultAutoClose: true,
  defaultAutoCloseDelay: 5000,
  maxNotifications: 100,

  // Persistence
  persistNotifications: true,

  // Real-time sync
  enableRealTimeSync: true,
  syncInterval: 30000,

  // Optional: custom notification service
  notificationService: customService,

  // Optional: custom storage
  storage: customStorage,
})
```

### Event Handling

```typescript
// Listen for notification events
handler.on('notificationCreated', (data) => {
  console.log('New notification:', data.notification)
})

handler.on('notificationUpdated', (data) => {
  console.log('Notification updated:', data.notificationId)
})

handler.on('notificationDeleted', (data) => {
  console.log('Notification deleted:', data.notificationId)
})

handler.on('notificationAction', (data) => {
  console.log('Action triggered:', data.action)

  // Handle specific actions
  if (data.action === 'retry') {
    // Retry operation
  }
})

handler.on('countUpdated', (data) => {
  console.log('Notification count:', data.count)
})

handler.on('settingsUpdated', (data) => {
  console.log('Settings updated:', data.settings)
})
```

### Custom Notification Service

```typescript
import type { NotificationService } from '@ainative/ai-kit-a2ui-core'

const customService: NotificationService = {
  async create(notification) {
    // Store notification in your backend
    const response = await fetch('/api/notifications', {
      method: 'POST',
      body: JSON.stringify(notification),
    })
    const { id } = await response.json()
    return id
  },

  async update(id, updates) {
    await fetch(`/api/notifications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  },

  async delete(id) {
    await fetch(`/api/notifications/${id}`, {
      method: 'DELETE',
    })
  },

  async list(filters, limit, offset) {
    const params = new URLSearchParams({
      ...filters,
      limit: String(limit),
      offset: String(offset),
    })
    const response = await fetch(`/api/notifications?${params}`)
    return await response.json()
  },

  async count(filters) {
    const response = await fetch('/api/notifications/count', {
      method: 'POST',
      body: JSON.stringify(filters),
    })
    return await response.json()
  },

  // ... implement other methods
}
```

---

## AINative Integration

The `AINativeNotificationClient` provides integration with AINative's notification service for multi-channel delivery.

### Initialization

```typescript
import { AINativeNotificationClient } from '@ainative/ai-kit-a2ui-core'

const client = new AINativeNotificationClient({
  apiUrl: 'https://api.ainative.studio',
  apiKey: 'your-api-key',
  organizationId: 'org-123',

  // Configure channels
  channels: {
    slack: {
      webhookUrl: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
      channel: '#alerts',
      mentionUsers: ['@oncall'],
    },
    pagerduty: {
      integrationKey: 'your-pagerduty-key',
      defaultSeverity: 'error',
    },
    webhook: {
      url: 'https://your-api.com/webhooks/notifications',
      headers: {
        'X-API-Key': 'your-api-key',
      },
    },
    email: {
      provider: 'resend',
      apiKey: 'your-resend-key',
      from: 'notifications@yourapp.com',
      to: ['team@yourapp.com'],
    },
  },

  // Options
  debug: true,
  autoReconnect: true,
})
```

### Sending Multi-Channel Notifications

```typescript
// Send to multiple channels
await client.sendNotification({
  title: 'Critical System Alert',
  message: 'Production database is down',
  channels: ['in-app', 'slack', 'pagerduty', 'email'],
  severity: 'critical',
  category: 'infrastructure',
  metadata: {
    server: 'prod-db-01',
    errorCode: 'DB_CONNECTION_TIMEOUT',
  },
  channelData: {
    slack: {
      channel: '#critical',
      mentionUsers: ['@oncall', '@devops'],
    },
    pagerduty: {
      severity: 'critical',
      dedupKey: 'prod-db-01-down',
    },
    email: {
      to: ['oncall@yourapp.com'],
      subject: 'URGENT: Production DB Down',
    },
  },
})
```

### Real-Time Notifications

```typescript
// Subscribe to real-time notifications
client.subscribeToNotifications('user-123')

// Listen for notifications
client.on('notification', (event) => {
  console.log('New notification:', event.notification)

  // Display in UI
  displayNotification(event.notification)
})

// Listen for count updates
client.on('count', (event) => {
  console.log('Notification count:', event.count)
  updateBadge(event.count.unread)
})

// Unsubscribe when done
client.unsubscribe()
```

### Testing Integrations

```typescript
// Test Slack integration
const slackOk = await client.testSlackIntegration('Test notification from A2UI')
console.log('Slack integration:', slackOk ? 'OK' : 'Failed')

// Test PagerDuty integration
const pagerDutyOk = await client.testPagerDutyIntegration('Test incident')
console.log('PagerDuty integration:', pagerDutyOk ? 'OK' : 'Failed')

// Test webhook integration
const webhookOk = await client.testWebhookIntegration({ test: true })
console.log('Webhook integration:', webhookOk ? 'OK' : 'Failed')
```

---

## Usage Examples

### Basic Notification

```typescript
// Create a simple success notification
transport.send({
  type: 'notificationCreate',
  componentId: 'notif-center-1',
  notification: {
    type: 'success',
    title: 'Success!',
    message: 'Your changes have been saved',
  },
})
```

### Notification with Actions

```typescript
// Create notification with action buttons
transport.send({
  type: 'notificationCreate',
  componentId: 'notif-center-1',
  notification: {
    type: 'warning',
    title: 'Update Available',
    message: 'A new version of the application is available',
    priority: 'normal',
    actions: [
      { label: 'Update Now', action: 'update', primary: true },
      { label: 'Remind Me Later', action: 'snooze' },
      { label: 'Dismiss', action: 'dismiss' },
    ],
  },
})

// Handle action clicks
handler.on('notificationAction', (data) => {
  switch (data.action) {
    case 'update':
      // Trigger update process
      break
    case 'snooze':
      // Snooze notification
      transport.send({
        type: 'notificationUpdate',
        componentId: data.componentId,
        notificationId: data.notificationId!,
        updates: {
          snoozed: true,
          snoozeUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      })
      break
    case 'dismiss':
      // Delete notification
      transport.send({
        type: 'notificationDelete',
        componentId: data.componentId,
        notificationId: data.notificationId!,
      })
      break
  }
})
```

### Rich Content Notification

```typescript
// Notification with rich HTML content
transport.send({
  type: 'notificationCreate',
  componentId: 'notif-center-1',
  notification: {
    type: 'info',
    title: 'Weekly Report Ready',
    message: 'Your weekly analytics report is now available',
    richContent: {
      html: `
        <div style="padding: 10px;">
          <h3>Key Metrics</h3>
          <ul>
            <li>Users: +15% this week</li>
            <li>Revenue: $12,543</li>
            <li>Engagement: 87%</li>
          </ul>
        </div>
      `,
    },
    actions: [
      { label: 'View Report', action: 'view_report', primary: true },
    ],
  },
})
```

### Notification with A2UI Components

```typescript
// Notification with embedded A2UI components
transport.send({
  type: 'notificationCreate',
  componentId: 'notif-center-1',
  notification: {
    type: 'info',
    title: 'Survey',
    message: 'How satisfied are you with our service?',
    richContent: {
      components: [
        {
          id: 'rating',
          type: 'slider',
          properties: {
            label: 'Satisfaction',
            value: 5,
            min: 1,
            max: 10,
            dataBinding: '/rating',
          },
        },
        {
          id: 'submit',
          type: 'button',
          properties: {
            label: 'Submit',
            action: 'submit_survey',
            variant: 'primary',
          },
        },
      ],
    },
  },
})
```

### Filtering Notifications

```typescript
// List unread error notifications
transport.send({
  type: 'notificationListRequest',
  componentId: 'notif-center-1',
  filters: {
    type: ['error'],
    read: false,
  },
  limit: 10,
  offset: 0,
  sortBy: 'timestamp',
  sortOrder: 'desc',
})

// Handle response
handler.on('notificationListResponse', (response) => {
  console.log('Unread errors:', response.notifications)
})
```

### Category-Based Filtering

```typescript
// Mark all system notifications as read
transport.send({
  type: 'notificationMarkAllRead',
  componentId: 'notif-center-1',
  category: 'system',
})

// Delete all security notifications
transport.send({
  type: 'notificationDeleteAll',
  componentId: 'notif-center-1',
  category: 'security',
})
```

---

## Best Practices

### 1. Notification Priority

Use appropriate priority levels:

```typescript
// Low priority - informational
{ priority: 'low', autoClose: true, autoCloseDelay: 3000 }

// Normal priority - standard notifications
{ priority: 'normal', autoClose: true, autoCloseDelay: 5000 }

// High priority - important but not urgent
{ priority: 'high', autoClose: false }

// Urgent priority - requires immediate attention
{ priority: 'urgent', autoClose: false, actions: [...] }
```

### 2. Auto-Close Strategy

```typescript
// Auto-close success notifications quickly
{ type: 'success', autoClose: true, autoCloseDelay: 3000 }

// Keep errors visible longer
{ type: 'error', autoClose: true, autoCloseDelay: 10000 }

// Never auto-close critical notifications
{ type: 'error', priority: 'urgent', autoClose: false }
```

### 3. Action Buttons

Limit actions to 2-3 buttons:

```typescript
{
  actions: [
    { label: 'Primary Action', action: 'primary', primary: true },
    { label: 'Secondary Action', action: 'secondary' },
    { label: 'Cancel', action: 'cancel' },
  ]
}
```

### 4. Categories

Use consistent categories:

```typescript
const categories = [
  { id: 'system', label: 'System', color: '#3b82f6' },
  { id: 'security', label: 'Security', color: '#ef4444' },
  { id: 'updates', label: 'Updates', color: '#10b981' },
  { id: 'social', label: 'Social', color: '#8b5cf6' },
]
```

### 5. Notification Limits

Configure appropriate limits:

```typescript
{
  maxNotifications: 100,        // Max stored notifications
  maxVisible: 5,                // Max visible at once
  persistNotifications: true,   // Persist across sessions
}
```

### 6. Real-Time Sync

For collaborative applications:

```typescript
{
  enableRealTimeSync: true,
  syncInterval: 30000,  // Sync every 30 seconds
}
```

### 7. Multi-Channel Notifications

Route notifications appropriately:

```typescript
// Critical: all channels
{ severity: 'critical', channels: ['in-app', 'slack', 'pagerduty', 'email'] }

// Important: multiple channels
{ severity: 'error', channels: ['in-app', 'slack'] }

// Normal: in-app only
{ severity: 'info', channels: ['in-app'] }
```

### 8. Error Handling

Always handle notification errors:

```typescript
handler.on('error', (data) => {
  console.error('Notification error:', data.error)

  // Fallback to local notification
  showLocalNotification(data.error.message)
})
```

### 9. Accessibility

Ensure notifications are accessible:

```typescript
{
  showTimestamp: true,           // Screen reader context
  icon: 'alert-circle',          // Visual indicator
  type: 'error',                 // Semantic meaning
  closable: true,                // Keyboard dismissal
}
```

### 10. Testing

Test all notification scenarios:

```typescript
// Test creation
await testNotificationCreation()

// Test actions
await testNotificationActions()

// Test filtering
await testNotificationFiltering()

// Test multi-channel delivery
await testMultiChannelDelivery()

// Test real-time updates
await testRealTimeNotifications()
```

---

## Advanced Features

### Snooze Notifications

```typescript
// Snooze for 1 hour
transport.send({
  type: 'notificationUpdate',
  componentId: 'notif-center-1',
  notificationId: 'notif-123',
  updates: {
    snoozed: true,
    snoozeUntil: new Date(Date.now() + 3600000),
  },
})
```

### Archive Notifications

```typescript
// Archive old notifications
transport.send({
  type: 'notificationUpdate',
  componentId: 'notif-center-1',
  notificationId: 'notif-123',
  updates: {
    archived: true,
  },
})
```

### Custom Storage

```typescript
const customStorage: NotificationStorage = {
  async save(notifications) {
    await db.notifications.bulkPut(notifications)
  },

  async load() {
    return await db.notifications.toArray()
  },

  async clear() {
    await db.notifications.clear()
  },
}
```

---

## API Reference

For complete API documentation, see:
- [Notification Component Types](../../src/types/notification-components.ts)
- [Notification Message Types](../../src/types/notification-messages.ts)
- [Notification Handler](../../src/handlers/notification-handler.ts)
- [AINative Client](../../src/integrations/ainative-notification-client.ts)

---

## Support

For issues, questions, or feature requests:
- GitHub Issues: [ai-kit-a2ui-core/issues](https://github.com/ainative/ai-kit-a2ui-core/issues)
- Documentation: [docs.ainative.studio](https://docs.ainative.studio)
- Email: support@ainative.studio
