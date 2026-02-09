/**
 * A2UI Recommendation Handler
 * Type-safe event emitter for recommendation messages with hybrid scoring
 */

import type {
  RecommendationMessage,
  RequestRecommendationsMessage,
  RecommendationsGeneratedMessage,
  RecommendationSelectedMessage,
  RecommendationFeedbackMessage,
  RecommendationItem,
  HybridScoringConfig,
  ScoringAlgorithm,
} from '../types/recommendation.js'
import {
  isRequestRecommendationsMessage,
  isRecommendationsGeneratedMessage,
  isRecommendationSelectedMessage,
  isRecommendationFeedbackMessage,
  validateScoringConfig,
  normalizeScores,
  sortByScore,
  filterByMinScore,
  applyDiversity,
  calculateConfidenceLevel,
} from '../types/recommendation.js'

/**
 * Event handler type
 */
export type EventHandler<T = unknown> = (data: T) => void

/**
 * Recommendation handler options
 */
export interface RecommendationHandlerOptions {
  /** Enable automatic score normalization */
  autoNormalize?: boolean
  /** Default hybrid scoring configuration */
  defaultScoringConfig?: HybridScoringConfig
  /** Enable automatic diversity filtering */
  autoDiversify?: boolean
  /** Maximum recommendations per request */
  maxRecommendations?: number
}

/**
 * Recommendation statistics
 */
export interface RecommendationStats {
  /** Total requests processed */
  totalRequests: number
  /** Total recommendations generated */
  totalRecommendations: number
  /** Total selections made */
  totalSelections: number
  /** Total feedback received */
  totalFeedback: number
  /** Average score across all recommendations */
  averageScore: number
  /** Average processing time in ms */
  averageProcessingTime: number
  /** Most used algorithm */
  mostUsedAlgorithm: ScoringAlgorithm | null
}

/**
 * A2UI Recommendation Handler
 * Manages recommendation message handling with hybrid scoring integration
 */
export class RecommendationHandler {
  private readonly handlers = new Map<string, Set<EventHandler>>()
  private readonly options: Required<RecommendationHandlerOptions>
  private readonly stats: RecommendationStats = {
    totalRequests: 0,
    totalRecommendations: 0,
    totalSelections: 0,
    totalFeedback: 0,
    averageScore: 0,
    averageProcessingTime: 0,
    mostUsedAlgorithm: null,
  }
  private readonly algorithmCounts = new Map<ScoringAlgorithm, number>()
  private processingTimes: number[] = []

  constructor(options: RecommendationHandlerOptions = {}) {
    this.options = {
      autoNormalize: options.autoNormalize ?? true,
      defaultScoringConfig: options.defaultScoringConfig ?? {
        algorithm: 'hybrid',
        collaborativeWeight: 0.4,
        contentWeight: 0.3,
        aiWeight: 0.3,
        minScore: 0.3,
        maxResults: 10,
        diversify: true,
      },
      autoDiversify: options.autoDiversify ?? true,
      maxRecommendations: options.maxRecommendations ?? 20,
    }

    // Validate default scoring config
    if (this.options.defaultScoringConfig && !validateScoringConfig(this.options.defaultScoringConfig)) {
      throw new Error('Invalid default scoring configuration')
    }
  }

