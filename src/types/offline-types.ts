/**
 * Offline-First Support Types for A2UI Core
 * Provides comprehensive types for offline storage, sync, and conflict resolution
 */

/**
 * Retry strategy for failed operations
 */
export type RetryStrategy = 'exponential' | 'linear' | 'fixed' | 'none';

/**
 * Conflict resolution strategy
 */
export type ConflictStrategy = 'last-write-wins' | 'operational-transform' | 'crdt' | 'manual';

/**
 * Cache strategy for network requests
 */
export type CacheStrategy = 'network-first' | 'cache-first' | 'network-only' | 'cache-only' | 'stale-while-revalidate';

/**
 * Storage backend type
 */
export type StorageBackend = 'indexeddb' | 'localstorage' | 'memory';

/**
 * Operation type for queued operations
 */
export type OperationType = 'create' | 'update' | 'delete' | 'read' | 'custom';

/**
 * Sync status for operations
 */
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';

/**
 * Network connection status
 */
export type ConnectionStatus = 'online' | 'offline' | 'slow';

/**
 * Configuration for offline storage
 */
export interface OfflineStorageConfig {
  /** Storage backend to use (auto-detected if not specified) */
  backend?: StorageBackend;
  /** Database name for IndexedDB */
  databaseName?: string;
  /** Database version */
  version?: number;
  /** Maximum storage size in bytes */
  maxSize?: number;
  /** Enable compression for stored data */
  compression?: boolean;
  /** Enable encryption for stored data */
  encryption?: boolean;
  /** Encryption key (required if encryption is enabled) */
  encryptionKey?: string;
}

/**
 * Configuration for offline queue
 */
export interface OfflineQueueConfig {
  /** Maximum number of operations in queue */
  maxSize: number;
  /** Retry strategy for failed operations */
  retryStrategy: RetryStrategy;
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Initial retry delay in milliseconds */
  retryDelay?: number;
  /** Maximum retry delay in milliseconds */
  maxRetryDelay?: number;
  /** Enable persistence across sessions */
  persistent?: boolean;
}

/**
 * Configuration for cache
 */
export interface OfflineCacheConfig {
  /** Cache strategy */
  strategy: CacheStrategy;
  /** Maximum cache size in bytes */
  maxSize?: number;
  /** Time-to-live for cached items in milliseconds */
  ttl?: number;
  /** Enable cache versioning */
  versioning?: boolean;
  /** Cache key prefix */
  keyPrefix?: string;
}

/**
 * Configuration for sync engine
 */
export interface OfflineSyncConfig {
  /** Auto-sync when connection restored */
  autoSync?: boolean;
  /** Sync interval in milliseconds */
  syncInterval?: number;
  /** Batch size for sync operations */
  batchSize?: number;
  /** Conflict resolution strategy */
  conflictStrategy?: ConflictStrategy;
  /** Enable background sync (requires Service Worker) */
  backgroundSync?: boolean;
  /** Background sync tag name */
  syncTag?: string;
}

/**
 * Complete offline configuration
 */
export interface OfflineConfig {
  storage: OfflineStorageConfig;
  queue: OfflineQueueConfig;
  cache: OfflineCacheConfig;
  sync: OfflineSyncConfig;
}

/**
 * Queued operation in offline queue
 */
export interface QueuedOperation<T = unknown> {
  /** Unique operation ID */
  id: string;
  /** Operation type */
  type: OperationType;
  /** Operation timestamp */
  timestamp: number;
  /** Operation data */
  data: T;
  /** Number of retry attempts */
  retries: number;
  /** Maximum retries allowed */
  maxRetries: number;
  /** Next retry timestamp */
  nextRetry?: number;
  /** Sync status */
  status: SyncStatus;
  /** Error message if failed */
  error?: string;
  /** Priority (higher numbers = higher priority) */
  priority?: number;
  /** Dependencies (IDs of operations that must complete first) */
  dependencies?: string[];
  /** Metadata for custom use */
  metadata?: Record<string, unknown>;
}

/**
 * Offline queue interface
 */
export interface OfflineQueue<T = unknown> {
  /** All operations in queue */
  operations: QueuedOperation<T>[];
  /** Maximum queue size */
  maxSize: number;
  /** Retry strategy */
  retryStrategy: RetryStrategy;
}

/**
 * Conflict report for sync conflicts
 */
export interface ConflictReport {
  /** Operation ID that conflicted */
  operationId: string;
  /** Conflict type */
  type: 'version' | 'concurrent' | 'deleted' | 'custom';
  /** Local version */
  localVersion: unknown;
  /** Remote version */
  remoteVersion: unknown;
  /** Resolution strategy used */
  resolution: ConflictStrategy;
  /** Resolved version */
  resolvedVersion?: unknown;
  /** Manual resolution required */
  requiresManual: boolean;
  /** Conflict timestamp */
  timestamp: number;
}

/**
 * Sync result after synchronization
 */
export interface SyncResult {
  /** Number of operations synced successfully */
  synced: number;
  /** Number of operations failed */
  failed: number;
  /** Number of conflicts detected */
  conflicts: number;
  /** Detailed conflict reports */
  conflictReports: ConflictReport[];
  /** Sync duration in milliseconds */
  duration: number;
  /** Sync timestamp */
  timestamp: number;
  /** Errors encountered */
  errors?: Array<{ operationId: string; error: string }>;
}

/**
 * Cached item in offline cache
 */
