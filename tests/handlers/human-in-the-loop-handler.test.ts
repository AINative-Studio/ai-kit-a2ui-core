/**
 * Tests for Human-in-the-Loop Handler (Issue #88)
 * Following TDD approach: Tests written before implementation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { HumanInTheLoopHandler } from '../../src/handlers/human-in-the-loop-handler'
import type {
  AgentInterruptMessage,
  InterruptResponseMessage,
} from '../../src/types/interrupt-messages'
import { storage } from '../../src/offline/storage'

describe('HumanInTheLoopHandler', () => {
  let handler: HumanInTheLoopHandler

  beforeEach(() => {
    handler = new HumanInTheLoopHandler()
    vi.useFakeTimers()
  })

  afterEach(() => {
    handler.destroy()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('Basic Functionality', () => {
    it('should create handler instance', () => {
      expect(handler).toBeDefined()
      expect(handler.getPendingInterrupts()).toEqual([])
    })

    it('should handle incoming interrupt message', async () => {
      const interrupt: AgentInterruptMessage = {
        type: 'agentInterrupt',
        interruptId: 'int-001',
        reason: 'confirmation',
        prompt: 'Are you sure?',
        timestamp: Date.now(),
      }

      await handler.handleInterrupt(interrupt)

      const pending = handler.getPendingInterrupts()
      expect(pending).toHaveLength(1)
      expect(pending[0]?.interruptId).toBe('int-001')
    })

    it('should handle interrupt response', async () => {
      const interrupt: AgentInterruptMessage = {
        type: 'agentInterrupt',
        interruptId: 'int-002',
        reason: 'confirmation',
        prompt: 'Proceed?',
        timestamp: Date.now(),
      }

      await handler.handleInterrupt(interrupt)

      const response: InterruptResponseMessage = {
        type: 'interruptResponse',
        interruptId: 'int-002',
        response: true,
        timestamp: Date.now(),
      }

      await handler.handleResponse(response)

      const pending = handler.getPendingInterrupts()
      expect(pending).toHaveLength(0)
    })

    it('should return interrupt result via promise', async () => {
      const interrupt: AgentInterruptMessage = {
        type: 'agentInterrupt',
        interruptId: 'int-003',
        reason: 'confirmation',
        prompt: 'Continue?',
        timestamp: Date.now(),
      }

      const resultPromise = handler.waitForResponse('int-003')

      await handler.handleInterrupt(interrupt)

      const response: InterruptResponseMessage = {
        type: 'interruptResponse',
        interruptId: 'int-003',
        response: true,
        timestamp: Date.now(),
      }

      await handler.handleResponse(response)

      const result = await resultPromise
      expect(result.response).toBe(true)
    })
  })

  describe('Timeout Handling', () => {
    it('should timeout interrupt after specified duration', async () => {
      const interrupt: AgentInterruptMessage = {
        type: 'agentInterrupt',
        interruptId: 'int-timeout-001',
        reason: 'confirmation',
        prompt: 'Quick question?',
        timeout: 5000,
        timestamp: Date.now(),
      }

      const resultPromise = handler.waitForResponse('int-timeout-001')
      await handler.handleInterrupt(interrupt)

      // Fast-forward time by 5 seconds
      vi.advanceTimersByTime(5000)

      const result = await resultPromise
      expect(result.cancelled).toBe(true)
      expect(result.reason).toBe('timeout')
    })

    it('should not timeout if response received before timeout', async () => {
      const interrupt: AgentInterruptMessage = {
        type: 'agentInterrupt',
        interruptId: 'int-timeout-002',
        reason: 'input',
        prompt: 'Enter value',
        timeout: 10000,
        timestamp: Date.now(),
      }

      const resultPromise = handler.waitForResponse('int-timeout-002')
      await handler.handleInterrupt(interrupt)

      // Fast-forward time by 3 seconds (before timeout)
      vi.advanceTimersByTime(3000)

      const response: InterruptResponseMessage = {
        type: 'interruptResponse',
        interruptId: 'int-timeout-002',
        response: 'test value',
        timestamp: Date.now(),
      }

      await handler.handleResponse(response)

      const result = await resultPromise
      expect(result.response).toBe('test value')
      expect(result.cancelled).toBeUndefined()
    })

    it('should handle interrupts without timeout', async () => {
      const interrupt: AgentInterruptMessage = {
        type: 'agentInterrupt',
        interruptId: 'int-no-timeout',
        reason: 'review',
        prompt: 'Review changes',
        timestamp: Date.now(),
      }

      await handler.handleInterrupt(interrupt)

      // Fast-forward time significantly
      vi.advanceTimersByTime(60000)

      const pending = handler.getPendingInterrupts()
      expect(pending).toHaveLength(1)
      expect(pending[0]?.interruptId).toBe('int-no-timeout')
    })

    it('should cancel timeout when interrupt is cancelled manually', async () => {
      const interrupt: AgentInterruptMessage = {
        type: 'agentInterrupt',
        interruptId: 'int-cancel',
        reason: 'confirmation',
        prompt: 'Proceed?',
        timeout: 10000,
        timestamp: Date.now(),
      }

      const resultPromise = handler.waitForResponse('int-cancel')
      await handler.handleInterrupt(interrupt)

      // Cancel after 2 seconds
      vi.advanceTimersByTime(2000)
      await handler.cancelInterrupt('int-cancel')

      const result = await resultPromise
      expect(result.cancelled).toBe(true)
      expect(result.reason).toBe('cancelled')
    })
  })

  describe('Queue Management', () => {
    it('should queue multiple interrupts', async () => {
      const interrupt1: AgentInterruptMessage = {
        type: 'agentInterrupt',
        interruptId: 'int-queue-001',
        reason: 'confirmation',
        prompt: 'First question?',
        timestamp: Date.now(),
      }

      const interrupt2: AgentInterruptMessage = {
        type: 'agentInterrupt',
        interruptId: 'int-queue-002',
        reason: 'choice',
        prompt: 'Second question?',
        timestamp: Date.now() + 1,
      }

      await handler.handleInterrupt(interrupt1)
      await handler.handleInterrupt(interrupt2)

      const pending = handler.getPendingInterrupts()
      expect(pending).toHaveLength(2)
      expect(pending[0]?.interruptId).toBe('int-queue-001')
      expect(pending[1]?.interruptId).toBe('int-queue-002')
    })

    it('should process interrupts in FIFO order', async () => {
      const interrupts: AgentInterruptMessage[] = [
        {
          type: 'agentInterrupt',
          interruptId: 'int-order-001',
          reason: 'confirmation',
          prompt: 'First',
          timestamp: 1000,
        },
        {
          type: 'agentInterrupt',
          interruptId: 'int-order-002',
          reason: 'confirmation',
          prompt: 'Second',
          timestamp: 2000,
        },
        {
          type: 'agentInterrupt',
          interruptId: 'int-order-003',
          reason: 'confirmation',
          prompt: 'Third',
          timestamp: 3000,
        },
      ]

      for (const interrupt of interrupts) {
        await handler.handleInterrupt(interrupt)
      }

      const pending = handler.getPendingInterrupts()
      expect(pending[0]?.interruptId).toBe('int-order-001')
      expect(pending[1]?.interruptId).toBe('int-order-002')
      expect(pending[2]?.interruptId).toBe('int-order-003')
    })

    it('should remove interrupt from queue after response', async () => {
      const interrupt1: AgentInterruptMessage = {
        type: 'agentInterrupt',
        interruptId: 'int-remove-001',
        reason: 'confirmation',
        prompt: 'First',
        timestamp: Date.now(),
      }

      const interrupt2: AgentInterruptMessage = {
        type: 'agentInterrupt',
        interruptId: 'int-remove-002',
        reason: 'confirmation',
        prompt: 'Second',
        timestamp: Date.now() + 1,
      }

      await handler.handleInterrupt(interrupt1)
      await handler.handleInterrupt(interrupt2)

      // Respond to first interrupt
      await handler.handleResponse({
        type: 'interruptResponse',
        interruptId: 'int-remove-001',
        response: true,
        timestamp: Date.now(),
      })

      const pending = handler.getPendingInterrupts()
      expect(pending).toHaveLength(1)
      expect(pending[0]?.interruptId).toBe('int-remove-002')
    })

    it('should get interrupt by ID', () => {
      const interrupt: AgentInterruptMessage = {
        type: 'agentInterrupt',
        interruptId: 'int-get-001',
        reason: 'input',
        prompt: 'Enter value',
        timestamp: Date.now(),
      }

      handler.handleInterrupt(interrupt)

      const retrieved = handler.getInterruptById('int-get-001')
      expect(retrieved).toBeDefined()
      expect(retrieved?.interruptId).toBe('int-get-001')
    })

    it('should return undefined for non-existent interrupt', () => {
      const retrieved = handler.getInterruptById('non-existent')
      expect(retrieved).toBeUndefined()
    })
  })

  describe('State Persistence', () => {
    it('should persist pending interrupts to storage', async () => {
      const interrupt: AgentInterruptMessage = {
        type: 'agentInterrupt',
        interruptId: 'int-persist-001',
        reason: 'confirmation',
        prompt: 'Save this?',
        timeout: 30000,
        timestamp: Date.now(),
      }

      await handler.handleInterrupt(interrupt)

      // Check if stored
      const stored = await storage.get('hitl:interrupts')
      expect(stored).toBeDefined()
      expect(Array.isArray(stored)).toBe(true)
    })

    it('should restore interrupts from storage on initialization', async () => {
      const interrupts: AgentInterruptMessage[] = [
        {
          type: 'agentInterrupt',
          interruptId: 'int-restore-001',
          reason: 'confirmation',
          prompt: 'Restored 1',
          timestamp: Date.now(),
        },
        {
          type: 'agentInterrupt',
          interruptId: 'int-restore-002',
          reason: 'choice',
          prompt: 'Restored 2',
          timestamp: Date.now() + 1,
        },
      ]

      // Store interrupts
      await storage.set('hitl:interrupts', interrupts)

      // Create new handler instance (should restore)
      const newHandler = new HumanInTheLoopHandler()
      await newHandler.init()

      const pending = newHandler.getPendingInterrupts()
      expect(pending).toHaveLength(2)
      expect(pending[0]?.interruptId).toBe('int-restore-001')

      newHandler.destroy()
    })

    it('should clear storage when all interrupts are resolved', async () => {
      const interrupt: AgentInterruptMessage = {
        type: 'agentInterrupt',
        interruptId: 'int-clear-001',
        reason: 'confirmation',
        prompt: 'Last one?',
        timestamp: Date.now(),
      }

      await handler.handleInterrupt(interrupt)

      await handler.handleResponse({
        type: 'interruptResponse',
        interruptId: 'int-clear-001',
        response: true,
        timestamp: Date.now(),
      })

      const stored = await storage.get('hitl:interrupts')
      expect(stored).toEqual([])
    })
  })

  describe('Event Handling', () => {
    it('should emit event when interrupt is added', async () => {
      const listener = vi.fn()
      handler.on('interrupt-added', listener)

      const interrupt: AgentInterruptMessage = {
        type: 'agentInterrupt',
        interruptId: 'int-event-001',
        reason: 'confirmation',
        prompt: 'Event test?',
        timestamp: Date.now(),
      }

      await handler.handleInterrupt(interrupt)

      expect(listener).toHaveBeenCalledWith(interrupt)
    })

    it('should emit event when interrupt is resolved', async () => {
      const listener = vi.fn()
      handler.on('interrupt-resolved', listener)

      const interrupt: AgentInterruptMessage = {
        type: 'agentInterrupt',
        interruptId: 'int-event-002',
        reason: 'confirmation',
        prompt: 'Event test?',
        timestamp: Date.now(),
      }

      await handler.handleInterrupt(interrupt)

      const response: InterruptResponseMessage = {
        type: 'interruptResponse',
        interruptId: 'int-event-002',
        response: true,
        timestamp: Date.now(),
      }

      await handler.handleResponse(response)

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          interruptId: 'int-event-002',
          response: true,
        })
      )
    })

    it('should emit event when interrupt times out', async () => {
      const listener = vi.fn()
      handler.on('interrupt-timeout', listener)

      const interrupt: AgentInterruptMessage = {
        type: 'agentInterrupt',
        interruptId: 'int-timeout-event',
        reason: 'confirmation',
        prompt: 'Timeout test?',
        timeout: 5000,
        timestamp: Date.now(),
      }

      await handler.handleInterrupt(interrupt)
      vi.advanceTimersByTime(5000)

      expect(listener).toHaveBeenCalledWith('int-timeout-event')
    })

    it('should remove event listener', async () => {
      const listener = vi.fn()
      handler.on('interrupt-added', listener)
      handler.off('interrupt-added', listener)

      const interrupt: AgentInterruptMessage = {
        type: 'agentInterrupt',
        interruptId: 'int-event-003',
        reason: 'confirmation',
        prompt: 'Removed listener?',
        timestamp: Date.now(),
      }

      await handler.handleInterrupt(interrupt)

      expect(listener).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle duplicate interrupt IDs', async () => {
      const interrupt1: AgentInterruptMessage = {
        type: 'agentInterrupt',
        interruptId: 'int-duplicate',
        reason: 'confirmation',
        prompt: 'First',
        timestamp: Date.now(),
      }

      const interrupt2: AgentInterruptMessage = {
        type: 'agentInterrupt',
        interruptId: 'int-duplicate',
        reason: 'confirmation',
        prompt: 'Second (duplicate ID)',
        timestamp: Date.now() + 1,
      }

      await handler.handleInterrupt(interrupt1)
      await expect(handler.handleInterrupt(interrupt2)).rejects.toThrow(
        'Interrupt with ID int-duplicate already exists'
      )
    })

    it('should handle response to non-existent interrupt', async () => {
      const response: InterruptResponseMessage = {
        type: 'interruptResponse',
        interruptId: 'non-existent',
        response: true,
        timestamp: Date.now(),
      }

      await expect(handler.handleResponse(response)).rejects.toThrow(
        'Interrupt with ID non-existent not found'
      )
    })

    it('should handle storage errors gracefully', async () => {
      const mockStorage = {
        get: vi.fn().mockRejectedValue(new Error('Storage error')),
        set: vi.fn().mockRejectedValue(new Error('Storage error')),
        remove: vi.fn(),
      }

      const handlerWithMockStorage = new HumanInTheLoopHandler()
      // Handler should not throw even if storage fails
      expect(async () => {
        await handlerWithMockStorage.init()
      }).not.toThrow()

      handlerWithMockStorage.destroy()
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero timeout', async () => {
      const interrupt: AgentInterruptMessage = {
        type: 'agentInterrupt',
        interruptId: 'int-zero-timeout',
        reason: 'confirmation',
        prompt: 'Instant timeout?',
        timeout: 0,
        timestamp: Date.now(),
      }

      const resultPromise = handler.waitForResponse('int-zero-timeout')
      await handler.handleInterrupt(interrupt)

      vi.advanceTimersByTime(0)

      const result = await resultPromise
      expect(result.cancelled).toBe(true)
    })

    it('should handle very large timeouts', async () => {
      const interrupt: AgentInterruptMessage = {
        type: 'agentInterrupt',
        interruptId: 'int-large-timeout',
        reason: 'confirmation',
        prompt: 'Long timeout?',
        timeout: Number.MAX_SAFE_INTEGER,
        timestamp: Date.now(),
      }

      await handler.handleInterrupt(interrupt)

      // Should not timeout even after reasonable time
      vi.advanceTimersByTime(60000)

      const pending = handler.getPendingInterrupts()
      expect(pending).toHaveLength(1)
    })

    it('should handle empty interrupt queue operations', () => {
      const pending = handler.getPendingInterrupts()
      expect(pending).toEqual([])

      const retrieved = handler.getInterruptById('any-id')
      expect(retrieved).toBeUndefined()
    })

    it('should handle rapid interrupt creation', async () => {
      const promises = []
      for (let i = 0; i < 100; i++) {
        const interrupt: AgentInterruptMessage = {
          type: 'agentInterrupt',
          interruptId: `int-rapid-${i}`,
          reason: 'confirmation',
          prompt: `Rapid ${i}`,
          timestamp: Date.now() + i,
        }
        promises.push(handler.handleInterrupt(interrupt))
      }

      await Promise.all(promises)

      const pending = handler.getPendingInterrupts()
      expect(pending).toHaveLength(100)
    })

    it('should cleanup all timers on destroy', async () => {
      const interrupts = []
      for (let i = 0; i < 10; i++) {
        interrupts.push({
          type: 'agentInterrupt' as const,
          interruptId: `int-cleanup-${i}`,
          reason: 'confirmation' as const,
          prompt: `Cleanup ${i}`,
          timeout: 10000,
          timestamp: Date.now() + i,
        })
      }

      for (const interrupt of interrupts) {
        await handler.handleInterrupt(interrupt)
      }

      handler.destroy()

      // Verify no timers remain
      const timerCount = vi.getTimerCount()
      expect(timerCount).toBe(0)
    })
  })
})
