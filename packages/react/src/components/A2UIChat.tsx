import React, { useState, useRef, useEffect, useCallback } from 'react'
import type { A2UIChatProps, Message } from '../types'
import styles from './A2UIChat.module.css'

export const A2UIChat: React.FC<A2UIChatProps> = ({
  title = 'Chat',
  placeholder = 'Type a message...',
  theme = 'light',
  className = '',
  messages: externalMessages = [],
  onMessage,
  onMessagesChange,
  isTyping = false,
  disabled = false,
  maxLength,
  showTimestamp = false,
  virtualScrolling = false,
  error,
  renderError,
  renderMessage,
}) => {
  const [inputValue, setInputValue] = useState('')
  const [internalMessages, setInternalMessages] = useState<Message[]>(externalMessages)
  const [isPending, setIsPending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Sync external messages with internal state
  useEffect(() => {
    setInternalMessages(externalMessages)
  }, [externalMessages])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (internalMessages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [internalMessages.length])

  const handleSendMessage = useCallback(async () => {
    const trimmedValue = inputValue.trim()

    if (!trimmedValue || disabled || isPending) {
      return
    }

    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      content: trimmedValue,
      role: 'user',
      timestamp: new Date(),
    }

    const updatedMessages = [...internalMessages, newMessage]
    setInternalMessages(updatedMessages)
    setInputValue('')

    // Notify parent of message change
    onMessagesChange?.(updatedMessages)

    // Call onMessage handler
    if (onMessage) {
      try {
        setIsPending(true)
        await onMessage(trimmedValue)
      } finally {
        setIsPending(false)
      }
    }

    // Focus back on input
    inputRef.current?.focus()
  }, [inputValue, disabled, isPending, internalMessages, onMessage, onMessagesChange])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSendMessage()
      } else if (e.key === 'Escape') {
        setInputValue('')
      }
    },
    [handleSendMessage]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value
      if (maxLength && value.length > maxLength) {
        setInputValue(value.slice(0, maxLength))
      } else {
        setInputValue(value)
      }
    },
    [maxLength]
  )

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const renderMessageDefault = (message: Message) => (
    <div
      key={message.id}
      className={`${styles.message} ${styles[`message-${message.role}`]}`}
      data-role={message.role}
    >
      <div className={styles.messageContent}>{message.content}</div>
      {showTimestamp && (
        <div className={styles.messageTimestamp}>
          {formatTimestamp(message.timestamp)}
        </div>
      )}
    </div>
  )

  const isInputDisabled = disabled || isPending

  return (
    <div
      className={`${styles.chatContainer} ${className}`}
      data-theme={theme}
      role="region"
      aria-label="Chat interface"
    >
      {/* Header */}
      <div className={styles.chatHeader}>
        <h2 className={styles.chatTitle}>{title}</h2>
      </div>

      {/* Messages */}
      <div className={styles.messagesContainer} data-virtual={virtualScrolling}>
        {internalMessages.map((message) =>
          renderMessage ? renderMessage(message) : renderMessageDefault(message)
        )}

        {/* Typing Indicator */}
        {isTyping && (
          <div className={styles.typingIndicator} aria-live="polite">
            <span className={styles.typingDot}></span>
            <span className={styles.typingDot}></span>
            <span className={styles.typingDot}></span>
            <span className={styles.typingText}>Typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error && (
        <div className={styles.errorContainer} role="alert">
          {renderError ? renderError(error) : <span>{error}</span>}
        </div>
      )}

      {/* Input Area */}
      <div className={styles.inputContainer}>
        <textarea
          ref={inputRef}
          className={styles.input}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isInputDisabled}
          maxLength={maxLength}
          rows={1}
          aria-label="Message input"
        />
        <button
          className={styles.sendButton}
          onClick={handleSendMessage}
          disabled={isInputDisabled || !inputValue.trim()}
          aria-label="Send message"
        >
          <svg
            className={styles.sendIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
          <span className={styles.sendButtonText}>Send</span>
        </button>
      </div>
    </div>
  )
}

A2UIChat.displayName = 'A2UIChat'
