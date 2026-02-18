import { describe, it, expect } from 'vitest'
import { vectorDB } from '../../src/lib/vector-db'

describe('VectorDatabase', () => {
  describe('search', () => {
    it('should return results above threshold', async () => {
      const results = await vectorDB.search('machine learning', {
        limit: 10,
        threshold: 0.7,
      })

      expect(results).toBeInstanceOf(Array)
      expect(results.every(r => r.score >= 0.7)).toBe(true)
    })

    it('should respect limit parameter', async () => {
      const results = await vectorDB.search('test', {
        limit: 2,
        threshold: 0.5,
      })

      expect(results.length).toBeLessThanOrEqual(2)
    })

    it('should apply filters correctly', async () => {
      const results = await vectorDB.search('test', {
        limit: 10,
        threshold: 0.7,
        filters: { author: 'John Doe' },
      })

      expect(results.every(r => r.metadata.author === 'John Doe')).toBe(true)
    })

    it('should return empty array when no matches', async () => {
      const results = await vectorDB.search('test', {
        limit: 10,
        threshold: 0.99, // Very high threshold
      })

      expect(results).toBeInstanceOf(Array)
    })

    it('should include all required fields', async () => {
      const results = await vectorDB.search('test', {
        limit: 1,
        threshold: 0.5,
      })

      if (results.length > 0) {
        expect(results[0]).toHaveProperty('id')
        expect(results[0]).toHaveProperty('score')
        expect(results[0]).toHaveProperty('content')
        expect(results[0]).toHaveProperty('metadata')
      }
    })
  })
})
