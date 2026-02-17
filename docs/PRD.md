# Product Requirements Document: @ainative/ai-kit-a2ui-core (Framework-Agnostic Core)

**Version:** 1.0
**Status:** Planning
**Timeline:** Week 14 (Phase 5)
**Story Points:** 16
**Last Updated:** 2025-12-23

---

## Executive Summary

Build a framework-agnostic core library that provides shared utilities for all A2UI renderers (React, Next.js, Vue, Svelte). Includes JSON Pointer implementation, WebSocket transport, protocol types, and component registry - with ZERO runtime dependencies.

---

## Problem Statement

**Current State:**
- Each renderer duplicates core logic
- No shared TypeScript types across frameworks
- JSON Pointer implemented 4 times
- WebSocket client duplicated

**Target Users:**
- Internal: All 4 framework renderer packages
- External: Developers building custom renderers

---

## Solution Overview

A core library (`@ainative/ai-kit-a2ui-core`) that:

1. **Protocol Types** - Complete TypeScript definitions for A2UI v0.9
2. **JSON Pointers** - RFC 6901 compliant implementation
3. **WebSocket Transport** - Framework-agnostic agent communication
4. **Component Registry** - Extensible component catalog system
5. **Zero Dependencies** - Pure TypeScript, no runtime deps

---

## Goals & Objectives

### Primary Goals
1. ✅ 100% A2UI v0.9 protocol coverage
2. ✅ RFC 6901 JSON Pointer implementation
3. ✅ WebSocket transport layer
4. ✅ Zero runtime dependencies
5. ✅ 100% test coverage

### Success Metrics
- **Bundle Size:** < 20 KB gzipped
- **Dependencies:** 0 runtime
- **Coverage:** 100%
- **Type Safety:** strict: true
- **Reuse:** 80% code shared across renderers

---

## Technical Requirements

### Zero Dependencies
```json
{
  "dependencies": {}  // Zero runtime dependencies!
}
```

### Build Requirements
- **TypeScript:** 5.0+ (strict: true)
- **Build Tool:** tsup (ESM + CJS)
- **Output:** Types + ESM + CJS
- **Testing:** Vitest (100% coverage)

---

## Core Modules

### 1. Protocol Types
```typescript
// Complete A2UI v0.9 types
export interface A2UIComponent {
  id: string
  type: ComponentType
  properties?: Record<string, any>
  children?: string[]
}

export interface A2UIMessage {
  type: 'createSurface' | 'updateComponents' | 'updateDataModel' | 'deleteSurface'
  // ... all message types
}

export type ComponentType =
  | 'card' | 'text' | 'button' | 'row' | 'column'
  | 'modal' | 'tabs' | 'list' | 'textField' | 'checkBox'
  | 'slider' | 'choicePicker' | 'dateTimeInput' | 'image'
  | 'video' | 'audioPlayer' | 'icon' | 'divider'
```

### 2. JSON Pointer (RFC 6901)
```typescript
export class JSONPointer {
  static resolve<T>(object: any, pointer: string): T | undefined
  static set(object: any, pointer: string, value: any): void
  static remove(object: any, pointer: string): boolean
  static compile(pointer: string): string[]
}

// Examples:
JSONPointer.resolve(data, '/user/profile/name')
JSONPointer.set(data, '/items/0/title', 'New Title')
JSONPointer.remove(data, '/deprecated/field')
```

### 3. WebSocket Transport
```typescript
export class A2UITransport extends EventEmitter {
  constructor(url: string, options?: TransportOptions)

  connect(): Promise<void>
  disconnect(): void
  send(message: A2UIMessage): void

  on(event: 'createSurface', handler: (data) => void): void
  on(event: 'updateComponents', handler: (data) => void): void
  // ... all message types

  get status(): 'disconnected' | 'connecting' | 'connected'
  get isConnected(): boolean
}
```

### 4. Component Registry
```typescript
export class ComponentRegistry {
  register(type: string, definition: ComponentDefinition): void
  get(type: string): ComponentDefinition | undefined
  has(type: string): boolean

  static standard(): ComponentRegistry  // Pre-loaded with 17 components
}

// Usage:
const registry = ComponentRegistry.standard()
registry.register('customButton', {...})
```

