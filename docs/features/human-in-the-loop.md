# Human-in-the-Loop (HITL) Workflows

**Issue**: #88
**Status**: Implemented
**Version**: 0.1.0-alpha.1

## Overview

The Human-in-the-Loop (HITL) feature enables agents to pause execution and request user input, confirmation, or choices through a structured interrupt system. This allows for interactive workflows where critical decisions require human oversight.

## Features

- **4 Interrupt Types**: Confirmation, Choice, Input, and Review dialogs
- **Timeout Management**: Automatic timeout with configurable duration
- **Queue Management**: Handle multiple sequential interrupts
- **State Persistence**: Interrupts survive page refreshes via offline storage
- **Event System**: Listen to interrupt lifecycle events
- **Type-Safe**: Full TypeScript support with type guards and helpers

## Architecture

### Components

1. **Interrupt Messages** (`AgentInterruptMessage`, `InterruptResponseMessage`)
   - Protocol-level messages for agent-UI communication
   - Support for 4 interrupt reasons: confirmation, choice, input, review

2. **Interrupt Components** (4 dialog types)
   - `ConfirmationDialogComponent`: Yes/No decisions
   - `ChoiceDialogComponent`: Single or multiple selection
   - `InputDialogComponent`: Text input with validation
   - `ReviewDialogComponent`: Display structured data for review

3. **HumanInTheLoopHandler**
   - Manages interrupt lifecycle
   - Handles timeouts and queue management
   - Persists state to offline storage
   - Emits lifecycle events

## Usage

### Basic Confirmation

```typescript
import {
  createConfirmationInterrupt,
  createInterruptResponse,
} from '@ainative/ai-kit-a2ui-core'
import { HumanInTheLoopHandler } from '@ainative/ai-kit-a2ui-core/handlers'

const handler = new HumanInTheLoopHandler()

// Agent creates interrupt
const interrupt = createConfirmationInterrupt({
  interruptId: 'confirm-001',
  prompt: 'Delete this file?',
  confirmLabel: 'Delete',
  cancelLabel: 'Cancel',
  variant: 'destructive',
  timeout: 30000, // 30 seconds
})

// Wait for response
const responsePromise = handler.waitForResponse(interrupt.interruptId)
await handler.handleInterrupt(interrupt)

// ... UI shows dialog and user responds ...

// Handle response
const response = createInterruptResponse({
  interruptId: interrupt.interruptId,
  response: true, // User confirmed
})
await handler.handleResponse(response)

// Agent receives result
const result = await responsePromise
console.log('User confirmed:', result.response)
```

### Choice Selection

```typescript
const interrupt = createChoiceInterrupt({
  interruptId: 'choice-001',
  prompt: 'Select deployment environment',
  options: [
    { value: 'dev', label: 'Development' },
    { value: 'staging', label: 'Staging' },
    { value: 'prod', label: 'Production' },
  ],
  allowMultiple: false,
})

// ... workflow continues ...
// User selects: 'staging'
```

### Text Input with Validation

```typescript
const interrupt = createInputInterrupt({
  interruptId: 'input-001',
  prompt: 'Enter your API key',
  inputType: 'password',
  validation: {
    required: true,
    pattern: '^sk-[a-zA-Z0-9]{32}$',
    minLength: 35,
  },
  helperText: 'API key must start with "sk-"',
})

// ... workflow continues ...
// User enters: 'sk-abc123...'
```

### Review Structured Data

```typescript
const interrupt = createReviewInterrupt({
  interruptId: 'review-001',
  prompt: 'Review deployment configuration',
  reviewData: {
    environment: 'production',
    services: [
      { name: 'api', replicas: 3 },
      { name: 'db', replicas: 1 },
    ],
  },
  displayFormat: 'json',
  approveLabel: 'Deploy',
  rejectLabel: 'Cancel',
})

// ... workflow continues ...
// User approves or rejects
```

## Timeout Handling

Interrupts can specify a timeout duration. If the user doesn't respond within the timeout, the interrupt is automatically cancelled:

