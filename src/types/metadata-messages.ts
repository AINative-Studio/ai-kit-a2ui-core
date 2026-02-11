/**
 * AI Metadata Message Type Definitions
 * Issue #29: Define metadata message types (Epic 2)
 *
 * This module defines message types for requesting and receiving AI-generated
 * video metadata including transcripts, summaries, topics, highlights, chapters,
 * and sentiment analysis.
 */

import type { BaseMessage } from './protocol.js'
import type {
  TranscriptMetadata,
  SummaryMetadata,
  TopicMetadata,
  HighlightMetadata,
  ChapterMetadata,
  SentimentMetadata,
} from './ai-metadata-state.js'

// ============================================================================
// Metadata Types
// ============================================================================

/**
 * Metadata type identifiers
 * Specifies which types of AI metadata to generate
 */
export type MetadataType =
  | 'transcript'
  | 'summary'
  | 'topics'
  | 'highlights'
  | 'chapters'
  | 'sentiment'

/**
 * Metadata processing priority levels
 */
export type MetadataPriority = 'low' | 'normal' | 'high' | 'urgent'

/**
 * Metadata processing state
 */
export type MetadataProcessingState = 'pending' | 'processing' | 'ready' | 'error'

// ============================================================================
// Request Metadata Message (Agent → Renderer) - Issue #29
// ============================================================================

/**
 * Request Metadata Message (Agent → Renderer)
 * Agent requests AI-generated metadata for a video or recording
 *
 * @example
 * ```typescript
 * const request: RequestMetadataMessage = {
 *   type: 'requestMetadata',
 *   surfaceId: 'video-player-1',
 *   contentId: 'rec-abc-123',
 *   metadataTypes: ['transcript', 'summary', 'highlights'],
 *   options: {
 *     priority: 'high',
 *     language: 'en'
 *   }
 * }
 * ```
 */
export interface RequestMetadataMessage extends BaseMessage {
  /** Message type identifier */
  type: 'requestMetadata'
  /** Surface identifier */
  surfaceId: string
  /** Content identifier (video ID, recording ID, etc.) */
  contentId: string
  /** Array of metadata types to generate */
  metadataTypes: MetadataType[]
  /** Optional processing options */
  options?: {
    /** Processing priority level (default: 'normal') */
    priority?: MetadataPriority
    /** Target language for text processing (ISO 639-1, e.g., 'en', 'es') */
    language?: string
    /** Enable speaker diarization for transcript (default: false) */
    enableSpeakerDiarization?: boolean
    /** Enable emotion detection for sentiment (default: false) */
    enableEmotionDetection?: boolean
    /** Maximum processing time in seconds (default: no limit) */
    maxProcessingTime?: number
    /** Custom AI model to use (default: system default) */
    model?: string
    /** Webhook URL for async notification when complete */
    webhookUrl?: string
    /** Additional custom processing parameters */
    customParams?: Record<string, unknown>
  }
}

// ============================================================================
// Metadata Ready Message (Renderer → Agent) - Issue #29
// ============================================================================

/**
 * Metadata Ready Message (Renderer → Agent)
 * Sent when AI-generated metadata is ready and available
 *
 * Contains all requested metadata types that were successfully generated.
 * If any metadata type failed, it will not be included in the response.
 *
 * @example
 * ```typescript
 * const ready: MetadataReadyMessage = {
 *   type: 'metadataReady',
 *   surfaceId: 'video-player-1',
 *   contentId: 'rec-abc-123',
 *   state: 'ready',
 *   metadata: {
 *     transcript: { ... },
 *     summary: { ... },
 *     highlights: { ... }
 *   },
 *   processingTime: 12500,
 *   completedAt: '2026-02-10T12:30:00.000Z'
 * }
 * ```
 */
export interface MetadataReadyMessage extends BaseMessage {
  /** Message type identifier */
  type: 'metadataReady'
  /** Surface identifier */
  surfaceId: string
  /** Content identifier (video ID, recording ID, etc.) */
  contentId: string
  /** Processing state */
  state: MetadataProcessingState
  /** Generated metadata (contains only successfully generated types) */
  metadata: {
    /** Transcript metadata (if requested and successful) */
    transcript?: TranscriptMetadata
    /** Summary metadata (if requested and successful) */
    summary?: SummaryMetadata
    /** Topic metadata (if requested and successful) */
    topics?: TopicMetadata
    /** Highlight metadata (if requested and successful) */
    highlights?: HighlightMetadata
    /** Chapter metadata (if requested and successful) */
    chapters?: ChapterMetadata
    /** Sentiment analysis metadata (if requested and successful) */
    sentiment?: SentimentMetadata
  }
  /** Total processing time in milliseconds */
  processingTime: number
  /** ISO 8601 timestamp when processing started */
  startedAt?: string
  /** ISO 8601 timestamp when processing completed */
  completedAt: string
  /** Error information (only present if state is 'error') */
  error?: {
    /** Error code */
    code: string
    /** Error message */
    message: string
    /** Failed metadata types */
    failedTypes?: MetadataType[]
    /** Optional error details */
    details?: unknown
  }
  /** Partial results flag (true if some metadata types failed) */
  isPartial?: boolean
  /** Optional processing statistics */
  stats?: {
    /** Number of successfully generated metadata types */
    successCount: number
    /** Number of failed metadata types */
    failedCount: number
    /** Total number of requested metadata types */
    totalRequested: number
  }
}

// ============================================================================
// Metadata Progress Message (Renderer → Agent) - Optional
// ============================================================================

/**
 * Metadata Progress Message (Renderer → Agent)
 * Optional streaming progress updates during metadata generation
 *
 * @example
 * ```typescript
 * const progress: MetadataProgressMessage = {
 *   type: 'metadataProgress',
 *   surfaceId: 'video-player-1',
 *   contentId: 'rec-abc-123',
 *   progress: 45,
 *   currentType: 'transcript',
 *   completedTypes: ['summary']
 * }
 * ```
 */
