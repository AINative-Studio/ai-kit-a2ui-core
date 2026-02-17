/**
 * A2UI Real-Time Collaboration Component Types (Issue #54)
 * Provides multi-user collaboration features including shared editing, presence, cursors, canvas, and comments
 */

/**
 * Collaborative Editor Component
 * Multi-user editing with real-time synchronization
 */
export interface CollaborativeEditorComponent {
  type: 'collaborativeEditor'
  id: string
  properties: {
    /** Unique document identifier for synchronization */
    documentId: string
    /** Editor mode */
    mode?: 'text' | 'rich-text' | 'markdown' | 'code'
    /** Programming language for code mode */
    language?: string
    /** Show other users' cursors */
    showCursors?: boolean
    /** Show other users' text selections */
    showSelections?: boolean
    /** Show active user presence indicators */
    showPresence?: boolean
    /** Allow inline comments */
    allowComments?: boolean
    /** Enable version history tracking */
    versionHistory?: boolean
    /** Conflict resolution strategy */
    conflictResolution?: 'last-write-wins' | 'operational-transform' | 'crdt'
    /** Synchronization mode */
    syncMode?: 'realtime' | 'debounced'
    /** Debounce delay in milliseconds (for debounced mode) */
    debounceMs?: number
    /** Additional metadata */
    metadata?: Record<string, unknown>
  }
}

/**
 * Presence Indicator Component
 * Shows active users in a collaboration session
 */
export interface PresenceIndicatorComponent {
  type: 'presenceIndicator'
  id: string
  properties: {
    /** Room identifier for presence tracking */
    roomId: string
    /** Maximum number of avatars to display */
    maxVisible?: number
    /** Display user avatars */
    showAvatars?: boolean
    /** Display user names */
    showNames?: boolean
    /** Display user status (online, away, typing, etc.) */
    showStatus?: boolean
    /** Layout style for user indicators */
    layout?: 'stack' | 'grid' | 'list'
    /** Make user indicators clickable for details */
    clickable?: boolean
    /** Additional metadata */
    metadata?: Record<string, unknown>
  }
}

/**
 * Collaborative Canvas Component
 * Shared drawing/whiteboard for visual collaboration
 */
export interface CollaborativeCanvasComponent {
  type: 'collaborativeCanvas'
  id: string
  properties: {
    /** Unique canvas identifier for synchronization */
    canvasId: string
    /** Available drawing tools */
    tools: Array<'pen' | 'eraser' | 'shapes' | 'text' | 'sticky-notes' | 'images'>
    /** Display toolbar for tools */
    showToolbar?: boolean
    /** Allow freehand drawing */
    allowDrawing?: boolean
    /** Allow shape creation */
    allowShapes?: boolean
    /** Allow text annotations */
    allowText?: boolean
    /** Allow image uploads */
    allowImages?: boolean
    /** Display background grid */
    showGrid?: boolean
    /** Snap objects to grid */
    snapToGrid?: boolean
    /** Grid size in pixels */
    gridSize?: number
    /** Canvas background color */
    backgroundColor?: string
    /** Canvas width in pixels */
    width?: number
    /** Canvas height in pixels */
    height?: number
    /** Enable zoom functionality */
    zoomEnabled?: boolean
    /** Enable pan functionality */
    panEnabled?: boolean
    /** Additional metadata */
    metadata?: Record<string, unknown>
  }
}

/**
 * Shared Cursor Component
 * Displays other users' cursor positions
 */
export interface SharedCursorComponent {
  type: 'sharedCursor'
  id: string
  properties: {
    /** Room identifier for cursor tracking */
    roomId: string
    /** User identifier */
    userId: string
    /** User display name */
    userName: string
    /** Cursor color for user identification */
    color: string
    /** Current cursor position */
    position: { x: number; y: number }
    /** Cursor visibility state */
    visible: boolean
    /** Additional metadata */
    metadata?: Record<string, unknown>
  }
}

/**
 * Comment Thread Component
 * Collaborative commenting system
 */
export interface CommentThreadComponent {
  type: 'commentThread'
  id: string
  properties: {
    /** Unique thread identifier */
    threadId: string
    /** Entity being commented on */
    entityId: string
    /** Type of entity being commented on */
    entityType: string
    /** Position for positioned comments (e.g., on canvas) */
    position?: { x: number; y: number }
    /** Comments in the thread */
    comments: Array<{
      /** Comment identifier */
      id: string
      /** Comment author user ID */
      userId: string
      /** Comment author name */
      userName: string
      /** Comment author avatar URL */
      userAvatar?: string
      /** Comment content */
      content: string
      /** Comment timestamp */
      timestamp: Date
      /** Whether comment was edited */
      edited?: boolean
      /** Reactions to the comment */
      reactions?: Record<string, number>
    }>
    /** Whether thread is resolved */
    resolved?: boolean
    /** Allow replies to comments */
    allowReply?: boolean
    /** Allow reactions to comments */
    allowReactions?: boolean
    /** Allow resolving threads */
    allowResolve?: boolean
    /** Additional metadata */
    metadata?: Record<string, unknown>
  }
}

/**
 * Union of all collaboration component types
 */
