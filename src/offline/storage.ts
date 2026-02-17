/**
 * Offline Storage Implementation
 * Provides persistent storage with IndexedDB and localStorage fallback
 */

import type {
  StorageItem,
  OfflineStorageConfig,
  StorageBackend,
  StorageStats,
  SyncStatus
} from '../types/offline-types';

/**
 * Default storage configuration
 */
const DEFAULT_CONFIG: Required<Omit<OfflineStorageConfig, 'encryptionKey'>> = {
  backend: 'indexeddb',
  databaseName: 'a2ui-offline',
  version: 1,
  maxSize: 50 * 1024 * 1024, // 50MB
  compression: false,
  encryption: false,
};

/**
 * Offline storage implementation with IndexedDB and fallback support
 */
export class OfflineStorage {
  private backend: StorageBackend;
  private config: Required<Omit<OfflineStorageConfig, 'encryptionKey'>> & { encryptionKey?: string };
  private db: IDBDatabase | null = null;
  private memoryStore: Map<string, StorageItem> = new Map();
  private initialized = false;

  constructor(config: OfflineStorageConfig = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
    this.backend = this.detectBackend(config.backend);
  }

  /**
   * Detect available storage backend
   */
  private detectBackend(preferred?: StorageBackend): StorageBackend {
    if (preferred === 'memory') return 'memory';

    // Check if we're in a browser environment
    if (typeof window === 'undefined') return 'memory';

    if (preferred === 'indexeddb' || !preferred) {
      try {
        if ('indexedDB' in window && window.indexedDB) {
          return 'indexeddb';
        }
      } catch {
        // IndexedDB not available
      }
    }

    if (preferred === 'localstorage' || !preferred) {
      try {
        if ('localStorage' in window && window.localStorage) {
          return 'localstorage';
        }
      } catch {
        // localStorage not available
      }
    }

    return 'memory';
  }

