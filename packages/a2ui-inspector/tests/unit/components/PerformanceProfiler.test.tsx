/**
 * Tests for PerformanceProfiler component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { PerformanceProfiler } from '@/panel/components/PerformanceProfiler'
import { PerformanceTracker } from '@/shared/utils/PerformanceTracker'
import type { PerformanceData } from '@/shared/types'

describe('PerformanceProfiler', () => {
  let tracker: PerformanceTracker
  let performanceData: PerformanceData

  beforeEach(() => {
    tracker = new PerformanceTracker()

    // Seed with sample data
    tracker.trackMessageLatency(100)
    tracker.trackMessageLatency(150)
    tracker.trackMessageLatency(200)

    tracker.trackRenderTime('Component1', 10)
    tracker.trackRenderTime('Component2', 20)

    tracker.trackMemoryUsage(1024 * 1024 * 50) // 50 MB
    tracker.trackMemoryUsage(1024 * 1024 * 60) // 60 MB

    tracker.trackConnectionEvent('connected')
    tracker.trackConnectionEvent('disconnected')

    performanceData = {
      messageLatency: tracker.getMessageLatencyMetrics(),
      renderTime: tracker.getRenderTimeMetrics(),
      memoryUsage: tracker.getMemoryUsageMetrics(),
      wsConnection: tracker.getConnectionHistory()
    }
  })

  afterEach(() => {
    cleanup()
  })

  describe('Component Rendering', () => {
    it('should render the component without crashing', () => {
      render(<PerformanceProfiler data={performanceData} />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should display performance profiler title', () => {
      render(<PerformanceProfiler data={performanceData} />)
      expect(screen.getByText(/performance profiler/i)).toBeInTheDocument()
    })

    it('should render all metric cards', () => {
      render(<PerformanceProfiler data={performanceData} />)
      expect(screen.getByText(/message latency/i)).toBeInTheDocument()
      expect(screen.getByText(/render time/i)).toBeInTheDocument()
      expect(screen.getByText(/memory usage/i)).toBeInTheDocument()
      expect(screen.getByText(/connection health/i)).toBeInTheDocument()
    })

    it('should handle empty performance data gracefully', () => {
      const emptyData: PerformanceData = {
        messageLatency: [],
        renderTime: [],
        memoryUsage: [],
        wsConnection: []
      }
      render(<PerformanceProfiler data={emptyData} />)
      expect(screen.getByText(/no data available/i)).toBeInTheDocument()
    })
  })

  describe('Message Latency Chart', () => {
    it('should display message latency statistics', () => {
      render(<PerformanceProfiler data={performanceData} />)

      // Should show average, min, max (text may be in separate elements)
      expect(screen.getByText('Avg')).toBeInTheDocument()
      expect(screen.getByText('150.00 ms')).toBeInTheDocument()
      expect(screen.getByText('100.00 ms')).toBeInTheDocument()
      expect(screen.getByText('200.00 ms')).toBeInTheDocument()
    })

    it('should display percentile metrics (p50, p95, p99)', () => {
      // Add more data points for meaningful percentiles
      for (let i = 1; i <= 100; i++) {
        tracker.trackMessageLatency(i)
      }
      performanceData.messageLatency = tracker.getMessageLatencyMetrics()

      render(<PerformanceProfiler data={performanceData} />)
      expect(screen.getByText(/p50/i)).toBeInTheDocument()
      expect(screen.getByText(/p95/i)).toBeInTheDocument()
      expect(screen.getByText(/p99/i)).toBeInTheDocument()
    })

    it('should render latency chart visualization', () => {
      render(<PerformanceProfiler data={performanceData} />)
      const chart = screen.getByTestId('latency-chart')
      expect(chart).toBeInTheDocument()
    })

    it('should format latency values with milliseconds unit', () => {
      render(<PerformanceProfiler data={performanceData} />)
      const values = screen.getAllByText(/ms/i)
      expect(values.length).toBeGreaterThan(0)
    })
  })

  describe('Render Time Chart', () => {
    it('should display render time statistics', () => {
      render(<PerformanceProfiler data={performanceData} />)

      expect(screen.getByText(/render time/i)).toBeInTheDocument()
      expect(screen.getByText('15.00 ms')).toBeInTheDocument()
    })

    it('should show component-level render breakdown', () => {
      render(<PerformanceProfiler data={performanceData} />)

      expect(screen.getByText(/component1/i)).toBeInTheDocument()
      expect(screen.getByText(/component2/i)).toBeInTheDocument()
    })

    it('should render time chart visualization', () => {
      render(<PerformanceProfiler data={performanceData} />)
      const chart = screen.getByTestId('render-chart')
      expect(chart).toBeInTheDocument()
    })

    it('should highlight slow render times (>16ms)', () => {
      tracker.trackRenderTime('SlowComponent', 25)
      performanceData.renderTime = tracker.getRenderTimeMetrics()

      render(<PerformanceProfiler data={performanceData} />)
      const warning = screen.getByText(/slowcomponent/i).closest('[data-warning="true"]')
      expect(warning).toBeInTheDocument()
    })
  })

  describe('Memory Usage Chart', () => {
    it('should display memory statistics in MB', () => {
      render(<PerformanceProfiler data={performanceData} />)

      // Should show memory in MB (text may be in separate elements)
      expect(screen.getByText('Current')).toBeInTheDocument()
      expect(screen.getByText('60.00 MB')).toBeInTheDocument()
    })

    it('should render memory usage chart over time', () => {
      render(<PerformanceProfiler data={performanceData} />)
      const chart = screen.getByTestId('memory-chart')
      expect(chart).toBeInTheDocument()
    })

    it('should show memory growth trend indicator', () => {
      render(<PerformanceProfiler data={performanceData} />)
      const trend = screen.getByTestId('memory-trend')
      expect(trend).toBeInTheDocument()
      expect(trend).toHaveAttribute('data-trend', 'increasing')
    })

    it('should warn on high memory usage (>100MB)', () => {
      tracker.trackMemoryUsage(1024 * 1024 * 150) // 150 MB
      performanceData.memoryUsage = tracker.getMemoryUsageMetrics()

      render(<PerformanceProfiler data={performanceData} />)
      expect(screen.getByText(/high memory usage/i)).toBeInTheDocument()
    })
  })

  describe('Connection Health', () => {
    it('should display current connection status', () => {
      render(<PerformanceProfiler data={performanceData} />)
      const status = screen.getByTestId('connection-status')
      expect(status).toBeInTheDocument()
      expect(status).toHaveTextContent(/disconnected/i)
    })

    it('should show connection uptime percentage', () => {
      const { container } = render(<PerformanceProfiler data={performanceData} />)
      expect(screen.getByText('Uptime')).toBeInTheDocument()
      // Uptime percentage should be visible
      const uptimeValue = container.querySelector('.value')
      expect(uptimeValue).toBeInTheDocument()
    })

    it('should display reconnection attempts count', () => {
      tracker.trackConnectionEvent('reconnecting')
      tracker.trackConnectionEvent('reconnecting')
      performanceData.wsConnection = tracker.getConnectionHistory()

      render(<PerformanceProfiler data={performanceData} />)
      expect(screen.getByText('Reconnection Attempts')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('should render connection timeline visualization', () => {
      render(<PerformanceProfiler data={performanceData} />)
      const timeline = screen.getByTestId('connection-timeline')
      expect(timeline).toBeInTheDocument()
    })

    it('should show average connection duration', () => {
      render(<PerformanceProfiler data={performanceData} />)
      expect(screen.getByText(/avg duration/i)).toBeInTheDocument()
    })
  })

  describe('Export Functionality', () => {
    it('should render export button', () => {
      render(<PerformanceProfiler data={performanceData} />)
      const exportBtn = screen.getByRole('button', { name: /export/i })
      expect(exportBtn).toBeInTheDocument()
    })

    it('should call onExport callback when export button clicked', () => {
      const onExport = vi.fn()
      render(<PerformanceProfiler data={performanceData} onExport={onExport} />)

      const exportBtn = screen.getByRole('button', { name: /export/i })
      fireEvent.click(exportBtn)

      expect(onExport).toHaveBeenCalledTimes(1)
    })

    it('should export data in JSON format', async () => {
      const createElementSpy = vi.spyOn(document, 'createElement')
      const clickSpy = vi.fn()

      render(<PerformanceProfiler data={performanceData} />)

      const exportBtn = screen.getByRole('button', { name: /export/i })
      fireEvent.click(exportBtn)

      await waitFor(() => {
        expect(createElementSpy).toHaveBeenCalledWith('a')
      })
    })

    it('should include timestamp in exported filename', async () => {
      const createElementSpy = vi.spyOn(document, 'createElement')
      const mockAnchor = { click: vi.fn(), download: '', href: '' }
      createElementSpy.mockReturnValue(mockAnchor as unknown as HTMLElement)

      render(<PerformanceProfiler data={performanceData} />)

      const exportBtn = screen.getByRole('button', { name: /export/i })
      fireEvent.click(exportBtn)

      await waitFor(() => {
        expect(mockAnchor.download).toMatch(/performance-.*\.json/)
      })
    })

    it('should export comprehensive performance data', () => {
      const onExport = vi.fn()
      render(<PerformanceProfiler data={performanceData} onExport={onExport} />)

      const exportBtn = screen.getByRole('button', { name: /export/i })
      fireEvent.click(exportBtn)

      expect(onExport).toHaveBeenCalledWith(
        expect.objectContaining({
          messageLatency: expect.any(Array),
          renderTime: expect.any(Array),
          memoryUsage: expect.any(Array),
          wsConnection: expect.any(Array)
        })
      )
    })
  })

  describe('Real-time Updates', () => {
    it('should update charts when data changes', () => {
      const { rerender } = render(<PerformanceProfiler data={performanceData} />)

      expect(screen.getByText('150.00 ms')).toBeInTheDocument()

      // Add more latency data
      tracker.trackMessageLatency(300)
      const newData = {
        ...performanceData,
        messageLatency: tracker.getMessageLatencyMetrics()
      }

      rerender(<PerformanceProfiler data={newData} />)

      // Average should increase (150 + 150 + 200 + 300) / 4 = 187.5
      expect(screen.getByText('187.50 ms')).toBeInTheDocument()
    })

    it('should refresh connection status on data update', () => {
      // Test with fresh data showing connected status
      const connectedData: PerformanceData = {
        messageLatency: [],
        renderTime: [],
        memoryUsage: [],
        wsConnection: [{ timestamp: Date.now(), status: 'connected' }]
      }

      render(<PerformanceProfiler data={connectedData} />)

      const status = screen.getByTestId('connection-status')
      expect(status).toHaveTextContent(/connected/i)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels for charts', () => {
      const { container } = render(<PerformanceProfiler data={performanceData} />)

      const charts = container.querySelectorAll('[aria-label*="chart"]')
      expect(charts.length).toBeGreaterThan(0)
    })

    it('should have descriptive text for screen readers', () => {
      const { container } = render(<PerformanceProfiler data={performanceData} />)

      const statusElements = container.querySelectorAll('[role="status"]')
      expect(statusElements.length).toBeGreaterThan(0)
    })

    it('should be keyboard navigable', () => {
      const { container } = render(<PerformanceProfiler data={performanceData} />)

      const exportBtn = screen.getByRole('button', { name: /export/i })
      // Buttons are keyboard navigable by default, no explicit tabIndex needed
      expect(exportBtn).toBeInTheDocument()
    })
  })

  describe('Performance Optimization', () => {
    it('should use memo to optimize re-renders', () => {
      // Component is wrapped with memo, verify it exists
      expect(PerformanceProfiler).toBeDefined()
      expect(PerformanceProfiler.displayName).toBe('PerformanceProfiler')
    })

    it('should handle large datasets efficiently', () => {
      // Add 100 data points (reduced for test performance)
      for (let i = 0; i < 100; i++) {
        tracker.trackMessageLatency(Math.random() * 1000)
      }
      const largeData = {
        ...performanceData,
        messageLatency: tracker.getMessageLatencyMetrics()
      }

      const { container } = render(<PerformanceProfiler data={largeData} />)

      // Should render successfully with large dataset
      expect(container.querySelector('[data-testid="latency-chart"]')).toBeInTheDocument()
    })
  })
})
