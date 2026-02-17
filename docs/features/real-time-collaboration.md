# Real-Time Collaboration for A2UI Core (Issue #54)

## Overview

The Real-Time Collaboration feature provides multi-user collaboration capabilities for A2UI applications, including shared editing, presence tracking, cursor synchronization, collaborative canvas, and comment threads. This feature enables seamless real-time interaction between multiple users working on the same content.

## Architecture

### Components

The collaboration system consists of three main layers:

1. **Component Layer**: Defines collaboration UI components
2. **Message Layer**: Handles real-time message passing
3. **Handler Layer**: Manages collaboration logic and state

### Conflict Resolution

Three conflict resolution strategies are supported:

- **Last-Write-Wins**: Simplest strategy where the most recent change wins
- **Operational Transform**: Transforms operations to preserve user intentions
- **CRDT**: Conflict-free replicated data types for automatic conflict resolution

## Collaboration Components

### 1. Collaborative Editor

Multi-user text editing with real-time synchronization.

```typescript
import type { CollaborativeEditorComponent } from '@ainative/ai-kit-a2ui-core'

const editor: CollaborativeEditorComponent = {
  type: 'collaborativeEditor',
  id: 'doc-editor-1',
  properties: {
    documentId: 'shared-doc-123',
    mode: 'markdown',
    showCursors: true,
    showSelections: true,
    showPresence: true,
    allowComments: true,
    versionHistory: true,
    conflictResolution: 'operational-transform',
    syncMode: 'realtime',
    metadata: {
      documentTitle: 'Project Proposal',
      lastModified: new Date()
    }
  }
}
```

**Properties:**

- `documentId` (required): Unique document identifier
- `mode`: Editor mode - `text`, `rich-text`, `markdown`, or `code`
- `language`: Programming language for code mode
- `showCursors`: Display other users' cursors
- `showSelections`: Display other users' text selections
- `showPresence`: Display active user list
- `allowComments`: Enable inline commenting
- `versionHistory`: Track document versions
- `conflictResolution`: Strategy for resolving conflicts
- `syncMode`: `realtime` or `debounced`
- `debounceMs`: Delay for debounced sync (default: 100ms)

### 2. Presence Indicator

Shows active users in a collaboration session.

```typescript
import type { PresenceIndicatorComponent } from '@ainative/ai-kit-a2ui-core'

const presence: PresenceIndicatorComponent = {
  type: 'presenceIndicator',
  id: 'presence-1',
  properties: {
    roomId: 'project-room-123',
    maxVisible: 5,
    showAvatars: true,
    showNames: true,
    showStatus: true,
    layout: 'stack',
    clickable: true,
    metadata: {
      title: 'Active Collaborators'
    }
  }
}
```

**Properties:**

- `roomId` (required): Collaboration room identifier
- `maxVisible`: Maximum avatars to display (others show as "+N")
- `showAvatars`: Display user avatar images
- `showNames`: Display user names
- `showStatus`: Display user status (online, away, typing)
- `layout`: Display layout - `stack`, `grid`, or `list`
- `clickable`: Make user indicators clickable for details

### 3. Collaborative Canvas

Shared drawing/whiteboard for visual collaboration.

```typescript
import type { CollaborativeCanvasComponent } from '@ainative/ai-kit-a2ui-core'

const canvas: CollaborativeCanvasComponent = {
  type: 'collaborativeCanvas',
  id: 'whiteboard-1',
  properties: {
    canvasId: 'whiteboard-session-123',
    tools: ['pen', 'eraser', 'shapes', 'text', 'sticky-notes'],
    showToolbar: true,
    allowDrawing: true,
    allowShapes: true,
    allowText: true,
    allowImages: true,
    showGrid: true,
    snapToGrid: true,
    gridSize: 20,
    backgroundColor: '#ffffff',
    width: 1920,
    height: 1080,
    zoomEnabled: true,
    panEnabled: true
  }
}
```

**Properties:**

- `canvasId` (required): Unique canvas identifier
- `tools`: Available tools array
- `showToolbar`: Display toolbar
- `allowDrawing`: Enable freehand drawing
- `allowShapes`: Enable shape creation
- `allowText`: Enable text annotations
- `allowImages`: Enable image uploads
- `showGrid`: Display background grid
- `snapToGrid`: Snap objects to grid
- `gridSize`: Grid size in pixels
- `backgroundColor`: Canvas background color
- `width/height`: Canvas dimensions
- `zoomEnabled`: Enable zoom functionality
- `panEnabled`: Enable pan functionality

### 4. Shared Cursor

Displays other users' cursor positions.

