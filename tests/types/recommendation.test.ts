/**
 * Tests for Recommendation Types
 */

import { describe, it, expect } from 'vitest'
import type {
  RecommendationItem,
  HybridScoringConfig,
  RequestRecommendationsMessage,
  RecommendationsGeneratedMessage,
  RecommendationSelectedMessage,
  RecommendationFeedbackMessage,
} from '../../src/types/recommendation.js'
import {
  isRequestRecommendationsMessage,
  isRecommendationsGeneratedMessage,
  isRecommendationSelectedMessage,
  isRecommendationFeedbackMessage,
  isRecommendationMessage,
  calculateConfidenceLevel,
  validateScoringConfig,
  normalizeScores,
  sortByScore,
  filterByMinScore,
  applyDiversity,
} from '../../src/types/recommendation.js'

describe('Recommendation Type Guards', () => {
  describe('isRequestRecommendationsMessage', () => {
    it('should return true for valid request recommendations message', () => {
      const message: RequestRecommendationsMessage = {
        type: 'requestRecommendations',
        surfaceId: 'surface-1',
        requestId: 'req-1',
        recommendationType: 'content',
      }

      expect(isRequestRecommendationsMessage(message)).toBe(true)
    })

    it('should return false for other message types', () => {
      expect(isRequestRecommendationsMessage({ type: 'recommendationsGenerated' })).toBe(false)
      expect(isRequestRecommendationsMessage(null)).toBe(false)
      expect(isRequestRecommendationsMessage(undefined)).toBe(false)
      expect(isRequestRecommendationsMessage('string')).toBe(false)
    })
  })

  describe('isRecommendationsGeneratedMessage', () => {
    it('should return true for valid recommendations generated message', () => {
      const message: RecommendationsGeneratedMessage = {
        type: 'recommendationsGenerated',
        surfaceId: 'surface-1',
        requestId: 'req-1',
        recommendations: [],
        algorithm: 'hybrid',
        timestamp: new Date().toISOString(),
      }

      expect(isRecommendationsGeneratedMessage(message)).toBe(true)
    })

    it('should return false for other message types', () => {
      expect(isRecommendationsGeneratedMessage({ type: 'requestRecommendations' })).toBe(false)
      expect(isRecommendationsGeneratedMessage(null)).toBe(false)
    })
  })

  describe('isRecommendationSelectedMessage', () => {
    it('should return true for valid recommendation selected message', () => {
      const message: RecommendationSelectedMessage = {
        type: 'recommendationSelected',
        surfaceId: 'surface-1',
        requestId: 'req-1',
        recommendationId: 'rec-1',
        position: 0,
        timestamp: new Date().toISOString(),
      }

      expect(isRecommendationSelectedMessage(message)).toBe(true)
    })

    it('should return false for other message types', () => {
      expect(isRecommendationSelectedMessage({ type: 'requestRecommendations' })).toBe(false)
      expect(isRecommendationSelectedMessage(null)).toBe(false)
    })
  })

  describe('isRecommendationFeedbackMessage', () => {
    it('should return true for valid recommendation feedback message', () => {
      const message: RecommendationFeedbackMessage = {
        type: 'recommendationFeedback',
        surfaceId: 'surface-1',
        requestId: 'req-1',
        recommendationId: 'rec-1',
        sentiment: 'positive',
        timestamp: new Date().toISOString(),
      }

      expect(isRecommendationFeedbackMessage(message)).toBe(true)
    })

    it('should return false for other message types', () => {
      expect(isRecommendationFeedbackMessage({ type: 'requestRecommendations' })).toBe(false)
      expect(isRecommendationFeedbackMessage(null)).toBe(false)
    })
  })

  describe('isRecommendationMessage', () => {
    it('should return true for any valid recommendation message', () => {
      const messages = [
        { type: 'requestRecommendations', surfaceId: 's1', requestId: 'r1', recommendationType: 'content' },
        { type: 'recommendationsGenerated', surfaceId: 's1', requestId: 'r1', recommendations: [], algorithm: 'hybrid', timestamp: '' },
        { type: 'recommendationSelected', surfaceId: 's1', requestId: 'r1', recommendationId: 'rec1', position: 0, timestamp: '' },
        { type: 'recommendationFeedback', surfaceId: 's1', requestId: 'r1', recommendationId: 'rec1', sentiment: 'positive', timestamp: '' },
      ]

      messages.forEach((msg) => {
        expect(isRecommendationMessage(msg)).toBe(true)
      })
    })

    it('should return false for non-recommendation messages', () => {
      expect(isRecommendationMessage({ type: 'createSurface' })).toBe(false)
      expect(isRecommendationMessage(null)).toBe(false)
      expect(isRecommendationMessage('string')).toBe(false)
    })
  })
})

