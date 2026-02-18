/**
 * Tests for PerformanceTracker utility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PerformanceTracker } from '@/shared/utils/PerformanceTracker'

describe('PerformanceTracker', () => {
  let tracker: PerformanceTracker

  beforeEach(() => {
    tracker = new PerformanceTracker()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('trackMessageLatency', () => {
    it('should track message round-trip time', () => {
      const messageId = 'msg_123'

      tracker.startMessageTiming(messageId)
      vi.advanceTimersByTime(100)
      tracker.endMessageTiming(messageId)

      const metrics = tracker.getMessageLatencyMetrics()
      expect(metrics.length).toBeGreaterThan(0)
      expect(metrics[metrics.length - 1]?.value).toBeCloseTo(100, -1)
    })

    it('should handle missing start timing', () => {
      expect(() => {
        tracker.endMessageTiming('non_existent')
      }).not.toThrow()
    })

    it('should track multiple messages independently', () => {
      tracker.startMessageTiming('msg_1')
      vi.advanceTimersByTime(50)
      tracker.startMessageTiming('msg_2')
      vi.advanceTimersByTime(50)

      tracker.endMessageTiming('msg_1')
      tracker.endMessageTiming('msg_2')

      const metrics = tracker.getMessageLatencyMetrics()
      expect(metrics).toHaveLength(2)
      expect(metrics[0]?.value).toBeCloseTo(100, -1)
      expect(metrics[1]?.value).toBeCloseTo(50, -1)
    })
  })

  describe('trackRenderTime', () => {
    it('should track component render duration', () => {
      tracker.trackRenderTime('Component', 15.5)

      const metrics = tracker.getRenderTimeMetrics()
      expect(metrics).toHaveLength(1)
      expect(metrics[0]?.value).toBe(15.5)
      expect(metrics[0]?.context?.component).toBe('Component')
    })

    it('should accumulate render times', () => {
      tracker.trackRenderTime('Component', 10)
      tracker.trackRenderTime('Component', 20)

      const metrics = tracker.getRenderTimeMetrics()
      expect(metrics).toHaveLength(2)
    })
  })

  describe('trackMemoryUsage', () => {
    it('should track memory usage in bytes', () => {
      const memoryBytes = 1024 * 1024 * 50 // 50 MB

      tracker.trackMemoryUsage(memoryBytes)

      const metrics = tracker.getMemoryUsageMetrics()
      expect(metrics).toHaveLength(1)
      expect(metrics[0]?.value).toBe(memoryBytes)
    })

    it('should track memory over time', () => {
      tracker.trackMemoryUsage(1000)
      vi.advanceTimersByTime(1000)
      tracker.trackMemoryUsage(2000)

      const metrics = tracker.getMemoryUsageMetrics()
      expect(metrics).toHaveLength(2)
      expect(metrics[1]?.timestamp).toBeGreaterThan(metrics[0]!.timestamp)
    })
  })

  describe('trackConnectionEvent', () => {
    it('should track connection state changes', () => {
      tracker.trackConnectionEvent('connected')

      const history = tracker.getConnectionHistory()
      expect(history).toHaveLength(1)
      expect(history[0]?.status).toBe('connected')
    })

    it('should calculate connection duration', () => {
      tracker.trackConnectionEvent('connected')
      vi.advanceTimersByTime(5000)
      tracker.trackConnectionEvent('disconnected')

      const history = tracker.getConnectionHistory()
      expect(history[1]?.duration).toBeCloseTo(5000, -1)
    })

    it('should track reconnection attempts', () => {
      tracker.trackConnectionEvent('disconnected')
      tracker.trackConnectionEvent('reconnecting')
      tracker.trackConnectionEvent('reconnecting')
      tracker.trackConnectionEvent('connected')

      const history = tracker.getConnectionHistory()
      const reconnects = history.filter(h => h.status === 'reconnecting')
      expect(reconnects).toHaveLength(2)
    })
  })

  describe('getStatistics', () => {
    it('should calculate average message latency', () => {
      tracker.trackMessageLatency(100)
      tracker.trackMessageLatency(200)
      tracker.trackMessageLatency(300)

      const stats = tracker.getStatistics()
      expect(stats.messageLatency.avg).toBe(200)
    })

    it('should calculate min and max latency', () => {
      tracker.trackMessageLatency(100)
      tracker.trackMessageLatency(200)
      tracker.trackMessageLatency(50)

      const stats = tracker.getStatistics()
      expect(stats.messageLatency.min).toBe(50)
      expect(stats.messageLatency.max).toBe(200)
    })

    it('should calculate percentiles', () => {
      for (let i = 1; i <= 100; i++) {
        tracker.trackMessageLatency(i)
      }

      const stats = tracker.getStatistics()
      expect(stats.messageLatency.p50).toBeCloseTo(50, 0)
      expect(stats.messageLatency.p95).toBeCloseTo(95, 0)
      expect(stats.messageLatency.p99).toBeCloseTo(99, 0)
    })

    it('should track render statistics', () => {
      tracker.trackRenderTime('Component', 10)
      tracker.trackRenderTime('Component', 20)
      tracker.trackRenderTime('Component', 30)

      const stats = tracker.getStatistics()
      expect(stats.renderTime.avg).toBe(20)
    })

    it('should track memory growth', () => {
      tracker.trackMemoryUsage(1000)
      vi.advanceTimersByTime(1000)
      tracker.trackMemoryUsage(2000)

      const stats = tracker.getStatistics()
      expect(stats.memory.current).toBe(2000)
      expect(stats.memory.peak).toBe(2000)
    })
  })

  describe('clearMetrics', () => {
    it('should clear all tracked metrics', () => {
      tracker.trackMessageLatency(100)
      tracker.trackRenderTime('Component', 20)
      tracker.trackMemoryUsage(1000)

      tracker.clearMetrics()

      expect(tracker.getMessageLatencyMetrics()).toHaveLength(0)
      expect(tracker.getRenderTimeMetrics()).toHaveLength(0)
      expect(tracker.getMemoryUsageMetrics()).toHaveLength(0)
    })
  })

  describe('setMaxHistorySize', () => {
    it('should limit history to max size', () => {
      tracker.setMaxHistorySize(3)

      tracker.trackMessageLatency(100)
      tracker.trackMessageLatency(200)
      tracker.trackMessageLatency(300)
      tracker.trackMessageLatency(400)

      const metrics = tracker.getMessageLatencyMetrics()
      expect(metrics).toHaveLength(3)
    })

    it('should keep most recent metrics', () => {
      tracker.setMaxHistorySize(2)

      tracker.trackMessageLatency(100)
      tracker.trackMessageLatency(200)
      tracker.trackMessageLatency(300)

      const metrics = tracker.getMessageLatencyMetrics()
      expect(metrics[0]?.value).toBe(200)
      expect(metrics[1]?.value).toBe(300)
    })
  })
})
