/**
 * PerformanceProfiler component - displays performance metrics and charts
 */

import { useMemo, useCallback, memo } from 'react'
import type { PerformanceData, MetricHistory, ConnectionHistory } from '@/shared/types'
import styles from './PerformanceProfiler.module.css'

interface PerformanceProfilerProps {
  data: PerformanceData
  onExport?: (data: PerformanceData) => void
}

interface ChartProps {
  data: MetricHistory[]
  label: string
  unit: string
  height?: number
  showWarning?: (value: number) => boolean
}

interface LatencyStats {
  avg: number
  min: number
  max: number
  p50: number
  p95: number
  p99: number
}

interface RenderStats {
  avg: number
  min: number
  max: number
  byComponent: Map<string, number[]>
}

interface MemoryStats {
  current: number
  peak: number
  avg: number
  trend: 'increasing' | 'decreasing' | 'stable'
}

interface ConnectionStats {
  current: 'connected' | 'disconnected' | 'reconnecting'
  uptime: number
  reconnections: number
  avgDuration: number
}

/**
 * Simple line chart component for visualizing metrics
 */
const MetricChart = memo(({ data, label, unit, height = 100, showWarning }: ChartProps): JSX.Element => {
  const points = useMemo(() => {
    if (data.length === 0) return []

    const maxValue = Math.max(...data.map(d => d.value))
    const minValue = Math.min(...data.map(d => d.value))
    const range = maxValue - minValue || 1

    return data.map((point, index) => {
      const x = (index / (data.length - 1 || 1)) * 100
      const y = height - ((point.value - minValue) / range) * height
      return { x, y, value: point.value }
    })
  }, [data, height])

  if (data.length === 0) {
    return (
      <div className={styles.chartEmpty} data-testid={`${label}-chart`}>
        No data available
      </div>
    )
  }

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ')

  return (
    <svg
      className={styles.chart}
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
      data-testid={`${label}-chart`}
      aria-label={`${label} chart`}
      role="img"
    >
      <path
        d={pathD}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
      {points.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r="2"
          fill={showWarning?.(point.value) ? 'var(--color-warning)' : 'var(--color-primary)'}
          vectorEffect="non-scaling-stroke"
        >
          <title>{`${point.value.toFixed(2)} ${unit}`}</title>
        </circle>
      ))}
    </svg>
  )
})

MetricChart.displayName = 'MetricChart'

/**
 * Calculate latency statistics
 */
function calculateLatencyStats(data: MetricHistory[]): LatencyStats {
  if (data.length === 0) {
    return { avg: 0, min: 0, max: 0, p50: 0, p95: 0, p99: 0 }
  }

  const values = data.map(d => d.value).sort((a, b) => a - b)
  const sum = values.reduce((acc, val) => acc + val, 0)

  const percentile = (p: number): number => {
    const index = Math.ceil(values.length * p) - 1
    return values[Math.max(0, index)] ?? 0
  }

  return {
    avg: sum / values.length,
    min: values[0] ?? 0,
    max: values[values.length - 1] ?? 0,
    p50: percentile(0.5),
    p95: percentile(0.95),
    p99: percentile(0.99)
  }
}

/**
 * Calculate render time statistics
 */
function calculateRenderStats(data: MetricHistory[]): RenderStats {
  if (data.length === 0) {
    return { avg: 0, min: 0, max: 0, byComponent: new Map() }
  }

  const values = data.map(d => d.value)
  const sum = values.reduce((acc, val) => acc + val, 0)

  const byComponent = new Map<string, number[]>()
  for (const metric of data) {
    const component = (metric.context?.component as string) ?? 'Unknown'
    if (!byComponent.has(component)) {
      byComponent.set(component, [])
    }
    byComponent.get(component)!.push(metric.value)
  }

  return {
    avg: sum / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    byComponent
  }
}

/**
 * Calculate memory statistics
 */
