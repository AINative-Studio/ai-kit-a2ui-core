/**
 * MessageCapture utility for capturing and managing A2UI messages
 */

import type { CapturedMessage, MessageFilter } from '../types/index.js'

export interface MessageStatistics {
  total: number
  sent: number
  received: number
  byType: Record<string, number>
}

export class MessageCapture {
  private messages: CapturedMessage[] = []
  private maxMessages = 10000

  /**
   * Capture a message with metadata
   */
  captureMessage(message: unknown, direction: 'sent' | 'received'): CapturedMessage {
    const captured: CapturedMessage = {
      id: this.generateId(),
      timestamp: Date.now(),
      direction,
      message,
      messageType: this.extractMessageType(message)
    }

    this.messages.push(captured)

    // Enforce max messages limit
    if (this.messages.length > this.maxMessages) {
      this.messages.shift()
    }

    return captured
  }

  /**
   * Get all captured messages
   */
  getMessages(): CapturedMessage[] {
    return [...this.messages]
  }

  /**
   * Filter messages based on criteria
   */
  filterMessages(filter: MessageFilter): CapturedMessage[] {
    let filtered = [...this.messages]

    // Filter by message types
    if (filter.messageTypes && filter.messageTypes.length > 0) {
      filtered = filtered.filter(msg =>
        filter.messageTypes!.includes(msg.messageType)
      )
    }

    // Filter by direction
    if (filter.direction) {
      filtered = filtered.filter(msg => msg.direction === filter.direction)
    }

    // Filter by time range
    if (filter.startTime !== undefined) {
      filtered = filtered.filter(msg => msg.timestamp >= filter.startTime!)
    }

    if (filter.endTime !== undefined) {
      filtered = filtered.filter(msg => msg.timestamp <= filter.endTime!)
    }

    // Filter by search term
    if (filter.searchTerm) {
      const searchLower = filter.searchTerm.toLowerCase()
      filtered = filtered.filter(msg => {
        const messageStr = JSON.stringify(msg.message).toLowerCase()
        return messageStr.includes(searchLower)
      })
    }

    return filtered
  }

  /**
   * Clear all captured messages
   */
  clearMessages(): void {
    this.messages = []
  }

  /**
   * Get message by ID
   */
  getMessageById(id: string): CapturedMessage | undefined {
    return this.messages.find(msg => msg.id === id)
  }

  /**
   * Get statistics about captured messages
   */
  getStatistics(): MessageStatistics {
    const stats: MessageStatistics = {
      total: this.messages.length,
      sent: 0,
      received: 0,
      byType: {}
    }

    for (const msg of this.messages) {
      // Count by direction
      if (msg.direction === 'sent') {
        stats.sent++
      } else {
        stats.received++
      }

      // Count by type
      const type = msg.messageType
      stats.byType[type] = (stats.byType[type] ?? 0) + 1
    }

    return stats
  }

  /**
   * Set maximum number of messages to store
   */
  setMaxMessages(max: number): void {
    this.maxMessages = max

    // Trim existing messages if needed
    if (this.messages.length > max) {
      this.messages = this.messages.slice(-max)
    }
  }

  /**
   * Generate unique message ID
   */
  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Extract message type from message object
   */
  private extractMessageType(message: unknown): string {
    if (
      message &&
      typeof message === 'object' &&
      'type' in message &&
      typeof message.type === 'string'
    ) {
      return message.type
    }
    return 'unknown'
  }
}
