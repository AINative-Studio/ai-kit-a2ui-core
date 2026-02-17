/**
 * A2UI v0.9 Analytics Message Type Definitions
 *
 * Message types for analytics dashboard operations including
 * querying, filtering, real-time updates, and data export.
 */

import type { TimeRange, AnalyticsFilter } from './analytics-components.js'

/**
 * Base analytics message structure
 */
export interface BaseAnalyticsMessage {
  /** Message type */
  type: string
  /** Component ID that triggered the message */
  componentId: string
  /** Timestamp */
  timestamp?: number
  /** Optional message ID for tracking */
  id?: string
}

// ============================================================================
// Query Messages
// ============================================================================

/**
 * Analytics Query Message (UI → Agent)
 *
 * Request analytics data with specified filters and metrics
 */
export interface AnalyticsQueryMessage extends BaseAnalyticsMessage {
  type: 'analyticsQuery'
  /** Unique query identifier for tracking */
  queryId: string
  /** Time range for query */
  timeRange: TimeRange
  /** Metrics to retrieve */
  metrics: string[]
  /** Optional filters */
  filters?: AnalyticsFilter[]
  /** Group by dimensions */
  groupBy?: string[]
  /** Sort configuration */
  sortBy?: {
    field: string
    direction: 'asc' | 'desc'
  }
  /** Limit number of results */
  limit?: number
  /** Offset for pagination */
  offset?: number
  /** Include comparison to previous period */
  includeComparison?: boolean
}

/**
 * Analytics data point structure
 */
export interface AnalyticsDataPoint {
  /** Data timestamp */
  timestamp: Date
  /** Metric values */
  values: Record<string, number>
  /** Dimension values */
  dimensions?: Record<string, string | number>
  /** Additional metadata */
  metadata?: Record<string, unknown>
}

/**
 * Analytics query metadata
 */
export interface AnalyticsMetadata {
  /** Total number of records */
  totalRecords: number
  /** Query that generated this data */
  query: {
    timeRange: TimeRange
    metrics: string[]
    filters?: AnalyticsFilter[]
    groupBy?: string[]
  }
  /** Query execution time in milliseconds */
  executionTime: number
  /** Was result cached */
  cached: boolean
  /** Cache key if cached */
  cacheKey?: string
  /** Data source identifier */
  dataSource?: string
  /** Pagination info */
  pagination?: {
    currentPage: number
    pageSize: number
    totalPages: number
    hasMore: boolean
  }
  /** Comparison data if requested */
  comparison?: {
    periodStart: Date
    periodEnd: Date
    change: Record<string, number>
  }
}

/**
 * Analytics Data Message (Agent → UI)
 *
 * Response with analytics data
 */
export interface AnalyticsDataMessage extends BaseAnalyticsMessage {
  type: 'analyticsData'
  /** Query ID this data corresponds to */
  queryId: string
  /** Analytics data points */
  data: AnalyticsDataPoint[]
  /** Query metadata */
  metadata: AnalyticsMetadata
}

// ============================================================================
// Real-time Update Messages
// ============================================================================

/**
 * Analytics Data Update Message (Agent → UI)
 *
 * Real-time incremental data updates
 */
export interface AnalyticsDataUpdateMessage extends BaseAnalyticsMessage {
  type: 'analyticsDataUpdate'
  /** Updated data points */
  updates: AnalyticsDataPoint[]
  /** Update timestamp */
  timestamp: Date
  /** Update type */
  updateType: 'incremental' | 'full' | 'partial'
}

/**
 * Analytics Refresh Message (UI → Agent)
 *
 * Request to refresh analytics data
 */
export interface AnalyticsRefreshMessage extends BaseAnalyticsMessage {
  type: 'analyticsRefresh'
  /** Force refresh (bypass cache) */
  force?: boolean
}

// ============================================================================
// Export Messages
// ============================================================================

/**
 * Analytics Export Message (UI → Agent)
 *
 * Request to export analytics data
 */
export interface AnalyticsExportMessage extends BaseAnalyticsMessage {
  type: 'analyticsExport'
  /** Export format */
  format: 'csv' | 'json' | 'pdf' | 'xlsx'
  /** Optional filename */
  filename?: string
  /** Include headers (for CSV/XLSX) */
  includeHeaders?: boolean
  /** Optional filters to apply */
  filters?: AnalyticsFilter[]
  /** Optional time range */
  timeRange?: TimeRange
  /** Optional specific columns to export */
  columns?: string[]
}