function calculateMemoryStats(data: MetricHistory[]): MemoryStats {
  if (data.length === 0) {
    return { current: 0, peak: 0, avg: 0, trend: 'stable' }
  }

  const values = data.map(d => d.value)
  const sum = values.reduce((acc, val) => acc + val, 0)
  const current = values[values.length - 1] ?? 0
  const previous = values[values.length - 2] ?? current

  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
  if (current > previous * 1.1) trend = 'increasing'
  else if (current < previous * 0.9) trend = 'decreasing'

  return {
    current,
    peak: Math.max(...values),
    avg: sum / values.length,
    trend
  }
}

/**
 * Calculate connection statistics
 */
function calculateConnectionStats(data: ConnectionHistory[]): ConnectionStats {
  if (data.length === 0) {
    return { current: 'disconnected', uptime: 0, reconnections: 0, avgDuration: 0 }
  }

  const current = data[data.length - 1]?.status ?? 'disconnected'
  const reconnections = data.filter(d => d.status === 'reconnecting').length

  // Calculate uptime percentage
  let totalTime = 0
  let connectedTime = 0

  for (let i = 0; i < data.length; i++) {
    const event = data[i]!
    const duration = event.duration ?? 0

    if (duration > 0) {
      totalTime += duration
      if (event.status === 'connected') {
        connectedTime += duration
      }
    }
  }

  const uptime = totalTime > 0 ? (connectedTime / totalTime) * 100 : 0

  // Calculate average connection duration
  const connectedEvents = data.filter(d => d.status === 'connected' && d.duration)
  const avgDuration = connectedEvents.length > 0
    ? connectedEvents.reduce((sum, e) => sum + (e.duration ?? 0), 0) / connectedEvents.length
    : 0

  return { current, uptime, reconnections, avgDuration }
}

/**
 * Format bytes to MB
 */
function formatBytes(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(2)
}

