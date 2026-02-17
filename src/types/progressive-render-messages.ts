/**
 * Progressive Rendering Message Types
 *
 * New message types for streaming JSON and progressive UI rendering
 */

import type { BaseMessage } from './protocol.js'
import type { A2UIMessage } from './protocol.js'

/**
 * Progressive Render Start Message (Agent → UI)
 * Signals the start of a progressive rendering stream
 */
export interface ProgressiveRenderStartMessage extends BaseMessage {
  type: 'progressiveRenderStart'
  /** Surface being progressively rendered */
  surfaceId: string
  /** Unique stream identifier */
  streamId: string
  /** Expected total size (bytes) if known */
  expectedSize?: number
  /** Estimated number of components */
  estimatedComponents?: number
}

/**
 * Progressive Render Chunk Message (Agent → UI)
 * Contains a chunk of streaming JSON data
 */
export interface ProgressiveRenderChunkMessage extends BaseMessage {
  type: 'progressiveRenderChunk'
  /** Stream identifier */
  streamId: string
  /** JSON chunk (may be incomplete) */
  chunk: string
  /** Partially parsed message */
  partial: Partial<A2UIMessage>
  /** Confidence score (0-1) */
  confidence: number
  /** Chunk sequence number */
  sequence: number
  /** Total bytes received so far */
  bytesReceived: number
}

/**
 * Progressive Render Complete Message (Agent → UI)
 * Signals completion of progressive rendering stream
 */
export interface ProgressiveRenderCompleteMessage extends BaseMessage {
  type: 'progressiveRenderComplete'
  /** Stream identifier */
  streamId: string
  /** Final complete message */
  final: A2UIMessage
  /** Total chunks sent */
  totalChunks: number
  /** Total bytes sent */
  totalBytes: number
  /** Duration in milliseconds */
  duration: number
}

/**
 * Progressive Render Error Message (Agent → UI)
 * Signals an error during progressive rendering
 */
export interface ProgressiveRenderErrorMessage extends BaseMessage {
  type: 'progressiveRenderError'
  /** Stream identifier */
  streamId: string
  /** Error code */
  errorCode: string
  /** Error message */
  error: string
  /** Recovered partial data if available */
  recovered?: Partial<A2UIMessage>
  /** Whether recovery was attempted */
  recoveryAttempted: boolean
  /** Chunk sequence where error occurred */
  failedAtSequence?: number
}

/**
 * Progressive Render Progress Message (UI → Agent)
 * Feedback about rendering progress
 */
export interface ProgressiveRenderProgressMessage extends BaseMessage {
  type: 'progressiveRenderProgress'
  /** Stream identifier */
  streamId: string
  /** Components rendered so far */
  componentsRendered: number
  /** Components pending */
  componentsPending: number
  /** Average render time per component (ms) */
  avgRenderTime: number
  /** Request to slow down/speed up */
  backpressure?: 'slow' | 'normal' | 'fast'
}

/**
 * Extended message types with progressive rendering
 */
export type ExtendedMessageType =
  | 'createSurface'
  | 'updateComponents'
  | 'updateDataModel'
  | 'deleteSurface'
  | 'userAction'
  | 'error'
  | 'ping'
  | 'pong'
  | 'progressiveRenderStart'
  | 'progressiveRenderChunk'
  | 'progressiveRenderComplete'
  | 'progressiveRenderError'
  | 'progressiveRenderProgress'

/**
 * Union of all progressive render messages
 */
export type ProgressiveRenderMessage =
  | ProgressiveRenderStartMessage
  | ProgressiveRenderChunkMessage
  | ProgressiveRenderCompleteMessage
  | ProgressiveRenderErrorMessage
  | ProgressiveRenderProgressMessage

/**
 * Extended A2UI message with progressive rendering
 */
export type ExtendedA2UIMessage = A2UIMessage | ProgressiveRenderMessage

/**
 * Type guards for progressive render messages
 */

export function isProgressiveRenderStartMessage(
  msg: ExtendedA2UIMessage
): msg is ProgressiveRenderStartMessage {
  return msg.type === 'progressiveRenderStart'
}

export function isProgressiveRenderChunkMessage(
  msg: ExtendedA2UIMessage
): msg is ProgressiveRenderChunkMessage {
  return msg.type === 'progressiveRenderChunk'
}

export function isProgressiveRenderCompleteMessage(
  msg: ExtendedA2UIMessage
): msg is ProgressiveRenderCompleteMessage {
  return msg.type === 'progressiveRenderComplete'
}

export function isProgressiveRenderErrorMessage(
  msg: ExtendedA2UIMessage
): msg is ProgressiveRenderErrorMessage {
  return msg.type === 'progressiveRenderError'
}

export function isProgressiveRenderProgressMessage(
  msg: ExtendedA2UIMessage
): msg is ProgressiveRenderProgressMessage {
  return msg.type === 'progressiveRenderProgress'
}

/**
 * Check if message is any progressive render message
 */
export function isProgressiveRenderMessage(
  msg: ExtendedA2UIMessage
): msg is ProgressiveRenderMessage {
  return (
    msg.type === 'progressiveRenderStart' ||
    msg.type === 'progressiveRenderChunk' ||
    msg.type === 'progressiveRenderComplete' ||
    msg.type === 'progressiveRenderError' ||
    msg.type === 'progressiveRenderProgress'
  )
}
