/**
 * Recommendation Message Types Tests
 * Tests for Issue #32: Hybrid AI recommendation message type definitions
 */

import { describe, it, expect } from 'vitest'
import type {
  RequestRecommendationsMessage,
  RecommendationsMessage,
  VideoRecommendation,
  RecommendationStrategy,
} from '../../src/types/recommendations.js'
import {
  isRequestRecommendationsMessage,
  isRecommendationsMessage,
  isRecommendationMessage,
} from '../../src/types/recommendations.js'

describe('Recommendation Message Types - Issue #32', () => {
  describe('RequestRecommendationsMessage', () => {
    it('should have all required properties', () => {
      const message: RequestRecommendationsMessage = {
        type: 'requestRecommendations',
        surfaceId: 'video-surface-1',
        userId: 'user-123',
      }

      expect(message.type).toBe('requestRecommendations')
      expect(message.surfaceId).toBe('video-surface-1')
      expect(message.userId).toBe('user-123')
    })

    it('should support all recommendation strategies', () => {
      const strategies: RecommendationStrategy[] = ['content', 'collaborative', 'hybrid']

      strategies.forEach(strategy => {
        const message: RequestRecommendationsMessage = {
          type: 'requestRecommendations',
          surfaceId: 'video-surface-1',
          userId: 'user-123',
          strategy,
        }
        expect(message.strategy).toBe(strategy)
      })
    })

    it('should support optional context properties', () => {
      const message: RequestRecommendationsMessage = {
        type: 'requestRecommendations',
        surfaceId: 'video-surface-1',
        userId: 'user-123',
        context: {
          currentVideoId: 'video-001',
          recentTopics: ['typescript', 'react'],
          sessionDuration: 30,
          device: 'desktop',
          timeOfDay: 'afternoon',
        },
      }

      expect(message.context?.currentVideoId).toBe('video-001')
      expect(message.context?.recentTopics).toHaveLength(2)
      expect(message.context?.device).toBe('desktop')
    })

    it('should identify request messages with type guard', () => {
      const message = {
        type: 'requestRecommendations',
        surfaceId: 'video-surface-1',
        userId: 'user-123',
      }

      expect(isRequestRecommendationsMessage(message)).toBe(true)
    })

    it('should reject invalid messages', () => {
      expect(isRequestRecommendationsMessage(null)).toBe(false)
      expect(isRequestRecommendationsMessage({ type: 'other' })).toBe(false)
    })
  })

  describe('RecommendationsMessage', () => {
    it('should have all required properties', () => {
      const message: RecommendationsMessage = {
        type: 'recommendations',
        surfaceId: 'video-surface-1',
        recommendations: [],
        strategy: 'hybrid',
        generatedAt: '2026-02-10T10:00:00Z',
      }

      expect(message.type).toBe('recommendations')
      expect(message.surfaceId).toBe('video-surface-1')
      expect(message.strategy).toBe('hybrid')
      expect(message.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })

    it('should support single recommendation', () => {
      const recommendation: VideoRecommendation = {
        videoId: 'video-001',
        title: 'TypeScript Tutorial',
        thumbnail: 'https://example.com/thumb.jpg',
        reason: 'Based on your interest',
        confidence: 0.92,
        metadata: {
          duration: 1200,
          topics: ['typescript'],
          summary: 'Learn TypeScript',
        },
      }

      const message: RecommendationsMessage = {
        type: 'recommendations',
        surfaceId: 'video-surface-1',
        recommendations: [recommendation],
        strategy: 'content',
        generatedAt: '2026-02-10T10:00:00Z',
      }

      expect(message.recommendations).toHaveLength(1)
      expect(message.recommendations[0].confidence).toBe(0.92)
    })

    it('should identify recommendations messages with type guard', () => {
      const message = {
        type: 'recommendations',
        surfaceId: 'video-surface-1',
        recommendations: [],
        strategy: 'hybrid',
        generatedAt: '2026-02-10T10:00:00Z',
      }

      expect(isRecommendationsMessage(message)).toBe(true)
    })
  })

  describe('VideoRecommendation', () => {
    it('should support hybrid scoring with individual scores', () => {
      const recommendation: VideoRecommendation = {
        videoId: 'video-123',
        title: 'Hybrid Recommended Video',
        thumbnail: 'https://example.com/thumb.jpg',
        reason: 'Multi-factor recommendation',
        confidence: 0.91,
        metadata: {
          duration: 900,
          topics: ['hybrid'],
          summary: 'Content with hybrid scoring',
        },
        scores: {
          content: 0.95,
          collaborative: 0.88,
          contextual: 0.90,
        },
      }

      expect(recommendation.scores).toBeDefined()
      expect(recommendation.scores?.content).toBe(0.95)
      expect(recommendation.scores?.collaborative).toBe(0.88)
      expect(recommendation.scores?.contextual).toBe(0.90)
    })

    it('should support optional metadata fields', () => {
      const recommendation: VideoRecommendation = {
        videoId: 'video-123',
        title: 'Popular Video',
        thumbnail: 'https://example.com/thumb.jpg',
        reason: 'Trending',
        confidence: 0.95,
        metadata: {
          duration: 600,
          topics: ['trending'],
          summary: 'Viral content',
          viewCount: 1000000,
          rating: 4.8,
        },
      }

      expect(recommendation.metadata.viewCount).toBe(1000000)
      expect(recommendation.metadata.rating).toBe(4.8)
    })
  })

  describe('Generic recommendation message type guard', () => {
    it('should identify both message types', () => {
      const request = {
        type: 'requestRecommendations',
        surfaceId: 'video-surface-1',
        userId: 'user-123',
      }

      const response = {
        type: 'recommendations',
        surfaceId: 'video-surface-1',
        recommendations: [],
        strategy: 'hybrid',
        generatedAt: '2026-02-10T10:00:00Z',
      }

      expect(isRecommendationMessage(request)).toBe(true)
      expect(isRecommendationMessage(response)).toBe(true)
    })
  })
})
