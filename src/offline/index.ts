/**
 * Offline Module Exports
 * Provides offline-first functionality for A2UI Core
 */

export { OfflineStorage, storage } from './storage';
export { OfflineQueue, queue } from './queue';
export { OfflineCache, cache } from './cache';
export { ConflictResolver, conflictResolver } from './conflict-resolver';
export { SyncEngine, syncEngine } from './sync-engine';

// Re-export types
export type {
  StorageItem,
  OfflineStorageConfig,
  StorageBackend,
  StorageStats,
  QueuedOperation,
  OfflineQueue as OfflineQueueInterface,
  OfflineQueueConfig,
  RetryStrategy,
  OperationType,
  SyncStatus,
  CachedItem,
  OfflineCacheConfig,
  CacheStrategy,
  CacheStats,
  ConflictStrategy,
  ConflictContext,
  ConflictReport,
  SyncResult,
  SyncEvent,
  OfflineSyncConfig,
  ConnectionInfo,
  ConnectionStatus,
  OTOperation,
  CRDTData,
  OfflineConfig,
  OfflineHandler,
} from '../types/offline-types';
