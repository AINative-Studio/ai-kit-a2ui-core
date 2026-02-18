# @ainative/a2ui-react

Pre-built React components for A2UI protocol - Production-ready chat interfaces.

## Features

- **Three Components**: A2UIChat, A2UIPopup, A2UISidebar
- **Zero Global CSS Pollution**: CSS Modules for component-scoped styling
- **Dark Mode Support**: Built-in light/dark theme switching
- **Tailwind Compatible**: Use `className` prop for custom styling
- **Accessibility**: WCAG 2.1 AA compliant with full keyboard navigation
- **TypeScript**: 100% type-safe with strict mode
- **Bundle Size**: <50KB gzipped
- **85%+ Test Coverage**: Comprehensive test suite

## Installation

```bash
npm install @ainative/a2ui-react react react-dom
```

## Quick Start

### A2UIChat - Full-featured chat interface

```tsx
import { A2UIChat } from '@ainative/a2ui-react'

function App() {
  return (
    <A2UIChat
      title="Assistant"
      theme="light"
      onMessage={(message) => console.log('User said:', message)}
    />
  )
}
```

### A2UIPopup - Modal chat

```tsx
import { A2UIPopup } from '@ainative/a2ui-react'

function App() {
  return (
    <A2UIPopup
      position="bottom-right"
      chatProps={{
        title: 'Support',
        onMessage: (msg) => console.log(msg),
      }}
    />
  )
}
```

### A2UISidebar - Slide-out sidebar

```tsx
import { A2UISidebar } from '@ainative/a2ui-react'

function App() {
  return (
    <A2UISidebar
      position="right"
      mode="overlay"
      showToggle
      chatProps={{
        title: 'Chat',
        onMessage: (msg) => console.log(msg),
      }}
    />
  )
}
```

## Props

### A2UIChat

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string | 'Chat' | Chat window title |
| placeholder | string | 'Type a message...' | Input placeholder |
| theme | 'light' \| 'dark' | 'light' | Color theme |
| className | string | '' | Additional CSS classes |
| messages | Message[] | [] | Initial messages |
| onMessage | (content: string) => void | - | Message send callback |
| isTyping | boolean | false | Show typing indicator |
| disabled | boolean | false | Disable input |
| maxLength | number | - | Max message length |
| showTimestamp | boolean | false | Show timestamps |

### A2UIPopup

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| position | 'bottom-right' \| 'bottom-left' \| 'top-right' \| 'top-left' | 'bottom-right' | Popup position |
| theme | 'light' \| 'dark' | 'light' | Color theme |
| chatProps | A2UIChatProps | {} | Props for internal chat |
| defaultOpen | boolean | false | Initial open state |
| onOpen | () => void | - | Open callback |
| onClose | () => void | - | Close callback |

### A2UISidebar

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| position | 'left' \| 'right' | 'right' | Sidebar position |
| mode | 'overlay' \| 'push' | 'overlay' | Layout mode |
| theme | 'light' \| 'dark' | 'light' | Color theme |
| width | number \| string | 400 | Sidebar width |
| chatProps | A2UIChatProps | {} | Props for internal chat |
| isOpen | boolean | - | Controlled state |
| defaultOpen | boolean | false | Initial state |
| showToggle | boolean | false | Show toggle button |
| onOpen | () => void | - | Open callback |
| onClose | () => void | - | Close callback |

## Styling

### CSS Modules (Default)

All components use CSS Modules for scoped styling - zero global pollution.

### Tailwind CSS

Add custom Tailwind classes via the `className` prop:

```tsx
<A2UIChat
  className="shadow-2xl rounded-2xl border border-gray-200"
  theme="light"
/>
```

### Custom Themes

Override theme colors using CSS variables:

```css
[data-theme='light'] {
  --a2ui-bg: #ffffff;
  --a2ui-text: #1f2937;
  --a2ui-primary: #3b82f6;
}
```

## Accessibility

All components meet WCAG 2.1 AA standards:

- ✅ Keyboard navigation (Tab, Enter, Escape)
- ✅ ARIA labels and roles
- ✅ Screen reader support
- ✅ Focus management
- ✅ Color contrast 4.5:1 minimum
- ✅ Reduced motion support

## TypeScript

Fully typed with strict mode:

```tsx
import type { Message, A2UIChatProps } from '@ainative/a2ui-react'

const messages: Message[] = [
  {
    id: '1',
    content: 'Hello',
    role: 'user',
    timestamp: new Date(),
  },
]

const props: A2UIChatProps = {
  title: 'Chat',
  messages,
  onMessage: (msg) => console.log(msg),
}
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Type check
npm run type-check

# Lint
npm run lint

# Storybook
npm run storybook

# Build
npm run build

# Check bundle size
npm run size
```

## License

MIT

## Support

- Documentation: [https://ainative.studio/docs](https://ainative.studio/docs)
- Issues: [GitHub Issues](https://github.com/AINative-Studio/ai-kit-a2ui-core/issues)
- Email: hello@ainative.studio
