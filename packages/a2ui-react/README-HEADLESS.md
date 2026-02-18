# @ainative/a2ui-react

**React bindings for A2UI protocol v0.9** - Type-safe, headless, zero-dependency hooks for building agent-powered UIs.

[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@ainative/a2ui-react)](https://bundlephobia.com/package/@ainative/a2ui-react)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

---

## Features

- **🎯 Headless Design** - Bring your own UI components
- **📘 100% TypeScript** - Full type safety with strict mode
- **🪶 Lightweight** - <5KB gzipped (hooks only)
- **⚡ Zero Dependencies** - Only React as peer dependency  
- **🔒 Type-Safe** - Generic hooks with full inference
- **♿ Accessible** - WCAG 2.1 AA compliant foundation
- **🧪 Well-Tested** - 50+ tests with 85%+ coverage
- **🎨 Framework Agnostic** - Works with any React setup

---

## Installation

```bash
# npm
npm install @ainative/a2ui-react @ainative/ai-kit-a2ui-core react react-dom

# pnpm
pnpm add @ainative/a2ui-react @ainative/ai-kit-a2ui-core react react-dom

# yarn
yarn add @ainative/a2ui-react @ainative/ai-kit-a2ui-core react react-dom
```

**Peer Dependencies**:
- `react` >= 18.0.0
- `react-dom` >= 18.0.0
- `@ainative/ai-kit-a2ui-core` >= 0.1.0

---

## Quick Start

### 1. Setup Provider

```typescript
import { A2UIProvider } from '@ainative/a2ui-react'
import { A2UITransport } from '@ainative/ai-kit-a2ui-core/transport'

const transport = new A2UITransport('ws://localhost:8080')

function App() {
  return (
    <A2UIProvider transport={transport}>
      <YourApp />
    </A2UIProvider>
  )
}
```

### 2. Use Hooks

```typescript
import { useA2UIAgent, useA2UIState, useA2UIAction } from '@ainative/a2ui-react'

function ChatInterface() {
  // Access agent communications
  const { messages, isConnected, subscribe } = useA2UIAgent()
  
  // Manage state
  const { state, setState } = useA2UIState<{
    messages: Array<{ role: string; content: string }>
    input: string
  }>()
  
  // Send actions
  const { sendAction } = useA2UIAction()
  
  const handleSend = () => {
    sendAction('send-message', {
      message: state.input
    })
    setState({ input: '' })
  }
  
  return (
    <div>
      <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
      <input
        value={state.input}
        onChange={(e) => setState({ input: e.target.value })}
      />
      <button onClick={handleSend}>Send</button>
    </div>
  )
}
```

---

## API Reference

### `<A2UIProvider>`

Context provider that manages transport connection and state.

```typescript
interface A2UIProviderProps {
  transport: A2UITransport
  surfaceId?: string
  initialState?: Record<string, unknown>
  autoConnect?: boolean
  onStatusChange?: (status: TransportStatus) => void
  onError?: (error: Error) => void
  onMessage?: (message: A2UIMessage) => void
  children: React.ReactNode
}
```

### `useA2UIAgent()`

Hook for accessing agent communications.

```typescript
function useA2UIAgent(): {
  messages: A2UIMessage[]
  lastMessage: A2UIMessage | null
  status: TransportStatus
  isConnected: boolean
  subscribe: <T extends A2UIMessage>(
    type: T['type'],
    handler: (message: T) => void
  ) => () => void
}
```

**Example**:
```typescript
const { messages, subscribe } = useA2UIAgent()

useEffect(() => {
  const unsubscribe = subscribe('createSurface', (message) => {
    console.log('New surface created:', message)
  })
  
  return unsubscribe
}, [subscribe])
```

### `useA2UIState<T>()`

Type-safe state management hook.

```typescript
function useA2UIState<T extends Record<string, unknown>>(): {
  state: T
  setState: (updates: Partial<T>) => void
  replaceState: (newState: T) => void
  resetState: () => void
}
```

**Example**:
```typescript
const { state, setState, resetState } = useA2UIState<{
  count: number
  name: string
}>()

setState({ count: state.count + 1 }) // Merge update
resetState() // Reset to initial
```

### `useA2UIAction()`

Hook for sending actions to the agent.

```typescript
function useA2UIAction(): {
  sendAction: (action: string, context?: Record<string, unknown>) => void
  sendMessage: (message: A2UIMessage) => void
  isPending: boolean
  error: Error | null
}
```

**Example**:
```typescript
const { sendAction, isPending } = useA2UIAction()

const handleClick = () => {
  sendAction('button-click', {
    buttonId: 'submit',
    timestamp: Date.now()
  })
}
```

---

## Advanced Usage

### Message Subscriptions

```typescript
const { subscribe } = useA2UIAgent()

useEffect(() => {
  // Subscribe to specific message types
  const unsubscribeCreate = subscribe('createSurface', (msg) => {
    console.log('Surface created:', msg.surfaceId)
  })
  
  const unsubscribeUpdate = subscribe('updateComponents', (msg) => {
    console.log('Components updated:', msg.updates)
  })
  
  return () => {
    unsubscribeCreate()
    unsubscribeUpdate()
  }
}, [subscribe])
```

### Nested State Updates

```typescript
const { state, setState } = useA2UIState<{
  user: {
    name: string
    preferences: {
      theme: 'light' | 'dark'
      fontSize: number
    }
  }
}>()

// Merge nested objects
setState({
  user: {
    ...state.user,
    preferences: {
      ...state.user.preferences,
      theme: 'dark'
    }
  }
})
```

### Error Handling

```typescript
function MyComponent() {
  return (
    <A2UIProvider
      transport={transport}
      onError={(error) => {
        console.error('A2UI Error:', error)
        // Show error UI
      }}
      onStatusChange={(status) => {
        console.log('Connection status:', status)
      }}
    >
      <App />
    </A2UIProvider>
  )
}
```

---

## TypeScript Support

### Generic State Typing

```typescript
interface MyState {
  users: Array<{ id: string; name: string }>
  currentPage: number
  filters: {
    search: string
    category: string | null
  }
}

const { state, setState } = useA2UIState<MyState>()

// Full type inference and autocomplete
setState({
  currentPage: 2,
  filters: {
    ...state.filters,
    search: 'query'
  }
})
```

### Message Type Guards

```typescript
import { isCreateSurfaceMessage } from '@ainative/ai-kit-a2ui-core/types'

const { subscribe } = useA2UIAgent()

subscribe('createSurface', (message) => {
  if (isCreateSurfaceMessage(message)) {
    // TypeScript knows exact message shape
    console.log(message.components)
  }
})
```

---

## Best Practices

### 1. Stable Subscriptions

```typescript
// ✅ CORRECT - Stable subscription
const handleMessage = useCallback((msg: CreateSurfaceMessage) => {
  console.log(msg)
}, [])

useEffect(() => {
  return subscribe('createSurface', handleMessage)
}, [subscribe, handleMessage])
```

### 2. State Updates

```typescript
// ✅ CORRECT - Use setState for partial updates
setState({ count: state.count + 1 })

// ❌ WRONG - Don't mutate state directly
state.count += 1
```

### 3. Memory Management

```typescript
// ✅ CORRECT - Always cleanup subscriptions
useEffect(() => {
  const unsubscribe = subscribe('message', handler)
  return unsubscribe // Cleanup on unmount
}, [subscribe])

// ❌ WRONG - Missing cleanup
useEffect(() => {
  subscribe('message', handler)
}, [subscribe])
```

---

## Bundle Sizes

| Import | Size (gzipped) |
|--------|---------------|
| Full package | ~5KB |
| Headless only | <5KB |
| Provider only | ~2KB |
| Hooks only | ~3KB |

---

## Browser Support

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90
- React >= 18.0.0

---

## Examples

See `/examples/react-headless/` for complete working examples:
- Basic chat interface
- Real-time collaboration
- Form validation
- File upload
- Authentication flows

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

### Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Type check
pnpm type-check

# Build package
pnpm build

# Run Storybook
pnpm storybook
```

---

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

## Links

- [Documentation](https://docs.ainative.studio)
- [A2UI Protocol Spec](https://github.com/AINative-Studio/ai-kit-a2ui-core)
- [Examples](./examples)
- [Changelog](./CHANGELOG.md)
- [Issues](https://github.com/AINative-Studio/ai-kit-a2ui-core/issues)

---

**Made with ❤️ by AINative Studio**
