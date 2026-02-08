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
  VideoSearchFilters,
  VideoSearchResult,
  SearchVideosMessage,
  SearchResultsMessage,
  A2UIMessage,
} from './protocol.js'

// Type Guards
export {
  isCreateSurfaceMessage,
  isUpdateComponentsMessage,
  isUpdateDataModelMessage,
  isDeleteSurfaceMessage,
  isUserActionMessage,
  isErrorMessage,
  isPingMessage,
  isPongMessage,
  isSearchVideosMessage,
  isSearchResultsMessage,
} from './protocol.js'

// Video State Types
export type {
  VideoRecorderState,
  VideoRecorderStatus,
  VideoRecorderStateTransition,
  VideoRecorderStateUpdate,
  RecordingMode,
  VideoQuality,
  RecordingErrorType,
  RecordingError,
  RecordingMetadata,
  VideoCallState,
  VideoCallStatus,
  VideoCallStateTransition,
  VideoCallStateUpdate,
  CallParticipantState,
  CallQualityMetrics,
  CallErrorType,
  CallError,
  VideoGenerationState,
  VideoGenerationStatus,
  VideoGenerationStateTransition,
  VideoGenerationStateUpdate,
  GenerationStage,
  GenerationErrorType,
  GenerationError,
  GenerationMetadata,
  VideoPlayerState,
  VideoPlayerStatus,
  VideoPlayerStateTransition,
  VideoPlayerStateUpdate,
  PlaybackSpeed,
  PlayerErrorType,
  PlayerError,
  VideoPlayerMetadata,
  StateTransition,
} from './video-state.js'

// Video State Type Guards
export {
  isVideoRecorderState,
  isVideoCallState,
  isVideoGenerationState,
  isVideoPlayerState,
} from './video-state.js'