/**
 * Analytics Exported Message (Agent → UI)
 *
 * Response with export download link
 */
export interface AnalyticsExportedMessage extends BaseAnalyticsMessage {
  type: 'analyticsExported'
  /** Pre-signed download URL */
  downloadUrl: string
  /** Filename */
  filename: string
  /** Export format */
  format: 'csv' | 'json' | 'pdf' | 'xlsx'
  /** File size in bytes */
  fileSize?: number
  /** URL expiration time */
  expiresAt: Date
}

// ============================================================================
// Filter and Time Range Messages
// ============================================================================

/**
 * Analytics Filter Change Message (UI → Agent)
 *
 * User changed active filters
 */
export interface AnalyticsFilterChangeMessage extends BaseAnalyticsMessage {
  type: 'analyticsFilterChange'
  /** Updated filters */
  filters: AnalyticsFilter[]
}

/**
 * Analytics Time Range Change Message (UI → Agent)
 *
 * User changed time range
 */
export interface AnalyticsTimeRangeChangeMessage extends BaseAnalyticsMessage {
  type: 'analyticsTimeRangeChange'
  /** New time range */
  timeRange: TimeRange
}

// ============================================================================
// Interaction Messages
// ============================================================================

/**
 * Analytics Drill Down Message (UI → Agent)
 *
 * User drills down into a specific dimension
 */
export interface AnalyticsDrillDownMessage extends BaseAnalyticsMessage {
  type: 'analyticsDrillDown'
  /** Dimension to drill down on */
  dimension: string
  /** Value to drill down into */
  value: string | number
  /** Resulting filters after drill down */
  filters?: AnalyticsFilter[]
}

/**
 * Analytics Sort Change Message (UI → Agent)
 *
 * User changed table sorting
 */
export interface AnalyticsSortChangeMessage extends BaseAnalyticsMessage {
  type: 'analyticsSortChange'
  /** Column ID to sort by */
  columnId: string
  /** Sort direction */
  direction: 'asc' | 'desc'
}

/**
 * Analytics Pagination Message (UI → Agent)
 *
 * User changed page
 */
export interface AnalyticsPaginationMessage extends BaseAnalyticsMessage {
  type: 'analyticsPagination'
  /** Page number (1-indexed) */
  page: number
  /** Items per page */
  pageSize: number
}

/**
 * Analytics Chart Interaction Message (UI → Agent)
 *
 * User interacted with chart (click, hover, etc.)
 */
export interface AnalyticsChartInteractionMessage extends BaseAnalyticsMessage {
  type: 'analyticsChartInteraction'
  /** Interaction type */
  interactionType: 'click' | 'hover' | 'select' | 'zoom' | 'pan'
  /** Data point that was interacted with */
  dataPoint?: AnalyticsDataPoint
  /** Selected range (for zoom/pan) */
  range?: {
    start: Date | number
    end: Date | number
  }
}

// ============================================================================
// Error Messages
// ============================================================================

/**
 * Analytics error information
 */
export interface AnalyticsError {
  /** Error code */
  code: string
  /** Error message */
  message: string
  /** Additional error details */
  details?: Record<string, unknown>
  /** Is error retryable */
  retryable?: boolean
  /** Retry after milliseconds */
  retryAfter?: number
}

/**
 * Analytics Error Message (Agent → UI)
 *
 * Error occurred during analytics operation
 */
export interface AnalyticsErrorMessage extends BaseAnalyticsMessage {
  type: 'analyticsError'
  /** Error information */
  error: AnalyticsError
  /** Query ID if error relates to specific query */
  queryId?: string
}

// ============================================================================
// WebSocket Streaming Messages
// ============================================================================

/**
 * Analytics Stream Start Message (UI → Agent)
 *
 * Start real-time data streaming
 */
export interface AnalyticsStreamStartMessage extends BaseAnalyticsMessage {
  type: 'analyticsStreamStart'
  /** Stream configuration */
  config: {
    /** Metrics to stream */
    metrics: string[]
    /** Update interval in seconds */
    interval: number
    /** Filters to apply */
    filters?: AnalyticsFilter[]
  }
}

/**
 * Analytics Stream Stop Message (UI → Agent)
 *
 * Stop real-time data streaming
 */
export interface AnalyticsStreamStopMessage extends BaseAnalyticsMessage {
  type: 'analyticsStreamStop'
}

/**
 * Analytics Stream Data Message (Agent → UI)
 *
 * Streaming data update
 */
