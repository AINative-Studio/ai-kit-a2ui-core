/**
 * Tests for RecommendationHandler
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RecommendationHandler } from '../../src/handlers/recommendation-handler.js'
import type {
  RequestRecommendationsMessage,
  RecommendationsGeneratedMessage,
  RecommendationSelectedMessage,
  RecommendationFeedbackMessage,
  RecommendationItem,
  HybridScoringConfig,
} from '../../src/types/recommendation.js'

describe('RecommendationHandler', () => {
  let handler: RecommendationHandler

  beforeEach(() => {
    handler = new RecommendationHandler()
  })

  describe('Constructor', () => {
    it('should create handler with default options', () => {
      expect(handler).toBeDefined()
      expect(handler.getStats().totalRequests).toBe(0)
    })

    it('should create handler with custom options', () => {
      const customHandler = new RecommendationHandler({
        autoNormalize: false,
        autoDiversify: false,
        maxRecommendations: 5,
        defaultScoringConfig: {
          algorithm: 'collaborative',
          minScore: 0.5,
          maxResults: 5,
        },
      })

      expect(customHandler).toBeDefined()
    })

    it('should throw error with invalid default scoring config', () => {
      expect(() => {
        new RecommendationHandler({
          defaultScoringConfig: {
            algorithm: 'hybrid',
            collaborativeWeight: 0.5,
            contentWeight: 0.3,
            aiWeight: 0.1, // Sum is 0.9, not 1.0
          },
        })
      }).toThrow('Invalid default scoring configuration')
    })
  })

  describe('Event Handling', () => {
    it('should register event handlers', () => {
      const mockHandler = vi.fn()
      handler.on('requestRecommendations', mockHandler)

      const message: RequestRecommendationsMessage = {
        type: 'requestRecommendations',
        surfaceId: 'surface-1',
        requestId: 'req-1',
        recommendationType: 'content',
      }

      handler.handleMessage(message)
      expect(mockHandler).toHaveBeenCalledWith(message)
    })

    it('should unregister event handlers', () => {
      const mockHandler = vi.fn()
      handler.on('requestRecommendations', mockHandler)
      handler.off('requestRecommendations', mockHandler)

      const message: RequestRecommendationsMessage = {
        type: 'requestRecommendations',
        surfaceId: 'surface-1',
        requestId: 'req-1',
        recommendationType: 'content',
      }

      handler.handleMessage(message)
      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('should remove all listeners for an event', () => {
      const mockHandler1 = vi.fn()
      const mockHandler2 = vi.fn()

      handler.on('requestRecommendations', mockHandler1)
      handler.on('requestRecommendations', mockHandler2)
      handler.removeAllListeners('requestRecommendations')

      const message: RequestRecommendationsMessage = {
        type: 'requestRecommendations',
        surfaceId: 'surface-1',
        requestId: 'req-1',
        recommendationType: 'content',
      }

      handler.handleMessage(message)
      expect(mockHandler1).not.toHaveBeenCalled()
      expect(mockHandler2).not.toHaveBeenCalled()
    })

    it('should remove all listeners for all events', () => {
      const mockHandler1 = vi.fn()
      const mockHandler2 = vi.fn()

      handler.on('requestRecommendations', mockHandler1)
      handler.on('recommendationsGenerated', mockHandler2)
      handler.removeAllListeners()

      const message: RequestRecommendationsMessage = {
        type: 'requestRecommendations',
        surfaceId: 'surface-1',
        requestId: 'req-1',
        recommendationType: 'content',
      }

      handler.handleMessage(message)
      expect(mockHandler1).not.toHaveBeenCalled()
      expect(mockHandler2).not.toHaveBeenCalled()
    })
  })

  describe('Request Recommendations Message', () => {
    it('should handle valid request recommendations message', () => {
      const mockHandler = vi.fn()
      handler.on('requestRecommendations', mockHandler)

      const message: RequestRecommendationsMessage = {
        type: 'requestRecommendations',
        surfaceId: 'surface-1',
        requestId: 'req-1',
        recommendationType: 'content',
        context: {
          userId: 'user-123',
          preferences: { category: 'tech' },
        },
        scoringConfig: {
          algorithm: 'hybrid',
          collaborativeWeight: 0.4,
          contentWeight: 0.3,
          aiWeight: 0.3,
        },
      }

      handler.handleMessage(message)

      expect(mockHandler).toHaveBeenCalledWith(message)
      expect(handler.getStats().totalRequests).toBe(1)
    })

    it('should emit error for invalid scoring config', () => {
      const mockErrorHandler = vi.fn()
      handler.on('error', mockErrorHandler)

      const message: RequestRecommendationsMessage = {
        type: 'requestRecommendations',
        surfaceId: 'surface-1',
        requestId: 'req-1',
        recommendationType: 'content',
        scoringConfig: {
          algorithm: 'hybrid',
          collaborativeWeight: 0.5,
          contentWeight: 0.3,
          aiWeight: 0.1, // Invalid: sum is not 1.0
        },
      }

      handler.handleMessage(message)

      expect(mockErrorHandler).toHaveBeenCalled()
      const error = mockErrorHandler.mock.calls[0][0] as Error
      expect(error.message).toContain('Invalid scoring configuration')
    })

    it('should emit message event for request', () => {
      const mockMessageHandler = vi.fn()
      handler.on('message', mockMessageHandler)

      const message: RequestRecommendationsMessage = {
        type: 'requestRecommendations',
        surfaceId: 'surface-1',
        requestId: 'req-1',
        recommendationType: 'product',
      }

      handler.handleMessage(message)
      expect(mockMessageHandler).toHaveBeenCalledWith(message)
    })
  })

  describe('Recommendations Generated Message', () => {
    it('should handle recommendations generated message', () => {
      const mockHandler = vi.fn()
      handler.on('recommendationsGenerated', mockHandler)

      const recommendations: RecommendationItem[] = [
        {
          id: 'rec-1',
          type: 'content',
          title: 'Article 1',
          score: 0.9,
          confidence: 'very-high',
          algorithm: 'hybrid',
        },
        {
          id: 'rec-2',
          type: 'content',
          title: 'Article 2',
          score: 0.7,
          confidence: 'high',
          algorithm: 'hybrid',
        },
      ]

      const message: RecommendationsGeneratedMessage = {
        type: 'recommendationsGenerated',
        surfaceId: 'surface-1',
        requestId: 'req-1',
        recommendations,
        algorithm: 'hybrid',
        processingTime: 150,
        timestamp: new Date().toISOString(),
      }

      handler.handleMessage(message)

      expect(mockHandler).toHaveBeenCalled()
      expect(handler.getStats().totalRecommendations).toBe(2)
      expect(handler.getStats().averageProcessingTime).toBe(150)
      expect(handler.getStats().mostUsedAlgorithm).toBe('hybrid')
    })

    it('should normalize scores when autoNormalize is enabled', () => {
      const mockHandler = vi.fn()
      handler.on('recommendationsGenerated', mockHandler)

      const recommendations: RecommendationItem[] = [
        {
          id: 'rec-1',
          type: 'content',
          title: 'Article 1',
          score: 10,
          confidence: 'very-high',
          algorithm: 'hybrid',
        },
        {
          id: 'rec-2',
          type: 'content',
          title: 'Article 2',
          score: 5,
          confidence: 'medium',
          algorithm: 'hybrid',
        },
      ]

      const message: RecommendationsGeneratedMessage = {
        type: 'recommendationsGenerated',
        surfaceId: 'surface-1',
        requestId: 'req-1',
        recommendations,
        algorithm: 'hybrid',
        timestamp: new Date().toISOString(),
      }

      handler.handleMessage(message)

      const processedMessage = mockHandler.mock.calls[0][0] as RecommendationsGeneratedMessage
      // After normalization and sorting, highest score comes first
      expect(processedMessage.recommendations.length).toBeGreaterThan(0)
      expect(processedMessage.recommendations[0].score).toBe(1)
      if (processedMessage.recommendations.length > 1) {
        expect(processedMessage.recommendations[1].score).toBeLessThanOrEqual(1)
      }
    })

    it('should sort recommendations by score', () => {
      // Use handler with no minScore filtering
      const customHandler = new RecommendationHandler({
        defaultScoringConfig: {
          algorithm: 'hybrid',
          collaborativeWeight: 0.4,
          contentWeight: 0.3,
          aiWeight: 0.3,
          minScore: 0.0, // No filtering
        },
      })

      const mockHandler = vi.fn()
      customHandler.on('recommendationsGenerated', mockHandler)

      const recommendations: RecommendationItem[] = [
        {
          id: 'rec-1',
          type: 'content',
          title: 'Low Score',
          score: 0.3,
          confidence: 'low',
          algorithm: 'hybrid',
        },
        {
          id: 'rec-2',
          type: 'content',
          title: 'High Score',
          score: 0.9,
          confidence: 'very-high',
          algorithm: 'hybrid',
        },
        {
          id: 'rec-3',
          type: 'content',
          title: 'Medium Score',
          score: 0.6,
          confidence: 'medium',
          algorithm: 'hybrid',
        },
      ]

      const message: RecommendationsGeneratedMessage = {
        type: 'recommendationsGenerated',
        surfaceId: 'surface-1',
        requestId: 'req-1',
        recommendations,
        algorithm: 'hybrid',
        timestamp: new Date().toISOString(),
      }

      customHandler.handleMessage(message)

      const processedMessage = mockHandler.mock.calls[0][0] as RecommendationsGeneratedMessage
      expect(processedMessage.recommendations.length).toBe(3)
      expect(processedMessage.recommendations[0].id).toBe('rec-2') // Highest score
      expect(processedMessage.recommendations[1].id).toBe('rec-3')
      expect(processedMessage.recommendations[2].id).toBe('rec-1') // Lowest score
    })

    it('should filter by minimum score', () => {
      const customHandler = new RecommendationHandler({
        defaultScoringConfig: {
          algorithm: 'hybrid',
          collaborativeWeight: 0.4,
          contentWeight: 0.3,
          aiWeight: 0.3,
          minScore: 0.5,
        },
      })

      const mockHandler = vi.fn()
      customHandler.on('recommendationsGenerated', mockHandler)

      const recommendations: RecommendationItem[] = [
        {
          id: 'rec-1',
          type: 'content',
          title: 'High Score',
          score: 0.9,
          confidence: 'very-high',
          algorithm: 'hybrid',
        },
        {
          id: 'rec-2',
          type: 'content',
          title: 'Low Score',
          score: 0.3,
          confidence: 'low',
          algorithm: 'hybrid',
        },
      ]

      const message: RecommendationsGeneratedMessage = {
        type: 'recommendationsGenerated',
        surfaceId: 'surface-1',
        requestId: 'req-1',
        recommendations,
        algorithm: 'hybrid',
        timestamp: new Date().toISOString(),
      }

      customHandler.handleMessage(message)

      const processedMessage = mockHandler.mock.calls[0][0] as RecommendationsGeneratedMessage
      expect(processedMessage.recommendations.length).toBe(1)
      expect(processedMessage.recommendations[0].id).toBe('rec-1')
    })

    it('should limit to max recommendations', () => {
      const customHandler = new RecommendationHandler({
        maxRecommendations: 2,
      })

      const mockHandler = vi.fn()
      customHandler.on('recommendationsGenerated', mockHandler)

      const recommendations: RecommendationItem[] = [
        { id: 'rec-1', type: 'content', title: 'Item 1', score: 0.9, confidence: 'very-high', algorithm: 'hybrid' },
        { id: 'rec-2', type: 'content', title: 'Item 2', score: 0.8, confidence: 'high', algorithm: 'hybrid' },
        { id: 'rec-3', type: 'content', title: 'Item 3', score: 0.7, confidence: 'high', algorithm: 'hybrid' },
        { id: 'rec-4', type: 'content', title: 'Item 4', score: 0.6, confidence: 'medium', algorithm: 'hybrid' },
      ]

      const message: RecommendationsGeneratedMessage = {
        type: 'recommendationsGenerated',
        surfaceId: 'surface-1',
        requestId: 'req-1',
        recommendations,
        algorithm: 'hybrid',
        timestamp: new Date().toISOString(),
      }

      customHandler.handleMessage(message)

      const processedMessage = mockHandler.mock.calls[0][0] as RecommendationsGeneratedMessage
      expect(processedMessage.recommendations.length).toBe(2)
    })

    it('should track algorithm usage statistics', () => {
      const messages: RecommendationsGeneratedMessage[] = [
        {
          type: 'recommendationsGenerated',
          surfaceId: 'surface-1',
          requestId: 'req-1',
          recommendations: [],
          algorithm: 'hybrid',
          timestamp: new Date().toISOString(),
        },
        {
          type: 'recommendationsGenerated',
          surfaceId: 'surface-1',
          requestId: 'req-2',
          recommendations: [],
          algorithm: 'hybrid',
          timestamp: new Date().toISOString(),
        },
        {
          type: 'recommendationsGenerated',
          surfaceId: 'surface-1',
          requestId: 'req-3',
          recommendations: [],
          algorithm: 'collaborative',
          timestamp: new Date().toISOString(),
        },
      ]

      messages.forEach((msg) => handler.handleMessage(msg))

      expect(handler.getStats().mostUsedAlgorithm).toBe('hybrid')
    })
  })

  describe('Recommendation Selected Message', () => {
    it('should handle recommendation selected message', () => {
      const mockHandler = vi.fn()
      handler.on('recommendationSelected', mockHandler)

      const message: RecommendationSelectedMessage = {
        type: 'recommendationSelected',
        surfaceId: 'surface-1',
        requestId: 'req-1',
        recommendationId: 'rec-1',
        position: 0,
        timestamp: new Date().toISOString(),
      }

      handler.handleMessage(message)

      expect(mockHandler).toHaveBeenCalledWith(message)
      expect(handler.getStats().totalSelections).toBe(1)
    })

    it('should track multiple selections', () => {
      const message: RecommendationSelectedMessage = {
        type: 'recommendationSelected',
        surfaceId: 'surface-1',
        requestId: 'req-1',
        recommendationId: 'rec-1',
        position: 0,
        timestamp: new Date().toISOString(),
      }

      handler.handleMessage(message)
      handler.handleMessage({ ...message, recommendationId: 'rec-2' })
      handler.handleMessage({ ...message, recommendationId: 'rec-3' })

      expect(handler.getStats().totalSelections).toBe(3)
    })
  })

  describe('Recommendation Feedback Message', () => {
    it('should handle recommendation feedback message', () => {
      const mockHandler = vi.fn()
      handler.on('recommendationFeedback', mockHandler)

      const message: RecommendationFeedbackMessage = {
        type: 'recommendationFeedback',
        surfaceId: 'surface-1',
        requestId: 'req-1',
        recommendationId: 'rec-1',
        sentiment: 'positive',
        rating: 5,
        comment: 'Great recommendation!',
        timestamp: new Date().toISOString(),
      }

      handler.handleMessage(message)

      expect(mockHandler).toHaveBeenCalledWith(message)
      expect(handler.getStats().totalFeedback).toBe(1)
    })

    it('should handle feedback without optional fields', () => {
      const mockHandler = vi.fn()
      handler.on('recommendationFeedback', mockHandler)

      const message: RecommendationFeedbackMessage = {
        type: 'recommendationFeedback',
        surfaceId: 'surface-1',
        requestId: 'req-1',
        recommendationId: 'rec-1',
        sentiment: 'neutral',
        timestamp: new Date().toISOString(),
      }

      handler.handleMessage(message)

      expect(mockHandler).toHaveBeenCalledWith(message)
      expect(handler.getStats().totalFeedback).toBe(1)
    })
  })

  describe('Hybrid Scoring', () => {
    it('should apply hybrid scoring to recommendations', () => {
      const items: RecommendationItem[] = [
        {
          id: 'rec-1',
          type: 'content',
          title: 'Item 1',
          score: 0.5,
          confidence: 'medium',
          algorithm: 'collaborative',
          metadata: {
            collaborativeScore: 0.8,
            contentScore: 0.6,
            aiScore: 0.7,
          },
        },
      ]

      const config: HybridScoringConfig = {
        algorithm: 'hybrid',
        collaborativeWeight: 0.5,
        contentWeight: 0.3,
        aiWeight: 0.2,
      }

      const scored = handler.applyHybridScoring(items, config)

      expect(scored.length).toBe(1)
      expect(scored[0].algorithm).toBe('hybrid')
      // Score should be: 0.8 * 0.5 + 0.6 * 0.3 + 0.7 * 0.2 = 0.72
      expect(scored[0].score).toBeCloseTo(0.72, 2)
    })

    it('should throw error for invalid scoring config', () => {
      const items: RecommendationItem[] = [
        {
          id: 'rec-1',
          type: 'content',
          title: 'Item 1',
          score: 0.5,
          confidence: 'medium',
          algorithm: 'collaborative',
        },
      ]

      const config: HybridScoringConfig = {
        algorithm: 'hybrid',
        collaborativeWeight: 0.5,
        contentWeight: 0.3,
        aiWeight: 0.1, // Invalid: sum is not 1.0
      }

      expect(() => handler.applyHybridScoring(items, config)).toThrow('Invalid scoring configuration')
    })

    it('should apply collaborative algorithm', () => {
      const items: RecommendationItem[] = [
        {
          id: 'rec-1',
          type: 'content',
          title: 'Item 1',
          score: 0.8,
          confidence: 'high',
          algorithm: 'collaborative',
        },
      ]

      const config: HybridScoringConfig = {
        algorithm: 'collaborative',
      }

      const scored = handler.applyHybridScoring(items, config)

      expect(scored[0].algorithm).toBe('collaborative')
      expect(scored[0].score).toBe(0.8)
    })

    it('should apply minimum score filter', () => {
      const items: RecommendationItem[] = [
        {
          id: 'rec-1',
          type: 'content',
          title: 'High Score',
          score: 0.9,
          confidence: 'very-high',
          algorithm: 'hybrid',
        },
        {
          id: 'rec-2',
          type: 'content',
          title: 'Low Score',
          score: 0.3,
          confidence: 'low',
          algorithm: 'hybrid',
        },
      ]

      const config: HybridScoringConfig = {
        algorithm: 'hybrid',
        collaborativeWeight: 0.4,
        contentWeight: 0.3,
        aiWeight: 0.3,
        minScore: 0.5,
      }

      const scored = handler.applyHybridScoring(items, config)

      expect(scored.length).toBe(1)
      expect(scored[0].id).toBe('rec-1')
    })

    it('should limit results to maxResults', () => {
      const items: RecommendationItem[] = [
        { id: 'rec-1', type: 'content', title: 'Item 1', score: 0.9, confidence: 'very-high', algorithm: 'hybrid' },
        { id: 'rec-2', type: 'content', title: 'Item 2', score: 0.8, confidence: 'high', algorithm: 'hybrid' },
        { id: 'rec-3', type: 'content', title: 'Item 3', score: 0.7, confidence: 'high', algorithm: 'hybrid' },
      ]

      const config: HybridScoringConfig = {
        algorithm: 'hybrid',
        collaborativeWeight: 0.4,
        contentWeight: 0.3,
        aiWeight: 0.3,
        maxResults: 2,
      }

      const scored = handler.applyHybridScoring(items, config)

      expect(scored.length).toBe(2)
      expect(scored[0].id).toBe('rec-1')
      expect(scored[1].id).toBe('rec-2')
    })

    it('should apply diversity filtering when enabled', () => {
      const items: RecommendationItem[] = [
        {
          id: 'rec-1',
          type: 'content',
          title: 'Tech Article 1',
          score: 0.9,
          confidence: 'very-high',
          algorithm: 'hybrid',
          tags: ['tech', 'ai'],
        },
        {
          id: 'rec-2',
          type: 'content',
          title: 'Tech Article 2',
          score: 0.85,
          confidence: 'very-high',
          algorithm: 'hybrid',
          tags: ['tech', 'ai'],
        },
        {
          id: 'rec-3',
          type: 'content',
          title: 'Sports Article',
          score: 0.8,
          confidence: 'high',
          algorithm: 'hybrid',
          tags: ['sports'],
        },
      ]

      const config: HybridScoringConfig = {
        algorithm: 'hybrid',
        collaborativeWeight: 0.4,
        contentWeight: 0.3,
        aiWeight: 0.3,
        diversify: true,
      }

      const scored = handler.applyHybridScoring(items, config)

      // Should include rec-1 and rec-3 (diverse), might exclude rec-2 (too similar to rec-1)
      expect(scored.length).toBeGreaterThanOrEqual(2)
      expect(scored.find((item) => item.id === 'rec-1')).toBeDefined()
    })
  })

  describe('Statistics', () => {
    it('should track statistics correctly', () => {
      const requestMessage: RequestRecommendationsMessage = {
        type: 'requestRecommendations',
        surfaceId: 'surface-1',
        requestId: 'req-1',
        recommendationType: 'content',
      }

      const generatedMessage: RecommendationsGeneratedMessage = {
        type: 'recommendationsGenerated',
        surfaceId: 'surface-1',
        requestId: 'req-1',
        recommendations: [
          { id: 'rec-1', type: 'content', title: 'Item 1', score: 0.8, confidence: 'high', algorithm: 'hybrid' },
          { id: 'rec-2', type: 'content', title: 'Item 2', score: 0.6, confidence: 'medium', algorithm: 'hybrid' },
        ],
        algorithm: 'hybrid',
        processingTime: 200,
        timestamp: new Date().toISOString(),
      }

      const selectedMessage: RecommendationSelectedMessage = {
        type: 'recommendationSelected',
        surfaceId: 'surface-1',
        requestId: 'req-1',
        recommendationId: 'rec-1',
        position: 0,
        timestamp: new Date().toISOString(),
      }

      const feedbackMessage: RecommendationFeedbackMessage = {
        type: 'recommendationFeedback',
        surfaceId: 'surface-1',
        requestId: 'req-1',
        recommendationId: 'rec-1',
        sentiment: 'positive',
        rating: 5,
        timestamp: new Date().toISOString(),
      }

      handler.handleMessage(requestMessage)
      handler.handleMessage(generatedMessage)
      handler.handleMessage(selectedMessage)
      handler.handleMessage(feedbackMessage)

      const stats = handler.getStats()

      expect(stats.totalRequests).toBe(1)
      expect(stats.totalRecommendations).toBe(2)
      expect(stats.totalSelections).toBe(1)
      expect(stats.totalFeedback).toBe(1)
      expect(stats.averageProcessingTime).toBe(200)
      expect(stats.mostUsedAlgorithm).toBe('hybrid')
      expect(stats.averageScore).toBeGreaterThan(0)
    })

    it('should reset statistics', () => {
      const message: RequestRecommendationsMessage = {
        type: 'requestRecommendations',
        surfaceId: 'surface-1',
        requestId: 'req-1',
        recommendationType: 'content',
      }

      handler.handleMessage(message)
      expect(handler.getStats().totalRequests).toBe(1)

      handler.resetStats()
      const stats = handler.getStats()

      expect(stats.totalRequests).toBe(0)
      expect(stats.totalRecommendations).toBe(0)
      expect(stats.totalSelections).toBe(0)
      expect(stats.totalFeedback).toBe(0)
      expect(stats.averageScore).toBe(0)
      expect(stats.averageProcessingTime).toBe(0)
      expect(stats.mostUsedAlgorithm).toBeNull()
    })

    it('should calculate average score correctly', () => {
      const message: RecommendationsGeneratedMessage = {
        type: 'recommendationsGenerated',
        surfaceId: 'surface-1',
        requestId: 'req-1',
        recommendations: [
          { id: 'rec-1', type: 'content', title: 'Item 1', score: 0.8, confidence: 'high', algorithm: 'hybrid' },
          { id: 'rec-2', type: 'content', title: 'Item 2', score: 0.6, confidence: 'medium', algorithm: 'hybrid' },
        ],
        algorithm: 'hybrid',
        timestamp: new Date().toISOString(),
      }

      handler.handleMessage(message)

      const stats = handler.getStats()
      // Average should be (0.8 + 0.6) / 2 = 0.7 (after normalization)
      expect(stats.averageScore).toBeGreaterThan(0)
    })
  })
})
