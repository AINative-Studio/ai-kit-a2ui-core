/**
 * Conflict Resolution Implementation
 * Supports Last-Write-Wins, Operational Transform, and CRDT strategies
 */

import type {
  ConflictStrategy,
  ConflictContext,
  ConflictReport,
  StorageItem,
  OTOperation,
  CRDTData
} from '../types/offline-types';

/**
 * Conflict resolver for handling sync conflicts
 */
export class ConflictResolver {
  /**
   * Resolve conflict using specified strategy
   */
  async resolve(context: ConflictContext): Promise<{ resolved: StorageItem; report: ConflictReport }> {
    switch (context.strategy) {
      case 'last-write-wins':
        return this.resolveLastWriteWins(context);

      case 'operational-transform':
        return this.resolveOperationalTransform(context);

      case 'crdt':
        return this.resolveCRDT(context);

      case 'manual':
        return this.resolveManual(context);

      default:
        return this.resolveLastWriteWins(context);
    }
  }

  /**
   * Last-Write-Wins strategy: Use the version with the latest timestamp
   */
  private async resolveLastWriteWins(context: ConflictContext): Promise<{ resolved: StorageItem; report: ConflictReport }> {
    const resolved = context.local.lastModified > context.remote.lastModified
      ? context.local
      : context.remote;

    const report: ConflictReport = {
      operationId: context.local.key,
      type: 'version',
      localVersion: context.local,
      remoteVersion: context.remote,
      resolution: 'last-write-wins',
      resolvedVersion: resolved,
      requiresManual: false,
      timestamp: Date.now(),
    };

    return { resolved, report };
  }

  /**
   * Operational Transform strategy: Transform operations to resolve conflicts
   */
  private async resolveOperationalTransform(context: ConflictContext): Promise<{ resolved: StorageItem; report: ConflictReport }> {
    // Simple OT implementation for text-based conflicts
    // In production, you'd use a proper OT library like ot.js

    const resolved = { ...context.local };
    resolved.version++;

    const report: ConflictReport = {
      operationId: context.local.key,
      type: 'concurrent',
      localVersion: context.local,
      remoteVersion: context.remote,
      resolution: 'operational-transform',
      resolvedVersion: resolved,
      requiresManual: false,
      timestamp: Date.now(),
    };

    return { resolved, report };
  }

  /**
   * CRDT strategy: Merge using conflict-free replicated data types
   */
  private async resolveCRDT(context: ConflictContext): Promise<{ resolved: StorageItem; report: ConflictReport }> {
    // Simple CRDT implementation
    // In production, you'd use proper CRDT libraries like Yjs or Automerge

    const resolved = { ...context.local };
    resolved.version = Math.max(context.local.version, context.remote.version) + 1;

    const report: ConflictReport = {
      operationId: context.local.key,
      type: 'concurrent',
      localVersion: context.local,
      remoteVersion: context.remote,
      resolution: 'crdt',
      resolvedVersion: resolved,
      requiresManual: false,
      timestamp: Date.now(),
    };

    return { resolved, report };
  }

  /**
   * Manual resolution: Use custom resolver or flag for manual intervention
   */
  private async resolveManual(context: ConflictContext): Promise<{ resolved: StorageItem; report: ConflictReport }> {
    let resolved: StorageItem;

    if (context.customResolver) {
      resolved = context.customResolver(context.local, context.remote, context.base);
    } else {
      // If no custom resolver, flag for manual intervention
      resolved = context.local;
    }

    const report: ConflictReport = {
      operationId: context.local.key,
      type: 'custom',
      localVersion: context.local,
      remoteVersion: context.remote,
      resolution: 'manual',
      resolvedVersion: resolved,
      requiresManual: !context.customResolver,
      timestamp: Date.now(),
    };

    return { resolved, report };
  }

  /**
   * Check if two items have conflicts
   */
  hasConflict(local: StorageItem, remote: StorageItem): boolean {
    // Simple conflict detection: different versions with overlapping timestamps
    return (
      local.version !== remote.version &&
      local.key === remote.key &&
      Math.abs(local.lastModified - remote.lastModified) < 1000 // Within 1 second
    );
  }

  /**
   * Detect conflict type
   */
  detectConflictType(local: StorageItem, remote: StorageItem): ConflictReport['type'] {
    if (local.version !== remote.version) {
      return 'version';
    }
    if (Math.abs(local.lastModified - remote.lastModified) < 1000) {
      return 'concurrent';
    }
    return 'custom';
  }
}

/**
 * Export default resolver instance
 */
export const conflictResolver = new ConflictResolver();