```typescript
import type { SharedCursorComponent } from '@ainative/ai-kit-a2ui-core'

const cursor: SharedCursorComponent = {
  type: 'sharedCursor',
  id: 'cursor-user-456',
  properties: {
    roomId: 'project-room-123',
    userId: 'user-456',
    userName: 'John Doe',
    color: '#ff6b6b',
    position: { x: 250, y: 180 },
    visible: true
  }
}
```

**Properties:**

- `roomId` (required): Room identifier
- `userId` (required): User identifier
- `userName` (required): User display name
- `color` (required): Cursor color
- `position` (required): Current cursor position {x, y}
- `visible`: Cursor visibility state

### 5. Comment Thread

Collaborative commenting system.

```typescript
import type { CommentThreadComponent } from '@ainative/ai-kit-a2ui-core'

const thread: CommentThreadComponent = {
  type: 'commentThread',
  id: 'thread-1',
  properties: {
    threadId: 'thread-doc-123-1',
    entityId: 'doc-123',
    entityType: 'document',
    position: { x: 100, y: 200 },
    comments: [
      {
        id: 'comment-1',
        userId: 'user-1',
        userName: 'Alice Smith',
        userAvatar: 'https://example.com/avatars/alice.jpg',
        content: 'This section needs revision',
        timestamp: new Date('2024-01-15T10:30:00Z'),
        edited: false,
        reactions: { '👍': 3, '❤️': 1 }
      }
    ],
    resolved: false,
    allowReply: true,
    allowReactions: true,
    allowResolve: true
  }
}
```

**Properties:**

- `threadId` (required): Unique thread identifier
- `entityId` (required): Entity being commented on
- `entityType` (required): Type of entity
- `position`: Position for positioned comments
- `comments`: Array of comments in thread
- `resolved`: Whether thread is resolved
- `allowReply`: Enable comment replies
- `allowReactions`: Enable emoji reactions
- `allowResolve`: Enable resolving threads

## Collaboration Messages

### Editor Messages

**Editor Change:**
```typescript
import type { CollaborativeEditorChangeMessage } from '@ainative/ai-kit-a2ui-core'

const change: CollaborativeEditorChangeMessage = {
  type: 'collaborativeEditorChange',
  componentId: 'editor-1',
  documentId: 'doc-123',
  changes: [
    { type: 'insert', position: 0, content: 'Hello ' },
    { type: 'delete', position: 10, length: 5 },
    { type: 'replace', position: 20, length: 3, content: 'World' }
  ],
  userId: 'user-456',
  version: 5,
  timestamp: new Date().toISOString()
}
```

**Editor Sync:**
```typescript
import type { CollaborativeEditorSyncMessage } from '@ainative/ai-kit-a2ui-core'

const sync: CollaborativeEditorSyncMessage = {
  type: 'collaborativeEditorSync',
  componentId: 'editor-1',
  documentId: 'doc-123',
  content: 'Full document content here...',
  version: 10
}
```

### Presence Messages

**Join Room:**
```typescript
import type { PresenceJoinMessage } from '@ainative/ai-kit-a2ui-core'

const join: PresenceJoinMessage = {
  type: 'presenceJoin',
  componentId: 'presence-1',
  roomId: 'room-123',
  user: {
    id: 'user-456',
    name: 'John Doe',
    avatar: 'https://example.com/avatar.jpg',
    color: '#ff6b6b'
  }
}
```

**Update Status:**
```typescript
import type { PresenceUpdateMessage } from '@ainative/ai-kit-a2ui-core'

const update: PresenceUpdateMessage = {
  type: 'presenceUpdate',
  componentId: 'presence-1',
  roomId: 'room-123',
  userId: 'user-456',
  status: 'typing',
  metadata: {
    documentSection: 'introduction'
  }
}
```

### Cursor Messages

**Move Cursor:**
```typescript
import type { CursorMoveMessage } from '@ainative/ai-kit-a2ui-core'

const cursorMove: CursorMoveMessage = {
  type: 'cursorMove',
  componentId: 'cursor-1',
  roomId: 'room-123',
  userId: 'user-456',
  position: { x: 150, y: 220 }
}
```

**Text Selection:**
```typescript
import type { CursorSelectionMessage } from '@ainative/ai-kit-a2ui-core'

const selection: CursorSelectionMessage = {
  type: 'cursorSelection',
  componentId: 'cursor-1',
  roomId: 'room-123',
  userId: 'user-456',
  selection: { start: 10, end: 25 }
}
```

### Canvas Messages

