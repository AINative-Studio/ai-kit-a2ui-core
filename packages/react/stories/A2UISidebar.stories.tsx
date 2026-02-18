/// <reference types="vitest/globals" />
import type { Meta, StoryObj } from '@storybook/react'
import { within, waitFor } from '@storybook/testing-library'
import { userEvent } from '@testing-library/user-event'
import { A2UISidebar } from '../src/components/A2UISidebar'
import type { Message} from '../src/types'
import { useState } from 'react'

const meta: Meta<typeof A2UISidebar> = {
  title: 'Components/A2UISidebar',
  component: A2UISidebar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# A2UISidebar Component

A slide-in sidebar component with chat interface that supports:
- Left and right positioning
- Two layout modes: overlay (floats above content) and push (shifts content)
- Light and dark themes
- Configurable width (pixels or percentage)
- Optional toggle button
- Controlled or uncontrolled state management
- Escape key and overlay click to close
- Full keyboard navigation and accessibility (WCAG AA compliant)
- Focus trapping in overlay mode
- Body scroll lock in overlay mode

## Accessibility Features
- Full keyboard navigation with Tab/Shift+Tab
- Focus trapping in overlay mode
- Escape key closes sidebar
- ARIA attributes for screen readers (aria-label, aria-hidden)
- Sufficient color contrast (4.5:1 for text, 3:1 for UI)
- Focus visible indicators
- Screen reader announcements for state changes

## Use Cases
- Navigation menus with chat support
- Documentation sidebars
- Settings panels with AI assistance
- Multi-panel layouts
- Mobile-friendly navigation
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
      options: ['left', 'right'],
      description: 'Side of screen where sidebar appears',
      table: {
        type: { summary: "'left' | 'right'" },
        defaultValue: { summary: 'right' },
      },
    },
    mode: {
      control: 'select',
      options: ['overlay', 'push'],
      description: 'Layout behavior of the sidebar',
      table: {
        type: { summary: "'overlay' | 'push'" },
        defaultValue: { summary: 'overlay' },
      },
    },
    theme: {
      control: 'select',
      options: ['light', 'dark'],
      description: 'Color theme for the sidebar',
      table: {
        type: { summary: "'light' | 'dark'" },
        defaultValue: { summary: 'light' },
      },
    },
    width: {
      control: 'number',
      description: 'Sidebar width in pixels (or pass string for %, rem, etc)',
      table: {
        type: { summary: 'number | string' },
        defaultValue: { summary: 400 },
      },
    },
    showToggle: {
      control: 'boolean',
      description: 'Display a toggle button to open/close sidebar',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Initial open state (uncontrolled)',
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
type Story = StoryObj<typeof A2UISidebar>

// Sample messages for demonstrations
const sampleMessages: Message[] = [
  {
    id: '1',
    content: 'Hello! I am your sidebar assistant.',
    role: 'assistant',
    timestamp: new Date('2024-01-01T10:00:00'),
  },
  {
    id: '2',
    content: 'Can you help me navigate?',
    role: 'user',
    timestamp: new Date('2024-01-01T10:00:30'),
  },
  {
    id: '3',
    content: 'Of course! I can help you find what you need. What are you looking for?',
    role: 'assistant',
    timestamp: new Date('2024-01-01T10:01:00'),
  },
]

// Decorator with page content
const PageContent = () => (
  <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
    <h1 style={{ fontSize: '32px', marginBottom: '20px', color: '#111827' }}>
      Page Content
    </h1>
    <p style={{ marginBottom: '16px', lineHeight: '1.6', color: '#374151' }}>
      This is the main page content. Toggle the sidebar to see how it interacts with the layout.
    </p>
    <p style={{ marginBottom: '16px', lineHeight: '1.6', color: '#374151' }}>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
      labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
      laboris nisi ut aliquip ex ea commodo consequat.
    </p>
    <p style={{ marginBottom: '16px', lineHeight: '1.6', color: '#374151' }}>
      Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
      pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
      mollit anim id est laborum.
    </p>
    <div style={{ marginTop: '32px', padding: '20px', background: '#f3f4f6', borderRadius: '8px' }}>
      <h2 style={{ fontSize: '20px', marginBottom: '12px', color: '#111827' }}>Example Section</h2>
      <p style={{ lineHeight: '1.6', color: '#374151' }}>
        This demonstrates how page content behaves with the sidebar. In overlay mode, content stays
        in place while sidebar floats over it. In push mode, content shifts to accommodate the sidebar.
      </p>
    </div>
  </div>
)

const DarkPageContent = () => (
  <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
    <h1 style={{ fontSize: '32px', marginBottom: '20px', color: '#f1f5f9' }}>
      Dark Mode Content
    </h1>
    <p style={{ marginBottom: '16px', lineHeight: '1.6', color: '#cbd5e1' }}>
      This demonstrates the sidebar in dark theme matching the page design.
    </p>
    <p style={{ marginBottom: '16px', lineHeight: '1.6', color: '#cbd5e1' }}>
      All colors maintain WCAG AA contrast ratios for accessibility in dark mode.
    </p>
  </div>
)

/**
 * Right sidebar in overlay mode - most common configuration.
 * Floats over page content with backdrop.
 */
export const RightSideOverlay: Story = {
  args: {
    position: 'right',
    mode: 'overlay',
    showToggle: true,
    chatProps: {
      title: 'Chat Assistant',
      placeholder: 'Type a message...',
      onMessage: (message: string) => console.log('Message sent:', message),
    },
  },
  render: (args) => (
    <>
      <A2UISidebar {...args} />
      <PageContent />
    </>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Verify toggle button exists
    const toggleButton = canvas.getByRole('button', { name: /toggle.*sidebar/i })
    await expect(toggleButton).toBeInTheDocument()
    await expect(toggleButton).toHaveAttribute('aria-expanded', 'false')
  },
  parameters: {
    docs: {
      description: {
        story: 'Right-side overlay sidebar - the most common configuration. Floats over content with backdrop.',
      },
    },
  },
}

/**
 * Left sidebar in overlay mode.
 * Alternative placement for navigation or content browsing.
 */
export const LeftSideOverlay: Story = {
  args: {
    position: 'left',
    mode: 'overlay',
    showToggle: true,
    chatProps: {
      title: 'Support',
      placeholder: 'Ask us anything...',
      onMessage: (message: string) => console.log('Message sent:', message),
    },
  },
  render: (args) => (
    <>
      <A2UISidebar {...args} />
      <PageContent />
    </>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Left-side overlay sidebar - good for navigation menus or content browsing.',
      },
    },
  },
}

