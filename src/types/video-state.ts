/**
 * A2UI Video Component State Types
 * Comprehensive state management for video recording, calls, generation, and playback
 */

// ============================================================================
// Video Recorder State (Issue #18)
// ============================================================================

/**
 * Video recorder status enumeration
 */
export type VideoRecorderStatus =
  | 'idle'
  | 'initializing'
  | 'ready'
  | 'recording'
  | 'paused'
  | 'stopping'
  | 'processing'
  | 'complete'
  | 'error'

/**
 * Recording mode options
 */
export type RecordingMode = 'screen' | 'camera' | 'pip'

/**
 * Video quality settings
 */
export type VideoQuality = 'low' | 'medium' | 'high'

/**
 * Recording error types
 */
export type RecordingErrorType =
  | 'permission_denied'
  | 'device_not_found'
  | 'not_supported'
  | 'storage_full'
  | 'network_error'
  | 'processing_failed'
  | 'timeout'
  | 'unknown'

/**
 * Recording error information
 */
export interface RecordingError {
  /** Error type */
  type: RecordingErrorType
  /** Human-readable error message */
  message: string
  /** Optional error code */
  code?: string
  /** Optional technical details */
  details?: Record<string, unknown>
}

/**
 * Recording metadata
 */
export interface RecordingMetadata {
  /** Recording start timestamp (ISO 8601) */
  startedAt?: string
  /** Recording end timestamp (ISO 8601) */
  endedAt?: string
  /** Duration in seconds */
  duration?: number
  /** File size in bytes */
  fileSize?: number
  /** Video resolution width */
  width?: number
  /** Video resolution height */
  height?: number
  /** Frame rate */
  frameRate?: number
  /** Codec used */
  codec?: string
}

/**
 * Video recorder state
 * Tracks the complete state of a video recording session
 */
export interface VideoRecorderState {
  /** Current recorder status */
  status: VideoRecorderStatus
  /** Unique recording identifier */
  recordingId?: string
  /** Recording mode */
  mode?: RecordingMode
  /** Video quality setting */
  quality?: VideoQuality
  /** Current recording duration in seconds */
  currentDuration?: number
  /** Maximum allowed duration in seconds */
  maxDuration?: number
  /** Whether audio is being recorded */
  audioEnabled?: boolean
  /** URL to recorded video (when complete) */
  videoUrl?: string
  /** Recording metadata */
  metadata?: RecordingMetadata
  /** Error information if status is 'error' */
  error?: RecordingError
  /** Processing progress 0-100 (when status is 'processing') */
  processingProgress?: number
}

// ============================================================================
// Video Call State (Issue #18)
// ============================================================================

/**
 * Video call status enumeration
 */
export type VideoCallStatus =
  | 'idle'
  | 'initializing'
  | 'connecting'
  | 'connected'
  | 'active'
  | 'reconnecting'
  | 'ending'
  | 'ended'
  | 'error'

/**
 * Call participant state
 */
export interface CallParticipantState {
  /** Unique participant identifier */
  id: string
  /** Participant display name */
  name: string
  /** Participant role */
  role: 'host' | 'participant'
  /** Whether participant is muted */
  isMuted: boolean
  /** Whether participant has video enabled */
  isVideoEnabled: boolean
  /** Whether participant is screen sharing */
  isScreenSharing?: boolean
  /** Participant connection quality 0-100 */
  connectionQuality?: number
  /** Optional avatar URL */
  avatarUrl?: string
  /** Join timestamp (ISO 8601) */
  joinedAt?: string
  /** Leave timestamp (ISO 8601) */
  leftAt?: string
}

/**
 * Call quality metrics
 */
export interface CallQualityMetrics {
  /** Overall quality score 0-100 */
  overallQuality: number
  /** Audio quality score 0-100 */
  audioQuality?: number
  /** Video quality score 0-100 */
  videoQuality?: number
  /** Network latency in milliseconds */
  latency?: number
  /** Packet loss percentage 0-100 */
  packetLoss?: number
  /** Bandwidth usage in kbps */
  bandwidth?: number
}

/**
 * Call error types
 */
export type CallErrorType =
  | 'connection_failed'
  | 'permission_denied'
  | 'room_full'
  | 'room_not_found'
  | 'network_error'
  | 'device_error'
  | 'kicked'
  | 'timeout'
  | 'unknown'

