# React Package Development Standards

**Package**: `@ainative/a2ui-react`
**Purpose**: React bindings and components for A2UI Core
**Status**: Mandatory for all React package development

---

## Core Principles

### 1. Zero Impact on Core Library
- React package MUST import `@ainative/ai-kit-a2ui-core`
- NO modifications to core protocol types
- NO breaking changes to core library
- React package is an ADDITION, not a replacement

### 2. Peer Dependencies Only
```json
{
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  }
}
```
- NEVER bundle React or React DOM
- Users provide their own React version
- Support React 18+ only

### 3. Bundle Size Constraints
- **Headless hooks**: <5KB gzipped
- **Pre-built components**: <50KB gzipped
- **Total package**: <60KB gzipped
- Use bundle analyzer to verify

---

## TypeScript Standards

### Strict Mode Requirements
```typescript
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "jsx": "react-jsx",
    "types": ["react", "react-dom"]
  }
}
```

### Type Inference
```typescript
// ✅ CORRECT - Proper generic inference
export function useCoAgent<T extends Record<string, unknown>>(
  name: string,
  initialState: T
): CoAgentHook<T>

// ❌ WRONG - No type safety
export function useCoAgent(name: string, initialState: any): any
```

---

## Component Development

### Styling Strategy
**NO GLOBAL CSS POLLUTION** - Learned from CopilotKit Issue #1857

```typescript
// ✅ CORRECT - CSS Modules (scoped)
import styles from './A2UIChat.module.css'

export function A2UIChat() {
  return <div className={styles.container}>...</div>
}

// ✅ CORRECT - Tailwind support via className
export function A2UIChat({ className }: { className?: string }) {
  return <div className={`a2ui-chat ${className || ''}`}>...</div>
}

// ❌ WRONG - Global styles
import './global-styles.css'  // NEVER DO THIS
```

### Accessibility Requirements (WCAG 2.1 AA)
```typescript
// ✅ REQUIRED
<button
  aria-label="Send message"
  onClick={handleSend}
  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
>
  Send
</button>

// Test with:
- Keyboard navigation (Tab, Enter, Escape)
- Screen reader (VoiceOver/NVDA)
- Color contrast checker (4.5:1 minimum)
```

### Performance Requirements
```typescript
// ✅ CORRECT - Memoization for expensive renders
const MessageList = React.memo(({ messages }: { messages: Message[] }) => {
  return <VirtualList items={messages} />
})

// ✅ CORRECT - Virtual scrolling for long lists
import { VirtualList } from './VirtualList'

// ❌ WRONG - Rendering 1000+ items without virtualization
{messages.map(msg => <Message key={msg.id} {...msg} />)}
```

---

## React Hooks Standards

### Custom Hook Naming
```typescript
// ✅ CORRECT - Starts with "use"
export function useCoAgent<T>() { }
export function useA2UIAgent() { }
export function useHumanInTheLoop() { }

// ❌ WRONG - Doesn't start with "use"
export function coAgent() { }  // Not a hook pattern
```

### Hook Dependencies
```typescript
// ✅ CORRECT - Proper dependency array
useEffect(() => {
  const handler = (msg: Message) => {
    setMessages(prev => [...prev, msg])
  }

  transport.on('message', handler)
  return () => transport.off('message', handler)
}, [transport]) // Dependency declared

// ❌ WRONG - Missing dependencies
useEffect(() => {
  transport.on('message', handleMessage)
}, []) // Missing transport and handleMessage
```

### Memory Leak Prevention
```typescript
// ✅ REQUIRED - Cleanup in useEffect
useEffect(() => {
  const subscription = transport.subscribe(handler)

  return () => {
    subscription.unsubscribe() // CLEANUP
  }
}, [])
```

---

## Testing Requirements

### Component Testing
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { A2UIChat } from '../A2UIChat'

