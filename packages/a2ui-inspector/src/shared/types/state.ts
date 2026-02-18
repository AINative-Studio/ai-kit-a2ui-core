/**
 * State types for inspector panel
 */

import type { A2UIMessageEvent, StateUpdate, PerformanceMetric, NetworkEvent, ActionTrace } from './messages.js'

export interface InspectorState {
  messages: CapturedMessage[]
  state: StateTree
  actions: ActionTrace[]
  performance: PerformanceData
  network: NetworkData
}

export interface CapturedMessage {
  id: string
  timestamp: number
  direction: 'sent' | 'received'
  message: unknown
  messageType: string
  duration?: number
}

export interface StateTree {
  [key: string]: StateNode
}

export interface StateNode {
  value: unknown
  timestamp: number
  path: string
  children?: StateTree
  changes: StateChange[]
}

export interface StateChange {
  timestamp: number
  oldValue: unknown
  newValue: unknown
  operation: 'add' | 'replace' | 'remove'
}

export interface PerformanceData {
  messageLatency: MetricHistory[]
  renderTime: MetricHistory[]
  memoryUsage: MetricHistory[]
  wsConnection: ConnectionHistory[]
}

export interface MetricHistory {
  timestamp: number
  value: number
  context?: Record<string, unknown>
}

export interface ConnectionHistory {
  timestamp: number
  status: 'connected' | 'disconnected' | 'reconnecting'
  duration?: number
}

export interface NetworkData {
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting'
  messageQueue: QueuedMessage[]
  bandwidth: BandwidthData
  reconnectAttempts: number
  lastConnected?: number
  lastDisconnected?: number
}

export interface QueuedMessage {
  id: string
  timestamp: number
  message: unknown
  retries: number
}

export interface BandwidthData {
  sent: number
  received: number
  history: BandwidthHistory[]
}

export interface BandwidthHistory {
  timestamp: number
  sent: number
  received: number
}
