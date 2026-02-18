/// <reference types="vitest/globals" />
import type { Meta, StoryObj } from '@storybook/react'
import { within, waitFor } from '@storybook/testing-library'
import { userEvent } from '@testing-library/user-event'
import { A2UIChat } from '../src/components/A2UIChat'
import type { Message } from '../src/types'
import React, { useState } from 'react'

const meta: Meta<typeof A2UIChat> = {
  title: 'Components/A2UIChat',
  component: A2UIChat,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# A2UIChat Component

A fully-featured chat interface component with support for:
- Light and dark themes
- Message history with timestamps
- Typing indicators
- Error states
- Custom styling
- Accessibility (WCAG AA compliant)
- Virtual scrolling for performance
- File attachments (via metadata)

## Accessibility Features
- Full keyboard navigation support
- Screen reader friendly with ARIA labels
- Sufficient color contrast (4.5:1 for text, 3:1 for UI)
- Focus indicators on all interactive elements
- Respects prefers-reduced-motion
- High contrast mode support
        `,
      },
    },
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
          {
            id: 'label',
            enabled: true,
          },
          {
            id: 'aria-allowed-attr',
            enabled: true,
          },
        ],
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    theme: {
      control: 'select',
      options: ['light', 'dark'],
      description: 'Color theme for the chat interface',
      table: {
        type: { summary: "'light' | 'dark'" },
        defaultValue: { summary: 'light' },
      },
    },
    title: {
      control: 'text',
      description: 'Title displayed in the chat header',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'Chat' },
      },
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text for the message input',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'Type a message...' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the input and send button',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    isTyping: {
      control: 'boolean',
      description: 'Show typing indicator animation',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    showTimestamp: {
      control: 'boolean',
      description: 'Display timestamps on messages',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    maxLength: {
      control: 'number',
      description: 'Maximum character length for messages',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: 'undefined' },
      },
    },
    virtualScrolling: {
      control: 'boolean',
      description: 'Enable virtual scrolling for large message lists',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    error: {
      control: 'text',
      description: 'Error message to display',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'undefined' },
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof A2UIChat>

// Helper function to generate messages
const generateMessages = (count: number): Message[] => {
  const now = new Date()

  return Array.from({ length: count }, (_, i) => ({
    id: `msg-${i}`,
    content: i % 10 === 0 && i > 0
      ? `This is a longer message with more content to test text wrapping and display of multi-line messages. Message number ${i + 1}.`
      : `Message ${i + 1}`,
    role: i % 7 === 0 ? 'system' : (i % 2 === 0 ? 'user' : 'assistant'),
    timestamp: new Date(now.getTime() - (count - i) * 60000),
    metadata: i % 5 === 0 ? { attachment: true, fileName: `file-${i}.pdf` } : undefined,
  }))
}

// Sample message sets
const sampleMessages: Message[] = [
  {
    id: '1',
    content: 'Hello! How can I help you today?',
    role: 'assistant',
    timestamp: new Date('2024-01-01T10:00:00'),
  },
  {
    id: '2',
    content: 'I need help with my account settings.',
    role: 'user',
    timestamp: new Date('2024-01-01T10:00:30'),
  },
  {
    id: '3',
    content: 'I would be happy to help you with your account settings. What specific aspect would you like to modify?',
    role: 'assistant',
    timestamp: new Date('2024-01-01T10:01:00'),
  },
]

// Story Decorator for consistent sizing
const DefaultDecorator = (Story: React.ComponentType) => (
  <div style={{ width: '600px', height: '700px' }}>
    <Story />
  </div>
)

const DarkDecorator = (Story: React.ComponentType) => (
  <div style={{ width: '600px', height: '700px', background: '#0f172a', padding: '20px' }}>
    <Story />
  </div>
)

/**
 * Default chat interface with no messages.
 * This is the starting state users will see.
 */
export const Default: Story = {
  args: {
    title: 'Chat Assistant',
    placeholder: 'Type a message...',
    onMessage: (message: string) => {
      console.log('Message sent:', message)
    },
  },
  decorators: [DefaultDecorator],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Verify chat interface is rendered
    await expect(canvas.getByRole('region', { name: /chat/i })).toBeInTheDocument()
    await expect(canvas.getByText('Chat Assistant')).toBeInTheDocument()
    await expect(canvas.getByPlaceholderText('Type a message...')).toBeInTheDocument()

    // Verify send button is present and disabled (no input)
    const sendButton = canvas.getByRole('button', { name: /send/i })
    await expect(sendButton).toBeInTheDocument()
    await expect(sendButton).toBeDisabled()
  },
}

/**
 * Empty state when no messages have been sent yet.
 * Shows the clean interface ready for interaction.
 */
export const EmptyState: Story = {
  args: {
    title: 'Start a Conversation',
    placeholder: 'Ask me anything...',
    messages: [],
    onMessage: (message: string) => {
      console.log('First message:', message)
    },
  },
  decorators: [DefaultDecorator],
  parameters: {
    docs: {
      description: {
        story: 'The empty state shown when no messages exist. Ideal starting point for new conversations.',
      },
    },
  },
}

/**
 * Light theme (default) with sample conversation.
 * Uses high contrast colors optimized for readability.
 */
export const LightTheme: Story = {
  args: {
    title: 'Light Theme Chat',
    theme: 'light',
    messages: sampleMessages,
    onMessage: (message: string) => {
      console.log('Message sent:', message)
    },
  },
  decorators: [DefaultDecorator],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Verify theme is applied
    const chatContainer = canvasElement.querySelector('[data-theme="light"]')
    await expect(chatContainer).toBeInTheDocument()

    // Verify messages are displayed
    await expect(canvas.getByText('Hello! How can I help you today?')).toBeInTheDocument()
  },
  parameters: {
    docs: {
      description: {
        story: 'Light theme with WCAG AA compliant colors. Default theme for most use cases.',
      },
    },
  },
}

/**
 * Dark theme with sample conversation.
 * Optimized for low-light environments with proper contrast ratios.
 */
export const DarkTheme: Story = {
  args: {
    title: 'Dark Theme Chat',
    theme: 'dark',
    messages: sampleMessages,
    onMessage: (message: string) => {
      console.log('Message sent:', message)
    },
  },
  decorators: [DarkDecorator],
  play: async ({ canvasElement }) => {
    // Verify theme is applied
    const chatContainer = canvasElement.querySelector('[data-theme="dark"]')
    await expect(chatContainer).toBeInTheDocument()
  },
  parameters: {
    docs: {
      description: {
        story: 'Dark theme optimized for low-light environments. Maintains WCAG AA contrast ratios.',
      },
    },
  },
}

/**
 * Chat with custom Tailwind CSS classes applied.
 * Demonstrates extensibility through className prop.
 */
export const CustomStyling: Story = {
  args: {
    title: 'Custom Styled Chat',
    messages: sampleMessages,
    className: 'shadow-2xl border-4 border-blue-500',
    onMessage: (message: string) => {
      console.log('Message sent:', message)
    },
  },
  decorators: [DefaultDecorator],
  parameters: {
    docs: {
      description: {
        story: 'Custom styling using Tailwind CSS classes. Component supports external styling via className prop.',
      },
    },
  },
}

/**
 * Chat with 10 messages for typical conversation length.
 * Tests basic scrolling and message display.
 */
export const SmallConversation: Story = {
  args: {
    title: 'Small Conversation (10 messages)',
    messages: generateMessages(10),
    showTimestamp: true,
    onMessage: (message: string) => {
      console.log('Message sent:', message)
    },
  },
  decorators: [DefaultDecorator],
  parameters: {
    docs: {
      description: {
        story: 'Small conversation with 10 messages. Shows typical chat interaction length.',
      },
    },
  },
}

/**
 * Chat with 100 messages testing scrolling performance.
 * Uses standard rendering without virtual scrolling.
 */
export const MediumConversation: Story = {
  args: {
    title: 'Medium Conversation (100 messages)',
    messages: generateMessages(100),
    showTimestamp: true,
    onMessage: (message: string) => {
      console.log('Message sent:', message)
    },
  },
  decorators: [DefaultDecorator],
  parameters: {
    docs: {
      description: {
        story: 'Medium conversation with 100 messages. Tests scrolling performance with standard rendering.',
      },
    },
  },
}

/**
 * Chat with 1000 messages using virtual scrolling.
 * Demonstrates performance optimization for large conversations.
 */
export const LargeConversation: Story = {
  args: {
    title: 'Large Conversation (1000 messages)',
    messages: generateMessages(1000),
    virtualScrolling: true,
    showTimestamp: true,
    onMessage: (message: string) => {
      console.log('Message sent:', message)
    },
  },
  decorators: [DefaultDecorator],
  parameters: {
    docs: {
      description: {
        story: 'Large conversation with 1000 messages using virtual scrolling for optimal performance. Auto-scrolls to latest message.',
      },
    },
  },
}

/**
 * Messages with timestamps displayed.
 * Shows temporal context for each message.
 */
export const WithTimestamps: Story = {
  args: {
    title: 'Chat with Timestamps',
    messages: sampleMessages,
    showTimestamp: true,
    onMessage: (message: string) => {
      console.log('Message sent:', message)
    },
  },
  decorators: [DefaultDecorator],
  play: async ({ canvasElement }) => {
    // Verify timestamps are displayed
    const timestamps = canvasElement.querySelectorAll('[class*="messageTimestamp"]')
    await expect(timestamps.length).toBeGreaterThan(0)
  },
  parameters: {
    docs: {
      description: {
        story: 'Messages with timestamps showing when each message was sent.',
      },
    },
  },
}

/**
 * Typing indicator animation while assistant is composing response.
 * Provides visual feedback during processing.
 */
export const TypingIndicator: Story = {
  args: {
    title: 'Assistant is typing...',
    messages: sampleMessages,
    isTyping: true,
    onMessage: (message: string) => {
      console.log('Message sent:', message)
    },
  },
  decorators: [DefaultDecorator],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Verify typing indicator is present
    await expect(canvas.getByText(/typing/i)).toBeInTheDocument()

    // Verify typing dots animation elements
    const typingDots = canvasElement.querySelectorAll('[class*="typingDot"]')
    await expect(typingDots.length).toBe(3)
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows animated typing indicator when assistant is composing a response. Includes screen reader text.',
      },
    },
  },
}

/**
 * Error state with error message displayed.
 * Shows connection or processing errors to users.
 */
export const ErrorState: Story = {
  args: {
    title: 'Chat with Error',
    messages: sampleMessages,
    error: 'Failed to send message. Please check your connection and try again.',
    onMessage: (message: string) => {
      console.log('Message sent:', message)
    },
  },
  decorators: [DefaultDecorator],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Verify error is displayed
    const errorAlert = canvas.getByRole('alert')
    await expect(errorAlert).toBeInTheDocument()
    await expect(errorAlert).toHaveTextContent('Failed to send message')
  },
  parameters: {
    docs: {
      description: {
        story: 'Error state showing connection or processing errors. Uses ARIA alert role for accessibility.',
      },
    },
  },
}

/**
 * Custom error renderer with formatting.
 * Demonstrates error customization capabilities.
 */
export const CustomErrorRenderer: Story = {
  args: {
    title: 'Custom Error Display',
    messages: sampleMessages,
    error: 'Network timeout',
    renderError: (error: string) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <strong>Error:</strong> {error}
      </div>
    ),
    onMessage: (message: string) => {
      console.log('Message sent:', message)
    },
  },
  decorators: [DefaultDecorator],
  parameters: {
    docs: {
      description: {
        story: 'Custom error renderer allowing full control over error display styling and content.',
      },
    },
  },
}

/**
 * Loading state while waiting for response.
 * Disables input during async operations.
 */
export const LoadingState: Story = {
  args: {
    title: 'Processing...',
    messages: sampleMessages,
    isTyping: true,
    disabled: false,
    onMessage: async (message: string) => {
      console.log('Message sent:', message)
      // Simulates async operation
      await new Promise(resolve => setTimeout(resolve, 2000))
    },
  },
  decorators: [DefaultDecorator],
  parameters: {
    docs: {
      description: {
        story: 'Loading state shown while processing async message operations. Input is temporarily disabled.',
      },
    },
  },
}

/**
 * Disabled chat interface.
 * Prevents user interaction when chat is unavailable.
 */
export const DisabledState: Story = {
  args: {
    title: 'Chat Unavailable',
    messages: sampleMessages,
    disabled: true,
    placeholder: 'Chat is currently unavailable',
    onMessage: (message: string) => {
      console.log('Message sent:', message)
    },
  },
  decorators: [DefaultDecorator],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Verify input and button are disabled
    const input = canvas.getByRole('textbox', { name: /message/i })
    const sendButton = canvas.getByRole('button', { name: /send/i })

    await expect(input).toBeDisabled()
    await expect(sendButton).toBeDisabled()
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled state preventing user interaction. Useful when chat service is unavailable.',
      },
    },
  },
}

/**
 * Chat with maximum message length enforced.
 * Prevents messages longer than specified character count.
 */
export const WithMaxLength: Story = {
  args: {
    title: 'Limited Message Length',
    messages: sampleMessages,
    maxLength: 100,
    placeholder: 'Type a message (max 100 characters)...',
    onMessage: (message: string) => {
      console.log('Message sent:', message)
    },
  },
  decorators: [DefaultDecorator],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()

    const input = canvas.getByRole('textbox', { name: /message/i })

    // Try to type more than maxLength
    await user.type(input, 'A'.repeat(150))

    // Verify input is truncated to maxLength
    await waitFor(() => {
      expect(input).toHaveValue('A'.repeat(100))
    })
  },
  parameters: {
    docs: {
      description: {
        story: 'Enforces maximum message length. Automatically truncates input at specified character limit.',
      },
    },
  },
}

/**
 * Messages with file attachments in metadata.
 * Shows how to handle file upload indicators.
 */
export const WithFileAttachments: Story = {
  args: {
    title: 'Chat with Attachments',
    messages: [
      {
        id: '1',
        content: 'Here is the document you requested.',
        role: 'assistant',
        timestamp: new Date('2024-01-01T10:00:00'),
      },
      {
        id: '2',
        content: 'I have uploaded the report.',
        role: 'user',
        timestamp: new Date('2024-01-01T10:00:30'),
        metadata: {
          attachment: true,
          fileName: 'quarterly-report.pdf',
          fileSize: 245678,
        },
      },
      {
        id: '3',
        content: 'Thank you! I have received the file.',
        role: 'assistant',
        timestamp: new Date('2024-01-01T10:01:00'),
      },
    ],
    renderMessage: (message: Message): React.ReactNode => (
      <div
        key={message.id}
        style={{
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '80%',
          padding: '12px 16px',
          borderRadius: '12px',
          alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
          backgroundColor: message.role === 'user' ? '#3b82f6' : '#f3f4f6',
          color: message.role === 'user' ? '#ffffff' : '#1f2937',
        }}
      >
        <div>{message.content}</div>
        {message.metadata?.attachment ? (
          <div style={{
            marginTop: '8px',
            padding: '8px',
            backgroundColor: 'rgba(0,0,0,0.1)',
            borderRadius: '6px',
            fontSize: '14px',
          }}>
            📎 {String(message.metadata.fileName ?? '')}
          </div>
        ) : null}
      </div>
    ),
    onMessage: (message: string) => {
      console.log('Message sent:', message)
    },
  },
  decorators: [DefaultDecorator],
  parameters: {
    docs: {
      description: {
        story: 'Custom message renderer showing file attachments via metadata. Demonstrates extensibility for rich content.',
      },
    },
  },
}

/**
 * Custom message renderer with user avatars.
 * Shows how to customize message appearance completely.
 */
export const CustomMessageRenderer: Story = {
  args: {
    title: 'Custom Message Design',
    messages: sampleMessages,
    renderMessage: (message: Message): React.ReactNode => (
      <div
        key={message.id}
        style={{
          display: 'flex',
          gap: '12px',
          alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
          flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
          maxWidth: '80%',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: message.role === 'user' ? '#3b82f6' : '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '14px',
            flexShrink: 0,
          }}
        >
          {message.role === 'user' ? 'U' : 'A'}
        </div>
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '12px',
            backgroundColor: message.role === 'user' ? '#eff6ff' : '#f3f4f6',
            color: '#1f2937',
          }}
        >
          {message.content}
        </div>
      </div>
    ),
    onMessage: (message: string) => {
      console.log('Message sent:', message)
    },
  },
  decorators: [DefaultDecorator],
  parameters: {
    docs: {
      description: {
        story: 'Fully custom message renderer with avatars. Demonstrates complete control over message presentation.',
      },
    },
  },
}

/**
 * Interactive chat with state management.
 * Demonstrates real-time message updates and interaction.
 */
export const InteractiveChat: Story = {
  render: () => {
    const [messages, setMessages] = useState<Message[]>([
      {
        id: '1',
        content: 'Hi! Try sending me a message.',
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

      // Simulate assistant typing
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
      <A2UIChat
        title="Interactive Demo"
        messages={messages}
        isTyping={isTyping}
        onMessage={handleMessage}
        showTimestamp
      />
    )
  },
  decorators: [DefaultDecorator],
  parameters: {
    docs: {
      description: {
        story: 'Fully interactive chat demonstrating real-time message handling with simulated responses.',
      },
    },
  },
}

/**
 * Accessibility test story.
 * Demonstrates full keyboard navigation and screen reader support.
 */
export const AccessibilityDemo: Story = {
  args: {
    title: 'Accessible Chat Interface',
    messages: sampleMessages,
    showTimestamp: true,
    onMessage: (message: string) => {
      console.log('Message sent:', message)
    },
  },
  decorators: [DefaultDecorator],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()

    // Test keyboard navigation
    await user.tab()
    const input = canvas.getByRole('textbox', { name: /message/i })
    await expect(input).toHaveFocus()

    // Type a message
    await user.type(input, 'Accessibility test')

    // Tab to send button
    await user.tab()
    const sendButton = canvas.getByRole('button', { name: /send/i })
    await expect(sendButton).toHaveFocus()

    // Verify ARIA labels
    await expect(canvas.getByRole('region', { name: /chat/i })).toBeInTheDocument()

    // Test Escape key to clear
    await user.click(input)
    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(input).toHaveValue('')
    })
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates full keyboard navigation, ARIA labels, and screen reader support. WCAG AA compliant.',
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
}

/**
 * Responsive design demo.
 * Shows how chat adapts to different viewport sizes.
 */
export const ResponsiveDesign: Story = {
  args: {
    title: 'Responsive Chat',
    messages: sampleMessages,
    showTimestamp: true,
    onMessage: (message: string) => {
      console.log('Message sent:', message)
    },
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Responsive design that adapts to mobile, tablet, and desktop viewports. Try changing the viewport size.',
      },
    },
  },
}