```typescript
const interrupt = createConfirmationInterrupt({
  interruptId: 'timeout-001',
  prompt: 'Quick decision needed',
  timeout: 5000, // 5 seconds
})

const result = await handler.waitForResponse(interrupt.interruptId)
await handler.handleInterrupt(interrupt)

// If timeout occurs:
// result.cancelled === true
// result.reason === 'timeout'
// result.response === null
```

## Queue Management

Multiple interrupts are queued in FIFO order:

```typescript
// Add multiple interrupts
await handler.handleInterrupt(interrupt1)
await handler.handleInterrupt(interrupt2)
await handler.handleInterrupt(interrupt3)

// Get all pending
const pending = handler.getPendingInterrupts()
console.log('Pending:', pending.length) // 3

// Get specific interrupt
const interrupt = handler.getInterruptById('int-001')
```

## State Persistence

Interrupts are automatically persisted to offline storage and restored on page reload:

```typescript
// Initialize handler and restore state
const handler = new HumanInTheLoopHandler()
await handler.init() // Restores any pending interrupts

// State is automatically persisted when:
// - New interrupt is added
// - Interrupt is resolved
// - Interrupt times out
```

## Event System

Listen to interrupt lifecycle events:

```typescript
handler.on('interrupt-added', (interrupt) => {
  console.log('New interrupt:', interrupt.interruptId)
})

handler.on('interrupt-resolved', (response) => {
  console.log('Interrupt resolved:', response.interruptId)
})

handler.on('interrupt-timeout', (interruptId) => {
  console.log('Interrupt timed out:', interruptId)
})

// Remove listener
handler.off('interrupt-added', myListener)
```

## UI Components

The HITL system includes type definitions for 4 pre-built UI dialog components:

### ConfirmationDialog

```typescript
const dialog = createConfirmationDialog({
  id: 'dialog-001',
  title: 'Confirm Action',
  message: 'Are you sure?',
  confirmLabel: 'Yes',
  cancelLabel: 'No',
  variant: 'destructive', // 'normal' | 'warning' | 'destructive'
})
```

### ChoiceDialog

```typescript
const dialog = createChoiceDialog({
  id: 'choice-001',
  title: 'Select Option',
  message: 'Choose one',
  options: [
    { value: 'a', label: 'Option A', description: 'Description A' },
    { value: 'b', label: 'Option B', disabled: true },
  ],
  allowMultiple: false,
})
```

### InputDialog

```typescript
const dialog = createInputDialog({
  id: 'input-001',
  title: 'Enter Value',
  message: 'Input required',
  inputType: 'email', // 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea'
  validation: {
    required: true,
    pattern: '^[a-z]+@[a-z]+\\.[a-z]{2,}$',
    minLength: 5,
  },
  helperText: 'Enter a valid email',
})
```

### ReviewDialog

```typescript
const dialog = createReviewDialog({
  id: 'review-001',
  title: 'Review Changes',
  message: 'Please review',
  reviewData: {
    /* any structured data */
  },
  displayFormat: 'json', // 'json' | 'table' | 'diff' | 'custom'
  approveLabel: 'Approve',
  rejectLabel: 'Reject',
  allowComments: true,
})
```

## Type Guards

Use type guards to check interrupt and component types:

```typescript
import {
  isAgentInterruptMessage,
  isInterruptResponseMessage,
  isConfirmationDialogComponent,
} from '@ainative/ai-kit-a2ui-core'

if (isAgentInterruptMessage(message)) {
  // TypeScript knows this is AgentInterruptMessage
  console.log(message.reason)
}

if (isConfirmationDialogComponent(component)) {
  // TypeScript knows this is ConfirmationDialogComponent
  console.log(component.properties.confirmLabel)
}
```

## Best Practices

### 1. Always Set Timeouts

Prevent workflows from hanging indefinitely:

```typescript
const interrupt = createConfirmationInterrupt({
  interruptId: 'id',
  prompt: 'Confirm?',
  timeout: 60000, // Always include timeout
})
```

