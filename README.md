# @ainative/ai-kit-a2ui-core

Framework-agnostic core library for A2UI protocol (v0.9) with **zero runtime dependencies**.

## Features

- **Zero Dependencies** - Pure TypeScript, no runtime deps
- **JSON Pointer** - RFC 6901 compliant implementation
- **WebSocket Transport** - Framework-agnostic agent communication
- **Protocol Types** - Complete A2UI v0.9 TypeScript definitions
- **Component Registry** - Extensible component catalog
- **100% Type Safe** - Built with TypeScript strict mode
- **100% Tested** - Complete test coverage

## Installation

```bash
npm install @ainative/ai-kit-a2ui-core
```

## Usage

### JSON Pointer (RFC 6901)

```typescript
import { JSONPointer } from '@ainative/ai-kit-a2ui-core/json-pointer'

const data = {
  user: {
    profile: { name: 'Alice' },
    settings: { theme: 'dark' }
  }
}

// Resolve
const name = JSONPointer.resolve(data, '/user/profile/name')  // 'Alice'

// Set
JSONPointer.set(data, '/user/settings/theme', 'light')

// Remove
JSONPointer.remove(data, '/user/deprecated')
```

### WebSocket Transport

```typescript
import { A2UITransport } from '@ainative/ai-kit-a2ui-core/transport'

const transport = new A2UITransport('wss://agent.example.com')

transport.on('createSurface', ({ components, dataModel }) => {
  console.log('Surface created:', components)
})

await transport.connect()
transport.send({ type: 'userAction', action: 'submit', data: {...} })
```

### Component Registry

```typescript
import { ComponentRegistry } from '@ainative/ai-kit-a2ui-core/registry'

// Standard catalog (17 components)
const registry = ComponentRegistry.standard()

// Custom component
registry.register('customChart', {
  type: 'customChart',
  schema: {...},
  defaultProps: {...}
})
```

### Protocol Types

```typescript
import type { A2UIComponent, A2UIMessage, ComponentType } from '@ainative/ai-kit-a2ui-core/types'

const component: A2UIComponent = {
  id: 'card-1',
  type: 'card',
  properties: { title: 'Hello World' },
  children: []
}
```

## Bundle Size

< 20 KB gzipped (zero dependencies!)

## License

MIT © AINative Studio
