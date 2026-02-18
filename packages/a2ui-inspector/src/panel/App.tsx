/**
 * Main panel application
 */

import { useState, useEffect } from 'react'
import { MessageInspector } from './components/MessageInspector'
import { ActionTracer } from './components/ActionTracer'
import { NetworkInspector } from './components/NetworkInspector'
import { PerformanceProfiler } from './components/PerformanceProfiler'
import type { CapturedMessage, ActionTrace, NetworkData, NetworkEvent, PerformanceData } from '@/shared/types'
import { MessageCapture, PerformanceTracker } from '@/shared/utils'
import styles from './App.module.css'

type Tab = 'messages' | 'state' | 'actions' | 'performance' | 'network'

export function App(): JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('messages')
  const [messages, setMessages] = useState<CapturedMessage[]>([])
  const [actions, setActions] = useState<ActionTrace[]>([])
  const [messageCapture] = useState(() => new MessageCapture())
  const [performanceTracker] = useState(() => new PerformanceTracker())

  // Network state
  const [networkData, setNetworkData] = useState<NetworkData>({
    connectionStatus: 'disconnected',
    messageQueue: [],
    bandwidth: {
      sent: 0,
      received: 0,
      history: []
    },
    reconnectAttempts: 0
  })

  // Performance state
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    messageLatency: [],
    renderTime: [],
    memoryUsage: [],
    wsConnection: []
  })

  useEffect(() => {
    // Connect to background script
    const port = chrome.runtime.connect({ name: 'a2ui-devtools' })

    // Handle incoming messages
    port.onMessage.addListener((message) => {
      if (message.type === 'PAGE_MESSAGE') {
        const payload = message.payload

        if (payload.type === 'a2ui-message-sent') {
          const captured = messageCapture.captureMessage(
            payload.message,
            'sent'
          )
          setMessages(messageCapture.getMessages())

          // Track performance: start timing for this message
          performanceTracker.startMessageTiming(captured.id)

          // Update bandwidth
          const messageSize = JSON.stringify(payload.message).length
          setNetworkData(prev => ({
            ...prev,
            bandwidth: {
              ...prev.bandwidth,
              sent: prev.bandwidth.sent + messageSize
            }
          }))

          // Update performance data
          setPerformanceData({
            messageLatency: performanceTracker.getMessageLatencyMetrics(),
            renderTime: performanceTracker.getRenderTimeMetrics(),
            memoryUsage: performanceTracker.getMemoryUsageMetrics(),
            wsConnection: performanceTracker.getConnectionHistory()
          })
        } else if (payload.type === 'a2ui-message-received') {
          const captured = messageCapture.captureMessage(
            payload.message,
            'received'
          )
          setMessages(messageCapture.getMessages())

          // Track performance: end timing for this message
          performanceTracker.endMessageTiming(captured.id)

          // Update bandwidth
          const messageSize = JSON.stringify(payload.message).length
          setNetworkData(prev => ({
            ...prev,
            bandwidth: {
              ...prev.bandwidth,
              received: prev.bandwidth.received + messageSize
            }
          }))

          // Update performance data
          setPerformanceData({
            messageLatency: performanceTracker.getMessageLatencyMetrics(),
            renderTime: performanceTracker.getRenderTimeMetrics(),
            memoryUsage: performanceTracker.getMemoryUsageMetrics(),
            wsConnection: performanceTracker.getConnectionHistory()
          })
        } else if (payload.type === 'ACTION_TRACE') {
          setActions(prev => [...prev, payload as ActionTrace])
        } else if (payload.type === 'NETWORK_EVENT') {
          const networkEvent = payload as NetworkEvent
          handleNetworkEvent(networkEvent)
        }
      }
    })

    return () => {
      port.disconnect()
    }
  }, [messageCapture])

  const handleClearMessages = (): void => {
    messageCapture.clearMessages()
    setMessages([])
  }

  const handleExportMessages = (): void => {
    const data = JSON.stringify(messages, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `a2ui-messages-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleClearActions = (): void => {
    setActions([])
  }

  const handleExportActions = (): void => {
    const data = JSON.stringify(actions, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `a2ui-actions-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleNetworkEvent = (event: NetworkEvent): void => {
    switch (event.event) {
      case 'connected':
        setNetworkData(prev => ({
          ...prev,
          connectionStatus: 'connected',
          lastConnected: event.timestamp,
          reconnectAttempts: 0
        }))
        performanceTracker.trackConnectionEvent('connected')
        break

      case 'disconnected':
        setNetworkData(prev => ({
          ...prev,
          connectionStatus: 'disconnected',
          lastDisconnected: event.timestamp
        }))
        performanceTracker.trackConnectionEvent('disconnected')
        break

      case 'reconnecting':
        setNetworkData(prev => ({
          ...prev,
          connectionStatus: 'reconnecting',
          reconnectAttempts: prev.reconnectAttempts + 1
        }))
        performanceTracker.trackConnectionEvent('reconnecting')
        break

      case 'message_queued':
        if (event.details?.message) {
          setNetworkData(prev => ({
            ...prev,
            messageQueue: [
              ...prev.messageQueue,
              {
                id: event.details!.id as string || `queue_${Date.now()}`,
                timestamp: event.timestamp,
                message: event.details!.message,
                retries: 0
              }
            ]
          }))
        }
        break

      case 'message_sent':
        if (event.details?.id) {
          setNetworkData(prev => ({
            ...prev,
            messageQueue: prev.messageQueue.filter(
              msg => msg.id !== event.details!.id
            )
          }))
        }
        break
    }
  }

  const handleRefreshNetwork = (): void => {
    // Request network status update from background script
    chrome.runtime.sendMessage({ type: 'REQUEST_NETWORK_STATUS' })
  }

  return (
    <div className={styles.app}>
      <nav className={styles.nav}>
        <button
          className={activeTab === 'messages' ? styles.active : ''}
          onClick={() => setActiveTab('messages')}
        >
          Messages
        </button>
        <button
          className={activeTab === 'state' ? styles.active : ''}
          onClick={() => setActiveTab('state')}
        >
          State Tree
        </button>
        <button
          className={activeTab === 'actions' ? styles.active : ''}
          onClick={() => setActiveTab('actions')}
        >
          Actions
        </button>
        <button
          className={activeTab === 'performance' ? styles.active : ''}
          onClick={() => setActiveTab('performance')}
        >
          Performance
        </button>
        <button
          className={activeTab === 'network' ? styles.active : ''}
          onClick={() => setActiveTab('network')}
        >
          Network
        </button>
      </nav>

      <main className={styles.main}>
        {activeTab === 'messages' && (
          <MessageInspector
            messages={messages}
            onClear={handleClearMessages}
            onExport={handleExportMessages}
          />
        )}
        {activeTab === 'state' && (
          <div className={styles.placeholder}>
            State Tree Viewer - Coming Soon
          </div>
        )}
        {activeTab === 'actions' && (
          <ActionTracer
            actions={actions}
            onClear={handleClearActions}
            onExport={handleExportActions}
          />
        )}
        {activeTab === 'performance' && (
          <PerformanceProfiler data={performanceData} />
        )}
        {activeTab === 'network' && (
          <NetworkInspector
            networkData={networkData}
            onRefresh={handleRefreshNetwork}
          />
        )}
      </main>
    </div>
  )
}
