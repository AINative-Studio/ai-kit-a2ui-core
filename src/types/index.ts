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
} from './protocol.js'

// AI Metadata State Types (Issue #28)
export type {
  TranscriptSegment,
  TranscriptMetadata,
  SummaryType,
  SummaryMetadata,
  TopicCategory,
  Topic,
  TopicMetadata,
  HighlightType,
  Highlight,
  HighlightMetadata,
  Chapter,
  ChapterMetadata,
  SentimentType,
  SentimentScore,
  SentimentTimestamp,
  EmotionDetection,
  SentimentMetadata,
  AIMetadataProcessingState,
  AIMetadataState,
} from './ai-metadata-state.js'

// AI Metadata Type Guards
export {
  isTranscriptMetadata,
  isSummaryMetadata,
  isTopicMetadata,
  isHighlightMetadata,
  isChapterMetadata,
  isSentimentMetadata,
  isAIMetadataState,
} from './ai-metadata-state.js'

// File Upload Component Types (Issue #43)
export type {
  FileMetadata,
  UploadState,
  FileUploadProperties,
  FileValidationResult,
  FileUploadComponent,
} from './file-upload-components.js'

export {
  validateFile,
  validateFiles,
  sanitizeFileName,
  isValidFileName,
  formatFileSize,
  DEFAULT_FILE_UPLOAD_PROPERTIES,
} from './file-upload-components.js'

// File Upload Message Types (Issue #43)
export type {
  FileInfo,
  FileUploadStartMessage,
  FileUploadProgressMessage,
  FileUploadCompleteMessage,
  FileUploadErrorMessage,
  FileUploadCancelMessage,
  FileDeleteMessage,
  FileDeleteCompleteMessage,
  FileUploadMessage,
} from './file-upload-messages.js'

export {
  isFileUploadStartMessage,
  isFileUploadProgressMessage,
  isFileUploadCompleteMessage,
  isFileUploadErrorMessage,
  isFileUploadCancelMessage,
  isFileDeleteMessage,
  isFileDeleteCompleteMessage,
  createFileUploadStartMessage,
  createFileUploadProgressMessage,
  createFileUploadCompleteMessage,
  createFileUploadErrorMessage,
} from './file-upload-messages.js'

// Progressive Rendering Message Types (Issue #53)
export type {
  ProgressiveRenderStartMessage,
  ProgressiveRenderChunkMessage,
  ProgressiveRenderCompleteMessage,
  ProgressiveRenderErrorMessage,
  ProgressiveRenderProgressMessage,
  ExtendedMessageType,
  ProgressiveRenderMessage,
  ExtendedA2UIMessage,
} from './progressive-render-messages.js'

export {
  isProgressiveRenderStartMessage,
  isProgressiveRenderChunkMessage,
  isProgressiveRenderCompleteMessage,
  isProgressiveRenderErrorMessage,
  isProgressiveRenderProgressMessage,
  isProgressiveRenderMessage,
} from './progressive-render-messages.js'
