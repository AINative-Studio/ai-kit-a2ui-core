/**
 * A2UI Video Progress Tracking Message Definitions (Issue #30 - Epic 2)
 * Cross-device video progress synchronization with scene-aware resume capability
 */

import type { BaseMessage } from './protocol.js'

/**
 * Device type for progress tracking
 */
export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'tv' | 'unknown'

/**
 * Progress tracking state
 */
export type ProgressTrackingState = 'active' | 'paused' | 'completed' | 'abandoned'

/**
 * Scene/chapter information for contextual resume
 */
export interface SceneContext {
  /** Scene/chapter identifier */
  sceneId: string
  /** Scene title or name */
  title: string
  /** Scene start time in seconds */
  startTime: number
  /** Scene end time in seconds */
  endTime: number
  /** Optional scene description */
  description?: string
  /** Optional scene thumbnail URL */
  thumbnail?: string
}

/**
 * Video playback position with scene context
 */
export interface PlaybackPosition {
  /** Current playback position in seconds */
  position: number
  /** Total video duration in seconds */
  duration: number
  /** Current scene/chapter context */
  currentScene?: SceneContext
  /** Progress percentage (0-100) */
  progress: number
  /** Whether video is playing or paused */
  isPlaying: boolean
  /** Playback speed (1.0 = normal) */
  playbackRate?: number
  /** Video quality setting */
  quality?: 'auto' | 'low' | 'medium' | 'high' | '4k'
  /** Volume level (0-1) */
  volume?: number
  /** Whether video is muted */
  isMuted?: boolean
}

/**
 * Session information for multi-device tracking
 */
export interface SessionInfo {
  /** Unique session identifier */
  sessionId: string
  /** Device identifier */
  deviceId: string
  /** Device type */
  deviceType: DeviceType
  /** Device name (e.g., "John's iPhone") */
  deviceName?: string
  /** ISO 8601 timestamp when session started */
  startedAt: string
  /** ISO 8601 timestamp of last activity */
  lastActivityAt: string
  /** Optional user agent string */
  userAgent?: string
  /** Optional IP address */
  ipAddress?: string
}

// ============================================================================
// Progress Tracking Messages (Issue #30)
// ============================================================================

/**
 * Update Progress Message (Renderer → Agent)
 * Updates current playback position for a video
 */
export interface UpdateProgressMessage extends BaseMessage {
  type: 'updateProgress'
  /** Surface identifier */
  surfaceId: string
  /** Video identifier */
  videoId: string
  /** User identifier for progress tracking */
  userId: string
  /** Current playback position with context */
  position: PlaybackPosition
  /** Session information */
  session: SessionInfo
  /** Progress tracking state */
  state: ProgressTrackingState
  /** ISO 8601 timestamp of this update */
  timestamp: string
}

/**
 * Progress Sync Message (Agent → Renderer)
 * Synchronizes progress across devices or restores saved progress
 */
export interface ProgressSyncMessage extends BaseMessage {
  type: 'progressSync'
  /** Surface identifier */
  surfaceId: string
  /** Video identifier */
  videoId: string
  /** User identifier */
  userId: string
  /** Synchronized playback position */
  position: PlaybackPosition
  /** Source session that generated this sync (if from another device) */
  sourceSession?: SessionInfo
  /** All active sessions for this video */
  activeSessions?: SessionInfo[]
  /** Whether this is a resume from a previous session */
  isResume: boolean
  /** ISO 8601 timestamp of the last saved progress */
  lastSavedAt: string
  /** Optional: Next scenes/chapters for quick navigation */
  nextScenes?: SceneContext[]
}

/**
 * Request Progress Message (Agent → Renderer)
 * Requests current progress for a video
 */
export interface RequestProgressMessage extends BaseMessage {
  type: 'requestProgress'
  /** Surface identifier */
  surfaceId: string
  /** Video identifier */
  videoId: string
  /** User identifier */
  userId: string
  /** Device identifier making the request */
  deviceId: string
}

/**
 * Progress Cleared Message (Agent → Renderer)
 * Notifies that progress has been cleared for a video
 */
export interface ProgressClearedMessage extends BaseMessage {
  type: 'progressCleared'
  /** Surface identifier */
  surfaceId: string
  /** Video identifier */
  videoId: string
  /** User identifier */
  userId: string
  /** Reason for clearing (user action, expiration, etc.) */
  reason?: 'user_action' | 'expiration' | 'completion' | 'reset'
  /** ISO 8601 timestamp when cleared */
  timestamp: string
}

