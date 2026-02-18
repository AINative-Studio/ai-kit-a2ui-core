import { z } from 'zod'
import { db, checkPermissions } from '../lib/database'

import type { Action } from '@ainative/a2ui-runtime'
import { ActionExecutionError, UnauthorizedError } from '@ainative/a2ui-runtime'

function defineAction<T extends z.ZodType>(config: {
  name: string
  description: string
  parameters: T
  handler: (params: z.infer<T>, context?: unknown) => Promise<unknown>
}): Action {
  return config as Action
}

/**
 * Update record action with transaction support and permission checking
 */
export const updateRecordAction = defineAction({
  name: 'updateRecord',
  description: 'Update a database record with validation and transaction support',

  parameters: z.object({
    table: z.enum(['users', 'posts', 'comments']).describe('Table name to update'),
    id: z.string().uuid().describe('Record UUID to update'),
    data: z.record(z.unknown()).describe('Data to update'),
  }),

  handler: async (params: any, context?: { user?: { id: string; role: string } }) => {
    const { table, id, data } = params
    const transaction = db.transaction()

    try {
      // Validate permissions
      const canUpdate = await checkPermissions(context?.user, table, id)
      if (!canUpdate) {
        await transaction.rollback()
        throw new UnauthorizedError('Insufficient permissions to update this record')
      }

      // Update record
      const updated = await transaction
        .update(table)
        .set(data)
        .where('id', id)
        .returning('*')

      await transaction.commit()

      return {
        success: true,
        record: updated[0],
      }
    } catch (error) {
      await transaction.rollback()

      if (error instanceof UnauthorizedError) {
        throw error
      }

      throw new ActionExecutionError(
        `Update failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'updateRecord'
      )
    }
  },
})
