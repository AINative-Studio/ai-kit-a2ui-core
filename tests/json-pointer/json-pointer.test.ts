/**
 * JSON Pointer (RFC 6901) Tests
 */

import { describe, it, expect } from 'vitest'
import { JSONPointer, JSONPointerError } from '../../src/json-pointer/json-pointer.js'

describe('JSONPointer', () => {
  describe('resolve', () => {
    it('resolves root pointer', () => {
      const data = { name: 'Alice' }
      expect(JSONPointer.resolve(data, '')).toEqual(data)
      expect(JSONPointer.resolve(data, '/')).toEqual(data)
    })

    it('resolves simple object paths', () => {
      const data = { user: { name: 'Alice', age: 30 } }
      expect(JSONPointer.resolve(data, '/user/name')).toBe('Alice')
      expect(JSONPointer.resolve(data, '/user/age')).toBe(30)
    })

    it('resolves array indices', () => {
      const data = { items: ['a', 'b', 'c'] }
      expect(JSONPointer.resolve(data, '/items/0')).toBe('a')
      expect(JSONPointer.resolve(data, '/items/1')).toBe('b')
      expect(JSONPointer.resolve(data, '/items/2')).toBe('c')
    })

    it('resolves nested structures', () => {
      const data = {
        users: [
          { name: 'Alice', profile: { city: 'NYC' } },
          { name: 'Bob', profile: { city: 'LA' } },
        ],
      }
      expect(JSONPointer.resolve(data, '/users/0/name')).toBe('Alice')
      expect(JSONPointer.resolve(data, '/users/1/profile/city')).toBe('LA')
    })

    it('handles escaped characters', () => {
      const data = {
        'user~name': 'Alice',
        'path/to': { value: 123 },
      }
      expect(JSONPointer.resolve(data, '/user~0name')).toBe('Alice')
      expect(JSONPointer.resolve(data, '/path~1to/value')).toBe(123)
    })

    it('returns undefined for non-existent paths', () => {
      const data = { user: { name: 'Alice' } }
      expect(JSONPointer.resolve(data, '/user/age')).toBeUndefined()
      expect(JSONPointer.resolve(data, '/missing')).toBeUndefined()
      expect(JSONPointer.resolve(data, '/user/profile/city')).toBeUndefined()
    })

    it('returns undefined for invalid array indices', () => {
      const data = { items: ['a', 'b'] }
      expect(JSONPointer.resolve(data, '/items/5')).toBeUndefined()
      expect(JSONPointer.resolve(data, '/items/-1')).toBeUndefined()
      expect(JSONPointer.resolve(data, '/items/abc')).toBeUndefined()
    })

    it('rejects leading zeros in array indices', () => {
      const data = { items: ['a', 'b', 'c'] }
      expect(JSONPointer.resolve(data, '/items/01')).toBeUndefined()
      expect(JSONPointer.resolve(data, '/items/001')).toBeUndefined()
    })

    it('handles null and undefined in path', () => {
      const data = { user: null, items: [undefined, 'b'] }
      expect(JSONPointer.resolve(data, '/user')).toBeNull()
      expect(JSONPointer.resolve(data, '/user/name')).toBeUndefined()
      expect(JSONPointer.resolve(data, '/items/0')).toBeUndefined()
      expect(JSONPointer.resolve(data, '/items/1')).toBe('b')
    })

    it('throws on invalid pointer format', () => {
      const data = { name: 'Alice' }
      expect(() => JSONPointer.resolve(data, 'user/name')).toThrow(JSONPointerError)
      expect(() => JSONPointer.resolve(data, 'user/name')).toThrow(/must start with/)
    })
  })

  describe('set', () => {
    it('sets values in objects', () => {
      const data = { user: { name: 'Alice' } }
      JSONPointer.set(data, '/user/age', 30)
      expect(data.user).toEqual({ name: 'Alice', age: 30 })
    })

    it('creates intermediate objects', () => {
      const data: Record<string, unknown> = {}
      JSONPointer.set(data, '/user/profile/city', 'NYC')
      expect(data).toEqual({ user: { profile: { city: 'NYC' } } })
    })

    it('sets array elements', () => {
      const data = { items: ['a', 'b', 'c'] }
      JSONPointer.set(data, '/items/1', 'B')
      expect(data.items).toEqual(['a', 'B', 'c'])
    })

    it('appends to arrays with "-" token', () => {
      const data = { items: ['a', 'b'] }
      JSONPointer.set(data, '/items/-', 'c')
      expect(data.items).toEqual(['a', 'b', 'c'])
    })

    it('handles escaped characters in keys', () => {
      const data: Record<string, unknown> = {}
      JSONPointer.set(data, '/user~0name', 'Alice')
      JSONPointer.set(data, '/path~1to/value', 123)
      expect(data).toEqual({
        'user~name': 'Alice',
        'path/to': { value: 123 },
      })
    })

    it('throws on empty pointer', () => {
      const data = { name: 'Alice' }
      expect(() => JSONPointer.set(data, '', 'Bob')).toThrow(JSONPointerError)
      expect(() => JSONPointer.set(data, '', 'Bob')).toThrow(/Cannot set root/)
    })

    it('throws on invalid pointer format', () => {
      const data = { name: 'Alice' }
      expect(() => JSONPointer.set(data, 'user/name', 'Bob')).toThrow(JSONPointerError)
      expect(() => JSONPointer.set(data, 'user/name', 'Bob')).toThrow(/must start with/)
    })

    it('throws when navigating through null/undefined', () => {
      const data = { user: null }
      expect(() => JSONPointer.set(data, '/user/name', 'Alice')).toThrow(JSONPointerError)
      expect(() => JSONPointer.set(data, '/user/name', 'Alice')).toThrow(/null\/undefined/)
    })

    it('throws when navigating through non-objects', () => {
      const data = { value: 'string' }
      expect(() => JSONPointer.set(data, '/value/nested', 'test')).toThrow(JSONPointerError)
      expect(() => JSONPointer.set(data, '/value/nested', 'test')).toThrow(/non-object/)
    })

    it('throws on invalid array index', () => {
      const data = { items: ['a', 'b'] }
      expect(() => JSONPointer.set(data, '/items/abc', 'x')).toThrow(JSONPointerError)
      expect(() => JSONPointer.set(data, '/items/abc', 'x')).toThrow(/Invalid array index/)
    })
  })

  describe('remove', () => {
    it('removes object properties', () => {
      const data = { user: { name: 'Alice', age: 30 } }
      const removed = JSONPointer.remove(data, '/user/age')
      expect(removed).toBe(true)
      expect(data.user).toEqual({ name: 'Alice' })
    })

    it('removes array elements', () => {
      const data = { items: ['a', 'b', 'c'] }
      const removed = JSONPointer.remove(data, '/items/1')
      expect(removed).toBe(true)
      expect(data.items).toEqual(['a', 'c'])
    })

    it('returns false for non-existent paths', () => {
      const data = { user: { name: 'Alice' } }
      expect(JSONPointer.remove(data, '/user/age')).toBe(false)
      expect(JSONPointer.remove(data, '/missing')).toBe(false)
    })

    it('returns false for out-of-bounds array indices', () => {
      const data = { items: ['a', 'b'] }
      expect(JSONPointer.remove(data, '/items/5')).toBe(false)
    })

    it('returns false when navigating through null', () => {
      const data = { user: null }
      expect(JSONPointer.remove(data, '/user/name')).toBe(false)
    })

    it('throws on empty pointer', () => {
      const data = { name: 'Alice' }
      expect(() => JSONPointer.remove(data, '')).toThrow(JSONPointerError)
      expect(() => JSONPointer.remove(data, '')).toThrow(/Cannot remove root/)
    })

    it('throws on invalid pointer format', () => {
      const data = { name: 'Alice' }
      expect(() => JSONPointer.remove(data, 'user/name')).toThrow(JSONPointerError)
      expect(() => JSONPointer.remove(data, 'user/name')).toThrow(/must start with/)
    })
  })

  describe('compile', () => {
    it('compiles pointers into tokens', () => {
      expect(JSONPointer.compile('/user/name')).toEqual(['user', 'name'])
      expect(JSONPointer.compile('/items/0')).toEqual(['items', '0'])
      expect(JSONPointer.compile('/a/b/c/d')).toEqual(['a', 'b', 'c', 'd'])
    })

    it('returns empty array for root pointer', () => {
      expect(JSONPointer.compile('')).toEqual([])
      expect(JSONPointer.compile('/')).toEqual([''])
    })

    it('unescapes special characters', () => {
      expect(JSONPointer.compile('/user~0name')).toEqual(['user~name'])
      expect(JSONPointer.compile('/path~1to')).toEqual(['path/to'])
      expect(JSONPointer.compile('/mixed~0~1tokens')).toEqual(['mixed~/tokens'])
    })

    it('throws on invalid pointer format', () => {
      expect(() => JSONPointer.compile('user/name')).toThrow(JSONPointerError)
      expect(() => JSONPointer.compile('user/name')).toThrow(/must start with/)
    })
  })
})
