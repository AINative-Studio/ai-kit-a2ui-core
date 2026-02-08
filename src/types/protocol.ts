/**
 * A2UI v0.9 Protocol Message Definitions
 */

import type { A2UIComponent } from './components.js'

/**
 * All protocol message types
 */
export type MessageType =
  | 'createSurface'
  | 'updateComponents'
  | 'updateDataModel'
  | 'deleteSurface'
  | 'userAction'
  | 'error'
  | 'ping'
  | 'pong'
  | 'searchVideos'
  | 'searchResults'

/**
 * Base message structure
 */
export interface BaseMessage {
  /** Message type */
  type: MessageType
  /** Optional message ID for tracking */
  id?: string
  /** Timestamp */
  timestamp?: number
}

/**
 * Create Surface Message (Agent → UI)
 * Initializes a new UI surface with components and data model
 */
export interface CreateSurfaceMessage extends BaseMessage {
  type: 'createSurface'
  /** Surface identifier */
  surfaceId: string
  /** Initial components */
  components: A2UIComponent[]
  /** Initial data model */
  dataModel?: Record<string, unknown>
  /** Optional metadata */
  metadata?: Record<string, unknown>
}

/**
 * Update Components Message (Agent → UI)
 * Updates existing components or adds new ones
 */
export interface UpdateComponentsMessage extends BaseMessage {
  type: 'updateComponents'
  /** Surface identifier */
  surfaceId: string
  /** Component updates */
  updates: ComponentUpdate[]
}

export interface ComponentUpdate {
  /** Component ID to update */
  id: string
  /** Operation type */
  operation: 'add' | 'update' | 'remove'
  /** New/updated component (for add/update) */
  component?: A2UIComponent
}

/**
 * Update Data Model Message (Agent → UI)
 * Updates the data model using JSON Pointer paths
 */
export interface UpdateDataModelMessage extends BaseMessage {
  type: 'updateDataModel'
  /** Surface identifier */
  surfaceId: string
  /** Data updates */
  updates: DataUpdate[]
}

export interface DataUpdate {
  /** JSON Pointer path (RFC 6901) */
  path: string
  /** Operation type */
  operation: 'set' | 'remove'
  /** New value (for set operation) */
  value?: unknown
}

/**
 * Delete Surface Message (Agent → UI)
 * Removes an entire UI surface
 */
export interface DeleteSurfaceMessage extends BaseMessage {
  type: 'deleteSurface'
  /** Surface identifier */
  surfaceId: string
}

/**
 * User Action Message (UI → Agent)
 * Sent when user interacts with UI
 */
export interface UserActionMessage extends BaseMessage {
  type: 'userAction'
  /** Surface identifier */
  surfaceId: string
  /** Action name */
  action: string
  /** Component that triggered action */
  componentId?: string
  /** Action context data */
  context?: Record<string, unknown>
  /** Current data model snapshot */
  dataModel?: Record<string, unknown>
}

/**
 * Error Message (Bidirectional)
 * Communicates errors
 */
export interface ErrorMessage extends BaseMessage {
  type: 'error'
  /** Error code */
  code: string
  /** Error message */
  message: string
  /** Optional error details */
  details?: unknown
}

/**
 * Ping Message (Bidirectional)
 * Keep-alive ping
 */
export interface PingMessage extends BaseMessage {
  type: 'ping'
}

/**
 * Pong Message (Bidirectional)
 * Keep-alive pong
 */
export interface PongMessage extends BaseMessage {
  type: 'pong'
}

/**
 * Video search filter options
 */
export interface VideoSearchFilters {
  /** Filter by video duration range in seconds */
  durationRange?: {
    min?: number
    max?: number
  }
  /** Filter by upload date range */
  dateRange?: {
    from?: string
    to?: string
  }
  /** Filter by tags */
  tags?: string[]
  /** Filter by user/author */
  author?: string
  /** Filter by video status */
  status?: 'processing' | 'ready' | 'error'
  /** Maximum number of results to return */
  limit?: number
  /** Offset for pagination */
  offset?: number
}