/**
 * Progress Conflict Message (Bidirectional)
 * Notifies about conflicting progress from multiple devices
 */
export interface ProgressConflictMessage extends BaseMessage {
  type: 'progressConflict'
  /** Surface identifier */
  surfaceId: string
  /** Video identifier */
  videoId: string
  /** User identifier */
  userId: string
  /** Conflicting sessions */
  conflictingSessions: SessionInfo[]
  /** Suggested resolution strategy */
  resolution: 'use_latest' | 'use_furthest' | 'prompt_user'
  /** ISO 8601 timestamp of conflict detection */
  timestamp: string
}

// ============================================================================
// Union Types
// ============================================================================

/**
 * All progress tracking message types
 */
export type ProgressTrackingMessage =
  | UpdateProgressMessage
  | ProgressSyncMessage
  | RequestProgressMessage
  | ProgressClearedMessage
  | ProgressConflictMessage

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for UpdateProgressMessage
 */
export function isUpdateProgressMessage(msg: unknown): msg is UpdateProgressMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as any).type === 'updateProgress'
  )
}

/**
 * Type guard for ProgressSyncMessage
 */
export function isProgressSyncMessage(msg: unknown): msg is ProgressSyncMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as any).type === 'progressSync'
  )
}

/**
 * Type guard for RequestProgressMessage
 */
export function isRequestProgressMessage(msg: unknown): msg is RequestProgressMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as any).type === 'requestProgress'
  )
}

/**
 * Type guard for ProgressClearedMessage
 */
export function isProgressClearedMessage(msg: unknown): msg is ProgressClearedMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as any).type === 'progressCleared'
  )
}

/**
 * Type guard for ProgressConflictMessage
 */
export function isProgressConflictMessage(msg: unknown): msg is ProgressConflictMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as any).type === 'progressConflict'
  )
}

/**
 * Type guard for any progress tracking message
 */
export function isProgressTrackingMessage(msg: unknown): msg is ProgressTrackingMessage {
  return (
    isUpdateProgressMessage(msg) ||
    isProgressSyncMessage(msg) ||
    isRequestProgressMessage(msg) ||
    isProgressClearedMessage(msg) ||
    isProgressConflictMessage(msg)
  )
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate progress percentage from position and duration
 */
export function calculateProgress(position: number, duration: number): number {
  if (duration <= 0) return 0
  return Math.min(100, Math.max(0, (position / duration) * 100))
}

/**
 * Determine if a video should be considered completed
 * @param position Current position in seconds
 * @param duration Total duration in seconds
 * @param threshold Completion threshold percentage (default: 95%)
 */
export function isVideoCompleted(
  position: number,
  duration: number,
  threshold: number = 95
): boolean {
  const progress = calculateProgress(position, duration)
  return progress >= threshold
}

/**
 * Find the current scene based on playback position
 */
export function findCurrentScene(
  position: number,
  scenes: SceneContext[]
): SceneContext | undefined {
  return scenes.find(
    scene => position >= scene.startTime && position < scene.endTime
  )
}

/**
 * Get next scenes for navigation
 */
export function getNextScenes(
  currentPosition: number,
  scenes: SceneContext[],
  limit: number = 3
): SceneContext[] {
  return scenes
    .filter(scene => scene.startTime > currentPosition)
    .slice(0, limit)
}

/**
 * Resolve progress conflict using specified strategy
 */
export function resolveProgressConflict(
  sessions: SessionInfo[],
  positions: Map<string, PlaybackPosition>,
  strategy: 'use_latest' | 'use_furthest'
): SessionInfo | undefined {
  if (sessions.length === 0) return undefined

  if (strategy === 'use_latest') {
    return sessions.reduce((latest, current) =>
      new Date(current.lastActivityAt) > new Date(latest.lastActivityAt)
        ? current
        : latest
    )
  }

  if (strategy === 'use_furthest') {
    let furthestSession: SessionInfo | undefined = undefined
    let furthestPosition = -1

    for (const session of sessions) {
      const position = positions.get(session.sessionId)
      if (position && position.position > furthestPosition) {
        furthestPosition = position.position
        furthestSession = session
      }
    }

    return furthestSession
  }

  return undefined
}
