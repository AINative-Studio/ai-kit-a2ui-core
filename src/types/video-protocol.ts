/**
 * A2UI Video Protocol Message Definitions
 * Extends base A2UI protocol with video streaming capabilities
 */

import type { BaseMessage } from './protocol.js'

/**
 * Video message types
 */
export type VideoMessageType =
  | 'requestRecording'
  | 'recordingStarted'
  | 'recordingComplete'
  | 'initiateVideoCall'
  | 'videoCallJoined'
  | 'videoCallEnded'
  | 'generateVideo'
  | 'videoGenerationProgress'
  | 'videoGenerationComplete'
  | 'searchVideos'
  | 'searchResults'

/**
 * Recording mode options
 */
export type RecordingMode = 'screen' | 'camera' | 'pip'

/**
 * Video quality options
 */
export type VideoQuality = 'low' | 'medium' | 'high'

/**
 * Recording state
 */
export type RecordingState = 'idle' | 'recording' | 'processing' | 'complete' | 'error'

/**
 * Video call state
 */
export type VideoCallState = 'idle' | 'connecting' | 'active' | 'ended' | 'error'

/**
 * Video generation state
 */
export type VideoGenerationState = 'idle' | 'generating' | 'complete' | 'error'

// ============================================================================
// Recording Messages (Issue #11)
// ============================================================================

/**
 * Request Recording Message (Agent → Renderer)
 * Agent requests the renderer to start a video/screen recording
 */
export interface RequestRecordingMessage extends BaseMessage {
  type: 'requestRecording'
  /** Surface identifier */
  surfaceId: string
  /** Unique recording identifier */
  recordingId: string
  /** Recording mode */
  mode: RecordingMode
  /** Optional recording options */
  options?: {
    /** Include audio */
    audio?: boolean
    /** Video quality */
    quality?: VideoQuality
    /** Maximum duration in seconds */
    duration?: number
  }
}

/**
 * Recording Started Message (Renderer → Agent)
 * Confirms recording has started
 */
export interface RecordingStartedMessage extends BaseMessage {
  type: 'recordingStarted'
  /** Surface identifier */
  surfaceId: string
  /** Recording identifier */
  recordingId: string
  /** ISO 8601 timestamp when recording started */
  timestamp: string
}

/**
 * Recording Complete Message (Renderer → Agent)
 * Sent when recording is finished and processed
 */
export interface RecordingCompleteMessage extends BaseMessage {
  type: 'recordingComplete'
  /** Surface identifier */
  surfaceId: string
  /** Recording identifier */
  recordingId: string
  /** URL to the recorded video */
  videoUrl: string
  /** Duration in seconds */
  duration: number
  /** Optional transcript */
  transcript?: string
  /** Optional AI-detected highlights */
  highlights?: Array<{
    /** Timestamp in seconds */
    timestamp: number
    /** Confidence score 0-1 */
    confidence: number
  }>
}

// ============================================================================
// Video Call Messages (Issue #12)
// ============================================================================

/**
 * Video Call Participant
 * Represents a participant in a video call with full state information
 */
export interface VideoCallParticipant {
  /** Unique participant identifier */
  id: string
  /** Participant display name */
  name: string
  /** Participant role in the call */
  role: 'host' | 'participant'
  /** Whether participant is muted */
  isMuted: boolean
  /** Whether participant has video enabled */
  isVideoEnabled: boolean
  /** Optional avatar URL */
  avatarUrl?: string
  /** Optional join timestamp (ISO 8601) */
  joinedAt?: string
}

/**
 * Initiate Video Call Message (Agent → Renderer)
 * Agent requests to start a video call
 */
export interface InitiateVideoCallMessage extends BaseMessage {
  type: 'initiateVideoCall'
  /** Surface identifier */
  surfaceId: string
  /** Unique call identifier */
  callId: string
  /** Room/session identifier */
  roomId: string
  /** Optional list of participant identifiers */
  participants?: string[]
}

/**
 * Video Call Joined Message (Renderer → Agent)
 * Sent when a participant joins the call
 */
export interface VideoCallJoinedMessage extends BaseMessage {
  type: 'videoCallJoined'
  /** Surface identifier */
  surfaceId: string
  /** Call identifier */
  callId: string
  /** Participant identifier who joined */
  participantId: string
  /** ISO 8601 timestamp when participant joined */
  timestamp: string
  /** Optional participant details */
  participant?: VideoCallParticipant
}

