/**
 * A2UI v0.9 Analytics Dashboard Component Type Definitions
 *
 * Comprehensive analytics and data visualization components
 * for real-time dashboard creation with charts, tables, and metrics.
 */

/**
 * Time range configuration for analytics queries
 */
export interface TimeRange {
  /** Start date */
  start: Date
  /** End date */
  end: Date
  /** Preset time range option */
  preset?:
    | 'today'
    | 'yesterday'
    | 'last_7_days'
    | 'last_30_days'
    | 'last_90_days'
    | 'this_month'
    | 'last_month'
    | 'this_year'
    | 'custom'
  /** Optional timezone */
  timezone?: string
}

/**
 * Analytics metric data structure
 */
export interface AnalyticsMetric {
  /** Unique metric identifier */
  id: string
  /** Display label */
  label: string
  /** Current value */
  value: number
  /** Previous value for comparison */
  previousValue?: number
  /** Change percentage */
  change?: number
  /** Change direction */
  changeType?: 'increase' | 'decrease' | 'neutral'
  /** Value format */
  format: 'number' | 'currency' | 'percentage' | 'duration' | 'bytes'
  /** Currency code (ISO 4217) if format is currency */
  currency?: string
  /** Icon identifier */
  icon?: string
  /** Description or help text */
  description?: string
  /** Target or goal value */
  target?: number
}

/**
 * Analytics filter configuration
 */
export interface AnalyticsFilter {
  /** Field name to filter on */
  field: string
  /** Filter operator */
  operator:
    | 'equals'
    | 'not_equals'
    | 'contains'
    | 'greater_than'
    | 'less_than'
    | 'between'
    | 'in'
    | 'not_in'
  /** Filter value(s) */
  value: string | number | boolean | Date | Array<string | number>
  /** Label for UI display */
  label?: string
}

/**
 * Chart axis configuration
 */
export interface AxisConfig {
  /** Axis label */
  label?: string
  /** Axis type */
  type?: 'linear' | 'logarithmic' | 'time' | 'category'
  /** Value format */
  format?: string
  /** Minimum value */
  min?: number
  /** Maximum value */
  max?: number
  /** Show grid lines */
  showGrid?: boolean
}

/**
 * Chart legend configuration
 */
export interface LegendConfig {
  /** Show legend */
  show: boolean
  /** Legend position */
  position: 'top' | 'bottom' | 'left' | 'right'
  /** Legend alignment */
  align?: 'start' | 'center' | 'end'
  /** Allow toggling series visibility */
  interactive?: boolean
}

/**
 * Chart data series
 */
export interface ChartSeries {
  /** Series identifier */
  id: string
  /** Series display name */
  name: string
  /** Data points */
  data: Array<{ x: string | number | Date; y: number; label?: string }>
  /** Series color */
  color?: string
  /** Line type (for line charts) */
  lineType?: 'solid' | 'dashed' | 'dotted'
  /** Fill area under line */
  fill?: boolean
  /** Show data point markers */
  showMarkers?: boolean
}

/**
 * Analytics Overview Component
 *
 * Displays a summary dashboard with key metrics
 */
export interface AnalyticsOverviewComponent {
  type: 'analyticsOverview'
  id: string
  properties: {
    /** Metrics to display */
    metrics: AnalyticsMetric[]
    /** Time range for metrics */
    timeRange: TimeRange
    /** Auto-refresh interval in seconds */
    refreshInterval?: number
    /** Layout style */
    layout?: 'grid' | 'list'
    /** Number of columns for grid layout */
    columns?: number
    /** Show comparison to previous period */
    showComparison?: boolean
    /** Additional metadata */
    metadata?: Record<string, unknown>
  }
}

/**
 * Analytics Chart Component
 *
 * Displays data visualizations with various chart types
 */
