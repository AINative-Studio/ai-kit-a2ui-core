/**
 * Tests for NetworkInspector component
 * Following TDD approach - tests written before implementation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { NetworkInspector } from '@/panel/components/NetworkInspector'
import type { NetworkData } from '@/shared/types'

describe('NetworkInspector', () => {
  const mockNetworkData: NetworkData = {
    connectionStatus: 'connected',
    messageQueue: [
      {
        id: 'queue_1',
        timestamp: Date.now() - 1000,
        message: { type: 'ping' },
        retries: 0
      },
      {
        id: 'queue_2',
        timestamp: Date.now() - 500,
        message: { type: 'updateComponents' },
        retries: 2
      }
    ],
    bandwidth: {
      sent: 15360,
      received: 8192,
      history: [
        {
          timestamp: Date.now() - 60000,
          sent: 5120,
          received: 2048
        },
        {
          timestamp: Date.now() - 30000,
          sent: 10240,
          received: 4096
        },
        {
          timestamp: Date.now(),
          sent: 15360,
          received: 8192
        }
      ]
    },
    reconnectAttempts: 0,
    lastConnected: Date.now() - 60000,
    lastDisconnected: undefined
  }

  const mockDisconnectedData: NetworkData = {
    connectionStatus: 'disconnected',
    messageQueue: [],
    bandwidth: {
      sent: 0,
      received: 0,
      history: []
    },
    reconnectAttempts: 3,
    lastConnected: Date.now() - 120000,
    lastDisconnected: Date.now() - 5000
  }

  const mockReconnectingData: NetworkData = {
    connectionStatus: 'reconnecting',
    messageQueue: [],
    bandwidth: {
      sent: 0,
      received: 0,
      history: []
    },
    reconnectAttempts: 1,
    lastConnected: Date.now() - 30000,
    lastDisconnected: Date.now() - 5000
  }

  describe('rendering', () => {
    it('should render connection status badge', () => {
      render(<NetworkInspector networkData={mockNetworkData} />)

      expect(screen.getByTestId('connection-status')).toHaveTextContent(/connected/i)
    })

    it('should display connected status with green indicator', () => {
      render(<NetworkInspector networkData={mockNetworkData} />)

      const statusBadge = screen.getByTestId('connection-status')
      expect(statusBadge.className).toContain('connected')
    })

    it('should display disconnected status with red indicator', () => {
      render(<NetworkInspector networkData={mockDisconnectedData} />)

      const statusBadge = screen.getByTestId('connection-status')
      expect(statusBadge.className).toContain('disconnected')
    })

    it('should display reconnecting status with yellow indicator', () => {
      render(<NetworkInspector networkData={mockReconnectingData} />)

      const statusBadge = screen.getByTestId('connection-status')
      expect(statusBadge.className).toContain('reconnecting')
    })

    it('should show message queue count', () => {
      render(<NetworkInspector networkData={mockNetworkData} />)

      expect(screen.getByText(/queued messages/i)).toBeInTheDocument()
      const metrics = screen.getByText(/queued messages/i).parentElement
      expect(metrics).toHaveTextContent('2')
    })

    it('should display bandwidth statistics', () => {
      render(<NetworkInspector networkData={mockNetworkData} />)

      expect(screen.getByText(/15.0 KB/i)).toBeInTheDocument() // sent
      expect(screen.getByText(/8.0 KB/i)).toBeInTheDocument() // received
    })

    it('should show reconnection attempts when disconnected', () => {
      render(<NetworkInspector networkData={mockDisconnectedData} />)

      expect(screen.getByText(/reconnect attempts/i)).toBeInTheDocument()
      const metric = screen.getByText(/reconnect attempts/i).parentElement
      expect(metric).toHaveTextContent('3')
    })
  })

  describe('connection timeline', () => {
    it('should display last connected time', () => {
      render(<NetworkInspector networkData={mockNetworkData} />)

      expect(screen.getByText(/last connected/i)).toBeInTheDocument()
      expect(screen.getByText(/1m ago/i)).toBeInTheDocument()
    })

    it('should display last disconnected time when available', () => {
      render(<NetworkInspector networkData={mockDisconnectedData} />)

      expect(screen.getByText(/last disconnected/i)).toBeInTheDocument()
    })

    it('should show connection duration for active connections', () => {
      render(<NetworkInspector networkData={mockNetworkData} />)

      expect(screen.getByText(/uptime/i)).toBeInTheDocument()
      const uptimeMetric = screen.getByText(/uptime/i).parentElement
      expect(uptimeMetric).toHaveTextContent('1m')
    })

    it('should display reconnection attempts timeline', () => {
      render(<NetworkInspector networkData={mockReconnectingData} />)

      expect(screen.getByText(/reconnection attempts/i)).toBeInTheDocument()
      const timeline = screen.getByText(/reconnection attempts/i).parentElement
      expect(timeline).toHaveTextContent('Attempt 1')
    })
  })

  describe('message queue', () => {
    it('should list queued messages', () => {
      render(<NetworkInspector networkData={mockNetworkData} />)

      expect(screen.getByText(/ping/i)).toBeInTheDocument()
      expect(screen.getByText(/updateComponents/i)).toBeInTheDocument()
    })

    it('should show retry count for each message', () => {
      render(<NetworkInspector networkData={mockNetworkData} />)

      expect(screen.getByText(/0 retries/i)).toBeInTheDocument()
      expect(screen.getByText(/2 retries/i)).toBeInTheDocument()
    })

    it('should display empty state when queue is empty', () => {
      render(<NetworkInspector networkData={mockDisconnectedData} />)

      expect(screen.getByText(/no messages in queue/i)).toBeInTheDocument()
    })

    it('should highlight messages with high retry counts', () => {
      render(<NetworkInspector networkData={mockNetworkData} />)

      const messages = screen.getAllByRole('listitem')
      const highRetryMessage = messages.find(msg =>
        within(msg).queryByText(/2 retries/i)
      )

      expect(highRetryMessage?.className).toContain('highRetries')
    })
  })

  describe('bandwidth charts', () => {
    it('should render bandwidth chart', () => {
      render(<NetworkInspector networkData={mockNetworkData} />)

      expect(screen.getByTestId('bandwidth-chart')).toBeInTheDocument()
    })

    it('should display sent and received data series', () => {
      render(<NetworkInspector networkData={mockNetworkData} />)

      const chart = screen.getByTestId('bandwidth-chart')
      const sentSeries = within(chart).getByTestId('series-sent')
      const receivedSeries = within(chart).getByTestId('series-received')

      expect(sentSeries).toBeInTheDocument()
      expect(receivedSeries).toBeInTheDocument()
    })

    it('should show data points for bandwidth history', () => {
      render(<NetworkInspector networkData={mockNetworkData} />)

      const chart = screen.getByTestId('bandwidth-chart')
      const dataPoints = within(chart).getAllByTestId(/data-point-/)

      expect(dataPoints.length).toBeGreaterThan(0)
    })

    it('should format bandwidth values in human-readable format', () => {
      render(<NetworkInspector networkData={mockNetworkData} />)

      // Should display bandwidth in KB format
      expect(screen.getByText('15.0 KB')).toBeInTheDocument()
      expect(screen.getByText('8.0 KB')).toBeInTheDocument()
    })
  })

  describe('connection health score', () => {
    it('should calculate and display health score', () => {
      render(<NetworkInspector networkData={mockNetworkData} />)

      expect(screen.getByText(/health score/i)).toBeInTheDocument()
      const healthScore = screen.getByTestId('health-score')
      const score = parseInt(healthScore.textContent || '0')
      expect(score).toBeGreaterThanOrEqual(90) // Should be high for connected status
    })

    it('should show poor health for disconnected connections', () => {
      render(<NetworkInspector networkData={mockDisconnectedData} />)

      const healthScore = screen.getByTestId('health-score')
      const score = parseInt(healthScore.textContent || '0')

      expect(score).toBeLessThan(50)
    })

    it('should show moderate health during reconnection', () => {
      render(<NetworkInspector networkData={mockReconnectingData} />)

      const healthScore = screen.getByTestId('health-score')
      const score = parseInt(healthScore.textContent || '0')

      expect(score).toBeGreaterThanOrEqual(30)
      expect(score).toBeLessThan(80)
    })

    it('should display health indicator color', () => {
      render(<NetworkInspector networkData={mockNetworkData} />)

      const healthIndicator = screen.getByTestId('health-indicator')
      expect(healthIndicator.className).toContain('healthy')
    })
  })

  describe('interactivity', () => {
    it('should expand message details on click', () => {
      render(<NetworkInspector networkData={mockNetworkData} />)

      const firstMessage = screen.getByText(/ping/i)
      fireEvent.click(firstMessage)

      expect(screen.getByRole('code')).toBeInTheDocument()
    })

    it('should toggle chart view modes', () => {
      render(<NetworkInspector networkData={mockNetworkData} />)

      const toggleButton = screen.getByRole('button', { name: /toggle chart/i })
      fireEvent.click(toggleButton)

      expect(screen.getByTestId('bandwidth-chart')).toHaveAttribute('data-view', 'combined')
    })

    it('should refresh connection status on demand', () => {
      const onRefresh = vi.fn()
      render(<NetworkInspector networkData={mockNetworkData} onRefresh={onRefresh} />)

      const refreshButton = screen.getByRole('button', { name: /refresh/i })
      fireEvent.click(refreshButton)

      expect(onRefresh).toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<NetworkInspector networkData={mockNetworkData} />)

      expect(screen.getByLabelText(/connection status/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/message queue/i)).toBeInTheDocument()
    })

    it('should announce status changes', () => {
      render(<NetworkInspector networkData={mockNetworkData} />)

      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('should be keyboard navigable', () => {
      render(<NetworkInspector networkData={mockNetworkData} />)

      const firstMessage = screen.getByText(/ping/i)
      firstMessage.focus()

      fireEvent.keyDown(firstMessage, { key: 'Enter' })
      expect(screen.getByRole('code')).toBeInTheDocument()
    })

    it('should have descriptive chart labels', () => {
      render(<NetworkInspector networkData={mockNetworkData} />)

      const chart = screen.getByTestId('bandwidth-chart')
      expect(chart).toHaveAttribute('aria-label', 'Bandwidth usage chart')
    })
  })

  describe('edge cases', () => {
    it('should handle missing lastConnected timestamp', () => {
      const dataWithoutTimestamp: NetworkData = {
        ...mockNetworkData,
        lastConnected: undefined
      }

      render(<NetworkInspector networkData={dataWithoutTimestamp} />)

      expect(screen.getByText(/never connected/i)).toBeInTheDocument()
    })

    it('should handle empty bandwidth history', () => {
      const dataWithoutHistory: NetworkData = {
        ...mockNetworkData,
        bandwidth: {
          sent: 0,
          received: 0,
          history: []
        }
      }

      render(<NetworkInspector networkData={dataWithoutHistory} />)

      expect(screen.getByText(/no data available/i)).toBeInTheDocument()
    })

    it('should format large bandwidth values correctly', () => {
      const dataWithLargeBandwidth: NetworkData = {
        ...mockNetworkData,
        bandwidth: {
          sent: 15360000,
          received: 8192000,
          history: []
        }
      }

      render(<NetworkInspector networkData={dataWithLargeBandwidth} />)

      // Should display bandwidth in MB format
      expect(screen.getByText('14.6 MB')).toBeInTheDocument()
      expect(screen.getByText('7.8 MB')).toBeInTheDocument()
    })

    it('should handle very high reconnect attempts', () => {
      const dataWithManyRetries: NetworkData = {
        ...mockDisconnectedData,
        reconnectAttempts: 99
      }

      render(<NetworkInspector networkData={dataWithManyRetries} />)

      const metric = screen.getByText(/reconnect attempts/i).parentElement
      expect(metric).toHaveTextContent('99')
      expect(screen.getByTestId('reconnect-warning')).toBeInTheDocument()
    })
  })

  describe('performance', () => {
    it('should efficiently update on bandwidth changes', () => {
      const { rerender } = render(<NetworkInspector networkData={mockNetworkData} />)

      const updatedData = {
        ...mockNetworkData,
        bandwidth: {
          ...mockNetworkData.bandwidth,
          sent: 20480
        }
      }

      rerender(<NetworkInspector networkData={updatedData} />)

      expect(screen.getByText(/20.0 KB/i)).toBeInTheDocument()
    })

    it('should memoize chart rendering', () => {
      const { rerender } = render(<NetworkInspector networkData={mockNetworkData} />)

      // Chart should not change if data hasn't changed
      const initialHTML = screen.getByTestId('bandwidth-chart').innerHTML

      rerender(<NetworkInspector networkData={mockNetworkData} />)

      expect(screen.getByTestId('bandwidth-chart').innerHTML).toBe(initialHTML)
    })
  })
})
