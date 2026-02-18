/**
 * Message types for communication between extension components
 */

import type { A2UIMessage } from '@ainative/ai-kit-a2ui-core/types'

export type InspectorMessageType =
  | 'INIT'
  | 'A2UI_MESSAGE'
  | 'STATE_UPDATE'
  | 'PERFORMANCE_METRIC'
  | 'NETWORK_EVENT'
  | 'ACTION_TRACE'
  | 'GET_MESSAGES'
  | 'GET_STATE'
  | 'CLEAR_MESSAGES'
  | 'FILTER_MESSAGES'

export interface BaseInspectorMessage {
  type: InspectorMessageType
  timestamp: number
  tabId?: number
}

export interface InitMessage extends BaseInspectorMessage {
  type: 'INIT'
}

export interface A2UIMessageEvent extends BaseInspectorMessage {
  type: 'A2UI_MESSAGE'
  direction: 'sent' | 'received'
  message: A2UIMessage
  messageId: string
}

export interface StateUpdate extends BaseInspectorMessage {
  type: 'STATE_UPDATE'
  path: string
  oldValue: unknown
  newValue: unknown
  operation: 'add' | 'replace' | 'remove'
}

export interface PerformanceMetric extends BaseInspectorMessage {
  type: 'PERFORMANCE_METRIC'
  metric: 'message_latency' | 'render_time' | 'websocket_connection' | 'memory_usage'
  value: number
  context?: Record<string, unknown>
}

export interface NetworkEvent extends BaseInspectorMessage {
  type: 'NETWORK_EVENT'
  event: 'connected' | 'disconnected' | 'reconnecting' | 'message_queued' | 'message_sent'
  details?: Record<string, unknown>
}

export interface ActionTrace extends BaseInspectorMessage {
  type: 'ACTION_TRACE'
  actionId: string
  actionType: string
  status: 'started' | 'completed' | 'failed'
  duration?: number
  params?: Record<string, unknown>
  result?: unknown
  error?: Error
}

export interface GetMessagesRequest extends BaseInspectorMessage {
  type: 'GET_MESSAGES'
  filter?: MessageFilter
}

export interface GetStateRequest extends BaseInspectorMessage {
  type: 'GET_STATE'
}

export interface ClearMessagesRequest extends BaseInspectorMessage {
  type: 'CLEAR_MESSAGES'
}

export interface MessageFilter {
  messageTypes?: string[]
  direction?: 'sent' | 'received'
  startTime?: number
  endTime?: number
  searchTerm?: string
}

export type InspectorMessage =
  | InitMessage
  | A2UIMessageEvent
  | StateUpdate
  | PerformanceMetric
  | NetworkEvent
  | ActionTrace
  | GetMessagesRequest
  | GetStateRequest
  | ClearMessagesRequest

// Type guards
export function isA2UIMessageEvent(msg: InspectorMessage): msg is A2UIMessageEvent {
  return msg.type === 'A2UI_MESSAGE'
}

export function isStateUpdate(msg: InspectorMessage): msg is StateUpdate {
  return msg.type === 'STATE_UPDATE'
}

export function isPerformanceMetric(msg: InspectorMessage): msg is PerformanceMetric {
  return msg.type === 'PERFORMANCE_METRIC'
}

export function isNetworkEvent(msg: InspectorMessage): msg is NetworkEvent {
  return msg.type === 'NETWORK_EVENT'
}

export function isActionTrace(msg: InspectorMessage): msg is ActionTrace {
  return msg.type === 'ACTION_TRACE'
}
