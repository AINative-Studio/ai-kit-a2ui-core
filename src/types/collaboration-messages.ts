/**
 * A2UI Real-Time Collaboration Message Types (Issue #54)
 * Message definitions for collaborative editing, presence, cursors, canvas, and comments
 */

/**
 * Base collaboration message structure
 */
export interface BaseCollaborationMessage {
  /** Message type */
  type: string
  /** Component identifier */
  componentId: string
  /** Timestamp */
  timestamp?: string
  /** Optional message ID for tracking */
  id?: string
}

/**
 * Editor Change Operation
 */
export interface EditorOperation {
  /** Operation type */
  type: 'insert' | 'delete' | 'replace'
  /** Position in document */
  position: number
  /** Length of operation (for delete/replace) */
  length?: number
  /** Content to insert (for insert/replace) */
  content?: string
}

/**
 * Collaborative Editor Change Message
 * Sent when user makes changes to shared document
 */
export interface CollaborativeEditorChangeMessage extends BaseCollaborationMessage {
  type: 'collaborativeEditorChange'
  /** Document identifier */
  documentId: string
  /** List of changes */
  changes: EditorOperation[]
  /** User making changes */
  userId: string
  /** Document version number */
  version: number
}

/**
 * Collaborative Editor Sync Message
 * Full document synchronization
 */
export interface CollaborativeEditorSyncMessage extends BaseCollaborationMessage {
  type: 'collaborativeEditorSync'
  /** Document identifier */
  documentId: string
  /** Full document content */
  content: string
  /** Document version number */
  version: number
}

/**
 * User information for presence
 */
export interface PresenceUser {
  /** User identifier */
  id: string
  /** User display name */
  name: string
  /** User avatar URL */
  avatar?: string
  /** User identification color */
  color?: string
}

/**
 * Presence Join Message
 * Sent when user joins a collaboration room
 */
export interface PresenceJoinMessage extends BaseCollaborationMessage {
  type: 'presenceJoin'
  /** Room identifier */
  roomId: string
  /** User information */
  user: PresenceUser
}

/**
 * Presence Leave Message
 * Sent when user leaves a collaboration room
 */
export interface PresenceLeaveMessage extends BaseCollaborationMessage {
  type: 'presenceLeave'
  /** Room identifier */
  roomId: string
  /** User identifier leaving */
  userId: string
}

/**
 * User presence status
 */
export type PresenceStatus = 'online' | 'away' | 'typing' | 'viewing' | 'idle'

/**
 * Presence Update Message
 * Sent when user status changes
 */
export interface PresenceUpdateMessage extends BaseCollaborationMessage {
  type: 'presenceUpdate'
  /** Room identifier */
  roomId: string
  /** User identifier */
  userId: string
  /** User status */
  status: PresenceStatus
  /** Additional status metadata */
  metadata?: Record<string, unknown>
}

/**
 * Cursor Move Message
 * Sent when user moves cursor
 */
export interface CursorMoveMessage extends BaseCollaborationMessage {
  type: 'cursorMove'
  /** Room identifier */
  roomId: string
  /** User identifier */
  userId: string
  /** Cursor position */
  position: { x: number; y: number }
}

/**
 * Text selection range
 */
export interface SelectionRange {
  /** Selection start position */
  start: number
  /** Selection end position */
  end: number
}

/**
 * Cursor Selection Message
 * Sent when user selects text
 */
export interface CursorSelectionMessage extends BaseCollaborationMessage {
  type: 'cursorSelection'
  /** Room identifier */
  roomId: string
  /** User identifier */
  userId: string
  /** Text selection range */
  selection: SelectionRange
}

/**
 * Canvas shape definition
 */
export interface CanvasShape {
  /** Shape type */
  type: 'rectangle' | 'circle' | 'line' | 'arrow'
  /** X coordinate */
  x: number
  /** Y coordinate */
  y: number
  /** Width (for rectangle) */
  width?: number
  /** Height (for rectangle) */
  height?: number
  /** Radius (for circle) */
  radius?: number
}

/**
 * Canvas text annotation
 */