export interface AnalyticsChartComponent {
  type: 'analyticsChart'
  id: string
  properties: {
    /** Chart type */
    chartType: 'line' | 'bar' | 'pie' | 'area' | 'scatter'
    /** Data source identifier */
    dataSource: string
    /** X-axis configuration */
    xAxis?: AxisConfig
    /** Y-axis configuration */
    yAxis?: AxisConfig
    /** Data series */
    series: ChartSeries[]
    /** Legend configuration */
    legend?: LegendConfig
    /** Enable interactive features (zoom, pan, tooltips) */
    interactive?: boolean
    /** Chart title */
    title?: string
    /** Chart subtitle */
    subtitle?: string
    /** Height in pixels */
    height?: number
    /** Enable data point labels */
    showLabels?: boolean
    /** Enable animations */
    animate?: boolean
    /** Additional metadata */
    metadata?: Record<string, unknown>
  }
}

/**
 * Table column configuration
 */
export interface TableColumn {
  /** Column identifier */
  id: string
  /** Column display label */
  label: string
  /** Data type */
  type: 'text' | 'number' | 'percentage' | 'currency' | 'date' | 'boolean'
  /** Is column sortable */
  sortable?: boolean
  /** Column width in pixels */
  width?: number
  /** Text alignment */
  align?: 'left' | 'center' | 'right'
  /** Value format string */
  format?: string
  /** Currency code if type is currency */
  currency?: string
  /** Apply color coding based on value */
  colorCode?: boolean
  /** Column is hidden by default */
  hidden?: boolean
}

/**
 * Sort configuration
 */
export interface SortConfig {
  /** Column ID to sort by */
  columnId: string
  /** Sort direction */
  direction: 'asc' | 'desc'
}

/**
 * Pagination configuration
 */
export interface PaginationConfig {
  /** Enable pagination */
  enabled: boolean
  /** Items per page */
  pageSize: number
  /** Current page number (1-indexed) */
  currentPage: number
  /** Total number of items */
  totalItems?: number
}

/**
 * Analytics Table Component
 *
 * Displays tabular data with sorting, filtering, and pagination
 */
export interface AnalyticsTableComponent {
  type: 'analyticsTable'
  id: string
  properties: {
    /** Data source identifier */
    dataSource: string
    /** Table columns */
    columns: TableColumn[]
    /** Sort configuration */
    sort?: SortConfig
    /** Pagination configuration */
    pagination?: PaginationConfig
    /** Enable filtering */
    filterable?: boolean
    /** Active filters */
    filters?: AnalyticsFilter[]
    /** Enable data export */
    exportable?: boolean
    /** Export formats */
    exportFormats?: Array<'csv' | 'json' | 'pdf' | 'xlsx'>
    /** Enable row selection */
    selectable?: boolean
    /** Compact table density */
    dense?: boolean
    /** Show table header */
    showHeader?: boolean
    /** Fixed header on scroll */
    stickyHeader?: boolean
    /** Additional metadata */
    metadata?: Record<string, unknown>
  }
}

/**
 * Analytics Metric Component
 *
 * Displays a single metric card with trend indicators
 */
export interface AnalyticsMetricComponent {
  type: 'analyticsMetric'
  id: string
  properties: {
    /** Metric to display */
    metric: AnalyticsMetric
    /** Show trend indicator */
    showTrend?: boolean
    /** Show sparkline chart */
    showSparkline?: boolean
    /** Sparkline data points */
    sparklineData?: number[]
    /** Card size */
    size?: 'small' | 'medium' | 'large'
    /** Color scheme */
    colorScheme?: 'default' | 'success' | 'warning' | 'error' | 'info'
    /** Click action */
    clickAction?: {
      type: 'drill_down' | 'navigate' | 'custom'
      target?: string
      params?: Record<string, unknown>
    }
    /** Additional metadata */
    metadata?: Record<string, unknown>
  }
}

/**
 * Heatmap data point
 */
export interface HeatmapDataPoint {
  /** X-axis value */
  x: string | number
  /** Y-axis value */
  y: string | number
  /** Data value */
  value: number
  /** Color for this cell */
  color?: string
  /** Label text */
  label?: string
}

/**
 * Color scale configuration
 */
