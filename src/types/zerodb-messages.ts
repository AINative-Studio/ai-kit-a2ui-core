/**
 * ZeroDB Message Type Definitions
 * Messages for ZeroDB operations
 */

/**
 * Base ZeroDB message interface
 */
export interface BaseZeroDBMessage {
  type: string
  surfaceId: string
  timestamp?: number
  metadata?: Record<string, unknown>
}

/**
 * ZeroDB Vector Search Request
 */
export interface ZeroDBVectorSearchMessage extends BaseZeroDBMessage {
  type: 'zerodbVectorSearch'
  query: string
  topK?: number
  filters?: Record<string, unknown>
}

/**
 * ZeroDB Vector Search Result
 */
export interface ZeroDBVectorSearchResultMessage extends BaseZeroDBMessage {
  type: 'zerodbVectorSearchResult'
  results: Array<{
    id: string
    score: number
    metadata?: Record<string, unknown>
  }>
}

/**
 * ZeroDB Table Query Request
 */
export interface ZeroDBTableQueryMessage extends BaseZeroDBMessage {
  type: 'zerodbTableQuery'
  tableName: string
  filters?: Record<string, unknown>
  limit?: number
  offset?: number
}

/**
 * ZeroDB Table Query Result
 */
export interface ZeroDBTableQueryResultMessage extends BaseZeroDBMessage {
  type: 'zerodbTableQueryResult'
  rows: unknown[]
  totalCount?: number
}

/**
 * ZeroDB Table Insert Request
 */
export interface ZeroDBTableInsertMessage extends BaseZeroDBMessage {
  type: 'zerodbTableInsert'
  tableName: string
  rows: unknown[]
}

/**
 * ZeroDB Table Update Request
 */
export interface ZeroDBTableUpdateMessage extends BaseZeroDBMessage {
  type: 'zerodbTableUpdate'
  tableName: string
  filters: Record<string, unknown>
  updates: Record<string, unknown>
}

/**
 * ZeroDB Table Delete Request
 */
export interface ZeroDBTableDeleteMessage extends BaseZeroDBMessage {
  type: 'zerodbTableDelete'
  tableName: string
  filters: Record<string, unknown>
}

/**
 * ZeroDB Table Operation Result
 */
export interface ZeroDBTableOperationResultMessage extends BaseZeroDBMessage {
  type: 'zerodbTableOperationResult'
  success: boolean
  affectedRows?: number
  error?: string
}

/**
 * ZeroDB File List Request
 */
export interface ZeroDBFileListMessage extends BaseZeroDBMessage {
  type: 'zerodbFileList'
  path?: string
}

/**
 * ZeroDB File List Result
 */
export interface ZeroDBFileListResultMessage extends BaseZeroDBMessage {
  type: 'zerodbFileListResult'
  files: Array<{
    name: string
    size: number
    path: string
    mimeType?: string
  }>
}

/**
 * ZeroDB File Upload Request
 */
export interface ZeroDBFileUploadMessage extends BaseZeroDBMessage {
  type: 'zerodbFileUpload'
  fileName: string
  fileData: string
  path?: string
}

/**
 * ZeroDB File Download Request
 */
export interface ZeroDBFileDownloadMessage extends BaseZeroDBMessage {
  type: 'zerodbFileDownload'
  filePath: string
}

/**
 * ZeroDB File Download Result
 */
export interface ZeroDBFileDownloadResultMessage extends BaseZeroDBMessage {
  type: 'zerodbFileDownloadResult'
  fileName: string
  fileData: string
  mimeType?: string
}

/**
 * ZeroDB File Delete Request
 */
export interface ZeroDBFileDeleteMessage extends BaseZeroDBMessage {
  type: 'zerodbFileDelete'
  filePath: string
}

/**
 * ZeroDB Postgres Query Request
 */
export interface ZeroDBPostgresQueryMessage extends BaseZeroDBMessage {
  type: 'zerodbPostgresQuery'
  query: string
  params?: unknown[]
}

/**
 * ZeroDB Postgres Query Result
 */
export interface ZeroDBPostgresQueryResultMessage extends BaseZeroDBMessage {
  type: 'zerodbPostgresQueryResult'
  rows: unknown[]
  rowCount?: number
}

/**
 * ZeroDB Postgres Status Request
 */
export interface ZeroDBPostgresStatusMessage extends BaseZeroDBMessage {
  type: 'zerodbPostgresStatus'
}

/**
 * ZeroDB Postgres Status Result
 */
export interface ZeroDBPostgresStatusResultMessage extends BaseZeroDBMessage {
  type: 'zerodbPostgresStatusResult'
  status: string
  connections?: number
  uptime?: number
}

/**
 * ZeroDB Memory Search Request
 */
export interface ZeroDBMemorySearchMessage extends BaseZeroDBMessage {
  type: 'zerodbMemorySearch'
  query: string
  limit?: number
}

/**
 * ZeroDB Memory Search Result
 */
export interface ZeroDBMemorySearchResultMessage extends BaseZeroDBMessage {
  type: 'zerodbMemorySearchResult'
  results: Array<{
    content: string
    relevance: number
    timestamp: string
  }>
}

/**
 * ZeroDB Memory Store Request
 */
export interface ZeroDBMemoryStoreMessage extends BaseZeroDBMessage {
  type: 'zerodbMemoryStore'
  content: string
  context?: Record<string, unknown>
}

/**
 * ZeroDB Analytics Query Request
 */
export interface ZeroDBAnalyticsQueryMessage extends BaseZeroDBMessage {
  type: 'zerodbAnalyticsQuery'
  metric: string
  timeRange?: {
    start: string
    end: string
  }
}

/**
 * ZeroDB Analytics Query Result
 */
export interface ZeroDBAnalyticsQueryResultMessage extends BaseZeroDBMessage {
  type: 'zerodbAnalyticsQueryResult'
  data: unknown[]
  aggregations?: Record<string, unknown>
}

/**
 * Union of all ZeroDB message types
 */
export type ZeroDBMessage =
  | ZeroDBVectorSearchMessage
  | ZeroDBVectorSearchResultMessage
  | ZeroDBTableQueryMessage
  | ZeroDBTableQueryResultMessage
  | ZeroDBTableInsertMessage
  | ZeroDBTableUpdateMessage
  | ZeroDBTableDeleteMessage
  | ZeroDBTableOperationResultMessage
  | ZeroDBFileListMessage
  | ZeroDBFileListResultMessage
  | ZeroDBFileUploadMessage
  | ZeroDBFileDownloadMessage
  | ZeroDBFileDownloadResultMessage
  | ZeroDBFileDeleteMessage
  | ZeroDBPostgresQueryMessage
  | ZeroDBPostgresQueryResultMessage
  | ZeroDBPostgresStatusMessage
  | ZeroDBPostgresStatusResultMessage
  | ZeroDBMemorySearchMessage
  | ZeroDBMemorySearchResultMessage
  | ZeroDBMemoryStoreMessage
  | ZeroDBAnalyticsQueryMessage
  | ZeroDBAnalyticsQueryResultMessage
