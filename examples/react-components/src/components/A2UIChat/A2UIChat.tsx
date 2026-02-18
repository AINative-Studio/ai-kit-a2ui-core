import { useState, FormEvent } from 'react'
import './A2UIChat.module.css'

export interface A2UIChatProps {
  title?: string
  placeholder?: string
  theme?: 'light' | 'dark' | 'auto'
  agentUrl: string
  className?: string
  onMessage?: (message: string) => void
  onError?: (error: Error) => void
  enableAttachments?: boolean
  enableEmoji?: boolean
  maxMessageLength?: number
  showTimestamps?: boolean
}

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

export function A2UIChat({
  title = 'Chat',
  placeholder = 'Type your message...',
  theme = 'auto',
  agentUrl: _agentUrl,
  className = '',
  onMessage,
  onError: _onError,
  maxMessageLength = 1000
}: A2UIChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    const trimmedInput = input.trim()
    if (!trimmedInput) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: trimmedInput,
      role: 'user',
      timestamp: new Date()
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')

    // Call callback
    if (onMessage) {
      onMessage(trimmedInput)
    }

    // Simulate assistant response (in real app, this would use WebSocket)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Echo: ${trimmedInput}`,
        role: 'assistant',
        timestamp: new Date()
      }
      setMessages((prev) => [...prev, assistantMessage])
    }, 500)
  }

  return (
    <div className={`a2ui-chat ${className}`} data-theme={theme}>
      {title && (
        <header className="a2ui-chat-header">
          <h2>{title}</h2>
        </header>
      )}

      <div className="a2ui-chat-messages" role="log" aria-live="polite">
        {messages.length === 0 ? (
          <div className="a2ui-chat-empty">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`a2ui-chat-message a2ui-chat-message-${message.role}`}
            >
              <div className="a2ui-chat-message-content">
                {message.content}
              </div>
            </div>
          ))
        )}
      </div>

      <form className="a2ui-chat-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="a2ui-chat-input"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={maxMessageLength}
          aria-label="Message input"
        />
        <button
          type="submit"
          className="a2ui-chat-send"
          disabled={!input.trim()}
          aria-label="Send message"
        >
          Send
        </button>
      </form>
    </div>
  )
}
