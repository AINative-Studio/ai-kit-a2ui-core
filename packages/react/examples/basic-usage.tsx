/**
 * Basic Usage Examples for @ainative/a2ui-react
 *
 * This file demonstrates how to use all three components
 */

import React from 'react'
import { A2UIChat, A2UIPopup, A2UISidebar } from '@ainative/a2ui-react'
import type { Message } from '@ainative/a2ui-react'

// Example 1: A2UIChat - Full Chat Interface
export function ChatExample() {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: '1',
      content: 'Hello! How can I help you today?',
      role: 'assistant',
      timestamp: new Date(),
    },
  ])

  const handleMessage = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content,
      role: 'user',
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: `You said: "${content}". How can I assist you further?`,
        role: 'assistant',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
    }, 1000)
  }

  return (
    <div style={{ width: '600px', height: '700px' }}>
      <A2UIChat
        title="AI Assistant"
        placeholder="Ask me anything..."
        theme="light"
        messages={messages}
        onMessage={handleMessage}
        showTimestamp
      />
    </div>
  )
}

// Example 2: A2UIPopup - Modal Chat
export function PopupExample() {
  return (
    <div>
      <h1>My Website</h1>
      <p>This is your main content...</p>

      <A2UIPopup
        position="bottom-right"
        theme="dark"
        chatProps={{
          title: 'Support Chat',
          placeholder: 'How can we help?',
          onMessage: (msg) => console.log('User asked:', msg),
        }}
      />
    </div>
  )
}

// Example 3: A2UISidebar - Slide-out Chat
export function SidebarExample() {
  return (
    <div>
      <A2UISidebar
        position="right"
        mode="overlay"
        showToggle
        width={400}
        chatProps={{
          title: 'Chat Assistant',
          placeholder: 'Type a message...',
          onMessage: (msg) => console.log('Message:', msg),
        }}
      />

      <main style={{ padding: '40px' }}>
        <h1>My Application</h1>
        <p>Your main content goes here...</p>
      </main>
    </div>
  )
}

// Example 4: Custom Trigger for Popup
export function CustomTriggerExample() {
  return (
    <A2UIPopup
      position="bottom-right"
      renderTrigger={({ onClick, isOpen }) => (
        <button
          onClick={onClick}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '16px 32px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}
        >
          {isOpen ? '✕ Close' : '💬 Chat with us'}
        </button>
      )}
      chatProps={{
        title: 'Customer Support',
        onMessage: (msg) => console.log(msg),
      }}
    />
  )
}

// Example 5: Controlled Sidebar
export function ControlledSidebarExample() {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>
        Toggle Sidebar
      </button>

      <A2UISidebar
        position="left"
        mode="push"
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        chatProps={{
          title: 'Navigation',
          onMessage: (msg) => console.log(msg),
        }}
      />

      <main>
        <h1>Controlled Sidebar</h1>
        <p>Sidebar state is controlled externally</p>
      </main>
    </div>
  )
}

// Example 6: With Tailwind CSS
export function TailwindExample() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <A2UIChat
          className="shadow-2xl rounded-2xl border border-gray-200"
          title="Styled Chat"
          theme="light"
          onMessage={(msg) => console.log(msg)}
        />
      </div>
    </div>
  )
}

// Example 7: Dark Mode
export function DarkModeExample() {
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light')

  return (
    <div style={{ background: theme === 'dark' ? '#111827' : '#ffffff', minHeight: '100vh', padding: '40px' }}>
      <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        Toggle Theme
      </button>

      <div style={{ marginTop: '20px', width: '600px', height: '700px' }}>
        <A2UIChat
          title="Theme-Aware Chat"
          theme={theme}
          onMessage={(msg) => console.log(msg)}
        />
      </div>
    </div>
  )
}

// Example 8: With Error Handling
export function ErrorHandlingExample() {
  const [error, setError] = React.useState<string>()

  const handleMessage = async (content: string) => {
    try {
      // Simulate API call
      if (content.toLowerCase().includes('error')) {
        throw new Error('API error occurred')
      }

      // Success
      setError(undefined)
      console.log('Message sent:', content)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  return (
    <div style={{ width: '600px', height: '700px' }}>
      <A2UIChat
        title="Chat with Error Handling"
        onMessage={handleMessage}
        error={error}
        renderError={(error) => (
          <div style={{ padding: '16px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px' }}>
            <strong>Error:</strong> {error}
          </div>
        )}
      />
    </div>
  )
}

// Example 9: Loading State
export function LoadingStateExample() {
  const [isTyping, setIsTyping] = React.useState(false)
  const [messages, setMessages] = React.useState<Message[]>([])

  const handleMessage = async (content: string) => {
    // Add user message
    setMessages((prev) => [...prev, {
      id: `${Date.now()}`,
      content,
      role: 'user',
      timestamp: new Date(),
    }])

    // Show typing indicator
    setIsTyping(true)

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Add AI response
    setMessages((prev) => [...prev, {
      id: `${Date.now()}`,
      content: 'This is the AI response',
      role: 'assistant',
      timestamp: new Date(),
    }])

    setIsTyping(false)
  }

  return (
    <div style={{ width: '600px', height: '700px' }}>
      <A2UIChat
        title="Chat with Loading State"
        messages={messages}
        onMessage={handleMessage}
        isTyping={isTyping}
      />
    </div>
  )
}

// Example 10: All Features Combined
export function FullFeaturedExample() {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: '1',
      content: 'Welcome! I am your AI assistant.',
      role: 'assistant',
      timestamp: new Date(Date.now() - 60000),
    },
  ])
  const [isTyping, setIsTyping] = React.useState(false)
  const [error, setError] = React.useState<string>()
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light')

  const handleMessage = async (content: string) => {
    setError(undefined)

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content,
      role: 'user',
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])

    setIsTyping(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: `I received your message: "${content}"`,
        role: 'assistant',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
    } catch (err) {
      setError('Failed to send message. Please try again.')
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div style={{ padding: '40px', background: theme === 'dark' ? '#111827' : '#f9fafb', minHeight: '100vh' }}>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          Toggle Theme
        </button>
      </div>

      <div style={{ width: '700px', height: '800px' }}>
        <A2UIChat
          title="Full-Featured Chat"
          placeholder="Type your message..."
          theme={theme}
          messages={messages}
          onMessage={handleMessage}
          isTyping={isTyping}
          error={error}
          showTimestamp
          maxLength={500}
          className="custom-chat"
        />
      </div>
    </div>
  )
}
