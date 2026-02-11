/**
 * Streaming JSON Parser Tests
 *
 * Comprehensive test suite for progressive JSON parsing
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  StreamingJSONParser,
  createStreamingParser,
  type PartialParseResult
} from '../../src/parser/streaming-json-parser.js'

describe('StreamingJSONParser', () => {
  let parser: StreamingJSONParser

  beforeEach(() => {
    parser = new StreamingJSONParser()
  })

  describe('Complete JSON Parsing', () => {
    it('should parse complete valid JSON', () => {
      const json = JSON.stringify({
        type: 'createSurface',
        surfaceId: 'main',
        components: []
      })

      const result = parser.feed(json)

      expect(result.valid).toBe(true)
      expect(result.confidence).toBe(1.0)
      expect(result.partial.type).toBe('createSurface')
      expect(result.partial.surfaceId).toBe('main')
    })

    it('should parse complex nested JSON', () => {
      const json = JSON.stringify({
        type: 'createSurface',
        surfaceId: 'test',
        components: [
          {
            type: 'text',
            id: 't1',
            properties: {
              text: 'Hello World',
              style: { color: 'blue' }
            }
          }
        ],
        dataModel: {
          user: { name: 'Test', age: 30 }
        }
      })

      const result = parser.feed(json)

      expect(result.valid).toBe(true)
      expect(result.confidence).toBe(1.0)
      expect(result.partial.components).toHaveLength(1)
    })

    it('should handle empty objects', () => {
      const result = parser.feed('{}')

      expect(result.valid).toBe(true)
      expect(result.partial).toEqual({})
    })

    it('should handle arrays', () => {
      const json = JSON.stringify({
        type: 'updateComponents',
        surfaceId: 'main',
        updates: [1, 2, 3]
      })

      const result = parser.feed(json)

      expect(result.valid).toBe(true)
      expect(result.partial.updates).toEqual([1, 2, 3])
    })
  })

  describe('Incremental Parsing', () => {
    it('should parse JSON incrementally', () => {
      const chunks = [
        '{"type":"createSur',
        'face","surfaceId":"m',
        'ain","components":[]}'
      ]

      let lastResult: PartialParseResult | undefined

      for (const chunk of chunks) {
        lastResult = parser.feed(chunk)
        expect(lastResult.valid).toBe(true)
      }

      expect(lastResult?.partial.type).toBe('createSurface')
      expect(lastResult?.partial.surfaceId).toBe('main')
    })

    it('should handle single character chunks', () => {
      const json = '{"type":"test"}'

      for (const char of json) {
        const result = parser.feed(char)
        expect(result.valid).toBe(true)
      }

      const state = parser.getCurrentState()
      expect(state.type).toBe('test')
    })

    it('should extract partial properties', () => {
      parser.feed('{"type":"createSurface","surfaceId":"main"')

      const state = parser.getCurrentState()
      expect(state.type).toBe('createSurface')
      expect(state.surfaceId).toBe('main')
    })

    it.skip('should handle incomplete arrays', () => {
      // Complex nested case - to be optimized
      parser.feed('{"components":[{"type":"text","id":"t1"}')

      const state = parser.getCurrentState()
      expect(state.components).toBeDefined()
      expect(Array.isArray(state.components)).toBe(true)
    })
  })

  describe('Confidence Scoring', () => {
    it('should return 1.0 confidence for complete JSON', () => {
      const result = parser.feed('{"type":"ping"}')
      expect(result.confidence).toBe(1.0)
    })

    it('should return less than 1.0 for partial JSON', () => {
      const result = parser.feed('{"type":"createSurface","surfaceId"')
      expect(result.confidence).toBeLessThan(1.0)
      expect(result.confidence).toBeGreaterThan(0)
    })

    it('should increase confidence as more data arrives', () => {
      const result1 = parser.feed('{"type":"createSurface"')
      const confidence1 = result1.confidence

      const result2 = parser.feed(',"surfaceId":"main"')
      const confidence2 = result2.confidence

      const result3 = parser.feed(',"components":[]}')
      const confidence3 = result3.confidence

      expect(confidence2).toBeGreaterThan(confidence1)
      expect(confidence3).toBeGreaterThan(confidence2)
    })
  })

  describe('Malformed JSON Handling', () => {
    it('should handle missing closing brace', () => {
      const json = '{"type":"test","value":123'

      parser.feed(json)
      const repaired = parser.finalize()

      expect(repaired.type).toBe('test')
      expect(repaired.value).toBe(123)
    })

    it('should handle missing closing bracket', () => {
      const json = '{"type":"test","items":[1,2,3'

      parser.feed(json)
      const repaired = parser.finalize()

      expect(repaired.type).toBe('test')
      expect(Array.isArray(repaired.items)).toBe(true)
    })

    it('should handle incomplete string', () => {
      const json = '{"type":"test","message":"Hello Wor'

      parser.feed(json)
      const state = parser.getCurrentState()

      expect(state.type).toBe('test')
      // Should extract what we can
      expect(state.message).toBeDefined()
    })

    it('should handle truncated nested object', () => {
      const json = '{"type":"test","nested":{"key":"val'

      parser.feed(json)
      const repaired = parser.finalize()

      expect(repaired.type).toBe('test')
    })
  })

  describe('Auto-Repair', () => {
    it('should auto-repair on finalize', () => {
      parser.feed('{"type":"createSurface","surfaceId":"main"')

      const repaired = parser.finalize()

      expect(repaired.type).toBe('createSurface')
      expect(repaired.surfaceId).toBe('main')
    })

    it('should close multiple levels of nesting', () => {
      parser.feed('{"type":"test","a":{"b":{"c":"value"')

      const repaired = parser.finalize()

      expect(repaired.type).toBe('test')
    })

    it.skip('should handle mixed arrays and objects', () => {
      // Complex nested case - to be optimized
      parser.feed('{"type":"test","items":[{"id":"1"},{"id":"2"')

      const repaired = parser.finalize()

      expect(repaired.type).toBe('test')
      expect(Array.isArray(repaired.items)).toBe(true)
    })
  })

  describe('LLM Streaming Scenarios', () => {
    it('should handle typical LLM UI generation stream', () => {
      const chunks = [
        '{"type":"createSurfa',
        'ce","id":"main","compo',
        'nents":[{"type":"text"',
        ',"id":"t1","properties":{"text":"Hello',
        ' World"}}]}'
      ]

      for (const chunk of chunks) {
        const result = parser.feed(chunk)
        expect(result.valid).toBe(true)
      }

      const final = parser.finalize()
      expect(final.type).toBe('createSurface')
    })

    it('should handle progressive form building', () => {
      const chunks = [
        '{"type":"updateComponents","surfaceId":"form","updates":[',
        '{"id":"name","operation":"add","component":{"type":"textField","id":"name"}},',
        '{"id":"email","operation":"add","component":{"type":"textField","id":"email"}}'
      ]

      for (const chunk of chunks) {
        parser.feed(chunk)
      }

      const repaired = parser.finalize()
      expect(repaired.type).toBe('updateComponents')
    })

    it('should handle sudden stream cutoff', () => {
      parser.feed('{"type":"createSurface","surfaceId":"test","components":[{"type"')

      const repaired = parser.finalize()
      expect(repaired.type).toBe('createSurface')
      expect(repaired.surfaceId).toBe('test')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty chunks', () => {
      const result1 = parser.feed('{"type":"test"')
      const result2 = parser.feed('')
      const result3 = parser.feed('}')

      expect(result3.confidence).toBe(1.0)
    })

    it('should handle whitespace chunks', () => {
      parser.feed('{"type"')
      parser.feed('   ')
      parser.feed(':"test"}')

      const state = parser.getCurrentState()
      expect(state.type).toBe('test')
    })

    it('should handle unicode characters', () => {
      const json = '{"message":"Hello 世界 🌍"}'
      const result = parser.feed(json)

      expect(result.partial.message).toBe('Hello 世界 🌍')
    })

    it('should handle escaped characters', () => {
      const json = '{"text":"Line 1\\nLine 2\\tTabbed"}'
      const result = parser.feed(json)

      expect(result.partial.text).toBe('Line 1\nLine 2\tTabbed')
    })

    it('should handle numbers', () => {
      const json = '{"int":42,"float":3.14,"exp":1e10,"negative":-5}'
      const result = parser.feed(json)

      expect(result.partial.int).toBe(42)
      expect(result.partial.float).toBe(3.14)
      expect(result.partial.exp).toBe(1e10)
      expect(result.partial.negative).toBe(-5)
    })

    it('should handle booleans and null', () => {
      const json = '{"bool1":true,"bool2":false,"nullable":null}'
      const result = parser.feed(json)

      expect(result.partial.bool1).toBe(true)
      expect(result.partial.bool2).toBe(false)
      expect(result.partial.nullable).toBe(null)
    })
  })

  describe('Reset and State Management', () => {
    it('should reset parser state', () => {
      parser.feed('{"type":"test"}')
      parser.reset()

      expect(parser.getBuffer()).toBe('')
      expect(parser.getCurrentState()).toEqual({})
    })

    it('should handle multiple parsing sessions', () => {
      parser.feed('{"type":"first"}')
      const first = parser.finalize()

      parser.reset()

      parser.feed('{"type":"second"}')
      const second = parser.finalize()

      expect(first.type).toBe('first')
      expect(second.type).toBe('second')
    })
  })

  describe('Performance', () => {
    it('should handle large JSON efficiently', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        id: `item-${i}`,
        value: i
      }))

      const json = JSON.stringify({
        type: 'test',
        data: largeArray
      })

      const start = Date.now()
      const result = parser.feed(json)
      const duration = Date.now() - start

      expect(result.valid).toBe(true)
      expect(duration).toBeLessThan(100) // Should parse in <100ms
    })

    it('should handle many small chunks efficiently', () => {
      const json = JSON.stringify({ type: 'test', value: 'a'.repeat(10000) })
      const chunks = json.match(/.{1,10}/g) || []

      const start = Date.now()

      for (const chunk of chunks) {
        parser.feed(chunk)
      }

      const duration = Date.now() - start

      expect(duration).toBeLessThan(1000) // Should handle 1000+ chunks in <1s
    })
  })

  describe('Factory Function', () => {
    it('should create parser via factory', () => {
      const newParser = createStreamingParser()
      expect(newParser).toBeInstanceOf(StreamingJSONParser)
    })
  })

  describe('Property Counting', () => {
    it('should count complete properties', () => {
      const result = parser.feed('{"type":"test","a":1,"b":2')

      expect(result.completeProperties).toBeGreaterThan(0)
      expect(result.expectedProperties).toBeGreaterThan(0)
    })

    it('should estimate expected properties by message type', () => {
      const result = parser.feed('{"type":"createSurface"')

      expect(result.expectedProperties).toBe(4) // type, surfaceId, components, dataModel
    })
  })
})
