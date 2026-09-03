export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant' | 'system'
  timestamp: Date
  metadata?: Record<string, unknown>
}

export interface A2UIChatProps {
  /** Chat window title */
  title?: string
  /** Input placeholder text */
  placeholder?: string
  /** Color theme */
  theme?: 'light' | 'dark'
  /** Additional CSS classes for Tailwind support */
  className?: string
  /** Initial messages to display */
  messages?: Message[]
  /** Callback when user sends a message */
  onMessage?: (content: string) => void | Promise<void>
  /** Callback when messages are updated */
  onMessagesChange?: (messages: Message[]) => void
  /** Show typing indicator */
  isTyping?: boolean
  /** Disable input */
  disabled?: boolean
  /** Maximum message length */
  maxLength?: number
  /** Show timestamp for messages */
  showTimestamp?: boolean
  /** Enable virtual scrolling for performance */
  virtualScrolling?: boolean
  /** Error message to display */
  error?: string
  /** Custom error component */
  renderError?: (error: string) => React.ReactNode
  /** Custom message component */
  renderMessage?: (message: Message) => React.ReactNode
}

export interface A2UIPopupProps {
  /** Popup position */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  /** Color theme */
  theme?: 'light' | 'dark'
  /** Additional CSS classes */
  className?: string
  /** Chat props to pass to internal chat component */
  chatProps?: Omit<A2UIChatProps, 'className' | 'theme'>
  /** Custom trigger button component */
  renderTrigger?: (props: { onClick: () => void; isOpen: boolean }) => React.ReactNode
  /** Callback when popup opens */
  onOpen?: () => void
  /** Callback when popup closes */
  onClose?: () => void
  /** Initial open state */
  defaultOpen?: boolean
}

export interface A2UISidebarProps {
  /** Sidebar position */
  position?: 'left' | 'right'
  /** Layout mode */
  mode?: 'overlay' | 'push'
  /** Color theme */
  theme?: 'light' | 'dark'
  /** Additional CSS classes */
  className?: string
  /** Sidebar width */
  width?: number | string
  /** Chat props to pass to internal chat component */
  chatProps?: Omit<A2UIChatProps, 'className' | 'theme'>
  /** Control open state externally */
  isOpen?: boolean
  /** Callback when sidebar opens */
  onOpen?: () => void
  /** Callback when sidebar closes */
  onClose?: () => void
  /** Initial open state */
  defaultOpen?: boolean
  /** Show toggle button */
  showToggle?: boolean
}