/**
 * Right sidebar in push mode.
 * Shifts page content to make room for sidebar.
 */
export const RightSidePush: Story = {
  args: {
    position: 'right',
    mode: 'push',
    showToggle: true,
    chatProps: {
      title: 'Chat',
      placeholder: 'Send a message...',
      onMessage: (message: string) => console.log('Message sent:', message),
    },
  },
  render: (args) => (
    <>
      <A2UISidebar {...args} />
      <PageContent />
    </>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()

    // Open sidebar
    const toggleButton = canvas.getByRole('button', { name: /toggle.*sidebar/i })
    await user.click(toggleButton)

    // Verify no overlay backdrop in push mode
    await waitFor(() => {
      expect(canvas.queryByTestId('sidebar-overlay')).not.toBeInTheDocument()
    })

    // Verify sidebar is visible
    const sidebar = canvas.getByRole('complementary')
    await expect(sidebar).toBeVisible()
    await expect(sidebar).toHaveAttribute('data-mode', 'push')
  },
  parameters: {
    docs: {
      description: {
        story: 'Push mode sidebar - shifts page content aside. No overlay backdrop, content remains interactive.',
      },
    },
  },
}

/**
 * Left sidebar in push mode.
 * Content shifts right to accommodate sidebar.
 */
export const LeftSidePush: Story = {
  args: {
    position: 'left',
    mode: 'push',
    showToggle: true,
    chatProps: {
      title: 'Navigation',
      placeholder: 'Search or ask...',
      onMessage: (message: string) => console.log('Message sent:', message),
    },
  },
  render: (args) => (
    <>
      <A2UISidebar {...args} />
      <PageContent />
    </>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Left-side push mode - content shifts right. Ideal for persistent navigation.',
      },
    },
  },
}

