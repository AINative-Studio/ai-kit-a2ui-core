# @ainative/ai-kit-a2ui-core

> Framework-agnostic core library for A2UI protocol (v0.9-v0.11) with **zero runtime dependencies**.

[![npm version](https://img.shields.io/npm/v/@ainative/ai-kit-a2ui-core)](https://www.npmjs.com/package/@ainative/ai-kit-a2ui-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Test Coverage](https://img.shields.io/badge/coverage-96.52%25-brightgreen.svg)](./coverage)

A production-ready, framework-agnostic implementation of the [A2UI protocol](https://github.com/google/a2ui) that enables AI agents to dynamically generate rich user interfaces using declarative JSON. Includes video protocol extension (v0.10) and AI intelligence features (v0.11).

## 🚀 Features

### Core Protocol (v0.9)
- **🎯 Zero Dependencies** - Pure TypeScript with no runtime dependencies (< 20 KB gzipped)
- **📍 JSON Pointer (RFC 6901)** - Complete implementation with get/set/remove/has operations
- **🔌 WebSocket Transport** - Framework-agnostic agent communication with automatic reconnection
- **📝 Protocol Types** - Complete TypeScript definitions for A2UI v0.9 specification
- **🗂️ Component Registry** - Extensible catalog of 21 standard components
- **🛡️ 100% Type Safe** - Built with TypeScript strict mode
- **✅ 96.52% Test Coverage** - Comprehensive test suite with 429/429 tests passing
- **📦 Multi-Format** - ESM, CJS, and TypeScript definitions included
- **🔄 Event-Driven** - Type-safe event emitter for agent messages

### Video Protocol Extension (v0.10)
- **🎥 Video Components** - 4 video component types (videoRecorder, videoCall, aiVideo, aiVideoPlayer)
- **📹 Video Messages** - 9 video message types for recording, calls, and generation
- **🔗 AIKit Integration** - Seamless integration with AINative Studio video services
- **✅ Complete Validation** - JSON Schema validation for all video components

### AI Intelligence Features (v0.11)
- **🔍 Semantic Search** - Vector-based video search with pgvector embeddings
- **🤖 AI Metadata** - Automatic extraction of transcripts, summaries, topics, highlights, chapters, sentiment
- **⏯️ Progress Tracking** - Cross-device progress sync with scene-aware resume
- **💡 Smart Recommendations** - Hybrid recommendation engine (content + collaborative + contextual AI)

## 📦 Installation

```bash
npm install @ainative/ai-kit-a2ui-core
```

```bash
yarn add @ainative/ai-kit-a2ui-core
```

```bash
pnpm add @ainative/ai-kit-a2ui-core
```

### Requirements

- Node.js >= 18.0.0
- TypeScript >= 5.0 (for type definitions)

## 📖 Quick Start

```typescript
import { A2UITransport, JSONPointer, ComponentRegistry } from '@ainative/ai-kit-a2ui-core'
import type { A2UIComponent } from '@ainative/ai-kit-a2ui-core/types'

// 1. Connect to agent via WebSocket
const transport = new A2UITransport('wss://api.ainative.studio/agents/dashboard')

transport.on('createSurface', ({ surfaceId, components, dataModel }) => {
  console.log('Surface created:', surfaceId)
  console.log('Components:', components)

  // 2. Use JSON Pointer to access data
  const userName = JSONPointer.resolve(dataModel, '/user/name')
  console.log('User name:', userName)
})

transport.on('updateComponents', ({ updates }) => {
  console.log('Component updates:', updates)
})

await transport.connect()

// 3. Send user actions to agent
transport.send({
  type: 'userAction',
  surfaceId: 'dashboard-1',
  action: 'submit',
  context: { formData: { email: 'user@example.com' } }
})
```

## 📚 Modules

### 🔹 Types

Complete TypeScript definitions for A2UI protocol v0.9.

```typescript
import type {
  A2UIComponent,
  A2UIMessage,
  ComponentType,
  A2UICreateSurface,
  A2UIUpdateComponents,
  A2UIUserAction,
  DataModel,
  SurfaceId
} from '@ainative/ai-kit-a2ui-core/types'

// Component structure
const component: A2UIComponent = {
  id: 'card-1',
  type: 'card',
  properties: {
    title: 'Dashboard',
    description: 'User analytics'
  },
  children: [
    {
      id: 'text-1',
      type: 'text',
      properties: { value: 'Welcome back!' }
    }
  ]
}

// Agent messages
const createSurface: A2UICreateSurface = {
  type: 'createSurface',
  surfaceId: 'dashboard-1',
  components: [component],
  dataModel: { user: { name: 'Alice' } }
}
```

**Available Types:**
- `A2UIComponent` - Component definition with id, type, properties, children
- `ComponentType` - Union of all 17 standard component types
- `A2UIMessage` - Union of all protocol messages
- `A2UICreateSurface` - Create new UI surface
- `A2UIUpdateComponents` - Update existing components
- `A2UIUserAction` - User interaction event
- `DataModel` - JSON data structure for binding
- `SurfaceId` - Unique surface identifier

### 🔹 JSON Pointer (RFC 6901)

Complete implementation of [RFC 6901](https://datatracker.ietf.org/doc/html/rfc6901) for accessing and manipulating nested JSON data.

```typescript
import { JSONPointer } from '@ainative/ai-kit-a2ui-core/json-pointer'

const data = {
  user: {
    profile: {
      name: 'Alice',
      email: 'alice@example.com'
    },
    settings: {
      theme: 'dark',
      notifications: true
    }
  },
  posts: [
    { id: 1, title: 'First post' },
    { id: 2, title: 'Second post' }
  ]
}

// ✅ Resolve - Get value at pointer
const name = JSONPointer.resolve(data, '/user/profile/name')
// => 'Alice'

const firstPost = JSONPointer.resolve(data, '/posts/0/title')
// => 'First post'

// ✅ Set - Update value at pointer
JSONPointer.set(data, '/user/settings/theme', 'light')
// data.user.settings.theme is now 'light'

// ✅ Remove - Delete value at pointer
JSONPointer.remove(data, '/user/settings/notifications')
// data.user.settings.notifications is now undefined

// ✅ Has - Check if pointer exists
const hasEmail = JSONPointer.has(data, '/user/profile/email')
// => true

// ✅ Compile - Pre-compile pointer for performance
const compiled = JSONPointer.compile('/user/profile/name')
const cachedName = compiled.get(data)
// => 'Alice'

// ✅ Parse - Get path segments from pointer
const segments = JSONPointer.parse('/user/profile/name')
// => ['user', 'profile', 'name']

// ✅ Format - Create pointer from segments
const pointer = JSONPointer.format(['posts', '0', 'title'])
// => '/posts/0/title'

// ✅ Escape - Escape special characters
const escaped = JSONPointer.escape('field/with~slash')
// => 'field~1with~0slash'

// ✅ Unescape - Unescape special characters
const unescaped = JSONPointer.unescape('field~1with~0slash')
// => 'field/with~slash'
```

**API Methods:**
- `resolve(obj, pointer)` - Get value at pointer (returns `any`)
- `set(obj, pointer, value)` - Set value at pointer (mutates object)
- `remove(obj, pointer)` - Delete value at pointer (mutates object)
- `has(obj, pointer)` - Check if pointer exists (returns `boolean`)
- `compile(pointer)` - Pre-compile pointer for performance
- `parse(pointer)` - Get path segments (returns `string[]`)
- `format(segments)` - Create pointer from segments (returns `string`)
- `escape(str)` - Escape special characters (`/` → `~1`, `~` → `~0`)
- `unescape(str)` - Unescape special characters

### 🔹 WebSocket Transport

Framework-agnostic WebSocket client for real-time agent communication with automatic reconnection and event handling.

```typescript
import { A2UITransport } from '@ainative/ai-kit-a2ui-core/transport'
import type { TransportStatus } from '@ainative/ai-kit-a2ui-core/transport'

// Create transport instance
const transport = new A2UITransport('wss://api.ainative.studio/agents/chat', {
  reconnect: true,
  reconnectInterval: 3000,
  maxReconnectAttempts: 5
})

// Listen for status changes
transport.on('statusChange', (status: TransportStatus) => {
  console.log('Connection status:', status)
  // 'connecting' | 'connected' | 'disconnecting' | 'disconnected' | 'reconnecting' | 'error'
})

// Listen for agent messages
transport.on('createSurface', (message) => {
  console.log('New surface:', message.surfaceId)
  console.log('Components:', message.components)
  console.log('Data model:', message.dataModel)
})

transport.on('updateComponents', (message) => {
  console.log('Component updates:', message.updates)
  // Handle partial updates to existing components
})

transport.on('error', (error) => {
  console.error('Transport error:', error)
})

// Connect to agent
await transport.connect()

// Send user actions
transport.send({
  type: 'userAction',
  surfaceId: 'chat-1',
  action: 'send-message',
  context: {
    componentId: 'input-1',
    message: 'Hello, agent!'
  }
})

// Disconnect when done
await transport.disconnect()
```

**Constructor Options:**
```typescript
interface A2UITransportOptions {
  reconnect?: boolean           // Auto-reconnect on disconnect (default: true)
  reconnectInterval?: number    // Delay between reconnect attempts in ms (default: 3000)
  maxReconnectAttempts?: number // Maximum reconnection attempts (default: Infinity)
}
```

**Events:**
- `statusChange` - Connection status changed
- `createSurface` - Agent created new UI surface
- `updateComponents` - Agent updated existing components
- `error` - Transport error occurred

**Methods:**
- `connect()` - Connect to WebSocket (returns `Promise<void>`)
- `disconnect()` - Gracefully disconnect (returns `Promise<void>`)
- `send(message)` - Send message to agent
- `on(event, handler)` - Register event listener
- `off(event, handler)` - Remove event listener

### 🔹 Component Registry

Extensible registry for managing component definitions with built-in catalog of 17 A2UI standard components.

```typescript
import { ComponentRegistry } from '@ainative/ai-kit-a2ui-core/registry'
import type { ComponentDefinition } from '@ainative/ai-kit-a2ui-core/registry'

// Create registry with standard components
const registry = ComponentRegistry.standard()

// Get component definition
const textDef = registry.get('text')
console.log(textDef.type)        // 'text'
console.log(textDef.category)    // 'content'
console.log(textDef.description) // 'Display static or dynamic text'

// Register custom component
registry.register('customChart', {
  type: 'customChart',
  category: 'visualization',
  description: 'Interactive data visualization chart',
  schema: {
    properties: {
      data: { type: 'array', required: true },
      chartType: { type: 'string', enum: ['bar', 'line', 'pie'] }
    }
  },
  defaultProps: {
    chartType: 'bar',
    width: 600,
    height: 400
  }
})

// Check if component exists
const hasChart = registry.has('customChart') // true

// Get all component types
const types = registry.types()
// => ['text', 'heading', 'button', ..., 'customChart']

// Get components by category
const contentComponents = registry.byCategory('content')
// => ['text', 'heading', 'image', 'video', 'audioPlayer', 'icon']

// Remove component
registry.unregister('customChart')
```

**Standard Components (21 total):**

**Content Components (6):**
- `text` - Display static or dynamic text
- `heading` - Heading with configurable level (H1-H6)
- `image` - Display images with alt text
- `video` - Video player with controls
- `audioPlayer` - Audio player with controls
- `icon` - Display icons (SVG or icon font)

**Input Components (6):**
- `textField` - Text input with label
- `button` - Clickable button
- `checkBox` - Checkbox with label
- `slider` - Range slider input
- `choicePicker` - Select dropdown or radio group
- `dateTimeInput` - Date/time picker

**Layout Components (5):**
- `card` - Container with optional header/footer
- `row` - Horizontal flex layout
- `column` - Vertical flex layout
- `modal` - Dialog/modal overlay
- `tabs` - Tabbed navigation
- `list` - Ordered or unordered list

**Video Components (4) - NEW in v0.10:**
- `videoRecorder` - Video recording with AI transcription and metadata
- `videoCall` - Real-time video conferencing with WebRTC
- `aiVideo` - AI-powered video generation and editing
- `aiVideoPlayer` - Enhanced video player with semantic search and recommendations

**Utility Components (1):**
- `divider` - Horizontal separator line

## 🏗️ Architecture

### Package Structure

```
@ainative/ai-kit-a2ui-core/
├── types/              # Protocol type definitions
│   ├── component.ts    # Component types
│   ├── message.ts      # Message types
│   └── index.ts        # Public exports
├── json-pointer/       # RFC 6901 implementation
│   ├── JSONPointer.ts  # Core implementation
│   └── index.ts        # Public exports
├── transport/          # WebSocket transport
│   ├── A2UITransport.ts # Transport class
│   └── index.ts        # Public exports
├── registry/           # Component registry
│   ├── ComponentRegistry.ts # Registry class
│   ├── standard.ts     # Standard catalog
│   └── index.ts        # Public exports
└── index.ts            # Main entry point
```

### Module Exports

```typescript
// Main entry point
import {
  A2UITransport,
  JSONPointer,
  ComponentRegistry
} from '@ainative/ai-kit-a2ui-core'

// Subpath imports (tree-shakeable)
import { JSONPointer } from '@ainative/ai-kit-a2ui-core/json-pointer'
import { A2UITransport } from '@ainative/ai-kit-a2ui-core/transport'
import { ComponentRegistry } from '@ainative/ai-kit-a2ui-core/registry'
import type { A2UIComponent } from '@ainative/ai-kit-a2ui-core/types'
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Coverage

```
Test Files  50+ passed
     Tests  429 passed (429)
  Coverage  96.52% overall
```

**Coverage by Module:**
- Core Protocol: 95.85%
  - Types: 100% (type-only, no runtime)
  - JSON Pointer: 100% (28/28 tests)
  - Transport: 92.1% (25/25 tests)
  - Registry: 100% (16/16 tests)
- Video Protocol (v0.10): 98%+
  - Video types and messages: 100%
  - Video handlers: 96%+
- AI Intelligence (v0.11): 94%+
  - Semantic search: 100%
  - AI metadata: 100%
  - Progress tracking: 93%+
  - Recommendations: 88%+

## 📊 Bundle Size

- **ESM**: ~18 KB minified, ~6 KB gzipped
- **CJS**: ~19 KB minified, ~6.5 KB gzipped
- **Zero runtime dependencies** (only TypeScript for types)

## 🔧 Development

### Build

```bash
npm run build
```

**Output:**
- `dist/index.js` - ESM module
- `dist/index.cjs` - CommonJS module
- `dist/index.d.ts` - TypeScript definitions
- `dist/{module}/` - Individual module exports

### Type Checking

```bash
npm run type-check
```

### Linting & Formatting

```bash
npm run lint
npm run format
```

## 📄 API Reference

### Types Module

```typescript
import type {
  // Components
  A2UIComponent,
  ComponentType,
  ComponentProperties,

  // Messages
  A2UIMessage,
  A2UICreateSurface,
  A2UIUpdateComponents,
  A2UIUserAction,

  // Data
  DataModel,
  SurfaceId
} from '@ainative/ai-kit-a2ui-core/types'
```

### JSON Pointer Module

```typescript
import { JSONPointer } from '@ainative/ai-kit-a2ui-core/json-pointer'

// Static methods
JSONPointer.resolve(obj: any, pointer: string): any
JSONPointer.set(obj: any, pointer: string, value: any): void
JSONPointer.remove(obj: any, pointer: string): boolean
JSONPointer.has(obj: any, pointer: string): boolean
JSONPointer.compile(pointer: string): CompiledPointer
JSONPointer.parse(pointer: string): string[]
JSONPointer.format(segments: string[]): string
JSONPointer.escape(str: string): string
JSONPointer.unescape(str: string): string
```

### Transport Module

```typescript
import { A2UITransport } from '@ainative/ai-kit-a2ui-core/transport'
import type { TransportStatus, A2UITransportOptions } from '@ainative/ai-kit-a2ui-core/transport'

class A2UITransport {
  constructor(url: string, options?: A2UITransportOptions)

  connect(): Promise<void>
  disconnect(): Promise<void>
  send(message: A2UIMessage): void

  on(event: 'statusChange', handler: (status: TransportStatus) => void): void
  on(event: 'createSurface', handler: (message: A2UICreateSurface) => void): void
  on(event: 'updateComponents', handler: (message: A2UIUpdateComponents) => void): void
  on(event: 'error', handler: (error: Error) => void): void

  off(event: string, handler: Function): void
}
```

### Registry Module

```typescript
import { ComponentRegistry } from '@ainative/ai-kit-a2ui-core/registry'
import type { ComponentDefinition } from '@ainative/ai-kit-a2ui-core/registry'

class ComponentRegistry {
  static standard(): ComponentRegistry

  register(type: ComponentType, definition: ComponentDefinition): void
  get(type: ComponentType): ComponentDefinition | undefined
  has(type: ComponentType): boolean
  unregister(type: ComponentType): boolean

  types(): ComponentType[]
  byCategory(category: string): ComponentType[]
}
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Clone repository
git clone https://github.com/AINative-Studio/ai-kit-a2ui-core.git
cd ai-kit-a2ui-core

# Install dependencies
npm install

# Run tests in watch mode
npm run test:watch

# Build
npm run build
```

## 📝 License

MIT © [AINative Studio](https://ainative.studio)

## 🔗 Links

- **Documentation**: https://docs.ainative.studio/a2ui
- **GitHub**: https://github.com/AINative-Studio/ai-kit-a2ui-core
- **NPM**: https://www.npmjs.com/package/@ainative/ai-kit-a2ui-core
- **Issues**: https://github.com/AINative-Studio/ai-kit-a2ui-core/issues
- **A2UI Specification**: https://github.com/google/a2ui

## 🙋 Support

- **Email**: hello@ainative.studio
- **Discord**: [AINative Community](https://discord.gg/ainative)
- **Documentation**: https://docs.ainative.studio

---

**Built with ❤️ by [AINative Studio](https://ainative.studio)**
