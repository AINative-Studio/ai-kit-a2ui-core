/**
 * A2UI Collaboration Conflict Resolution (Issue #54)
 * Implements various conflict resolution strategies for collaborative editing
 */

import type { EditorOperation } from '../types/collaboration-messages.js'

/**
 * Conflict resolution strategy types
 */
export type ConflictResolutionStrategy = 'last-write-wins' | 'operational-transform' | 'crdt'

/**
 * Change metadata for conflict resolution
 */
export interface Change {
  /** Timestamp of change */
  timestamp: Date
  /** User who made the change */
  userId: string
  /** Change data */
  data: unknown
  /** Change version */
  version?: number
}

/**
 * Operational Transform operation
 */
export interface Operation {
  /** Operation type */
  type: 'insert' | 'delete' | 'retain'
  /** Position in document */
  position: number
  /** Length (for delete/retain) */
  length?: number
  /** Content (for insert) */
  content?: string
}

/**
 * CRDT (Conflict-free Replicated Data Type) state
 */
export interface CRDTState {
  /** Site identifier */
  siteId: string
  /** Counter for operations */
  counter: number
  /** State data */
  data: unknown
  /** Vector clock for causality tracking */
  vectorClock?: Map<string, number>
}

/**
 * Conflict Resolver
 * Handles conflict resolution for collaborative editing
 */
export class ConflictResolver {
  /**
   * Resolve conflict using last-write-wins strategy
   * The change with the most recent timestamp wins
   */
  lastWriteWins(localChange: Change, remoteChange: Change): Change {
    // Compare timestamps
    const localTime = localChange.timestamp.getTime()
    const remoteTime = remoteChange.timestamp.getTime()

    if (localTime > remoteTime) {
      return localChange
    } else if (remoteTime > localTime) {
      return remoteChange
    } else {
      // If timestamps are equal, use userId as tiebreaker for consistency
      return localChange.userId > remoteChange.userId ? localChange : remoteChange
    }
  }

  /**
   * Operational Transform
   * Transforms operations to resolve conflicts while preserving intention
   */
  operationalTransform(localOps: Operation[], remoteOps: Operation[]): Operation[] {
    const transformedOps: Operation[] = []

    for (const localOp of localOps) {
      let transformedOp = { ...localOp }

      for (const remoteOp of remoteOps) {
        transformedOp = this.transformOperation(transformedOp, remoteOp)
      }

      transformedOps.push(transformedOp)
    }

    return transformedOps
  }

  /**
   * Transform a single operation against another
   */
  private transformOperation(op1: Operation, op2: Operation): Operation {
    // Insert vs Insert
    if (op1.type === 'insert' && op2.type === 'insert') {
      if (op2.position <= op1.position) {
        return {
          ...op1,
          position: op1.position + (op2.content?.length || 0),
        }
      }
      return op1
    }

    // Insert vs Delete
    if (op1.type === 'insert' && op2.type === 'delete') {
      if (op2.position < op1.position) {
        return {
          ...op1,
          position: op1.position - (op2.length || 0),
        }
      }
      return op1
    }

    // Delete vs Insert
    if (op1.type === 'delete' && op2.type === 'insert') {
      if (op2.position <= op1.position) {
        return {
          ...op1,
          position: op1.position + (op2.content?.length || 0),
        }
      } else if (op2.position < op1.position + (op1.length || 0)) {
        // Insert is within deleted range - adjust length
        return {
          ...op1,
          length: (op1.length || 0) + (op2.content?.length || 0),
        }
      }
      return op1
    }

    // Delete vs Delete
    if (op1.type === 'delete' && op2.type === 'delete') {
      if (op2.position + (op2.length || 0) <= op1.position) {
        // op2 is completely before op1
        return {
          ...op1,
          position: op1.position - (op2.length || 0),
        }
      } else if (op2.position < op1.position) {
        // op2 overlaps with start of op1
        const overlap = op2.position + (op2.length || 0) - op1.position
        return {
          ...op1,
          position: op2.position,
          length: Math.max(0, (op1.length || 0) - overlap),
        }
      } else if (op2.position < op1.position + (op1.length || 0)) {
        // op2 is within op1
        return {
          ...op1,
          length: Math.max(0, (op1.length || 0) - (op2.length || 0)),
        }
      }
      return op1
    }

    return op1
  }

