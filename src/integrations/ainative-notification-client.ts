/**
 * AINative Notification Client (Issue #49)
 * Integration with AINative notification service for multi-channel notifications
 */

import type { NotificationData, NotificationFilters } from '../types/notification-messages.js'
import type { NotificationSettings } from '../types/notification-components.js'

/**
 * Notification channel types
 */
export type NotificationChannel = 'in-app' | 'slack' | 'pagerduty' | 'webhook' | 'email'

/**
 * Notification severity levels
 */
export type NotificationSeverity = 'info' | 'warning' | 'error' | 'critical'

/**
 * Slack channel configuration
 */
export interface SlackChannelConfig {
  /** Slack webhook URL */
  webhookUrl: string
  /** Target channel name */
  channel?: string
  /** Mention users for critical notifications */
  mentionUsers?: string[]
  /** Include notification metadata in Slack message */
  includeMetadata?: boolean
}

/**
 * PagerDuty channel configuration
 */
export interface PagerDutyChannelConfig {
  /** PagerDuty integration key */
  integrationKey: string
  /** Default severity for incidents */
  defaultSeverity?: 'info' | 'warning' | 'error' | 'critical'
  /** Auto-resolve incidents after N minutes */
  autoResolveAfter?: number
}

/**
 * Webhook channel configuration
 */
export interface WebhookChannelConfig {
  /** Webhook URL */
  url: string
  /** HTTP headers */
  headers?: Record<string, string>
  /** HTTP method (default: POST) */
  method?: 'POST' | 'PUT' | 'PATCH'
  /** Retry configuration */
  retry?: {
    maxRetries: number
    retryDelay: number
  }
}

/**
 * Email channel configuration
 */
export interface EmailChannelConfig {
  /** Email provider (Resend, SendGrid, etc.) */
  provider: 'resend' | 'sendgrid' | 'ses' | 'smtp'
  /** API key or credentials */
  apiKey?: string
  /** SMTP configuration (if using SMTP) */
  smtp?: {
    host: string
    port: number
    user: string
    password: string
  }
  /** From email address */
  from: string
  /** Default recipient emails */
  to?: string[]
  /** CC recipients */
  cc?: string[]
}

/**
 * AINative notification request
 */
export interface AINativeNotificationRequest {
  /** Notification title */
  title: string
  /** Notification message */
  message: string
  /** Target channels */
  channels: NotificationChannel[]
  /** Severity level */
  severity?: NotificationSeverity
  /** Category */
  category?: string
  /** User ID (for in-app notifications) */
  userId?: string
  /** Additional metadata */
  metadata?: Record<string, unknown>
  /** Custom channel data */
  channelData?: {
    slack?: {
      channel?: string
      mentionUsers?: string[]
    }
    pagerduty?: {
      severity?: string
      dedupKey?: string
    }
    email?: {
      to?: string[]
      subject?: string
    }
  }
}

/**
 * AINative notification response
 */
export interface AINativeNotificationResponse {
  /** Notification ID */
  notificationId: string
  /** Status per channel */
  channels: Record<NotificationChannel, {
    success: boolean
    messageId?: string
    error?: string
  }>
  /** Timestamp */
  timestamp: Date
}

/**
 * WebSocket notification event
 */
export interface NotificationEvent {
  /** Event type */
  type: 'notification' | 'count' | 'settings'
  /** Notification data (for 'notification' events) */
  notification?: NotificationData
  /** Count data (for 'count' events) */
  count?: {
    total: number
    unread: number
  }
  /** Settings data (for 'settings' events) */
  settings?: NotificationSettings
  /** Timestamp */
  timestamp: Date
}

/**
 * AINative Notification Client options
 */