export interface CanvasText {
  /** Text content */
  content: string
  /** X coordinate */
  x: number
  /** Y coordinate */
  y: number
  /** Font size */
  fontSize: number
  /** Text color */
  color: string
}

/**
 * Canvas drawing action
 */
export interface CanvasAction {
  /** Action type */
  type: 'draw' | 'erase' | 'shape' | 'text' | 'image'
  /** Tool used */
  tool: string
  /** Drawing points (for draw/erase) */
  points?: Array<{ x: number; y: number }>
  /** Shape definition */
  shape?: CanvasShape
  /** Text annotation */
  text?: CanvasText
  /** Color */
  color?: string
  /** Line width */
  width?: number
}

/**
 * Canvas Draw Message
 * Sent when user draws on canvas
 */
export interface CanvasDrawMessage extends BaseCollaborationMessage {
  type: 'canvasDraw'
  /** Canvas identifier */
  canvasId: string
  /** User identifier */
  userId: string
  /** Drawing action */
  action: CanvasAction
}

/**
 * Canvas Clear Message
 * Sent when canvas is cleared
 */
export interface CanvasClearMessage extends BaseCollaborationMessage {
  type: 'canvasClear'
  /** Canvas identifier */
  canvasId: string
  /** User who cleared canvas */
  userId: string
}

/**
 * Comment Create Message
 * Sent when new comment thread is created
 */
export interface CommentCreateMessage extends BaseCollaborationMessage {
  type: 'commentCreate'
  /** Thread identifier */
  threadId: string
  /** Entity being commented on */
  entityId: string
  /** Type of entity */
  entityType: string
  /** Position (for positioned comments) */
  position?: { x: number; y: number }
  /** Comment content */
  content: string
  /** User creating comment */
  userId: string
}

/**
 * Comment Reply Message
 * Sent when replying to existing comment
 */
export interface CommentReplyMessage extends BaseCollaborationMessage {
  type: 'commentReply'
  /** Thread identifier */
  threadId: string
  /** Parent comment identifier */
  commentId: string
  /** Reply content */
  content: string
  /** User replying */
  userId: string
}

/**
 * Comment Resolve Message
 * Sent when comment thread is resolved/unresolved
 */
export interface CommentResolveMessage extends BaseCollaborationMessage {
  type: 'commentResolve'
  /** Thread identifier */
  threadId: string
  /** Resolved state */
  resolved: boolean
  /** User resolving/unresolving */
  userId: string
}

/**
 * Comment React Message
 * Sent when user reacts to comment
 */
export interface CommentReactMessage extends BaseCollaborationMessage {
  type: 'commentReact'
  /** Thread identifier */
  threadId: string
  /** Comment identifier */
  commentId: string
  /** Reaction emoji or identifier */
  reaction: string
  /** User reacting */
  userId: string
}

/**
 * Union of all collaboration message types
 */
export type CollaborationMessage =
  | CollaborativeEditorChangeMessage
  | CollaborativeEditorSyncMessage
  | PresenceJoinMessage
  | PresenceLeaveMessage
  | PresenceUpdateMessage
  | CursorMoveMessage
  | CursorSelectionMessage
  | CanvasDrawMessage
  | CanvasClearMessage
  | CommentCreateMessage
  | CommentReplyMessage
  | CommentResolveMessage
  | CommentReactMessage

/**
 * Collaboration message type discriminator
 */
export type CollaborationMessageType = CollaborationMessage['type']

/**
 * Type guards for collaboration messages
 */
export function isCollaborativeEditorChangeMessage(
  msg: unknown
): msg is CollaborativeEditorChangeMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    msg.type === 'collaborativeEditorChange'
  )
}

export function isCollaborativeEditorSyncMessage(
  msg: unknown
): msg is CollaborativeEditorSyncMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    msg.type === 'collaborativeEditorSync'
  )
}

export function isPresenceJoinMessage(msg: unknown): msg is PresenceJoinMessage {
  return typeof msg === 'object' && msg !== null && 'type' in msg && msg.type === 'presenceJoin'
}

export function isPresenceLeaveMessage(msg: unknown): msg is PresenceLeaveMessage {
  return typeof msg === 'object' && msg !== null && 'type' in msg && msg.type === 'presenceLeave'
}

