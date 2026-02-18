/**
 * Tests for MessageCapture utility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MessageCapture } from '@/shared/utils/MessageCapture'
import type { A2UIMessageEvent, MessageFilter } from '@/shared/types'

describe('MessageCapture', () => {
  let capture: MessageCapture

  beforeEach(() => {
    capture = new MessageCapture()
  })

  describe('captureMessage', () => {
    it('should capture a message with unique ID', () => {
      const message = {
        type: 'createSurface' as const,
        surfaceId: 'test-surface',
        title: 'Test',
        components: []
      }

      const captured = capture.captureMessage(message, 'sent')

      expect(captured.id).toBeDefined()
      expect(captured.direction).toBe('sent')
      expect(captured.message).toEqual(message)
      expect(captured.messageType).toBe('createSurface')
      expect(captured.timestamp).toBeGreaterThan(0)
    })

    it('should store captured messages', () => {
      const message = {
        type: 'updateComponents' as const,
        surfaceId: 'test-surface',
        updates: []
      }

      capture.captureMessage(message, 'received')
      const messages = capture.getMessages()

      expect(messages).toHaveLength(1)
      expect(messages[0]?.message).toEqual(message)
    })

    it('should generate unique IDs for each message', () => {
      const msg1 = { type: 'ping' as const }
      const msg2 = { type: 'pong' as const }

      const captured1 = capture.captureMessage(msg1, 'sent')
      const captured2 = capture.captureMessage(msg2, 'received')

      expect(captured1.id).not.toBe(captured2.id)
    })

    it('should extract message type from message object', () => {
      const message = {
        type: 'userAction' as const,
        surfaceId: 'test',
        componentId: 'btn',
        action: 'click'
      }

      const captured = capture.captureMessage(message, 'sent')

      expect(captured.messageType).toBe('userAction')
    })
  })

  describe('getMessages', () => {
    it('should return empty array initially', () => {
      const messages = capture.getMessages()
      expect(messages).toEqual([])
    })

    it('should return all captured messages', () => {
      capture.captureMessage({ type: 'ping' as const }, 'sent')
      capture.captureMessage({ type: 'pong' as const }, 'received')

      const messages = capture.getMessages()
      expect(messages).toHaveLength(2)
    })

    it('should return messages in chronological order', () => {
      const msg1 = capture.captureMessage({ type: 'ping' as const }, 'sent')
      const msg2 = capture.captureMessage({ type: 'pong' as const }, 'received')

      const messages = capture.getMessages()
      expect(messages[0]?.timestamp).toBeLessThanOrEqual(messages[1]!.timestamp)
    })
  })

  describe('filterMessages', () => {
    beforeEach(() => {
      capture.captureMessage({ type: 'ping' as const }, 'sent')
      capture.captureMessage({ type: 'pong' as const }, 'received')
      capture.captureMessage({ type: 'createSurface' as const, surfaceId: 'test', title: 'Test', components: [] }, 'sent')
    })

    it('should filter by message type', () => {
      const filter: MessageFilter = {
        messageTypes: ['ping']
      }

      const filtered = capture.filterMessages(filter)
      expect(filtered).toHaveLength(1)
      expect(filtered[0]?.messageType).toBe('ping')
    })

    it('should filter by direction', () => {
      const filter: MessageFilter = {
        direction: 'sent'
      }

      const filtered = capture.filterMessages(filter)
      expect(filtered).toHaveLength(2)
      filtered.forEach(msg => {
        expect(msg.direction).toBe('sent')
      })
    })

    it('should filter by time range', () => {
      const now = Date.now()
      const filter: MessageFilter = {
        startTime: now - 1000,
        endTime: now + 1000
      }

      const filtered = capture.filterMessages(filter)
      filtered.forEach(msg => {
        expect(msg.timestamp).toBeGreaterThanOrEqual(now - 1000)
        expect(msg.timestamp).toBeLessThanOrEqual(now + 1000)
      })
    })

    it('should filter by search term in message content', () => {
      const filter: MessageFilter = {
        searchTerm: 'test-surface'
      }

      const filtered = capture.filterMessages(filter)
      expect(filtered.length).toBeGreaterThan(0)
    })

    it('should combine multiple filters', () => {
      const filter: MessageFilter = {
        messageTypes: ['ping', 'pong'],
        direction: 'sent'
      }

      const filtered = capture.filterMessages(filter)
      expect(filtered).toHaveLength(1)
      expect(filtered[0]?.messageType).toBe('ping')
      expect(filtered[0]?.direction).toBe('sent')
    })
  })

  describe('clearMessages', () => {
    it('should remove all messages', () => {
      capture.captureMessage({ type: 'ping' as const }, 'sent')
      capture.captureMessage({ type: 'pong' as const }, 'received')

      expect(capture.getMessages()).toHaveLength(2)

      capture.clearMessages()
      expect(capture.getMessages()).toHaveLength(0)
    })
  })

  describe('getMessageById', () => {
    it('should return message by ID', () => {
      const captured = capture.captureMessage({ type: 'ping' as const }, 'sent')
      const found = capture.getMessageById(captured.id)

      expect(found).toEqual(captured)
    })

    it('should return undefined for non-existent ID', () => {
      const found = capture.getMessageById('non-existent')
      expect(found).toBeUndefined()
    })
  })

  describe('getStatistics', () => {
    beforeEach(() => {
      capture.captureMessage({ type: 'ping' as const }, 'sent')
      capture.captureMessage({ type: 'pong' as const }, 'received')
      capture.captureMessage({ type: 'ping' as const }, 'sent')
    })

    it('should return total message count', () => {
      const stats = capture.getStatistics()
      expect(stats.total).toBe(3)
    })

    it('should count messages by direction', () => {
      const stats = capture.getStatistics()
      expect(stats.sent).toBe(2)
      expect(stats.received).toBe(1)
    })

    it('should count messages by type', () => {
      const stats = capture.getStatistics()
      expect(stats.byType.ping).toBe(2)
      expect(stats.byType.pong).toBe(1)
    })
  })

  describe('setMaxMessages', () => {
    it('should limit stored messages to max count', () => {
      capture.setMaxMessages(2)

      capture.captureMessage({ type: 'ping' as const }, 'sent')
      capture.captureMessage({ type: 'pong' as const }, 'received')
      capture.captureMessage({ type: 'ping' as const }, 'sent')

      expect(capture.getMessages()).toHaveLength(2)
    })

    it('should keep most recent messages when limit reached', () => {
      capture.setMaxMessages(2)

      const msg1 = capture.captureMessage({ type: 'ping' as const }, 'sent')
      const msg2 = capture.captureMessage({ type: 'pong' as const }, 'received')
      const msg3 = capture.captureMessage({ type: 'ping' as const }, 'sent')

      const messages = capture.getMessages()
      expect(messages).toHaveLength(2)
      expect(messages[0]?.id).toBe(msg2.id)
      expect(messages[1]?.id).toBe(msg3.id)
    })
  })
})