/**
 * Call error information
 */
export interface CallError {
  /** Error type */
  type: CallErrorType
  /** Human-readable error message */
  message: string
  /** Optional error code */
  code?: string
  /** Optional technical details */
  details?: Record<string, unknown>
}

/**
 * Video call state
 * Tracks the complete state of a video call session
 */
export interface VideoCallState {
  /** Current call status */
  status: VideoCallStatus
  /** Unique call identifier */
  callId?: string
  /** Room/session identifier */
  roomId?: string
  /** Call start timestamp (ISO 8601) */
  startedAt?: string
  /** Call end timestamp (ISO 8601) */
  endedAt?: string
  /** Current call duration in seconds */
  currentDuration?: number
  /** Array of participants */
  participants?: CallParticipantState[]
  /** Current user's participant ID */
  currentParticipantId?: string
  /** Whether call is being recorded */
  isRecording?: boolean
  /** Whether screen is being shared */
  hasScreenShare?: boolean
  /** Call quality metrics */
  qualityMetrics?: CallQualityMetrics
  /** Error information if status is 'error' */
  error?: CallError
  /** Transcript text (if available) */
  transcript?: string
  /** AI-generated summary (if available) */
  summary?: string
  /** AI-detected action items */
  actionItems?: string[]
}

// ============================================================================
// Video Generation State (Issue #18)
// ============================================================================

/**
 * Video generation status enumeration
 */
export type VideoGenerationStatus =
  | 'idle'
  | 'queued'
  | 'initializing'
  | 'generating'
  | 'rendering'
  | 'processing'
  | 'complete'
  | 'cancelled'
  | 'error'

/**
 * Generation stage information
 */
export interface GenerationStage {
  /** Stage name */
  name: string
  /** Stage description */
  description?: string
  /** Stage progress 0-100 */
  progress: number
  /** Stage start timestamp (ISO 8601) */
  startedAt?: string
  /** Stage completion timestamp (ISO 8601) */
  completedAt?: string
}

/**
 * Generation error types
 */
export type GenerationErrorType =
  | 'invalid_prompt'
  | 'invalid_template'
  | 'generation_failed'
  | 'rendering_failed'
  | 'quota_exceeded'
  | 'timeout'
  | 'network_error'
  | 'unknown'

/**
 * Generation error information
 */
export interface GenerationError {
  /** Error type */
  type: GenerationErrorType
  /** Human-readable error message */
  message: string
  /** Optional error code */
  code?: string
  /** Optional technical details */
  details?: Record<string, unknown>
}

/**
 * Video generation metadata
 */
export interface GenerationMetadata {
  /** Template identifier used */
  templateId?: string
  /** Composition name */
  compositionName?: string
  /** Video duration in seconds */
  duration?: number
  /** Video resolution width */
  width?: number
  /** Video resolution height */
  height?: number
  /** Frame rate */
  frameRate?: number
  /** Generation start timestamp (ISO 8601) */
  startedAt?: string
  /** Generation completion timestamp (ISO 8601) */
  completedAt?: string
  /** Total generation time in seconds */
  generationTime?: number
}

/**
 * Video generation state
 * Tracks the complete state of an AI video generation process
 */
export interface VideoGenerationState {
  /** Current generation status */
  status: VideoGenerationStatus
  /** Unique video identifier */
  videoId?: string
  /** Generation prompt */
  prompt?: string
  /** Template identifier */
  templateId?: string
  /** Overall generation progress 0-100 */
  progress?: number
  /** Current generation stage */
  currentStage?: GenerationStage
  /** Array of all stages */
  stages?: GenerationStage[]
  /** Preview frame URL (base64 or URL) */
  previewFrame?: string
  /** URL to generated video (when complete) */
  videoUrl?: string
  /** Generation metadata */
  metadata?: GenerationMetadata
  /** Error information if status is 'error' */
  error?: GenerationError
  /** Estimated time remaining in seconds */
  estimatedTimeRemaining?: number
}

// ============================================================================
// Video Player State (Issue #18)
// ============================================================================

/**
 * Video player status enumeration
 */
export type VideoPlayerStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'playing'
  | 'paused'
  | 'buffering'
  | 'seeking'
  | 'ended'
  | 'error'

/**
 * Playback speed options
 */
export type PlaybackSpeed = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 1.75 | 2

/**
 * Player error types
 */
