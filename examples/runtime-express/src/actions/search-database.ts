import { z } from 'zod'
import { vectorDB } from '../lib/vector-db'

// Import types and classes explicitly
import type { Action } from '@ainative/a2ui-runtime'
import { ActionExecutionError } from '@ainative/a2ui-runtime'

function defineAction<T extends z.ZodType>(config: {
  name: string
  description: string
  parameters: T
  handler: (params: z.infer<T>, context?: unknown) => Promise<unknown>
}): Action {
  return config as Action
}

/**
 * Search database action using vector similarity
 */
export const searchDatabaseAction = defineAction({
  name: 'searchDatabase',
  description: 'Search the vector database for semantically similar documents using pgvector',

  parameters: z.object({
    query: z.string().min(1).describe('Search query text'),
    limit: z
      .number()
      .min(1)
      .max(100)
      .optional()
      .default(10)
      .describe('Maximum number of results to return (1-100)'),
    filters: z
      .record(z.unknown())
      .optional()
      .describe('Optional metadata filters to apply'),
  }),

  handler: async ({ query, limit = 10, filters }: { query: string; limit?: number; filters?: Record<string, unknown> }) => {
    try {
      const results = await vectorDB.search(query, {
        limit,
        filters,
        threshold: 0.7, // Minimum similarity score
      })

      return {
        success: true,
        results: results.map(r => ({
          id: r.id,
          score: r.score,
          content: r.content,
          metadata: r.metadata,
        })),
        count: results.length,
      }
    } catch (error) {
      throw new ActionExecutionError(
        `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'searchDatabase'
      )
    }
  },
})
