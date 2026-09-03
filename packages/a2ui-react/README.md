# @ainative/a2ui-react

React bindings and components for A2UI Core - Type-safe, headless, and framework-agnostic.

## Installation

```bash
npm install @ainative/a2ui-react react react-dom
```

## Quick Start

### Pre-built Components

Production-ready chat interfaces with CSS Modules (no global style pollution), dark mode, and WCAG 2.1 AA accessibility.

```tsx
import { A2UIChat, A2UIPopup, A2UISidebar } from '@ainative/a2ui-react'
import type { Message } from '@ainative/a2ui-react'

// Full chat interface
<A2UIChat messages={messages} onMessage={handleMessage} theme="dark" />

// Floating popup launcher
<A2UIPopup position="bottom-right" chatProps={{ onMessage: handleMessage }} />

// Docked sidebar panel
<A2UISidebar position="right" mode="overlay" chatProps={{ onMessage: handleMessage }} />
```

### Headless Hooks

The package provides three headless hooks for different use cases:

#### 1. useCoAgent - Bidirectional State Sync

```tsx
import { useCoAgent } from '@ainative/a2ui-react/headless'

function Counter() {
  const agent = useCoAgent<{ count: number }>(
    { url: 'wss://api.example.com/agent' },
    { count: 0 }
  )

  return (
    <div>
      <p>Count: {agent.state.count}</p>
      <button onClick={() => agent.setState({ count: agent.state.count + 1 })}>
        Increment
      </button>
      <p>Status: {agent.isConnected ? 'Connected' : 'Disconnected'}</p>
    </div>
  )
}
```

#### 2. useA2UIAgent - Full A2UI Protocol

```tsx
import { useA2UIAgent } from '@ainative/a2ui-react/headless'

function Dashboard() {
  const agent = useA2UIAgent({
    url: 'wss://api.example.com/agent',
    autoConnect: true
  })

  const dashboardSurface = agent.surfaces.get('dashboard-1')

  return (
    <div>
      {dashboardSurface?.components.map(component => (
        <ComponentRenderer key={component.id} component={component} />
      ))}
    </div>
  )
}
```

#### 3. useHumanInTheLoop - Approval Workflows

```tsx
import { useHumanInTheLoop } from '@ainative/a2ui-react/headless'

function DeleteButton() {
  const hitl = useHumanInTheLoop<{ userId: string }>()

  async function handleDelete() {
    const approved = await hitl.requestApproval('delete-user', {
      userId: '123'
    }, 30000)

    if (approved) {
      await deleteUser('123')
    }
  }

  return (
    <>
      <button onClick={handleDelete}>Delete User</button>
      
      {hitl.pendingApprovals.map(approval => (
        <ApprovalDialog
          key={approval.id}
          {...approval}
          onApprove={() => hitl.approve(approval.id)}
          onReject={() => hitl.reject(approval.id)}
        />
      ))}
    </>
  )
}
```

## Storybook

View live component documentation and examples:

```bash
npm run storybook
```

Access at: `http://localhost:6006`

## Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## Development

```bash
# Build library
npm run build

# Type checking
npm run type-check

# Lint
npm run lint
```

## Project Status

### Completed
- [x] Package structure
- [x] Storybook 7.x configuration
- [x] Design system with CSS tokens
- [x] Headless hooks (useCoAgent, useA2UIAgent, useA2UIAction, useA2UIState, useHumanInTheLoop)
- [x] Pre-built components (A2UIChat, A2UIPopup, A2UISidebar)
- [x] TypeScript strict mode
- [x] Accessibility addon enabled + jest-axe tests
- [x] Dark mode support configured

### TODO
- [ ] Verify 90%+ coverage after workspace install (see root `pnpm install`)
- [ ] Publish v1.0.0 to npm

## Component Guidelines

New components under `src/components/` should follow the pattern used by `A2UIChat`/`A2UIPopup`/`A2UISidebar`:

```
src/components/ComponentName.tsx        # Component implementation
src/components/ComponentName.module.css # Scoped CSS (NO global styles)
tests/components/ComponentName.test.tsx # Tests (90%+ coverage)
stories/ComponentName.stories.tsx       # Storybook stories
```

### TypeScript Requirements

- Strict mode enabled (no 'any' types)
- Full type safety for props
- JSDoc documentation
- Exported type definitions

### Accessibility Checklist

- [ ] Keyboard navigation (Tab, Enter, ESC)
- [ ] ARIA labels and roles
- [ ] Screen reader announcements
- [ ] Color contrast (4.5:1 text, 3:1 UI)
- [ ] Touch targets ≥44×44px
- [ ] Focus indicators visible
- [ ] jest-axe tests passing

### Test Requirements

- [ ] Rendering tests
- [ ] User interaction tests
- [ ] Accessibility tests
- [ ] Edge case handling
- [ ] 90%+ coverage (statements, branches, functions, lines)

### Storybook Stories

Each component needs:
- Default story
- Dark theme variant
- All state variations (loading, error, empty, success)
- Custom styling examples
- Interactive Args controls

## License

MIT © AINative Studio
