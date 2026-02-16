/**
 * Tests for Offline Queue
 * Operation queuing with retry strategies
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type {
  QueuedOperation,
  OfflineQueueConfig,
  RetryStrategy,
  OperationType,
  SyncStatus
} from '../../src/types/offline-types';

// Queue implementation to be tested
class OfflineQueue<T = unknown> {
  private operations: Map<string, QueuedOperation<T>> = new Map();
  private config: Required<OfflineQueueConfig>;
  private nextId = 1;

  constructor(config: OfflineQueueConfig) {
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      maxRetryDelay: 60000,
      persistent: true,
      ...config,
    };
  }

  async add(operation: Omit<QueuedOperation<T>, 'id' | 'timestamp' | 'retries' | 'status'>): Promise<string> {
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
      maxRetries: operation.maxRetries ?? this.config.maxRetries ?? 3,
    };

    this.operations.set(id, queuedOp);
    return id;
  }

  async get(id: string): Promise<QueuedOperation<T> | null> {
    return this.operations.get(id) || null;
  }

  async remove(id: string): Promise<void> {
    this.operations.delete(id);
  }

  async getAll(): Promise<QueuedOperation<T>[]> {
    return Array.from(this.operations.values());
  }

  async getPending(): Promise<QueuedOperation<T>[]> {
    return Array.from(this.operations.values()).filter(op => op.status === 'pending');
  }

  async getByStatus(status: SyncStatus): Promise<QueuedOperation<T>[]> {
    return Array.from(this.operations.values()).filter(op => op.status === status);
  }

  async updateStatus(id: string, status: SyncStatus, error?: string): Promise<void> {
    const operation = this.operations.get(id);
    if (!operation) return;

    operation.status = status;
    if (error) {
      operation.error = error;
    }

    this.operations.set(id, operation);
  }

  async retry(id: string): Promise<boolean> {
    const operation = this.operations.get(id);
    if (!operation) return false;

    if (operation.retries >= operation.maxRetries) {
      operation.status = 'failed';
      this.operations.set(id, operation);
      return false;
    }

    operation.retries++;
    operation.status = 'pending';
    operation.nextRetry = this.calculateNextRetry(operation.retries);

    this.operations.set(id, operation);
    return true;
  }

  private calculateNextRetry(retryCount: number): number {
    const now = Date.now();

    switch (this.config.retryStrategy) {
      case 'exponential':
        return now + Math.min(
          this.config.retryDelay * Math.pow(2, retryCount - 1),
          this.config.maxRetryDelay
        );

      case 'linear':
        return now + Math.min(
          this.config.retryDelay * retryCount,
          this.config.maxRetryDelay
        );

      case 'fixed':
        return now + this.config.retryDelay;

      case 'none':
        return now;

      default:
        return now + this.config.retryDelay;
    }
  }

  async clear(): Promise<void> {
    this.operations.clear();
  }

  async size(): Promise<number> {
    return this.operations.size;
  }

  getConfig(): OfflineQueueConfig {
    return { ...this.config };
  }

  async getReadyOperations(): Promise<QueuedOperation<T>[]> {
    const now = Date.now();
    return Array.from(this.operations.values()).filter(op => {
      return op.status === 'pending' && (!op.nextRetry || op.nextRetry <= now);
    });
  }

  async prioritize(id: string, priority: number): Promise<void> {
    const operation = this.operations.get(id);
    if (!operation) return;

    operation.priority = priority;
    this.operations.set(id, operation);
  }

  async getSortedByPriority(): Promise<QueuedOperation<T>[]> {
    const operations = Array.from(this.operations.values());
    return operations.sort((a, b) => {
      const priorityA = a.priority ?? 0;
      const priorityB = b.priority ?? 0;
      return priorityB - priorityA; // Higher priority first
    });
  }

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
}

describe('OfflineQueue', () => {
  let queue: OfflineQueue;

  describe('Initialization', () => {
    it('should initialize with basic config', () => {
      queue = new OfflineQueue({
        maxSize: 100,
        retryStrategy: 'exponential',
      });

      expect(queue).toBeDefined();
      expect(queue.getConfig().maxSize).toBe(100);
      expect(queue.getConfig().retryStrategy).toBe('exponential');
    });

    it('should use default retry config', () => {
      queue = new OfflineQueue({
        maxSize: 100,
        retryStrategy: 'exponential',
      });

      const config = queue.getConfig();
      expect(config.maxRetries).toBe(3);
      expect(config.retryDelay).toBe(1000);
      expect(config.maxRetryDelay).toBe(60000);
    });

    it('should accept custom retry config', () => {
      queue = new OfflineQueue({
        maxSize: 100,
        retryStrategy: 'linear',
        maxRetries: 5,
        retryDelay: 2000,
        maxRetryDelay: 120000,
      });

      const config = queue.getConfig();
      expect(config.maxRetries).toBe(5);
      expect(config.retryDelay).toBe(2000);
      expect(config.maxRetryDelay).toBe(120000);
    });
  });

  describe('Basic Operations', () => {
    beforeEach(() => {
      queue = new OfflineQueue({
        maxSize: 100,
        retryStrategy: 'exponential',
      });
    });

    afterEach(async () => {
      await queue.clear();
    });

    it('should add operation to queue', async () => {
      const id = await queue.add({
        type: 'create',
        data: { value: 'test' },
        maxRetries: 3,
      });

      expect(id).toBeDefined();
      expect(id).toMatch(/^op_\d+$/);
    });

    it('should retrieve operation by id', async () => {
      const id = await queue.add({
        type: 'update',
        data: { value: 'test' },
        maxRetries: 3,
      });

      const operation = await queue.get(id);

      expect(operation).toBeDefined();
      expect(operation?.id).toBe(id);
      expect(operation?.type).toBe('update');
      expect(operation?.data).toEqual({ value: 'test' });
    });

    it('should return null for non-existent operation', async () => {
      const operation = await queue.get('non-existent');

      expect(operation).toBeNull();
    });

    it('should remove operation from queue', async () => {
      const id = await queue.add({
        type: 'delete',
        data: { id: '123' },
        maxRetries: 3,
      });

      await queue.remove(id);
      const operation = await queue.get(id);

      expect(operation).toBeNull();
    });

    it('should get all operations', async () => {
      await queue.add({ type: 'create', data: { value: 1 }, maxRetries: 3 });
      await queue.add({ type: 'update', data: { value: 2 }, maxRetries: 3 });
      await queue.add({ type: 'delete', data: { value: 3 }, maxRetries: 3 });

      const operations = await queue.getAll();

      expect(operations).toHaveLength(3);
    });

    it('should clear queue', async () => {
      await queue.add({ type: 'create', data: { value: 1 }, maxRetries: 3 });
      await queue.add({ type: 'create', data: { value: 2 }, maxRetries: 3 });

      await queue.clear();
      const size = await queue.size();

      expect(size).toBe(0);
    });

    it('should track queue size', async () => {
      expect(await queue.size()).toBe(0);

      await queue.add({ type: 'create', data: { value: 1 }, maxRetries: 3 });
      expect(await queue.size()).toBe(1);

      await queue.add({ type: 'create', data: { value: 2 }, maxRetries: 3 });
      expect(await queue.size()).toBe(2);
    });

    it('should enforce max queue size', async () => {
      const smallQueue = new OfflineQueue({
        maxSize: 2,
        retryStrategy: 'fixed',
      });

      await smallQueue.add({ type: 'create', data: { value: 1 }, maxRetries: 3 });
      await smallQueue.add({ type: 'create', data: { value: 2 }, maxRetries: 3 });

      await expect(
        smallQueue.add({ type: 'create', data: { value: 3 }, maxRetries: 3 })
      ).rejects.toThrow('Queue is full');
    });
  });

  describe('Status Management', () => {
    beforeEach(() => {
      queue = new OfflineQueue({
        maxSize: 100,
        retryStrategy: 'exponential',
      });
    });

    afterEach(async () => {
      await queue.clear();
    });

    it('should initialize with pending status', async () => {
      const id = await queue.add({
        type: 'create',
        data: { value: 'test' },
        maxRetries: 3,
      });

      const operation = await queue.get(id);

      expect(operation?.status).toBe('pending');
    });

    it('should update operation status', async () => {
      const id = await queue.add({
        type: 'create',
        data: { value: 'test' },
        maxRetries: 3,
      });

      await queue.updateStatus(id, 'syncing');
      const operation = await queue.get(id);

      expect(operation?.status).toBe('syncing');
    });

    it('should store error message with status', async () => {
      const id = await queue.add({
        type: 'create',
        data: { value: 'test' },
        maxRetries: 3,
      });

      await queue.updateStatus(id, 'failed', 'Network error');
      const operation = await queue.get(id);

      expect(operation?.status).toBe('failed');
      expect(operation?.error).toBe('Network error');
    });

    it('should get pending operations', async () => {
      const id1 = await queue.add({ type: 'create', data: { value: 1 }, maxRetries: 3 });
      await queue.add({ type: 'create', data: { value: 2 }, maxRetries: 3 });
      await queue.add({ type: 'create', data: { value: 3 }, maxRetries: 3 });

      await queue.updateStatus(id1, 'synced');

      const pending = await queue.getPending();

      expect(pending).toHaveLength(2);
    });

    it('should get operations by status', async () => {
      const id1 = await queue.add({ type: 'create', data: { value: 1 }, maxRetries: 3 });
      const id2 = await queue.add({ type: 'create', data: { value: 2 }, maxRetries: 3 });

      await queue.updateStatus(id1, 'synced');
      await queue.updateStatus(id2, 'failed');

      const synced = await queue.getByStatus('synced');
      const failed = await queue.getByStatus('failed');

      expect(synced).toHaveLength(1);
      expect(failed).toHaveLength(1);
    });
  });

  describe('Retry Logic', () => {
    beforeEach(() => {
      queue = new OfflineQueue({
        maxSize: 100,
        retryStrategy: 'exponential',
        maxRetries: 3,
        retryDelay: 1000,
      });
    });

    afterEach(async () => {
      await queue.clear();
    });

    it('should increment retry count', async () => {
      const id = await queue.add({
        type: 'create',
        data: { value: 'test' },
        maxRetries: 3,
      });

      await queue.retry(id);
      const operation = await queue.get(id);

      expect(operation?.retries).toBe(1);
    });

    it('should set nextRetry timestamp', async () => {
      const id = await queue.add({
        type: 'create',
        data: { value: 'test' },
        maxRetries: 3,
      });

      const before = Date.now();
      await queue.retry(id);
      const operation = await queue.get(id);
      const after = Date.now();

      expect(operation?.nextRetry).toBeDefined();
      expect(operation!.nextRetry!).toBeGreaterThanOrEqual(before);
      expect(operation!.nextRetry!).toBeGreaterThan(after);
    });

    it('should fail after max retries', async () => {
      const id = await queue.add({
        type: 'create',
        data: { value: 'test' },
        maxRetries: 2,
      });

      await queue.retry(id);
      await queue.retry(id);
      const canRetry = await queue.retry(id);
      const operation = await queue.get(id);

      expect(canRetry).toBe(false);
      expect(operation?.status).toBe('failed');
    });

    it('should use exponential backoff', async () => {
      const id = await queue.add({
        type: 'create',
        data: { value: 'test' },
        maxRetries: 5,
      });

      const now = Date.now();

      await queue.retry(id);
      const op1 = await queue.get(id);
      const delay1 = op1!.nextRetry! - now;

      await queue.retry(id);
      const op2 = await queue.get(id);
      const delay2 = op2!.nextRetry! - now;

      await queue.retry(id);
      const op3 = await queue.get(id);
      const delay3 = op3!.nextRetry! - now;

      // Exponential: 1000, 2000, 4000
      expect(delay2).toBeGreaterThan(delay1);
      expect(delay3).toBeGreaterThan(delay2);
    });

    it('should use linear backoff', async () => {
      queue = new OfflineQueue({
        maxSize: 100,
        retryStrategy: 'linear',
        retryDelay: 1000,
        maxRetryDelay: 60000,
      });

      const id = await queue.add({
        type: 'create',
        data: { value: 'test' },
        maxRetries: 5,
      });

      const now = Date.now();

      await queue.retry(id);
      const op1 = await queue.get(id);
      const delay1 = op1!.nextRetry! - now;

      await queue.retry(id);
      const op2 = await queue.get(id);
      const delay2 = op2!.nextRetry! - now;

      // Linear: 1000, 2000
      expect(delay2).toBeGreaterThan(delay1);
      expect(delay2 - delay1).toBeCloseTo(1000, -2); // Within ~100ms
    });

    it('should use fixed delay', async () => {
      queue = new OfflineQueue({
        maxSize: 100,
        retryStrategy: 'fixed',
        retryDelay: 1000,
      });

      const id = await queue.add({
        type: 'create',
        data: { value: 'test' },
        maxRetries: 3,
      });

      const now = Date.now();

      await queue.retry(id);
      const op1 = await queue.get(id);
      const delay1 = op1!.nextRetry! - now;

      await queue.retry(id);
      const op2 = await queue.get(id);
      const delay2 = op2!.nextRetry! - now;

      // Fixed delay should be similar
      expect(Math.abs(delay2 - delay1)).toBeLessThan(100); // Within 100ms
    });

    it('should respect max retry delay', async () => {
      queue = new OfflineQueue({
        maxSize: 100,
        retryStrategy: 'exponential',
        retryDelay: 1000,
        maxRetryDelay: 5000,
      });

      const id = await queue.add({
        type: 'create',
        data: { value: 'test' },
        maxRetries: 10,
      });

      // Do many retries to trigger max delay
      for (let i = 0; i < 5; i++) {
        await queue.retry(id);
      }

      const operation = await queue.get(id);
      const delay = operation!.nextRetry! - Date.now();

      expect(delay).toBeLessThanOrEqual(5100); // 5000 + some tolerance
    });

    it('should get ready operations', async () => {
      const id1 = await queue.add({
        type: 'create',
        data: { value: 1 },
        maxRetries: 3,
      });

      const id2 = await queue.add({
        type: 'create',
        data: { value: 2 },
        maxRetries: 3,
      });

      // Mark one as not ready yet
      await queue.retry(id1);

      const ready = await queue.getReadyOperations();

      expect(ready).toHaveLength(1);
      expect(ready[0]!.id).toBe(id2);
    });
  });

  describe('Priority Queue', () => {
    beforeEach(() => {
      queue = new OfflineQueue({
        maxSize: 100,
        retryStrategy: 'exponential',
      });
    });

    afterEach(async () => {
      await queue.clear();
    });

    it('should add operations with priority', async () => {
      const id = await queue.add({
        type: 'create',
        data: { value: 'test' },
        maxRetries: 3,
        priority: 10,
      });

      const operation = await queue.get(id);

      expect(operation?.priority).toBe(10);
    });

    it('should update operation priority', async () => {
      const id = await queue.add({
        type: 'create',
        data: { value: 'test' },
        maxRetries: 3,
        priority: 5,
      });

      await queue.prioritize(id, 15);
      const operation = await queue.get(id);

      expect(operation?.priority).toBe(15);
    });

    it('should sort operations by priority', async () => {
      await queue.add({
        type: 'create',
        data: { value: 1 },
        maxRetries: 3,
        priority: 5,
      });

      await queue.add({
        type: 'create',
        data: { value: 2 },
        maxRetries: 3,
        priority: 10,
      });

      await queue.add({
        type: 'create',
        data: { value: 3 },
        maxRetries: 3,
        priority: 2,
      });

      const sorted = await queue.getSortedByPriority();

      expect(sorted[0]!.priority).toBe(10);
      expect(sorted[1]!.priority).toBe(5);
      expect(sorted[2]!.priority).toBe(2);
    });
  });

  describe('Dependencies', () => {
    beforeEach(() => {
      queue = new OfflineQueue({
        maxSize: 100,
        retryStrategy: 'exponential',
      });
    });

    afterEach(async () => {
      await queue.clear();
    });

    it('should add operations with dependencies', async () => {
      const id1 = await queue.add({
        type: 'create',
        data: { value: 1 },
        maxRetries: 3,
      });

      const id2 = await queue.add({
        type: 'update',
        data: { value: 2 },
        maxRetries: 3,
        dependencies: [id1],
      });

      const operation = await queue.get(id2);

      expect(operation?.dependencies).toEqual([id1]);
    });

    it('should check dependencies satisfied', async () => {
      const id1 = await queue.add({
        type: 'create',
        data: { value: 1 },
        maxRetries: 3,
      });

      const id2 = await queue.add({
        type: 'update',
        data: { value: 2 },
        maxRetries: 3,
        dependencies: [id1],
      });

      await queue.updateStatus(id1, 'synced');

      const op2 = await queue.get(id2);
      const satisfied = await queue.checkDependencies(op2!);

      expect(satisfied).toBe(true);
    });

    it('should check dependencies not satisfied', async () => {
      const id1 = await queue.add({
        type: 'create',
        data: { value: 1 },
        maxRetries: 3,
      });

      const id2 = await queue.add({
        type: 'update',
        data: { value: 2 },
        maxRetries: 3,
        dependencies: [id1],
      });

      const op2 = await queue.get(id2);
      const satisfied = await queue.checkDependencies(op2!);

      expect(satisfied).toBe(false);
    });

    it('should handle missing dependencies', async () => {
      const id = await queue.add({
        type: 'update',
        data: { value: 2 },
        maxRetries: 3,
        dependencies: ['non-existent'],
      });

      const operation = await queue.get(id);
      const satisfied = await queue.checkDependencies(operation!);

      expect(satisfied).toBe(false);
    });
  });

  describe('Metadata', () => {
    beforeEach(() => {
      queue = new OfflineQueue({
        maxSize: 100,
        retryStrategy: 'exponential',
      });
    });

    afterEach(async () => {
      await queue.clear();
    });

    it('should store metadata with operation', async () => {
      const id = await queue.add({
        type: 'create',
        data: { value: 'test' },
        maxRetries: 3,
        metadata: {
          userId: '123',
          source: 'offline',
        },
      });

      const operation = await queue.get(id);

      expect(operation?.metadata?.userId).toBe('123');
      expect(operation?.metadata?.source).toBe('offline');
    });
  });
});