export type CollaborationComponent =
  | CollaborativeEditorComponent
  | PresenceIndicatorComponent
  | CollaborativeCanvasComponent
  | SharedCursorComponent
  | CommentThreadComponent

/**
 * Collaboration component type discriminator
 */
export type CollaborationComponentType = CollaborationComponent['type']

/**
 * Type guards for collaboration components
 */
export function isCollaborativeEditorComponent(
  component: unknown
): component is CollaborativeEditorComponent {
  return (
    typeof component === 'object' &&
    component !== null &&
    'type' in component &&
    component.type === 'collaborativeEditor'
  )
}

export function isPresenceIndicatorComponent(
  component: unknown
): component is PresenceIndicatorComponent {
  return (
    typeof component === 'object' &&
    component !== null &&
    'type' in component &&
    component.type === 'presenceIndicator'
  )
}

export function isCollaborativeCanvasComponent(
  component: unknown
): component is CollaborativeCanvasComponent {
  return (
    typeof component === 'object' &&
    component !== null &&
    'type' in component &&
    component.type === 'collaborativeCanvas'
  )
}

export function isSharedCursorComponent(component: unknown): component is SharedCursorComponent {
  return (
    typeof component === 'object' &&
    component !== null &&
    'type' in component &&
    component.type === 'sharedCursor'
  )
}

export function isCommentThreadComponent(component: unknown): component is CommentThreadComponent {
  return (
    typeof component === 'object' &&
    component !== null &&
    'type' in component &&
    component.type === 'commentThread'
  )
}

export function isCollaborationComponent(component: unknown): component is CollaborationComponent {
  return (
    isCollaborativeEditorComponent(component) ||
    isPresenceIndicatorComponent(component) ||
    isCollaborativeCanvasComponent(component) ||
    isSharedCursorComponent(component) ||
    isCommentThreadComponent(component)
  )
}

/**
 * Helper function to validate collaboration component properties
 */
export function validateCollaborationComponent(component: unknown): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!component || typeof component !== 'object') {
    errors.push('Component must be an object')
    return { valid: false, errors }
  }

  const comp = component as Record<string, unknown>

  if (!comp.type || typeof comp.type !== 'string') {
    errors.push('Component must have a valid type')
  }

  if (!comp.id || typeof comp.id !== 'string') {
    errors.push('Component must have a valid id')
  }

  if (!comp.properties || typeof comp.properties !== 'object') {
    errors.push('Component must have properties object')
    return { valid: false, errors }
  }

  const props = comp.properties as Record<string, unknown>

  // Type-specific validation
  switch (comp.type) {
    case 'collaborativeEditor':
      if (!props.documentId || typeof props.documentId !== 'string') {
        errors.push('collaborativeEditor requires documentId')
      }
      if (props.mode && !['text', 'rich-text', 'markdown', 'code'].includes(props.mode as string)) {
        errors.push('Invalid editor mode')
      }
      if (
        props.conflictResolution &&
        !['last-write-wins', 'operational-transform', 'crdt'].includes(
          props.conflictResolution as string
        )
      ) {
        errors.push('Invalid conflict resolution strategy')
      }
      break

    case 'presenceIndicator':
      if (!props.roomId || typeof props.roomId !== 'string') {
        errors.push('presenceIndicator requires roomId')
      }
      if (props.layout && !['stack', 'grid', 'list'].includes(props.layout as string)) {
        errors.push('Invalid layout')
      }
      break

    case 'collaborativeCanvas':
      if (!props.canvasId || typeof props.canvasId !== 'string') {
        errors.push('collaborativeCanvas requires canvasId')
      }
      if (!Array.isArray(props.tools) || props.tools.length === 0) {
        errors.push('collaborativeCanvas requires non-empty tools array')
      }
      break

    case 'sharedCursor':
      if (!props.roomId || typeof props.roomId !== 'string') {
        errors.push('sharedCursor requires roomId')
      }
      if (!props.userId || typeof props.userId !== 'string') {
        errors.push('sharedCursor requires userId')
      }
      if (!props.userName || typeof props.userName !== 'string') {
        errors.push('sharedCursor requires userName')
      }
      if (!props.color || typeof props.color !== 'string') {
        errors.push('sharedCursor requires color')
      }
      if (
        !props.position ||
        typeof props.position !== 'object' ||
        typeof (props.position as Record<string, unknown>).x !== 'number' ||
        typeof (props.position as Record<string, unknown>).y !== 'number'
      ) {
        errors.push('sharedCursor requires valid position {x, y}')
      }
      break

    case 'commentThread':
      if (!props.threadId || typeof props.threadId !== 'string') {
        errors.push('commentThread requires threadId')
      }
      if (!props.entityId || typeof props.entityId !== 'string') {
        errors.push('commentThread requires entityId')
      }
      if (!props.entityType || typeof props.entityType !== 'string') {
        errors.push('commentThread requires entityType')
      }
      if (!Array.isArray(props.comments)) {
        errors.push('commentThread requires comments array')
      }
      break

    default:
      errors.push(`Unknown collaboration component type: ${comp.type}`)
  }

  return { valid: errors.length === 0, errors }
}
