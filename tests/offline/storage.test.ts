/**
 * Tests for Offline Storage
 * Following TDD approach - tests written first
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type {
  StorageItem,
  OfflineStorageConfig,
  StorageBackend,
  StorageStats,
  SyncStatus
} from '../../src/types/offline-types';

// Mock IndexedDB for testing
class MockIDBDatabase {
  name: string;
  version: number;
  objectStoreNames: string[] = [];

  constructor(name: string, version: number) {
    this.name = name;
    this.version = version;
  }

  createObjectStore(name: string, options?: { keyPath?: string; autoIncrement?: boolean }) {
    this.objectStoreNames.push(name);
    return new MockIDBObjectStore(name);
  }

  transaction(storeNames: string | string[], mode: 'readonly' | 'readwrite') {
    return new MockIDBTransaction(storeNames, mode);
  }
}

class MockIDBObjectStore {
  name: string;
  data: Map<string, unknown> = new Map();

  constructor(name: string) {
    this.name = name;
  }

  add(value: unknown, key?: string) {
    return new MockIDBRequest(() => {
      const k = key || (value as { key: string }).key;
      this.data.set(k, value);
      return k;
    });
  }

  put(value: unknown, key?: string) {
    return new MockIDBRequest(() => {
      const k = key || (value as { key: string }).key;
      this.data.set(k, value);
      return k;
    });
  }

  get(key: string) {
    return new MockIDBRequest(() => {
      return this.data.get(key);
    });
  }

  delete(key: string) {
    return new MockIDBRequest(() => {
      this.data.delete(key);
      return undefined;
    });
  }

  getAll() {
    return new MockIDBRequest(() => {
      return Array.from(this.data.values());
    });
  }

  clear() {
    return new MockIDBRequest(() => {
      this.data.clear();
      return undefined;
    });
  }

  createIndex(name: string, keyPath: string) {
    return new MockIDBIndex(name, keyPath);
  }
}

class MockIDBIndex {
  name: string;
  keyPath: string;

  constructor(name: string, keyPath: string) {
    this.name = name;
    this.keyPath = keyPath;
  }
}

class MockIDBTransaction {
  storeNames: string | string[];
  mode: string;
  stores: Map<string, MockIDBObjectStore> = new Map();

  constructor(storeNames: string | string[], mode: string) {
    this.storeNames = storeNames;
    this.mode = mode;
    const names = Array.isArray(storeNames) ? storeNames : [storeNames];
    names.forEach(name => this.stores.set(name, new MockIDBObjectStore(name)));
  }

  objectStore(name: string) {
    return this.stores.get(name) || new MockIDBObjectStore(name);
  }
}

class MockIDBRequest<T = unknown> {
  result: T | undefined;
  error: Error | null = null;
  onsuccess: ((event: { target: { result: T } }) => void) | null = null;
  onerror: ((event: { target: { error: Error } }) => void) | null = null;

  constructor(private executor: () => T) {
    setTimeout(() => {
      try {
        this.result = this.executor();
        if (this.onsuccess) {
          this.onsuccess({ target: { result: this.result } });
        }
      } catch (err) {
        this.error = err as Error;
        if (this.onerror) {
          this.onerror({ target: { error: this.error } });
        }
      }
    }, 0);
  }
}

// Storage implementation to be tested
// This will be imported from the actual implementation
class OfflineStorage {
  private backend: StorageBackend;
  private config: OfflineStorageConfig;
  private db: MockIDBDatabase | null = null;
  private memoryStore: Map<string, StorageItem> = new Map();

  constructor(config: OfflineStorageConfig = {}) {
    this.config = {
      backend: config.backend || 'indexeddb',
      databaseName: config.databaseName || 'a2ui-offline',
      version: config.version || 1,
      maxSize: config.maxSize || 50 * 1024 * 1024, // 50MB default
      compression: config.compression || false,
      encryption: config.encryption || false,
      ...config,
    };
    this.backend = this.config.backend || 'indexeddb';
  }

  async initialize(): Promise<void> {
    if (this.backend === 'indexeddb') {
      this.db = new MockIDBDatabase(
        this.config.databaseName || 'a2ui-offline',
        this.config.version || 1
      );
      this.db.createObjectStore('storage', { keyPath: 'key' });
    }
  }

  async set<T>(key: string, data: T, metadata?: Record<string, unknown>): Promise<void> {
    const item: StorageItem<T> = {
      key,
      data,
      timestamp: Date.now(),
      version: 1,
      lastModified: Date.now(),
      syncStatus: 'pending' as SyncStatus,
      metadata,
    };

    if (this.backend === 'memory' || !this.db) {
      this.memoryStore.set(key, item as StorageItem);
    } else if (this.db) {
      const tx = this.db.transaction('storage', 'readwrite');
      const store = tx.objectStore('storage');
      await new Promise((resolve, reject) => {
        const request = store.put(item);
        request.onsuccess = () => resolve(undefined);
        request.onerror = () => reject(request.error);
      });
    }
  }

  async get<T>(key: string): Promise<StorageItem<T> | null> {
    if (this.backend === 'memory' || !this.db) {
      return (this.memoryStore.get(key) as StorageItem<T>) || null;
    }

    if (this.db) {
      const tx = this.db.transaction('storage', 'readonly');
      const store = tx.objectStore('storage');
      return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result as StorageItem<T> || null);
        request.onerror = () => reject(request.error);
      });
    }

    return null;
  }

  async delete(key: string): Promise<void> {
    if (this.backend === 'memory' || !this.db) {
      this.memoryStore.delete(key);
      return;
    }

    if (this.db) {
      const tx = this.db.transaction('storage', 'readwrite');
      const store = tx.objectStore('storage');
      await new Promise((resolve, reject) => {
        const request = store.delete(key);
        request.onsuccess = () => resolve(undefined);
        request.onerror = () => reject(request.error);
      });
    }
  }

  async clear(): Promise<void> {
    if (this.backend === 'memory' || !this.db) {
      this.memoryStore.clear();
      return;
    }

    if (this.db) {
      const tx = this.db.transaction('storage', 'readwrite');
      const store = tx.objectStore('storage');
      await new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve(undefined);
        request.onerror = () => reject(request.error);
      });
    }
  }

  async getAll<T>(): Promise<StorageItem<T>[]> {
    if (this.backend === 'memory' || !this.db) {
      return Array.from(this.memoryStore.values()) as StorageItem<T>[];
    }

    if (this.db) {
      const tx = this.db.transaction('storage', 'readonly');
      const store = tx.objectStore('storage');
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve((request.result as StorageItem<T>[]) || []);
        request.onerror = () => reject(request.error);
      });
    }

    return [];
  }

  async getStats(): Promise<StorageStats> {
    const items = await this.getAll();
    const statusBreakdown: Record<SyncStatus, number> = {
      pending: 0,
      syncing: 0,
      synced: 0,
      failed: 0,
      conflict: 0,
    };

    items.forEach(item => {
      statusBreakdown[item.syncStatus]++;
    });

    return {
      totalItems: items.length,
      totalSize: JSON.stringify(items).length,
      backend: this.backend,
      statusBreakdown,
    };
  }

  getBackend(): StorageBackend {
    return this.backend;
  }
}

describe('OfflineStorage', () => {
  let storage: OfflineStorage;

  describe('Initialization', () => {
    it('should initialize with default config', async () => {
      storage = new OfflineStorage();
      await storage.initialize();

      expect(storage).toBeDefined();
      expect(storage.getBackend()).toBe('indexeddb');
    });

    it('should initialize with memory backend', async () => {
      storage = new OfflineStorage({ backend: 'memory' });
      await storage.initialize();

      expect(storage.getBackend()).toBe('memory');
    });

    it('should initialize with custom database name', async () => {
      storage = new OfflineStorage({
        databaseName: 'custom-db',
        backend: 'memory'
      });
      await storage.initialize();

      expect(storage).toBeDefined();
    });

    it('should initialize with custom version', async () => {
      storage = new OfflineStorage({
        version: 2,
        backend: 'memory'
      });
      await storage.initialize();

      expect(storage).toBeDefined();
    });
  });

  describe('Basic CRUD Operations', () => {
    beforeEach(async () => {
      storage = new OfflineStorage({ backend: 'memory' });
      await storage.initialize();
    });

    afterEach(async () => {
      await storage.clear();
    });

    it('should store and retrieve data', async () => {
      await storage.set('key1', { value: 'test' });
      const item = await storage.get('key1');

      expect(item).toBeDefined();
      expect(item?.key).toBe('key1');
      expect(item?.data).toEqual({ value: 'test' });
      expect(item?.syncStatus).toBe('pending');
    });

    it('should store data with metadata', async () => {
      await storage.set('key2', { value: 'test' }, { custom: 'metadata' });
      const item = await storage.get('key2');

      expect(item?.metadata).toEqual({ custom: 'metadata' });
    });

    it('should return null for non-existent key', async () => {
      const item = await storage.get('non-existent');

      expect(item).toBeNull();
    });

    it('should delete data', async () => {
      await storage.set('key3', { value: 'test' });
      await storage.delete('key3');
      const item = await storage.get('key3');

      expect(item).toBeNull();
    });

    it('should update existing data', async () => {
      await storage.set('key4', { value: 'original' });
      await storage.set('key4', { value: 'updated' });
      const item = await storage.get('key4');

      expect(item?.data).toEqual({ value: 'updated' });
    });

    it('should store complex data types', async () => {
      const complexData = {
        array: [1, 2, 3],
        nested: { a: 1, b: { c: 2 } },
        date: new Date().toISOString(),
      };

      await storage.set('complex', complexData);
      const item = await storage.get('complex');

      expect(item?.data).toEqual(complexData);
    });
  });

  describe('Bulk Operations', () => {
    beforeEach(async () => {
      storage = new OfflineStorage({ backend: 'memory' });
      await storage.initialize();
    });

    afterEach(async () => {
      await storage.clear();
    });

    it('should retrieve all items', async () => {
      await storage.set('key1', { value: 1 });
      await storage.set('key2', { value: 2 });
      await storage.set('key3', { value: 3 });

      const items = await storage.getAll();

      expect(items).toHaveLength(3);
      expect(items.map(i => i.key)).toContain('key1');
      expect(items.map(i => i.key)).toContain('key2');
      expect(items.map(i => i.key)).toContain('key3');
    });

    it('should clear all items', async () => {
      await storage.set('key1', { value: 1 });
      await storage.set('key2', { value: 2 });
      await storage.clear();

      const items = await storage.getAll();

      expect(items).toHaveLength(0);
    });

    it('should handle empty storage', async () => {
      const items = await storage.getAll();

      expect(items).toHaveLength(0);
    });
  });

  describe('Statistics', () => {
    beforeEach(async () => {
      storage = new OfflineStorage({ backend: 'memory' });
      await storage.initialize();
    });

    afterEach(async () => {
      await storage.clear();
    });

    it('should return storage statistics', async () => {
      await storage.set('key1', { value: 1 });
      await storage.set('key2', { value: 2 });

      const stats = await storage.getStats();

      expect(stats.totalItems).toBe(2);
      expect(stats.backend).toBe('memory');
      expect(stats.statusBreakdown.pending).toBe(2);
    });

    it('should calculate total size', async () => {
      await storage.set('key1', { value: 'a'.repeat(1000) });

      const stats = await storage.getStats();

      expect(stats.totalSize).toBeGreaterThan(0);
    });

    it('should return empty stats for empty storage', async () => {
      const stats = await storage.getStats();

      expect(stats.totalItems).toBe(0);
      expect(stats.totalSize).toBeGreaterThan(0); // JSON stringified empty array
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      storage = new OfflineStorage({ backend: 'memory' });
      await storage.initialize();
    });

    it('should handle missing key gracefully', async () => {
      const item = await storage.get('missing');

      expect(item).toBeNull();
    });

    it('should handle delete on non-existent key', async () => {
      await expect(storage.delete('non-existent')).resolves.not.toThrow();
    });
  });

  describe('Backend Selection', () => {
    it('should use IndexedDB by default', async () => {
      storage = new OfflineStorage();
      await storage.initialize();

      expect(storage.getBackend()).toBe('indexeddb');
    });

    it('should fallback to memory when specified', async () => {
      storage = new OfflineStorage({ backend: 'memory' });
      await storage.initialize();

      expect(storage.getBackend()).toBe('memory');
    });
  });

  describe('Data Versioning', () => {
    beforeEach(async () => {
      storage = new OfflineStorage({ backend: 'memory' });
      await storage.initialize();
    });

    afterEach(async () => {
      await storage.clear();
    });

    it('should track version numbers', async () => {
      await storage.set('versioned', { value: 'v1' });
      const item = await storage.get('versioned');

      expect(item?.version).toBe(1);
    });

    it('should track last modified timestamp', async () => {
      const before = Date.now();
      await storage.set('timestamped', { value: 'test' });
      const after = Date.now();

      const item = await storage.get('timestamped');

      expect(item?.lastModified).toBeGreaterThanOrEqual(before);
      expect(item?.lastModified).toBeLessThanOrEqual(after);
    });
  });

  describe('Sync Status Tracking', () => {
    beforeEach(async () => {
      storage = new OfflineStorage({ backend: 'memory' });
      await storage.initialize();
    });

    afterEach(async () => {
      await storage.clear();
    });

    it('should initialize with pending sync status', async () => {
      await storage.set('pending', { value: 'test' });
      const item = await storage.get('pending');

      expect(item?.syncStatus).toBe('pending');
    });

    it('should track sync status in statistics', async () => {
      await storage.set('item1', { value: 1 });
      await storage.set('item2', { value: 2 });

      const stats = await storage.getStats();

      expect(stats.statusBreakdown.pending).toBe(2);
      expect(stats.statusBreakdown.synced).toBe(0);
    });
  });

  describe('Metadata Handling', () => {
    beforeEach(async () => {
      storage = new OfflineStorage({ backend: 'memory' });
      await storage.initialize();
    });

    afterEach(async () => {
      await storage.clear();
    });

    it('should store and retrieve metadata', async () => {
      await storage.set('meta', { value: 'test' }, {
        userId: '123',
        source: 'offline'
      });
      const item = await storage.get('meta');

      expect(item?.metadata?.userId).toBe('123');
      expect(item?.metadata?.source).toBe('offline');
    });

    it('should handle empty metadata', async () => {
      await storage.set('no-meta', { value: 'test' });
      const item = await storage.get('no-meta');

      expect(item?.metadata).toBeUndefined();
    });
  });
});
