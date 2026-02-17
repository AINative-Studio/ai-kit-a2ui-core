/**
 * Integration Tests for Offline Module
 * Tests actual implementations together
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OfflineStorage } from '../../src/offline/storage';
import { OfflineQueue } from '../../src/offline/queue';
import { OfflineCache } from '../../src/offline/cache';
import { ConflictResolver } from '../../src/offline/conflict-resolver';
import { SyncEngine } from '../../src/offline/sync-engine';
import { OfflineHandler } from '../../src/handlers/offline-handler';

describe('Offline Module Integration', () => {
  let storage: OfflineStorage;
  let queue: OfflineQueue;
  let cache: OfflineCache;

  beforeEach(async () => {
    storage = new OfflineStorage({ backend: 'memory' });
    queue = new OfflineQueue({ maxSize: 100, retryStrategy: 'exponential' });
    cache = new OfflineCache({ strategy: 'network-first', maxSize: 1024 * 1024 });

    await storage.initialize();
    await queue.initialize();
  });

  afterEach(async () => {
    await storage.clear();
    await queue.clear();
    await cache.clear();
    await storage.close();
    await queue.close();
  });

  describe('Storage Integration', () => {
    it('should store and retrieve data', async () => {
      await storage.set('test-key', { value: 'test-data' });
      const item = await storage.get('test-key');

      expect(item).toBeDefined();
      expect(item?.data).toEqual({ value: 'test-data' });
    });

    it('should get storage stats', async () => {
      await storage.set('key1', { value: 1 });
      await storage.set('key2', { value: 2 });

      const stats = await storage.getStats();

      expect(stats.totalItems).toBe(2);
      expect(stats.backend).toBe('memory');
    });

    it('should update sync status', async () => {
      await storage.set('key', { value: 'test' });
      await storage.updateSyncStatus('key', 'synced');

      const item = await storage.get('key');

      expect(item?.syncStatus).toBe('synced');
    });
  });

  describe('Queue Integration', () => {
    it('should add and retrieve operations', async () => {
      const id = await queue.add({
        type: 'create',
        data: { value: 'test' },
        maxRetries: 3,
      });

      const operation = await queue.get(id);

      expect(operation).toBeDefined();
      expect(operation?.type).toBe('create');
    });

    it('should handle retry logic', async () => {
      const id = await queue.add({
        type: 'create',
        data: { value: 'test' },
        maxRetries: 2,
      });

      const canRetry1 = await queue.retry(id);
      const canRetry2 = await queue.retry(id);
      const canRetry3 = await queue.retry(id);

      expect(canRetry1).toBe(true);
      expect(canRetry2).toBe(true);
      expect(canRetry3).toBe(false);
    });

    it('should get queue stats', async () => {
      await queue.add({ type: 'create', data: {}, maxRetries: 3 });
      await queue.add({ type: 'update', data: {}, maxRetries: 3 });

      const stats = await queue.getStats();

      expect(stats.total).toBe(2);
      expect(stats.pending).toBe(2);
    });
  });

  describe('Cache Integration', () => {
    it('should cache and retrieve values', async () => {
      await cache.set('test-key', { value: 'cached-data' });
      const data = await cache.get('test-key');

      expect(data).toEqual({ value: 'cached-data' });
    });

    it('should respect TTL', async () => {
      await cache.set('expire-key', { value: 'data' }, { ttl: 100 });

      // Immediately should be available
      const data1 = await cache.get('expire-key');
      expect(data1).toBeDefined();

      // After TTL should be null
      await new Promise(resolve => setTimeout(resolve, 150));
      const data2 = await cache.get('expire-key');
      expect(data2).toBeNull();
    });

    it('should get cache stats', async () => {
      await cache.set('key1', { value: 1 });
      await cache.get('key1'); // hit
      await cache.get('key2'); // miss

      const stats = await cache.getStats();

      expect(stats.totalItems).toBe(1);
      expect(stats.hitRate).toBeGreaterThan(0);
    });
  });

  describe('Conflict Resolver Integration', () => {
    it('should resolve conflicts using last-write-wins', async () => {
      const resolver = new ConflictResolver();

      const local = {
        key: 'item1',
        data: { value: 'local' },
        timestamp: Date.now(),
        version: 1,
        lastModified: Date.now() - 1000,
        syncStatus: 'pending' as const,
      };

      const remote = {
        key: 'item1',
        data: { value: 'remote' },
        timestamp: Date.now(),
        version: 2,
        lastModified: Date.now(),
        syncStatus: 'synced' as const,
      };

      const { resolved, report } = await resolver.resolve({
        strategy: 'last-write-wins',
        local,
        remote,
      });

      expect(resolved.data).toEqual({ value: 'remote' });
      expect(report.resolution).toBe('last-write-wins');
    });
  });

  describe('Offline Handler Integration', () => {
    let handler: OfflineHandler;

    beforeEach(async () => {
      handler = new OfflineHandler({
        storage: { backend: 'memory' },
        queue: { maxSize: 100, retryStrategy: 'exponential' },
      });

      await handler.initialize();
    });

    afterEach(async () => {
      await handler.close();
    });

    it('should queue operations', async () => {
      const id = await handler.queueOperation({
        type: 'create',
        data: { value: 'test' },
        maxRetries: 3,
      });

      expect(id).toBeDefined();
      expect(id).toMatch(/^op_\d+$/);
    });

    it('should store and retrieve data', async () => {
      await handler.store('test-key', { value: 'test' });
      const data = await handler.retrieve('test-key');

      expect(data).toEqual({ value: 'test' });
    });

    it('should cache and get cached values', async () => {
      await handler.cacheValue('cache-key', { value: 'cached' });
      const data = await handler.getCached('cache-key');

      expect(data).toEqual({ value: 'cached' });
    });

    it('should get queue status', async () => {
      await handler.queueOperation({
        type: 'create',
        data: { value: 'test' },
        maxRetries: 3,
      });

      const status = await handler.getQueueStatus();

      expect(status.pending).toBe(1);
      expect(status.synced).toBe(0);
    });

    it('should get comprehensive stats', async () => {
      await handler.store('key1', { value: 1 });
      await handler.queueOperation({ type: 'create', data: {}, maxRetries: 3 });
      await handler.cacheValue('cache1', { value: 'cached' });

      const stats = await handler.getStats();

      expect(stats.storage).toBeDefined();
      expect(stats.queue).toBeDefined();
      expect(stats.cache).toBeDefined();
    });
  });
});
