/**
 * Offline Queue Implementation
 * Manages operation queue with retry strategies and priorities
 */

import type {
  QueuedOperation,
  OfflineQueueConfig,
  RetryStrategy,
  SyncStatus
} from '../types/offline-types';
import { OfflineStorage } from './storage';

/**
 * Default queue configuration
 */
const DEFAULT_CONFIG: Required<OfflineQueueConfig> = {
  maxSize: 1000,
  retryStrategy: 'exponential',
  maxRetries: 3,
  retryDelay: 1000,
  maxRetryDelay: 60000,
  persistent: true,
};

/**
 * Offline queue for managing operations with retry support
 */
export class OfflineQueue<T = unknown> {
  private operations: Map<string, QueuedOperation<T>> = new Map();
  private config: Required<OfflineQueueConfig>;
  private storage: OfflineStorage | null = null;
  private nextId = 1;
  private initialized = false;

  constructor(config: OfflineQueueConfig) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    // Initialize storage for persistent queue
    if (this.config.persistent) {
      this.storage = new OfflineStorage({
        databaseName: 'a2ui-offline-queue',
        backend: 'indexeddb',
      });
    }
  }

  /**
   * Initialize queue (loads from storage if persistent)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    if (this.storage) {
      await this.storage.initialize();
      await this.loadFromStorage();
    }

    this.initialized = true;
  }

  /**
   * Load queue from persistent storage
   */
  private async loadFromStorage(): Promise<void> {
    if (!this.storage) return;

    const items = await this.storage.getAll<QueuedOperation<T>>();
    items.forEach(item => {
      if (item.data) {
        this.operations.set(item.key, item.data);
        // Update nextId to avoid collisions
        const idNum = parseInt(item.key.replace('queue:', '').split('_')[1] || '0');
        if (idNum >= this.nextId) {
          this.nextId = idNum + 1;
        }
      }
    });
  }

  /**
   * Save operation to persistent storage
   */
  private async saveToStorage(operation: QueuedOperation<T>): Promise<void> {
    if (!this.storage) return;

    await this.storage.set(`queue:${operation.id}`, operation);
  }

  /**
   * Remove operation from persistent storage
   */
  private async removeFromStorage(id: string): Promise<void> {
    if (!this.storage) return;

    await this.storage.delete(`queue:${id}`);
  }

  /**
   * Add operation to queue
   */
  async add(operation: Omit<QueuedOperation<T>, 'id' | 'timestamp' | 'retries' | 'status'>): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.operations.size >= this.config.maxSize) {
      throw new Error('Queue is full');
    }

    const id = `op_${this.nextId++}`;
    const queuedOp: QueuedOperation<T> = {
      ...operation,
      id,
      timestamp: Date.now(),
      retries: 0,
      status: 'pending' as SyncStatus,
      maxRetries: operation.maxRetries ?? this.config.maxRetries,
    };

    this.operations.set(id, queuedOp);
    await this.saveToStorage(queuedOp);

    return id;
  }

  /**
   * Get operation by ID
   */
  async get(id: string): Promise<QueuedOperation<T> | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    return this.operations.get(id) || null;
  }

  /**
   * Remove operation from queue
   */
  async remove(id: string): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    this.operations.delete(id);
    await this.removeFromStorage(id);
  }

  /**
   * Get all operations
   */
  async getAll(): Promise<QueuedOperation<T>[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    return Array.from(this.operations.values());
  }

  /**
   * Get pending operations
   */
  async getPending(): Promise<QueuedOperation<T>[]> {
    return this.getByStatus('pending');
  }

  /**
   * Get operations by status
   */
  async getByStatus(status: SyncStatus): Promise<QueuedOperation<T>[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    return Array.from(this.operations.values()).filter(op => op.status === status);
  }

  /**
   * Update operation status
   */
  async updateStatus(id: string, status: SyncStatus, error?: string): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    const operation = this.operations.get(id);
    if (!operation) return;

    operation.status = status;
    if (error) {
      operation.error = error;
    }

    this.operations.set(id, operation);
    await this.saveToStorage(operation);
  }

  /**
   * Retry operation
   * @returns true if retry scheduled, false if max retries exceeded
   */
  async retry(id: string): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    const operation = this.operations.get(id);
    if (!operation) return false;

    if (operation.retries >= operation.maxRetries) {
      operation.status = 'failed';
      this.operations.set(id, operation);
      await this.saveToStorage(operation);
      return false;
    }

    operation.retries++;
    operation.status = 'pending';
    operation.nextRetry = this.calculateNextRetry(operation.retries);

    this.operations.set(id, operation);
    await this.saveToStorage(operation);

    return true;
  }

  /**
   * Calculate next retry timestamp based on strategy
   */
  private calculateNextRetry(retryCount: number): number {
    const now = Date.now();

    switch (this.config.retryStrategy) {
      case 'exponential':
        // Exponential backoff: delay * 2^(retry-1)
        return now + Math.min(
          this.config.retryDelay * Math.pow(2, retryCount - 1),
          this.config.maxRetryDelay
        );

      case 'linear':
        // Linear backoff: delay * retry
        return now + Math.min(
          this.config.retryDelay * retryCount,
          this.config.maxRetryDelay
        );

      case 'fixed':
        // Fixed delay
        return now + this.config.retryDelay;

      case 'none':
        // No delay
        return now;

      default:
        return now + this.config.retryDelay;
    }
  }

  /**
   * Get operations ready for processing
   * (pending status and retry time has passed)
   */
  async getReadyOperations(): Promise<QueuedOperation<T>[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    const now = Date.now();
    return Array.from(this.operations.values()).filter(op => {
      return op.status === 'pending' && (!op.nextRetry || op.nextRetry <= now);
    });
  }

  /**
   * Update operation priority
   */
  async prioritize(id: string, priority: number): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    const operation = this.operations.get(id);
    if (!operation) return;

    operation.priority = priority;
    this.operations.set(id, operation);
    await this.saveToStorage(operation);
  }

  /**
   * Get operations sorted by priority (highest first)
   */
  async getSortedByPriority(): Promise<QueuedOperation<T>[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    const operations = Array.from(this.operations.values());
    return operations.sort((a, b) => {
      const priorityA = a.priority ?? 0;
      const priorityB = b.priority ?? 0;
      return priorityB - priorityA; // Higher priority first
    });
  }

  /**
   * Check if operation dependencies are satisfied
   */
  async checkDependencies(operation: QueuedOperation<T>): Promise<boolean> {
    if (!operation.dependencies || operation.dependencies.length === 0) {
      return true;
    }

    for (const depId of operation.dependencies) {
      const dep = this.operations.get(depId);
      if (!dep || dep.status !== 'synced') {
        return false;
      }
    }

    return true;
  }

  /**
   * Get operations that are ready to process (considering dependencies)
   */
  async getReadyWithDependencies(): Promise<QueuedOperation<T>[]> {
    const ready = await this.getReadyOperations();
    const readyWithDeps: QueuedOperation<T>[] = [];

    for (const op of ready) {
      if (await this.checkDependencies(op)) {
        readyWithDeps.push(op);
      }
    }

    return readyWithDeps;
  }

  /**
   * Clear queue
   */
  async clear(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    this.operations.clear();

    if (this.storage) {
      await this.storage.clear();
    }
  }

  /**
   * Get queue size
   */
  async size(): Promise<number> {
    if (!this.initialized) {
      await this.initialize();
    }

    return this.operations.size;
  }

  /**
   * Get queue configuration
   */
  getConfig(): OfflineQueueConfig {
    return { ...this.config };
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    total: number;
    pending: number;
    syncing: number;
    synced: number;
    failed: number;
    conflict: number;
  }> {
    if (!this.initialized) {
      await this.initialize();
    }

    const stats = {
      total: this.operations.size,
      pending: 0,
      syncing: 0,
      synced: 0,
      failed: 0,
      conflict: 0,
    };

    this.operations.forEach(op => {
      stats[op.status]++;
    });

    return stats;
  }

  /**
   * Clean up completed operations older than specified time
   */
  async cleanup(olderThan: number = 24 * 60 * 60 * 1000): Promise<number> {
    if (!this.initialized) {
      await this.initialize();
    }

    const now = Date.now();
    const toRemove: string[] = [];

    this.operations.forEach(op => {
      if (
        (op.status === 'synced' || op.status === 'failed') &&
        now - op.timestamp > olderThan
      ) {
        toRemove.push(op.id);
      }
    });

    for (const id of toRemove) {
      await this.remove(id);
    }

    return toRemove.length;
  }

  /**
   * Close queue and cleanup resources
   */
  async close(): Promise<void> {
    if (this.storage) {
      await this.storage.close();
    }
    this.initialized = false;
  }
}

/**
 * Export default queue instance for convenience
 */
export const queue = new OfflineQueue({
  maxSize: 1000,
  retryStrategy: 'exponential',
  maxRetries: 3,
  retryDelay: 1000,
  maxRetryDelay: 60000,
  persistent: true,
});