export interface CachedItem<T = unknown> {
  /** Unique cache key */
  key: string;
  /** Cached data */
  data: T;
  /** Cache timestamp */
  timestamp: number;
  /** Expiration timestamp */
  expires?: number;
  /** Data version */
  version?: number;
  /** ETag for HTTP caching */
  etag?: string;
  /** Cache metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Storage item in offline storage
 */
export interface StorageItem<T = unknown> {
  /** Unique storage key */
  key: string;
  /** Stored data */
  data: T;
  /** Storage timestamp */
  timestamp: number;
  /** Data version */
  version: number;
  /** Last modified timestamp */
  lastModified: number;
  /** Sync status */
  syncStatus: SyncStatus;
  /** Storage metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Connection info for network monitoring
 */
export interface ConnectionInfo {
  /** Connection status */
  status: ConnectionStatus;
  /** Connection type (4g, wifi, etc.) */
  type?: string;
  /** Effective bandwidth estimate in Mbps */
  effectiveBandwidth?: number;
  /** Round-trip time in milliseconds */
  rtt?: number;
  /** Data saver mode enabled */
  saveData?: boolean;
}

/**
 * Sync event data
 */
export interface SyncEvent {
  /** Event type */
  type: 'sync-start' | 'sync-complete' | 'sync-error' | 'conflict-detected' | 'connection-change';
  /** Event timestamp */
  timestamp: number;
  /** Sync result (for sync-complete) */
  result?: SyncResult;
  /** Error message (for sync-error) */
  error?: string;
  /** Connection info (for connection-change) */
  connectionInfo?: ConnectionInfo;
  /** Conflict report (for conflict-detected) */
  conflict?: ConflictReport;
}

/**
 * Operational Transform operation
 */
export interface OTOperation {
  /** Operation type */
  type: 'insert' | 'delete' | 'retain';
  /** Position in document */
  position: number;
  /** Characters to insert/delete */
  chars?: string;
  /** Number of characters to retain */
  count?: number;
  /** Operation metadata */
  metadata?: Record<string, unknown>;
}

/**
 * CRDT (Conflict-free Replicated Data Type) data structure
 */
export interface CRDTData {
  /** Node ID */
  nodeId: string;
  /** Logical clock */
  clock: number;
  /** Data value */
  value: unknown;
  /** Vector clock for causality tracking */
  vectorClock: Record<string, number>;
  /** Tombstones for deleted items */
  tombstones?: Set<string>;
}

/**
 * Conflict resolution context
 */
export interface ConflictContext {
  /** Strategy to use */
  strategy: ConflictStrategy;
  /** Local data */
  local: StorageItem;
  /** Remote data */
  remote: StorageItem;
  /** Previous common ancestor (for 3-way merge) */
  base?: StorageItem;
  /** Custom resolver function */
  customResolver?: (local: StorageItem, remote: StorageItem, base?: StorageItem) => StorageItem;
}

/**
 * Retry context for operation retries
 */
export interface RetryContext {
  /** Current retry attempt (0-indexed) */
  attempt: number;
  /** Maximum retries allowed */
  maxRetries: number;
  /** Retry strategy */
  strategy: RetryStrategy;
  /** Base delay in milliseconds */
  baseDelay: number;
  /** Maximum delay in milliseconds */
  maxDelay: number;
  /** Last error */
  lastError?: string;
}

/**
 * Background sync options
 */
export interface BackgroundSyncOptions {
  /** Sync tag name */
  tag: string;
  /** Minimum interval between syncs (ms) */
  minInterval?: number;
  /** Network conditions required */
  networkState?: 'online' | 'any';
}

/**
 * Offline handler interface
 */
export interface OfflineHandler {
  /** Initialize offline handler */
  initialize(config: OfflineConfig): Promise<void>;
  /** Check if offline mode is enabled */
  isOffline(): boolean;
  /** Queue an operation */
  queueOperation<T>(operation: Omit<QueuedOperation<T>, 'id' | 'timestamp' | 'retries' | 'status'>): Promise<string>;
  /** Sync pending operations */
  sync(): Promise<SyncResult>;
  /** Get queue status */
  getQueueStatus(): Promise<{ pending: number; failed: number; synced: number }>;
  /** Clear queue */
  clearQueue(): Promise<void>;
  /** Register sync listener */
  onSync(listener: (event: SyncEvent) => void): () => void;
}

/**
 * Storage statistics
 */
export interface StorageStats {
  /** Total items stored */
  totalItems: number;
  /** Total size in bytes */
  totalSize: number;
  /** Available space in bytes */
  availableSize?: number;
  /** Storage backend used */
  backend: StorageBackend;
  /** Items by sync status */
  statusBreakdown: Record<SyncStatus, number>;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /** Total cached items */
  totalItems: number;
  /** Total cache size in bytes */
  totalSize: number;
  /** Hit rate (0-1) */
  hitRate: number;
  /** Miss rate (0-1) */
  missRate: number;
  /** Eviction count */
  evictions: number;
}

/**
 * Export all types for offline support
 */
export type {
  // Re-export for convenience
  RetryStrategy as OfflineRetryStrategy,
  ConflictStrategy as OfflineConflictStrategy,
  CacheStrategy as OfflineCacheStrategy,
  StorageBackend as OfflineStorageBackend,
  OperationType as OfflineOperationType,
  SyncStatus as OfflineSyncStatus,
  ConnectionStatus as OfflineConnectionStatus,
};