describe('Utility Functions', () => {
  describe('calculateConfidenceLevel', () => {
    it('should return very-high for score >= 0.8', () => {
      expect(calculateConfidenceLevel(0.8)).toBe('very-high')
      expect(calculateConfidenceLevel(0.9)).toBe('very-high')
      expect(calculateConfidenceLevel(1.0)).toBe('very-high')
    })

    it('should return high for score >= 0.6 and < 0.8', () => {
      expect(calculateConfidenceLevel(0.6)).toBe('high')
      expect(calculateConfidenceLevel(0.7)).toBe('high')
      expect(calculateConfidenceLevel(0.79)).toBe('high')
    })

    it('should return medium for score >= 0.4 and < 0.6', () => {
      expect(calculateConfidenceLevel(0.4)).toBe('medium')
      expect(calculateConfidenceLevel(0.5)).toBe('medium')
      expect(calculateConfidenceLevel(0.59)).toBe('medium')
    })

    it('should return low for score < 0.4', () => {
      expect(calculateConfidenceLevel(0.0)).toBe('low')
      expect(calculateConfidenceLevel(0.2)).toBe('low')
      expect(calculateConfidenceLevel(0.39)).toBe('low')
    })
  })

  describe('validateScoringConfig', () => {
    it('should validate hybrid config with correct weights', () => {
      const config: HybridScoringConfig = {
        algorithm: 'hybrid',
        collaborativeWeight: 0.4,
        contentWeight: 0.3,
        aiWeight: 0.3,
      }

      expect(validateScoringConfig(config)).toBe(true)
    })

    it('should reject hybrid config with incorrect weight sum', () => {
      const config: HybridScoringConfig = {
        algorithm: 'hybrid',
        collaborativeWeight: 0.5,
        contentWeight: 0.3,
        aiWeight: 0.1,
      }

      expect(validateScoringConfig(config)).toBe(false)
    })

    it('should validate non-hybrid algorithms without weight validation', () => {
      const configs: HybridScoringConfig[] = [
        { algorithm: 'collaborative' },
        { algorithm: 'content-based' },
        { algorithm: 'ai-powered' },
      ]

      configs.forEach((config) => {
        expect(validateScoringConfig(config)).toBe(true)
      })
    })

    it('should reject invalid minScore values', () => {
      const configs: HybridScoringConfig[] = [
        { algorithm: 'collaborative', minScore: -0.1 },
        { algorithm: 'collaborative', minScore: 1.1 },
      ]

      configs.forEach((config) => {
        expect(validateScoringConfig(config)).toBe(false)
      })
    })

    it('should reject invalid maxResults values', () => {
      const config: HybridScoringConfig = {
        algorithm: 'collaborative',
        maxResults: 0,
      }

      expect(validateScoringConfig(config)).toBe(false)
    })

    it('should accept valid minScore and maxResults', () => {
      const config: HybridScoringConfig = {
        algorithm: 'collaborative',
        minScore: 0.5,
        maxResults: 10,
      }

      expect(validateScoringConfig(config)).toBe(true)
    })

    it('should handle edge case where weights sum to exactly 1.0', () => {
      const config: HybridScoringConfig = {
        algorithm: 'hybrid',
        collaborativeWeight: 0.33,
        contentWeight: 0.33,
        aiWeight: 0.34,
      }

      expect(validateScoringConfig(config)).toBe(true)
    })
  })

  describe('normalizeScores', () => {
    it('should normalize scores to 0-1 range', () => {
      const items: RecommendationItem[] = [
        { id: 'rec-1', type: 'content', title: 'Item 1', score: 10, confidence: 'low', algorithm: 'hybrid' },
        { id: 'rec-2', type: 'content', title: 'Item 2', score: 5, confidence: 'low', algorithm: 'hybrid' },
        { id: 'rec-3', type: 'content', title: 'Item 3', score: 0, confidence: 'low', algorithm: 'hybrid' },
      ]

      const normalized = normalizeScores(items)

      expect(normalized[0].score).toBe(1)
      expect(normalized[1].score).toBe(0.5)
      expect(normalized[2].score).toBe(0)
    })

    it('should update confidence levels after normalization', () => {
      const items: RecommendationItem[] = [
        { id: 'rec-1', type: 'content', title: 'Item 1', score: 100, confidence: 'low', algorithm: 'hybrid' },
        { id: 'rec-2', type: 'content', title: 'Item 2', score: 50, confidence: 'low', algorithm: 'hybrid' },
      ]

      const normalized = normalizeScores(items)

      expect(normalized[0].confidence).toBe('very-high') // score = 1
      expect(normalized[1].confidence).toBe('low') // score = 0
    })

    it('should handle empty array', () => {
      const items: RecommendationItem[] = []
      const normalized = normalizeScores(items)

      expect(normalized).toEqual([])
    })

    it('should handle single item', () => {
      const items: RecommendationItem[] = [
        { id: 'rec-1', type: 'content', title: 'Item 1', score: 0.5, confidence: 'medium', algorithm: 'hybrid' },
      ]

      const normalized = normalizeScores(items)

      expect(normalized).toEqual(items)
    })

    it('should handle items with same scores', () => {
      const items: RecommendationItem[] = [
        { id: 'rec-1', type: 'content', title: 'Item 1', score: 0.5, confidence: 'medium', algorithm: 'hybrid' },
        { id: 'rec-2', type: 'content', title: 'Item 2', score: 0.5, confidence: 'medium', algorithm: 'hybrid' },
      ]

      const normalized = normalizeScores(items)

      expect(normalized).toEqual(items)
    })
  })

  describe('sortByScore', () => {
    it('should sort items by score in descending order', () => {
      const items: RecommendationItem[] = [
        { id: 'rec-1', type: 'content', title: 'Low', score: 0.3, confidence: 'low', algorithm: 'hybrid' },
        { id: 'rec-2', type: 'content', title: 'High', score: 0.9, confidence: 'very-high', algorithm: 'hybrid' },
        { id: 'rec-3', type: 'content', title: 'Medium', score: 0.6, confidence: 'medium', algorithm: 'hybrid' },
      ]

      const sorted = sortByScore(items)

      expect(sorted[0].id).toBe('rec-2')
      expect(sorted[1].id).toBe('rec-3')
      expect(sorted[2].id).toBe('rec-1')
    })

    it('should not modify original array', () => {
      const items: RecommendationItem[] = [
        { id: 'rec-1', type: 'content', title: 'Item 1', score: 0.3, confidence: 'low', algorithm: 'hybrid' },
        { id: 'rec-2', type: 'content', title: 'Item 2', score: 0.9, confidence: 'very-high', algorithm: 'hybrid' },
      ]

      const sorted = sortByScore(items)

      expect(items[0].id).toBe('rec-1')
      expect(sorted[0].id).toBe('rec-2')
    })

    it('should handle empty array', () => {
      const items: RecommendationItem[] = []
      const sorted = sortByScore(items)

      expect(sorted).toEqual([])
    })
  })

  describe('filterByMinScore', () => {
    it('should filter items below minimum score', () => {
      const items: RecommendationItem[] = [
        { id: 'rec-1', type: 'content', title: 'High', score: 0.9, confidence: 'very-high', algorithm: 'hybrid' },
        { id: 'rec-2', type: 'content', title: 'Medium', score: 0.6, confidence: 'medium', algorithm: 'hybrid' },
        { id: 'rec-3', type: 'content', title: 'Low', score: 0.3, confidence: 'low', algorithm: 'hybrid' },
      ]

      const filtered = filterByMinScore(items, 0.5)

      expect(filtered.length).toBe(2)
      expect(filtered[0].id).toBe('rec-1')
      expect(filtered[1].id).toBe('rec-2')
    })

    it('should include items with score equal to minimum', () => {
      const items: RecommendationItem[] = [
        { id: 'rec-1', type: 'content', title: 'Exact', score: 0.5, confidence: 'medium', algorithm: 'hybrid' },
        { id: 'rec-2', type: 'content', title: 'Below', score: 0.4, confidence: 'medium', algorithm: 'hybrid' },
      ]

      const filtered = filterByMinScore(items, 0.5)

      expect(filtered.length).toBe(1)
      expect(filtered[0].id).toBe('rec-1')
    })

    it('should handle empty array', () => {
      const items: RecommendationItem[] = []
      const filtered = filterByMinScore(items, 0.5)

      expect(filtered).toEqual([])
    })

    it('should return all items if all meet minimum score', () => {
      const items: RecommendationItem[] = [
        { id: 'rec-1', type: 'content', title: 'Item 1', score: 0.9, confidence: 'very-high', algorithm: 'hybrid' },
        { id: 'rec-2', type: 'content', title: 'Item 2', score: 0.8, confidence: 'high', algorithm: 'hybrid' },
      ]

      const filtered = filterByMinScore(items, 0.5)

      expect(filtered.length).toBe(2)
    })
  })

  describe('applyDiversity', () => {
    it('should remove items that are too similar based on tags', () => {
      const items: RecommendationItem[] = [
        {
          id: 'rec-1',
          type: 'content',
          title: 'Tech Article 1',
          score: 0.9,
          confidence: 'very-high',
          algorithm: 'hybrid',
          tags: ['tech', 'ai', 'ml'],
        },
        {
          id: 'rec-2',
          type: 'content',
          title: 'Tech Article 2',
          score: 0.85,
          confidence: 'very-high',
          algorithm: 'hybrid',
          tags: ['tech', 'ai', 'ml'],
        },
        {
          id: 'rec-3',
          type: 'content',
          title: 'Sports Article',
          score: 0.8,
          confidence: 'high',
          algorithm: 'hybrid',
          tags: ['sports', 'basketball'],
        },
      ]

      const diverse = applyDiversity(items, 0.5)

      expect(diverse.length).toBeLessThan(items.length)
      expect(diverse.find((item) => item.id === 'rec-1')).toBeDefined()
      expect(diverse.find((item) => item.id === 'rec-3')).toBeDefined()
    })

    it('should keep items without tags', () => {
      const items: RecommendationItem[] = [
        {
          id: 'rec-1',
          type: 'content',
          title: 'Item 1',
          score: 0.9,
          confidence: 'very-high',
          algorithm: 'hybrid',
        },
        {
          id: 'rec-2',
          type: 'content',
          title: 'Item 2',
          score: 0.8,
          confidence: 'high',
          algorithm: 'hybrid',
        },
      ]

      const diverse = applyDiversity(items)

      expect(diverse.length).toBe(2)
    })

    it('should handle custom diversity threshold', () => {
      const items: RecommendationItem[] = [
        {
          id: 'rec-1',
          type: 'content',
          title: 'Article 1',
          score: 0.9,
          confidence: 'very-high',
          algorithm: 'hybrid',
          tags: ['tech'],
        },
        {
          id: 'rec-2',
          type: 'content',
          title: 'Article 2',
          score: 0.85,
          confidence: 'very-high',
          algorithm: 'hybrid',
          tags: ['tech', 'ai'],
        },
      ]

      const diverse = applyDiversity(items, 0.8)

      expect(diverse.length).toBeGreaterThanOrEqual(1)
    })

    it('should handle empty array', () => {
      const items: RecommendationItem[] = []
      const diverse = applyDiversity(items)

      expect(diverse).toEqual([])
    })

    it('should handle single item', () => {
      const items: RecommendationItem[] = [
        {
          id: 'rec-1',
          type: 'content',
          title: 'Item 1',
          score: 0.9,
          confidence: 'very-high',
          algorithm: 'hybrid',
          tags: ['tech'],
        },
      ]

      const diverse = applyDiversity(items)

      expect(diverse.length).toBe(1)
    })
  })
})
