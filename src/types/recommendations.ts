/**
 * A2UI Video Recommendation Message Definitions (Issue #32 - Epic 2)
 * Hybrid AI video recommendations (content + collaborative + contextual)
 */

import type { BaseMessage } from './protocol.js'

/**
 * Recommendation strategy for hybrid AI scoring
 */
export type RecommendationStrategy = 'content' | 'collaborative' | 'hybrid'

/**
 * Video Recommendation
 * Represents a single video recommendation with scoring metadata
 */
export interface VideoRecommendation {
  /** Unique video identifier */
  videoId: string
  /** Video title */
  title: string
  /** Video thumbnail URL */
  thumbnail: string
  /** Human-readable reason for recommendation */
  reason: string
  /** Recommendation confidence score (0-1) */
  confidence: number
  /** Video metadata */
  metadata: {
    /** Duration in seconds */
    duration: number
    /** Video topics/categories */
    topics: string[]
    /** Video summary */
    summary: string
    /** Optional view count */
    viewCount?: number
    /** Optional rating (0-5) */
    rating?: number
  }
  /** Optional hybrid scoring breakdown */
  scores?: {
    /** Content-based similarity score (0-1) */
    content?: number
    /** Collaborative filtering score (0-1) */
    collaborative?: number
    /** Contextual relevance score (0-1) */
    contextual?: number
  }
}

/**
 * Request Recommendations Message (Agent → Renderer)
 * Agent requests personalized video recommendations using hybrid AI scoring
 */
export interface RequestRecommendationsMessage extends BaseMessage {
  type: 'requestRecommendations'
  /** Surface identifier */
  surfaceId: string
  /** User identifier for personalization */
  userId: string
  /** Optional context for recommendations */
  context?: {
    /** Current video being watched */
    currentVideoId?: string
    /** Recently viewed topics */
    recentTopics?: string[]
    /** Session duration in minutes */
    sessionDuration?: number
    /** Device type (for contextual recommendations) */
    device?: 'desktop' | 'mobile' | 'tablet'
    /** Time of day (for contextual recommendations) */
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'
  }
  /** Recommendation strategy */
  strategy?: RecommendationStrategy
  /** Maximum number of recommendations (default: 5) */
  limit?: number
}

/**
 * Recommendations Message (Renderer → Agent)
 * Returns personalized video recommendations with hybrid AI scoring
 */
export interface RecommendationsMessage extends BaseMessage {
  type: 'recommendations'
  /** Surface identifier */
  surfaceId: string
  /** List of recommended videos */
  recommendations: VideoRecommendation[]
  /** Strategy used for recommendations */
  strategy: RecommendationStrategy
  /** ISO 8601 timestamp when recommendations were generated */
  generatedAt: string
  /** Optional metadata about the recommendation process */
  metadata?: {
    /** Total videos evaluated */
    totalEvaluated?: number
    /** Processing time in milliseconds */
    processingTimeMs?: number
    /** Hybrid strategy weights if applicable */
    weights?: {
      content?: number
      collaborative?: number
      contextual?: number
    }
  }
}

/**
 * Union of all recommendation message types
 */
export type RecommendationMessage =
  | RequestRecommendationsMessage
  | RecommendationsMessage

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for RequestRecommendationsMessage
 */
export function isRequestRecommendationsMessage(
  msg: unknown
): msg is RequestRecommendationsMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as any).type === 'requestRecommendations'
  )
}

/**
 * Type guard for RecommendationsMessage
 */
export function isRecommendationsMessage(msg: unknown): msg is RecommendationsMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as any).type === 'recommendations'
  )
}

/**
 * Type guard for any recommendation message
 */
export function isRecommendationMessage(msg: unknown): msg is RecommendationMessage {
  return isRequestRecommendationsMessage(msg) || isRecommendationsMessage(msg)
}
