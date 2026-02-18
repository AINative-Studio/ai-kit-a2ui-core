/**
 * PerformanceTracker utility for tracking performance metrics
 */

import type { MetricHistory, ConnectionHistory } from '../types/index.js'

export interface PerformanceStatistics {
  messageLatency: {
    avg: number
    min: number
    max: number
    p50: number
    p95: number
    p99: number
  }
  renderTime: {
    avg: number
    min: number
    max: number
  }
  memory: {
    current: number
    peak: number
    avg: number
  }
}

export class PerformanceTracker {
  private messageLatency: MetricHistory[] = []
  private renderTime: MetricHistory[] = []
  private memoryUsage: MetricHistory[] = []
  private connectionHistory: ConnectionHistory[] = []
  private messageTimings = new Map<string, number>()
  private maxHistorySize = 1000

  /**
   * Start timing a message
   */
  startMessageTiming(messageId: string): void {
    this.messageTimings.set(messageId, performance.now())
  }

  /**
   * End timing a message and record latency
   */
  endMessageTiming(messageId: string): void {
    const startTime = this.messageTimings.get(messageId)
    if (startTime === undefined) return

    const latency = performance.now() - startTime
    this.trackMessageLatency(latency)
    this.messageTimings.delete(messageId)
  }

  /**
   * Track message latency manually
   */
  trackMessageLatency(latency: number): void {
    const metric: MetricHistory = {
      timestamp: Date.now(),
      value: latency
    }

    this.messageLatency.push(metric)
    this.enforceHistoryLimit(this.messageLatency)
  }

  /**
   * Track component render time
   */
  trackRenderTime(component: string, duration: number): void {
    const metric: MetricHistory = {
      timestamp: Date.now(),
      value: duration,
      context: { component }
    }

    this.renderTime.push(metric)
    this.enforceHistoryLimit(this.renderTime)
  }

  /**
   * Track memory usage in bytes
   */
  trackMemoryUsage(bytes: number): void {
    const metric: MetricHistory = {
      timestamp: Date.now(),
      value: bytes
    }

    this.memoryUsage.push(metric)
    this.enforceHistoryLimit(this.memoryUsage)
  }

  /**
   * Track connection state change
   */
  trackConnectionEvent(status: 'connected' | 'disconnected' | 'reconnecting'): void {
    const lastEvent = this.connectionHistory[this.connectionHistory.length - 1]
    const timestamp = Date.now()
    const duration = lastEvent ? timestamp - lastEvent.timestamp : undefined

    const event: ConnectionHistory = {
      timestamp,
      status,
      duration
    }

    this.connectionHistory.push(event)
    this.enforceHistoryLimit(this.connectionHistory)
  }

  /**
   * Get message latency metrics
   */
  getMessageLatencyMetrics(): MetricHistory[] {
    return [...this.messageLatency]
  }

  /**
   * Get render time metrics
   */
  getRenderTimeMetrics(): MetricHistory[] {
    return [...this.renderTime]
  }

  /**
   * Get memory usage metrics
   */
  getMemoryUsageMetrics(): MetricHistory[] {
    return [...this.memoryUsage]
  }

  /**
   * Get connection history
   */
  getConnectionHistory(): ConnectionHistory[] {
    return [...this.connectionHistory]
  }

  /**
   * Get comprehensive statistics
   */
  getStatistics(): PerformanceStatistics {
    return {
      messageLatency: this.calculateStats(this.messageLatency),
      renderTime: this.calculateRenderStats(this.renderTime),
      memory: this.calculateMemoryStats(this.memoryUsage)
    }
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.messageLatency = []
    this.renderTime = []
    this.memoryUsage = []
    this.connectionHistory = []
    this.messageTimings.clear()
  }

  /**
   * Set maximum history size
   */
  setMaxHistorySize(size: number): void {
    this.maxHistorySize = size
    this.enforceHistoryLimit(this.messageLatency)
    this.enforceHistoryLimit(this.renderTime)
    this.enforceHistoryLimit(this.memoryUsage)
    this.enforceHistoryLimit(this.connectionHistory)
  }

  /**
   * Calculate statistics for metrics
   */
  private calculateStats(metrics: MetricHistory[]): {
    avg: number
    min: number
    max: number
    p50: number
    p95: number
    p99: number
  } {
    if (metrics.length === 0) {
      return { avg: 0, min: 0, max: 0, p50: 0, p95: 0, p99: 0 }
    }

    const values = metrics.map(m => m.value).sort((a, b) => a - b)
    const sum = values.reduce((acc, val) => acc + val, 0)

    return {
      avg: sum / values.length,
      min: values[0] ?? 0,
      max: values[values.length - 1] ?? 0,
      p50: this.percentile(values, 0.5),
      p95: this.percentile(values, 0.95),
      p99: this.percentile(values, 0.99)
    }
  }

  /**
   * Calculate render time statistics
   */
  private calculateRenderStats(metrics: MetricHistory[]): {
    avg: number
    min: number
    max: number
  } {
    if (metrics.length === 0) {
      return { avg: 0, min: 0, max: 0 }
    }

    const values = metrics.map(m => m.value)
    const sum = values.reduce((acc, val) => acc + val, 0)

    return {
      avg: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values)
    }
  }

  /**
   * Calculate memory statistics
   */
  private calculateMemoryStats(metrics: MetricHistory[]): {
    current: number
    peak: number
    avg: number
  } {
    if (metrics.length === 0) {
      return { current: 0, peak: 0, avg: 0 }
    }

    const values = metrics.map(m => m.value)
    const sum = values.reduce((acc, val) => acc + val, 0)

    return {
      current: values[values.length - 1] ?? 0,
      peak: Math.max(...values),
      avg: sum / values.length
    }
  }

  /**
   * Calculate percentile from sorted array
   */
  private percentile(sortedValues: number[], p: number): number {
    if (sortedValues.length === 0) return 0

    const index = Math.ceil(sortedValues.length * p) - 1
    return sortedValues[Math.max(0, index)] ?? 0
  }

  /**
   * Enforce history size limit
   */
  private enforceHistoryLimit<T>(array: T[]): void {
    if (array.length > this.maxHistorySize) {
      array.splice(0, array.length - this.maxHistorySize)
    }
  }
}
