/**
 * A2UI Recommendation Protocol Message Definitions
 * Extends base A2UI protocol with AI-powered recommendation capabilities
 */

import type { BaseMessage } from './protocol.js'

/**
 * Recommendation message types
 */
export type RecommendationMessageType =
  | 'requestRecommendations'
  | 'recommendationsGenerated'
  | 'recommendationSelected'
  | 'recommendationFeedback'

/**
 * Recommendation type categories
 */
export type RecommendationType = 'content' | 'action' | 'navigation' | 'product' | 'user'

/**
 * Hybrid scoring algorithm type
 */
export type ScoringAlgorithm = 'collaborative' | 'content-based' | 'hybrid' | 'ai-powered'

/**
 * Recommendation confidence level
 */
export type ConfidenceLevel = 'low' | 'medium' | 'high' | 'very-high'

/**
 * Feedback sentiment
 */
export type FeedbackSentiment = 'positive' | 'negative' | 'neutral'

/**
 * Individual recommendation item
 */
export interface RecommendationItem {
  /** Unique recommendation identifier */
  id: string
  /** Recommendation type */
  type: RecommendationType
  /** Display title */
  title: string
  /** Description or explanation */
  description?: string
  /** Recommendation score (0-1) */
  score: number
  /** Confidence level */
  confidence: ConfidenceLevel
  /** Scoring algorithm used */
  algorithm: ScoringAlgorithm
  /** Optional metadata */
  metadata?: Record<string, unknown>
  /** Optional thumbnail/image URL */
  thumbnailUrl?: string
  /** Optional action URL */
  actionUrl?: string
  /** Optional tags */
  tags?: string[]
}

/**
 * Hybrid scoring configuration
 */
export interface HybridScoringConfig {
  /** Algorithm to use */
  algorithm: ScoringAlgorithm
  /** Weight for collaborative filtering (0-1) */
  collaborativeWeight?: number
  /** Weight for content-based filtering (0-1) */
  contentWeight?: number
  /** Weight for AI-powered scoring (0-1) */
  aiWeight?: number
  /** Minimum score threshold (0-1) */
  minScore?: number
  /** Maximum recommendations to return */
  maxResults?: number
  /** Enable diversity in results */
  diversify?: boolean
}

// ============================================================================
// Recommendation Messages (Epic 2, Issue #33)
// ============================================================================

/**
 * Request Recommendations Message (Agent → Renderer)
 * Agent requests AI-powered recommendations
 */
export interface RequestRecommendationsMessage extends BaseMessage {
  type: 'requestRecommendations'
  /** Surface identifier */
  surfaceId: string
  /** Unique request identifier */
  requestId: string
  /** Recommendation type to generate */
  recommendationType: RecommendationType
  /** User context for personalization */
  context?: {
    /** Current user identifier */
    userId?: string
    /** User preferences */
    preferences?: Record<string, unknown>
    /** User history */
    history?: Array<{ itemId: string; timestamp: string; action: string }>
    /** Current session data */
    sessionData?: Record<string, unknown>
  }
  /** Hybrid scoring configuration */
  scoringConfig?: HybridScoringConfig
}

/**
 * Recommendations Generated Message (Renderer → Agent)
 * Sent when recommendations are generated and ready
 */
export interface RecommendationsGeneratedMessage extends BaseMessage {
  type: 'recommendationsGenerated'
  /** Surface identifier */
  surfaceId: string
  /** Request identifier this responds to */
  requestId: string
  /** Generated recommendations */
  recommendations: RecommendationItem[]
  /** Algorithm used */
  algorithm: ScoringAlgorithm
  /** Total candidates evaluated */
  totalCandidates?: number
  /** Processing time in milliseconds */
  processingTime?: number
  /** ISO 8601 timestamp when generated */
  timestamp: string
}

/**
 * Recommendation Selected Message (Renderer → Agent)
 * Sent when user selects a recommendation
 */
export interface RecommendationSelectedMessage extends BaseMessage {
  type: 'recommendationSelected'
  /** Surface identifier */
  surfaceId: string
  /** Request identifier */
  requestId: string
  /** Selected recommendation identifier */
  recommendationId: string
  /** Position in the recommendation list (0-indexed) */
  position: number
  /** ISO 8601 timestamp when selected */
  timestamp: string
  /** Optional interaction context */
  context?: Record<string, unknown>
}

/**
 * Recommendation Feedback Message (Renderer → Agent)
 * Sent when user provides feedback on a recommendation
 */
