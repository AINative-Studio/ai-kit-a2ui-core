/**
 * Analytics Handler
 *
 * Handles all analytics dashboard operations including querying,
 * filtering, real-time updates, and data export.
 */

import type {
  AnalyticsQueryMessage,
  AnalyticsRefreshMessage,
  AnalyticsExportMessage,
  AnalyticsFilterChangeMessage,
  AnalyticsTimeRangeChangeMessage,
  AnalyticsDrillDownMessage,
  AnalyticsSortChangeMessage,
  AnalyticsPaginationMessage,
  AnalyticsDataPoint,
  AnalyticsMetadata,
  AnalyticsError,
} from '../types/analytics-messages.js'

import type { TimeRange, AnalyticsFilter } from '../types/analytics-components.js'

/**
 * Analytics service interface
 *
 * Implement this interface to integrate with your analytics backend
 */
export interface AnalyticsService {
  /**
   * Execute analytics query
   */
  query(params: {
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
  }): Promise<{
    data: AnalyticsDataPoint[]
    metadata: AnalyticsMetadata
  }>

  /**
   * Export analytics data
   */
  export(params: {
    format: 'csv' | 'json' | 'pdf' | 'xlsx'
    filename?: string
    includeHeaders?: boolean
    filters?: AnalyticsFilter[]
    timeRange?: TimeRange
    columns?: string[]
  }): Promise<{
    downloadUrl: string
    filename: string
    fileSize?: number
  }>

  /**
   * Start real-time data streaming
   */
  streamStart(params: {
    metrics: string[]
    interval: number
    filters?: AnalyticsFilter[]
  }): Promise<void>

  /**
   * Stop real-time data streaming
   */
  streamStop(): Promise<void>
}

/**
 * Analytics handler options
 */
export interface AnalyticsHandlerOptions {
  /** Analytics service implementation */
  analyticsService: AnalyticsService

  /** Default time range */
  defaultTimeRange?: TimeRange

  /** Enable query caching */
  enableCache?: boolean

  /** Cache TTL in seconds */
  cacheTTL?: number

  /** Maximum concurrent streams */
  maxConcurrentStreams?: number

  /** Message handlers */
  onMessage?: (message: unknown) => void

  /** Error handler */
  onError?: (error: Error) => void
}

/**
 * Component state tracking
 */
interface ComponentState {
  filters: AnalyticsFilter[]
  timeRange?: TimeRange
  metrics?: string[]
  sortBy?: {
    field: string
    direction: 'asc' | 'desc'
  }
  pagination?: {
    page: number
    pageSize: number
  }
  lastQuery?: string
}

/**
 * Data update callback
 */
export type DataUpdateCallback = (data: AnalyticsDataPoint) => void

/**
 * Analytics Handler Class
 *
 * Orchestrates analytics operations between UI components and analytics service
 */
export class AnalyticsHandler {
  private componentStates = new Map<string, ComponentState>()
  private updateSubscriptions = new Map<string, Set<DataUpdateCallback>>()
  private activeStreams = new Set<string>()
  private queryCache = new Map<string, { data: unknown; timestamp: number }>()

  constructor(private options: AnalyticsHandlerOptions) {}

  /**
   * Handle analytics query
   */
  async handleQuery(message: AnalyticsQueryMessage): Promise<void> {
    try {
      const { queryId, timeRange, metrics, filters, groupBy, sortBy, limit, offset, includeComparison } = message

      // Check cache if enabled
      const cacheKey = this.generateCacheKey(message)
      if (this.options.enableCache && this.isCacheValid(cacheKey)) {
        const cached = this.queryCache.get(cacheKey)
        if (cached) {
          this.sendMessage({
            type: 'analyticsData',
            componentId: message.componentId,
            queryId,
            ...cached.data,
          })
          return
        }
      }

      // Execute query
      const result = await this.options.analyticsService.query({
        timeRange,
        metrics,
        filters,
        groupBy,
        sortBy,
        limit,
        offset,
        includeComparison,
      })

      // Cache result
      if (this.options.enableCache) {
        this.queryCache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
        })
      }

      // Update component state
      const stateUpdates: Partial<ComponentState> = {
        filters: filters || [],
        timeRange,
        metrics,
        lastQuery: queryId,
      }
      if (sortBy) {
        stateUpdates.sortBy = sortBy
      }
      this.updateComponentState(message.componentId, stateUpdates)

