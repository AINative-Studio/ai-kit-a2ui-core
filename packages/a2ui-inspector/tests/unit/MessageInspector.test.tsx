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
      render(<MessageInspector messages={mockMessages} />)

      expect(screen.getByText(/createSurface/i)).toBeInTheDocument()
      expect(screen.getByText(/pong/i)).toBeInTheDocument()
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
      render(<MessageInspector messages={mockMessages} />)

      expect(screen.getByText(/sent/i)).toBeInTheDocument()
      expect(screen.getByText(/received/i)).toBeInTheDocument()
    })
  })

  describe('filtering', () => {
    it('should filter messages by type', () => {
      render(<MessageInspector messages={mockMessages} />)

      const typeFilter = screen.getByLabelText(/filter by type/i)
      fireEvent.change(typeFilter, { target: { value: 'createSurface' } })

      expect(screen.getByText(/createSurface/i)).toBeInTheDocument()
      expect(screen.queryByText(/pong/i)).not.toBeInTheDocument()
    })

    it('should filter messages by direction', () => {
      render(<MessageInspector messages={mockMessages} />)

      const directionFilter = screen.getByLabelText(/filter by direction/i)
      fireEvent.change(directionFilter, { target: { value: 'sent' } })

      expect(screen.getByText(/createSurface/i)).toBeInTheDocument()
      expect(screen.queryByText(/pong/i)).not.toBeInTheDocument()
    })

    it('should search messages by content', () => {
      render(<MessageInspector messages={mockMessages} />)

      const searchInput = screen.getByPlaceholderText(/search messages/i)
      fireEvent.change(searchInput, { target: { value: 'Test Surface' } })

      expect(screen.getByText(/createSurface/i)).toBeInTheDocument()
      expect(screen.queryByText(/pong/i)).not.toBeInTheDocument()
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
      render(<MessageInspector messages={mockMessages} />)

      const firstMessage = screen.getByText(/createSurface/i)
      fireEvent.click(firstMessage)

      expect(screen.getByText(/Test Surface/i)).toBeInTheDocument()
    })

    it('should display syntax-highlighted JSON', () => {
      render(<MessageInspector messages={mockMessages} />)

      const firstMessage = screen.getByText(/createSurface/i)
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

      render(<MessageInspector messages={mockMessages} />)

      const firstMessage = screen.getByText(/createSurface/i)
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
      render(<MessageInspector messages={mockMessages} />)

      const firstMessage = screen.getByText(/createSurface/i)
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

      // Should not render all 1000 items in DOM
      const renderedItems = container.querySelectorAll('[role="listitem"]')
      expect(renderedItems.length).toBeLessThan(100)
    })
  })
})