/**
 * Video search result item
 */
export interface VideoSearchResult {
  /** Video identifier */
  videoId: string
  /** Video title */
  title: string
  /** Video description */
  description?: string
  /** Relevance score (0-1) */
  relevanceScore: number
  /** Video duration in seconds */
  duration?: number
  /** Video thumbnail URL */
  thumbnailUrl?: string
  /** Upload timestamp */
  uploadedAt?: string
  /** Video author/user */
  author?: string
  /** Video tags */
  tags?: string[]
  /** Relevant timestamps matching the query */
  relevantTimestamps?: Array<{
    /** Timestamp in seconds */
    time: number
    /** Context/snippet at this timestamp */
    context: string
    /** Relevance score for this timestamp */
    score: number
  }>
  /** AI-generated metadata */
  metadata?: {
    /** Video transcript */
    transcript?: string
    /** Video summary */
    summary?: string
    /** Video topics */
    topics?: string[]
    /** Sentiment analysis */
    sentiment?: 'positive' | 'neutral' | 'negative'
  }
}

/**
 * Search Videos Message (UI → Agent or Agent → Backend)
 * Request semantic search of videos
 */
export interface SearchVideosMessage extends BaseMessage {
  type: 'searchVideos'
  /** Search query (supports semantic search) */
  query: string
  /** Optional search filters */
  filters?: VideoSearchFilters
  /** Search context (e.g., surface ID where search was initiated) */
  context?: {
    surfaceId?: string
    userId?: string
    sessionId?: string
  }
}

/**
 * Search Results Message (Agent → UI or Backend → Agent)
 * Return semantic search results
 */
export interface SearchResultsMessage extends BaseMessage {
  type: 'searchResults'
  /** Original search query */
  query: string
  /** Search results */
  results: VideoSearchResult[]
  /** Total number of results available */
  totalResults: number
  /** Search execution time in milliseconds */
  executionTime?: number
  /** Search algorithm used */
  searchType?: 'semantic' | 'keyword' | 'hybrid'
  /** Error information if search failed */
  error?: {
    code: string
    message: string
  }
}

/**
 * Union of all message types
 */
export type A2UIMessage =
  | CreateSurfaceMessage
  | UpdateComponentsMessage
  | UpdateDataModelMessage
  | DeleteSurfaceMessage
  | UserActionMessage
  | ErrorMessage
  | PingMessage
  | PongMessage
  | SearchVideosMessage
  | SearchResultsMessage

/**
 * Type guards for message discrimination
 */
export function isCreateSurfaceMessage(msg: A2UIMessage): msg is CreateSurfaceMessage {
  return msg.type === 'createSurface'
}

export function isUpdateComponentsMessage(msg: A2UIMessage): msg is UpdateComponentsMessage {
  return msg.type === 'updateComponents'
}

export function isUpdateDataModelMessage(msg: A2UIMessage): msg is UpdateDataModelMessage {
  return msg.type === 'updateDataModel'
}

export function isDeleteSurfaceMessage(msg: A2UIMessage): msg is DeleteSurfaceMessage {
  return msg.type === 'deleteSurface'
}

export function isUserActionMessage(msg: A2UIMessage): msg is UserActionMessage {
  return msg.type === 'userAction'
}

export function isErrorMessage(msg: A2UIMessage): msg is ErrorMessage {
  return msg.type === 'error'
}

export function isPingMessage(msg: A2UIMessage): msg is PingMessage {
  return msg.type === 'ping'
}

export function isPongMessage(msg: A2UIMessage): msg is PongMessage {
  return msg.type === 'pong'
}

export function isSearchVideosMessage(msg: A2UIMessage): msg is SearchVideosMessage {
  return msg.type === 'searchVideos'
}

export function isSearchResultsMessage(msg: A2UIMessage): msg is SearchResultsMessage {
  return msg.type === 'searchResults'
}
