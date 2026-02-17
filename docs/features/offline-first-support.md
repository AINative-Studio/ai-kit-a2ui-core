# Offline-First Support for A2UI Core

**Issue**: #55
**Status**: Completed
**Version**: 0.1.0-alpha.1

## Overview

The offline-first support module provides comprehensive offline capabilities for A2UI Core applications, including persistent storage, operation queuing, response caching, conflict resolution, and automatic synchronization.

## Features

### 1. Offline Storage

**File**: `src/offline/storage.ts`

Provides persistent storage with automatic backend detection:

- **IndexedDB** (preferred): High-performance browser database
- **localStorage**: Fallback for limited environments
- **Memory**: In-memory storage for testing

**Key Capabilities**:
- CRUD operations with versioning
- Sync status tracking
- Storage statistics
- Automatic size management

**Example**:
```typescript
import { OfflineStorage } from '@ainative/ai-kit-a2ui-core/offline';

const storage = new OfflineStorage({
  backend: 'indexeddb',
  databaseName: 'my-app',
  maxSize: 50 * 1024 * 1024 // 50MB
});

await storage.initialize();

// Store data
await storage.set('user-profile', {
  name: 'John Doe',
  email: 'john@example.com'
});

// Retrieve data
const item = await storage.get('user-profile');
console.log(item.data); // { name: 'John Doe', ... }

// Get statistics
const stats = await storage.getStats();
console.log(`Total items: ${stats.totalItems}`);
```

### 2. Operation Queue

**File**: `src/offline/queue.ts`

Manages offline operations with retry strategies:

**Retry Strategies**:
- **Exponential**: Delay doubles each retry (1s, 2s, 4s, 8s...)
- **Linear**: Delay increases linearly (1s, 2s, 3s, 4s...)
- **Fixed**: Constant delay between retries
- **None**: No delay (immediate retry)

**Key Capabilities**:
- Priority queuing
- Dependency management
- Persistent queue (survives page reloads)
- Automatic retry with backoff

**Example**:
```typescript
import { OfflineQueue } from '@ainative/ai-kit-a2ui-core/offline';

const queue = new OfflineQueue({
  maxSize: 1000,
  retryStrategy: 'exponential',
  maxRetries: 3,
  retryDelay: 1000
});

await queue.initialize();

// Add operation
const id = await queue.add({
  type: 'create',
  data: { title: 'New Post', content: '...' },
  maxRetries: 3,
  priority: 10
});

// Get ready operations
const ready = await queue.getReadyOperations();

// Process and update status
for (const op of ready) {
  try {
    await processOperation(op);
    await queue.updateStatus(op.id, 'synced');
  } catch (error) {
    await queue.retry(op.id);
  }
}
```

### 3. Response Cache

**File**: `src/offline/cache.ts`

Provides response caching with multiple strategies:

**Cache Strategies**:
- **network-first**: Try network, fallback to cache
- **cache-first**: Try cache, fallback to network
- **network-only**: Always use network
- **cache-only**: Always use cache
- **stale-while-revalidate**: Return cache, update in background

**Key Capabilities**:
- TTL (time-to-live) support
- LRU eviction
- Cache statistics (hit rate, miss rate)
- Version management

**Example**:
```typescript
import { OfflineCache } from '@ainative/ai-kit-a2ui-core/offline';

const cache = new OfflineCache({
  strategy: 'network-first',
  maxSize: 10 * 1024 * 1024, // 10MB
  ttl: 5 * 60 * 1000 // 5 minutes
});

// Cache API response
await cache.set('api/users', usersData, {
  ttl: 60000, // 1 minute
  etag: response.headers.get('etag')
});

// Get cached data
const cached = await cache.get('api/users');

// Check cache stats
const stats = await cache.getStats();
console.log(`Hit rate: ${stats.hitRate * 100}%`);
```

### 4. Conflict Resolution

**File**: `src/offline/conflict-resolver.ts`

Handles sync conflicts with multiple strategies:

**Conflict Strategies**:
- **Last-Write-Wins (LWW)**: Use version with latest timestamp
- **Operational Transform (OT)**: Transform operations to merge changes
- **CRDT**: Conflict-free replicated data types
- **Manual**: Custom resolver function or flag for manual intervention