/**
 * Dark theme sidebar with dark page.
 * Maintains WCAG AA contrast in dark mode.
 */
export const DarkTheme: Story = {
  args: {
    position: 'right',
    mode: 'overlay',
    theme: 'dark',
    showToggle: true,
    chatProps: {
      title: 'Dark Mode Chat',
      placeholder: 'Message us...',
      onMessage: (message: string) => console.log('Message sent:', message),
    },
  },
  render: (args) => (
    <div style={{ minHeight: '100vh', background: '#0f172a' }}>
      <A2UISidebar {...args} />
      <DarkPageContent />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()

    // Open sidebar
    const toggleButton = canvas.getByRole('button', { name: /toggle.*sidebar/i })
    await user.click(toggleButton)

    // Verify dark theme applied
    await waitFor(() => {
      const sidebar = canvas.getByRole('complementary')
      expect(sidebar).toHaveAttribute('data-theme', 'dark')
    })
  },
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'Dark theme with WCAG AA compliant contrast. Matches dark mode interfaces.',
      },
    },
  },
}

/**
 * Sidebar open by default.
 * Useful for content-heavy pages or documentation.
 */
export const DefaultOpen: Story = {
  args: {
    position: 'right',
    mode: 'overlay',
    defaultOpen: true,
    chatProps: {
      title: 'Welcome Chat',
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
  render: (args) => (
    <>
      <A2UISidebar {...args} />
      <PageContent />
    </>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Verify sidebar is open by default
    const sidebar = canvas.getByRole('complementary')
    await expect(sidebar).toBeVisible()
    await expect(sidebar).toHaveAttribute('data-open', 'true')

    // Verify welcome message
    await expect(canvas.getByText('Welcome! How can we help you today?')).toBeInTheDocument()
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar opens automatically - useful for proactive engagement or documentation.',
      },
    },
  },
}

/**
 * Wide sidebar at 500px.
 * More space for rich content or detailed interactions.
 */
export const CustomWidth: Story = {
  args: {
    position: 'right',
    mode: 'overlay',
    width: 500,
    showToggle: true,
    chatProps: {
      title: 'Wide Sidebar',
      placeholder: 'Type here...',
      onMessage: (message: string) => console.log('Message sent:', message),
    },
  },
  render: (args) => (
    <>
      <A2UISidebar {...args} />
      <PageContent />
    </>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()

    // Open sidebar
    const toggleButton = canvas.getByRole('button', { name: /toggle.*sidebar/i })
    await user.click(toggleButton)

    // Verify custom width
    await waitFor(() => {
      const sidebar = canvas.getByRole('complementary')
      expect(sidebar).toHaveStyle({ width: '500px' })
    })
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom width sidebar (500px) - provides more space for detailed content.',
      },
    },
  },
}

/**
 * Narrow sidebar at 300px.
 * Compact design for simple interactions.
 */
export const NarrowWidth: Story = {
  args: {
    position: 'right',
    mode: 'overlay',
    width: 300,
    showToggle: true,
    chatProps: {
      title: 'Compact',
      placeholder: 'Message...',
      onMessage: (message: string) => console.log('Message sent:', message),
    },
  },
  render: (args) => (
    <>
      <A2UISidebar {...args} />
      <PageContent />
    </>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()

    // Open sidebar
    const toggleButton = canvas.getByRole('button', { name: /toggle.*sidebar/i })
    await user.click(toggleButton)

    // Verify narrow width
    await waitFor(() => {
      const sidebar = canvas.getByRole('complementary')
      expect(sidebar).toHaveStyle({ width: '300px' })
    })
  },
  parameters: {
    docs: {
      description: {
        story: 'Narrow sidebar (300px) - compact design for simple interactions or mobile.',
      },
    },
  },
}

