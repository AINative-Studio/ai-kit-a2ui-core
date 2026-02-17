/**
 * Tests for Analytics Handler
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AnalyticsHandler } from '../../src/handlers/analytics-handler.js'
import type {
  AnalyticsQueryMessage,
  AnalyticsRefreshMessage,
  AnalyticsExportMessage,
  AnalyticsFilterChangeMessage,
  AnalyticsTimeRangeChangeMessage,
  AnalyticsDrillDownMessage,
  AnalyticsDataPoint,
  AnalyticsMetadata,
} from '../../src/types/analytics-messages.js'
import type { TimeRange, AnalyticsFilter } from '../../src/types/analytics-components.js'
import type { AnalyticsService } from '../../src/handlers/analytics-handler.js'

describe('AnalyticsHandler', () => {
  let handler: AnalyticsHandler
  let mockService: AnalyticsService
  let messages: unknown[]

  beforeEach(() => {
    messages = []

    mockService = {
      query: vi.fn().mockResolvedValue({
        data: [
          {
            timestamp: new Date('2024-01-01'),
            values: { users: 100, revenue: 5000 },
          },
        ],
        metadata: {
          totalRecords: 1,
          query: {
            timeRange: {
              start: new Date('2024-01-01'),
              end: new Date('2024-01-31'),
            },
            metrics: ['users', 'revenue'],
          },
          executionTime: 150,
          cached: false,
        },
      }),
      export: vi.fn().mockResolvedValue({
        downloadUrl: 'https://example.com/export.csv',
        filename: 'data.csv',
        fileSize: 1024,
      }),
      streamStart: vi.fn().mockResolvedValue(undefined),
      streamStop: vi.fn().mockResolvedValue(undefined),
    }

    handler = new AnalyticsHandler({
      analyticsService: mockService,
      onMessage: (msg) => messages.push(msg),
      onError: vi.fn(),
    })
  })

  describe('handleQuery', () => {
    it('should handle analytics query and return data', async () => {
      const timeRange: TimeRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
        preset: 'last_30_days',
      }

      const message: AnalyticsQueryMessage = {
        type: 'analyticsQuery',
        componentId: 'chart-1',
        queryId: 'query-123',
        timeRange,
        metrics: ['users', 'revenue'],
      }

      await handler.handleQuery(message)

      expect(mockService.query).toHaveBeenCalledWith({
        timeRange,
        metrics: ['users', 'revenue'],
        filters: undefined,
        groupBy: undefined,
        sortBy: undefined,
        limit: undefined,
        offset: undefined,
        includeComparison: undefined,
      })

      expect(messages).toHaveLength(1)
      const response = messages[0] as { type: string; queryId: string; data: AnalyticsDataPoint[] }
      expect(response.type).toBe('analyticsData')
      expect(response.queryId).toBe('query-123')
      expect(response.data).toHaveLength(1)
    })

    it('should handle query with filters', async () => {
      const filters: AnalyticsFilter[] = [
        {
          field: 'category',
          operator: 'equals',
          value: 'premium',
        },
      ]

      const message: AnalyticsQueryMessage = {
        type: 'analyticsQuery',
        componentId: 'table-1',
        queryId: 'query-456',
        timeRange: {
          start: new Date(),
          end: new Date(),
        },
        metrics: ['count'],
        filters,
      }

      await handler.handleQuery(message)

      expect(mockService.query).toHaveBeenCalledWith(
        expect.objectContaining({
          filters,
        })
      )
    })

    it('should handle query with groupBy and sorting', async () => {
      const message: AnalyticsQueryMessage = {
        type: 'analyticsQuery',
        componentId: 'chart-2',
        queryId: 'query-789',
        timeRange: {
          start: new Date(),
          end: new Date(),
        },
        metrics: ['revenue'],
        groupBy: ['date', 'category'],
        sortBy: {
          field: 'revenue',
          direction: 'desc',
        },
        limit: 100,
      }

      await handler.handleQuery(message)

      expect(mockService.query).toHaveBeenCalledWith(
        expect.objectContaining({
          groupBy: ['date', 'category'],
          sortBy: { field: 'revenue', direction: 'desc' },
          limit: 100,
        })
      )
    })

    it('should handle query errors', async () => {
      const error = new Error('Query failed')
      mockService.query = vi.fn().mockRejectedValue(error)

      const message: AnalyticsQueryMessage = {
        type: 'analyticsQuery',
        componentId: 'chart-1',
        queryId: 'query-error',
        timeRange: {
          start: new Date(),
          end: new Date(),
        },
        metrics: ['users'],
      }

      await handler.handleQuery(message)

      const errorMessage = messages[0] as { type: string; error: { message: string } }
      expect(errorMessage.type).toBe('analyticsError')
      expect(errorMessage.error.message).toBe('Query failed')
    })
  })

  describe('handleRefresh', () => {
    it('should handle refresh without force', async () => {
      // First execute a query to establish state
      const queryMessage: AnalyticsQueryMessage = {
        type: 'analyticsQuery',
        componentId: 'dashboard-1',
        queryId: 'query-initial',
        timeRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        },
        metrics: ['users', 'revenue'],
      }

      await handler.handleQuery(queryMessage)

      // Reset mock to check refresh call
      vi.clearAllMocks()

      const message: AnalyticsRefreshMessage = {
        type: 'analyticsRefresh',
        componentId: 'dashboard-1',
      }

      await handler.handleRefresh(message)

      // Should use cached data if available
      expect(mockService.query).toHaveBeenCalled()
    })

    it('should handle refresh with force flag', async () => {
      // First execute a query to establish state
      const queryMessage: AnalyticsQueryMessage = {
        type: 'analyticsQuery',
        componentId: 'dashboard-1',
        queryId: 'query-initial',
        timeRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        },
        metrics: ['users', 'revenue'],
      }

      await handler.handleQuery(queryMessage)

      // Reset mock to check refresh call
      vi.clearAllMocks()

      const message: AnalyticsRefreshMessage = {
        type: 'analyticsRefresh',
        componentId: 'dashboard-1',
        force: true,
      }

      await handler.handleRefresh(message)

      // Should bypass cache
      expect(mockService.query).toHaveBeenCalled()
    })
  })

  describe('handleExport', () => {
    it('should handle export request', async () => {
      const message: AnalyticsExportMessage = {
        type: 'analyticsExport',
        componentId: 'table-1',
        format: 'csv',
        filename: 'analytics_export.csv',
        includeHeaders: true,
      }

      await handler.handleExport(message)

      expect(mockService.export).toHaveBeenCalledWith({
        format: 'csv',
        filename: 'analytics_export.csv',
        includeHeaders: true,
        filters: undefined,
        timeRange: undefined,
        columns: undefined,
      })

      const response = messages[0] as { type: string; downloadUrl: string }
      expect(response.type).toBe('analyticsExported')
      expect(response.downloadUrl).toBe('https://example.com/export.csv')
    })

    it('should handle different export formats', async () => {
      const formats: Array<'csv' | 'json' | 'pdf' | 'xlsx'> = ['csv', 'json', 'pdf', 'xlsx']

      for (const format of formats) {
        messages = []

        const message: AnalyticsExportMessage = {
          type: 'analyticsExport',
          componentId: `export-${format}`,
          format,
        }

        await handler.handleExport(message)

        const response = messages[0] as { format: string }
        expect(response.format).toBe(format)
      }
    })

    it('should handle export with filters', async () => {
      const filters: AnalyticsFilter[] = [
        {
          field: 'status',
          operator: 'equals',
          value: 'active',
        },
      ]

      const message: AnalyticsExportMessage = {
        type: 'analyticsExport',
        componentId: 'table-1',
        format: 'xlsx',
        filters,
      }

      await handler.handleExport(message)

      expect(mockService.export).toHaveBeenCalledWith(
        expect.objectContaining({
          filters,
        })
      )
    })
  })

  describe('handleFilterChange', () => {
    it('should handle filter change', async () => {
      const filters: AnalyticsFilter[] = [
        {
          field: 'category',
          operator: 'equals',
          value: 'premium',
        },
      ]

      const message: AnalyticsFilterChangeMessage = {
        type: 'analyticsFilterChange',
        componentId: 'table-1',
        filters,
      }

      await handler.handleFilterChange(message)

      // Should store filters for subsequent queries
      const storedFilters = handler.getFilters('table-1')
      expect(storedFilters).toEqual(filters)
    })

    it('should handle clearing filters', async () => {
      const message: AnalyticsFilterChangeMessage = {
        type: 'analyticsFilterChange',
        componentId: 'table-1',
        filters: [],
      }

      await handler.handleFilterChange(message)

      const storedFilters = handler.getFilters('table-1')
      expect(storedFilters).toHaveLength(0)
    })
  })

  describe('handleTimeRangeChange', () => {
    it('should handle time range change', async () => {
      const timeRange: TimeRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31'),
        preset: 'custom',
      }

      const message: AnalyticsTimeRangeChangeMessage = {
        type: 'analyticsTimeRangeChange',
        componentId: 'dashboard-1',
        timeRange,
      }

      await handler.handleTimeRangeChange(message)

      // Should store time range for subsequent queries
      const storedTimeRange = handler.getTimeRange('dashboard-1')
      expect(storedTimeRange).toEqual(timeRange)
    })

    it('should handle preset time ranges', async () => {
      const presets: Array<'today' | 'yesterday' | 'last_7_days' | 'last_30_days'> = [
        'today',
        'yesterday',
        'last_7_days',
        'last_30_days',
      ]

      for (const preset of presets) {
        const message: AnalyticsTimeRangeChangeMessage = {
          type: 'analyticsTimeRangeChange',
          componentId: 'chart-1',
          timeRange: {
            start: new Date(),
            end: new Date(),
            preset,
          },
        }

        await handler.handleTimeRangeChange(message)

        const storedTimeRange = handler.getTimeRange('chart-1')
        expect(storedTimeRange?.preset).toBe(preset)
      }
    })
  })

  describe('handleDrillDown', () => {
    it('should handle drill down action', async () => {
      const message: AnalyticsDrillDownMessage = {
        type: 'analyticsDrillDown',
        componentId: 'chart-1',
        dimension: 'category',
        value: 'electronics',
      }

      await handler.handleDrillDown(message)

      // Should automatically add filter for drilled dimension
      const filters = handler.getFilters('chart-1')
      expect(filters).toHaveLength(1)
      expect(filters[0]?.field).toBe('category')
      expect(filters[0]?.value).toBe('electronics')
    })

    it('should handle drill down with existing filters', async () => {
      // Set initial filters
      await handler.handleFilterChange({
        type: 'analyticsFilterChange',
        componentId: 'chart-1',
        filters: [
          {
            field: 'region',
            operator: 'equals',
            value: 'US',
          },
        ],
      })

      // Drill down
      const message: AnalyticsDrillDownMessage = {
        type: 'analyticsDrillDown',
        componentId: 'chart-1',
        dimension: 'category',
        value: 'electronics',
      }

      await handler.handleDrillDown(message)

      const filters = handler.getFilters('chart-1')
      expect(filters).toHaveLength(2)
      expect(filters.some((f) => f.field === 'region')).toBe(true)
      expect(filters.some((f) => f.field === 'category')).toBe(true)
    })
  })

  describe('Real-time streaming', () => {
    it('should start streaming', async () => {
      await handler.startStreaming('realtime-1', {
        metrics: ['active_users'],
        interval: 5,
      })

      expect(mockService.streamStart).toHaveBeenCalledWith({
        metrics: ['active_users'],
        interval: 5,
        filters: undefined,
      })
    })

    it('should stop streaming', async () => {
      await handler.startStreaming('realtime-1', {
        metrics: ['active_users'],
        interval: 5,
      })

      await handler.stopStreaming('realtime-1')

      expect(mockService.streamStop).toHaveBeenCalled()
    })

    it('should handle stream data updates', async () => {
      const callback = vi.fn()

      handler.subscribeToUpdates('realtime-1', callback)

      const dataPoint: AnalyticsDataPoint = {
        timestamp: new Date(),
        values: { active_users: 523 },
      }

      handler.emitStreamData('realtime-1', dataPoint)

      expect(callback).toHaveBeenCalledWith(dataPoint)
    })

    it('should unsubscribe from updates', () => {
      const callback = vi.fn()

      const unsubscribe = handler.subscribeToUpdates('realtime-1', callback)

      unsubscribe()

      const dataPoint: AnalyticsDataPoint = {
        timestamp: new Date(),
        values: { active_users: 523 },
      }

      handler.emitStreamData('realtime-1', dataPoint)

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('State management', () => {
    it('should track component state independently', async () => {
      const filters1: AnalyticsFilter[] = [
        { field: 'type', operator: 'equals', value: 'A' },
      ]
      const filters2: AnalyticsFilter[] = [
        { field: 'type', operator: 'equals', value: 'B' },
      ]

      await handler.handleFilterChange({
        type: 'analyticsFilterChange',
        componentId: 'component-1',
        filters: filters1,
      })

      await handler.handleFilterChange({
        type: 'analyticsFilterChange',
        componentId: 'component-2',
        filters: filters2,
      })

      expect(handler.getFilters('component-1')).toEqual(filters1)
      expect(handler.getFilters('component-2')).toEqual(filters2)
    })

    it('should clear component state', () => {
      handler.handleFilterChange({
        type: 'analyticsFilterChange',
        componentId: 'component-1',
        filters: [{ field: 'test', operator: 'equals', value: '1' }],
      })

      handler.clearComponentState('component-1')

      expect(handler.getFilters('component-1')).toHaveLength(0)
    })
  })

  describe('Error handling', () => {
    it('should handle service errors gracefully', async () => {
      mockService.query = vi.fn().mockRejectedValue(new Error('Service unavailable'))

      const message: AnalyticsQueryMessage = {
        type: 'analyticsQuery',
        componentId: 'chart-1',
        queryId: 'query-error',
        timeRange: {
          start: new Date(),
          end: new Date(),
        },
        metrics: ['users'],
      }

      await handler.handleQuery(message)

      const errorMessage = messages[0] as { type: string }
      expect(errorMessage.type).toBe('analyticsError')
    })

    it('should include query ID in error messages', async () => {
      mockService.query = vi.fn().mockRejectedValue(new Error('Timeout'))

      const message: AnalyticsQueryMessage = {
        type: 'analyticsQuery',
        componentId: 'chart-1',
        queryId: 'query-timeout',
        timeRange: {
          start: new Date(),
          end: new Date(),
        },
        metrics: ['users'],
      }

      await handler.handleQuery(message)

      const errorMessage = messages[0] as { queryId: string }
      expect(errorMessage.queryId).toBe('query-timeout')
    })
  })

  describe('Cleanup', () => {
    it('should cleanup resources on destroy', async () => {
      await handler.startStreaming('stream-1', {
        metrics: ['users'],
        interval: 5,
      })

      handler.destroy()

      expect(mockService.streamStop).toHaveBeenCalled()
    })

    it('should clear all subscriptions on destroy', () => {
      const callback = vi.fn()

      handler.subscribeToUpdates('component-1', callback)
      handler.destroy()

      handler.emitStreamData('component-1', {
        timestamp: new Date(),
        values: { test: 1 },
      })

      expect(callback).not.toHaveBeenCalled()
    })
  })
})
