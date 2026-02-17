/**
 * Offline Cache Implementation
 * Provides response caching with multiple strategies
 */

import type {
  CachedItem,
  OfflineCacheConfig,
  CacheStrategy,
  CacheStats
} from '../types/offline-types';

/**
 * Default cache configuration
 */
const DEFAULT_CONFIG: Required<Omit<OfflineCacheConfig, 'keyPrefix'>> & { keyPrefix: string } = {
  strategy: 'network-first',
  maxSize: 10 * 1024 * 1024, // 10MB
  ttl: 5 * 60 * 1000, // 5 minutes
  versioning: true,
  keyPrefix: 'a2ui:cache:',
};

/**
 * Offline cache for storing responses
 */
export class OfflineCache<T = unknown> {
  private cache: Map<string, CachedItem<T>> = new Map();
  private config: Required<OfflineCacheConfig> & { keyPrefix: string };
  private hits = 0;
  private misses = 0;
  private evictions = 0;

  constructor(config: OfflineCacheConfig) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
  }

  /**
   * Set cache item
   */
  async set(key: string, data: T, options?: { ttl?: number; etag?: string; version?: number }): Promise<void> {
    const now = Date.now();
    const ttl = options?.ttl ?? this.config.ttl;

    const item: CachedItem<T> = {
      key: `${this.config.keyPrefix}${key}`,
      data,
      timestamp: now,
      expires: ttl ? now + ttl : undefined,
      version: options?.version ?? 1,
      etag: options?.etag,
    };

    // Check if we need to evict items
    if (this.shouldEvict()) {
      await this.evictLRU();
    }

    this.cache.set(item.key, item);
  }

  /**
   * Get cache item
   */
  async get(key: string): Promise<T | null> {
    const fullKey = `${this.config.keyPrefix}${key}`;
    const item = this.cache.get(fullKey);

    if (!item) {
      this.misses++;
      return null;
    }

    // Check if expired
    if (item.expires && Date.now() > item.expires) {
      this.cache.delete(fullKey);
      this.misses++;
      return null;
    }

    this.hits++;
    return item.data;
  }

  /**
   * Get cache item with metadata
   */
  async getWithMetadata(key: string): Promise<CachedItem<T> | null> {
    const fullKey = `${this.config.keyPrefix}${key}`;
    const item = this.cache.get(fullKey);

    if (!item) {
      this.misses++;
      return null;
    }

    // Check if expired
    if (item.expires && Date.now() > item.expires) {
      this.cache.delete(fullKey);
      this.misses++;
      return null;
    }

    this.hits++;
    return item;
  }

  /**
   * Delete cache item
   */
  async delete(key: string): Promise<void> {
    const fullKey = `${this.config.keyPrefix}${key}`;
    this.cache.delete(fullKey);
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  /**
   * Check if cache should evict items
   */
  private shouldEvict(): boolean {
    const currentSize = this.calculateSize();
    return currentSize >= this.config.maxSize!;
  }

  /**
   * Evict least recently used items
   */
  private async evictLRU(): Promise<void> {
    if (this.cache.size === 0) return;

    // Sort by timestamp (oldest first)
    const entries = Array.from(this.cache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);

    // Remove oldest 25% of items
    const toRemove = Math.ceil(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i]![0]);
      this.evictions++;
    }
  }

  /**
   * Calculate current cache size
   */
  private calculateSize(): number {
    let size = 0;
    this.cache.forEach(item => {
      size += JSON.stringify(item).length;
    });
    return size;
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    const totalRequests = this.hits + this.misses;
    return {
      totalItems: this.cache.size,
      totalSize: this.calculateSize(),
      hitRate: totalRequests > 0 ? this.hits / totalRequests : 0,
      missRate: totalRequests > 0 ? this.misses / totalRequests : 0,
      evictions: this.evictions,
    };
  }

  /**
   * Check if key exists and is not expired
   */
  async has(key: string): Promise<boolean> {
    const fullKey = `${this.config.keyPrefix}${key}`;
    const item = this.cache.get(fullKey);

    if (!item) return false;

    // Check if expired
    if (item.expires && Date.now() > item.expires) {
      this.cache.delete(fullKey);
      return false;
    }

    return true;
  }

  /**
   * Get cache strategy
   */
  getStrategy(): CacheStrategy {
    return this.config.strategy;
  }
}

/**
 * Export default cache instance
 */
export const cache = new OfflineCache({
  strategy: 'network-first',
  maxSize: 10 * 1024 * 1024,
  ttl: 5 * 60 * 1000,
  versioning: true,
});