---

## API Design

### JSON Pointer
```typescript
import { JSONPointer } from '@ainative/ai-kit-a2ui-core'

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
import { A2UITransport } from '@ainative/ai-kit-a2ui-core'

const transport = new A2UITransport('wss://agent.example.com')

transport.on('createSurface', ({ components, dataModel }) => {
  console.log('Surface created:', components)
})

transport.on('updateComponents', ({ updates }) => {
  console.log('Components updated:', updates)
})

await transport.connect()
transport.send({ type: 'userAction', action: 'submit', data: {...} })
```

### Component Registry
```typescript
import { ComponentRegistry } from '@ainative/ai-kit-a2ui-core'

// Standard catalog
const registry = ComponentRegistry.standard()

// Custom component
registry.register('customChart', {
  type: 'customChart',
  schema: {...},
  defaultProps: {...}
})

// Check existence
if (registry.has('customChart')) {
  const definition = registry.get('customChart')
}
```

---

## User Stories

### Story 1: Framework Renderer Authors
**As a** framework renderer developer
**I want** shared core utilities
**So that** I don't duplicate code

**Acceptance Criteria:**
- All renderers use same JSON Pointer impl
- All renderers use same WebSocket transport
- All renderers use same protocol types

### Story 2: Custom Renderer Developers
**As an** external developer
**I want** to build custom A2UI renderer
**So that** I can support my framework

**Acceptance Criteria:**
- Core package is documented
- Examples show how to build renderer
- Type definitions are complete

---

## Implementation Timeline

### Week 14: Core Development
- [x] Issue #1: Package setup (2 pts)
- [x] Issue #2: Protocol types (3 pts)
- [x] Issue #3: JSON Pointer (2 pts)
- [x] Issue #4: WebSocket transport (3 pts)
- [x] Issue #5: Component registry (2 pts)
- [x] Issue #6: Tests (2 pts)
- [x] Issue #7: Documentation (2 pts)

**Total:** 16 story points

---

## Testing Strategy

### Unit Tests
- JSON Pointer edge cases
- WebSocket connection management
- Component registry operations
- Protocol type guards

### Coverage Target
- **Minimum:** 100% (strict requirement)
- All edge cases tested
- All error paths tested

---

## Dependencies & Risks

### Critical Dependencies
- **None!** Zero runtime dependencies

### Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| A2UI spec changes | High | Lock to v0.9, versioning strategy |
| WebSocket API changes | Low | Use standard Web APIs |
| JSON Pointer edge cases | Medium | RFC 6901 compliance testing |

---

## Success Criteria

### Must Have (P0)
- ✅ 100% test coverage
- ✅ Zero runtime dependencies
- ✅ TypeScript strict mode
- ✅ RFC 6901 compliant
- ✅ All 4 renderers use it

### Should Have (P1)
- JSDoc on all APIs
- Published type docs
- Migration guide

### Nice to Have (P2)
- Playground for testing
- Visual protocol explorer

---

## Launch Plan

- **Alpha:** Week 14 (internal)
- **Beta:** Week 14 (with renderers)
- **Stable:** Week 14 (v1.0.0)

**Note:** Core package must be stable FIRST before other renderers can ship.

---

## Code Sharing Strategy

```
@ainative/ai-kit-a2ui-core (80% shared)
    ├── JSON Pointer
    ├── WebSocket Transport
    ├── Protocol Types
    └── Component Registry

@ainative/ai-kit-a2ui (React - 20% React-specific)
@ainative/ai-kit-nextjs-a2ui (Next.js - 20% Next.js-specific)
@ainative/ai-kit-vue-a2ui (Vue - 20% Vue-specific)
@ainative/ai-kit-svelte-a2ui (Svelte - 20% Svelte-specific)
```

---

## Related Documents
- A2UI v0.9 Spec: `/Users/aideveloper/a2ui/specification/0.9/`
- RFC 6901 (JSON Pointer): https://tools.ietf.org/html/rfc6901
- Repository: https://github.com/AINative-Studio/ai-kit-a2ui-core

---

**Approval:**
- [ ] Architecture Lead
- [ ] All Renderer Teams
- [ ] Security Review

**Sign-off Date:** Week 14 Start