describe('A2UIChat', () => {
  it('renders chat interface', () => {
    render(<A2UIChat title="Test Chat" />)
    expect(screen.getByText('Test Chat')).toBeInTheDocument()
  })

  it('sends message on Enter key', async () => {
    const onMessage = vi.fn()
    render(<A2UIChat onMessage={onMessage} />)

    const input = screen.getByPlaceholderText('Type a message...')
    fireEvent.change(input, { target: { value: 'Hello' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => {
      expect(onMessage).toHaveBeenCalledWith('Hello')
    })
  })
})
```

### Hook Testing
```typescript
import { renderHook, act } from '@testing-library/react'
import { useCoAgent } from '../useCoAgent'

describe('useCoAgent', () => {
  it('syncs state bidirectionally', async () => {
    const { result } = renderHook(() => useCoAgent('test', { count: 0 }))

    act(() => {
      result.current.setState({ count: 5 })
    })

    expect(result.current.state.count).toBe(5)
  })
})
```

### Test Coverage Requirements
- **Statements**: ≥85%
- **Branches**: ≥85%
- **Functions**: ≥85%
- **Lines**: ≥85%

### Accessibility Testing
```typescript
import { axe, toHaveNoViolations } from 'jest-axe'
expect.extend(toHaveNoViolations)

it('should have no accessibility violations', async () => {
  const { container } = render(<A2UIChat />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

---

## Error Handling

### Error Boundaries
```typescript
// ✅ REQUIRED for all components
export class A2UIErrorBoundary extends React.Component<Props, State> {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('A2UI Error:', error, errorInfo)
    this.props.onError?.(error)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <DefaultErrorUI />
    }
    return this.props.children
  }
}
```

### Async Error Handling
```typescript
// ✅ CORRECT
try {
  const response = await transport.send(message)
  setResult(response)
} catch (error) {
  if (error instanceof NetworkError) {
    setError('Network error. Please try again.')
  } else if (error instanceof ValidationError) {
    setError(`Invalid input: ${error.field}`)
  } else {
    setError('An unexpected error occurred.')
  }
}
```

---

## Documentation Requirements

### Component Documentation
```typescript
/**
 * A2UIChat component - Full-featured chat interface
 *
 * @param title - Chat window title
 * @param placeholder - Input placeholder text
 * @param theme - Color theme ('light' | 'dark')
 * @param className - Additional CSS classes
 * @param onMessage - Callback when user sends message
 *
 * @example
 * ```tsx
 * <A2UIChat
 *   title="Assistant"
 *   theme="dark"
 *   onMessage={(msg) => console.log(msg)}
 * />
 * ```
 */
export function A2UIChat(props: A2UIChatProps) { }
```

### Storybook Stories
```typescript
// A2UIChat.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { A2UIChat } from './A2UIChat'

const meta: Meta<typeof A2UIChat> = {
  title: 'Components/A2UIChat',
  component: A2UIChat,
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj<typeof A2UIChat>

export const Default: Story = {
  args: {
    title: 'Chat Assistant',
    placeholder: 'Type a message...',
  },
}

export const DarkTheme: Story = {
  args: {
    title: 'Dark Chat',
    theme: 'dark',
  },
}
```

---

## Build Configuration

### Vite Configuration
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    react(),
    dts({ rollupTypes: true })
  ],
  build: {
    lib: {
      entry: './src/index.ts',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'js'}`
    },
    rollupOptions: {
      external: ['react', 'react-dom', '@ainative/ai-kit-a2ui-core']
    }
  }
})
```

### Package.json
```json
{
  "name": "@ainative/a2ui-react",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./headless": {
      "import": "./dist/headless.mjs",
      "require": "./dist/headless.js",
      "types": "./dist/headless.d.ts"
    }
  },
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  }
}
```

---

## Pre-commit Checklist

Before committing React package code:

- [ ] All tests passing (`npm test`)
- [ ] Coverage ≥85% (`npm run test:coverage`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Bundle size verified (`npm run build && npm run size`)
- [ ] Storybook stories updated (`npm run storybook`)
- [ ] Accessibility tested (keyboard + screen reader)
- [ ] No global CSS pollution
- [ ] Memory leaks checked (mount/unmount cycles)
- [ ] Documentation updated (README + JSDoc)

---

## Common Pitfalls to Avoid

### ❌ Don't: Modify Core Library
```typescript
// WRONG - Don't change core types
import type { A2UIMessage } from '@ainative/ai-kit-a2ui-core/types'
// Then modify A2UIMessage interface
```

### ❌ Don't: Bundle React
```typescript
// WRONG in package.json
{
  "dependencies": {
    "react": "^18.0.0"  // Should be peerDependencies
  }
}
```

### ❌ Don't: Use Global State Without Cleanup
```typescript
// WRONG - Global state without cleanup
let globalMessages: Message[] = []

// CORRECT - Use React state with cleanup
const [messages, setMessages] = useState<Message[]>([])
```

### ❌ Don't: Ignore Accessibility
```typescript
// WRONG - No keyboard support
<div onClick={handleClick}>Click me</div>

// CORRECT - Keyboard accessible
<button onClick={handleClick}>Click me</button>
```

---

## Summary

**React Package MUST**:
1. Import core library (zero impact on core)
2. Use peer dependencies for React
3. Maintain bundle size <60KB gzipped
4. Achieve 85%+ test coverage
5. WCAG 2.1 AA accessibility compliance
6. No global CSS pollution
7. Proper error boundaries
8. Memory leak prevention
9. Storybook stories for all components
10. Comprehensive documentation

---

**Last Updated**: 2026-02-17
**Status**: Mandatory
**Enforcement**: Pre-commit hooks + CI/CD
