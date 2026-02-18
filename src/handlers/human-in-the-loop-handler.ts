/**
 * Human-in-the-Loop (HITL) Handler (Issue #88)
 * Manages interrupt workflows with timeout, queue management, and state persistence
 */

import type {
  AgentInterruptMessage,
  InterruptResponseMessage,
} from '../types/interrupt-messages.js'
import { storage } from '../offline/storage.js'

/**
 * Pending interrupt with timeout info
 */
interface PendingInterrupt {
  interrupt: AgentInterruptMessage
  timeoutId?: NodeJS.Timeout
  resolver?: (response: InterruptResponseMessage) => void
  rejector?: (error: Error) => void
}

/**
 * Event types for the handler
 */
type HITLEventType = 'interrupt-added' | 'interrupt-resolved' | 'interrupt-timeout'

type EventListener = (...args: unknown[]) => void

/**
 * Human-in-the-Loop Handler
 * Manages interrupts with timeout, queueing, and persistence
 */
export class HumanInTheLoopHandler {
  private interrupts: Map<string, PendingInterrupt> = new Map()
  private listeners: Map<HITLEventType, Set<EventListener>> = new Map()
  private storageKey = 'hitl:interrupts'

  constructor() {
    // Initialize event listener maps
    this.listeners.set('interrupt-added', new Set())
    this.listeners.set('interrupt-resolved', new Set())
    this.listeners.set('interrupt-timeout', new Set())
  }

  /**
   * Initialize handler and restore state from storage
   */
  async init(): Promise<void> {
    try {
      const storedItem = await storage.get<AgentInterruptMessage[]>(this.storageKey)
      if (storedItem && Array.isArray(storedItem.data)) {
        for (const interrupt of storedItem.data) {
          // Restore interrupts without triggering events
          await this.handleInterrupt(interrupt, { skipPersist: true, skipEvent: true })
        }
      }
    } catch (error) {
      // Gracefully handle storage errors
      console.warn('Failed to restore interrupts from storage:', error)
    }
  }

  /**
   * Handle incoming interrupt message
   */
  async handleInterrupt(
    interrupt: AgentInterruptMessage,
    options: { skipPersist?: boolean; skipEvent?: boolean } = {}
  ): Promise<void> {
    // Check for duplicate interrupt (not placeholder)
    const existing = this.interrupts.get(interrupt.interruptId)
    if (existing && existing.interrupt) {
      throw new Error(`Interrupt with ID ${interrupt.interruptId} already exists`)
    }

    // Create or update pending interrupt
    const pending: PendingInterrupt = {
      interrupt,
      // Preserve resolver/rejector if they exist from waitForResponse
      resolver: existing?.resolver,
      rejector: existing?.rejector,
    }

    // Set up timeout if specified
    if (interrupt.timeout !== undefined) {
      pending.timeoutId = setTimeout(() => {
        this.handleTimeout(interrupt.interruptId)
      }, interrupt.timeout)
    }

    // Store interrupt
    this.interrupts.set(interrupt.interruptId, pending)

    // Persist to storage
    if (!options.skipPersist) {
      await this.persistState()
    }

    // Emit event
    if (!options.skipEvent) {
      this.emit('interrupt-added', interrupt)
    }
  }

  /**
   * Handle interrupt response
   */
  async handleResponse(response: InterruptResponseMessage): Promise<void> {
    const pending = this.interrupts.get(response.interruptId)

    if (!pending) {
      throw new Error(`Interrupt with ID ${response.interruptId} not found`)
    }

    // Clear timeout if exists
    if (pending.timeoutId) {
      clearTimeout(pending.timeoutId)
    }

    // Resolve promise if waiting
    if (pending.resolver) {
      pending.resolver(response)
    }

    // Remove from queue
    this.interrupts.delete(response.interruptId)

    // Persist state
    await this.persistState()

    // Emit event
    this.emit('interrupt-resolved', response)
  }

