# @ainative/a2ui-react

React bindings and components for A2UI Core - Type-safe, headless, and framework-agnostic.

## Installation

```bash
npm install @ainative/a2ui-react
```

## Quick Start

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
- [x] Storybook 8.x configuration
- [x] Design system with CSS tokens
- [x] Headless hooks (useCoAgent, useA2UIAgent, useHumanInTheLoop)
- [x] TypeScript strict mode
- [x] Accessibility addon enabled
- [x] Dark mode support configured

### TODO
- [ ] A2UIChat component implementation
- [ ] A2UIPopup component implementation
- [ ] A2UISidebar component implementation
- [ ] Comprehensive test suite (85%+ coverage)
- [ ] Complete Storybook stories for all components
- [ ] Production build and deployment

## Component Implementation Guide

Each component should follow this pattern:

### 1. Component Structure

```
src/components/ComponentName/
├── ComponentName.tsx        # Component implementation
├── ComponentName.module.css # Scoped CSS (NO global styles)
├── ComponentName.test.tsx   # Tests (85%+ coverage)
└── ComponentName.stories.tsx # Storybook stories
```

### 2. TypeScript Requirements

- Strict mode enabled (no 'any' types)
- Full type safety for props
- JSDoc documentation
- Exported type definitions

### 3. Accessibility Checklist

- [ ] Keyboard navigation (Tab, Enter, ESC)
- [ ] ARIA labels and roles
- [ ] Screen reader announcements
- [ ] Color contrast (4.5:1 text, 3:1 UI)
- [ ] Touch targets ≥44×44px
- [ ] Focus indicators visible
- [ ] jest-axe tests passing

### 4. Test Requirements

- [ ] Rendering tests
- [ ] User interaction tests
- [ ] Accessibility tests
- [ ] Edge case handling
- [ ] 85%+ coverage (statements, branches, functions, lines)

### 5. Storybook Stories

Each component needs:
- Default story
- Dark theme variant
- All state variations (loading, error, empty, success)
- Custom styling examples
- Interactive Args controls

## License

MIT © AINative Studio