  /**
   * Register an event handler
   */
  on<T = unknown>(event: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler as EventHandler)
  }

  /**
   * Unregister an event handler
   */
  off<T = unknown>(event: string, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(event)
    if (handlers) {
      handlers.delete(handler as EventHandler)
    }
  }

  /**
   * Unregister all handlers for an event
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.handlers.delete(event)
    } else {
      this.handlers.clear()
    }
  }

  /**
   * Process incoming recommendation message
   */
  handleMessage(message: RecommendationMessage): void {
    if (isRequestRecommendationsMessage(message)) {
      this.handleRequestRecommendations(message)
    } else if (isRecommendationsGeneratedMessage(message)) {
      this.handleRecommendationsGenerated(message)
    } else if (isRecommendationSelectedMessage(message)) {
      this.handleRecommendationSelected(message)
    } else if (isRecommendationFeedbackMessage(message)) {
      this.handleRecommendationFeedback(message)
    }
  }

  /**
   * Handle request recommendations message
   */
  private handleRequestRecommendations(message: RequestRecommendationsMessage): void {
    this.stats.totalRequests++

    // Merge scoring config with defaults
    const scoringConfig = {
      ...this.options.defaultScoringConfig,
      ...message.scoringConfig,
    }

    // Validate scoring config
    if (!validateScoringConfig(scoringConfig)) {
      this.emit('error', new Error(`Invalid scoring configuration in request ${message.requestId}`))
      return
    }

    // Emit to specific event
    this.emit('requestRecommendations', message)

    // Emit generic message event
    this.emit('message', message)
  }

  /**
   * Handle recommendations generated message
   */
  private handleRecommendationsGenerated(message: RecommendationsGeneratedMessage): void {
    let recommendations = [...message.recommendations]

    // Update statistics
    this.stats.totalRecommendations += recommendations.length

    // Track algorithm usage
    const count = this.algorithmCounts.get(message.algorithm) ?? 0
    this.algorithmCounts.set(message.algorithm, count + 1)
    this.updateMostUsedAlgorithm()

    // Track processing time
    if (message.processingTime !== undefined) {
      this.processingTimes.push(message.processingTime)
      this.stats.averageProcessingTime =
        this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length
    }

    // Apply automatic processing
    if (this.options.autoNormalize) {
      recommendations = normalizeScores(recommendations)
    }

    // Sort by score
    recommendations = sortByScore(recommendations)

    // Apply scoring config filters
    const config = this.options.defaultScoringConfig
    if (config.minScore !== undefined) {
      recommendations = filterByMinScore(recommendations, config.minScore)
    }

    // Apply diversity if enabled
    if (this.options.autoDiversify && config.diversify) {
      recommendations = applyDiversity(recommendations)
    }

    // Limit to max recommendations
    if (this.options.maxRecommendations) {
      recommendations = recommendations.slice(0, this.options.maxRecommendations)
    }

    // Update average score
    if (recommendations.length > 0) {
      const totalScore = recommendations.reduce((sum, item) => sum + item.score, 0)
      const currentAvg = this.stats.averageScore
      const currentCount = this.stats.totalRecommendations - recommendations.length
      this.stats.averageScore = (currentAvg * currentCount + totalScore) / this.stats.totalRecommendations
    }

    // Create processed message
    const processedMessage: RecommendationsGeneratedMessage = {
      ...message,
      recommendations,
    }

    // Emit to specific event
    this.emit('recommendationsGenerated', processedMessage)

    // Emit generic message event
    this.emit('message', processedMessage)
  }

  /**
   * Handle recommendation selected message
   */
  private handleRecommendationSelected(message: RecommendationSelectedMessage): void {
    this.stats.totalSelections++

    // Emit to specific event
    this.emit('recommendationSelected', message)

    // Emit generic message event
    this.emit('message', message)
  }

  /**
   * Handle recommendation feedback message
   */
  private handleRecommendationFeedback(message: RecommendationFeedbackMessage): void {
    this.stats.totalFeedback++

    // Emit to specific event
    this.emit('recommendationFeedback', message)

    // Emit generic message event
    this.emit('message', message)
  }

  /**
   * Apply hybrid scoring to recommendation items
   */
  applyHybridScoring(items: RecommendationItem[], config: HybridScoringConfig): RecommendationItem[] {
    if (!validateScoringConfig(config)) {
      throw new Error('Invalid scoring configuration')
    }

    let scored = items.map((item) => {
      let finalScore = item.score

      // Apply algorithm-specific scoring
      if (config.algorithm === 'hybrid') {
        // Hybrid scoring combines multiple signals
        const collaborativeScore = item.metadata?.collaborativeScore as number | undefined ?? item.score
        const contentScore = item.metadata?.contentScore as number | undefined ?? item.score
        const aiScore = item.metadata?.aiScore as number | undefined ?? item.score

        finalScore =
          (collaborativeScore * (config.collaborativeWeight ?? 0.4)) +
          (contentScore * (config.contentWeight ?? 0.3)) +
          (aiScore * (config.aiWeight ?? 0.3))
      }

      return {
        ...item,
        score: finalScore,
        confidence: calculateConfidenceLevel(finalScore),
        algorithm: config.algorithm,
      }
    })

    // Normalize scores if enabled
    if (this.options.autoNormalize) {
      scored = normalizeScores(scored)
    }

    // Sort by score
    scored = sortByScore(scored)

    // Filter by minimum score
    if (config.minScore !== undefined) {
      scored = filterByMinScore(scored, config.minScore)
    }

    // Apply diversity if enabled
    if (config.diversify) {
      scored = applyDiversity(scored)
    }

    // Limit results
    if (config.maxResults !== undefined) {
      scored = scored.slice(0, config.maxResults)
    }

    return scored
  }

  /**
   * Get recommendation statistics
   */
  getStats(): Readonly<RecommendationStats> {
    return { ...this.stats }
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats.totalRequests = 0
    this.stats.totalRecommendations = 0
    this.stats.totalSelections = 0
    this.stats.totalFeedback = 0
    this.stats.averageScore = 0
    this.stats.averageProcessingTime = 0
    this.stats.mostUsedAlgorithm = null
    this.algorithmCounts.clear()
    this.processingTimes = []
  }

  /**
   * Update most used algorithm statistic
   */
  private updateMostUsedAlgorithm(): void {
    let maxCount = 0
    let mostUsed: ScoringAlgorithm | null = null

    for (const [algorithm, count] of this.algorithmCounts) {
      if (count > maxCount) {
        maxCount = count
        mostUsed = algorithm
      }
    }

    this.stats.mostUsedAlgorithm = mostUsed
  }

  /**
   * Emit event to handlers
   */
  private emit<T = unknown>(event: string, data: T): void {
    const handlers = this.handlers.get(event)
    if (handlers) {
      handlers.forEach((handler) => handler(data))
    }
  }
}