export function isPresenceUpdateMessage(msg: unknown): msg is PresenceUpdateMessage {
  return typeof msg === 'object' && msg !== null && 'type' in msg && msg.type === 'presenceUpdate'
}

export function isCursorMoveMessage(msg: unknown): msg is CursorMoveMessage {
  return typeof msg === 'object' && msg !== null && 'type' in msg && msg.type === 'cursorMove'
}

export function isCursorSelectionMessage(msg: unknown): msg is CursorSelectionMessage {
  return typeof msg === 'object' && msg !== null && 'type' in msg && msg.type === 'cursorSelection'
}

export function isCanvasDrawMessage(msg: unknown): msg is CanvasDrawMessage {
  return typeof msg === 'object' && msg !== null && 'type' in msg && msg.type === 'canvasDraw'
}

export function isCanvasClearMessage(msg: unknown): msg is CanvasClearMessage {
  return typeof msg === 'object' && msg !== null && 'type' in msg && msg.type === 'canvasClear'
}

export function isCommentCreateMessage(msg: unknown): msg is CommentCreateMessage {
  return typeof msg === 'object' && msg !== null && 'type' in msg && msg.type === 'commentCreate'
}

export function isCommentReplyMessage(msg: unknown): msg is CommentReplyMessage {
  return typeof msg === 'object' && msg !== null && 'type' in msg && msg.type === 'commentReply'
}

export function isCommentResolveMessage(msg: unknown): msg is CommentResolveMessage {
  return typeof msg === 'object' && msg !== null && 'type' in msg && msg.type === 'commentResolve'
}

export function isCommentReactMessage(msg: unknown): msg is CommentReactMessage {
  return typeof msg === 'object' && msg !== null && 'type' in msg && msg.type === 'commentReact'
}

export function isCollaborationMessage(msg: unknown): msg is CollaborationMessage {
  return (
    isCollaborativeEditorChangeMessage(msg) ||
    isCollaborativeEditorSyncMessage(msg) ||
    isPresenceJoinMessage(msg) ||
    isPresenceLeaveMessage(msg) ||
    isPresenceUpdateMessage(msg) ||
    isCursorMoveMessage(msg) ||
    isCursorSelectionMessage(msg) ||
    isCanvasDrawMessage(msg) ||
    isCanvasClearMessage(msg) ||
    isCommentCreateMessage(msg) ||
    isCommentReplyMessage(msg) ||
    isCommentResolveMessage(msg) ||
    isCommentReactMessage(msg)
  )
}

/**
 * Helper function to validate collaboration messages
 */
