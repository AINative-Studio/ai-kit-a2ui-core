/**
 * Tests for Analytics Message Types
 */

import { describe, it, expect } from 'vitest'
import type {
  AnalyticsQueryMessage,
  AnalyticsDataMessage,
  AnalyticsDataUpdateMessage,
  AnalyticsRefreshMessage,
  AnalyticsExportMessage,
  AnalyticsExportedMessage,
  AnalyticsFilterChangeMessage,
  AnalyticsTimeRangeChangeMessage,
  AnalyticsDrillDownMessage,
  AnalyticsErrorMessage,
  AnalyticsDataPoint,
  AnalyticsMetadata,
  AnalyticsMessage,
} from '../../src/types/analytics-messages.js'
import {
  isAnalyticsQueryMessage,
  isAnalyticsDataMessage,
  isAnalyticsDataUpdateMessage,
  isAnalyticsRefreshMessage,
  isAnalyticsExportMessage,
  isAnalyticsFilterChangeMessage,
  isAnalyticsTimeRangeChangeMessage,
  isAnalyticsDrillDownMessage,
  isAnalyticsErrorMessage,
} from '../../src/types/analytics-messages.js'
import type { TimeRange, AnalyticsFilter } from '../../src/types/analytics-components.js'

describe('Analytics Message Types', () => {
  describe('AnalyticsQueryMessage', () => {
    it('should create valid analytics query message', () => {
      const timeRange: TimeRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
        preset: 'last_30_days',
      }

      const filters: AnalyticsFilter[] = [
        {
          field: 'category',
          operator: 'equals',
          value: 'premium',
        },
      ]

      const message: AnalyticsQueryMessage = {
        type: 'analyticsQuery',
        componentId: 'chart-1',
        queryId: 'query-123',
        timeRange,
        metrics: ['users', 'revenue', 'conversions'],
        filters,
        groupBy: ['date', 'category'],
        limit: 100,
      }

      expect(message.type).toBe('analyticsQuery')
      expect(message.queryId).toBe('query-123')
      expect(message.metrics).toHaveLength(3)
      expect(message.filters).toHaveLength(1)
      expect(message.groupBy).toHaveLength(2)
      expect(isAnalyticsQueryMessage(message)).toBe(true)
    })

    it('should handle minimal query message', () => {
      const message: AnalyticsQueryMessage = {
        type: 'analyticsQuery',
        componentId: 'metric-1',
        queryId: 'query-456',
        timeRange: {
          start: new Date(),
          end: new Date(),
        },
        metrics: ['total_users'],
      }

      expect(message.metrics).toHaveLength(1)
      expect(message.filters).toBeUndefined()
      expect(message.groupBy).toBeUndefined()
    })
  })

  describe('AnalyticsDataMessage', () => {
    it('should create valid analytics data message', () => {
      const data: AnalyticsDataPoint[] = [
        {
          timestamp: new Date('2024-01-01'),
          values: {
            users: 1000,
            revenue: 5000,
            conversions: 50,
          },
          dimensions: {
            category: 'premium',
            region: 'US',
          },
        },
        {
          timestamp: new Date('2024-01-02'),
          values: {
            users: 1200,
            revenue: 6000,
            conversions: 60,
          },
          dimensions: {
            category: 'premium',
            region: 'US',
          },
        },
      ]

      const metadata: AnalyticsMetadata = {
        totalRecords: 2,
        query: {
          timeRange: {
            start: new Date('2024-01-01'),
            end: new Date('2024-01-02'),
          },
          metrics: ['users', 'revenue', 'conversions'],
        },
        executionTime: 150,
        cached: false,
      }

      const message: AnalyticsDataMessage = {
        type: 'analyticsData',
        componentId: 'chart-1',
        queryId: 'query-123',
        data,
        metadata,
      }

      expect(message.type).toBe('analyticsData')
      expect(message.data).toHaveLength(2)
      expect(message.data[0]?.values.users).toBe(1000)
      expect(message.metadata.totalRecords).toBe(2)
      expect(isAnalyticsDataMessage(message)).toBe(true)
    })

    it('should handle aggregated data', () => {
      const data: AnalyticsDataPoint[] = [
        {
          timestamp: new Date('2024-01-01'),
          values: {
            avg_value: 42.5,
            sum_total: 1000,
            count: 24,
          },
        },
      ]

      const metadata: AnalyticsMetadata = {
        totalRecords: 1,
        query: {
          timeRange: {
            start: new Date(),
            end: new Date(),
          },
          metrics: ['avg_value', 'sum_total', 'count'],
        },
        executionTime: 50,
        cached: true,
      }

      const message: AnalyticsDataMessage = {
        type: 'analyticsData',
        componentId: 'metric-1',
        queryId: 'query-aggregated',
        data,
        metadata,
      }

      expect(message.data[0]?.values.avg_value).toBe(42.5)
      expect(message.metadata.cached).toBe(true)
    })
  })

  describe('AnalyticsDataUpdateMessage', () => {
    it('should create valid real-time update message', () => {
      const updates: AnalyticsDataPoint[] = [
        {
          timestamp: new Date(),
          values: {
            active_users: 523,
          },
        },
      ]

      const message: AnalyticsDataUpdateMessage = {
        type: 'analyticsDataUpdate',
        componentId: 'realtime-1',
        updates,
        timestamp: new Date(),
        updateType: 'incremental',
      }

      expect(message.type).toBe('analyticsDataUpdate')
      expect(message.updates).toHaveLength(1)
      expect(message.updateType).toBe('incremental')
      expect(isAnalyticsDataUpdateMessage(message)).toBe(true)
    })

    it('should handle full refresh updates', () => {
      const message: AnalyticsDataUpdateMessage = {
        type: 'analyticsDataUpdate',
        componentId: 'dashboard-1',
        updates: [],
        timestamp: new Date(),
        updateType: 'full',
      }

      expect(message.updateType).toBe('full')
    })
  })

  describe('AnalyticsRefreshMessage', () => {
    it('should create valid refresh message', () => {
      const message: AnalyticsRefreshMessage = {
        type: 'analyticsRefresh',
        componentId: 'chart-1',
        force: true,
      }

      expect(message.type).toBe('analyticsRefresh')
      expect(message.force).toBe(true)
      expect(isAnalyticsRefreshMessage(message)).toBe(true)
    })

    it('should handle optional force parameter', () => {
      const message: AnalyticsRefreshMessage = {
        type: 'analyticsRefresh',
        componentId: 'table-1',
      }

      expect(message.force).toBeUndefined()
    })
  })

  describe('AnalyticsExportMessage', () => {
    it('should create valid export message', () => {
      const message: AnalyticsExportMessage = {
        type: 'analyticsExport',
        componentId: 'table-1',
        format: 'csv',
        filename: 'analytics_data_2024.csv',
        includeHeaders: true,
        filters: [
          {
            field: 'status',
            operator: 'equals',
            value: 'active',
          },
        ],
      }

      expect(message.type).toBe('analyticsExport')
      expect(message.format).toBe('csv')
      expect(message.filename).toBe('analytics_data_2024.csv')
      expect(message.includeHeaders).toBe(true)
      expect(isAnalyticsExportMessage(message)).toBe(true)
    })

    it('should handle different export formats', () => {
      const formats: Array<'csv' | 'json' | 'pdf' | 'xlsx'> = ['csv', 'json', 'pdf', 'xlsx']

      formats.forEach((format) => {
        const message: AnalyticsExportMessage = {
          type: 'analyticsExport',
          componentId: 'data-1',
          format,
        }

        expect(message.format).toBe(format)
      })
    })
  })

  describe('AnalyticsExportedMessage', () => {
    it('should create valid exported message', () => {
      const message: AnalyticsExportedMessage = {
        type: 'analyticsExported',
        componentId: 'table-1',
        downloadUrl: 'https://example.com/downloads/data.csv',
        filename: 'analytics_data.csv',
        format: 'csv',
        fileSize: 1024000,
        expiresAt: new Date(Date.now() + 3600000),
      }

      expect(message.type).toBe('analyticsExported')
      expect(message.downloadUrl).toContain('https://')
      expect(message.fileSize).toBe(1024000)
      expect(message.expiresAt).toBeInstanceOf(Date)
    })

    it('should handle optional file size', () => {
      const message: AnalyticsExportedMessage = {
        type: 'analyticsExported',
        componentId: 'export-1',
        downloadUrl: 'https://example.com/data.json',
        filename: 'data.json',
        format: 'json',
        expiresAt: new Date(),
      }

      expect(message.fileSize).toBeUndefined()
    })
  })

  describe('AnalyticsFilterChangeMessage', () => {
    it('should create valid filter change message', () => {
      const filters: AnalyticsFilter[] = [
        {
          field: 'category',
          operator: 'equals',
          value: 'premium',
        },
        {
          field: 'value',
          operator: 'greater_than',
          value: 1000,
        },
      ]

      const message: AnalyticsFilterChangeMessage = {
        type: 'analyticsFilterChange',
        componentId: 'table-1',
        filters,
      }

      expect(message.type).toBe('analyticsFilterChange')
      expect(message.filters).toHaveLength(2)
      expect(isAnalyticsFilterChangeMessage(message)).toBe(true)
    })

    it('should handle clearing filters', () => {
      const message: AnalyticsFilterChangeMessage = {
        type: 'analyticsFilterChange',
        componentId: 'table-1',
        filters: [],
      }

      expect(message.filters).toHaveLength(0)
    })
  })

  describe('AnalyticsTimeRangeChangeMessage', () => {
    it('should create valid time range change message', () => {
      const timeRange: TimeRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31'),
        preset: 'custom',
        timezone: 'America/New_York',
      }

      const message: AnalyticsTimeRangeChangeMessage = {
        type: 'analyticsTimeRangeChange',
        componentId: 'dashboard-1',
        timeRange,
      }

      expect(message.type).toBe('analyticsTimeRangeChange')
      expect(message.timeRange.preset).toBe('custom')
      expect(message.timeRange.timezone).toBe('America/New_York')
      expect(isAnalyticsTimeRangeChangeMessage(message)).toBe(true)
    })

    it('should handle preset time ranges', () => {
      const presets: Array<'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'last_90_days'> = [
        'today',
        'yesterday',
        'last_7_days',
        'last_30_days',
        'last_90_days',
      ]

      presets.forEach((preset) => {
        const message: AnalyticsTimeRangeChangeMessage = {
          type: 'analyticsTimeRangeChange',
          componentId: 'chart-1',
          timeRange: {
            start: new Date(),
            end: new Date(),
            preset,
          },
        }

        expect(message.timeRange.preset).toBe(preset)
      })
    })
  })

  describe('AnalyticsDrillDownMessage', () => {
    it('should create valid drill down message', () => {
      const message: AnalyticsDrillDownMessage = {
        type: 'analyticsDrillDown',
        componentId: 'chart-1',
        dimension: 'category',
        value: 'premium',
        filters: [
          {
            field: 'category',
            operator: 'equals',
            value: 'premium',
          },
        ],
      }

      expect(message.type).toBe('analyticsDrillDown')
      expect(message.dimension).toBe('category')
      expect(message.value).toBe('premium')
      expect(isAnalyticsDrillDownMessage(message)).toBe(true)
    })

    it('should handle numeric values', () => {
      const message: AnalyticsDrillDownMessage = {
        type: 'analyticsDrillDown',
        componentId: 'funnel-1',
        dimension: 'stage',
        value: 2,
      }

      expect(typeof message.value).toBe('number')
      expect(message.value).toBe(2)
    })
  })

  describe('AnalyticsErrorMessage', () => {
    it('should create valid error message', () => {
      const message: AnalyticsErrorMessage = {
        type: 'analyticsError',
        componentId: 'chart-1',
        error: {
          code: 'QUERY_TIMEOUT',
          message: 'Query execution timed out after 30 seconds',
          details: {
            timeout: 30000,
            queryId: 'query-123',
          },
        },
      }

      expect(message.type).toBe('analyticsError')
      expect(message.error.code).toBe('QUERY_TIMEOUT')
      expect(message.error.message).toContain('timed out')
      expect(isAnalyticsErrorMessage(message)).toBe(true)
    })

    it('should handle different error codes', () => {
      const errorCodes = [
        'QUERY_FAILED',
        'INVALID_QUERY',
        'PERMISSION_DENIED',
        'DATA_NOT_FOUND',
        'RATE_LIMIT_EXCEEDED',
      ]

      errorCodes.forEach((code) => {
        const message: AnalyticsErrorMessage = {
          type: 'analyticsError',
          componentId: 'component-1',
          error: {
            code,
            message: `Error: ${code}`,
          },
        }

        expect(message.error.code).toBe(code)
      })
    })

    it('should handle retry information', () => {
      const message: AnalyticsErrorMessage = {
        type: 'analyticsError',
        componentId: 'query-1',
        error: {
          code: 'TEMPORARY_ERROR',
          message: 'Service temporarily unavailable',
          retryable: true,
          retryAfter: 5000,
        },
      }

      expect(message.error.retryable).toBe(true)
      expect(message.error.retryAfter).toBe(5000)
    })
  })

  describe('Type Guards', () => {
    it('should correctly identify analytics message types', () => {
      const messages = [
        { type: 'analyticsQuery', componentId: '1', queryId: '', timeRange: {}, metrics: [] },
        { type: 'analyticsData', componentId: '2', queryId: '', data: [], metadata: {} },
        { type: 'analyticsDataUpdate', componentId: '3', updates: [], timestamp: new Date() },
        { type: 'analyticsRefresh', componentId: '4' },
        { type: 'analyticsExport', componentId: '5', format: 'csv' },
        { type: 'analyticsFilterChange', componentId: '6', filters: [] },
        { type: 'analyticsTimeRangeChange', componentId: '7', timeRange: {} },
        { type: 'analyticsDrillDown', componentId: '8', dimension: '', value: '' },
        { type: 'analyticsError', componentId: '9', error: { code: '', message: '' } },
      ]

      expect(isAnalyticsQueryMessage(messages[0] as AnalyticsMessage)).toBe(true)
      expect(isAnalyticsDataMessage(messages[1] as AnalyticsMessage)).toBe(true)
      expect(isAnalyticsDataUpdateMessage(messages[2] as AnalyticsMessage)).toBe(true)
      expect(isAnalyticsRefreshMessage(messages[3] as AnalyticsMessage)).toBe(true)
      expect(isAnalyticsExportMessage(messages[4] as AnalyticsMessage)).toBe(true)
      expect(isAnalyticsFilterChangeMessage(messages[5] as AnalyticsMessage)).toBe(true)
      expect(isAnalyticsTimeRangeChangeMessage(messages[6] as AnalyticsMessage)).toBe(true)
      expect(isAnalyticsDrillDownMessage(messages[7] as AnalyticsMessage)).toBe(true)
      expect(isAnalyticsErrorMessage(messages[8] as AnalyticsMessage)).toBe(true)
    })

    it('should return false for incorrect types', () => {
      const message = { type: 'button', componentId: '1' }

      expect(isAnalyticsQueryMessage(message as AnalyticsMessage)).toBe(false)
      expect(isAnalyticsDataMessage(message as AnalyticsMessage)).toBe(false)
      expect(isAnalyticsRefreshMessage(message as AnalyticsMessage)).toBe(false)
      expect(isAnalyticsExportMessage(message as AnalyticsMessage)).toBe(false)
      expect(isAnalyticsFilterChangeMessage(message as AnalyticsMessage)).toBe(false)
      expect(isAnalyticsDrillDownMessage(message as AnalyticsMessage)).toBe(false)
      expect(isAnalyticsErrorMessage(message as AnalyticsMessage)).toBe(false)
    })
  })

  describe('AnalyticsDataPoint', () => {
    it('should handle complex data structures', () => {
      const dataPoint: AnalyticsDataPoint = {
        timestamp: new Date('2024-01-15T10:30:00Z'),
        values: {
          revenue: 15420.50,
          orders: 123,
          avg_order_value: 125.37,
          conversion_rate: 3.45,
        },
        dimensions: {
          country: 'US',
          category: 'electronics',
          channel: 'web',
        },
        metadata: {
          campaign_id: 'summer_sale_2024',
          source: 'google_ads',
        },
      }

      expect(dataPoint.values.revenue).toBeCloseTo(15420.50)
      expect(dataPoint.dimensions?.country).toBe('US')
      expect(dataPoint.metadata?.campaign_id).toBe('summer_sale_2024')
    })

    it('should handle minimal data points', () => {
      const dataPoint: AnalyticsDataPoint = {
        timestamp: new Date(),
        values: {
          count: 42,
        },
      }

      expect(dataPoint.values.count).toBe(42)
      expect(dataPoint.dimensions).toBeUndefined()
      expect(dataPoint.metadata).toBeUndefined()
    })
  })

  describe('AnalyticsMetadata', () => {
    it('should include query execution metadata', () => {
      const metadata: AnalyticsMetadata = {
        totalRecords: 1500,
        query: {
          timeRange: {
            start: new Date('2024-01-01'),
            end: new Date('2024-01-31'),
            preset: 'last_30_days',
          },
          metrics: ['users', 'sessions', 'pageviews'],
          filters: [
            {
              field: 'country',
              operator: 'in',
              value: ['US', 'CA', 'UK'],
            },
          ],
          groupBy: ['date'],
        },
        executionTime: 245,
        cached: false,
        cacheKey: 'analytics_query_abc123',
        dataSource: 'postgres_analytics_db',
      }

      expect(metadata.totalRecords).toBe(1500)
      expect(metadata.executionTime).toBe(245)
      expect(metadata.cached).toBe(false)
      expect(metadata.query.metrics).toHaveLength(3)
    })

    it('should handle pagination metadata', () => {
      const metadata: AnalyticsMetadata = {
        totalRecords: 5000,
        query: {
          timeRange: {
            start: new Date(),
            end: new Date(),
          },
          metrics: ['revenue'],
        },
        executionTime: 150,
        cached: true,
        pagination: {
          currentPage: 2,
          pageSize: 100,
          totalPages: 50,
          hasMore: true,
        },
      }

      expect(metadata.pagination?.currentPage).toBe(2)
      expect(metadata.pagination?.hasMore).toBe(true)
      expect(metadata.pagination?.totalPages).toBe(50)
    })
  })
})