export interface AINativeNotificationClientOptions {
  /** AINative API URL */
  apiUrl: string
  /** API key for authentication */
  apiKey: string
  /** Organization ID */
  organizationId?: string
  /** WebSocket URL (default: derived from apiUrl) */
  wsUrl?: string
  /** Channel configurations */
  channels?: {
    slack?: SlackChannelConfig
    pagerduty?: PagerDutyChannelConfig
    webhook?: WebhookChannelConfig
    email?: EmailChannelConfig
  }
  /** Enable debug logging */
  debug?: boolean
  /** Request timeout in milliseconds */
  timeout?: number
  /** Auto-reconnect WebSocket on disconnect */
  autoReconnect?: boolean
  /** Reconnect interval in milliseconds */
  reconnectInterval?: number
}

/**
 * AINative Notification Client
 * Provides integration with AINative notification service
 */
export class AINativeNotificationClient {
  private readonly options: Required<AINativeNotificationClientOptions>
  private ws: WebSocket | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private eventHandlers = new Map<string, Set<(event: NotificationEvent) => void>>()

  constructor(options: AINativeNotificationClientOptions) {
    this.options = {
      apiUrl: options.apiUrl,
      apiKey: options.apiKey,
      organizationId: options.organizationId ?? '',
      wsUrl: options.wsUrl ?? this.deriveWebSocketUrl(options.apiUrl),
      channels: options.channels ?? {},
      debug: options.debug ?? false,
      timeout: options.timeout ?? 30000,
      autoReconnect: options.autoReconnect ?? true,
      reconnectInterval: options.reconnectInterval ?? 5000,
    }
  }