export function validateCollaborationMessage(msg: unknown): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!msg || typeof msg !== 'object') {
    errors.push('Message must be an object')
    return { valid: false, errors }
  }

  const message = msg as Record<string, unknown>

  if (!message.type || typeof message.type !== 'string') {
    errors.push('Message must have a valid type')
  }

  if (!message.componentId || typeof message.componentId !== 'string') {
    errors.push('Message must have a componentId')
  }

  // Type-specific validation
  switch (message.type) {
    case 'collaborativeEditorChange':
      if (!message.documentId || typeof message.documentId !== 'string') {
        errors.push('collaborativeEditorChange requires documentId')
      }
      if (!Array.isArray(message.changes)) {
        errors.push('collaborativeEditorChange requires changes array')
      }
      if (!message.userId || typeof message.userId !== 'string') {
        errors.push('collaborativeEditorChange requires userId')
      }
      if (typeof message.version !== 'number') {
        errors.push('collaborativeEditorChange requires version number')
      }
      break

    case 'collaborativeEditorSync':
      if (!message.documentId || typeof message.documentId !== 'string') {
        errors.push('collaborativeEditorSync requires documentId')
      }
      if (typeof message.content !== 'string') {
        errors.push('collaborativeEditorSync requires content string')
      }
      if (typeof message.version !== 'number') {
        errors.push('collaborativeEditorSync requires version number')
      }
      break

    case 'presenceJoin':
      if (!message.roomId || typeof message.roomId !== 'string') {
        errors.push('presenceJoin requires roomId')
      }
      if (!message.user || typeof message.user !== 'object') {
        errors.push('presenceJoin requires user object')
      }
      break

    case 'presenceLeave':
      if (!message.roomId || typeof message.roomId !== 'string') {
        errors.push('presenceLeave requires roomId')
      }
      if (!message.userId || typeof message.userId !== 'string') {
        errors.push('presenceLeave requires userId')
      }
      break

    case 'presenceUpdate':
      if (!message.roomId || typeof message.roomId !== 'string') {
        errors.push('presenceUpdate requires roomId')
      }
      if (!message.userId || typeof message.userId !== 'string') {
        errors.push('presenceUpdate requires userId')
      }
      if (!message.status || typeof message.status !== 'string') {
        errors.push('presenceUpdate requires status')
      }
      break

    case 'cursorMove':
      if (!message.roomId || typeof message.roomId !== 'string') {
        errors.push('cursorMove requires roomId')
      }
      if (!message.userId || typeof message.userId !== 'string') {
        errors.push('cursorMove requires userId')
      }
      if (!message.position || typeof message.position !== 'object') {
        errors.push('cursorMove requires position object')
      }
      break

    case 'cursorSelection':
      if (!message.roomId || typeof message.roomId !== 'string') {
        errors.push('cursorSelection requires roomId')
      }
      if (!message.userId || typeof message.userId !== 'string') {
        errors.push('cursorSelection requires userId')
      }
      if (!message.selection || typeof message.selection !== 'object') {
        errors.push('cursorSelection requires selection object')
      }
      break

    case 'canvasDraw':
      if (!message.canvasId || typeof message.canvasId !== 'string') {
        errors.push('canvasDraw requires canvasId')
      }
      if (!message.userId || typeof message.userId !== 'string') {
        errors.push('canvasDraw requires userId')
      }
      if (!message.action || typeof message.action !== 'object') {
        errors.push('canvasDraw requires action object')
      }
      break

    case 'canvasClear':
      if (!message.canvasId || typeof message.canvasId !== 'string') {
        errors.push('canvasClear requires canvasId')
      }
      if (!message.userId || typeof message.userId !== 'string') {
        errors.push('canvasClear requires userId')
      }
      break

    case 'commentCreate':
      if (!message.threadId || typeof message.threadId !== 'string') {
        errors.push('commentCreate requires threadId')
      }
      if (!message.entityId || typeof message.entityId !== 'string') {
        errors.push('commentCreate requires entityId')
      }
      if (!message.entityType || typeof message.entityType !== 'string') {
        errors.push('commentCreate requires entityType')
      }
      if (typeof message.content !== 'string') {
        errors.push('commentCreate requires content')
      }
      if (!message.userId || typeof message.userId !== 'string') {
        errors.push('commentCreate requires userId')
      }
      break

    case 'commentReply':
      if (!message.threadId || typeof message.threadId !== 'string') {
        errors.push('commentReply requires threadId')
      }
      if (!message.commentId || typeof message.commentId !== 'string') {
        errors.push('commentReply requires commentId')
      }
      if (typeof message.content !== 'string') {
        errors.push('commentReply requires content')
      }
      if (!message.userId || typeof message.userId !== 'string') {
        errors.push('commentReply requires userId')
      }
      break

    case 'commentResolve':
      if (!message.threadId || typeof message.threadId !== 'string') {
        errors.push('commentResolve requires threadId')
      }
      if (typeof message.resolved !== 'boolean') {
        errors.push('commentResolve requires resolved boolean')
      }
      if (!message.userId || typeof message.userId !== 'string') {
        errors.push('commentResolve requires userId')
      }
      break

    case 'commentReact':
      if (!message.threadId || typeof message.threadId !== 'string') {
        errors.push('commentReact requires threadId')
      }
      if (!message.commentId || typeof message.commentId !== 'string') {
        errors.push('commentReact requires commentId')
      }
      if (!message.reaction || typeof message.reaction !== 'string') {
        errors.push('commentReact requires reaction')
      }
      if (!message.userId || typeof message.userId !== 'string') {
        errors.push('commentReact requires userId')
      }
      break

    default:
      errors.push(`Unknown collaboration message type: ${message.type}`)
  }

  return { valid: errors.length === 0, errors }
}
