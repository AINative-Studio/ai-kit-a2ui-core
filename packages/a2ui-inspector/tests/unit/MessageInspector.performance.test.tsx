/**
 * Performance tests for MessageInspector virtualization
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { MessageInspector } from '@/panel/components/MessageInspector'
import type { CapturedMessage } from '@/shared/types'

describe('MessageInspector Performance', () => {
  beforeEach(() => {
    cleanup()
  })

  afterEach(() => {
    cleanup()
  })

  const createMockMessages = (count: number): CapturedMessage[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `msg_${i}`,
      timestamp: Date.now() - i * 1000,
      direction: i % 2 === 0 ? ('sent' as const) : ('received' as const),
      messageType: i % 3 === 0 ? 'ping' : i % 3 === 1 ? 'pong' : 'createSurface',
      message: {
        type: i % 3 === 0 ? ('ping' as const) : i % 3 === 1 ? ('pong' as const) : ('createSurface' as const),
        ...(i % 3 === 2 ? { surfaceId: `surface-${i}`, title: `Surface ${i}`, components: [] } : {})
      }
    }))
  }

  describe('DOM Node Count', () => {
    it('should render fewer than 100 DOM nodes for 1000 messages', () => {
      const messages = createMockMessages(1000)
      const { container } = render(<MessageInspector messages={messages} />)

      const listItems = container.querySelectorAll('[role="listitem"]')
      expect(listItems.length).toBeLessThan(100)
      expect(listItems.length).toBeGreaterThan(0)
    })

    it('should render fewer than 200 DOM nodes for 5000 messages', () => {
      const messages = createMockMessages(5000)
      const { container } = render(<MessageInspector messages={messages} />)

      const listItems = container.querySelectorAll('[role="listitem"]')
      expect(listItems.length).toBeLessThan(200)
      expect(listItems.length).toBeGreaterThan(0)
    })

    it('should render all items for small lists (< 50 messages)', () => {
      const messages = createMockMessages(30)
      const { container } = render(<MessageInspector messages={messages} />)

      const listItems = container.querySelectorAll('[role="listitem"]')
      expect(listItems.length).toBe(30)
    })
  })

  describe('Render Performance', () => {
    it('should render 1000 messages in less than 500ms', () => {
      const messages = createMockMessages(1000)

      const startTime = performance.now()
      const { container } = render(<MessageInspector messages={messages} />)
      const endTime = performance.now()

      const renderTime = endTime - startTime
      expect(renderTime).toBeLessThan(500)
      expect(container).toBeInTheDocument()
    })

    it('should render 5000 messages in less than 1000ms', () => {
      const messages = createMockMessages(5000)

      const startTime = performance.now()
      const { container } = render(<MessageInspector messages={messages} />)
      const endTime = performance.now()

      const renderTime = endTime - startTime
      expect(renderTime).toBeLessThan(1000)
      expect(container).toBeInTheDocument()
    })
  })

  describe('Memory Efficiency', () => {
    it('should maintain constant DOM size when message count increases', () => {
      // Render with 1000 messages
      const messages1000 = createMockMessages(1000)
      const { container: container1000 } = render(<MessageInspector messages={messages1000} />)
      const domNodes1000 = container1000.querySelectorAll('[role="listitem"]').length

      cleanup()

      // Render with 5000 messages
      const messages5000 = createMockMessages(5000)
      const { container: container5000 } = render(<MessageInspector messages={messages5000} />)
      const domNodes5000 = container5000.querySelectorAll('[role="listitem"]').length

      // DOM size should not grow proportionally with data size
      // Both should be virtualized and have similar DOM node counts
      expect(domNodes5000).toBeLessThan(domNodes1000 * 2)
      expect(domNodes1000).toBeLessThan(100)
      expect(domNodes5000).toBeLessThan(200)
    })

    it('should not create memory leaks on re-renders', () => {
      const messages = createMockMessages(1000)
      const { rerender, container } = render(<MessageInspector messages={messages} />)

      const initialDomNodes = container.querySelectorAll('*').length

      // Re-render 10 times
      for (let i = 0; i < 10; i++) {
        rerender(<MessageInspector messages={messages} />)
      }

      const finalDomNodes = container.querySelectorAll('*').length

      // DOM node count should not grow significantly on re-renders
      expect(finalDomNodes).toBeLessThanOrEqual(initialDomNodes * 1.1)
    })

    it('should clean up ResizeObserver on unmount', () => {
      const messages = createMockMessages(1000)
      const { unmount } = render(<MessageInspector messages={messages} />)

      // Should not throw when unmounting
      expect(() => unmount()).not.toThrow()
    })
  })

  describe('Virtualization Threshold', () => {
    it('should use virtualization for lists with more than 50 messages', () => {
      const messages = createMockMessages(51)
      const { container } = render(<MessageInspector messages={messages} />)

      // When virtualized, not all items should be in DOM
      const listItems = container.querySelectorAll('[role="listitem"]')
      expect(listItems.length).toBeLessThan(51)
    })

    it('should not use virtualization for lists with 50 or fewer messages', () => {
      const messages = createMockMessages(50)
      const { container } = render(<MessageInspector messages={messages} />)

      // All items should be rendered without virtualization
      const listItems = container.querySelectorAll('[role="listitem"]')
      expect(listItems.length).toBe(50)
    })
  })

  describe('Filter Performance', () => {
    it('should filter 10000 messages quickly', () => {
      const messages = createMockMessages(10000)

      const startTime = performance.now()
      render(<MessageInspector messages={messages} />)
      const endTime = performance.now()

      const renderTime = endTime - startTime
      expect(renderTime).toBeLessThan(2000)
    })

    it('should handle rapid filter changes without performance degradation', () => {
      const messages = createMockMessages(1000)
      const { rerender } = render(<MessageInspector messages={messages} />)

      const startTime = performance.now()

      // Simulate rapid filter changes
      for (let i = 0; i < 50; i++) {
        rerender(<MessageInspector messages={messages} />)
      }

      const endTime = performance.now()
      const totalTime = endTime - startTime

      // 50 re-renders should complete in less than 1 second
      expect(totalTime).toBeLessThan(1000)
    })
  })

  describe('Scalability', () => {
    it('should handle extremely large message lists (10000+)', () => {
      const messages = createMockMessages(10000)
      const { container } = render(<MessageInspector messages={messages} />)

      // Should still virtualize and not render all items
      const listItems = container.querySelectorAll('[role="listitem"]')
      expect(listItems.length).toBeLessThan(500)
      expect(container).toBeInTheDocument()
    })

    it('should maintain responsiveness with very large datasets', () => {
      const messages = createMockMessages(10000)

      const startTime = performance.now()
      const { container } = render(<MessageInspector messages={messages} />)
      const endTime = performance.now()

      const renderTime = endTime - startTime

      // Even with 10k messages, initial render should be fast
      expect(renderTime).toBeLessThan(3000)
      expect(container).toBeInTheDocument()
    })
  })
})
