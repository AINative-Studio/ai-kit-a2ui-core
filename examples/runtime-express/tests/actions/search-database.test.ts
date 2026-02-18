import { describe, it, expect, vi, beforeEach } from 'vitest'
import { searchDatabaseAction } from '../../src/actions/search-database'
import { ActionExecutionError } from '@ainative/a2ui-runtime'

// Mock the vector-db module
vi.mock('../../src/lib/vector-db', () => ({
  vectorDB: {
    search: vi.fn(),
  },
}))

// Import mocked module
import { vectorDB as mockVectorDB } from '../../src/lib/vector-db'

describe('searchDatabaseAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Action Definition', () => {
    it('should have correct name', () => {
      expect(searchDatabaseAction.name).toBe('searchDatabase')
    })

    it('should have description', () => {
      expect(searchDatabaseAction.description).toBeTruthy()
      expect(typeof searchDatabaseAction.description).toBe('string')
    })

    it('should have parameters schema', () => {
      expect(searchDatabaseAction.parameters).toBeDefined()
    })
  })

  describe('Parameter Validation', () => {
    it('should require query parameter', async () => {
      const invalidParams = { limit: 5 }
      const result = searchDatabaseAction.parameters.safeParse(invalidParams)
      expect(result.success).toBe(false)
    })

    it('should reject empty query string', async () => {
      const invalidParams = { query: '', limit: 5 }
      const result = searchDatabaseAction.parameters.safeParse(invalidParams)
      expect(result.success).toBe(false)
    })

    it('should accept valid query', async () => {
      const validParams = { query: 'machine learning', limit: 5 }
      const result = searchDatabaseAction.parameters.safeParse(validParams)
      expect(result.success).toBe(true)
    })

    it('should enforce maximum limit of 100', async () => {
      const invalidParams = { query: 'test', limit: 1000 }
      const result = searchDatabaseAction.parameters.safeParse(invalidParams)
      expect(result.success).toBe(false)
    })

    it('should enforce minimum limit of 1', async () => {
      const invalidParams = { query: 'test', limit: 0 }
      const result = searchDatabaseAction.parameters.safeParse(invalidParams)
      expect(result.success).toBe(false)
    })

    it('should default limit to 10', async () => {
      const params = { query: 'test' }
      mockVectorDB.search.mockResolvedValue([])

      await searchDatabaseAction.handler(params)

      expect(mockVectorDB.search).toHaveBeenCalledWith('test', expect.objectContaining({
        limit: 10,
      }))
    })

    it('should accept optional filters parameter', async () => {
      const params = { query: 'test', filters: { category: 'tech' } }
      const result = searchDatabaseAction.parameters.safeParse(params)
      expect(result.success).toBe(true)
    })
  })

  describe('Search Execution', () => {
    it('should return search results with similarity scores', async () => {
      const mockResults = [
        { id: '1', score: 0.95, content: 'Machine learning tutorial', metadata: { author: 'John' } },
        { id: '2', score: 0.87, content: 'Deep learning guide', metadata: { author: 'Jane' } },
      ]

      mockVectorDB.search.mockResolvedValue(mockResults)

      const result = await searchDatabaseAction.handler({
        query: 'machine learning',
        limit: 5,
      })

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(2)
      expect(result.count).toBe(2)
      expect(result.results[0].score).toBeGreaterThan(0.7)
    })

    it('should pass query to vector database', async () => {
      mockVectorDB.search.mockResolvedValue([])

      await searchDatabaseAction.handler({ query: 'test query' })

      expect(mockVectorDB.search).toHaveBeenCalledWith('test query', expect.any(Object))
    })

    it('should pass limit to vector database', async () => {
      mockVectorDB.search.mockResolvedValue([])

      await searchDatabaseAction.handler({ query: 'test', limit: 20 })

      expect(mockVectorDB.search).toHaveBeenCalledWith('test', expect.objectContaining({
        limit: 20,
      }))
    })

    it('should pass filters to vector database', async () => {
      mockVectorDB.search.mockResolvedValue([])
      const filters = { category: 'tech', published: true }

      await searchDatabaseAction.handler({ query: 'test', filters })

      expect(mockVectorDB.search).toHaveBeenCalledWith('test', expect.objectContaining({
        filters,
      }))
    })

    it('should apply similarity threshold of 0.7', async () => {
      mockVectorDB.search.mockResolvedValue([])

      await searchDatabaseAction.handler({ query: 'test' })

      expect(mockVectorDB.search).toHaveBeenCalledWith('test', expect.objectContaining({
        threshold: 0.7,
      }))
    })

    it('should return empty results when no matches found', async () => {
      mockVectorDB.search.mockResolvedValue([])

      const result = await searchDatabaseAction.handler({ query: 'nonexistent' })

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(0)
      expect(result.count).toBe(0)
    })

    it('should format results correctly', async () => {
      const mockResults = [
        { id: 'doc-1', score: 0.92, content: 'Test content', metadata: { key: 'value' } },
      ]

      mockVectorDB.search.mockResolvedValue(mockResults)

      const result = await searchDatabaseAction.handler({ query: 'test' })

      expect(result.results[0]).toHaveProperty('id')
      expect(result.results[0]).toHaveProperty('score')
      expect(result.results[0]).toHaveProperty('content')
      expect(result.results[0]).toHaveProperty('metadata')
    })
  })

  describe('Error Handling', () => {
    it('should throw ActionExecutionError on database failure', async () => {
      mockVectorDB.search.mockRejectedValue(new Error('Database connection failed'))

      await expect(
        searchDatabaseAction.handler({ query: 'test' })
      ).rejects.toThrow(ActionExecutionError)
    })

    it('should include error message in ActionExecutionError', async () => {
      mockVectorDB.search.mockRejectedValue(new Error('Connection timeout'))

      await expect(
        searchDatabaseAction.handler({ query: 'test' })
      ).rejects.toThrow(/Connection timeout/)
    })

    it('should include action name in error', async () => {
      mockVectorDB.search.mockRejectedValue(new Error('Test error'))

      try {
        await searchDatabaseAction.handler({ query: 'test' })
      } catch (error) {
        expect(error).toBeInstanceOf(ActionExecutionError)
        if (error instanceof ActionExecutionError) {
          expect(error.actionName).toBe('searchDatabase')
        }
      }
    })
  })
})
