# Analytics Dashboard Example

This document demonstrates how to use the Analytics Dashboard components from A2UI v0.9 (Issue #52).

## Overview

The Analytics Dashboard provides 6 powerful components for real-time data visualization:

1. **analyticsOverview** - Key metrics summary
2. **analyticsChart** - Line/bar/pie charts
3. **analyticsTable** - Data grid with sort/filter
4. **analyticsMetric** - Single metric card
5. **analyticsHeatmap** - Time-series heatmap
6. **analyticsFunnel** - Conversion funnel

## Installation

```typescript
import {
  AnalyticsHandler,
  AnalyticsClient,
  type AnalyticsOverviewComponent,
  type AnalyticsChartComponent,
  type AnalyticsTableComponent,
} from '@ainative/ai-kit-a2ui-core'
```

## Basic Usage

### 1. Create Analytics Client

```typescript
import { createAnalyticsClient } from '@ainative/ai-kit-a2ui-core'

const analyticsClient = createAnalyticsClient({
  apiUrl: 'https://api.example.com/analytics',
  apiKey: 'your-api-key',
  timeout: 30000,
  maxRetries: 2,
})
```

### 2. Initialize Analytics Handler

```typescript
import { AnalyticsHandler } from '@ainative/ai-kit-a2ui-core'

const analyticsHandler = new AnalyticsHandler({
  analyticsService: {
    query: async (params) => {
      return await analyticsClient.query(params)
    },
    export: async (params) => {
      return await analyticsClient.export(params)
    },
    streamStart: async (params) => {
      return await analyticsClient.streamStart(params)
    },
    streamStop: async () => {
      return await analyticsClient.streamStop()
    },
  },
  onMessage: (message) => {
    console.log('Analytics message:', message)
  },
  onError: (error) => {
    console.error('Analytics error:', error)
  },
  enableCache: true,
  cacheTTL: 60, // 60 seconds
})
```

### 3. Create Dashboard Components

#### Analytics Overview

```typescript
const overviewComponent: AnalyticsOverviewComponent = {
  type: 'analyticsOverview',
  id: 'dashboard-overview',
  properties: {
    metrics: [
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
        label: 'Monthly Revenue',
        value: 125000,
        previousValue: 118000,
        change: 5.9,
        changeType: 'increase',
        format: 'currency',
        currency: 'USD',
      },
      {
        id: 'conversion_rate',
        label: 'Conversion Rate',
        value: 3.45,
        previousValue: 3.12,
        change: 10.6,
        changeType: 'increase',
        format: 'percentage',
      },
    ],
    timeRange: {
      start: new Date('2024-01-01'),
      end: new Date('2024-01-31'),
      preset: 'last_30_days',
    },
    refreshInterval: 60,
    layout: 'grid',
    columns: 3,
  },
}
```

#### Line Chart

```typescript
const chartComponent: AnalyticsChartComponent = {
  type: 'analyticsChart',
  id: 'user-growth-chart',
  properties: {
    chartType: 'line',
    dataSource: 'user_activity',
    title: 'User Growth Over Time',
    xAxis: {
      label: 'Date',
      type: 'time',
      format: 'MMM DD',
    },
    yAxis: {
      label: 'Users',
      type: 'linear',
      format: 'number',
    },
    series: [
      {
        id: 'active_users',
        name: 'Active Users',
        data: [
          { x: new Date('2024-01-01'), y: 1000 },
          { x: new Date('2024-01-08'), y: 1200 },
          { x: new Date('2024-01-15'), y: 1350 },
          { x: new Date('2024-01-22'), y: 1500 },
          { x: new Date('2024-01-29'), y: 1650 },
        ],
        color: '#4F46E5',
      },
      {
        id: 'new_users',
        name: 'New Users',
        data: [
          { x: new Date('2024-01-01'), y: 150 },
          { x: new Date('2024-01-08'), y: 180 },
          { x: new Date('2024-01-15'), y: 210 },
          { x: new Date('2024-01-22'), y: 230 },
          { x: new Date('2024-01-29'), y: 250 },
        ],
        color: '#10B981',
      },
    ],
    legend: {
      show: true,
      position: 'bottom',
      align: 'center',
    },
    interactive: true,
    height: 400,
  },
}
```

#### Data Table with Filtering

```typescript
const tableComponent: AnalyticsTableComponent = {
  type: 'analyticsTable',
  id: 'revenue-table',
  properties: {
    dataSource: 'revenue_by_product',
    columns: [
      {
        id: 'product_name',
        label: 'Product',
        type: 'text',
        sortable: true,
        width: 200,
      },
      {
        id: 'units_sold',
        label: 'Units Sold',
        type: 'number',
        sortable: true,
        align: 'right',
      },
      {
        id: 'revenue',
        label: 'Revenue',
        type: 'currency',
        currency: 'USD',
        sortable: true,
        align: 'right',
      },
      {
        id: 'growth',
        label: 'Growth',
        type: 'percentage',
        sortable: true,
        align: 'right',
        colorCode: true,
      },
    ],
    sort: {
      columnId: 'revenue',
      direction: 'desc',
    },
    pagination: {
      enabled: true,
      pageSize: 25,
      currentPage: 1,
    },
    filterable: true,
    exportable: true,
    exportFormats: ['csv', 'xlsx', 'pdf'],
  },
}
```

#### Heatmap

```typescript
const heatmapComponent: AnalyticsHeatmapComponent = {
  type: 'analyticsHeatmap',
  id: 'activity-heatmap',
  properties: {
    dataSource: 'user_activity_by_hour',
    data: [
      { x: 'Mon', y: '00:00', value: 10 },
      { x: 'Mon', y: '06:00', value: 45 },
      { x: 'Mon', y: '12:00', value: 120 },
      { x: 'Mon', y: '18:00', value: 95 },
      // ... more data points
    ],
    xAxisLabel: 'Day of Week',
    yAxisLabel: 'Hour',
    colorScale: {
      min: '#E0F2FE',
      max: '#0284C7',
      steps: 5,
      type: 'sequential',
    },
    showValues: true,
    interactive: true,
  },
}
```

#### Conversion Funnel

```typescript
const funnelComponent: AnalyticsFunnelComponent = {
  type: 'analyticsFunnel',
  id: 'conversion-funnel',
  properties: {
    stages: [
      {
        id: 'stage1',
        label: 'Website Visits',
        value: 10000,
        percentage: 100,
        color: '#4F46E5',
      },
      {
        id: 'stage2',
        label: 'Product Views',
        value: 4500,
        percentage: 45,
        conversionRate: 45,
        dropoff: 5500,
        color: '#7C3AED',
      },
      {
        id: 'stage3',
        label: 'Add to Cart',
        value: 1800,
        percentage: 18,
        conversionRate: 40,
        dropoff: 2700,
        color: '#A855F7',
      },
      {
        id: 'stage4',
        label: 'Checkout',
        value: 900,
        percentage: 9,
        conversionRate: 50,
        dropoff: 900,
        color: '#C026D3',
      },
      {
        id: 'stage5',
        label: 'Purchase',
        value: 450,
        percentage: 4.5,
        conversionRate: 50,
        dropoff: 450,
        color: '#D946EF',
      },
    ],
    orientation: 'vertical',
    showConversionRates: true,
    showDropoff: true,
    interactive: true,
  },
}
```

## Handling Messages

### Query Analytics Data

```typescript
import { AnalyticsQueryMessage } from '@ainative/ai-kit-a2ui-core'

const queryMessage: AnalyticsQueryMessage = {
  type: 'analyticsQuery',
  componentId: 'user-growth-chart',
  queryId: 'query-123',
  timeRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-01-31'),
    preset: 'last_30_days',
  },
  metrics: ['active_users', 'new_users'],
  filters: [
    {
      field: 'country',
      operator: 'in',
      value: ['US', 'CA', 'UK'],
    },
  ],
  groupBy: ['date'],
}

await analyticsHandler.handleQuery(queryMessage)
```

### Apply Filters

```typescript
import { AnalyticsFilterChangeMessage } from '@ainative/ai-kit-a2ui-core'

const filterMessage: AnalyticsFilterChangeMessage = {
  type: 'analyticsFilterChange',
  componentId: 'revenue-table',
  filters: [
    {
      field: 'category',
      operator: 'equals',
      value: 'Electronics',
    },
    {
      field: 'revenue',
      operator: 'greater_than',
      value: 1000,
    },
  ],
}

await analyticsHandler.handleFilterChange(filterMessage)
```

### Export Data

```typescript
import { AnalyticsExportMessage } from '@ainative/ai-kit-a2ui-core'

const exportMessage: AnalyticsExportMessage = {
  type: 'analyticsExport',
  componentId: 'revenue-table',
  format: 'csv',
  filename: 'revenue_report_2024.csv',
  includeHeaders: true,
  filters: [
    {
      field: 'date',
      operator: 'between',
      value: [new Date('2024-01-01'), new Date('2024-12-31')],
    },
  ],
}

await analyticsHandler.handleExport(exportMessage)
```

### Real-Time Streaming

```typescript
// Start streaming
await analyticsHandler.startStreaming('realtime-metrics', {
  metrics: ['active_users', 'current_sessions'],
  interval: 5, // Update every 5 seconds
})

// Subscribe to updates
const unsubscribe = analyticsHandler.subscribeToUpdates(
  'realtime-metrics',
  (data) => {
    console.log('Real-time update:', data)
    // Update UI with new data
  }
)

// Stop streaming when done
await analyticsHandler.stopStreaming('realtime-metrics')
unsubscribe()
```

## Advanced Features

### Drill-Down Analysis

```typescript
import { AnalyticsDrillDownMessage } from '@ainative/ai-kit-a2ui-core'

// User clicks on a chart data point
const drillDownMessage: AnalyticsDrillDownMessage = {
  type: 'analyticsDrillDown',
  componentId: 'revenue-chart',
  dimension: 'product_category',
  value: 'Electronics',
}

await analyticsHandler.handleDrillDown(drillDownMessage)
```

### Time Range Selection

```typescript
import { AnalyticsTimeRangeChangeMessage } from '@ainative/ai-kit-a2ui-core'

const timeRangeMessage: AnalyticsTimeRangeChangeMessage = {
  type: 'analyticsTimeRangeChange',
  componentId: 'dashboard-overview',
  timeRange: {
    start: new Date('2024-Q1'),
    end: new Date('2024-Q2'),
    preset: 'custom',
    timezone: 'America/New_York',
  },
}

await analyticsHandler.handleTimeRangeChange(timeRangeMessage)
```

### Error Handling

```typescript
analyticsHandler.options.onError = (error) => {
  console.error('Analytics Error:', error)

  // Show user-friendly error message
  showToast({
    type: 'error',
    message: 'Failed to load analytics data. Please try again.',
  })
}
```

## Complete Dashboard Example

```typescript
import {
  AnalyticsHandler,
  createAnalyticsClient,
  type AnalyticsOverviewComponent,
  type AnalyticsChartComponent,
  type AnalyticsTableComponent,
  type AnalyticsFunnelComponent,
} from '@ainative/ai-kit-a2ui-core'

// Initialize client and handler
const client = createAnalyticsClient({
  apiUrl: 'https://api.example.com/analytics',
  apiKey: process.env.ANALYTICS_API_KEY,
})

const handler = new AnalyticsHandler({
  analyticsService: {
    query: (params) => client.query(params),
    export: (params) => client.export(params),
    streamStart: (params) => client.streamStart(params),
    streamStop: () => client.streamStop(),
  },
  enableCache: true,
  cacheTTL: 300, // 5 minutes
})

// Create complete dashboard
const dashboard = {
  surfaces: [
    {
      surfaceId: 'analytics-dashboard',
      components: [
        overviewComponent,
        chartComponent,
        tableComponent,
        heatmapComponent,
        funnelComponent,
      ],
    },
  ],
}

// Handle user interactions
async function handleAnalyticsInteraction(message: AnalyticsMessage) {
  switch (message.type) {
    case 'analyticsQuery':
      await handler.handleQuery(message)
      break
    case 'analyticsFilterChange':
      await handler.handleFilterChange(message)
      break
    case 'analyticsTimeRangeChange':
      await handler.handleTimeRangeChange(message)
      break
    case 'analyticsExport':
      await handler.handleExport(message)
      break
    case 'analyticsDrillDown':
      await handler.handleDrillDown(message)
      break
  }
}
```

## Performance Tips

1. **Enable Caching**: Reduce API calls by enabling query caching
2. **Pagination**: Use table pagination for large datasets
3. **Lazy Loading**: Load charts on-demand when visible
4. **Debounce Filters**: Debounce filter changes to avoid excessive queries
5. **Optimize Refreshes**: Use appropriate refresh intervals for real-time data

## Testing

All components include comprehensive test coverage (89 tests passing):

```bash
npm test -- tests/types/analytics-*.test.ts tests/handlers/analytics-handler.test.ts tests/integrations/analytics-client.test.ts
```

## API Reference

For complete API documentation, see:
- `/src/types/analytics-components.ts` - Component type definitions
- `/src/types/analytics-messages.ts` - Message type definitions
- `/src/handlers/analytics-handler.ts` - Handler implementation
- `/src/integrations/analytics-client.ts` - HTTP/WebSocket client

## License

MIT