  /**
   * Send notification to multiple channels
   */
  async sendNotification(request: AINativeNotificationRequest): Promise<AINativeNotificationResponse> {
    try {
      const response = await this.fetch('/v1/notifications/send', {
        method: 'POST',
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to send notification')
      }

      const data = await response.json()
      return {
        ...data,
        timestamp: new Date(data.timestamp),
      }
    } catch (error) {
      this.log('error', 'Failed to send notification:', error)
      throw error
    }
  }

  /**
   * Get notification history
   */
  async getNotifications(
    userId: string,
    filters?: NotificationFilters,
    limit?: number,
    offset?: number
  ): Promise<NotificationData[]> {
    try {
      const params = new URLSearchParams()
      params.set('userId', userId)
      if (filters?.type) params.set('type', filters.type.join(','))
      if (filters?.category) params.set('category', filters.category.join(','))
      if (filters?.read !== undefined) params.set('read', String(filters.read))
      if (limit) params.set('limit', String(limit))
      if (offset) params.set('offset', String(offset))

      const response = await this.fetch(`/v1/notifications?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }

      const data = await response.json()
      return data.notifications
    } catch (error) {
      this.log('error', 'Failed to fetch notifications:', error)
      throw error
    }
  }

  /**
   * Update notification settings
   */
  async updateSettings(
    userId: string,
    settings: Partial<NotificationSettings>
  ): Promise<NotificationSettings> {
    try {
      const response = await this.fetch(`/v1/notifications/settings/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error('Failed to update settings')
      }

      return await response.json()
    } catch (error) {
      this.log('error', 'Failed to update settings:', error)
      throw error
    }
  }

  /**
   * Get notification settings
   */
  async getSettings(userId: string): Promise<NotificationSettings> {
    try {
      const response = await this.fetch(`/v1/notifications/settings/${userId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch settings')
      }

      return await response.json()
    } catch (error) {
      this.log('error', 'Failed to fetch settings:', error)
      throw error
    }
  }

  /**
   * Subscribe to real-time notifications via WebSocket
   */
  subscribeToNotifications(userId: string): void {
    if (this.ws) {
      this.log('warn', 'Already subscribed to notifications')
      return
    }

    const wsUrl = `${this.options.wsUrl}/notifications?userId=${userId}&apiKey=${this.options.apiKey}`
    this.ws = new WebSocket(wsUrl)

    this.ws.onopen = () => {
      this.log('info', 'WebSocket connection established')
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as NotificationEvent
        data.timestamp = new Date(data.timestamp)
        this.emitEvent(data.type, data)
      } catch (error) {
        this.log('error', 'Failed to parse WebSocket message:', error)
      }
    }

    this.ws.onerror = (error) => {
      this.log('error', 'WebSocket error:', error)
    }

    this.ws.onclose = () => {
      this.log('info', 'WebSocket connection closed')
      this.ws = null

      if (this.options.autoReconnect) {
        this.scheduleReconnect(userId)
      }
    }
  }

  /**
   * Unsubscribe from real-time notifications
   */
  unsubscribe(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  /**
   * Register event handler
   */
  on(event: 'notification' | 'count' | 'settings', handler: (event: NotificationEvent) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(handler)
  }

  /**
   * Unregister event handler
   */
  off(event: 'notification' | 'count' | 'settings', handler: (event: NotificationEvent) => void): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.delete(handler)
    }
  }

  /**
   * Test Slack integration
   */
  async testSlackIntegration(message: string): Promise<boolean> {
    if (!this.options.channels.slack) {
      throw new Error('Slack channel not configured')
    }

    try {
      const response = await fetch(this.options.channels.slack.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message,
          channel: this.options.channels.slack.channel,
        }),
      })

      return response.ok
    } catch (error) {
      this.log('error', 'Slack test failed:', error)
      return false
    }
  }

  /**
   * Test PagerDuty integration
   */
  async testPagerDutyIntegration(message: string): Promise<boolean> {
    if (!this.options.channels.pagerduty) {
      throw new Error('PagerDuty channel not configured')
    }

    try {
      const response = await fetch('https://events.pagerduty.com/v2/enqueue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          routing_key: this.options.channels.pagerduty.integrationKey,
          event_action: 'trigger',
          payload: {
            summary: message,
            severity: 'info',
            source: 'A2UI Test',
          },
        }),
      })

      return response.ok
    } catch (error) {
      this.log('error', 'PagerDuty test failed:', error)
      return false
    }
  }

  /**
   * Test webhook integration
   */
  async testWebhookIntegration(payload: Record<string, unknown>): Promise<boolean> {
    if (!this.options.channels.webhook) {
      throw new Error('Webhook channel not configured')
    }

    try {
      const config = this.options.channels.webhook
      const response = await fetch(config.url, {
        method: config.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
        body: JSON.stringify(payload),
      })

      return response.ok
    } catch (error) {
      this.log('error', 'Webhook test failed:', error)
      return false
    }
  }

  /**
   * Emit event to registered handlers
   */
  private emitEvent(event: string, data: NotificationEvent): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(data)
        } catch (error) {
          this.log('error', 'Error in event handler:', error)
        }
      }
    }
  }

  /**
   * Schedule WebSocket reconnect
   */
  private scheduleReconnect(userId: string): void {
    if (this.reconnectTimer) {
      return
    }

    this.reconnectTimer = setTimeout(() => {
      this.log('info', 'Attempting to reconnect...')
      this.reconnectTimer = null
      this.subscribeToNotifications(userId)
    }, this.options.reconnectInterval)
  }

  /**
   * Make HTTP request to AINative API
   */
  private async fetch(path: string, init?: RequestInit): Promise<Response> {
    const url = `${this.options.apiUrl}${path}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.options.apiKey}`,
    }

    if (this.options.organizationId) {
      headers['X-Organization-Id'] = this.options.organizationId
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.options.timeout)

    try {
      const response = await fetch(url, {
        ...init,
        headers: {
          ...headers,
          ...init?.headers,
        },
        signal: controller.signal,
      })

      return response
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * Derive WebSocket URL from API URL
   */
  private deriveWebSocketUrl(apiUrl: string): string {
    return apiUrl.replace(/^http/, 'ws')
  }

  /**
   * Log message (if debug enabled)
   */
  private log(level: 'info' | 'warn' | 'error', ...args: unknown[]): void {
    if (this.options.debug) {
      console[level]('[AINativeNotificationClient]', ...args)
    }
  }

  /**
   * Destroy the client
   */
  destroy(): void {
    this.unsubscribe()
    this.eventHandlers.clear()
  }
}

/**
 * Create AINative notification client
 */
export function createAINativeNotificationClient(
  options: AINativeNotificationClientOptions
): AINativeNotificationClient {
  return new AINativeNotificationClient(options)
}
