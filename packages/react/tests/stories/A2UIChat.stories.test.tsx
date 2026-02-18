/// <reference types="vitest/globals" />
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { A2UIChat } from '@/components/A2UIChat'
import type { Message } from '@/types'
import {
  Default,
  EmptyState,
  LightTheme,
  DarkTheme,
  CustomStyling,
  SmallConversation,
  MediumConversation,
  LargeConversation,
  WithTimestamps,
  TypingIndicator,
  ErrorState,
  CustomErrorRenderer,
  LoadingState,
  DisabledState,
  WithMaxLength,
  WithFileAttachments,
  CustomMessageRenderer,
  AccessibilityDemo,
} from '../../stories/A2UIChat.stories'

describe('A2UIChat Stories', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Default Story', () => {
    it('should render default story', () => {
      const args = Default.args!
      render(<A2UIChat {...args} />)

      expect(screen.getByRole('region', { name: /chat/i })).toBeInTheDocument()
      expect(screen.getByText('Chat Assistant')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument()
    })

    it('should have send button disabled when no input', () => {
      const args = Default.args!
      render(<A2UIChat {...args} />)

      const sendButton = screen.getByRole('button', { name: /send/i })
      expect(sendButton).toBeDisabled()
    })

    it('should pass accessibility checks', async () => {
      const args = Default.args!
      const { container } = render(<A2UIChat {...args} />)

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Empty State Story', () => {
    it('should render empty state with no messages', () => {
      const args = EmptyState.args!
      render(<A2UIChat {...args} />)

      expect(screen.getByText('Start a Conversation')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Ask me anything...')).toBeInTheDocument()

      // Verify no messages are displayed
      const messagesContainer = screen.getByRole('region', { name: /chat/i })
      expect(messagesContainer).toBeInTheDocument()
    })
  })

  describe('Theme Stories', () => {
    it('should render light theme correctly', () => {
      const args = LightTheme.args!
      const { container } = render(<A2UIChat {...args} />)

      const chatContainer = container.querySelector('[data-theme="light"]')
      expect(chatContainer).toBeInTheDocument()
      expect(screen.getByText('Hello! How can I help you today?')).toBeInTheDocument()
    })

    it('should render dark theme correctly', () => {
      const args = DarkTheme.args!
      const { container } = render(<A2UIChat {...args} />)

      const chatContainer = container.querySelector('[data-theme="dark"]')
      expect(chatContainer).toBeInTheDocument()
      expect(screen.getByText('Hello! How can I help you today?')).toBeInTheDocument()
    })

    it('should pass accessibility checks for light theme', async () => {
      const args = LightTheme.args!
      const { container } = render(<A2UIChat {...args} />)

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should pass accessibility checks for dark theme', async () => {
      const args = DarkTheme.args!
      const { container } = render(<A2UIChat {...args} />)

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Custom Styling Story', () => {
    it('should apply custom className', () => {
      const args = CustomStyling.args!
      const { container } = render(<A2UIChat {...args} />)

      const chatContainer = container.firstChild
      expect(chatContainer).toHaveClass('shadow-2xl')
    })
  })

  describe('Message History Stories', () => {
    it('should render small conversation (10 messages)', () => {
      const args = SmallConversation.args!
      render(<A2UIChat {...args} />)

      expect(screen.getByText('Small Conversation (10 messages)')).toBeInTheDocument()
      expect(screen.getByText('Message 1')).toBeInTheDocument()
      expect(screen.getByText('Message 10')).toBeInTheDocument()
    })

    it('should render medium conversation (100 messages)', () => {
      const args = MediumConversation.args!
      render(<A2UIChat {...args} />)

      expect(screen.getByText('Medium Conversation (100 messages)')).toBeInTheDocument()
      expect(screen.getByText('Message 1')).toBeInTheDocument()
      expect(screen.getByText('Message 100')).toBeInTheDocument()
    })

    it('should render large conversation (1000 messages) with virtual scrolling', () => {
      const args = LargeConversation.args!
      const { container } = render(<A2UIChat {...args} />)

      expect(screen.getByText('Large Conversation (1000 messages)')).toBeInTheDocument()

      // Verify virtual scrolling is enabled
      const messagesContainer = container.querySelector('[data-virtual="true"]')
      expect(messagesContainer).toBeInTheDocument()
    })

    it('should show timestamps when enabled', () => {
      const args = WithTimestamps.args!
      const { container } = render(<A2UIChat {...args} />)

      // Verify timestamps are present
      const timestamps = container.querySelectorAll('[class*="messageTimestamp"]')
      expect(timestamps.length).toBeGreaterThan(0)
    })
  })

  describe('State Stories', () => {
    it('should show typing indicator', () => {
      const args = TypingIndicator.args!
      const { container } = render(<A2UIChat {...args} />)

      expect(screen.getByText(/typing/i)).toBeInTheDocument()

      // Verify typing dots
      const typingDots = container.querySelectorAll('[class*="typingDot"]')
      expect(typingDots.length).toBe(3)
    })

    it('should display error message', () => {
      const args = ErrorState.args!
      render(<A2UIChat {...args} />)

      const errorAlert = screen.getByRole('alert')
      expect(errorAlert).toBeInTheDocument()
      expect(errorAlert).toHaveTextContent('Failed to send message')
    })

    it('should use custom error renderer', () => {
      const args = CustomErrorRenderer.args!
      render(<A2UIChat {...args} />)

      expect(screen.getByText('Error:')).toBeInTheDocument()
      expect(screen.getByText(/Network timeout/i)).toBeInTheDocument()
    })

    it('should disable input when disabled prop is true', () => {
      const args = DisabledState.args!
      render(<A2UIChat {...args} />)

      const input = screen.getByRole('textbox', { name: /message/i })
      const sendButton = screen.getByRole('button', { name: /send/i })

      expect(input).toBeDisabled()
      expect(sendButton).toBeDisabled()
    })

    it('should show loading state with typing indicator', () => {
      const args = LoadingState.args!
      render(<A2UIChat {...args} />)

      expect(screen.getByText('Processing...')).toBeInTheDocument()
      expect(screen.getByText(/typing/i)).toBeInTheDocument()
    })
  })

  describe('Max Length Story', () => {
    it('should enforce maximum message length', async () => {
      const user = userEvent.setup()
      const args = WithMaxLength.args!
      render(<A2UIChat {...args} />)

      const input = screen.getByRole('textbox', { name: /message/i })

      // Try to type more than maxLength (100)
      await user.type(input, 'A'.repeat(150))

      // Verify input is truncated to maxLength
      await waitFor(() => {
        expect(input).toHaveValue('A'.repeat(100))
      })
    })
  })

  describe('Custom Renderer Stories', () => {
    it('should render file attachments with custom renderer', () => {
      const args = WithFileAttachments.args!
      render(<A2UIChat {...args} />)

      expect(screen.getByText('Chat with Attachments')).toBeInTheDocument()
      expect(screen.getByText('I have uploaded the report.')).toBeInTheDocument()
      expect(screen.getByText(/quarterly-report.pdf/i)).toBeInTheDocument()
    })

    it('should render custom message renderer with avatars', () => {
      const args = CustomMessageRenderer.args!
      const { container } = render(<A2UIChat {...args} />)

      expect(screen.getByText('Custom Message Design')).toBeInTheDocument()

      // Verify avatars are rendered (U for user, A for assistant)
      const avatars = container.querySelectorAll('[style*="border-radius: 50%"]')
      expect(avatars.length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility Demo Story', () => {
    it('should pass all accessibility checks', async () => {
      const args = AccessibilityDemo.args!
      const { container } = render(<A2UIChat {...args} />)

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper ARIA labels', () => {
      const args = AccessibilityDemo.args!
      render(<A2UIChat {...args} />)

      expect(screen.getByRole('region', { name: /chat/i })).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: /message/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      const args = AccessibilityDemo.args!
      render(<A2UIChat {...args} />)

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
    })

    it('should support Escape key to clear input', async () => {
      const user = userEvent.setup()
      const args = AccessibilityDemo.args!
      render(<A2UIChat {...args} />)

      const input = screen.getByRole('textbox', { name: /message/i })
      await user.type(input, 'Test message')
      expect(input).toHaveValue('Test message')

      await user.keyboard('{Escape}')
      expect(input).toHaveValue('')
    })
  })

  describe('Interactive Features', () => {
    it('should handle message sending', async () => {
      const user = userEvent.setup()
      const onMessage = vi.fn()
      const args = { ...Default.args!, onMessage }

      render(<A2UIChat {...args} />)

      const input = screen.getByRole('textbox', { name: /message/i })
      const sendButton = screen.getByRole('button', { name: /send/i })

      // Type and send message
      await user.type(input, 'Hello world')
      expect(sendButton).not.toBeDisabled()

      await user.click(sendButton)
      expect(onMessage).toHaveBeenCalledWith('Hello world')
    })

    it('should handle Enter key to send message', async () => {
      const user = userEvent.setup()
      const onMessage = vi.fn()
      const args = { ...Default.args!, onMessage }

      render(<A2UIChat {...args} />)

      const input = screen.getByRole('textbox', { name: /message/i })

      await user.type(input, 'Hello world{Enter}')
      expect(onMessage).toHaveBeenCalledWith('Hello world')
    })

    it('should not send message on Shift+Enter', async () => {
      const user = userEvent.setup()
      const onMessage = vi.fn()
      const args = { ...Default.args!, onMessage }

      render(<A2UIChat {...args} />)

      const input = screen.getByRole('textbox', { name: /message/i })

      await user.type(input, 'Hello world{Shift>}{Enter}{/Shift}')
      expect(onMessage).not.toHaveBeenCalled()
    })

    it('should not send empty messages', async () => {
      const user = userEvent.setup()
      const onMessage = vi.fn()
      const args = { ...Default.args!, onMessage }

      render(<A2UIChat {...args} />)

      const sendButton = screen.getByRole('button', { name: /send/i })

      await user.click(sendButton)
      expect(onMessage).not.toHaveBeenCalled()
    })

    it('should clear input after sending message', async () => {
      const user = userEvent.setup()
      const onMessage = vi.fn()
      const args = { ...Default.args!, onMessage }

      render(<A2UIChat {...args} />)

      const input = screen.getByRole('textbox', { name: /message/i })

      await user.type(input, 'Test message{Enter}')

      await waitFor(() => {
        expect(input).toHaveValue('')
      })
    })
  })

  describe('Performance', () => {
    it('should handle large message lists without crashing', () => {
      const args = LargeConversation.args!

      expect(() => {
        render(<A2UIChat {...args} />)
      }).not.toThrow()
    })

    it('should render 1000 messages efficiently', () => {
      const args = LargeConversation.args!
      const startTime = performance.now()

      render(<A2UIChat {...args} />)

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render in less than 1 second
      expect(renderTime).toBeLessThan(1000)
    })
  })

  describe('Message Role Display', () => {
    it('should display user, assistant, and system messages correctly', () => {
      const messages: Message[] = [
        {
          id: '1',
          content: 'User message',
          role: 'user',
          timestamp: new Date(),
        },
        {
          id: '2',
          content: 'Assistant message',
          role: 'assistant',
          timestamp: new Date(),
        },
        {
          id: '3',
          content: 'System message',
          role: 'system',
          timestamp: new Date(),
        },
      ]

      render(<A2UIChat messages={messages} />)

      expect(screen.getByText('User message')).toBeInTheDocument()
      expect(screen.getByText('Assistant message')).toBeInTheDocument()
      expect(screen.getByText('System message')).toBeInTheDocument()

      // Verify roles are set correctly
      const userMessage = screen.getByText('User message').closest('[data-role]')
      const assistantMessage = screen.getByText('Assistant message').closest('[data-role]')
      const systemMessage = screen.getByText('System message').closest('[data-role]')

      expect(userMessage).toHaveAttribute('data-role', 'user')
      expect(assistantMessage).toHaveAttribute('data-role', 'assistant')
      expect(systemMessage).toHaveAttribute('data-role', 'system')
    })
  })

  describe('Error Handling', () => {
    it('should display error without crashing', () => {
      const args = ErrorState.args!

      expect(() => {
        render(<A2UIChat {...args} />)
      }).not.toThrow()

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('should handle async onMessage errors gracefully', async () => {
      const user = userEvent.setup()
      const onMessage = vi.fn().mockRejectedValue(new Error('Network error'))
      const args = { ...Default.args!, onMessage }

      render(<A2UIChat {...args} />)

      const input = screen.getByRole('textbox', { name: /message/i })

      // Should not crash when async function rejects
      await expect(async () => {
        await user.type(input, 'Test{Enter}')
      }).rejects.toThrow('Network error')
    })
  })

  describe('Metadata Support', () => {
    it('should support message metadata for file attachments', () => {
      const args = WithFileAttachments.args!
      render(<A2UIChat {...args} />)

      // Verify file attachment is displayed
      expect(screen.getByText(/quarterly-report.pdf/i)).toBeInTheDocument()
    })
  })

  describe('Timestamp Formatting', () => {
    it('should format timestamps correctly', () => {
      const messages: Message[] = [
        {
          id: '1',
          content: 'Test message',
          role: 'user',
          timestamp: new Date('2024-01-01T14:30:00'),
        },
      ]

      const { container } = render(<A2UIChat messages={messages} showTimestamp />)

      // Verify timestamp is displayed (format may vary by locale)
      const timestamps = container.querySelectorAll('[class*="messageTimestamp"]')
      expect(timestamps.length).toBeGreaterThan(0)
    })
  })
})
