/**
 * A2UI v0.9 Protocol Types
 */

// Component Types
export type {
  ComponentType,
  A2UIComponent,
  TypedA2UIComponent,
  ComponentProperties,
} from './components.js'

// Protocol Types
export type {
  MessageType,
  BaseMessage,
  CreateSurfaceMessage,
  UpdateComponentsMessage,
  ComponentUpdate,
  UpdateDataModelMessage,
  DataUpdate,
  DeleteSurfaceMessage,
  UserActionMessage,
  ErrorMessage,
  PingMessage,
  PongMessage,
  A2UIMessage,
} from './protocol.js'

// Protocol Type Guards
export {
  isCreateSurfaceMessage,
  isUpdateComponentsMessage,
  isUpdateDataModelMessage,
  isDeleteSurfaceMessage,
  isUserActionMessage,
  isErrorMessage,
  isPingMessage,
  isPongMessage,
} from './protocol.js'

// AI Metadata State Types (Epic 2)
export type {
  AIProcessingState,
  ConfidenceScore,
  Timestamp,
  VideoTimestamp,
  BaseAIMetadataState,
  TranscriptWord,
  TranscriptSegment,
  TranscriptState,
  SummarySection,
  SummaryState,
  Topic,
  TopicState,
  Highlight,
  HighlightState,
  Chapter,
  ChapterState,
  AIMetadataState,
} from './ai-metadata-state.js'

// AI Metadata Type Guards
export {
  isProcessing,
  isComplete,
  hasError,
  isValidTranscriptSegment,
  isValidHighlight,
  isValidChapter,
  isValidTopic,
} from './ai-metadata-state.js'

// AI Intelligence Protocol Types (Epic 2)
export type {
  AIIntelligenceMessageType,
  Sentiment,
  RecommendationStrategy,
  SearchVideosMessage,
  SearchResultItem,
  SearchResultsMessage,
  RequestMetadataMessage,
  TranscriptWord as AITranscriptWord,
  Speaker,
  Transcript as AITranscript,
  SentimentAnalysis,
  Highlight as AIHighlight,
  Chapter as AIChapter,
  VideoMetadata,
  VideoMetadataReadyMessage,
  UpdateProgressMessage,
  SceneMetadata,
  ProgressSyncMessage,
  RequestRecommendationsMessage as AIRequestRecommendationsMessage,
  Recommendation as AIRecommendation,
  RecommendationsMessage as AIRecommendationsMessage,
  AIIntelligenceMessage,
} from './ai-intelligence-protocol.js'

// AI Intelligence Protocol Type Guards
export {
  isSearchVideosMessage,
  isSearchResultsMessage,
  isRequestMetadataMessage,
  isVideoMetadataReadyMessage,
  isUpdateProgressMessage,
  isProgressSyncMessage,
  isRequestRecommendationsMessage as isAIRequestRecommendationsMessage,
  isRecommendationsMessage as isAIRecommendationsMessage,
  isAIIntelligenceMessage,
} from './ai-intelligence-protocol.js'

// AI Component Property Schemas (Epic 2)
export type {
  RecordingAIFeatures,
  VideoRecorderProperties,
  VideoCallLayout,
  VideoCallFeatures,
  VideoCallAIFeatures,
  VideoCallProperties,
  VoiceType,
  AIVideoProperties,
  AIVideoPlayerInteractive,
  AIVideoPlayerProperties,
} from './ai-component-schemas.js'

export {
  videoRecorderDefaults,
  videoRecorderSchema,
  videoCallDefaults,
  videoCallSchema,
  aiVideoDefaults,
  aiVideoSchema,
  aiVideoPlayerDefaults,
  aiVideoPlayerSchema,
  aiComponentSchemas,
  aiComponentDefaults,
} from './ai-component-schemas.js'

// AI Schema Validation
export type {
  ValidationResult,
  ValidationError,
} from './ai-schema-validation.js'

export {
  validateVideoRecorderProperties,
  applyVideoRecorderDefaults,
  validateVideoCallProperties,
  applyVideoCallDefaults,
  validateAIVideoProperties,
  applyAIVideoDefaults,
  validateAIVideoPlayerProperties,
  applyAIVideoPlayerDefaults,
  validateAIComponentProperties,
  applyAIComponentDefaults,
} from './ai-schema-validation.js'

// Recommendation Protocol Types (Epic 2, Issue #33)
export type {
  RecommendationMessageType,
  RecommendationType,
  ScoringAlgorithm,
  ConfidenceLevel,
  FeedbackSentiment,
  RecommendationItem,
  HybridScoringConfig,
  RequestRecommendationsMessage,
  RecommendationsGeneratedMessage,
  RecommendationSelectedMessage,
  RecommendationFeedbackMessage,
  RecommendationMessage,
} from './recommendation.js'

// Recommendation Type Guards and Utilities
export {
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
} from './recommendation.js'

// Progress Tracking Types (Epic 2, Issue #30)
export type {
  VideoScene,
  PlaybackPosition,
  DeviceInfo,
  UpdateProgressMessage as ProgressUpdateMessage,
  ProgressSyncMessage as ProgressSynchronizationMessage,
  ProgressTrackingMessage,
} from './progress-tracking.js'

// Progress Tracking Type Guards
export {
  isUpdateProgressMessage as isProgressUpdateMessage,
  isProgressSyncMessage as isProgressSynchronizationMessage,
  isProgressTrackingMessage,
} from './progress-tracking.js'
