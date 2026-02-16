/**
 * Analytics Client Integration
 *
 * HTTP/WebSocket client for connecting to analytics backend services
 */

import type {
  AnalyticsDataPoint,
  AnalyticsMetadata,
} from '../types/analytics-messages.js'
import type { TimeRange, AnalyticsFilter } from '../types/analytics-components.js'

/**
 * Analytics client configuration
 */
export interface AnalyticsClientConfig {
  /** Base API URL */
  apiUrl: string

  /** API authentication key */
  apiKey: string

  /** Request timeout in milliseconds */
  timeout?: number

  /** Maximum retry attempts */
  maxRetries?: number

  /** Custom headers */
  headers?: Record<string, string>

  /** WebSocket URL (defaults to apiUrl with ws/wss protocol) */
  wsUrl?: string
}

/**
 * Query parameters
 */
export interface QueryParams {
  timeRange: TimeRange
  metrics: string[]
  filters?: AnalyticsFilter[]
  groupBy?: string[]
  sortBy?: {
    field: string
    direction: 'asc' | 'desc'
  }
  limit?: number
  offset?: number
  includeComparison?: boolean
}

/**
 * Export parameters
 */
export interface ExportParams {
  format: 'csv' | 'json' | 'pdf' | 'xlsx'
  filename?: string
  includeHeaders?: boolean
  filters?: AnalyticsFilter[]
  timeRange?: TimeRange
  columns?: string[]
}

/**
 * Stream configuration
 */
export interface StreamConfig {
  metrics: string[]
  interval: number
  filters?: AnalyticsFilter[]
}

/**
 * Stream data callback
 */
export type StreamDataCallback = (data: AnalyticsDataPoint) => void

/**
 * Analytics Client
 *
 * Handles communication with analytics backend services
 */
export class AnalyticsClient {
  private ws: WebSocket | null = null
  private streamCallbacks: Set<StreamDataCallback> = new Set()
  private abortController: AbortController | null = null

  constructor(private config: AnalyticsClientConfig) {
    this.config.timeout = config.timeout || 30000
    this.config.maxRetries = config.maxRetries || 0
  }

  /**
   * Execute analytics query
   */
  async query(params: QueryParams): Promise<{
    data: AnalyticsDataPoint[]
    metadata: AnalyticsMetadata
  }> {
    const response = await this.fetchWithRetry('/query', {
      method: 'POST',
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      throw new Error(`Query failed: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()

    // Convert timestamp strings to Date objects
    result.data = result.data.map((point: { timestamp: string | Date }) => ({
      ...point,
      timestamp: new Date(point.timestamp),
    }))

    return result
  }

  /**
   * Export analytics data
   */
  async export(params: ExportParams): Promise<{
    downloadUrl: string
    filename: string
    fileSize?: number
  }> {
    const response = await this.fetchWithRetry('/export', {
      method: 'POST',
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Start real-time data streaming
   */
  async streamStart(config: StreamConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = this.getWebSocketUrl()

        this.ws = new WebSocket(wsUrl)

        this.ws.addEventListener('open', () => {
          // Send stream configuration
          this.ws?.send(
            JSON.stringify({
              type: 'start',
              config,
            })
          )
          resolve()
        })

        this.ws.addEventListener('message', (event) => {
          try {
            const data = JSON.parse(event.data)

            // Convert timestamp to Date
            if (data.timestamp) {
              data.timestamp = new Date(data.timestamp)
            }

            // Notify all callbacks
            this.streamCallbacks.forEach((callback) => callback(data))
          } catch (error) {
            console.error('Failed to parse stream data:', error)
          }
        })

        this.ws.addEventListener('error', (error) => {
          reject(new Error('WebSocket connection failed'))
        })

        this.ws.addEventListener('close', () => {
          this.ws = null
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Stop real-time data streaming
   */
  async streamStop(): Promise<void> {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  /**
   * Register stream data callback
   */
  onStreamData(callback: StreamDataCallback): () => void {
    this.streamCallbacks.add(callback)

    // Return unsubscribe function
    return () => {
      this.streamCallbacks.delete(callback)
    }
  }

  /**
   * Fetch with retry logic
   */
  private async fetchWithRetry(
    endpoint: string,
    options: RequestInit,
    attempt = 0
  ): Promise<Response> {
    try {
      this.abortController = new AbortController()
      const timeoutId = setTimeout(() => {
        this.abortController?.abort()
      }, this.config.timeout)

      const response = await fetch(`${this.config.apiUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
          ...this.config.headers,
          ...options.headers,
        },
        signal: this.abortController.signal,
      })

      clearTimeout(timeoutId)

      // Retry on server errors if retries are configured
      if (!response.ok && response.status >= 500 && attempt < this.config.maxRetries!) {
        await this.delay(Math.pow(2, attempt) * 1000) // Exponential backoff
        return this.fetchWithRetry(endpoint, options, attempt + 1)
      }

      return response
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.config.timeout}ms`)
      }

      // Retry on network errors if retries are configured
      if (attempt < this.config.maxRetries!) {
        await this.delay(Math.pow(2, attempt) * 1000)
        return this.fetchWithRetry(endpoint, options, attempt + 1)
      }

      throw error
    }
  }

  /**
   * Get WebSocket URL
   */
  private getWebSocketUrl(): string {
    if (this.config.wsUrl) {
      return this.config.wsUrl
    }

    // Convert HTTP URL to WebSocket URL
    const url = this.config.apiUrl.replace(/^https?:\/\//, (match) => {
      return match === 'https://' ? 'wss://' : 'ws://'
    })

    return `${url}/stream`
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.streamStop()
    this.streamCallbacks.clear()

    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
  }
}

/**
 * Create analytics client instance
 */
export function createAnalyticsClient(config: AnalyticsClientConfig): AnalyticsClient {
  return new AnalyticsClient(config)
}
