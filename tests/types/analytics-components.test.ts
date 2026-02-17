/**
 * Tests for Analytics Dashboard Component Types
 */

import { describe, it, expect } from 'vitest'
import type {
  AnalyticsOverviewComponent,
  AnalyticsChartComponent,
  AnalyticsTableComponent,
  AnalyticsMetricComponent,
  AnalyticsHeatmapComponent,
  AnalyticsFunnelComponent,
  AnalyticsMetric,
  TimeRange,
  AnalyticsFilter,
  ChartSeries,
  AxisConfig,
  LegendConfig,
  TableColumn,
  SortConfig,
  HeatmapDataPoint,
  FunnelStage,
  AnalyticsComponent,
} from '../../src/types/analytics-components.js'
import {
  isAnalyticsOverviewComponent,
  isAnalyticsChartComponent,
  isAnalyticsTableComponent,
  isAnalyticsMetricComponent,
  isAnalyticsHeatmapComponent,
  isAnalyticsFunnelComponent,
} from '../../src/types/analytics-components.js'

describe('Analytics Component Types', () => {
  describe('AnalyticsOverviewComponent', () => {
    it('should create valid analytics overview component', () => {
      const metrics: AnalyticsMetric[] = [
        {
          id: 'total_users',
          label: 'Total Users',
          value: 15420,
          previousValue: 14800,
          change: 4.2,
          changeType: 'increase',
          format: 'number',
        },
        {
          id: 'revenue',
          label: 'Revenue',
          value: 125000,
          previousValue: 118000,
          change: 5.9,
          changeType: 'increase',
          format: 'currency',
          currency: 'USD',
        },
      ]

      const timeRange: TimeRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
        preset: 'last_30_days',
      }

      const component: AnalyticsOverviewComponent = {
        type: 'analyticsOverview',
        id: 'overview-1',
        properties: {
          metrics,
          timeRange,
          refreshInterval: 60,
          layout: 'grid',
        },
      }

      expect(component.type).toBe('analyticsOverview')
      expect(component.properties.metrics).toHaveLength(2)
      expect(component.properties.metrics[0]?.value).toBe(15420)
      expect(component.properties.layout).toBe('grid')
      expect(isAnalyticsOverviewComponent(component)).toBe(true)
    })

    it('should handle different layout options', () => {
      const metrics: AnalyticsMetric[] = [
        {
          id: 'test',
          label: 'Test',
          value: 100,
          format: 'number',
        },
      ]

      const timeRange: TimeRange = {
        start: new Date(),
        end: new Date(),
      }

      const layouts: Array<'grid' | 'list'> = ['grid', 'list']

      layouts.forEach((layout) => {
        const component: AnalyticsOverviewComponent = {
          type: 'analyticsOverview',
          id: `overview-${layout}`,
          properties: {
            metrics,
            timeRange,
            layout,
          },
        }

        expect(component.properties.layout).toBe(layout)
      })
    })

    it('should calculate metric changes correctly', () => {
      const metric: AnalyticsMetric = {
        id: 'test_metric',
        label: 'Test Metric',
        value: 1050,
        previousValue: 1000,
        change: 5.0,
        changeType: 'increase',
        format: 'number',
      }

      expect(metric.change).toBe(5.0)
      expect(metric.changeType).toBe('increase')
      expect((metric.value - metric.previousValue!) / metric.previousValue! * 100).toBeCloseTo(5.0)
    })
  })

  describe('AnalyticsChartComponent', () => {
    it('should create valid line chart component', () => {
      const xAxis: AxisConfig = {
        label: 'Date',
        type: 'time',
        format: 'MMM DD',
      }

      const yAxis: AxisConfig = {
        label: 'Users',
        type: 'linear',
        format: 'number',
      }

      const series: ChartSeries[] = [
        {
          id: 'active_users',
          name: 'Active Users',
          data: [
            { x: new Date('2024-01-01'), y: 100 },
            { x: new Date('2024-01-02'), y: 150 },
            { x: new Date('2024-01-03'), y: 200 },
          ],
          color: '#4F46E5',
        },
      ]

      const legend: LegendConfig = {
        show: true,
        position: 'bottom',
        align: 'center',
      }

      const component: AnalyticsChartComponent = {
        type: 'analyticsChart',
        id: 'chart-1',
        properties: {
          chartType: 'line',
          dataSource: 'user_activity',
          xAxis,
          yAxis,
          series,
          legend,
          interactive: true,
        },
      }

      expect(component.type).toBe('analyticsChart')
      expect(component.properties.chartType).toBe('line')
      expect(component.properties.series).toHaveLength(1)
      expect(component.properties.series[0]?.data).toHaveLength(3)
      expect(isAnalyticsChartComponent(component)).toBe(true)
    })

    it('should handle different chart types', () => {
      const chartTypes: Array<'line' | 'bar' | 'pie' | 'area' | 'scatter'> = [
        'line',
        'bar',
        'pie',
        'area',
        'scatter',
      ]

      chartTypes.forEach((chartType) => {
        const component: AnalyticsChartComponent = {
          type: 'analyticsChart',
          id: `chart-${chartType}`,
          properties: {
            chartType,
            dataSource: 'test_data',
            series: [],
          },
        }

        expect(component.properties.chartType).toBe(chartType)
      })
    })

    it('should handle multiple series', () => {
      const series: ChartSeries[] = [
        {
          id: 'series1',
          name: 'Series 1',
          data: [{ x: 1, y: 100 }],
          color: '#FF0000',
        },
        {
          id: 'series2',
          name: 'Series 2',
          data: [{ x: 1, y: 200 }],
          color: '#00FF00',
        },
        {
          id: 'series3',
          name: 'Series 3',
          data: [{ x: 1, y: 150 }],
          color: '#0000FF',
        },
      ]

      const component: AnalyticsChartComponent = {
        type: 'analyticsChart',
        id: 'chart-multi',
        properties: {
          chartType: 'line',
          dataSource: 'multi_series',
          series,
        },
      }

      expect(component.properties.series).toHaveLength(3)
      expect(component.properties.series.map(s => s.color)).toEqual(['#FF0000', '#00FF00', '#0000FF'])
    })
  })

  describe('AnalyticsTableComponent', () => {
    it('should create valid analytics table component', () => {
      const columns: TableColumn[] = [
        {
          id: 'name',
          label: 'Name',
          type: 'text',
          sortable: true,
          width: 200,
        },
        {
          id: 'value',
          label: 'Value',
          type: 'number',
          sortable: true,
          align: 'right',
          format: 'number',
        },
        {
          id: 'change',
          label: 'Change',
          type: 'percentage',
          sortable: true,
          align: 'right',
          colorCode: true,
        },
      ]

      const sort: SortConfig = {
        columnId: 'value',
        direction: 'desc',
      }

      const component: AnalyticsTableComponent = {
        type: 'analyticsTable',
        id: 'table-1',
        properties: {
          dataSource: 'metrics_table',
          columns,
          sort,
          pagination: {
            enabled: true,
            pageSize: 25,
            currentPage: 1,
          },
          filterable: true,
          exportable: true,
          exportFormats: ['csv', 'json', 'pdf'],
        },
      }

      expect(component.type).toBe('analyticsTable')
      expect(component.properties.columns).toHaveLength(3)
      expect(component.properties.sort?.direction).toBe('desc')
      expect(component.properties.pagination?.pageSize).toBe(25)
      expect(isAnalyticsTableComponent(component)).toBe(true)
    })

    it('should handle different column types', () => {
      const columnTypes: Array<'text' | 'number' | 'percentage' | 'currency' | 'date' | 'boolean'> = [
        'text',
        'number',
        'percentage',
        'currency',
        'date',
        'boolean',
      ]

      columnTypes.forEach((type) => {
        const column: TableColumn = {
          id: `col_${type}`,
          label: `Column ${type}`,
          type,
          sortable: true,
        }

        expect(column.type).toBe(type)
      })
    })

    it('should handle filtering configuration', () => {
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

      const component: AnalyticsTableComponent = {
        type: 'analyticsTable',
        id: 'table-filtered',
        properties: {
          dataSource: 'filtered_data',
          columns: [],
          filterable: true,
          filters,
        },
      }

      expect(component.properties.filters).toHaveLength(2)
      expect(component.properties.filters?.[0]?.operator).toBe('equals')
    })
  })

  describe('AnalyticsMetricComponent', () => {
    it('should create valid single metric card', () => {
      const component: AnalyticsMetricComponent = {
        type: 'analyticsMetric',
        id: 'metric-1',
        properties: {
          metric: {
            id: 'conversion_rate',
            label: 'Conversion Rate',
            value: 3.45,
            previousValue: 3.12,
            change: 10.6,
            changeType: 'increase',
            format: 'percentage',
          },
          showTrend: true,
          showSparkline: true,
          sparklineData: [2.8, 2.9, 3.1, 3.0, 3.2, 3.3, 3.45],
          size: 'medium',
          colorScheme: 'default',
        },
      }

      expect(component.type).toBe('analyticsMetric')
      expect(component.properties.metric.value).toBe(3.45)
      expect(component.properties.showSparkline).toBe(true)
      expect(component.properties.sparklineData).toHaveLength(7)
      expect(isAnalyticsMetricComponent(component)).toBe(true)
    })

    it('should handle different metric formats', () => {
      const formats: Array<'number' | 'currency' | 'percentage' | 'duration' | 'bytes'> = [
        'number',
        'currency',
        'percentage',
        'duration',
        'bytes',
      ]

      formats.forEach((format) => {
        const metric: AnalyticsMetric = {
          id: `metric_${format}`,
          label: `Test ${format}`,
          value: 100,
          format,
        }

        expect(metric.format).toBe(format)
      })
    })

    it('should handle different sizes', () => {
      const sizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large']

      sizes.forEach((size) => {
        const component: AnalyticsMetricComponent = {
          type: 'analyticsMetric',
          id: `metric-${size}`,
          properties: {
            metric: {
              id: 'test',
              label: 'Test',
              value: 100,
              format: 'number',
            },
            size,
          },
        }

        expect(component.properties.size).toBe(size)
      })
    })
  })

  describe('AnalyticsHeatmapComponent', () => {
    it('should create valid heatmap component', () => {
      const data: HeatmapDataPoint[] = [
        { x: 'Mon', y: '00:00', value: 10, color: '#E0F2FE' },
        { x: 'Mon', y: '01:00', value: 5, color: '#BAE6FD' },
        { x: 'Tue', y: '00:00', value: 25, color: '#7DD3FC' },
        { x: 'Tue', y: '01:00', value: 40, color: '#38BDF8' },
      ]

      const component: AnalyticsHeatmapComponent = {
        type: 'analyticsHeatmap',
        id: 'heatmap-1',
        properties: {
          dataSource: 'activity_heatmap',
          data,
          xAxisLabel: 'Day of Week',
          yAxisLabel: 'Hour of Day',
          colorScale: {
            min: '#E0F2FE',
            max: '#0284C7',
            steps: 5,
          },
          showValues: true,
          interactive: true,
        },
      }

      expect(component.type).toBe('analyticsHeatmap')
      expect(component.properties.data).toHaveLength(4)
      expect(component.properties.colorScale.steps).toBe(5)
      expect(isAnalyticsHeatmapComponent(component)).toBe(true)
    })

    it('should handle tooltip configuration', () => {
      const component: AnalyticsHeatmapComponent = {
        type: 'analyticsHeatmap',
        id: 'heatmap-tooltip',
        properties: {
          dataSource: 'test_heatmap',
          data: [],
          tooltip: {
            enabled: true,
            format: '{x} at {y}: {value}',
          },
        },
      }

      expect(component.properties.tooltip?.enabled).toBe(true)
      expect(component.properties.tooltip?.format).toContain('{value}')
    })
  })

  describe('AnalyticsFunnelComponent', () => {
    it('should create valid funnel component', () => {
      const stages: FunnelStage[] = [
        {
          id: 'stage1',
          label: 'Website Visits',
          value: 10000,
          percentage: 100,
          color: '#4F46E5',
        },
        {
          id: 'stage2',
          label: 'Sign Ups',
          value: 3000,
          percentage: 30,
          conversionRate: 30,
          dropoff: 7000,
          color: '#7C3AED',
        },
        {
          id: 'stage3',
          label: 'Purchases',
          value: 450,
          percentage: 4.5,
          conversionRate: 15,
          dropoff: 2550,
          color: '#C026D3',
        },
      ]

      const component: AnalyticsFunnelComponent = {
        type: 'analyticsFunnel',
        id: 'funnel-1',
        properties: {
          stages,
          orientation: 'vertical',
          showConversionRates: true,
          showDropoff: true,
          interactive: true,
        },
      }

      expect(component.type).toBe('analyticsFunnel')
      expect(component.properties.stages).toHaveLength(3)
      expect(component.properties.stages[0]?.value).toBe(10000)
      expect(component.properties.stages[1]?.conversionRate).toBe(30)
      expect(isAnalyticsFunnelComponent(component)).toBe(true)
    })

    it('should handle different orientations', () => {
      const orientations: Array<'vertical' | 'horizontal'> = ['vertical', 'horizontal']

      orientations.forEach((orientation) => {
        const component: AnalyticsFunnelComponent = {
          type: 'analyticsFunnel',
          id: `funnel-${orientation}`,
          properties: {
            stages: [],
            orientation,
          },
        }

        expect(component.properties.orientation).toBe(orientation)
      })
    })

    it('should calculate conversion rates correctly', () => {
      const stage1 = { value: 1000 }
      const stage2 = { value: 300 }
      const conversionRate = (stage2.value / stage1.value) * 100

      expect(conversionRate).toBe(30)
    })
  })

  describe('Type Guards', () => {
    it('should correctly identify analytics component types', () => {
      const components = [
        { type: 'analyticsOverview', id: '1', properties: { metrics: [], timeRange: {} } },
        { type: 'analyticsChart', id: '2', properties: { chartType: 'line', dataSource: '', series: [] } },
        { type: 'analyticsTable', id: '3', properties: { dataSource: '', columns: [] } },
        { type: 'analyticsMetric', id: '4', properties: { metric: { id: '', label: '', value: 0, format: 'number' } } },
        { type: 'analyticsHeatmap', id: '5', properties: { dataSource: '', data: [] } },
        { type: 'analyticsFunnel', id: '6', properties: { stages: [] } },
      ]

      expect(isAnalyticsOverviewComponent(components[0]!)).toBe(true)
      expect(isAnalyticsChartComponent(components[1]!)).toBe(true)
      expect(isAnalyticsTableComponent(components[2]!)).toBe(true)
      expect(isAnalyticsMetricComponent(components[3]!)).toBe(true)
      expect(isAnalyticsHeatmapComponent(components[4]!)).toBe(true)
      expect(isAnalyticsFunnelComponent(components[5]!)).toBe(true)
    })

    it('should return false for incorrect types', () => {
      const component = { type: 'button', id: '1' }

      expect(isAnalyticsOverviewComponent(component)).toBe(false)
      expect(isAnalyticsChartComponent(component)).toBe(false)
      expect(isAnalyticsTableComponent(component)).toBe(false)
      expect(isAnalyticsMetricComponent(component)).toBe(false)
      expect(isAnalyticsHeatmapComponent(component)).toBe(false)
      expect(isAnalyticsFunnelComponent(component)).toBe(false)
    })
  })

  describe('TimeRange', () => {
    it('should handle different time range presets', () => {
      const presets: Array<'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'this_month' | 'last_month' | 'this_year' | 'custom'> = [
        'today',
        'yesterday',
        'last_7_days',
        'last_30_days',
        'last_90_days',
        'this_month',
        'last_month',
        'this_year',
        'custom',
      ]

      presets.forEach((preset) => {
        const timeRange: TimeRange = {
          start: new Date(),
          end: new Date(),
          preset,
        }

        expect(timeRange.preset).toBe(preset)
      })
    })

    it('should handle custom date ranges', () => {
      const start = new Date('2024-01-01')
      const end = new Date('2024-12-31')

      const timeRange: TimeRange = {
        start,
        end,
        preset: 'custom',
      }

      expect(timeRange.start).toEqual(start)
      expect(timeRange.end).toEqual(end)
      expect(timeRange.preset).toBe('custom')
    })
  })

  describe('AnalyticsFilter', () => {
    it('should handle different filter operators', () => {
      const operators: Array<'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in'> = [
        'equals',
        'not_equals',
        'contains',
        'greater_than',
        'less_than',
        'between',
        'in',
        'not_in',
      ]

      operators.forEach((operator) => {
        const filter: AnalyticsFilter = {
          field: 'test_field',
          operator,
          value: 'test_value',
        }

        expect(filter.operator).toBe(operator)
      })
    })

    it('should handle between operator with multiple values', () => {
      const filter: AnalyticsFilter = {
        field: 'age',
        operator: 'between',
        value: [18, 65],
      }

      expect(filter.operator).toBe('between')
      expect(Array.isArray(filter.value)).toBe(true)
      expect((filter.value as number[]).length).toBe(2)
    })
  })
})