/**
 * Video Call Ended Message (Renderer → Agent)
 * Sent when the call ends
 */
export interface VideoCallEndedMessage extends BaseMessage {
  type: 'videoCallEnded'
  /** Surface identifier */
  surfaceId: string
  /** Call identifier */
  callId: string
  /** Total call duration in seconds */
  duration: number
  /** Optional call transcript */
  transcript?: string
  /** Optional AI-generated summary */
  summary?: string
  /** Optional AI-detected action items */
  actionItems?: string[]
  /** Optional list of participants who were in the call */
  participants?: VideoCallParticipant[]
}

// ============================================================================
// Video Generation Messages (Issue #13)
// ============================================================================

/**
 * Generate Video Message (Agent → Renderer)
 * Agent requests AI video generation
 */
export interface GenerateVideoMessage extends BaseMessage {
  type: 'generateVideo'
  /** Surface identifier */
  surfaceId: string
  /** Unique video identifier */
  videoId: string
  /** Generation prompt */
  prompt: string
  /** Optional template data */
  data?: Record<string, unknown>
  /** Optional template identifier */
  template?: string
}

/**
 * Video Generation Progress Message (Renderer → Agent)
 * Streaming progress updates during generation
 */
export interface VideoGenerationProgressMessage extends BaseMessage {
  type: 'videoGenerationProgress'
  /** Surface identifier */
  surfaceId: string
  /** Video identifier */
  videoId: string
  /** Progress percentage 0-100 */
  progress: number
  /** Optional preview frame (base64 encoded) */
  frame?: string
}

/**
 * Video Generation Complete Message (Renderer → Agent)
 * Sent when video generation is finished
 */
export interface VideoGenerationCompleteMessage extends BaseMessage {
  type: 'videoGenerationComplete'
  /** Surface identifier */
  surfaceId: string
  /** Video identifier */
  videoId: string
  /** URL to generated video */
  videoUrl: string
  /** Remotion composition metadata */
  composition?: Record<string, unknown>
}

// ============================================================================
// Semantic Video Search Messages (Issue #26 - Epic 2)
// ============================================================================

/**
 * Video search filter options
 */
export interface VideoSearchFilters {
  /** Filter by video duration range in seconds */
  duration?: {
    /** Minimum duration */
    min?: number
    /** Maximum duration */
    max?: number
  }
  /** Filter by upload date range */
  uploadedAfter?: string
  /** Filter before date (ISO 8601) */
  uploadedBefore?: string
  /** Filter by user/uploader ID */
  uploaderId?: string
  /** Filter by tags */
  tags?: string[]
  /** Filter by quality */
  quality?: VideoQuality[]
  /** Filter by recording mode */
  recordingMode?: RecordingMode[]
}

/**
 * Vector query for semantic search
 */
export interface VectorQuery {
  /** Query text for semantic embedding */
  text?: string
  /** Pre-computed embedding vector */
  embedding?: number[]
  /** Number of results to return */
  topK?: number
  /** Minimum similarity threshold (0-1) */
  minSimilarity?: number
}

/**
 * Search Videos Message (Agent → Renderer)
 * Agent requests semantic video search using vector similarity
 */
export interface SearchVideosMessage extends BaseMessage {
  type: 'searchVideos'
  /** Surface identifier */
  surfaceId: string
  /** Unique search identifier */
  searchId: string
  /** Search query text */
  query: string
  /** Optional vector query for semantic search */
  vectorQuery?: VectorQuery
  /** Optional search filters */
  filters?: VideoSearchFilters
  /** Maximum number of results */
  limit?: number
  /** Offset for pagination */
  offset?: number
}

/**
 * Video search result with relevance scoring
 */
export interface VideoSearchResult {
  /** Video identifier */
  videoId: string
  /** Video title */
  title: string
  /** Video description */
  description?: string
  /** Video URL */
  videoUrl: string
  /** Thumbnail URL */
  thumbnailUrl?: string
  /** Video duration in seconds */
  duration: number
  /** Upload timestamp (ISO 8601) */
  uploadedAt: string
  /** Uploader/creator ID */
  uploaderId?: string
  /** Relevance score (0-1) */
  relevanceScore: number
  /** Vector similarity score (0-1) */
  similarityScore?: number
  /** Relevant timestamps in the video */
  relevantTimestamps?: Array<{
    /** Timestamp in seconds */
    timestamp: number
    /** Confidence score (0-1) */
    confidence: number
    /** Optional description of what's at this timestamp */
    description?: string
  }>
  /** Video metadata */
  metadata?: {
    /** Transcript excerpt matching query */
    transcriptExcerpt?: string
    /** AI-generated summary */
    summary?: string
    /** Tags */
    tags?: string[]
    /** Topics detected */
    topics?: string[]
    /** Video quality */
    quality?: VideoQuality
  }
}