  /**
   * CRDT (Conflict-free Replicated Data Type) merge
   * Merges states without conflicts using causality
   */
  crdtMerge(localState: CRDTState, remoteState: CRDTState): CRDTState {
    // Merge vector clocks
    const mergedVectorClock = new Map<string, number>(localState.vectorClock || new Map())
    const remoteVectorClock = remoteState.vectorClock || new Map()

    for (const [siteId, counter] of remoteVectorClock) {
      const localCounter = mergedVectorClock.get(siteId) || 0
      mergedVectorClock.set(siteId, Math.max(localCounter, counter))
    }

    // Determine which state is more recent based on vector clock
    const localIsNewer = this.compareVectorClocks(
      localState.vectorClock || new Map(),
      remoteState.vectorClock || new Map()
    )

    return {
      siteId: localState.siteId,
      counter: Math.max(localState.counter, remoteState.counter) + 1,
      data: localIsNewer >= 0 ? localState.data : remoteState.data,
      vectorClock: mergedVectorClock,
    }
  }

  /**
   * Compare vector clocks
   * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if concurrent
   */
  private compareVectorClocks(v1: Map<string, number>, v2: Map<string, number>): number {
    let v1Greater = false
    let v2Greater = false

    const allSites = new Set([...v1.keys(), ...v2.keys()])

    for (const site of allSites) {
      const count1 = v1.get(site) || 0
      const count2 = v2.get(site) || 0

      if (count1 > count2) v1Greater = true
      if (count2 > count1) v2Greater = true
    }

    if (v1Greater && !v2Greater) return 1
    if (v2Greater && !v1Greater) return -1
    return 0 // Concurrent
  }

  /**
   * Convert EditorOperation to Operation format
   */
  convertEditorOperation(editorOp: EditorOperation): Operation {
    switch (editorOp.type) {
      case 'insert':
        return {
          type: 'insert',
          position: editorOp.position,
          content: editorOp.content,
        }
      case 'delete':
        return {
          type: 'delete',
          position: editorOp.position,
          length: editorOp.length,
        }
      case 'replace':
        // Replace is delete + insert
        return {
          type: 'insert',
          position: editorOp.position,
          content: editorOp.content,
          length: editorOp.length, // Indicates replacement
        }
      default:
        throw new Error(`Unknown operation type: ${editorOp.type}`)
    }
  }

  /**
   * Apply operations to content
   */
  applyOperations(content: string, operations: Operation[]): string {
    let result = content

    // Sort operations by position (descending) to avoid position shifts
    const sortedOps = [...operations].sort((a, b) => b.position - a.position)

    for (const op of sortedOps) {
      switch (op.type) {
        case 'insert':
          result = result.slice(0, op.position) + (op.content || '') + result.slice(op.position)
          break

        case 'delete':
          result =
            result.slice(0, op.position) + result.slice(op.position + (op.length || 0))
          break

        case 'retain':
          // Retain doesn't modify content
          break
      }
    }

    return result
  }

  /**
   * Detect conflicts between two sets of operations
   */
  detectConflicts(localOps: Operation[], remoteOps: Operation[]): boolean {
    for (const localOp of localOps) {
      for (const remoteOp of remoteOps) {
        if (this.operationsOverlap(localOp, remoteOp)) {
          return true
        }
      }
    }
    return false
  }

  /**
   * Check if two operations overlap
   */
  private operationsOverlap(op1: Operation, op2: Operation): boolean {
    const op1End = op1.position + (op1.type === 'insert' ? 1 : op1.length || 0)
    const op2End = op2.position + (op2.type === 'insert' ? 1 : op2.length || 0)

    return op1.position < op2End && op2.position < op1End
  }

  /**
   * Create a new CRDT state
   */
  createCRDTState(siteId: string, data: unknown = null): CRDTState {
    return {
      siteId,
      counter: 0,
      data,
      vectorClock: new Map([[siteId, 0]]),
    }
  }

  /**
   * Increment CRDT counter
   */
  incrementCRDT(state: CRDTState): CRDTState {
    const newVectorClock = new Map(state.vectorClock || new Map())
    newVectorClock.set(state.siteId, (newVectorClock.get(state.siteId) || 0) + 1)

    return {
      ...state,
      counter: state.counter + 1,
      vectorClock: newVectorClock,
    }
  }
}

/**
 * Singleton instance
 */
export const conflictResolver = new ConflictResolver()

/**
 * Helper function to resolve conflicts using specified strategy
 */
export function resolveConflict(
  strategy: ConflictResolutionStrategy,
  localData: unknown,
  remoteData: unknown
): unknown {
  const resolver = new ConflictResolver()

  switch (strategy) {
    case 'last-write-wins':
      return resolver.lastWriteWins(localData as Change, remoteData as Change)

    case 'operational-transform':
      return resolver.operationalTransform(localData as Operation[], remoteData as Operation[])

    case 'crdt':
      return resolver.crdtMerge(localData as CRDTState, remoteData as CRDTState)

    default:
      throw new Error(`Unknown conflict resolution strategy: ${strategy}`)
  }
}