export interface RecommendationFeedbackMessage extends BaseMessage {
  type: 'recommendationFeedback'
  /** Surface identifier */
  surfaceId: string
  /** Request identifier */
  requestId: string
  /** Recommendation identifier */
  recommendationId: string
  /** Feedback sentiment */
  sentiment: FeedbackSentiment
  /** Optional rating (1-5) */
  rating?: number
  /** Optional feedback text */
  comment?: string
  /** ISO 8601 timestamp when feedback was given */
  timestamp: string
}

// ============================================================================
// Union Types
// ============================================================================

/**
 * All recommendation message types
 */
export type RecommendationMessage =
  | RequestRecommendationsMessage
  | RecommendationsGeneratedMessage
  | RecommendationSelectedMessage
  | RecommendationFeedbackMessage

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for RequestRecommendationsMessage
 */
export function isRequestRecommendationsMessage(msg: unknown): msg is RequestRecommendationsMessage {
  return typeof msg === 'object' && msg !== null && (msg as any).type === 'requestRecommendations'
}

/**
 * Type guard for RecommendationsGeneratedMessage
 */
export function isRecommendationsGeneratedMessage(msg: unknown): msg is RecommendationsGeneratedMessage {
  return typeof msg === 'object' && msg !== null && (msg as any).type === 'recommendationsGenerated'
}

/**
 * Type guard for RecommendationSelectedMessage
 */
export function isRecommendationSelectedMessage(msg: unknown): msg is RecommendationSelectedMessage {
  return typeof msg === 'object' && msg !== null && (msg as any).type === 'recommendationSelected'
}

/**
 * Type guard for RecommendationFeedbackMessage
 */
export function isRecommendationFeedbackMessage(msg: unknown): msg is RecommendationFeedbackMessage {
  return typeof msg === 'object' && msg !== null && (msg as any).type === 'recommendationFeedback'
}

/**
 * Type guard for any recommendation message
 */
export function isRecommendationMessage(msg: unknown): msg is RecommendationMessage {
  return (
    isRequestRecommendationsMessage(msg) ||
    isRecommendationsGeneratedMessage(msg) ||
    isRecommendationSelectedMessage(msg) ||
    isRecommendationFeedbackMessage(msg)
  )
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate confidence level based on score
 */
export function calculateConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 0.8) return 'very-high'
  if (score >= 0.6) return 'high'
  if (score >= 0.4) return 'medium'
  return 'low'
}

/**
 * Validate hybrid scoring configuration
 */
export function validateScoringConfig(config: HybridScoringConfig): boolean {
  // Check weights sum to approximately 1.0 if using hybrid
  if (config.algorithm === 'hybrid') {
    const totalWeight =
      (config.collaborativeWeight ?? 0) + (config.contentWeight ?? 0) + (config.aiWeight ?? 0)

    if (Math.abs(totalWeight - 1.0) > 0.01) {
      return false
    }
  }

  // Check score threshold is valid
  if (config.minScore !== undefined && (config.minScore < 0 || config.minScore > 1)) {
    return false
  }

  // Check max results is positive
  if (config.maxResults !== undefined && config.maxResults <= 0) {
    return false
  }

  return true
}

/**
 * Normalize recommendation scores to 0-1 range
 */
export function normalizeScores(items: RecommendationItem[]): RecommendationItem[] {
  if (items.length === 0) return items

  const maxScore = Math.max(...items.map((item) => item.score))
  const minScore = Math.min(...items.map((item) => item.score))
  const range = maxScore - minScore

  // If all scores are the same, return as is
  if (range === 0) return items

  return items.map((item) => ({
    ...item,
    score: (item.score - minScore) / range,
    confidence: calculateConfidenceLevel((item.score - minScore) / range),
  }))
}

/**
 * Sort recommendations by score (descending)
 */
export function sortByScore(items: RecommendationItem[]): RecommendationItem[] {
  return [...items].sort((a, b) => b.score - a.score)
}

/**
 * Filter recommendations by minimum score
 */
export function filterByMinScore(items: RecommendationItem[], minScore: number): RecommendationItem[] {
  return items.filter((item) => item.score >= minScore)
}

/**
 * Apply diversity to recommendations (avoid too similar items)
 */
export function applyDiversity(items: RecommendationItem[], diversityThreshold = 0.3): RecommendationItem[] {
  const diverse: RecommendationItem[] = []

  for (const item of items) {
    // Check if item is sufficiently different from already selected items
    const isDiverse = diverse.every((selected) => {
      // Simple diversity check based on tags overlap
      const itemTags = new Set(item.tags ?? [])
      const selectedTags = new Set(selected.tags ?? [])
      const overlap = [...itemTags].filter((tag) => selectedTags.has(tag)).length
      const totalUnique = new Set([...itemTags, ...selectedTags]).size

      return totalUnique === 0 || overlap / totalUnique < diversityThreshold
    })

    if (isDiverse) {
      diverse.push(item)
    }
  }

  return diverse
}