/**
 * Sidebar with conversation history.
 * Shows typical chat interaction with timestamps.
 */
export const WithInitialMessages: Story = {
  args: {
    position: 'right',
    mode: 'overlay',
    defaultOpen: true,
    showToggle: true,
    chatProps: {
      title: 'Support Chat',
      messages: sampleMessages,
      showTimestamp: true,
      onMessage: (message: string) => console.log('Message sent:', message),
    },
  },
  render: (args) => (
    <>
      <A2UISidebar {...args} />
      <PageContent />
    </>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Verify all messages displayed
    await expect(canvas.getByText('Hello! I am your sidebar assistant.')).toBeInTheDocument()
    await expect(canvas.getByText('Can you help me navigate?')).toBeInTheDocument()

    // Verify timestamps
    const timestamps = canvasElement.querySelectorAll('[class*="messageTimestamp"]')
    expect(timestamps.length).toBeGreaterThan(0)
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar with existing conversation and timestamps for context.',
      },
    },
  },
}

/**
 * Controlled sidebar state.
 * Parent component manages open/close state.
 */
export const ControlledState: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true)

    return (
      <>
        <div style={{ padding: '20px', background: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              padding: '8px 16px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            {isOpen ? 'Close' : 'Open'} Sidebar (Controlled)
          </button>
        </div>
        <A2UISidebar
          position="right"
          mode="overlay"
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          chatProps={{
            title: 'Controlled Sidebar',
            placeholder: 'This sidebar state is controlled externally',
            onMessage: (message: string) => console.log('Message:', message),
          }}
        />
        <PageContent />
      </>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()

    // Verify sidebar is open (controlled to true)
    const sidebar = canvas.getByRole('complementary')
    await expect(sidebar).toBeVisible()

    // Click external control button
    const controlButton = canvas.getByText(/Close.*Sidebar/i)
    await user.click(controlButton)

    // Note: In controlled mode, parent must update state
    // The sidebar calls onClose but doesn't close itself
  },
  parameters: {
    docs: {
      description: {
        story: 'Controlled sidebar where parent component manages state. Use isOpen prop and onClose callback.',
      },
    },
  },
}

/**
 * Interactive sidebar with simulated responses.
 * Fully functional demo of real-time messaging.
 */
export const InteractiveDemo: Story = {
  render: () => {
    const [messages, setMessages] = useState<Message[]>([
      {
        id: '1',
        content: 'Hi! I am your sidebar assistant. Try sending me a message!',
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
        content: `You said: "${content}". This is a simulated response from the sidebar!`,
        role: 'assistant',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsTyping(false)
    }

    return (
      <>
        <A2UISidebar
          position="right"
          mode="overlay"
          defaultOpen
          showToggle
          chatProps={{
            title: 'Interactive Sidebar',
            messages,
            isTyping,
            showTimestamp: true,
            onMessage: handleMessage,
          }}
        />
        <div style={{ padding: '40px' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>Interactive Demo</h1>
          <p style={{ lineHeight: '1.6' }}>
            This sidebar is fully interactive. Try sending messages to see real-time responses!
          </p>
        </div>
      </>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Fully interactive sidebar with simulated responses. Demonstrates real-time message handling.',
      },
    },
  },
}

/**
 * Accessibility demonstration.
 * Shows keyboard navigation, focus management, and ARIA support.
 */
export const AccessibilityDemo: Story = {
  args: {
    position: 'right',
    mode: 'overlay',
    showToggle: true,
    chatProps: {
      title: 'Accessible Sidebar',
      messages: sampleMessages,
      showTimestamp: true,
      onMessage: (message: string) => console.log('Message:', message),
    },
  },
  render: (args) => (
    <>
      <A2UISidebar {...args} />
      <PageContent />
    </>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()

    // Test toggle button accessibility
    const toggleButton = canvas.getByRole('button', { name: /toggle.*sidebar/i })
    await expect(toggleButton).toHaveAttribute('aria-expanded', 'false')

    // Open sidebar with keyboard
    await user.click(toggleButton)

    await waitFor(() => {
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true')
    })

    // Verify sidebar ARIA attributes
    const sidebar = canvas.getByRole('complementary')
    await expect(sidebar).toHaveAttribute('aria-label')
    await expect(sidebar).toHaveAttribute('aria-hidden', 'false')

    // Test focus trap - tab through elements
    await user.tab()
    const closeButton = canvas.getByRole('button', { name: /close/i })
    await expect(closeButton).toHaveFocus()

    // Test Escape key
    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(sidebar).toHaveAttribute('aria-hidden', 'true')
    })
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates keyboard navigation, focus trapping, and ARIA attributes. WCAG AA compliant.',
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
 * Body scroll lock demonstration.
 * Shows how overlay mode prevents page scrolling.
 */
export const BodyScrollLock: Story = {
  args: {
    position: 'right',
    mode: 'overlay',
    showToggle: true,
    chatProps: {
      title: 'Scroll Lock Demo',
      messages: sampleMessages,
      onMessage: (message: string) => console.log('Message:', message),
    },
  },
  render: (args) => (
    <>
      <A2UISidebar {...args} />
      <div style={{ padding: '40px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>Body Scroll Lock</h1>
        <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
          In overlay mode, opening the sidebar locks body scroll to prevent background scrolling.
        </p>
        {Array.from({ length: 20 }).map((_, i) => (
          <p key={i} style={{ marginBottom: '16px', lineHeight: '1.6' }}>
            Paragraph {i + 1}: This content creates a scrollable page. Try opening the sidebar -
            you will not be able to scroll the background content while the sidebar is open.
          </p>
        ))}
      </div>
    </>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()

    const originalOverflow = document.body.style.overflow

    // Open sidebar
    const toggleButton = canvas.getByRole('button', { name: /toggle.*sidebar/i })
    await user.click(toggleButton)

    // Verify body scroll is locked
    await waitFor(() => {
      expect(document.body.style.overflow).toBe('hidden')
    })

    // Close sidebar
    await user.keyboard('{Escape}')

    // Verify body scroll is restored
    await waitFor(() => {
      expect(document.body.style.overflow).toBe(originalOverflow)
    })
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates body scroll locking in overlay mode. Background content becomes unscrollable when sidebar is open.',
      },
    },
  },
}

/**
 * Comparison of overlay vs push modes.
 * Shows behavioral differences side by side.
 */
export const ModeComparison: Story = {
  render: () => {
    const [overlayOpen, setOverlayOpen] = useState(false)
    const [pushOpen, setPushOpen] = useState(false)

    return (
      <div style={{ minHeight: '100vh' }}>
        <div style={{ padding: '40px', background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>Overlay vs Push Mode</h1>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
            <button
              onClick={() => setOverlayOpen(!overlayOpen)}
              style={{
                padding: '8px 16px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Toggle Overlay (Right)
            </button>
            <button
              onClick={() => setPushOpen(!pushOpen)}
              style={{
                padding: '8px 16px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Toggle Push (Left)
            </button>
          </div>
          <p style={{ color: '#6b7280' }}>
            Overlay floats above content with backdrop. Push shifts content aside with no backdrop.
          </p>
        </div>

        <A2UISidebar
          position="right"
          mode="overlay"
          isOpen={overlayOpen}
          onClose={() => setOverlayOpen(false)}
          chatProps={{
            title: 'Overlay Mode',
            placeholder: 'Overlay sidebar...',
            onMessage: (msg: string) => console.log('Overlay:', msg),
          }}
        />

        <A2UISidebar
          position="left"
          mode="push"
          isOpen={pushOpen}
          onClose={() => setPushOpen(false)}
          chatProps={{
            title: 'Push Mode',
            placeholder: 'Push sidebar...',
            onMessage: (msg: string) => console.log('Push:', msg),
          }}
        />

        <PageContent />
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Compare overlay (right) and push (left) modes. Notice how each affects the page layout differently.',
      },
    },
  },
}