**Draw on Canvas:**
```typescript
import type { CanvasDrawMessage } from '@ainative/ai-kit-a2ui-core'

const draw: CanvasDrawMessage = {
  type: 'canvasDraw',
  componentId: 'canvas-1',
  canvasId: 'canvas-123',
  userId: 'user-456',
  action: {
    type: 'draw',
    tool: 'pen',
    points: [
      { x: 100, y: 100 },
      { x: 110, y: 105 },
      { x: 120, y: 115 }
    ],
    color: '#000000',
    width: 2
  }
}
```

### Comment Messages

**Create Comment:**
```typescript
import type { CommentCreateMessage } from '@ainative/ai-kit-a2ui-core'

const comment: CommentCreateMessage = {
  type: 'commentCreate',
  componentId: 'comment-1',
  threadId: 'thread-123',
  entityId: 'doc-456',
  entityType: 'document',
  position: { x: 100, y: 200 },
  content: 'Great idea! Let\'s discuss this further.',
  userId: 'user-789'
}
```

## Collaboration Handler

The `CollaborationHandler` manages all collaboration operations.

### Basic Setup

```typescript
import { A2UITransport } from '@ainative/ai-kit-a2ui-core/transport'
import { CollaborationHandler } from '@ainative/ai-kit-a2ui-core'

// Create transport
const transport = new A2UITransport('wss://your-server.com/collab')
await transport.connect()

// Create collaboration handler
const handler = new CollaborationHandler(transport, {
  conflictResolution: 'operational-transform',
  presenceTimeout: 60000, // 1 minute
  broadcastCursor: true,
  broadcastSelection: true,
  throttleCursor: 50, // 50ms
  throttleEdits: 100, // 100ms
  batchEdits: true,
  persistEdits: true,
  persistComments: true
})
```

### Room Management

```typescript
// Join a room
await handler.joinRoom('room-123', 'user-456', {
  id: 'user-456',
  name: 'John Doe',
  avatar: 'https://example.com/avatar.jpg',
  color: '#ff6b6b'
})

// Get users in room
const users = await handler.getRoomUsers('room-123')
console.log(`Active users: ${users.length}`)

// Leave room
await handler.leaveRoom('room-123', 'user-456')
```

### Event Handling

```typescript
// Listen to all room events
const unsubscribe = handler.subscribeToRoom('room-123', (event) => {
  console.log('Room event:', event)

  switch (event.type) {
    case 'editorChange':
      console.log('Document changed by:', event.userId)
      break
    case 'presenceJoin':
      console.log('User joined:', event.userId)
      break
    case 'cursorMove':
      console.log('Cursor moved:', event.data)
      break
  }
})

// Unsubscribe when done
unsubscribe()
```

### Individual Event Handlers

```typescript
// Editor events
handler.on('editorChange', (data) => {
  console.log('Editor changed:', data)
})

handler.on('editorSync', (data) => {
  console.log('Editor synced:', data)
})

// Presence events
handler.on('presenceJoin', (data) => {
  console.log('User joined:', data.userId)
})

handler.on('presenceLeave', (data) => {
  console.log('User left:', data.userId)
})

handler.on('presenceUpdate', (data) => {
  console.log('User status:', data.data?.status)
})

// Cursor events
handler.on('cursorMove', (data) => {
  console.log('Cursor moved:', data.data)
})

// Canvas events
handler.on('canvasDraw', (data) => {
  console.log('Canvas draw:', data)
})

// Comment events
handler.on('commentCreate', (data) => {
  console.log('New comment:', data)
})

// Conflict events
handler.on('conflict', (data) => {
  console.error('Conflict detected:', data)
})
```

## Conflict Resolution

### Operational Transform

Best for text editing scenarios:

```typescript
import { ConflictResolver } from '@ainative/ai-kit-a2ui-core'

const resolver = new ConflictResolver()

// Transform local operations against remote operations
const localOps = [
  { type: 'insert', position: 5, content: 'Hello' }
]

const remoteOps = [
  { type: 'insert', position: 3, content: 'Hi ' }
]

const transformed = resolver.operationalTransform(localOps, remoteOps)
// Local operation is adjusted to account for remote changes
```

### CRDT (Conflict-free Replicated Data Type)

Best for distributed systems:

```typescript
const localState = resolver.createCRDTState('site-1', 'initial data')
const remoteState = resolver.createCRDTState('site-2', 'remote data')

// Merge states without conflicts
const merged = resolver.crdtMerge(localState, remoteState)
```

### Last-Write-Wins

Simplest approach:

```typescript
const localChange = {
  timestamp: new Date('2024-01-01T10:00:00Z'),
  userId: 'user-1',
  data: 'local content'
}

const remoteChange = {
  timestamp: new Date('2024-01-01T11:00:00Z'),
  userId: 'user-2',
  data: 'remote content'
}

const winner = resolver.lastWriteWins(localChange, remoteChange)
// Returns the change with the most recent timestamp
```

## Performance Optimization

### Cursor Throttling

Cursor updates are automatically throttled to prevent network flooding:

```typescript
const handler = new CollaborationHandler(transport, {
  throttleCursor: 50, // Update cursor at most every 50ms
  broadcastCursor: true
})
```

### Edit Batching

Multiple edits can be batched to reduce network traffic:

```typescript
const handler = new CollaborationHandler(transport, {
  batchEdits: true,
  throttleEdits: 100 // Batch edits for 100ms before sending
})
```

### Presence Timeout

Automatically mark inactive users as "away":

```typescript
const handler = new CollaborationHandler(transport, {
  presenceTimeout: 60000 // Mark away after 60 seconds
})
```

## Best Practices

### 1. Choose the Right Conflict Resolution

- **Text Editors**: Use Operational Transform
- **Distributed Systems**: Use CRDT
- **Simple Applications**: Use Last-Write-Wins

### 2. Handle Conflicts Gracefully

```typescript
handler.on('conflict', (data) => {
  // Show notification to user
  showNotification({
    type: 'warning',
    message: 'Document conflict detected. Your changes have been saved.',
    action: 'View History'
  })

  // Log for debugging
  console.error('Conflict:', data)
})
```

### 3. Optimize Network Usage

- Enable cursor throttling
- Batch edits when possible
- Use debounced sync for non-critical updates

### 4. Provide User Feedback

- Show active users
- Display cursor positions
- Indicate who is editing
- Show connection status

### 5. Clean Up Resources

```typescript
// Always clean up when done
handler.destroy()
transport.disconnect()
```

## Complete Example

```typescript
import { A2UITransport } from '@ainative/ai-kit-a2ui-core/transport'
import { CollaborationHandler } from '@ainative/ai-kit-a2ui-core'
import type { CollaborativeEditorComponent } from '@ainative/ai-kit-a2ui-core'

async function setupCollaboration() {
  // 1. Setup transport
  const transport = new A2UITransport('wss://collab.example.com')
  await transport.connect()

  // 2. Create handler
  const handler = new CollaborationHandler(transport, {
    conflictResolution: 'operational-transform',
    presenceTimeout: 60000,
    throttleCursor: 50,
    batchEdits: true
  })

  // 3. Join room
  await handler.joinRoom('project-123', 'user-456', {
    id: 'user-456',
    name: 'John Doe',
    avatar: 'https://example.com/avatar.jpg',
    color: '#ff6b6b'
  })

  // 4. Setup event handlers
  handler.on('presenceJoin', (data) => {
    console.log(`${data.data?.name} joined`)
  })

  handler.on('editorChange', (data) => {
    console.log('Document updated')
  })

  handler.on('conflict', (data) => {
    console.error('Conflict detected:', data)
  })

  // 5. Create editor component
  const editor: CollaborativeEditorComponent = {
    type: 'collaborativeEditor',
    id: 'editor-1',
    properties: {
      documentId: 'project-123',
      mode: 'markdown',
      showCursors: true,
      showSelections: true,
      showPresence: true,
      conflictResolution: 'operational-transform',
      syncMode: 'realtime'
    }
  }

  // 6. Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    handler.leaveRoom('project-123', 'user-456')
    handler.destroy()
    transport.disconnect()
  })
}

setupCollaboration()
```

## Testing

All collaboration features include comprehensive tests:

```bash
# Run all collaboration tests
npm test tests/types/collaboration-components.test.ts
npm test tests/types/collaboration-messages.test.ts
npm test tests/handlers/collaboration-handler.test.ts
npm test tests/utils/conflict-resolver.test.ts

# Run with coverage
npm run test:coverage
```

**Test Coverage:**
- 98 total tests
- 100% pass rate
- 90%+ code coverage

## API Reference

See the complete API documentation:

- [Collaboration Components API](/docs/api/collaboration-components.md)
- [Collaboration Messages API](/docs/api/collaboration-messages.md)
- [Collaboration Handler API](/docs/api/collaboration-handler.md)
- [Conflict Resolver API](/docs/api/conflict-resolver.md)

## Support

For issues or questions:
- GitHub Issues: https://github.com/AINative-Studio/ai-kit-a2ui-core/issues
- Documentation: https://docs.ainative.studio