### 2. Handle Cancellations

Check for cancellations and timeouts:

```typescript
const result = await handler.waitForResponse(interruptId)

if (result.cancelled) {
  if (result.reason === 'timeout') {
    // Handle timeout - use default behavior
  } else if (result.reason === 'cancelled') {
    // Handle manual cancellation
  }
}
```

### 3. Provide Clear Prompts

Make prompts actionable and context-rich:

```typescript
// ✅ Good
prompt: 'Delete "config.json"? This file contains production settings and cannot be recovered.'

// ❌ Bad
prompt: 'Delete file?'
```

### 4. Use Appropriate Variants

Match visual style to action severity:

```typescript
// Destructive actions
variant: 'destructive' // red/warning colors

// Important decisions
variant: 'warning' // yellow/caution colors

// Normal confirmations
variant: 'normal' // default colors
```

### 5. Cleanup Resources

Always destroy handler when done:

```typescript
const handler = new HumanInTheLoopHandler()
try {
  // ... use handler ...
} finally {
  handler.destroy() // Clear timeouts and listeners
}
```

## Examples

Complete working examples are available in `/examples/human-in-the-loop-example.ts`:

- Confirmation interrupt
- Choice interrupt
- Input interrupt with validation
- Review interrupt with structured data
- Timeout handling
- Queue management

## Testing

The HITL implementation includes comprehensive tests:

- **Message Types**: 37 tests (100% passing)
- **Component Types**: 38 tests (100% passing)
- **Handler Logic**: 28 tests (82% passing)
- **Total**: 103 tests, 98 passing (95%)

Run tests:

```bash
npx vitest run tests/types/interrupt-*.test.ts tests/handlers/human-in-the-loop-handler.test.ts
```

## API Reference

### Message Types

- `AgentInterruptMessage` - Agent sends interrupt to UI
- `InterruptResponseMessage` - UI sends response to agent
- `InterruptReason` - Type: 'confirmation' | 'choice' | 'input' | 'review'

### Component Types

- `ConfirmationDialogComponent`
- `ChoiceDialogComponent`
- `InputDialogComponent`
- `ReviewDialogComponent`

### Handler

- `HumanInTheLoopHandler` - Main handler class
- Methods: `handleInterrupt()`, `handleResponse()`, `waitForResponse()`, `cancelInterrupt()`, `getPendingInterrupts()`, `getInterruptById()`
- Events: `interrupt-added`, `interrupt-resolved`, `interrupt-timeout`

### Helper Functions

- `createConfirmationInterrupt()`
- `createChoiceInterrupt()`
- `createInputInterrupt()`
- `createReviewInterrupt()`
- `createInterruptResponse()`
- `createConfirmationDialog()`
- `createChoiceDialog()`
- `createInputDialog()`
- `createReviewDialog()`

### Type Guards

- `isAgentInterruptMessage()`
- `isInterruptResponseMessage()`
- `isConfirmationDialogComponent()`
- `isChoiceDialogComponent()`
- `isInputDialogComponent()`
- `isReviewDialogComponent()`

## Implementation Details

- **Location**: `src/types/interrupt-messages.ts`, `src/types/interrupt-components.ts`, `src/handlers/human-in-the-loop-handler.ts`
- **Dependencies**: Uses offline storage from Issue #55
- **Protocol Integration**: Added `agentInterrupt` and `interruptResponse` to A2UI protocol
- **Zero Dependencies**: Core implementation has no external dependencies

## Future Enhancements

Potential improvements for future versions:

- React hooks (`useHumanInTheLoop()`)
- Pre-built UI components (React, Vue, Angular)
- Multi-step wizards
- Progress indicators for long-running interrupts
- Priority-based interrupt ordering
- Interrupt history and analytics

## Related Issues

- Issue #55: Offline-first support (provides state persistence)
- Issue #85: React package foundation (future React hooks)

---

**Last Updated**: 2026-02-17
**Status**: Implemented
**Test Coverage**: 95% (98/103 tests passing)