export const PerformanceProfiler = memo(({ data, onExport }: PerformanceProfilerProps): JSX.Element => {
  const latencyStats = useMemo(() => calculateLatencyStats(data.messageLatency), [data.messageLatency])
  const renderStats = useMemo(() => calculateRenderStats(data.renderTime), [data.renderTime])
  const memoryStats = useMemo(() => calculateMemoryStats(data.memoryUsage), [data.memoryUsage])
  const connectionStats = useMemo(() => calculateConnectionStats(data.wsConnection), [data.wsConnection])

  const hasData = data.messageLatency.length > 0 ||
    data.renderTime.length > 0 ||
    data.memoryUsage.length > 0 ||
    data.wsConnection.length > 0

  const handleExport = useCallback(() => {
    if (onExport) {
      onExport(data)
    } else {
      const exportData = JSON.stringify({
        messageLatency: data.messageLatency,
        renderTime: data.renderTime,
        memoryUsage: data.memoryUsage,
        wsConnection: data.wsConnection,
        timestamp: Date.now()
      }, null, 2)

      const blob = new Blob([exportData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `performance-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }, [data, onExport])

  if (!hasData) {
    return (
      <div className={styles.empty} role="main">
        <h2>Performance Profiler</h2>
        <p>No data available</p>
        <p className={styles.hint}>
          Performance metrics will appear here as your application runs
        </p>
      </div>
    )
  }

  return (
    <div className={styles.container} role="main">
      <div className={styles.header}>
        <h2>Performance Profiler</h2>
        <button
          onClick={handleExport}
          className={styles.exportButton}
          aria-label="Export performance data"
        >
          Export Data
        </button>
      </div>

      <div className={styles.grid}>
        {/* Message Latency */}
        <div className={styles.card}>
          <h3>Message Latency</h3>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.label}>Avg</span>
              <span className={styles.value}>{latencyStats.avg.toFixed(2)} ms</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.label}>Min</span>
              <span className={styles.value}>{latencyStats.min.toFixed(2)} ms</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.label}>Max</span>
              <span className={styles.value}>{latencyStats.max.toFixed(2)} ms</span>
            </div>
          </div>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.label}>P50</span>
              <span className={styles.value}>{latencyStats.p50.toFixed(2)} ms</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.label}>P95</span>
              <span className={styles.value}>{latencyStats.p95.toFixed(2)} ms</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.label}>P99</span>
              <span className={styles.value}>{latencyStats.p99.toFixed(2)} ms</span>
            </div>
          </div>
          <MetricChart
            data={data.messageLatency}
            label="latency"
            unit="ms"
            showWarning={(value) => value > 1000}
          />
        </div>

        {/* Render Time */}
        <div className={styles.card}>
          <h3>Render Time</h3>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.label}>Avg</span>
              <span className={styles.value}>{renderStats.avg.toFixed(2)} ms</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.label}>Min</span>
              <span className={styles.value}>{renderStats.min.toFixed(2)} ms</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.label}>Max</span>
              <span className={styles.value}>{renderStats.max.toFixed(2)} ms</span>
            </div>
          </div>
          <div className={styles.components}>
            {Array.from(renderStats.byComponent.entries()).map(([component, times]) => {
              const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length
              const isSlow = avgTime > 16
              return (
                <div
                  key={component}
                  className={styles.component}
                  data-warning={isSlow}
                >
                  <span className={styles.componentName}>{component}</span>
                  <span className={styles.componentTime}>
                    {avgTime.toFixed(2)} ms
                  </span>
                  {isSlow && <span className={styles.warning}>⚠</span>}
                </div>
              )
            })}
          </div>
          <MetricChart
            data={data.renderTime}
            label="render"
            unit="ms"
            showWarning={(value) => value > 16}
          />
        </div>

        {/* Memory Usage */}
        <div className={styles.card}>
          <h3>Memory Usage</h3>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.label}>Current</span>
              <span className={styles.value}>{formatBytes(memoryStats.current)} MB</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.label}>Peak</span>
              <span className={styles.value}>{formatBytes(memoryStats.peak)} MB</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.label}>Avg</span>
              <span className={styles.value}>{formatBytes(memoryStats.avg)} MB</span>
            </div>
          </div>
          <div className={styles.trendContainer} role="status">
            <span className={styles.trendLabel}>Trend:</span>
            <span
              className={`${styles.trend} ${styles[memoryStats.trend]}`}
              data-testid="memory-trend"
              data-trend={memoryStats.trend}
            >
              {memoryStats.trend}
            </span>
          </div>
          {memoryStats.current > 100 * 1024 * 1024 && (
            <div className={styles.warning} role="alert">
              High memory usage detected
            </div>
          )}
          <MetricChart
            data={data.memoryUsage.map(m => ({ ...m, value: m.value / (1024 * 1024) }))}
            label="memory"
            unit="MB"
            showWarning={(value) => value > 100}
          />
        </div>

        {/* Connection Health */}
        <div className={styles.card}>
          <h3>Connection Health</h3>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.label}>Status</span>
              <span
                className={`${styles.status} ${styles[connectionStats.current]}`}
                data-testid="connection-status"
              >
                {connectionStats.current}
              </span>
            </div>
            <div className={styles.stat}>
              <span className={styles.label}>Uptime</span>
              <span className={styles.value}>{connectionStats.uptime.toFixed(0)}%</span>
            </div>
          </div>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.label}>Reconnection Attempts</span>
              <span className={styles.value}>{connectionStats.reconnections}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.label}>Avg Duration</span>
              <span className={styles.value}>
                {(connectionStats.avgDuration / 1000).toFixed(1)}s
              </span>
            </div>
          </div>
          <div
            className={styles.timeline}
            data-testid="connection-timeline"
            aria-label="Connection timeline"
          >
            {data.wsConnection.map((event, index) => (
              <div
                key={index}
                className={`${styles.timelineEvent} ${styles[event.status]}`}
                title={`${event.status} at ${new Date(event.timestamp).toLocaleTimeString()}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
})

PerformanceProfiler.displayName = 'PerformanceProfiler'
