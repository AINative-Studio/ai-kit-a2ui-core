/**
 * Conflict Resolver Tests
 */

import { describe, it, expect } from 'vitest'
import {
  ConflictResolver,
  type Change,
  type Operation,
  type CRDTState,
  resolveConflict,
} from '../../src/utils/conflict-resolver.js'

describe('ConflictResolver', () => {
  const resolver = new ConflictResolver()

  describe('Last-Write-Wins', () => {
    it('should select change with most recent timestamp', () => {
      const localChange: Change = {
        timestamp: new Date('2024-01-01T10:00:00Z'),
        userId: 'user-1',
        data: 'local content',
      }

      const remoteChange: Change = {
        timestamp: new Date('2024-01-01T11:00:00Z'),
        userId: 'user-2',
        data: 'remote content',
      }

      const result = resolver.lastWriteWins(localChange, remoteChange)
      expect(result.data).toBe('remote content')
      expect(result.userId).toBe('user-2')
    })

    it('should use userId as tiebreaker for equal timestamps', () => {
      const timestamp = new Date('2024-01-01T10:00:00Z')

      const changeA: Change = {
        timestamp,
        userId: 'user-a',
        data: 'content a',
      }

      const changeB: Change = {
        timestamp,
        userId: 'user-b',
        data: 'content b',
      }

      const result = resolver.lastWriteWins(changeA, changeB)
      expect(result.userId).toBe('user-b') // 'user-b' > 'user-a'
    })

    it('should handle local change being more recent', () => {
      const localChange: Change = {
        timestamp: new Date('2024-01-01T12:00:00Z'),
        userId: 'user-1',
        data: 'local content',
      }

      const remoteChange: Change = {
        timestamp: new Date('2024-01-01T11:00:00Z'),
        userId: 'user-2',
        data: 'remote content',
      }

      const result = resolver.lastWriteWins(localChange, remoteChange)
      expect(result.data).toBe('local content')
    })
  })

  describe('Operational Transform', () => {
    it('should transform insert after remote insert', () => {
      const localOps: Operation[] = [
        { type: 'insert', position: 5, content: 'local' },
      ]

      const remoteOps: Operation[] = [
        { type: 'insert', position: 3, content: 'remote' },
      ]

      const transformed = resolver.operationalTransform(localOps, remoteOps)
      expect(transformed[0].position).toBe(11) // 5 + 6 (length of 'remote')
    })

    it('should transform delete after remote insert', () => {
      const localOps: Operation[] = [
        { type: 'delete', position: 5, length: 3 },
      ]

      const remoteOps: Operation[] = [
        { type: 'insert', position: 3, content: 'text' },
      ]

      const transformed = resolver.operationalTransform(localOps, remoteOps)
      expect(transformed[0].position).toBe(9) // 5 + 4 (length of 'text')
    })

    it('should transform insert after remote delete', () => {
      const localOps: Operation[] = [
        { type: 'insert', position: 10, content: 'test' },
      ]

      const remoteOps: Operation[] = [
        { type: 'delete', position: 5, length: 3 },
      ]

      const transformed = resolver.operationalTransform(localOps, remoteOps)
      expect(transformed[0].position).toBe(7) // 10 - 3
    })

    it('should handle multiple operations', () => {
      const localOps: Operation[] = [
        { type: 'insert', position: 5, content: 'a' },
        { type: 'delete', position: 10, length: 2 },
      ]

      const remoteOps: Operation[] = [
        { type: 'insert', position: 3, content: 'b' },
      ]

      const transformed = resolver.operationalTransform(localOps, remoteOps)
      expect(transformed).toHaveLength(2)
      expect(transformed[0].position).toBe(6) // First insert shifted
      expect(transformed[1].position).toBe(11) // Delete shifted
    })

    it('should handle overlapping deletes', () => {
      const localOps: Operation[] = [
        { type: 'delete', position: 5, length: 5 },
      ]

      const remoteOps: Operation[] = [
        { type: 'delete', position: 3, length: 4 },
      ]

      const transformed = resolver.operationalTransform(localOps, remoteOps)
      expect(transformed[0].position).toBe(3) // Adjusted to remote delete position
    })
  })

  describe('CRDT Merge', () => {
    it('should merge vector clocks correctly', () => {
      const localState: CRDTState = {
        siteId: 'site-1',
        counter: 5,
        data: 'local data',
        vectorClock: new Map([
          ['site-1', 5],
          ['site-2', 3],
        ]),
      }

      const remoteState: CRDTState = {
        siteId: 'site-2',
        counter: 7,
        data: 'remote data',
        vectorClock: new Map([
          ['site-1', 4],
          ['site-2', 7],
        ]),
      }

      const merged = resolver.crdtMerge(localState, remoteState)
      expect(merged.vectorClock?.get('site-1')).toBe(5)
      expect(merged.vectorClock?.get('site-2')).toBe(7)
      expect(merged.counter).toBeGreaterThan(7)
    })

    it('should select more recent state based on vector clock', () => {
      const localState: CRDTState = {
        siteId: 'site-1',
        counter: 5,
        data: 'local data',
        vectorClock: new Map([
          ['site-1', 5],
          ['site-2', 3],
        ]),
      }

      const remoteState: CRDTState = {
        siteId: 'site-2',
        counter: 4,
        data: 'remote data',
        vectorClock: new Map([
          ['site-1', 3],
          ['site-2', 4],
        ]),
      }

      const merged = resolver.crdtMerge(localState, remoteState)
      expect(merged.data).toBe('local data') // Local is more recent
    })

    it('should handle concurrent updates', () => {
      const localState: CRDTState = {
        siteId: 'site-1',
        counter: 5,
        data: 'local data',
        vectorClock: new Map([
          ['site-1', 5],
          ['site-2', 3],
        ]),
      }

      const remoteState: CRDTState = {
        siteId: 'site-2',
        counter: 7,
        data: 'remote data',
        vectorClock: new Map([
          ['site-1', 3],
          ['site-2', 7],
        ]),
      }

      const merged = resolver.crdtMerge(localState, remoteState)
      expect(merged.vectorClock?.size).toBe(2)
    })
  })

  describe('Operation Application', () => {
    it('should apply insert operation', () => {
      const content = 'Hello World'
      const operations: Operation[] = [
        { type: 'insert', position: 5, content: ' Beautiful' },
      ]

      const result = resolver.applyOperations(content, operations)
      expect(result).toBe('Hello Beautiful World')
    })

    it('should apply delete operation', () => {
      const content = 'Hello World'
      const operations: Operation[] = [
        { type: 'delete', position: 5, length: 6 },
      ]

      const result = resolver.applyOperations(content, operations)
      expect(result).toBe('Hello')
    })

    it('should apply multiple operations', () => {
      const content = 'Hello World'
      const operations: Operation[] = [
        { type: 'insert', position: 11, content: '!' },
        { type: 'delete', position: 5, length: 1 },
        { type: 'insert', position: 5, content: ',' },
      ]

      const result = resolver.applyOperations(content, operations)
      expect(result).toBe('Hello,World!')
    })

    it('should handle retain operation', () => {
      const content = 'Hello World'
      const operations: Operation[] = [
        { type: 'retain', position: 5, length: 5 },
      ]

      const result = resolver.applyOperations(content, operations)
      expect(result).toBe('Hello World') // Unchanged
    })
  })

  describe('Conflict Detection', () => {
    it('should detect overlapping operations', () => {
      const localOps: Operation[] = [
        { type: 'insert', position: 5, content: 'test' },
      ]

      const remoteOps: Operation[] = [
        { type: 'delete', position: 4, length: 3 },
      ]

      const hasConflict = resolver.detectConflicts(localOps, remoteOps)
      expect(hasConflict).toBe(true)
    })

    it('should not detect conflicts for non-overlapping operations', () => {
      const localOps: Operation[] = [
        { type: 'insert', position: 10, content: 'test' },
      ]

      const remoteOps: Operation[] = [
        { type: 'delete', position: 0, length: 3 },
      ]

      const hasConflict = resolver.detectConflicts(localOps, remoteOps)
      expect(hasConflict).toBe(false)
    })
  })

  describe('CRDT State Management', () => {
    it('should create new CRDT state', () => {
      const state = resolver.createCRDTState('site-1', 'initial data')

      expect(state.siteId).toBe('site-1')
      expect(state.counter).toBe(0)
      expect(state.data).toBe('initial data')
      expect(state.vectorClock?.get('site-1')).toBe(0)
    })

    it('should increment CRDT counter', () => {
      const state = resolver.createCRDTState('site-1', 'data')
      const incremented = resolver.incrementCRDT(state)

      expect(incremented.counter).toBe(1)
      expect(incremented.vectorClock?.get('site-1')).toBe(1)
    })

    it('should maintain site ID on increment', () => {
      const state = resolver.createCRDTState('site-1', 'data')
      const incremented = resolver.incrementCRDT(state)

      expect(incremented.siteId).toBe('site-1')
    })
  })

  describe('Editor Operation Conversion', () => {
    it('should convert insert operation', () => {
      const editorOp = {
        type: 'insert' as const,
        position: 5,
        content: 'test',
      }

      const operation = resolver.convertEditorOperation(editorOp)
      expect(operation.type).toBe('insert')
      expect(operation.position).toBe(5)
      expect(operation.content).toBe('test')
    })

    it('should convert delete operation', () => {
      const editorOp = {
        type: 'delete' as const,
        position: 5,
        length: 3,
      }

      const operation = resolver.convertEditorOperation(editorOp)
      expect(operation.type).toBe('delete')
      expect(operation.position).toBe(5)
      expect(operation.length).toBe(3)
    })

    it('should convert replace operation', () => {
      const editorOp = {
        type: 'replace' as const,
        position: 5,
        length: 3,
        content: 'new',
      }

      const operation = resolver.convertEditorOperation(editorOp)
      expect(operation.type).toBe('insert')
      expect(operation.position).toBe(5)
      expect(operation.content).toBe('new')
      expect(operation.length).toBe(3)
    })
  })

  describe('Resolve Conflict Helper', () => {
    it('should resolve using last-write-wins strategy', () => {
      const localChange: Change = {
        timestamp: new Date('2024-01-01T10:00:00Z'),
        userId: 'user-1',
        data: 'local',
      }

      const remoteChange: Change = {
        timestamp: new Date('2024-01-01T11:00:00Z'),
        userId: 'user-2',
        data: 'remote',
      }

      const result = resolveConflict('last-write-wins', localChange, remoteChange)
      expect((result as Change).data).toBe('remote')
    })

    it('should resolve using operational-transform strategy', () => {
      const localOps: Operation[] = [
        { type: 'insert', position: 5, content: 'test' },
      ]

      const remoteOps: Operation[] = [
        { type: 'insert', position: 3, content: 'abc' },
      ]

      const result = resolveConflict('operational-transform', localOps, remoteOps)
      expect(Array.isArray(result)).toBe(true)
      expect((result as Operation[])[0].position).toBe(8)
    })

    it('should resolve using CRDT strategy', () => {
      const localState: CRDTState = {
        siteId: 'site-1',
        counter: 5,
        data: 'local',
        vectorClock: new Map([['site-1', 5]]),
      }

      const remoteState: CRDTState = {
        siteId: 'site-2',
        counter: 3,
        data: 'remote',
        vectorClock: new Map([['site-2', 3]]),
      }

      const result = resolveConflict('crdt', localState, remoteState)
      expect((result as CRDTState).vectorClock?.size).toBeGreaterThan(0)
    })

    it('should throw error for unknown strategy', () => {
      expect(() => {
        resolveConflict('unknown' as any, {}, {})
      }).toThrow('Unknown conflict resolution strategy')
    })
  })
})