export interface ColorScale {
  /** Minimum value color */
  min: string
  /** Maximum value color */
  max: string
  /** Number of color steps */
  steps?: number
  /** Color palette type */
  type?: 'sequential' | 'diverging' | 'categorical'
}

/**
 * Tooltip configuration
 */
export interface TooltipConfig {
  /** Enable tooltip */
  enabled: boolean
  /** Tooltip format string */
  format?: string
  /** Custom renderer function name */
  renderer?: string
}

/**
 * Analytics Heatmap Component
 *
 * Displays time-series or categorical data as a heatmap
 */
export interface AnalyticsHeatmapComponent {
  type: 'analyticsHeatmap'
  id: string
  properties: {
    /** Data source identifier */
    dataSource: string
    /** Heatmap data */
    data: HeatmapDataPoint[]
    /** X-axis label */
    xAxisLabel?: string
    /** Y-axis label */
    yAxisLabel?: string
    /** Color scale configuration */
    colorScale: ColorScale
    /** Show values in cells */
    showValues?: boolean
    /** Cell padding */
    cellPadding?: number
    /** Cell border radius */
    cellRadius?: number
    /** Tooltip configuration */
    tooltip?: TooltipConfig
    /** Enable interactive features */
    interactive?: boolean
    /** Additional metadata */
    metadata?: Record<string, unknown>
  }
}

/**
 * Funnel stage data
 */
export interface FunnelStage {
  /** Stage identifier */
  id: string
  /** Stage display label */
  label: string
  /** Stage value (count) */
  value: number
  /** Percentage of initial stage */
  percentage: number
  /** Conversion rate from previous stage */
  conversionRate?: number
  /** Number dropped off from previous stage */
  dropoff?: number
  /** Stage color */
  color?: string
  /** Description or metadata */
  description?: string
}

/**
 * Analytics Funnel Component
 *
 * Displays conversion funnel visualization
 */
export interface AnalyticsFunnelComponent {
  type: 'analyticsFunnel'
  id: string
  properties: {
    /** Funnel stages */
    stages: FunnelStage[]
    /** Funnel orientation */
    orientation?: 'vertical' | 'horizontal'
    /** Show conversion rates */
    showConversionRates?: boolean
    /** Show dropoff numbers */
    showDropoff?: boolean
    /** Enable interactive features */
    interactive?: boolean
    /** Height in pixels */
    height?: number
    /** Additional metadata */
    metadata?: Record<string, unknown>
  }
}

/**
 * Union type of all analytics components
 */
export type AnalyticsComponent =
  | AnalyticsOverviewComponent
  | AnalyticsChartComponent
  | AnalyticsTableComponent
  | AnalyticsMetricComponent
  | AnalyticsHeatmapComponent
  | AnalyticsFunnelComponent

/**
 * Type guard for analytics overview component
 */
export function isAnalyticsOverviewComponent(
  component: { type: string }
): component is AnalyticsOverviewComponent {
  return component.type === 'analyticsOverview'
}

/**
 * Type guard for analytics chart component
 */
export function isAnalyticsChartComponent(
  component: { type: string }
): component is AnalyticsChartComponent {
  return component.type === 'analyticsChart'
}

/**
 * Type guard for analytics table component
 */
export function isAnalyticsTableComponent(
  component: { type: string }
): component is AnalyticsTableComponent {
  return component.type === 'analyticsTable'
}

/**
 * Type guard for analytics metric component
 */
export function isAnalyticsMetricComponent(
  component: { type: string }
): component is AnalyticsMetricComponent {
  return component.type === 'analyticsMetric'
}

/**
 * Type guard for analytics heatmap component
 */
export function isAnalyticsHeatmapComponent(
  component: { type: string }
): component is AnalyticsHeatmapComponent {
  return component.type === 'analyticsHeatmap'
}

/**
 * Type guard for analytics funnel component
 */
export function isAnalyticsFunnelComponent(
  component: { type: string }
): component is AnalyticsFunnelComponent {
  return component.type === 'analyticsFunnel'
}
