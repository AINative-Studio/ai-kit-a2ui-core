/**
 * Tests for MessageInspector component
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MessageInspector } from '@/panel/components/MessageInspector'
import type { CapturedMessage } from '@/shared/types'

describe('MessageInspector', () => {
  const mockMessages: CapturedMessage[] = [
    {
      id: 'msg_1',
      timestamp: Date.now() - 2000,
      direction: 'sent',
      messageType: 'createSurface',
      message: {
        type: 'createSurface',
        surfaceId: 'surface-1',
        title: 'Test Surface',
        components: []
      }
    },
    {
      id: 'msg_2',
      timestamp: Date.now() - 1000,
      direction: 'received',
      messageType: 'pong',
      message: {
        type: 'pong'
      }
    }
  ]

  describe('rendering', () => {
    it('should render message list', () => {
      const { container } = render(<MessageInspector messages={mockMessages} />)

      const messageList = container.querySelector('[role="list"][aria-label="Message list"]')
      expect(messageList).toBeInTheDocument()

      const items = container.querySelectorAll('[role="listitem"]')
      expect(items.length).toBe(2)

      expect(within(messageList as HTMLElement).getByText('createSurface')).toBeInTheDocument()
      expect(within(messageList as HTMLElement).getByText('pong')).toBeInTheDocument()
    })

    it('should display message count', () => {
      render(<MessageInspector messages={mockMessages} />)

      expect(screen.getByText(/2 messages/i)).toBeInTheDocument()
    })

    it('should show empty state when no messages', () => {
      render(<MessageInspector messages={[]} />)

      expect(screen.getByText(/no messages captured/i)).toBeInTheDocument()
    })

    it('should display direction indicators', () => {
      const { container } = render(<MessageInspector messages={mockMessages} />)

      const messageList = container.querySelector('[role="list"][aria-label="Message list"]')
      expect(within(messageList as HTMLElement).getByText('sent')).toBeInTheDocument()
      expect(within(messageList as HTMLElement).getByText('received')).toBeInTheDocument()
    })
  })

  describe('filtering', () => {
    it('should filter messages by type', () => {
      const { container } = render(<MessageInspector messages={mockMessages} />)

      const typeFilter = screen.getByLabelText(/filter by type/i)
      fireEvent.change(typeFilter, { target: { value: 'createSurface' } })

      const messageList = container.querySelector('[role="list"][aria-label="Message list"]')
      expect(within(messageList as HTMLElement).getByText('createSurface')).toBeInTheDocument()
      expect(within(messageList as HTMLElement).queryByText('pong')).not.toBeInTheDocument()

      // Should show 1 message after filtering
      expect(screen.getByText(/1 message/i)).toBeInTheDocument()
    })

    it('should filter messages by direction', () => {
      const { container } = render(<MessageInspector messages={mockMessages} />)

      const directionFilter = screen.getByLabelText(/filter by direction/i)
      fireEvent.change(directionFilter, { target: { value: 'sent' } })

      const messageList = container.querySelector('[role="list"][aria-label="Message list"]')
      expect(within(messageList as HTMLElement).getByText('createSurface')).toBeInTheDocument()
      expect(within(messageList as HTMLElement).queryByText('pong')).not.toBeInTheDocument()

      // Should show 1 message after filtering
      expect(screen.getByText(/1 message/i)).toBeInTheDocument()
    })

    it('should search messages by content', () => {
      const { container } = render(<MessageInspector messages={mockMessages} />)

      const searchInput = screen.getByPlaceholderText(/search messages/i)
      fireEvent.change(searchInput, { target: { value: 'Test Surface' } })

      const messageList = container.querySelector('[role="list"][aria-label="Message list"]')
      expect(within(messageList as HTMLElement).getByText('createSurface')).toBeInTheDocument()
      expect(within(messageList as HTMLElement).queryByText('pong')).not.toBeInTheDocument()

      // Should show 1 message after filtering
      expect(screen.getByText(/1 message/i)).toBeInTheDocument()
    })

    it('should combine multiple filters', () => {
      render(<MessageInspector messages={mockMessages} />)

      const typeFilter = screen.getByLabelText(/filter by type/i)
      const directionFilter = screen.getByLabelText(/filter by direction/i)

      fireEvent.change(typeFilter, { target: { value: 'createSurface' } })
      fireEvent.change(directionFilter, { target: { value: 'sent' } })

      expect(screen.getByText(/createSurface/i)).toBeInTheDocument()
    })
  })

  describe('message details', () => {
    it('should show message details on click', () => {
      const { container } = render(<MessageInspector messages={mockMessages} />)

      const messageList = container.querySelector('[role="list"][aria-label="Message list"]')
      const firstMessage = within(messageList as HTMLElement).getByText('createSurface')
      fireEvent.click(firstMessage)

      expect(screen.getByText(/Test Surface/i)).toBeInTheDocument()
    })

    it('should display syntax-highlighted JSON', () => {
      const { container } = render(<MessageInspector messages={mockMessages} />)

      const messageList = container.querySelector('[role="list"][aria-label="Message list"]')
      const firstMessage = within(messageList as HTMLElement).getByText('createSurface')
      fireEvent.click(firstMessage)

      const codeBlock = screen.getByRole('code')
      expect(codeBlock).toBeInTheDocument()
    })

    it('should copy message to clipboard', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator, {
        clipboard: {
          writeText
        }
      })

      const { container } = render(<MessageInspector messages={mockMessages} />)

      const messageList = container.querySelector('[role="list"][aria-label="Message list"]')
      const firstMessage = within(messageList as HTMLElement).getByText('createSurface')
      fireEvent.click(firstMessage)

      const copyButton = screen.getByRole('button', { name: /copy/i })
      fireEvent.click(copyButton)

      expect(writeText).toHaveBeenCalled()
    })
  })

  describe('actions', () => {
    it('should clear messages', () => {
      const onClear = vi.fn()
      render(<MessageInspector messages={mockMessages} onClear={onClear} />)

      const clearButton = screen.getByRole('button', { name: /clear/i })
      fireEvent.click(clearButton)

      expect(onClear).toHaveBeenCalled()
    })

    it('should export messages', () => {
      const onExport = vi.fn()
      render(<MessageInspector messages={mockMessages} onExport={onExport} />)

      const exportButton = screen.getByRole('button', { name: /export/i })
      fireEvent.click(exportButton)

      expect(onExport).toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('should be keyboard navigable', () => {
      const { container } = render(<MessageInspector messages={mockMessages} />)

      const messageList = container.querySelector('[role="list"][aria-label="Message list"]')
      const firstMessage = within(messageList as HTMLElement).getByText('createSurface')
      firstMessage.focus()

      fireEvent.keyDown(firstMessage, { key: 'Enter' })
      expect(screen.getByText(/Test Surface/i)).toBeInTheDocument()
    })

    it('should have proper ARIA labels', () => {
      render(<MessageInspector messages={mockMessages} />)

      expect(screen.getByRole('list')).toHaveAttribute('aria-label', 'Message list')
    })

    it('should announce filter changes', () => {
      render(<MessageInspector messages={mockMessages} />)

      const typeFilter = screen.getByLabelText(/filter by type/i)
      fireEvent.change(typeFilter, { target: { value: 'createSurface' } })

      expect(screen.getByRole('status')).toHaveTextContent(/1 message/i)
    })
  })

  describe('performance', () => {
    it('should virtualize long message lists', () => {
      const manyMessages = Array.from({ length: 1000 }, (_, i) => ({
        id: `msg_${i}`,
        timestamp: Date.now() - i * 1000,
        direction: 'sent' as const,
        messageType: 'ping',
        message: { type: 'ping' as const }
      }))

      const { container } = render(<MessageInspector messages={manyMessages} />)

      // Should not render all 1000 items in DOM when virtualized
      const renderedItems = container.querySelectorAll('[role="listitem"]')
      expect(renderedItems.length).toBeLessThan(100)
    })

    it('should not virtualize small message lists', () => {
      const fewMessages = Array.from({ length: 10 }, (_, i) => ({
        id: `msg_${i}`,
        timestamp: Date.now() - i * 1000,
        direction: 'sent' as const,
        messageType: 'ping',
        message: { type: 'ping' as const }
      }))

      const { container } = render(<MessageInspector messages={fewMessages} />)

      // Should render all items when list is small
      const renderedItems = container.querySelectorAll('[role="listitem"]')
      expect(renderedItems.length).toBe(10)
    })

    it('should handle rapid filter changes efficiently', () => {
      const manyMessages = Array.from({ length: 1000 }, (_, i) => ({
        id: `msg_${i}`,
        timestamp: Date.now() - i * 1000,
        direction: i % 2 === 0 ? 'sent' as const : 'received' as const,
        messageType: 'ping',
        message: { type: 'ping' as const }
      }))

      render(<MessageInspector messages={manyMessages} />)

      const directionFilter = screen.getByLabelText(/filter by direction/i)

      // Rapid filter changes should not cause memory issues
      fireEvent.change(directionFilter, { target: { value: 'sent' } })
      fireEvent.change(directionFilter, { target: { value: 'received' } })
      fireEvent.change(directionFilter, { target: { value: '' } })

      // Should still be responsive
      expect(screen.getByText(/1000 messages/i)).toBeInTheDocument()
    })
  })
})