  /**
   * Wait for response to a specific interrupt
   */
  waitForResponse(interruptId: string): Promise<InterruptResponseMessage> {
    return new Promise((resolve, reject) => {
      // Check if interrupt already exists
      const existing = this.interrupts.get(interruptId)
      if (existing && existing.interrupt) {
        existing.resolver = resolve
        existing.rejector = reject
      } else {
        // Store resolver for when interrupt arrives
        const placeholder: Partial<PendingInterrupt> = {
          resolver: resolve,
          rejector: reject,
        }
        this.interrupts.set(interruptId, placeholder as PendingInterrupt)
      }
    })
  }

  /**
   * Cancel an interrupt manually
   */
  async cancelInterrupt(interruptId: string): Promise<void> {
    const pending = this.interrupts.get(interruptId)

    if (!pending) {
      return
    }

    // Clear timeout
    if (pending.timeoutId) {
      clearTimeout(pending.timeoutId)
    }

    // Create cancellation response
    const response: InterruptResponseMessage = {
      type: 'interruptResponse',
      interruptId,
      response: null,
      cancelled: true,
      reason: 'cancelled',
      timestamp: Date.now(),
    }

    // Resolve promise
    if (pending.resolver) {
      pending.resolver(response)
    }

    // Remove from queue
    this.interrupts.delete(interruptId)

    // Persist state
    await this.persistState()
  }

  /**
   * Handle timeout for an interrupt
   */
  private async handleTimeout(interruptId: string): Promise<void> {
    const pending = this.interrupts.get(interruptId)

    if (!pending) {
      return
    }

    // Create timeout response
    const response: InterruptResponseMessage = {
      type: 'interruptResponse',
      interruptId,
      response: null,
      cancelled: true,
      reason: 'timeout',
      timestamp: Date.now(),
    }

    // Resolve promise
    if (pending.resolver) {
      pending.resolver(response)
    }

    // Remove from queue
    this.interrupts.delete(interruptId)

    // Persist state
    await this.persistState()

    // Emit event
    this.emit('interrupt-timeout', interruptId)
  }

  /**
   * Get all pending interrupts
   */
  getPendingInterrupts(): AgentInterruptMessage[] {
    return Array.from(this.interrupts.values())
      .map((pending) => pending.interrupt)
      .filter((interrupt) => interrupt !== null)
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
  }

  /**
   * Get interrupt by ID
   */
  getInterruptById(interruptId: string): AgentInterruptMessage | undefined {
    const pending = this.interrupts.get(interruptId)
    return pending?.interrupt
  }

  /**
   * Persist current state to storage
   */
  private async persistState(): Promise<void> {
    try {
      const interrupts = this.getPendingInterrupts()
      await storage.set(this.storageKey, interrupts)
    } catch (error) {
      console.warn('Failed to persist interrupts to storage:', error)
    }
  }

  /**
   * Add event listener
   */
  on(event: HITLEventType, listener: EventListener): void {
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.add(listener)
    }
  }

  /**
   * Remove event listener
   */
  off(event: HITLEventType, listener: EventListener): void {
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.delete(listener)
    }
  }

  /**
   * Emit event
   */
  private emit(event: HITLEventType, ...args: unknown[]): void {
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(...args)
        } catch (error) {
          console.error(`Error in ${event} listener:`, error)
        }
      })
    }
  }

  /**
   * Destroy handler and cleanup resources
   */
  destroy(): void {
    // Clear all timeouts
    for (const pending of this.interrupts.values()) {
      if (pending.timeoutId) {
        clearTimeout(pending.timeoutId)
      }
    }

    // Clear all interrupts
    this.interrupts.clear()

    // Clear all listeners
    for (const listeners of this.listeners.values()) {
      listeners.clear()
    }
  }
}

/**
 * Default singleton instance
 */
export const humanInTheLoopHandler = new HumanInTheLoopHandler()
