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

// ============================================================================
// Progress Tracking Messages (Issue #31 - Epic 2)
// ============================================================================

/**
 * Progress tracking category
 * Identifies what type of operation is being tracked
 */
export type ProgressCategory = 'recording' | 'videoCall' | 'videoGeneration' | 'upload' | 'processing'

/**
 * Progress state enumeration
 */
export type ProgressState = 'queued' | 'active' | 'paused' | 'complete' | 'failed' | 'cancelled'

/**
 * Progress Update Message (Bidirectional)
 * Generic progress tracking for long-running operations
 */
export interface ProgressUpdateMessage extends BaseMessage {
  type: 'progressUpdate'
  /** Surface identifier */
  surfaceId: string
  /** Unique operation identifier */
  operationId: string
  /** Progress category */
  category: ProgressCategory
  /** Current state */
  state: ProgressState
  /** Progress percentage 0-100 */
  progress: number
  /** Current step description */
  currentStep?: string
  /** Total number of steps */
  totalSteps?: number
  /** Current step number */
  currentStepNumber?: number
  /** Estimated time remaining in seconds */
  estimatedTimeRemaining?: number
  /** Metadata specific to the operation */
  metadata?: Record<string, unknown>
}

/**
 * Progress Sync Message (Bidirectional)
 * Synchronizes progress state across devices
 */
export interface ProgressSyncMessage extends BaseMessage {
  type: 'progressSync'
  /** User identifier for cross-device sync */
  userId: string
  /** List of active operations with their progress */
  operations: Array<{
    /** Operation identifier */
    operationId: string
    /** Surface identifier */
    surfaceId: string
    /** Progress category */
    category: ProgressCategory
    /** Current state */
    state: ProgressState
    /** Progress percentage 0-100 */
    progress: number
    /** Timestamp of last update (ISO 8601) */
    lastUpdated: string
  }>
  /** Sync timestamp (ISO 8601) */
  syncTimestamp: string
}

/**
 * Progress Cancel Message (UI → Agent)
 * Request to cancel a running operation
 */
export interface ProgressCancelMessage extends BaseMessage {
  type: 'progressCancel'
  /** Surface identifier */
  surfaceId: string
  /** Operation identifier to cancel */
  operationId: string
  /** Optional cancellation reason */
  reason?: string
}

/**
 * Progress Pause Message (UI → Agent)
 * Request to pause a running operation
 */
export interface ProgressPauseMessage extends BaseMessage {
  type: 'progressPause'
  /** Surface identifier */
  surfaceId: string
  /** Operation identifier to pause */
  operationId: string
}

/**
 * Progress Resume Message (UI → Agent)
 * Request to resume a paused operation
 */
export interface ProgressResumeMessage extends BaseMessage {
  type: 'progressResume'
  /** Surface identifier */
  surfaceId: string
  /** Operation identifier to resume */
  operationId: string
}

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

  | ProgressUpdateMessage
  | ProgressSyncMessage
  | ProgressCancelMessage
  | ProgressPauseMessage
  | ProgressResumeMessage

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


export function isProgressUpdateMessage(msg: unknown): msg is ProgressUpdateMessage {
  return typeof msg === 'object' && msg !== null && (msg as any).type === 'progressUpdate'
}

export function isProgressSyncMessage(msg: unknown): msg is ProgressSyncMessage {
  return typeof msg === 'object' && msg !== null && (msg as any).type === 'progressSync'
}

export function isProgressCancelMessage(msg: unknown): msg is ProgressCancelMessage {
  return typeof msg === 'object' && msg !== null && (msg as any).type === 'progressCancel'
}

export function isProgressPauseMessage(msg: unknown): msg is ProgressPauseMessage {
  return typeof msg === 'object' && msg !== null && (msg as any).type === 'progressPause'
}

export function isProgressResumeMessage(msg: unknown): msg is ProgressResumeMessage {
  return typeof msg === 'object' && msg !== null && (msg as any).type === 'progressResume'
}

    isProgressUpdateMessage(msg) ||
    isProgressSyncMessage(msg) ||
    isProgressCancelMessage(msg) ||
    isProgressPauseMessage(msg) ||
    isProgressResumeMessage(msg) ||
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
    isVideoGenerationCompleteMessage(msg)
  )
}