  /**
   * Initialize storage backend
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    if (this.backend === 'indexeddb') {
      await this.initializeIndexedDB();
    } else if (this.backend === 'localstorage') {
      this.initializeLocalStorage();
    }
    // Memory storage is always ready

    this.initialized = true;
  }

  /**
   * Initialize IndexedDB
   */
  private async initializeIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.databaseName, this.config.version);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('storage')) {
          const store = db.createObjectStore('storage', { keyPath: 'key' });
          store.createIndex('syncStatus', 'syncStatus', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Initialize localStorage
   */
  private initializeLocalStorage(): void {
    // localStorage is synchronous and always ready
    // Just verify it's accessible
    try {
      const testKey = '__a2ui_storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
    } catch (error) {
      console.warn('localStorage not accessible, falling back to memory');
      this.backend = 'memory';
    }
  }

  /**
   * Store data
   */
  async set<T>(key: string, data: T, metadata?: Record<string, unknown>): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    const item: StorageItem<T> = {
      key,
      data,
      timestamp: Date.now(),
      version: 1,
      lastModified: Date.now(),
      syncStatus: 'pending' as SyncStatus,
      metadata,
    };

    // Check if item already exists to preserve version
    const existing = await this.get<T>(key);
    if (existing) {
      item.version = existing.version + 1;
    }

    switch (this.backend) {
      case 'indexeddb':
        await this.setIndexedDB(item);
        break;
      case 'localstorage':
        this.setLocalStorage(item);
        break;
      case 'memory':
        this.memoryStore.set(key, item as StorageItem);
        break;
    }
  }

  /**
   * Store data in IndexedDB
   */
  private async setIndexedDB(item: StorageItem): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('storage', 'readwrite');
      const store = tx.objectStore('storage');
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Store data in localStorage
   */
  private setLocalStorage(item: StorageItem): void {
    try {
      const serialized = JSON.stringify(item);
      localStorage.setItem(`a2ui:${item.key}`, serialized);
    } catch (error) {
      console.error('Failed to store in localStorage:', error);
      // Fall back to memory
      this.memoryStore.set(item.key, item);
    }
  }

  /**
   * Retrieve data
   */
  async get<T>(key: string): Promise<StorageItem<T> | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    switch (this.backend) {
      case 'indexeddb':
        return this.getIndexedDB<T>(key);
      case 'localstorage':
        return this.getLocalStorage<T>(key);
      case 'memory':
        return (this.memoryStore.get(key) as StorageItem<T>) || null;
      default:
        return null;
    }
  }

  /**
   * Retrieve data from IndexedDB
   */
  private async getIndexedDB<T>(key: string): Promise<StorageItem<T> | null> {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('storage', 'readonly');
      const store = tx.objectStore('storage');
      const request = store.get(key);

      request.onsuccess = () => {
        resolve((request.result as StorageItem<T>) || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Retrieve data from localStorage
   */
  private getLocalStorage<T>(key: string): StorageItem<T> | null {
    try {
      const serialized = localStorage.getItem(`a2ui:${key}`);
      if (!serialized) return null;
      return JSON.parse(serialized) as StorageItem<T>;
    } catch (error) {
      console.error('Failed to retrieve from localStorage:', error);
      return null;
    }
  }

  /**
   * Delete data
   */
  async delete(key: string): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    switch (this.backend) {
      case 'indexeddb':
        await this.deleteIndexedDB(key);
        break;
      case 'localstorage':
        this.deleteLocalStorage(key);
        break;
      case 'memory':
        this.memoryStore.delete(key);
        break;
    }
  }

  /**
   * Delete data from IndexedDB
   */
  private async deleteIndexedDB(key: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('storage', 'readwrite');
      const store = tx.objectStore('storage');
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete data from localStorage
   */
  private deleteLocalStorage(key: string): void {
    try {
      localStorage.removeItem(`a2ui:${key}`);
    } catch (error) {
      console.error('Failed to delete from localStorage:', error);
    }
  }

  /**
   * Clear all data
   */
  async clear(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    switch (this.backend) {
      case 'indexeddb':
        await this.clearIndexedDB();
        break;
      case 'localstorage':
        this.clearLocalStorage();
        break;
      case 'memory':
        this.memoryStore.clear();
        break;
    }
  }

  /**
   * Clear IndexedDB
   */
  private async clearIndexedDB(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('storage', 'readwrite');
      const store = tx.objectStore('storage');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear localStorage
   */
  private clearLocalStorage(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('a2ui:')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }

  /**
   * Get all stored items
   */
  async getAll<T>(): Promise<StorageItem<T>[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    switch (this.backend) {
      case 'indexeddb':
        return this.getAllIndexedDB<T>();
      case 'localstorage':
        return this.getAllLocalStorage<T>();
      case 'memory':
        return Array.from(this.memoryStore.values()) as StorageItem<T>[];
      default:
        return [];
    }
  }

  /**
   * Get all items from IndexedDB
   */
  private async getAllIndexedDB<T>(): Promise<StorageItem<T>[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('storage', 'readonly');
      const store = tx.objectStore('storage');
      const request = store.getAll();

      request.onsuccess = () => {
        resolve((request.result as StorageItem<T>[]) || []);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all items from localStorage
   */
  private getAllLocalStorage<T>(): StorageItem<T>[] {
    try {
      const keys = Object.keys(localStorage);
      const items: StorageItem<T>[] = [];

      keys.forEach(key => {
        if (key.startsWith('a2ui:')) {
          const serialized = localStorage.getItem(key);
          if (serialized) {
            try {
              items.push(JSON.parse(serialized) as StorageItem<T>);
            } catch {
              // Skip invalid items
            }
          }
        }
      });

      return items;
    } catch (error) {
      console.error('Failed to get all from localStorage:', error);
      return [];
    }
  }

  /**
   * Get storage statistics
   */
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

    const totalSize = this.calculateSize(items);

    return {
      totalItems: items.length,
      totalSize,
      backend: this.backend,
      statusBreakdown,
      availableSize: await this.getAvailableSize(),
    };
  }

  /**
   * Calculate size of items in bytes
   */
  private calculateSize(items: StorageItem[]): number {
    return JSON.stringify(items).length;
  }

  /**
   * Get available storage space
   */
  private async getAvailableSize(): Promise<number | undefined> {
    if (typeof navigator === 'undefined' || !('storage' in navigator)) {
      return undefined;
    }

    try {
      const estimate = await navigator.storage.estimate();
      if (estimate.quota && estimate.usage) {
        return estimate.quota - estimate.usage;
      }
    } catch {
      // Not supported
    }

    return undefined;
  }

  /**
   * Get current storage backend
   */
  getBackend(): StorageBackend {
    return this.backend;
  }

  /**
   * Update sync status for an item
   */
  async updateSyncStatus(key: string, status: SyncStatus): Promise<void> {
    const item = await this.get(key);
    if (!item) return;

    item.syncStatus = status;
    item.lastModified = Date.now();

    // Update directly to preserve status
    switch (this.backend) {
      case 'indexeddb':
        await this.setIndexedDB(item);
        break;
      case 'localstorage':
        this.setLocalStorage(item);
        break;
      case 'memory':
        this.memoryStore.set(key, item);
        break;
    }
  }

  /**
   * Get items by sync status
   */
  async getByStatus<T>(status: SyncStatus): Promise<StorageItem<T>[]> {
    const items = await this.getAll<T>();
    return items.filter(item => item.syncStatus === status);
  }

  /**
   * Close database connection (for cleanup)
   */
  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.initialized = false;
  }
}

/**
 * Export default instance for convenience
 */
export const storage = new OfflineStorage();