**Example**:
```typescript
import { ConflictResolver } from '@ainative/ai-kit-a2ui-core/offline';

const resolver = new ConflictResolver();

const { resolved, report } = await resolver.resolve({
  strategy: 'last-write-wins',
  local: localVersion,
  remote: remoteVersion
});

console.log(`Resolved using ${report.resolution}`);
if (report.requiresManual) {
  // Handle manual resolution
}
```

### 5. Sync Engine

**File**: `src/offline/sync-engine.ts`

Coordinates offline/online synchronization:

**Key Capabilities**:
- Auto-sync when connection restored
- Periodic sync intervals
- Batch processing
- Background sync (Service Worker)
- Conflict detection and resolution

**Example**:
```typescript
import { SyncEngine } from '@ainative/ai-kit-a2ui-core/offline';

const syncEngine = new SyncEngine({
  autoSync: true,
  syncInterval: 60000, // 1 minute
  batchSize: 50,
  conflictStrategy: 'last-write-wins'
});

await syncEngine.initialize();

// Listen for sync events
const unsubscribe = syncEngine.onSync((event) => {
  switch (event.type) {
    case 'sync-start':
      console.log('Sync started');
      break;
    case 'sync-complete':
      console.log(`Synced ${event.result.synced} operations`);
      break;
    case 'conflict-detected':
      console.log('Conflict detected:', event.conflict);
      break;
  }
});

// Manual sync
const result = await syncEngine.sync();
console.log(`Synced: ${result.synced}, Failed: ${result.failed}`);
```

### 6. Offline Handler (Main Interface)

**File**: `src/handlers/offline-handler.ts`

Main interface combining all offline capabilities:

**Example**:
```typescript
import { OfflineHandler } from '@ainative/ai-kit-a2ui-core';

const handler = new OfflineHandler({
  storage: {
    backend: 'indexeddb',
    maxSize: 50 * 1024 * 1024
  },
  queue: {
    maxSize: 1000,
    retryStrategy: 'exponential'
  },
  cache: {
    strategy: 'network-first',
    ttl: 5 * 60 * 1000
  },
  sync: {
    autoSync: true,
    conflictStrategy: 'last-write-wins'
  }
});

await handler.initialize();

// Check offline status
if (handler.isOffline()) {
  // Queue operations for later sync
  await handler.queueOperation({
    type: 'create',
    data: { title: 'Offline Post' },
    maxRetries: 3
  });
}

// Store data
await handler.store('user-data', userData);

// Cache responses
await handler.cacheValue('api/posts', postsData, 60000);

// Sync when online
await handler.sync();

// Get comprehensive stats
const stats = await handler.getStats();
console.log('Storage:', stats.storage);
console.log('Queue:', stats.queue);
console.log('Cache:', stats.cache);
```

## Testing

**Test Coverage**: 73+ tests, 100% pass rate

**Test Files**:
- `tests/offline/storage.test.ts` (26 tests)
- `tests/offline/queue.test.ts` (32 tests)
- `tests/offline/integration.test.ts` (15 tests)

**Run Tests**:
```bash
# Run all offline tests
npm test tests/offline/

# Run with coverage
npm run test:coverage tests/offline/
```

## Architecture

```
┌─────────────────────────────────────────────┐
│           Offline Handler                   │
│  (Main Interface - handlers/offline-handler)│
└──────┬──────────┬──────────┬────────────────┘
       │          │          │
       │          │          │
┌──────▼──────┐ ┌▼──────────▼───┐ ┌───────────▼──┐
│   Storage   │ │  Sync Engine  │ │    Cache     │
│  (storage)  │ │ (sync-engine) │ │   (cache)    │
└──────┬──────┘ └───────┬───────┘ └──────────────┘
       │                │
       │         ┌──────▼───────┐
       │         │    Queue     │
       │         │   (queue)    │
       │         └──────────────┘
       │
       │         ┌──────────────┐
       └─────────┤   Conflict   │
                 │   Resolver   │
                 └──────────────┘
```