/**
 * Search Results Message (Renderer → Agent)
 * Returns search results with relevance scores
 */
export interface SearchResultsMessage extends BaseMessage {
  type: 'searchResults'
  /** Surface identifier */
  surfaceId: string
  /** Search identifier matching the request */
  searchId: string
  /** Search results ordered by relevance */
  results: VideoSearchResult[]
  /** Total number of results available */
  totalResults: number
  /** Query that was executed */
  query: string
  /** Whether semantic search was used */
  isSemanticSearch: boolean
  /** Optional search performance metrics */
  metrics?: {
    /** Search execution time in milliseconds */
    executionTime: number
    /** Number of vectors searched */
    vectorsSearched?: number
  }
}

// ============================================================================
// Union Types
// ============================================================================

/**
 * All video message types
 */
export type VideoMessage =
  | RequestRecordingMessage
  | RecordingStartedMessage
  | RecordingCompleteMessage
  | InitiateVideoCallMessage
  | VideoCallJoinedMessage
  | VideoCallEndedMessage
  | GenerateVideoMessage
  | VideoGenerationProgressMessage
  | VideoGenerationCompleteMessage
  | SearchVideosMessage
  | SearchResultsMessage

// ============================================================================
// Type Guards
// ============================================================================

export function isRequestRecordingMessage(msg: unknown): msg is RequestRecordingMessage {
  return typeof msg === 'object' && msg !== null && (msg as any).type === 'requestRecording'
}

export function isRecordingStartedMessage(msg: unknown): msg is RecordingStartedMessage {
  return typeof msg === 'object' && msg !== null && (msg as any).type === 'recordingStarted'
}

export function isRecordingCompleteMessage(msg: unknown): msg is RecordingCompleteMessage {
  return typeof msg === 'object' && msg !== null && (msg as any).type === 'recordingComplete'
}

export function isInitiateVideoCallMessage(msg: unknown): msg is InitiateVideoCallMessage {
  return typeof msg === 'object' && msg !== null && (msg as any).type === 'initiateVideoCall'
}

export function isVideoCallJoinedMessage(msg: unknown): msg is VideoCallJoinedMessage {
  return typeof msg === 'object' && msg !== null && (msg as any).type === 'videoCallJoined'
}

export function isVideoCallEndedMessage(msg: unknown): msg is VideoCallEndedMessage {
  return typeof msg === 'object' && msg !== null && (msg as any).type === 'videoCallEnded'
}

export function isGenerateVideoMessage(msg: unknown): msg is GenerateVideoMessage {
  return typeof msg === 'object' && msg !== null && (msg as any).type === 'generateVideo'
}

export function isVideoGenerationProgressMessage(msg: unknown): msg is VideoGenerationProgressMessage {
  return typeof msg === 'object' && msg !== null && (msg as any).type === 'videoGenerationProgress'
}

export function isVideoGenerationCompleteMessage(msg: unknown): msg is VideoGenerationCompleteMessage {
  return typeof msg === 'object' && msg !== null && (msg as any).type === 'videoGenerationComplete'
}

export function isSearchVideosMessage(msg: unknown): msg is SearchVideosMessage {
  return typeof msg === 'object' && msg !== null && (msg as any).type === 'searchVideos'
}

export function isSearchResultsMessage(msg: unknown): msg is SearchResultsMessage {
  return typeof msg === 'object' && msg !== null && (msg as any).type === 'searchResults'
}

export function isVideoMessage(msg: unknown): msg is VideoMessage {
  return (
    isRequestRecordingMessage(msg) ||
    isRecordingStartedMessage(msg) ||
    isRecordingCompleteMessage(msg) ||
    isInitiateVideoCallMessage(msg) ||
    isVideoCallJoinedMessage(msg) ||
    isVideoCallEndedMessage(msg) ||
    isGenerateVideoMessage(msg) ||
    isVideoGenerationProgressMessage(msg) ||
    isVideoGenerationCompleteMessage(msg) ||
    isSearchVideosMessage(msg) ||
    isSearchResultsMessage(msg)
  )
}
