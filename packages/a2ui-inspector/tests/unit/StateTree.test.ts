/**
 * Tests for StateTree utility
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { StateTree } from '@/shared/utils/StateTree'
import type { StateNode } from '@/shared/types'

describe('StateTree', () => {
  let stateTree: StateTree

  beforeEach(() => {
    stateTree = new StateTree()
  })

  describe('updateState', () => {
    it('should add new state at path', () => {
      stateTree.updateState('/user/name', 'John Doe', 'add')

      const node = stateTree.getNode('/user/name')
      expect(node?.value).toBe('John Doe')
      expect(node?.path).toBe('/user/name')
    })

    it('should replace existing state', () => {
      stateTree.updateState('/user/name', 'John Doe', 'add')
      stateTree.updateState('/user/name', 'Jane Doe', 'replace')

      const node = stateTree.getNode('/user/name')
      expect(node?.value).toBe('Jane Doe')
    })

    it('should track state changes', () => {
      stateTree.updateState('/user/name', 'John Doe', 'add')
      stateTree.updateState('/user/name', 'Jane Doe', 'replace')

      const node = stateTree.getNode('/user/name')
      expect(node?.changes).toHaveLength(2)
      expect(node?.changes[0]?.operation).toBe('add')
      expect(node?.changes[1]?.operation).toBe('replace')
    })

    it('should remove state at path', () => {
      stateTree.updateState('/user/name', 'John Doe', 'add')
      stateTree.updateState('/user/name', undefined, 'remove')

      const node = stateTree.getNode('/user/name')
      expect(node).toBeUndefined()
    })

    it('should create parent nodes automatically', () => {
      stateTree.updateState('/a/b/c/d', 'value', 'add')

      expect(stateTree.getNode('/a')).toBeDefined()
      expect(stateTree.getNode('/a/b')).toBeDefined()
      expect(stateTree.getNode('/a/b/c')).toBeDefined()
      expect(stateTree.getNode('/a/b/c/d')?.value).toBe('value')
    })

    it('should handle nested objects', () => {
      const userData = {
        name: 'John',
        age: 30,
        address: {
          city: 'NYC',
          zip: '10001'
        }
      }

      stateTree.updateState('/user', userData, 'add')

      const node = stateTree.getNode('/user')
      expect(node?.value).toEqual(userData)
    })
  })

  describe('getNode', () => {
    it('should return undefined for non-existent path', () => {
      const node = stateTree.getNode('/non/existent')
      expect(node).toBeUndefined()
    })

    it('should return node at specific path', () => {
      stateTree.updateState('/user/name', 'John', 'add')
      const node = stateTree.getNode('/user/name')

      expect(node).toBeDefined()
      expect(node?.value).toBe('John')
    })

    it('should return root node for empty path', () => {
      stateTree.updateState('/user', { name: 'John' }, 'add')
      const root = stateTree.getNode('/')

      expect(root).toBeDefined()
    })
  })

  describe('getTree', () => {
    it('should return entire state tree', () => {
      stateTree.updateState('/user/name', 'John', 'add')
      stateTree.updateState('/user/age', 30, 'add')

      const tree = stateTree.getTree()
      expect(tree).toBeDefined()
      expect(Object.keys(tree)).toContain('user')
    })

    it('should return empty object initially', () => {
      const tree = stateTree.getTree()
      expect(tree).toEqual({})
    })
  })

  describe('getDiff', () => {
    it('should return empty array when no changes', () => {
      stateTree.updateState('/user/name', 'John', 'add')
      const diff = stateTree.getDiff(Date.now())

      expect(diff).toEqual([])
    })

    it('should return changes since timestamp', () => {
      const beforeTime = Date.now()

      stateTree.updateState('/user/name', 'John', 'add')

      const afterTime = Date.now()
      stateTree.updateState('/user/age', 30, 'add')

      const diff = stateTree.getDiff(afterTime)
      expect(diff.length).toBeGreaterThan(0)
    })

    it('should include path and operation in diff', () => {
      stateTree.updateState('/user/name', 'John', 'add')
      const timestamp = Date.now() - 1000

      const diff = stateTree.getDiff(timestamp)
      expect(diff[0]).toMatchObject({
        path: '/user/name',
        operation: 'add',
        newValue: 'John'
      })
    })
  })

  describe('clear', () => {
    it('should remove all state', () => {
      stateTree.updateState('/user/name', 'John', 'add')
      stateTree.updateState('/user/age', 30, 'add')

      stateTree.clear()

      const tree = stateTree.getTree()
      expect(tree).toEqual({})
    })
  })

  describe('getChangesForPath', () => {
    it('should return change history for specific path', () => {
      stateTree.updateState('/user/name', 'John', 'add')
      stateTree.updateState('/user/name', 'Jane', 'replace')
      stateTree.updateState('/user/name', 'Bob', 'replace')

      const changes = stateTree.getChangesForPath('/user/name')
      expect(changes).toHaveLength(3)
    })

    it('should return empty array for path with no changes', () => {
      const changes = stateTree.getChangesForPath('/non/existent')
      expect(changes).toEqual([])
    })

    it('should order changes chronologically', () => {
      stateTree.updateState('/counter', 1, 'add')
      stateTree.updateState('/counter', 2, 'replace')
      stateTree.updateState('/counter', 3, 'replace')

      const changes = stateTree.getChangesForPath('/counter')
      expect(changes[0]?.newValue).toBe(1)
      expect(changes[1]?.newValue).toBe(2)
      expect(changes[2]?.newValue).toBe(3)
    })
  })

  describe('getAllPaths', () => {
    it('should return all paths in tree', () => {
      stateTree.updateState('/user/name', 'John', 'add')
      stateTree.updateState('/user/age', 30, 'add')
      stateTree.updateState('/settings/theme', 'dark', 'add')

      const paths = stateTree.getAllPaths()
      expect(paths).toContain('/user/name')
      expect(paths).toContain('/user/age')
      expect(paths).toContain('/settings/theme')
    })

    it('should return empty array for empty tree', () => {
      const paths = stateTree.getAllPaths()
      expect(paths).toEqual([])
    })
  })

  describe('exportState', () => {
    it('should export state as JSON', () => {
      stateTree.updateState('/user/name', 'John', 'add')
      stateTree.updateState('/user/age', 30, 'add')

      const exported = stateTree.exportState()
      const parsed = JSON.parse(exported)

      expect(parsed).toHaveProperty('user')
    })

    it('should handle circular references', () => {
      const obj: Record<string, unknown> = { name: 'test' }
      obj.self = obj

      expect(() => {
        stateTree.updateState('/circular', obj, 'add')
        stateTree.exportState()
      }).not.toThrow()
    })
  })
})