## Configuration Reference

### OfflineConfig

```typescript
interface OfflineConfig {
  storage: {
    backend?: 'indexeddb' | 'localstorage' | 'memory';
    databaseName?: string;
    version?: number;
    maxSize?: number; // bytes
    compression?: boolean;
    encryption?: boolean;
    encryptionKey?: string;
  };

  queue: {
    maxSize: number;
    retryStrategy: 'exponential' | 'linear' | 'fixed' | 'none';
    maxRetries?: number;
    retryDelay?: number; // milliseconds
    maxRetryDelay?: number; // milliseconds
    persistent?: boolean;
  };

  cache: {
    strategy: 'network-first' | 'cache-first' | 'network-only' | 'cache-only' | 'stale-while-revalidate';
    maxSize?: number; // bytes
    ttl?: number; // milliseconds
    versioning?: boolean;
    keyPrefix?: string;
  };

  sync: {
    autoSync?: boolean;
    syncInterval?: number; // milliseconds
    batchSize?: number;
    conflictStrategy?: 'last-write-wins' | 'operational-transform' | 'crdt' | 'manual';
    backgroundSync?: boolean;
    syncTag?: string;
  };
}
```

## Best Practices

### 1. Initialize Early

Initialize the offline handler as early as possible in your application:

```typescript
const handler = new OfflineHandler(config);
await handler.initialize();
```

### 2. Queue Operations When Offline

Always queue operations when offline:

```typescript
if (handler.isOffline()) {
  await handler.queueOperation({
    type: 'create',
    data: formData,
    maxRetries: 3
  });
  showToast('Saved for later sync');
} else {
  await apiClient.create(formData);
}
```

### 3. Handle Sync Events

Listen for sync events to update UI:

```typescript
handler.onSync((event) => {
  if (event.type === 'sync-complete') {
    showToast(`Synced ${event.result.synced} operations`);
  }

  if (event.type === 'conflict-detected') {
    showConflictDialog(event.conflict);
  }
});
```

### 4. Cache Strategically

Use appropriate cache strategies:

```typescript
// Static data - cache-first
await cache.set('countries', countries, {
  ttl: 24 * 60 * 60 * 1000 // 24 hours
});

// Dynamic data - network-first
await cache.set('user-feed', feed, {
  ttl: 5 * 60 * 1000 // 5 minutes
});
```

### 5. Clean Up

Clean up resources when done:

```typescript
// On app unmount or page unload
await handler.close();
```

## Performance Considerations

1. **Storage Limits**: IndexedDB typically has much larger limits (50MB-unlimited) than localStorage (5-10MB)

2. **Batch Operations**: Use batch processing for multiple operations to reduce overhead

3. **Cache Eviction**: Configure appropriate cache sizes to avoid memory issues

4. **Sync Intervals**: Balance between freshness and battery/network usage

5. **Queue Size**: Monitor queue size and clean up completed operations

## Browser Compatibility

- **IndexedDB**: All modern browsers (IE 10+)
- **localStorage**: All browsers
- **Background Sync**: Chrome 49+, Edge 79+
- **Service Workers**: All modern browsers

## Security Considerations

1. **Encryption**: Enable encryption for sensitive data:
   ```typescript
   storage: {
     encryption: true,
     encryptionKey: 'your-secure-key'
   }
   ```

2. **Data Validation**: Always validate data before syncing

3. **Token Storage**: Store auth tokens securely

4. **HTTPS Only**: Use HTTPS for all network requests

## Limitations

1. **Storage Quotas**: Browser storage has limits (check with Storage API)

2. **No Server-Side**: This is client-side only; server must support conflict resolution

3. **Simple OT/CRDT**: Basic implementations provided; use specialized libraries for complex scenarios

4. **Background Sync**: Requires Service Worker support

## Future Enhancements

- Advanced CRDT implementations
- Compressed storage
- Encrypted queue persistence
- IndexedDB full-text search
- Multi-tab synchronization
- Progressive sync (prioritize important data)

## Related Issues

- #55: Offline-First Support (this issue)

## References

- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Background Sync API](https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API)