export interface AnalyticsStreamDataMessage extends BaseAnalyticsMessage {
  type: 'analyticsStreamData'
  /** Streamed data point */
  data: AnalyticsDataPoint
  /** Stream timestamp */
  timestamp: Date
}

// ============================================================================
// Union Types
// ============================================================================

/**
 * All query-related messages
 */
export type AnalyticsQueryMessages =
  | AnalyticsQueryMessage
  | AnalyticsDataMessage
  | AnalyticsRefreshMessage

/**
 * All interaction messages
 */
export type AnalyticsInteractionMessages =
  | AnalyticsFilterChangeMessage
  | AnalyticsTimeRangeChangeMessage
  | AnalyticsDrillDownMessage
  | AnalyticsSortChangeMessage
  | AnalyticsPaginationMessage
  | AnalyticsChartInteractionMessage

/**
 * All export messages
 */
export type AnalyticsExportMessages = AnalyticsExportMessage | AnalyticsExportedMessage

/**
 * All streaming messages
 */
export type AnalyticsStreamMessages =
  | AnalyticsStreamStartMessage
  | AnalyticsStreamStopMessage
  | AnalyticsStreamDataMessage

/**
 * Union of all analytics messages
 */
export type AnalyticsMessage =
  | AnalyticsQueryMessages
  | AnalyticsInteractionMessages
  | AnalyticsExportMessages
  | AnalyticsStreamMessages
  | AnalyticsDataUpdateMessage
  | AnalyticsErrorMessage

// ============================================================================
// Type Guards
// ============================================================================

export function isAnalyticsQueryMessage(
  msg: AnalyticsMessage
): msg is AnalyticsQueryMessage {
  return msg.type === 'analyticsQuery'
}

export function isAnalyticsDataMessage(
  msg: AnalyticsMessage
): msg is AnalyticsDataMessage {
  return msg.type === 'analyticsData'
}

export function isAnalyticsDataUpdateMessage(
  msg: AnalyticsMessage
): msg is AnalyticsDataUpdateMessage {
  return msg.type === 'analyticsDataUpdate'
}

export function isAnalyticsRefreshMessage(
  msg: AnalyticsMessage
): msg is AnalyticsRefreshMessage {
  return msg.type === 'analyticsRefresh'
}

export function isAnalyticsExportMessage(
  msg: AnalyticsMessage
): msg is AnalyticsExportMessage {
  return msg.type === 'analyticsExport'
}

export function isAnalyticsExportedMessage(
  msg: AnalyticsMessage
): msg is AnalyticsExportedMessage {
  return msg.type === 'analyticsExported'
}

export function isAnalyticsFilterChangeMessage(
  msg: AnalyticsMessage
): msg is AnalyticsFilterChangeMessage {
  return msg.type === 'analyticsFilterChange'
}

export function isAnalyticsTimeRangeChangeMessage(
  msg: AnalyticsMessage
): msg is AnalyticsTimeRangeChangeMessage {
  return msg.type === 'analyticsTimeRangeChange'
}

export function isAnalyticsDrillDownMessage(
  msg: AnalyticsMessage
): msg is AnalyticsDrillDownMessage {
  return msg.type === 'analyticsDrillDown'
}

export function isAnalyticsSortChangeMessage(
  msg: AnalyticsMessage
): msg is AnalyticsSortChangeMessage {
  return msg.type === 'analyticsSortChange'
}

export function isAnalyticsPaginationMessage(
  msg: AnalyticsMessage
): msg is AnalyticsPaginationMessage {
  return msg.type === 'analyticsPagination'
}

export function isAnalyticsChartInteractionMessage(
  msg: AnalyticsMessage
): msg is AnalyticsChartInteractionMessage {
  return msg.type === 'analyticsChartInteraction'
}

export function isAnalyticsErrorMessage(
  msg: AnalyticsMessage
): msg is AnalyticsErrorMessage {
  return msg.type === 'analyticsError'
}

export function isAnalyticsStreamStartMessage(
  msg: AnalyticsMessage
): msg is AnalyticsStreamStartMessage {
  return msg.type === 'analyticsStreamStart'
}

export function isAnalyticsStreamStopMessage(
  msg: AnalyticsMessage
): msg is AnalyticsStreamStopMessage {
  return msg.type === 'analyticsStreamStop'
}

export function isAnalyticsStreamDataMessage(
  msg: AnalyticsMessage
): msg is AnalyticsStreamDataMessage {
  return msg.type === 'analyticsStreamData'
}
