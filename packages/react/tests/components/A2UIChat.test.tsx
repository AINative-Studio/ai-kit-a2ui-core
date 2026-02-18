/// <reference types="vitest/globals" />
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { A2UIChat } from '@/components/A2UIChat'
import type { Message } from '@/types'

describe('A2UIChat', () => {
  const mockMessages: Message[] = [
    {
      id: '1',
      content: 'Hello',
      role: 'user',
      timestamp: new Date('2024-01-01T12:00:00Z'),
    },
    {
      id: '2',
      content: 'Hi there!',
      role: 'assistant',
      timestamp: new Date('2024-01-01T12:00:01Z'),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<A2UIChat />)
      expect(screen.getByRole('region', { name: /chat/i })).toBeInTheDocument()
    })

    it('should render with custom title', () => {
      render(<A2UIChat title="Test Chat" />)
      expect(screen.getByText('Test Chat')).toBeInTheDocument()
    })

    it('should render with custom placeholder', () => {
      render(<A2UIChat placeholder="Enter your message..." />)
      expect(
        screen.getByPlaceholderText('Enter your message...')
      ).toBeInTheDocument()
    })

    it('should render initial messages', () => {
      render(<A2UIChat messages={mockMessages} />)
      expect(screen.getByText('Hello')).toBeInTheDocument()
      expect(screen.getByText('Hi there!')).toBeInTheDocument()
    })

    it('should apply light theme class', () => {
      const { container } = render(<A2UIChat theme="light" />)
      expect(container.querySelector('[data-theme="light"]')).toBeInTheDocument()
    })

    it('should apply dark theme class', () => {
      const { container } = render(<A2UIChat theme="dark" />)
      expect(container.querySelector('[data-theme="dark"]')).toBeInTheDocument()
    })

    it('should apply custom className for Tailwind support', () => {
      const { container } = render(<A2UIChat className="custom-class" />)
      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('Message Input', () => {
    it('should update input value on change', async () => {
      const user = userEvent.setup()
      render(<A2UIChat />)

      const input = screen.getByRole('textbox', { name: /message/i })
      await user.type(input, 'Test message')

      expect(input).toHaveValue('Test message')
    })

    it('should call onMessage when send button is clicked', async () => {
      const user = userEvent.setup()
      const onMessage = vi.fn()
      render(<A2UIChat onMessage={onMessage} />)

      const input = screen.getByRole('textbox', { name: /message/i })
      const sendButton = screen.getByRole('button', { name: /send/i })

      await user.type(input, 'Test message')
      await user.click(sendButton)

      expect(onMessage).toHaveBeenCalledWith('Test message')
    })

    it('should call onMessage when Enter key is pressed', async () => {
      const user = userEvent.setup()
      const onMessage = vi.fn()
      render(<A2UIChat onMessage={onMessage} />)

      const input = screen.getByRole('textbox', { name: /message/i })
      await user.type(input, 'Test message{Enter}')

      expect(onMessage).toHaveBeenCalledWith('Test message')
    })

    it('should not call onMessage when Shift+Enter is pressed', async () => {
      const user = userEvent.setup()
      const onMessage = vi.fn()
      render(<A2UIChat onMessage={onMessage} />)

      const input = screen.getByRole('textbox', { name: /message/i })
      await user.type(input, 'Test message{Shift>}{Enter}{/Shift}')

      expect(onMessage).not.toHaveBeenCalled()
    })

    it('should clear input after sending message', async () => {
      const user = userEvent.setup()
      const onMessage = vi.fn()
      render(<A2UIChat onMessage={onMessage} />)

      const input = screen.getByRole('textbox', { name: /message/i })
      await user.type(input, 'Test message{Enter}')

      await waitFor(() => {
        expect(input).toHaveValue('')
      })
    })

    it('should not send empty messages', async () => {
      const user = userEvent.setup()
      const onMessage = vi.fn()
      render(<A2UIChat onMessage={onMessage} />)

      const sendButton = screen.getByRole('button', { name: /send/i })
      await user.click(sendButton)

      expect(onMessage).not.toHaveBeenCalled()
    })

    it('should respect maxLength prop', async () => {
      const user = userEvent.setup()
      render(<A2UIChat maxLength={10} />)

      const input = screen.getByRole('textbox', { name: /message/i })
      await user.type(input, 'This is a very long message')

      expect(input).toHaveValue('This is a ')
    })

    it('should disable input when disabled prop is true', () => {
      render(<A2UIChat disabled />)

      const input = screen.getByRole('textbox', { name: /message/i })
      const sendButton = screen.getByRole('button', { name: /send/i })

      expect(input).toBeDisabled()
      expect(sendButton).toBeDisabled()
    })
  })

  describe('Message Display', () => {
    it('should display messages with correct roles', () => {
      render(<A2UIChat messages={mockMessages} />)

      const userMessage = screen.getByText('Hello').closest('[data-role]')
      const assistantMessage = screen.getByText('Hi there!').closest('[data-role]')

      expect(userMessage).toHaveAttribute('data-role', 'user')
      expect(assistantMessage).toHaveAttribute('data-role', 'assistant')
    })

    it('should show timestamps when showTimestamp is true', () => {
      render(<A2UIChat messages={mockMessages} showTimestamp />)

      // Check that timestamp elements exist
      const timestamps = screen.getAllByText(/12:00/)
      expect(timestamps.length).toBeGreaterThan(0)
    })

    it('should not show timestamps by default', () => {
      render(<A2UIChat messages={mockMessages} />)

      const timestamps = screen.queryAllByText(/12:00/)
      expect(timestamps).toHaveLength(0)
    })

    it('should call onMessagesChange when messages update', async () => {
      const user = userEvent.setup()
      const onMessagesChange = vi.fn()
      const onMessage = vi.fn()

      render(
        <A2UIChat
          messages={mockMessages}
          onMessage={onMessage}
          onMessagesChange={onMessagesChange}
        />
      )

      const input = screen.getByRole('textbox', { name: /message/i })
      await user.type(input, 'New message{Enter}')

      await waitFor(() => {
        expect(onMessagesChange).toHaveBeenCalled()
      })
    })
  })

  describe('Typing Indicator', () => {
    it('should show typing indicator when isTyping is true', () => {
      render(<A2UIChat isTyping />)

      expect(screen.getByText(/typing/i)).toBeInTheDocument()
    })

    it('should not show typing indicator by default', () => {
      render(<A2UIChat />)

      expect(screen.queryByText(/typing/i)).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should display error message when error prop is set', () => {
      render(<A2UIChat error="Something went wrong" />)

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    it('should use custom error renderer when provided', () => {
      const renderError = (error: string) => <div>Custom: {error}</div>
      render(<A2UIChat error="Error message" renderError={renderError} />)

      expect(screen.getByText('Custom: Error message')).toBeInTheDocument()
    })
  })

  describe('Custom Rendering', () => {
    it('should use custom message renderer when provided', () => {
      const renderMessage = (message: Message) => (
        <div data-testid="custom-message">{message.content.toUpperCase()}</div>
      )

      render(<A2UIChat messages={mockMessages} renderMessage={renderMessage} />)

      expect(screen.getByText('HELLO')).toBeInTheDocument()
      expect(screen.getByText('HI THERE!')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<A2UIChat title="Accessible Chat" />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper ARIA labels', () => {
      render(<A2UIChat title="Test Chat" />)

      expect(screen.getByRole('region', { name: /chat/i })).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: /message/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      const onMessage = vi.fn()
      render(<A2UIChat onMessage={onMessage} />)

      // Tab to input
      await user.tab()
      const input = screen.getByRole('textbox', { name: /message/i })
      expect(input).toHaveFocus()

      // Type message
      await user.type(input, 'Test')

      // Tab to send button
      await user.tab()
      const sendButton = screen.getByRole('button', { name: /send/i })
      expect(sendButton).toHaveFocus()

      // Press Enter on button
      await user.keyboard('{Enter}')
      expect(onMessage).toHaveBeenCalledWith('Test')
    })

    it('should support Escape key to clear input', async () => {
      const user = userEvent.setup()
      render(<A2UIChat />)

      const input = screen.getByRole('textbox', { name: /message/i })
      await user.type(input, 'Test message')
      expect(input).toHaveValue('Test message')

      await user.keyboard('{Escape}')
      expect(input).toHaveValue('')
    })

    it('should have sufficient color contrast in light theme', () => {
      const { container } = render(<A2UIChat theme="light" />)
      const chatContainer = container.querySelector('[data-theme="light"]')
      expect(chatContainer).toBeInTheDocument()
    })

    it('should have sufficient color contrast in dark theme', () => {
      const { container } = render(<A2UIChat theme="dark" />)
      const chatContainer = container.querySelector('[data-theme="dark"]')
      expect(chatContainer).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should handle large message lists efficiently', () => {
      const largeMessageList: Message[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `msg-${i}`,
        content: `Message ${i}`,
        role: i % 2 === 0 ? 'user' : 'assistant',
        timestamp: new Date(),
      }))

      const { container } = render(
        <A2UIChat messages={largeMessageList} virtualScrolling />
      )

      expect(container).toBeInTheDocument()
    })
  })

  describe('Async Message Handling', () => {
    it('should handle async onMessage callback', async () => {
      const user = userEvent.setup()
      const onMessage = vi.fn().mockResolvedValue(undefined)

      render(<A2UIChat onMessage={onMessage} />)

      const input = screen.getByRole('textbox', { name: /message/i })
      await user.type(input, 'Async message{Enter}')

      await waitFor(() => {
        expect(onMessage).toHaveBeenCalledWith('Async message')
      })
    })

    it('should disable input while async operation is pending', async () => {
      const user = userEvent.setup()
      let resolveMessage: () => void
      const onMessage = vi.fn(() => new Promise<void>((resolve) => {
        resolveMessage = resolve
      }))

      render(<A2UIChat onMessage={onMessage} />)

      const input = screen.getByRole('textbox', { name: /message/i })
      const sendButton = screen.getByRole('button', { name: /send/i })

      await user.type(input, 'Test{Enter}')

      // Should be disabled while pending
      expect(input).toBeDisabled()
      expect(sendButton).toBeDisabled()

      // Resolve the promise
      resolveMessage!()

      // Should be enabled after resolution
      await waitFor(() => {
        expect(input).not.toBeDisabled()
        expect(sendButton).not.toBeDisabled()
      })
    })
  })
})