export interface MetadataProgressMessage extends BaseMessage {
  /** Message type identifier */
  type: 'metadataProgress'
  /** Surface identifier */
  surfaceId: string
  /** Content identifier */
  contentId: string
  /** Overall progress percentage 0-100 */
  progress: number
  /** Currently processing metadata type */
  currentType?: MetadataType
  /** Array of completed metadata types */
  completedTypes?: MetadataType[]
  /** Estimated time remaining in seconds */
  estimatedTimeRemaining?: number
  /** Optional status message */
  statusMessage?: string
}

// ============================================================================
// Union Types
// ============================================================================

/**
 * All metadata message types
 */
export type MetadataMessage =
  | RequestMetadataMessage
  | MetadataReadyMessage
  | MetadataProgressMessage

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for RequestMetadataMessage
 *
 * @param msg - Unknown message object
 * @returns True if message is RequestMetadataMessage
 *
 * @example
 * ```typescript
 * if (isRequestMetadataMessage(msg)) {
 *   console.log('Metadata types requested:', msg.metadataTypes)
 * }
 * ```
 */
export function isRequestMetadataMessage(msg: unknown): msg is RequestMetadataMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as any).type === 'requestMetadata' &&
    typeof (msg as any).surfaceId === 'string' &&
    typeof (msg as any).contentId === 'string' &&
    Array.isArray((msg as any).metadataTypes)
  )
}

/**
 * Type guard for MetadataReadyMessage
 *
 * @param msg - Unknown message object
 * @returns True if message is MetadataReadyMessage
 *
 * @example
 * ```typescript
 * if (isMetadataReadyMessage(msg)) {
 *   console.log('Metadata ready:', msg.metadata)
 * }
 * ```
 */
export function isMetadataReadyMessage(msg: unknown): msg is MetadataReadyMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as any).type === 'metadataReady' &&
    typeof (msg as any).surfaceId === 'string' &&
    typeof (msg as any).contentId === 'string' &&
    typeof (msg as any).state === 'string' &&
    typeof (msg as any).metadata === 'object' &&
    typeof (msg as any).processingTime === 'number'
  )
}

/**
 * Type guard for MetadataProgressMessage
 *
 * @param msg - Unknown message object
 * @returns True if message is MetadataProgressMessage
 *
 * @example
 * ```typescript
 * if (isMetadataProgressMessage(msg)) {
 *   console.log('Progress:', msg.progress + '%')
 * }
 * ```
 */
export function isMetadataProgressMessage(msg: unknown): msg is MetadataProgressMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as any).type === 'metadataProgress' &&
    typeof (msg as any).surfaceId === 'string' &&
    typeof (msg as any).contentId === 'string' &&
    typeof (msg as any).progress === 'number'
  )
}

/**
 * Type guard for any metadata message
 *
 * @param msg - Unknown message object
 * @returns True if message is any metadata message type
 *
 * @example
 * ```typescript
 * if (isMetadataMessage(msg)) {
 *   switch (msg.type) {
 *     case 'requestMetadata': // handle request
 *     case 'metadataReady': // handle ready
 *     case 'metadataProgress': // handle progress
 *   }
 * }
 * ```
 */
export function isMetadataMessage(msg: unknown): msg is MetadataMessage {
  return (
    isRequestMetadataMessage(msg) ||
    isMetadataReadyMessage(msg) ||
    isMetadataProgressMessage(msg)
  )
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Validates if a string is a valid MetadataType
 *
 * @param type - String to validate
 * @returns True if valid MetadataType
 *
 * @example
 * ```typescript
 * if (isValidMetadataType('transcript')) {
 *   // proceed with transcript generation
 * }
 * ```
 */
export function isValidMetadataType(type: string): type is MetadataType {
  const validTypes: MetadataType[] = [
    'transcript',
    'summary',
    'topics',
    'highlights',
    'chapters',
    'sentiment',
  ]
  return validTypes.includes(type as MetadataType)
}

/**
 * Filters an array to only include valid metadata types
 *
 * @param types - Array of strings to filter
 * @returns Array of valid MetadataType values
 *
 * @example
 * ```typescript
 * const validTypes = filterValidMetadataTypes(['transcript', 'invalid', 'summary'])
 * // returns: ['transcript', 'summary']
 * ```
 */
export function filterValidMetadataTypes(types: string[]): MetadataType[] {
  return types.filter((type): type is MetadataType => isValidMetadataType(type))
}

/**
 * Checks if all requested metadata types are present in the response
 *
 * @param requested - Array of requested metadata types
 * @param response - MetadataReadyMessage response
 * @returns True if all requested types are present
 *
 * @example
 * ```typescript
 * const allPresent = hasAllMetadataTypes(['transcript', 'summary'], readyMsg)
 * ```
 */
export function hasAllMetadataTypes(
  requested: MetadataType[],
  response: MetadataReadyMessage
): boolean {
  return requested.every((type) => {
    return response.metadata[type] !== undefined
  })
}

/**
 * Gets the list of missing metadata types from a response
 *
 * @param requested - Array of requested metadata types
 * @param response - MetadataReadyMessage response
 * @returns Array of missing metadata types
 *
 * @example
 * ```typescript
 * const missing = getMissingMetadataTypes(['transcript', 'summary', 'topics'], readyMsg)
 * // returns: ['topics'] if only transcript and summary are present
 * ```
 */
export function getMissingMetadataTypes(
  requested: MetadataType[],
  response: MetadataReadyMessage
): MetadataType[] {
  return requested.filter((type) => response.metadata[type] === undefined)
}
