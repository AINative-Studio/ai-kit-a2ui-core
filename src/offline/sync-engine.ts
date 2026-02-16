/**
 * Sync Engine Implementation
 * Coordinates synchronization between offline and online states
 */

import type {
  OfflineSyncConfig,
  SyncResult,
  SyncEvent,
  ConnectionInfo,
  ConnectionStatus,
  ConflictReport
} from '../types/offline-types';
import { OfflineQueue } from './queue';
import { OfflineStorage } from './storage';
import { ConflictResolver } from './conflict-resolver';

/**
 * Default sync configuration
 */
const DEFAULT_CONFIG: Required<OfflineSyncConfig> = {
  autoSync: true,
  syncInterval: 60000, // 1 minute
  batchSize: 50,
  conflictStrategy: 'last-write-wins',
  backgroundSync: false,
  syncTag: 'a2ui-offline-sync',
};

/**
 * Sync engine for managing offline/online synchronization
 */
export class SyncEngine {
  private config: Required<OfflineSyncConfig>;
  private queue: OfflineQueue;
  private storage: OfflineStorage;
  private resolver: ConflictResolver;
  private syncListeners: Array<(event: SyncEvent) => void> = [];
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private isSyncing = false;
  private connectionStatus: ConnectionStatus = 'online';

  constructor(
    config: OfflineSyncConfig,
    queue?: OfflineQueue,
    storage?: OfflineStorage,
    resolver?: ConflictResolver
  ) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    this.queue = queue || new OfflineQueue({
      maxSize: 1000,
      retryStrategy: 'exponential',
    });

    this.storage = storage || new OfflineStorage();
    this.resolver = resolver || new ConflictResolver();

    // Setup connection monitoring
    this.setupConnectionMonitoring();
  }

  /**
   * Initialize sync engine
   */
  async initialize(): Promise<void> {
    await this.queue.initialize();
    await this.storage.initialize();

    if (this.config.autoSync && this.config.syncInterval > 0) {
      this.startAutoSync();
    }

    // Register background sync if supported
    if (this.config.backgroundSync && 'serviceWorker' in navigator) {
      await this.registerBackgroundSync();
    }
  }

  /**
   * Setup connection status monitoring
   */
  private setupConnectionMonitoring(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.handleConnectionChange('online');
    });

    window.addEventListener('offline', () => {
      this.handleConnectionChange('offline');
    });

    // Initial status
    this.connectionStatus = navigator.onLine ? 'online' : 'offline';
  }

  /**
   * Handle connection status change
   */
  private async handleConnectionChange(status: ConnectionStatus): Promise<void> {
    this.connectionStatus = status;

    const connectionInfo: ConnectionInfo = {
      status,
      type: this.getConnectionType(),
    };

    this.emitEvent({
      type: 'connection-change',
      timestamp: Date.now(),
      connectionInfo,
    });

    // Auto-sync when coming online
    if (status === 'online' && this.config.autoSync) {
      await this.sync();
    }
  }

  /**
   * Get connection type
   */
  private getConnectionType(): string | undefined {
    if (typeof navigator === 'undefined' || !('connection' in navigator)) {
      return undefined;
    }

    const connection = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
    return connection?.effectiveType;
  }

  /**
   * Start auto-sync interval
   */
  private startAutoSync(): void {
    if (this.syncInterval) return;

    this.syncInterval = setInterval(async () => {
      if (this.connectionStatus === 'online' && !this.isSyncing) {
        await this.sync();
      }
    }, this.config.syncInterval);
  }

  /**
   * Stop auto-sync interval
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Perform synchronization
   */
  async sync(): Promise<SyncResult> {
    if (this.isSyncing) {
      throw new Error('Sync already in progress');
    }

    if (this.connectionStatus === 'offline') {
      throw new Error('Cannot sync while offline');
    }

    this.isSyncing = true;
    const startTime = Date.now();

    this.emitEvent({
      type: 'sync-start',
      timestamp: startTime,
    });

    try {
      const result = await this.performSync();

      this.emitEvent({
        type: 'sync-complete',
        timestamp: Date.now(),
        result,
      });

      return result;
    } catch (error) {
      this.emitEvent({
        type: 'sync-error',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Perform actual synchronization
   */
  private async performSync(): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      synced: 0,
      failed: 0,
      conflicts: 0,
      conflictReports: [],
      duration: 0,
      timestamp: startTime,
      errors: [],
    };

    // Get ready operations with dependencies resolved
    const operations = await this.queue.getReadyWithDependencies();
    const batches = this.createBatches(operations, this.config.batchSize);

    for (const batch of batches) {
      for (const operation of batch) {
        try {
          // Check for conflicts
          const storageItem = await this.storage.get(operation.id);
          if (storageItem && this.resolver.hasConflict(storageItem, storageItem)) {
            // Resolve conflict
            const { resolved, report } = await this.resolver.resolve({
              strategy: this.config.conflictStrategy!,
              local: storageItem,
              remote: storageItem, // In real implementation, fetch from server
            });

            result.conflicts++;
            result.conflictReports.push(report);

            this.emitEvent({
              type: 'conflict-detected',
              timestamp: Date.now(),
              conflict: report,
            });

            // Update with resolved version
            await this.storage.set(operation.id, resolved.data, resolved.metadata);
          }

          // Mark as synced
          await this.queue.updateStatus(operation.id, 'synced');
          await this.storage.updateSyncStatus(operation.id, 'synced');
          result.synced++;
        } catch (error) {
          // Handle sync failure
          await this.queue.updateStatus(
            operation.id,
            'failed',
            error instanceof Error ? error.message : 'Unknown error'
          );

          result.failed++;
          result.errors!.push({
            operationId: operation.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });

          // Retry if possible
          await this.queue.retry(operation.id);
        }
      }
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Create batches from operations
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Register background sync
   */
  private async registerBackgroundSync(): Promise<void> {
    if (!('serviceWorker' in navigator) || !('sync' in (await navigator.serviceWorker.ready))) {
      console.warn('Background Sync not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as ServiceWorkerRegistration & { sync?: { register(tag: string): Promise<void> } })
        .sync?.register(this.config.syncTag!);
    } catch (error) {
      console.error('Failed to register background sync:', error);
    }
  }

  /**
   * Register sync event listener
   */
  onSync(listener: (event: SyncEvent) => void): () => void {
    this.syncListeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.syncListeners.indexOf(listener);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  /**
   * Emit sync event to listeners
   */
  private emitEvent(event: SyncEvent): void {
    this.syncListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    });
  }

  /**
   * Get sync status
   */
  getStatus(): {
    isSyncing: boolean;
    connectionStatus: ConnectionStatus;
    autoSync: boolean;
  } {
    return {
      isSyncing: this.isSyncing,
      connectionStatus: this.connectionStatus,
      autoSync: this.config.autoSync,
    };
  }

  /**
   * Force sync regardless of connection status (for testing)
   */
  async forceSync(): Promise<SyncResult> {
    const previousStatus = this.connectionStatus;
    this.connectionStatus = 'online';
    try {
      return await this.sync();
    } finally {
      this.connectionStatus = previousStatus;
    }
  }

  /**
   * Cleanup and close sync engine
   */
  async close(): Promise<void> {
    this.stopAutoSync();
    await this.queue.close();
    await this.storage.close();
    this.syncListeners = [];
  }
}

/**
 * Export default sync engine instance
 */
export const syncEngine = new SyncEngine({
  autoSync: true,
  syncInterval: 60000,
  batchSize: 50,
  conflictStrategy: 'last-write-wins',
  backgroundSync: false,
});