      // Send response
      this.sendMessage({
        type: 'analyticsData',
        componentId: message.componentId,
        queryId,
        data: result.data,
        metadata: result.metadata,
      })
    } catch (error) {
      this.handleError(error as Error, message.componentId, message.queryId)
    }
  }

  /**
   * Handle refresh request
   */
  async handleRefresh(message: AnalyticsRefreshMessage): Promise<void> {
    try {
      const componentId = message.componentId
      const state = this.componentStates.get(componentId)

      if (!state?.lastQuery) {
        throw new Error('No previous query to refresh')
      }

      // Clear cache if force refresh
      if (message.force) {
        this.clearCache(componentId)
      }

      // Re-execute last query
      const timeRange = state.timeRange || this.options.defaultTimeRange
      if (!timeRange) {
        throw new Error('No time range available')
      }

      const metrics = state.metrics || []
      if (metrics.length === 0) {
        throw new Error('No metrics available')
      }

      const result = await this.options.analyticsService.query({
        timeRange,
        metrics,
        filters: state.filters,
        sortBy: state.sortBy,
      })

      this.sendMessage({
        type: 'analyticsData',
        componentId,
        queryId: `refresh-${Date.now()}`,
        data: result.data,
        metadata: result.metadata,
      })
    } catch (error) {
      this.handleError(error as Error, message.componentId)
    }
  }

  /**
   * Handle export request
   */
  async handleExport(message: AnalyticsExportMessage): Promise<void> {
    try {
      const { format, filename, includeHeaders, filters, timeRange, columns } = message

      const result = await this.options.analyticsService.export({
        format,
        filename,
        includeHeaders,
        filters,
        timeRange,
        columns,
      })

      this.sendMessage({
        type: 'analyticsExported',
        componentId: message.componentId,
        downloadUrl: result.downloadUrl,
        filename: result.filename,
        format,
        fileSize: result.fileSize,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
      })
    } catch (error) {
      this.handleError(error as Error, message.componentId)
    }
  }

  /**
   * Handle filter change
   */
  async handleFilterChange(message: AnalyticsFilterChangeMessage): Promise<void> {
    try {
      const { componentId, filters } = message

      this.updateComponentState(componentId, { filters })

      this.sendMessage({
        type: 'analyticsFilterChange',
        componentId,
        filters,
      })
    } catch (error) {
      this.handleError(error as Error, message.componentId)
    }
  }

  /**
   * Handle time range change
   */
  async handleTimeRangeChange(message: AnalyticsTimeRangeChangeMessage): Promise<void> {
    try {
      const { componentId, timeRange } = message

      this.updateComponentState(componentId, { timeRange })

      this.sendMessage({
        type: 'analyticsTimeRangeChange',
        componentId,
        timeRange,
      })
    } catch (error) {
      this.handleError(error as Error, message.componentId)
    }
  }

  /**
   * Handle drill down action
   */
  async handleDrillDown(message: AnalyticsDrillDownMessage): Promise<void> {
    try {
      const { componentId, dimension, value, filters: additionalFilters } = message

      // Get current filters
      const state = this.componentStates.get(componentId) || { filters: [] }
      const currentFilters = [...state.filters]

      // Add drill down filter
      const drillDownFilter: AnalyticsFilter = {
        field: dimension,
        operator: 'equals',
        value,
      }

      currentFilters.push(drillDownFilter)

      // Add any additional filters
      if (additionalFilters) {
        currentFilters.push(...additionalFilters)
      }

      // Update state
      this.updateComponentState(componentId, {
        filters: currentFilters,
      })

      this.sendMessage({
        type: 'analyticsDrillDown',
        componentId,
        dimension,
        value,
        filters: currentFilters,
      })
    } catch (error) {
      this.handleError(error as Error, message.componentId)
    }
  }

  /**
   * Handle sort change
   */
  async handleSortChange(message: AnalyticsSortChangeMessage): Promise<void> {
    try {
      const { componentId, columnId, direction } = message

      this.updateComponentState(componentId, {
        sortBy: { field: columnId, direction },
      })

      this.sendMessage({
        type: 'analyticsSortChange',
        componentId,
        columnId,
        direction,
      })
    } catch (error) {
      this.handleError(error as Error, message.componentId)
    }
  }

  /**
   * Handle pagination change
   */
  async handlePagination(message: AnalyticsPaginationMessage): Promise<void> {
    try {
      const { componentId, page, pageSize } = message

      this.updateComponentState(componentId, {
        pagination: { page, pageSize },
      })

      this.sendMessage({
        type: 'analyticsPagination',
        componentId,
        page,
        pageSize,
      })
    } catch (error) {
      this.handleError(error as Error, message.componentId)
    }
  }

  /**
   * Start real-time streaming
   */
  async startStreaming(
    componentId: string,
    config: {
      metrics: string[]
      interval: number
      filters?: AnalyticsFilter[]
    }
  ): Promise<void> {
    try {
      if (this.activeStreams.has(componentId)) {
        throw new Error(`Stream already active for component: ${componentId}`)
      }

      if (
        this.options.maxConcurrentStreams &&
        this.activeStreams.size >= this.options.maxConcurrentStreams
      ) {
        throw new Error('Maximum concurrent streams reached')
      }

      await this.options.analyticsService.streamStart(config)

      this.activeStreams.add(componentId)

      this.sendMessage({
        type: 'analyticsStreamStart',
        componentId,
        config,
      })
    } catch (error) {
      this.handleError(error as Error, componentId)
    }
  }

  /**
   * Stop real-time streaming
   */
  async stopStreaming(componentId: string): Promise<void> {
    try {
      if (!this.activeStreams.has(componentId)) {
        return
      }

      await this.options.analyticsService.streamStop()

      this.activeStreams.delete(componentId)

      this.sendMessage({
        type: 'analyticsStreamStop',
        componentId,
      })
    } catch (error) {
      this.handleError(error as Error, componentId)
    }
  }

  /**
   * Subscribe to data updates
   */
  subscribeToUpdates(componentId: string, callback: DataUpdateCallback): () => void {
    if (!this.updateSubscriptions.has(componentId)) {
      this.updateSubscriptions.set(componentId, new Set())
    }

    const callbacks = this.updateSubscriptions.get(componentId)!
    callbacks.add(callback)

    // Return unsubscribe function
    return () => {
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        this.updateSubscriptions.delete(componentId)
      }
    }
  }

  /**
   * Emit stream data to subscribers
   */
  emitStreamData(componentId: string, data: AnalyticsDataPoint): void {
    const callbacks = this.updateSubscriptions.get(componentId)
    if (callbacks) {
      callbacks.forEach((callback) => callback(data))
    }
  }

  /**
   * Get current filters for component
   */
  getFilters(componentId: string): AnalyticsFilter[] {
    return this.componentStates.get(componentId)?.filters || []
  }

  /**
   * Get current time range for component
   */
  getTimeRange(componentId: string): TimeRange | undefined {
    return this.componentStates.get(componentId)?.timeRange
  }

  /**
   * Clear component state
   */
  clearComponentState(componentId: string): void {
    this.componentStates.delete(componentId)
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Stop all active streams
    this.activeStreams.forEach((componentId) => {
      this.stopStreaming(componentId).catch(() => {
        // Ignore errors during cleanup
      })
    })

    // Clear all subscriptions
    this.updateSubscriptions.clear()

    // Clear cache
    this.queryCache.clear()

    // Clear component states
    this.componentStates.clear()
  }

  /**
   * Update component state
   */
  private updateComponentState(componentId: string, updates: Partial<ComponentState>): void {
    const currentState = this.componentStates.get(componentId) || { filters: [] }
    this.componentStates.set(componentId, {
      ...currentState,
      ...updates,
    })
  }

  /**
   * Generate cache key for query
   */
  private generateCacheKey(message: AnalyticsQueryMessage): string {
    return `${message.componentId}-${JSON.stringify({
      timeRange: message.timeRange,
      metrics: message.metrics,
      filters: message.filters,
      groupBy: message.groupBy,
    })}`
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(cacheKey: string): boolean {
    const cached = this.queryCache.get(cacheKey)
    if (!cached) return false

    const ttl = (this.options.cacheTTL || 60) * 1000
    return Date.now() - cached.timestamp < ttl
  }

  /**
   * Clear cache for component
   */
  private clearCache(componentId: string): void {
    const keysToDelete: string[] = []
    this.queryCache.forEach((_, key) => {
      if (key.startsWith(componentId)) {
        keysToDelete.push(key)
      }
    })
    keysToDelete.forEach((key) => this.queryCache.delete(key))
  }

  /**
   * Send message to UI
   */
  private sendMessage(message: unknown): void {
    if (this.options.onMessage) {
      this.options.onMessage(message)
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: Error, componentId: string, queryId?: string): void {
    if (this.options.onError) {
      this.options.onError(error)
    }

    const analyticsError: AnalyticsError = {
      code: error.name || 'ANALYTICS_ERROR',
      message: error.message,
      details: {
        stack: error.stack,
      },
    }

    this.sendMessage({
      type: 'analyticsError',
      componentId,
      queryId,
      error: analyticsError,
    })
  }
}
