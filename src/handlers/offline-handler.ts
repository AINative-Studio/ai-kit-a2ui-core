/**
 * Offline Handler Implementation
 * Main interface for offline-first functionality
 */

import type {
  OfflineConfig,
  OfflineHandler as IOfflineHandler,
  QueuedOperation,
  SyncResult,
  SyncEvent
} from '../types/offline-types';
import { OfflineStorage } from '../offline/storage';
import { OfflineQueue } from '../offline/queue';
import { OfflineCache } from '../offline/cache';
import { SyncEngine } from '../offline/sync-engine';
import { ConflictResolver } from '../offline/conflict-resolver';

/**
 * Default offline configuration
 */
const DEFAULT_CONFIG: OfflineConfig = {
  storage: {
    backend: 'indexeddb',
    databaseName: 'a2ui-offline',
    version: 1,
    maxSize: 50 * 1024 * 1024,
    compression: false,
    encryption: false,
  },
  queue: {
    maxSize: 1000,
    retryStrategy: 'exponential',
    maxRetries: 3,
    retryDelay: 1000,
    maxRetryDelay: 60000,
    persistent: true,
  },
  cache: {
    strategy: 'network-first',
    maxSize: 10 * 1024 * 1024,
    ttl: 5 * 60 * 1000,
    versioning: true,
    keyPrefix: 'a2ui:cache:',
  },
  sync: {
    autoSync: true,
    syncInterval: 60000,
    batchSize: 50,
    conflictStrategy: 'last-write-wins',
    backgroundSync: false,
    syncTag: 'a2ui-offline-sync',
  },
};

/**
 * Offline handler for managing offline-first operations
 */
export class OfflineHandler implements IOfflineHandler {
  private config: OfflineConfig;
  private storage: OfflineStorage;
  private queue: OfflineQueue;
  private cache: OfflineCache;
  private syncEngine: SyncEngine;
  private resolver: ConflictResolver;
  private initialized = false;
  private offline = false;

  constructor(config?: Partial<OfflineConfig>) {
    this.config = {
      storage: { ...DEFAULT_CONFIG.storage, ...config?.storage },
      queue: { ...DEFAULT_CONFIG.queue, ...config?.queue },
      cache: { ...DEFAULT_CONFIG.cache, ...config?.cache },
      sync: { ...DEFAULT_CONFIG.sync, ...config?.sync },
    };

    this.storage = new OfflineStorage(this.config.storage);
    this.queue = new OfflineQueue(this.config.queue);
    this.cache = new OfflineCache(this.config.cache);
    this.resolver = new ConflictResolver();
    this.syncEngine = new SyncEngine(
      this.config.sync,
      this.queue,
      this.storage,
      this.resolver
    );

    // Monitor connection status
    this.setupConnectionMonitoring();
  }

  /**
   * Setup connection monitoring
   */
  private setupConnectionMonitoring(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.offline = false;
    });

    window.addEventListener('offline', () => {
      this.offline = true;
    });

    this.offline = !navigator.onLine;
  }

  /**
   * Initialize offline handler
   */
  async initialize(config?: OfflineConfig): Promise<void> {
    if (this.initialized) return;

    if (config) {
      this.config = {
        storage: { ...this.config.storage, ...config.storage },
        queue: { ...this.config.queue, ...config.queue },
        cache: { ...this.config.cache, ...config.cache },
        sync: { ...this.config.sync, ...config.sync },
      };
    }

    await this.storage.initialize();
    await this.queue.initialize();
    await this.syncEngine.initialize();

    this.initialized = true;
  }

  /**
   * Check if offline mode is enabled
   */
  isOffline(): boolean {
    return this.offline;
  }

  /**
   * Queue an operation
   */
  async queueOperation<T>(
    operation: Omit<QueuedOperation<T>, 'id' | 'timestamp' | 'retries' | 'status'>
  ): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    return this.queue.add(operation);
  }

  /**
   * Sync pending operations
   */
  async sync(): Promise<SyncResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    return this.syncEngine.sync();
  }

  /**
   * Get queue status
   */
  async getQueueStatus(): Promise<{ pending: number; failed: number; synced: number }> {
    if (!this.initialized) {
      await this.initialize();
    }

    const stats = await this.queue.getStats();
    return {
      pending: stats.pending,
      failed: stats.failed,
      synced: stats.synced,
    };
  }

  /**
   * Clear queue
   */
  async clearQueue(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    await this.queue.clear();
  }

  /**
   * Register sync listener
   */
  onSync(listener: (event: SyncEvent) => void): () => void {
    return this.syncEngine.onSync(listener);
  }

  /**
   * Cache a value
   */
  async cacheValue<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    await this.cache.set(key, value, { ttl });
  }

  /**
   * Get cached value
   */
  async getCached<T>(key: string): Promise<T | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    return this.cache.get(key);
  }

  /**
   * Store data in offline storage
   */
  async store<T>(key: string, data: T, metadata?: Record<string, unknown>): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    await this.storage.set(key, data, metadata);
  }

  /**
   * Retrieve data from offline storage
   */
  async retrieve<T>(key: string): Promise<T | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    const item = await this.storage.get<T>(key);
    return item ? item.data : null;
  }

  /**
   * Get all storage stats
   */
  async getStats(): Promise<{
    storage: ReturnType<typeof this.storage.getStats>;
    queue: ReturnType<typeof this.queue.getStats>;
    cache: ReturnType<typeof this.cache.getStats>;
  }> {
    if (!this.initialized) {
      await this.initialize();
    }

    return {
      storage: await this.storage.getStats(),
      queue: await this.queue.getStats(),
      cache: await this.cache.getStats(),
    };
  }

  /**
   * Close and cleanup
   */
  async close(): Promise<void> {
    await this.syncEngine.close();
    await this.storage.close();
    await this.queue.close();
    this.initialized = false;
  }
}

/**
 * Export default offline handler instance
 */
export const offlineHandler = new OfflineHandler();
