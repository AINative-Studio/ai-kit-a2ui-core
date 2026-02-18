/**
 * NetworkInspector component - displays WebSocket connection status and network metrics
 */

import { useState, useMemo } from 'react'
import type { NetworkData, QueuedMessage } from '@/shared/types'
import styles from './NetworkInspector.module.css'

interface NetworkInspectorProps {
  networkData: NetworkData
  onRefresh?: () => void
}

export function NetworkInspector({ networkData, onRefresh }: NetworkInspectorProps): JSX.Element {
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
  const [chartView, setChartView] = useState<'split' | 'combined'>('split')

  // Calculate connection health score (0-100)
  const healthScore = useMemo(() => {
    let score = 100

    // Penalize for disconnection
    if (networkData.connectionStatus === 'disconnected') {
      score -= 50
    } else if (networkData.connectionStatus === 'reconnecting') {
      score -= 30
    }

    // Penalize for reconnection attempts
    score -= Math.min(networkData.reconnectAttempts * 5, 40)

    // Penalize for queued messages
    score -= Math.min(networkData.messageQueue.length * 2, 20)

    return Math.max(0, Math.min(100, score))
  }, [networkData])

  // Get health indicator class
  const healthClass = useMemo(() => {
    if (healthScore >= 80) return 'healthy'
    if (healthScore >= 50) return 'moderate'
    return 'poor'
  }, [healthScore])

  // Format bytes to human-readable format
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Format time ago
  const formatTimeAgo = (timestamp: number | undefined): string => {
    if (!timestamp) return 'never'

    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  // Format uptime
  const formatUptime = (timestamp: number | undefined): string => {
    if (!timestamp) return '0s'

    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
    return `${Math.floor(seconds / 86400)}d`
  }

  // Get selected message
  const selectedMessage = useMemo(
    () => networkData.messageQueue.find(msg => msg.id === selectedMessageId),
    [networkData.messageQueue, selectedMessageId]
  )

  // Handle message click
  const handleMessageClick = (messageId: string): void => {
    setSelectedMessageId(selectedMessageId === messageId ? null : messageId)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, messageId: string): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleMessageClick(messageId)
    }
  }

  // Toggle chart view
  const handleToggleChart = (): void => {
    setChartView(prev => prev === 'split' ? 'combined' : 'split')
  }

  // Determine if message has high retries
  const hasHighRetries = (message: QueuedMessage): boolean => {
    return message.retries >= 2
  }

  return (
    <div className={styles.container}>
      {/* Header with connection status */}
      <div className={styles.header}>
        <div
          className={`${styles.status} ${styles[networkData.connectionStatus]}`}
          data-testid="connection-status"
          aria-label="Connection status"
        >
          <span className={styles.statusIndicator}></span>
          <span className={styles.statusText}>
            {networkData.connectionStatus}
          </span>
        </div>

        <div className={styles.headerActions}>
          <button
            onClick={onRefresh}
            className={styles.button}
            aria-label="Refresh"
          >
            Refresh
          </button>
        </div>

        <div
          role="status"
          aria-live="polite"
          className={styles.liveRegion}
        >
          Connection {networkData.connectionStatus}
        </div>
      </div>

      {/* Metrics grid */}
      <div className={styles.metrics}>
        {/* Health score */}
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Health Score</div>
          <div
            className={`${styles.metricValue} ${styles[healthClass]}`}
            data-testid="health-score"
          >
            {healthScore}
          </div>
          <div
            className={`${styles.healthIndicator} ${styles[healthClass]}`}
            data-testid="health-indicator"
          ></div>
        </div>

        {/* Queue status */}
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Queued Messages</div>
          <div className={styles.metricValue}>
            {networkData.messageQueue.length}
          </div>
        </div>

        {/* Bandwidth sent */}
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Sent</div>
          <div className={styles.metricValue}>
            {formatBytes(networkData.bandwidth.sent)}
          </div>
        </div>

        {/* Bandwidth received */}
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Received</div>
          <div className={styles.metricValue}>
            {formatBytes(networkData.bandwidth.received)}
          </div>
        </div>

        {/* Reconnect attempts */}
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Reconnect Attempts</div>
          <div className={styles.metricValue}>
            {networkData.reconnectAttempts}
            {networkData.reconnectAttempts > 10 && (
              <span
                className={styles.warning}
                data-testid="reconnect-warning"
              >
                !
              </span>
            )}
          </div>
        </div>

        {/* Uptime */}
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Uptime</div>
          <div className={styles.metricValue}>
            {networkData.connectionStatus === 'connected'
              ? formatUptime(networkData.lastConnected)
              : '0s'}
          </div>
        </div>
      </div>

      {/* Connection timeline */}
      <div className={styles.timeline}>
        <h3 className={styles.sectionTitle}>Connection Timeline</h3>
        <div className={styles.timelineEvents}>
          <div className={styles.timelineEvent}>
            <span className={styles.timelineLabel}>Last Connected:</span>
            <span className={styles.timelineValue}>
              {networkData.lastConnected
                ? formatTimeAgo(networkData.lastConnected)
                : 'never connected'}
            </span>
          </div>

          {networkData.lastDisconnected && (
            <div className={styles.timelineEvent}>
              <span className={styles.timelineLabel}>Last Disconnected:</span>
              <span className={styles.timelineValue}>
                {formatTimeAgo(networkData.lastDisconnected)}
              </span>
            </div>
          )}

          {networkData.reconnectAttempts > 0 && (
            <div className={styles.timelineEvent}>
              <span className={styles.timelineLabel}>Reconnection Attempts:</span>
              <span className={styles.timelineValue}>
                Attempt {networkData.reconnectAttempts}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bandwidth chart */}
      <div className={styles.chartSection}>
        <div className={styles.chartHeader}>
          <h3 className={styles.sectionTitle}>Bandwidth Usage</h3>
          <button
            onClick={handleToggleChart}
            className={styles.button}
            aria-label="Toggle chart view"
          >
            Toggle Chart
          </button>
        </div>

        {networkData.bandwidth.history.length > 0 ? (
          <div
            className={styles.chart}
            data-testid="bandwidth-chart"
            data-view={chartView}
            aria-label="Bandwidth usage chart"
          >
            <div className={styles.chartLegend}>
              <span className={styles.legendItem} data-testid="series-sent">
                <span className={`${styles.legendColor} ${styles.sent}`}></span>
                Sent
              </span>
              <span className={styles.legendItem} data-testid="series-received">
                <span className={`${styles.legendColor} ${styles.received}`}></span>
                Received
              </span>
            </div>

            <div className={styles.chartArea}>
              {networkData.bandwidth.history.map((point, index) => (
                <div
                  key={`${point.timestamp}-${index}`}
                  className={styles.dataPoint}
                  data-testid={`data-point-${index}`}
                  style={{
                    left: `${(index / Math.max(1, networkData.bandwidth.history.length - 1)) * 100}%`
                  }}
                >
                  <div
                    className={`${styles.bar} ${styles.sent}`}
                    style={{
                      height: `${(point.sent / Math.max(...networkData.bandwidth.history.map(p => p.sent), 1)) * 100}%`
                    }}
                  ></div>
                  <div
                    className={`${styles.bar} ${styles.received}`}
                    style={{
                      height: `${(point.received / Math.max(...networkData.bandwidth.history.map(p => p.received), 1)) * 100}%`
                    }}
                  ></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.empty}>
            <p>No data available</p>
          </div>
        )}
      </div>

      {/* Message queue */}
      <div className={styles.queueSection}>
        <h3 className={styles.sectionTitle}>Message Queue</h3>

        {networkData.messageQueue.length > 0 ? (
          <ul
            role="list"
            aria-label="Message queue"
            className={styles.queue}
          >
            {networkData.messageQueue.map((message) => (
              <li
                key={message.id}
                role="listitem"
                tabIndex={0}
                className={`${styles.queueItem} ${hasHighRetries(message) ? styles.highRetries : ''}`}
                onClick={() => handleMessageClick(message.id)}
                onKeyDown={(e) => handleKeyDown(e, message.id)}
              >
                <div className={styles.queueItemHeader}>
                  <span className={styles.messageType}>
                    {typeof message.message === 'object' && message.message !== null && 'type' in message.message
                      ? String(message.message.type)
                      : 'unknown'}
                  </span>
                  <span className={styles.retries}>
                    {message.retries} retries
                  </span>
                  <span className={styles.timestamp}>
                    {formatTimeAgo(message.timestamp)}
                  </span>
                </div>

                {selectedMessageId === message.id && (
                  <pre role="code" className={styles.messageDetails}>
                    {JSON.stringify(message.message, null, 2)}
                  </pre>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.empty}>
            <p>No messages in queue</p>
          </div>
        )}
      </div>
    </div>
  )
}
