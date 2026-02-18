/// <reference types="vitest/globals" />
import type { Meta, StoryObj } from '@storybook/react'
import { within, waitFor } from '@storybook/testing-library'
import { userEvent } from '@testing-library/user-event'
import { A2UIPopup } from '../src/components/A2UIPopup'
import type { Message } from '../src/types'
import { useState } from 'react'

const meta: Meta<typeof A2UIPopup> = {
  title: 'Components/A2UIPopup',
  component: A2UIPopup,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# A2UIPopup Component

A floating chat popup component that can be positioned in any corner of the screen with support for:
- Four corner positions (bottom-right, bottom-left, top-right, top-left)
- Light and dark themes
- Customizable trigger button
- Minimize/expand functionality
- Portal rendering for proper z-index handling
- Escape key and overlay click to close
- Full keyboard navigation and accessibility (WCAG AA compliant)
- Focus trapping when open

## Accessibility Features
- Full keyboard navigation with focus trapping
- Escape key closes popup and returns focus to trigger
- ARIA attributes for screen readers (aria-modal, aria-expanded)
- Sufficient color contrast (4.5:1 for text, 3:1 for UI)
- Focus visible indicators on all interactive elements
- Screen reader announcements for state changes

## Use Cases
- Customer support chat widget
- Help center assistant
- Notification center
- Quick action menu
        `,
      },
    },
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'label', enabled: true },
          { id: 'aria-allowed-attr', enabled: true },
          { id: 'button-name', enabled: true },
          { id: 'region', enabled: true },
        ],
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    position: {
      control: 'select',
      options: ['bottom-right', 'bottom-left', 'top-right', 'top-left'],
      description: 'Position of the popup on screen',
      table: {
        type: { summary: "'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'" },
        defaultValue: { summary: 'bottom-right' },
      },
    },
    theme: {
      control: 'select',
      options: ['light', 'dark'],
      description: 'Color theme for the popup',
      table: {
        type: { summary: "'light' | 'dark'" },
        defaultValue: { summary: 'light' },
      },
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Initial open state of the popup',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    className: {
      control: 'text',
      description: 'Custom CSS classes to apply',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '""' },
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof A2UIPopup>

// Sample messages for demonstrations
const sampleMessages: Message[] = [
  {
    id: '1',
    content: 'Hello! How can I help you today?',
    role: 'assistant',
    timestamp: new Date('2024-01-01T10:00:00'),
  },
  {
    id: '2',
    content: 'I have a question about pricing.',
    role: 'user',
    timestamp: new Date('2024-01-01T10:00:30'),
  },
  {
    id: '3',
    content: 'I would be happy to help explain our pricing plans. What specific aspect would you like to know about?',
    role: 'assistant',
    timestamp: new Date('2024-01-01T10:01:00'),
  },
]

// Story decorators for page context
const PageDecorator = (Story: React.ComponentType) => (
  <div style={{ minHeight: '100vh', padding: '40px', background: '#f9fafb' }}>
    <h1 style={{ fontSize: '32px', marginBottom: '20px', color: '#111827' }}>Sample Page Content</h1>
    <p style={{ marginBottom: '16px', lineHeight: '1.6', color: '#374151' }}>
      This demonstrates the popup component in context. Click the button to open the chat popup.
    </p>
    <p style={{ marginBottom: '16px', lineHeight: '1.6', color: '#374151' }}>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. The popup will appear in the configured
      corner position as a floating overlay.
    </p>
    <Story />
  </div>
)

const DarkPageDecorator = (Story: React.ComponentType) => (
  <div style={{ minHeight: '100vh', padding: '40px', background: '#0f172a' }}>
    <h1 style={{ fontSize: '32px', marginBottom: '20px', color: '#f1f5f9' }}>Dark Mode Page</h1>
    <p style={{ marginBottom: '16px', lineHeight: '1.6', color: '#cbd5e1' }}>
      This demonstrates the popup in dark theme matching the page design.
    </p>
    <Story />
  </div>
)

/**
 * Default popup in bottom-right corner.
 * This is the most common placement for chat widgets.
 */
export const BottomRight: Story = {
  args: {
    position: 'bottom-right',
    chatProps: {
      title: 'Support Chat',
      placeholder: 'Ask us anything...',
      onMessage: (message: string) => console.log('Message sent:', message),
    },
    onOpen: () => console.log('Popup opened'),
    onClose: () => console.log('Popup closed'),
  },
  decorators: [PageDecorator],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Verify trigger button is present
    const triggerButton = canvas.getByRole('button', { name: /open chat/i })
    await expect(triggerButton).toBeInTheDocument()
    await expect(triggerButton).toHaveAttribute('aria-expanded', 'false')
  },
  parameters: {
    docs: {
      description: {
        story: 'Bottom-right positioned popup - the standard placement for customer support chat widgets.',
      },
    },
  },
}

/**
 * Popup in bottom-left corner.
 * Alternative placement for left-aligned interfaces.
 */
export const BottomLeft: Story = {
  args: {
    position: 'bottom-left',
    chatProps: {
      title: 'Assistant',
      placeholder: 'Type a message...',
      onMessage: (message: string) => console.log('Message sent:', message),
    },
  },
  decorators: [PageDecorator],
  parameters: {
    docs: {
      description: {
        story: 'Bottom-left positioned popup - useful for left-aligned interfaces or RTL layouts.',
      },
    },
  },
}

/**
 * Popup in top-right corner.
 * Useful for notification-style interactions.
 */
export const TopRight: Story = {
  args: {
    position: 'top-right',
    chatProps: {
      title: 'Help Center',
      placeholder: 'How can we help?',
      onMessage: (message: string) => console.log('Message sent:', message),
    },
  },
  decorators: [PageDecorator],
  parameters: {
    docs: {
      description: {
        story: 'Top-right positioned popup - good for notification-style chat or help systems.',
      },
    },
  },
}

/**
 * Popup in top-left corner.
 * Less common but available for specific design needs.
 */
export const TopLeft: Story = {
  args: {
    position: 'top-left',
    chatProps: {
      title: 'Chat',
      placeholder: 'Send a message...',
      onMessage: (message: string) => console.log('Message sent:', message),
    },
  },
  decorators: [PageDecorator],
  parameters: {
    docs: {
      description: {
        story: 'Top-left positioned popup - available for custom interface requirements.',
      },
    },
  },
}

/**
 * Dark theme popup matching dark page design.
 * Automatically adjusts colors for proper contrast in dark mode.
 */
export const DarkTheme: Story = {
  args: {
    position: 'bottom-right',
    theme: 'dark',
    chatProps: {
      title: 'Dark Mode Chat',
      placeholder: 'Message us...',
      onMessage: (message: string) => console.log('Message sent:', message),
    },
  },
  decorators: [DarkPageDecorator],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()

    // Open popup
    const triggerButton = canvas.getByRole('button', { name: /open chat/i })
    await user.click(triggerButton)

    // Verify dark theme is applied
    await waitFor(() => {
      const dialog = canvas.getByRole('dialog')
      expect(dialog).toHaveAttribute('data-theme', 'dark')
    })
  },
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'Dark theme with WCAG AA compliant contrast ratios. Ideal for dark mode interfaces.',
      },
    },
  },
}

/**
 * Popup that opens automatically on page load.
 * Useful for proactive engagement or important announcements.
 */
export const DefaultOpen: Story = {
  args: {
    position: 'bottom-right',
    defaultOpen: true,
    chatProps: {
      title: 'Welcome!',
      placeholder: 'Start chatting...',
      messages: [
        {
          id: '1',
          content: 'Welcome! How can we help you today?',
          role: 'assistant',
          timestamp: new Date(),
        },
      ],
      onMessage: (message: string) => console.log('Message sent:', message),
    },
  },
  decorators: [PageDecorator],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Verify popup is open by default
    await waitFor(() => {
      expect(canvas.getByRole('dialog')).toBeInTheDocument()
    })

    // Verify welcome message is displayed
    await expect(canvas.getByText('Welcome! How can we help you today?')).toBeInTheDocument()
  },
  parameters: {
    docs: {
      description: {
        story: 'Popup that opens automatically - useful for proactive engagement or welcome messages.',
      },
    },
  },
}

/**
 * Custom trigger button with branded styling.
 * Demonstrates full control over the trigger appearance.
 */
export const CustomTrigger: Story = {
  args: {
    position: 'bottom-right',
    renderTrigger: ({ onClick, isOpen }) => (
      <button
        onClick={onClick}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        aria-expanded={isOpen}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '12px 24px',
          backgroundColor: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
          transition: 'all 0.2s ease',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#059669'
          e.currentTarget.style.transform = 'translateY(-2px)'
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = '#10b981'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        {isOpen ? '✕ Close Chat' : '💬 Need Help?'}
      </button>
    ),
    chatProps: {
      title: 'Customer Support',
      placeholder: 'Type your question...',
      onMessage: (message: string) => console.log('Message sent:', message),
    },
  },
  decorators: [PageDecorator],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()

    // Verify custom trigger is rendered
    const customButton = canvas.getByText(/Need Help/i)
    await expect(customButton).toBeInTheDocument()

    // Click to open
    await user.click(customButton)

    // Verify text changes when open
    await waitFor(() => {
      expect(canvas.getByText(/Close Chat/i)).toBeInTheDocument()
    })
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom trigger button with branded styling. Full control over appearance and behavior.',
      },
    },
  },
}

/**
 * Popup with conversation history and timestamps.
 * Shows typical support chat interaction.
 */
export const WithInitialMessages: Story = {
  args: {
    position: 'bottom-right',
    defaultOpen: true,
    chatProps: {
      title: 'Support Chat',
      messages: sampleMessages,
      showTimestamp: true,
      onMessage: (message: string) => console.log('Message sent:', message),
    },
  },
  decorators: [PageDecorator],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Verify all messages are displayed
    await expect(canvas.getByText('Hello! How can I help you today?')).toBeInTheDocument()
    await expect(canvas.getByText('I have a question about pricing.')).toBeInTheDocument()

    // Verify timestamps are shown
    const timestamps = canvasElement.querySelectorAll('[class*="messageTimestamp"]')
    expect(timestamps.length).toBeGreaterThan(0)
  },
  parameters: {
    docs: {
      description: {
        story: 'Popup with existing conversation history and timestamps for context.',
      },
    },
  },
}

/**
 * Popup showing typing indicator.
 * Provides visual feedback while assistant is composing response.
 */
export const WithTyping: Story = {
  args: {
    position: 'bottom-right',
    defaultOpen: true,
    chatProps: {
      title: 'Live Support',
      isTyping: true,
      messages: [
        {
          id: '1',
          content: 'Let me check that for you...',
          role: 'assistant',
          timestamp: new Date(),
        },
      ],
      onMessage: (message: string) => console.log('Message sent:', message),
    },
  },
  decorators: [PageDecorator],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Verify typing indicator is shown
    await expect(canvas.getByText(/typing/i)).toBeInTheDocument()

    // Verify typing animation dots
    const typingDots = canvasElement.querySelectorAll('[class*="typingDot"]')
    expect(typingDots.length).toBe(3)
  },
  parameters: {
    docs: {
      description: {
        story: 'Typing indicator animation while assistant composes response. Improves perceived performance.',
      },
    },
  },
}

/**
 * Demonstrates minimize functionality.
 * Allows users to keep popup open but out of the way.
 */
export const MinimizedState: Story = {
  render: () => {
    return (
      <div style={{ minHeight: '100vh', padding: '40px', background: '#f9fafb' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '20px', color: '#111827' }}>
          Minimize Demo
        </h1>
        <p style={{ marginBottom: '16px', lineHeight: '1.6', color: '#374151' }}>
          Click the minimize button (−) to collapse the popup. Click the header to restore.
        </p>
        <A2UIPopup
          position="bottom-right"
          defaultOpen
          chatProps={{
            title: 'Minimizable Chat',
            placeholder: 'Type a message...',
            messages: sampleMessages,
            onMessage: (message: string) => console.log('Message:', message),
          }}
        />
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()

    // Find and click minimize button
    const minimizeButton = canvas.getByRole('button', { name: /minimize/i })
    await user.click(minimizeButton)

    // Verify popup is minimized
    await waitFor(() => {
      const dialog = canvas.getByRole('dialog')
      expect(dialog).toHaveAttribute('data-minimized', 'true')
    })

    // Click header to restore
    const header = canvas.getByText('Minimizable Chat')
    await user.click(header)

    // Verify popup is restored
    await waitFor(() => {
      const dialog = canvas.getByRole('dialog')
      expect(dialog).toHaveAttribute('data-minimized', 'false')
    })
  },
  parameters: {
    docs: {
      description: {
        story: 'Minimize functionality allows keeping chat open but collapsed. Click header to restore.',
      },
    },
  },
}

/**
 * Interactive popup with simulated responses.
 * Fully functional demo showing real-time message handling.
 */
export const InteractiveDemo: Story = {
  render: () => {
    const [messages, setMessages] = useState<Message[]>([
      {
        id: '1',
        content: 'Hi! Try sending me a message. I will echo it back!',
        role: 'assistant',
        timestamp: new Date(),
      },
    ])
    const [isTyping, setIsTyping] = useState(false)

    const handleMessage = async (content: string) => {
      // Add user message
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        content,
        role: 'user',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, userMessage])

      // Simulate typing delay
      setIsTyping(true)
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Add assistant response
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: `You said: "${content}". This is a simulated response!`,
        role: 'assistant',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsTyping(false)
    }

    return (
      <div style={{ minHeight: '100vh', padding: '40px', background: '#f9fafb' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '20px', color: '#111827' }}>
          Interactive Demo
        </h1>
        <p style={{ marginBottom: '16px', lineHeight: '1.6', color: '#374151' }}>
          This is a fully interactive chat popup. Try sending messages!
        </p>
        <A2UIPopup
          position="bottom-right"
          defaultOpen
          chatProps={{
            title: 'Interactive Chat',
            messages,
            isTyping,
            showTimestamp: true,
            onMessage: handleMessage,
          }}
        />
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Fully interactive popup with simulated responses. Demonstrates real-time message handling.',
      },
    },
  },
}

/**
 * Accessibility testing story.
 * Demonstrates keyboard navigation, focus management, and screen reader support.
 */
export const AccessibilityDemo: Story = {
  args: {
    position: 'bottom-right',
    chatProps: {
      title: 'Accessible Popup',
      messages: sampleMessages,
      showTimestamp: true,
      onMessage: (message: string) => console.log('Message:', message),
    },
  },
  decorators: [PageDecorator],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()

    // Test trigger button accessibility
    const triggerButton = canvas.getByRole('button', { name: /open chat/i })
    await expect(triggerButton).toHaveAttribute('aria-expanded', 'false')

    // Open popup with keyboard
    await user.click(triggerButton)

    await waitFor(() => {
      expect(triggerButton).toHaveAttribute('aria-expanded', 'true')
    })

    // Verify dialog ARIA attributes
    const dialog = canvas.getByRole('dialog')
    await expect(dialog).toHaveAttribute('aria-modal', 'true')
    await expect(dialog).toHaveAttribute('aria-label', 'Chat popup')

    // Test focus trap - tab through elements
    await user.tab()
    const minimizeButton = canvas.getByRole('button', { name: /minimize/i })
    await expect(minimizeButton).toHaveFocus()

    await user.tab()
    const closeButton = canvas.getByRole('button', { name: /close/i })
    await expect(closeButton).toHaveFocus()

    // Test Escape key closes popup
    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(canvas.queryByRole('dialog')).not.toBeInTheDocument()
      expect(triggerButton).toHaveFocus()
    })
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates full keyboard navigation, focus trapping, and ARIA attributes. WCAG AA compliant.',
      },
    },
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'label', enabled: true },
          { id: 'aria-allowed-attr', enabled: true },
          { id: 'button-name', enabled: true },
          { id: 'region', enabled: true },
          { id: 'aria-dialog-name', enabled: true },
        ],
      },
    },
  },
}

/**
 * All positions comparison.
 * Shows how popup appears in each corner position.
 */
export const AllPositions: Story = {
  render: () => (
    <div style={{ position: 'relative', minHeight: '100vh', padding: '40px', background: '#f9fafb' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '20px', color: '#111827' }}>
          All Popup Positions
        </h1>
        <p style={{ color: '#374151' }}>
          Click any corner button to see popup positioning
        </p>
      </div>

      <A2UIPopup
        position="bottom-right"
        chatProps={{
          title: 'Bottom Right',
          placeholder: 'Bottom right corner',
          onMessage: (msg: string) => console.log('BR:', msg),
        }}
      />

      <A2UIPopup
        position="bottom-left"
        chatProps={{
          title: 'Bottom Left',
          placeholder: 'Bottom left corner',
          onMessage: (msg: string) => console.log('BL:', msg),
        }}
      />

      <A2UIPopup
        position="top-right"
        chatProps={{
          title: 'Top Right',
          placeholder: 'Top right corner',
          onMessage: (msg: string) => console.log('TR:', msg),
        }}
      />

      <A2UIPopup
        position="top-left"
        chatProps={{
          title: 'Top Left',
          placeholder: 'Top left corner',
          onMessage: (msg: string) => console.log('TL:', msg),
        }}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison of all four corner positions. Each popup can be independently opened.',
      },
    },
  },
}
