import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateRecordAction } from '../../src/actions/update-record'
import { ActionExecutionError, UnauthorizedError } from '@ainative/a2ui-runtime'

// Mock transaction
const createMockTransaction = () => ({
  update: vi.fn(function(this: any) { return this }),
  set: vi.fn(function(this: any) { return this }),
  where: vi.fn(function(this: any) { return this }),
  returning: vi.fn(),
  commit: vi.fn(),
  rollback: vi.fn(),
})

vi.mock('../../src/lib/database', () => ({
  db: {
    transaction: vi.fn(),
  },
  checkPermissions: vi.fn(),
}))

// Import mocked modules
import { db as mockDB, checkPermissions as mockCheckPermissions } from '../../src/lib/database'

describe('updateRecordAction', () => {
  let mockTransaction: ReturnType<typeof createMockTransaction>

  beforeEach(() => {
    vi.clearAllMocks()
    mockTransaction = createMockTransaction()
    vi.mocked(mockDB.transaction).mockReturnValue(mockTransaction as any)
  })

  describe('Action Definition', () => {
    it('should have correct name', () => {
      expect(updateRecordAction.name).toBe('updateRecord')
    })

    it('should have description', () => {
      expect(updateRecordAction.description).toBeTruthy()
      expect(typeof updateRecordAction.description).toBe('string')
    })

    it('should have parameters schema', () => {
      expect(updateRecordAction.parameters).toBeDefined()
    })
  })

  describe('Parameter Validation', () => {
    it('should require table parameter', async () => {
      const invalidParams = { id: '123', data: {} }
      const result = updateRecordAction.parameters.safeParse(invalidParams)
      expect(result.success).toBe(false)
    })

    it('should require id parameter', async () => {
      const invalidParams = { table: 'users', data: {} }
      const result = updateRecordAction.parameters.safeParse(invalidParams)
      expect(result.success).toBe(false)
    })

    it('should require data parameter', async () => {
      const invalidParams = { table: 'users', id: '123' }
      const result = updateRecordAction.parameters.safeParse(invalidParams)
      expect(result.success).toBe(false)
    })

    it('should only accept allowed tables', async () => {
      const invalidParams = { table: 'admin', id: '123', data: {} }
      const result = updateRecordAction.parameters.safeParse(invalidParams)
      expect(result.success).toBe(false)
    })

    it('should accept users table', async () => {
      const params = { table: 'users', id: '550e8400-e29b-41d4-a716-446655440000', data: {} }
      const result = updateRecordAction.parameters.safeParse(params)
      expect(result.success).toBe(true)
    })

    it('should accept posts table', async () => {
      const params = { table: 'posts', id: '550e8400-e29b-41d4-a716-446655440000', data: {} }
      const result = updateRecordAction.parameters.safeParse(params)
      expect(result.success).toBe(true)
    })

    it('should accept comments table', async () => {
      const params = { table: 'comments', id: '550e8400-e29b-41d4-a716-446655440000', data: {} }
      const result = updateRecordAction.parameters.safeParse(params)
      expect(result.success).toBe(true)
    })

    it('should require UUID format for id', async () => {
      const invalidParams = { table: 'users', id: 'not-a-uuid', data: {} }
      const result = updateRecordAction.parameters.safeParse(invalidParams)
      expect(result.success).toBe(false)
    })

    it('should accept valid data object', async () => {
      const params = {
        table: 'users',
        id: '550e8400-e29b-41d4-a716-446655440000',
        data: { name: 'John', email: 'john@example.com' },
      }
      const result = updateRecordAction.parameters.safeParse(params)
      expect(result.success).toBe(true)
    })
  })

  describe('Permission Checking', () => {
    it('should check user permissions before update', async () => {
      vi.mocked(mockCheckPermissions).mockResolvedValue(true)
      mockTransaction.returning.mockResolvedValue([{ id: '123', name: 'Updated' }])

      await updateRecordAction.handler(
        {
          table: 'users',
          id: '550e8400-e29b-41d4-a716-446655440000',
          data: { name: 'John' },
        },
        { user: { id: 'user-1', role: 'user' } }
      )

      expect(mockCheckPermissions).toHaveBeenCalledWith(
        { id: 'user-1', role: 'user' },
        'users',
        '550e8400-e29b-41d4-a716-446655440000'
      )
    })

    it('should throw UnauthorizedError if permission denied', async () => {
      vi.mocked(mockCheckPermissions).mockResolvedValue(false)

      await expect(
        updateRecordAction.handler(
          {
            table: 'users',
            id: '550e8400-e29b-41d4-a716-446655440000',
            data: { name: 'John' },
          },
          { user: { id: 'user-1', role: 'user' } }
        )
      ).rejects.toThrow(UnauthorizedError)
    })

    it('should allow admin users to update any record', async () => {
      vi.mocked(mockCheckPermissions).mockResolvedValue(true)
      mockTransaction.returning.mockResolvedValue([{ id: '123' }])

      const result = await updateRecordAction.handler(
        {
          table: 'users',
          id: '550e8400-e29b-41d4-a716-446655440000',
          data: { name: 'John' },
        },
        { user: { id: 'admin-1', role: 'admin' } }
      )

      expect(result.success).toBe(true)
    })
  })

  describe('Update Execution', () => {
    beforeEach(() => {
      vi.mocked(mockCheckPermissions).mockResolvedValue(true)
    })

    it('should start a transaction', async () => {
      mockTransaction.returning.mockResolvedValue([{ id: '123' }])

      await updateRecordAction.handler({
        table: 'users',
        id: '550e8400-e29b-41d4-a716-446655440000',
        data: { name: 'John' },
      })

      expect(mockDB.transaction).toHaveBeenCalled()
    })

    it('should update the correct table', async () => {
      mockTransaction.returning.mockResolvedValue([{ id: '123' }])

      await updateRecordAction.handler({
        table: 'posts',
        id: '550e8400-e29b-41d4-a716-446655440000',
        data: { title: 'New Title' },
      })

      expect(mockTransaction.update).toHaveBeenCalledWith('posts')
    })

    it('should update the correct record by id', async () => {
      mockTransaction.returning.mockResolvedValue([{ id: '123' }])
      const testId = '550e8400-e29b-41d4-a716-446655440000'

      await updateRecordAction.handler({
        table: 'users',
        id: testId,
        data: { name: 'John' },
      })

      expect(mockTransaction.where).toHaveBeenCalledWith('id', testId)
    })

    it('should set the provided data', async () => {
      mockTransaction.returning.mockResolvedValue([{ id: '123' }])
      const data = { name: 'John', email: 'john@example.com' }

      await updateRecordAction.handler({
        table: 'users',
        id: '550e8400-e29b-41d4-a716-446655440000',
        data,
      })

      expect(mockTransaction.set).toHaveBeenCalledWith(data)
    })

    it('should return the updated record', async () => {
      const updatedRecord = { id: '123', name: 'John', email: 'john@example.com' }
      mockTransaction.returning.mockResolvedValue([updatedRecord])

      const result = await updateRecordAction.handler({
        table: 'users',
        id: '550e8400-e29b-41d4-a716-446655440000',
        data: { name: 'John' },
      })

      expect(result.success).toBe(true)
      expect(result.record).toEqual(updatedRecord)
    })

    it('should commit transaction on success', async () => {
      mockTransaction.returning.mockResolvedValue([{ id: '123' }])

      await updateRecordAction.handler({
        table: 'users',
        id: '550e8400-e29b-41d4-a716-446655440000',
        data: { name: 'John' },
      })

      expect(mockTransaction.commit).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      vi.mocked(mockCheckPermissions).mockResolvedValue(true)
    })

    it('should rollback transaction on error', async () => {
      mockTransaction.returning.mockRejectedValue(new Error('Database error'))

      await expect(
        updateRecordAction.handler({
          table: 'users',
          id: '550e8400-e29b-41d4-a716-446655440000',
          data: { name: 'John' },
        })
      ).rejects.toThrow()

      expect(mockTransaction.rollback).toHaveBeenCalled()
    })

    it('should throw ActionExecutionError on database failure', async () => {
      mockTransaction.returning.mockRejectedValue(new Error('Connection lost'))

      await expect(
        updateRecordAction.handler({
          table: 'users',
          id: '550e8400-e29b-41d4-a716-446655440000',
          data: { name: 'John' },
        })
      ).rejects.toThrow(ActionExecutionError)
    })

    it('should not commit transaction if permission check fails', async () => {
      vi.mocked(mockCheckPermissions).mockResolvedValue(false)

      await expect(
        updateRecordAction.handler({
          table: 'users',
          id: '550e8400-e29b-41d4-a716-446655440000',
          data: { name: 'John' },
        })
      ).rejects.toThrow()

      expect(mockTransaction.commit).not.toHaveBeenCalled()
    })
  })
})
