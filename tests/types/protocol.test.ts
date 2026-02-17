/**
 * Protocol Types Tests
 */

import { describe, it, expect } from 'vitest'
import {
  isCreateSurfaceMessage,
  isUpdateComponentsMessage,
  isUpdateDataModelMessage,
  isDeleteSurfaceMessage,
  isUserActionMessage,
  isErrorMessage,
  isPingMessage,
  isPongMessage,
  type A2UIMessage,
  type CreateSurfaceMessage,
  type UpdateComponentsMessage,
  type UserActionMessage,
} from '../../src/types/protocol.js'

describe('Protocol Type Guards', () => {
  describe('isCreateSurfaceMessage', () => {
    it('identifies createSurface messages', () => {
      const message: CreateSurfaceMessage = {
        type: 'createSurface',
        surfaceId: 'surface-1',
        components: [],
      }
      expect(isCreateSurfaceMessage(message)).toBe(true)
    })

    it('rejects other message types', () => {
      const message: A2UIMessage = {
        type: 'updateComponents',
        surfaceId: 'surface-1',
        updates: [],
      }
      expect(isCreateSurfaceMessage(message)).toBe(false)
    })
  })

  describe('isUpdateComponentsMessage', () => {
    it('identifies updateComponents messages', () => {
      const message: UpdateComponentsMessage = {
        type: 'updateComponents',
        surfaceId: 'surface-1',
        updates: [],
      }
      expect(isUpdateComponentsMessage(message)).toBe(true)
    })

    it('rejects other message types', () => {
      const message: A2UIMessage = {
        type: 'createSurface',
        surfaceId: 'surface-1',
        components: [],
      }
      expect(isUpdateComponentsMessage(message)).toBe(false)
    })
  })

  describe('isUpdateDataModelMessage', () => {
    it('identifies updateDataModel messages', () => {
      const message: A2UIMessage = {
        type: 'updateDataModel',
        surfaceId: 'surface-1',
        updates: [],
      }
      expect(isUpdateDataModelMessage(message)).toBe(true)
    })
  })

  describe('isDeleteSurfaceMessage', () => {
    it('identifies deleteSurface messages', () => {
      const message: A2UIMessage = {
        type: 'deleteSurface',
        surfaceId: 'surface-1',
      }
      expect(isDeleteSurfaceMessage(message)).toBe(true)
    })
  })

  describe('isUserActionMessage', () => {
    it('identifies userAction messages', () => {
      const message: UserActionMessage = {
        type: 'userAction',
        surfaceId: 'surface-1',
        action: 'submit',
      }
      expect(isUserActionMessage(message)).toBe(true)
    })
  })

  describe('isErrorMessage', () => {
    it('identifies error messages', () => {
      const message: A2UIMessage = {
        type: 'error',
        code: 'ERR001',
        message: 'Something went wrong',
      }
      expect(isErrorMessage(message)).toBe(true)
    })
  })

  describe('isPingMessage', () => {
    it('identifies ping messages', () => {
      const message: A2UIMessage = {
        type: 'ping',
      }
      expect(isPingMessage(message)).toBe(true)
    })
  })

  describe('isPongMessage', () => {
    it('identifies pong messages', () => {
      const message: A2UIMessage = {
        type: 'pong',
      }
      expect(isPongMessage(message)).toBe(true)
    })
  })
})