export type PlayerErrorType =
  | 'media_not_found'
  | 'media_decode_error'
  | 'network_error'
  | 'format_not_supported'
  | 'drm_error'
  | 'unknown'

/**
 * Player error information
 */
export interface PlayerError {
  /** Error type */
  type: PlayerErrorType
  /** Human-readable error message */
  message: string
  /** Optional error code */
  code?: string
  /** Optional technical details */
  details?: Record<string, unknown>
}

/**
 * Video player metadata
 */
export interface VideoPlayerMetadata {
  /** Video title */
  title?: string
  /** Video description */
  description?: string
  /** Video thumbnail URL */
  thumbnailUrl?: string
  /** Video duration in seconds */
  duration?: number
  /** Video resolution width */
  width?: number
  /** Video resolution height */
  height?: number
  /** Video format/codec */
  format?: string
  /** File size in bytes */
  fileSize?: number
}

/**
 * Video player state
 * Tracks the complete state of video playback
 */
export interface VideoPlayerState {
  /** Current player status */
  status: VideoPlayerStatus
  /** Video source URL */
  videoUrl?: string
  /** Current playback time in seconds */
  currentTime?: number
  /** Total video duration in seconds */
  duration?: number
  /** Playback speed */
  playbackSpeed?: PlaybackSpeed
  /** Volume level 0-100 */
  volume?: number
  /** Whether video is muted */
  isMuted?: boolean
  /** Whether video is fullscreen */
  isFullscreen?: boolean
  /** Whether controls are visible */
  showControls?: boolean
  /** Whether video should autoplay */
  autoplay?: boolean
  /** Whether video should loop */
  loop?: boolean
  /** Buffered time ranges */
  buffered?: Array<{ start: number; end: number }>
  /** Player metadata */
  metadata?: VideoPlayerMetadata
  /** Error information if status is 'error' */
  error?: PlayerError
}

// ============================================================================
// State Transition Types (Issue #18)
// ============================================================================

/**
 * State transition event
 */
export interface StateTransition<TState> {
  /** Previous state */
  from: TState
  /** New state */
  to: TState
  /** Timestamp of transition (ISO 8601) */
  timestamp: string
  /** Optional transition reason */
  reason?: string
  /** Optional additional data */
  data?: Record<string, unknown>
}

/**
 * Video recorder state transition
 */
export type VideoRecorderStateTransition = StateTransition<VideoRecorderStatus>

/**
 * Video call state transition
 */
export type VideoCallStateTransition = StateTransition<VideoCallStatus>

/**
 * Video generation state transition
 */
export type VideoGenerationStateTransition = StateTransition<VideoGenerationStatus>

/**
 * Video player state transition
 */
export type VideoPlayerStateTransition = StateTransition<VideoPlayerStatus>

// ============================================================================
// State Update Types
// ============================================================================

/**
 * Partial state update for video recorder
 */
export type VideoRecorderStateUpdate = Partial<VideoRecorderState>

/**
 * Partial state update for video call
 */
export type VideoCallStateUpdate = Partial<VideoCallState>

/**
 * Partial state update for video generation
 */
export type VideoGenerationStateUpdate = Partial<VideoGenerationState>

/**
 * Partial state update for video player
 */
export type VideoPlayerStateUpdate = Partial<VideoPlayerState>

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if state is video recorder state
 */
export function isVideoRecorderState(state: unknown): state is VideoRecorderState {
  return (
    typeof state === 'object' &&
    state !== null &&
    'status' in state &&
    typeof (state as VideoRecorderState).status === 'string'
  )
}

/**
 * Check if state is video call state
 */
export function isVideoCallState(state: unknown): state is VideoCallState {
  return (
    typeof state === 'object' &&
    state !== null &&
    'status' in state &&
    typeof (state as VideoCallState).status === 'string'
  )
}

/**
 * Check if state is video generation state
 */
export function isVideoGenerationState(state: unknown): state is VideoGenerationState {
  return (
    typeof state === 'object' &&
    state !== null &&
    'status' in state &&
    typeof (state as VideoGenerationState).status === 'string'
  )
}

/**
 * Check if state is video player state
 */
export function isVideoPlayerState(state: unknown): state is VideoPlayerState {
  return (
    typeof state === 'object' &&
    state !== null &&
    'status' in state &&
    typeof (state as VideoPlayerState).status === 'string'
  )
}
