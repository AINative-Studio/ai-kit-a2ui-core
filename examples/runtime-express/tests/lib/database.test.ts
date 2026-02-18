import { describe, it, expect } from 'vitest'
import { db, checkPermissions } from '../../src/lib/database'

describe('Database', () => {
  describe('transaction', () => {
    it('should create a transaction', () => {
      const transaction = db.transaction()
      expect(transaction).toBeDefined()
      expect(transaction).toHaveProperty('update')
      expect(transaction).toHaveProperty('set')
      expect(transaction).toHaveProperty('where')
      expect(transaction).toHaveProperty('returning')
      expect(transaction).toHaveProperty('commit')
      expect(transaction).toHaveProperty('rollback')
    })

    it('should chain update operations', async () => {
      const transaction = db.transaction()
      const result = await transaction
        .update('users')
        .set({ name: 'John' })
        .where('id', '123')
        .returning('*')

      expect(result).toBeInstanceOf(Array)
      expect(result[0]).toHaveProperty('id')
      expect(result[0].name).toBe('John')
    })

    it('should commit successfully', async () => {
      const transaction = db.transaction()
      await expect(transaction.commit()).resolves.toBeUndefined()
    })

    it('should rollback successfully', async () => {
      const transaction = db.transaction()
      await expect(transaction.rollback()).resolves.toBeUndefined()
    })
  })

  describe('checkPermissions', () => {
    it('should deny access without user', async () => {
      const hasPermission = await checkPermissions(undefined, 'users', '123')
      expect(hasPermission).toBe(false)
    })

    it('should allow admin users', async () => {
      const hasPermission = await checkPermissions(
        { id: 'admin-1', role: 'admin' },
        'users',
        '123'
      )
      expect(hasPermission).toBe(true)
    })

    it('should allow superuser', async () => {
      const hasPermission = await checkPermissions(
        { id: 'super-1', role: 'superuser' },
        'users',
        '123'
      )
      expect(hasPermission).toBe(true)
    })

    it('should allow regular users', async () => {
      const hasPermission = await checkPermissions(
        { id: 'user-1', role: 'user' },
        'users',
        '123'
      )
      expect(hasPermission).toBe(true)
    })
  })
})
