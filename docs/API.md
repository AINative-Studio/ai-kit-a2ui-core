# API Documentation

## Table of Contents

- [JSON Pointer](#json-pointer)
- [WebSocket Transport](#websocket-transport)
- [Component Registry](#component-registry)
- [Protocol Types](#protocol-types)

---

## JSON Pointer

RFC 6901 compliant JSON Pointer implementation for data navigation and manipulation.

### Installation

```typescript
import { JSONPointer } from '@ainative/ai-kit-a2ui-core/json-pointer'
```

### API

#### `JSONPointer.resolve<T>(object: unknown, pointer: string): T | undefined`

Resolve a JSON Pointer path in an object.

**Parameters:**
- `object` - The object to navigate
- `pointer` - JSON Pointer string (must start with `/`)

**Returns:** The resolved value or `undefined` if not found

**Throws:** `JSONPointerError` if pointer format is invalid

**Examples:**

```typescript
const data = {
  user: {
    profile: { name: 'Alice', age: 30 },
    settings: { theme: 'dark' }
  },
  items: ['a', 'b', 'c']
}

// Resolve nested objects
JSONPointer.resolve(data, '/user/profile/name')  // 'Alice'
JSONPointer.resolve(data, '/user/settings/theme')  // 'dark'

// Resolve arrays
JSONPointer.resolve(data, '/items/0')  // 'a'
JSONPointer.resolve(data, '/items/2')  // 'c'

// Non-existent paths
JSONPointer.resolve(data, '/user/missing')  // undefined

// Root pointer
JSONPointer.resolve(data, '')  // entire data object
```

**RFC 6901 Escape Sequences:**

```typescript
const data = {
  'user~name': 'Alice',
  'path/to': { value: 123 }
}

// ~ is escaped as ~0
JSONPointer.resolve(data, '/user~0name')  // 'Alice'

// / is escaped as ~1
JSONPointer.resolve(data, '/path~1to/value')  // 123
```

---

#### `JSONPointer.set(object: unknown, pointer: string, value: unknown): void`

Set a value at a JSON Pointer path. Creates intermediate objects as needed.

**Parameters:**
- `object` - The object to modify (mutated in-place)
- `pointer` - JSON Pointer string (must start with `/`)
- `value` - Value to set

**Throws:** `JSONPointerError` if:
- Pointer format is invalid
- Cannot navigate through null/undefined
- Cannot navigate through non-objects
- Invalid array index

**Examples:**

```typescript
const data = { user: { name: 'Alice' } }

// Set existing property
JSONPointer.set(data, '/user/age', 30)
// data is now { user: { name: 'Alice', age: 30 } }

// Create intermediate objects
const empty = {}
JSONPointer.set(empty, '/user/profile/city', 'NYC')
// empty is now { user: { profile: { city: 'NYC' } } }

// Set array elements
const arr = { items: ['a', 'b', 'c'] }
JSONPointer.set(arr, '/items/1', 'B')
// items is now ['a', 'B', 'c']

// Append to array with "-" token
JSONPointer.set(arr, '/items/-', 'd')
// items is now ['a', 'B', 'c', 'd']
```

---

#### `JSONPointer.remove(object: unknown, pointer: string): boolean`

Remove a value at a JSON Pointer path.

**Parameters:**
- `object` - The object to modify (mutated in-place)
- `pointer` - JSON Pointer string (must start with `/`)

**Returns:** `true` if removed, `false` if path not found

**Throws:** `JSONPointerError` if pointer format is invalid

**Examples:**

```typescript
const data = {
  user: { name: 'Alice', age: 30 },
  items: ['a', 'b', 'c']
}

// Remove object property
JSONPointer.remove(data, '/user/age')  // true
// data.user is now { name: 'Alice' }

// Remove array element
JSONPointer.remove(data, '/items/1')  // true
// items is now ['a', 'c']

// Non-existent path
JSONPointer.remove(data, '/user/missing')  // false
```

---

#### `JSONPointer.compile(pointer: string): string[]`

Compile a JSON Pointer into an array of reference tokens.

**Parameters:**
- `pointer` - JSON Pointer string

**Returns:** Array of unescaped tokens

**Throws:** `JSONPointerError` if pointer format is invalid

**Examples:**

```typescript
JSONPointer.compile('/user/profile/name')
// ['user', 'profile', 'name']

JSONPointer.compile('/items/0')
// ['items', '0']

JSONPointer.compile('')
// []

// With escapes
JSONPointer.compile('/user~0name/path~1to')
// ['user~name', 'path/to']
```

---

## WebSocket Transport

Framework-agnostic WebSocket transport for agent communication.

### Installation

```typescript
import { A2UITransport } from '@ainative/ai-kit-a2ui-core/transport'
```

### API

#### `new A2UITransport(url: string, options?: TransportOptions)`

Create a new transport instance.

**Parameters:**
- `url` - WebSocket URL (e.g., `wss://agent.example.com`)
- `options` - Optional configuration

**Options:**

```typescript
interface TransportOptions {
  autoReconnect?: boolean       // Auto-reconnect on disconnect (default: true)
  reconnectDelay?: number        // Delay between reconnects in ms (default: 3000)
  maxReconnectAttempts?: number  // Max reconnect attempts (default: 5, 0 = infinite)
  pingInterval?: number          // Ping interval in ms (default: 30000, 0 = disabled)
  pongTimeout?: number           // Pong timeout in ms (default: 5000)
}
```

**Example:**

```typescript
const transport = new A2UITransport('wss://agent.example.com', {
  autoReconnect: true,
  reconnectDelay: 3000,
  maxReconnectAttempts: 5
})
```

---

#### `transport.connect(): Promise<void>`

Connect to the agent.

**Returns:** Promise that resolves when connected

**Throws:** Error if connection fails

**Example:**

```typescript
try {
  await transport.connect()
  console.log('Connected!')
} catch (error) {
  console.error('Failed to connect:', error)
}
```

---

#### `transport.disconnect(): void`

Disconnect from the agent.

**Example:**

```typescript
transport.disconnect()
```

---

#### `transport.send(message: A2UIMessage): void`

Send a message to the agent.

**Parameters:**
- `message` - A2UI protocol message

**Throws:** Error if not connected

**Example:**

```typescript
transport.send({
  type: 'userAction',
  surfaceId: 'surface-1',
  action: 'submit',
  context: { formData: {...} }
})
```

---

#### `transport.on<T>(event: string, handler: (data: T) => void): void`

Register an event handler.

**Events:**
- `connect` - Connected to agent
- `disconnect` - Disconnected from agent
- `message` - Any message received
- `createSurface` - Create surface message
- `updateComponents` - Update components message
- `updateDataModel` - Update data model message
- `deleteSurface` - Delete surface message
- `error` - Error occurred
- `statusChange` - Connection status changed
- `reconnecting` - Reconnection attempt

**Example:**

```typescript
transport.on('createSurface', ({ components, dataModel }) => {
  console.log('Surface created:', components)
})

transport.on('updateComponents', ({ updates }) => {
  console.log('Components updated:', updates)
})

transport.on('error', (error) => {
  console.error('Transport error:', error)
})

transport.on('statusChange', (status) => {
  console.log('Status:', status)  // 'connecting' | 'connected' | 'disconnected' | 'error'
})
```

---

#### `transport.off<T>(event: string, handler: (data: T) => void): void`

Unregister an event handler.

**Example:**

```typescript
const handler = (data) => console.log(data)
transport.on('createSurface', handler)
transport.off('createSurface', handler)  // Removed
```

---

#### Properties

##### `transport.status: TransportStatus`

Current connection status.

```typescript
type TransportStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

console.log(transport.status)  // 'connected'
```

##### `transport.isConnected: boolean`

Check if connected.

```typescript
if (transport.isConnected) {
  transport.send({...})
}
```

---

## Component Registry

Catalog system for component types.

### Installation

```typescript
import { ComponentRegistry } from '@ainative/ai-kit-a2ui-core/registry'
```

### API

#### `ComponentRegistry.standard(): ComponentRegistry`

Create a registry pre-loaded with all 18 standard A2UI components.

**Returns:** ComponentRegistry instance

**Example:**

```typescript
const registry = ComponentRegistry.standard()

const button = registry.get('button')
console.log(button.displayName)  // 'Button'
console.log(button.category)     // 'input'
console.log(button.defaultProps) // { variant: 'primary', size: 'md', ... }
```

**Standard Components:**

| Component | Category | Tags |
|-----------|----------|------|
| card | layout | container, layout |
| row | layout | container, layout, flex |
| column | layout | container, layout, flex |
| modal | layout | container, overlay, dialog |
| tabs | layout | container, navigation |
| text | content | text, typography |
| button | input | button, action, interactive |
| list | content | list, repeater |
| textField | input | input, form, text |
| checkBox | input | input, form, boolean |
| slider | input | input, form, range |
| choicePicker | input | input, form, select |
| dateTimeInput | input | input, form, date, time |
| image | media | media, image |
| video | media | media, video |
| audioPlayer | media | media, audio |
| icon | content | icon, visual |
| divider | content | divider, separator |

---

#### `new ComponentRegistry()`

Create an empty registry.

**Example:**

```typescript
const registry = new ComponentRegistry()
```

---

#### `registry.register(type: string, definition: ComponentDefinition): void`

Register a component type.

**Parameters:**
- `type` - Component type identifier
- `definition` - Component definition

**Definition:**

```typescript
interface ComponentDefinition {
  type: string
  displayName?: string
  description?: string
  schema?: Record<string, unknown>      // JSON Schema
  defaultProps?: Record<string, unknown>
  category?: 'layout' | 'content' | 'input' | 'media' | 'misc'
  tags?: string[]
}
```

**Example:**

```typescript
registry.register('customChart', {
  type: 'customChart',
  displayName: 'Custom Chart',
  description: 'Interactive data visualization',
  category: 'content',
  tags: ['chart', 'visualization', 'data'],
  defaultProps: {
    chartType: 'line',
    showLegend: true
  }
})
```

---

#### `registry.get(type: string): ComponentDefinition | undefined`

Get a component definition.

**Returns:** Component definition or `undefined` if not found

**Example:**

```typescript
const button = registry.get('button')
if (button) {
  console.log(button.displayName)  // 'Button'
}
```

---

#### `registry.has(type: string): boolean`

Check if a component type is registered.

**Example:**

```typescript
if (registry.has('customChart')) {
  const chart = registry.get('customChart')
}
```

---

#### `registry.unregister(type: string): boolean`

Unregister a component type.

**Returns:** `true` if removed, `false` if not found

**Example:**

```typescript
registry.unregister('customChart')  // true
registry.unregister('nonExistent')  // false
```

---

#### `registry.getAll(): ComponentDefinition[]`

Get all registered components.

**Example:**

```typescript
const all = registry.getAll()
console.log(all.length)  // 18 (for standard registry)
```

---

#### `registry.getByCategory(category: string): ComponentDefinition[]`

Get components by category.

**Example:**

```typescript
const inputComponents = registry.getByCategory('input')
// [button, textField, checkBox, slider, choicePicker, dateTimeInput]

const mediaComponents = registry.getByCategory('media')
// [image, video, audioPlayer]
```

---

#### `registry.searchByTag(tag: string): ComponentDefinition[]`

Search components by tag.

**Example:**

```typescript
const formComponents = registry.searchByTag('form')
// [textField, checkBox, slider, choicePicker, dateTimeInput]

const containers = registry.searchByTag('container')
// [card, row, column, modal, tabs]
```

---

#### `registry.clear(): void`

Remove all registered components.

**Example:**

```typescript
registry.clear()
console.log(registry.getAll())  // []
```

---

## Protocol Types

Complete A2UI v0.9 TypeScript type definitions.

### Installation

```typescript
import type {
  A2UIComponent,
  A2UIMessage,
  CreateSurfaceMessage,
  // ... etc
} from '@ainative/ai-kit-a2ui-core/types'
```

### Component Types

```typescript
type ComponentType =
  | 'card' | 'text' | 'button' | 'row' | 'column'
  | 'modal' | 'tabs' | 'list' | 'textField' | 'checkBox'
  | 'slider' | 'choicePicker' | 'dateTimeInput' | 'image'
  | 'video' | 'audioPlayer' | 'icon' | 'divider'

interface A2UIComponent {
  id: string
  type: ComponentType | string
  properties?: Record<string, unknown>
  children?: string[]
}
```

### Message Types

```typescript
type MessageType =
  | 'createSurface'
  | 'updateComponents'
  | 'updateDataModel'
  | 'deleteSurface'
  | 'userAction'
  | 'error'
  | 'ping'
  | 'pong'

type A2UIMessage =
  | CreateSurfaceMessage
  | UpdateComponentsMessage
  | UpdateDataModelMessage
  | DeleteSurfaceMessage
  | UserActionMessage
  | ErrorMessage
  | PingMessage
  | PongMessage
```

### Type Guards

```typescript
import {
  isCreateSurfaceMessage,
  isUpdateComponentsMessage,
  // ... etc
} from '@ainative/ai-kit-a2ui-core/types'

if (isCreateSurfaceMessage(message)) {
  // TypeScript knows message is CreateSurfaceMessage
  console.log(message.components)
}
```

---

**Version**: 0.1.0-alpha.1
**Last Updated**: 2025-12-23
