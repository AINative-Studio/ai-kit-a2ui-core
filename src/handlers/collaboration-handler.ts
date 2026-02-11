/**
 * A2UI Real-Time Collaboration Handler (Issue #54)
 * Manages real-time collaboration features including editing, presence, cursors, canvas, and comments
 */

import type { A2UITransport } from '../transport/index.js'
import type {
  CollaborativeEditorChangeMessage,
  CollaborativeEditorSyncMessage,
  PresenceJoinMessage,
  PresenceLeaveMessage,
  PresenceUpdateMessage,
  CursorMoveMessage,
  CursorSelectionMessage,
  CanvasDrawMessage,
  CanvasClearMessage,
  CommentCreateMessage,
  CommentReplyMessage,
  CommentResolveMessage,
  CommentReactMessage,
  PresenceUser,
  PresenceStatus,
} from '../types/collaboration-messages.js'
import {
  isCollaborativeEditorChangeMessage,
  isCollaborativeEditorSyncMessage,
  isPresenceJoinMessage,
  isPresenceLeaveMessage,
  isPresenceUpdateMessage,
  isCursorMoveMessage,
  isCursorSelectionMessage,
  isCanvasDrawMessage,
  isCanvasClearMessage,
  isCommentCreateMessage,
  isCommentReplyMessage,
  isCommentResolveMessage,
  isCommentReactMessage,
} from '../types/collaboration-messages.js'
import { ConflictResolver, type ConflictResolutionStrategy } from '../utils/conflict-resolver.js'

/**
 * Collaboration event types
 */
export type CollaborationEventType =
  | 'editorChange'
  | 'editorSync'
  | 'presenceJoin'
  | 'presenceLeave'
  | 'presenceUpdate'
  | 'cursorMove'
  | 'cursorSelection'
  | 'canvasDraw'
  | 'canvasClear'
  | 'commentCreate'
  | 'commentReply'
  | 'commentResolve'
  | 'commentReact'
  | 'conflict'
  | 'roomJoined'
  | 'roomLeft'

/**
 * Collaboration event data
 */
export interface CollaborationEventData {
  type: CollaborationEventType
  roomId?: string
  userId?: string
  data?: unknown
}

/**
 * Collaboration event handler
 */
export type CollaborationEventHandler = (data: CollaborationEventData) => void

/**
 * Collaboration handler options
 */
export interface CollaborationHandlerOptions {
  /** WebSocket server URL */
  wsUrl?: string
  /** Conflict resolution strategy */
  conflictResolution?: ConflictResolutionStrategy
  /** Consider user away after N ms */
  presenceTimeout?: number
  /** Broadcast cursor movements */
  broadcastCursor?: boolean
  /** Broadcast text selections */
  broadcastSelection?: boolean
  /** Throttle cursor updates (ms) */
  throttleCursor?: number
  /** Throttle edit updates (ms) */
  throttleEdits?: number
  /** Batch multiple edits */
  batchEdits?: boolean
  /** Persist edits to storage */
  persistEdits?: boolean
  /** Persist comments to storage */
  persistComments?: boolean
}

/**
 * Room state
 */
interface RoomState {
  roomId: string
  users: Map<string, PresenceUser & { status: PresenceStatus; lastSeen: number }>
  documents: Map<string, { content: string; version: number }>
  cursors: Map<string, { x: number; y: number }>
  selections: Map<string, { start: number; end: number }>
}

/**
 * Collaboration Handler
 * Manages real-time collaboration operations
 */
export class CollaborationHandler {
  private readonly transport: A2UITransport
  private readonly options: Required<CollaborationHandlerOptions>
  private readonly conflictResolver: ConflictResolver
  private readonly eventHandlers = new Map<CollaborationEventType, Set<CollaborationEventHandler>>()
  private readonly rooms = new Map<string, RoomState>()
  private presenceCheckTimer: ReturnType<typeof setInterval> | null = null
  private lastCursorUpdate = new Map<string, number>()
  private lastEditUpdate = new Map<string, number>()
  private pendingEdits = new Map<string, any[]>()

  constructor(transport: A2UITransport, options: CollaborationHandlerOptions = {}) {
    this.transport = transport
    this.options = {
      wsUrl: options.wsUrl || '',
      conflictResolution: options.conflictResolution || 'operational-transform',
      presenceTimeout: options.presenceTimeout || 60000,
      broadcastCursor: options.broadcastCursor ?? true,
      broadcastSelection: options.broadcastSelection ?? true,
      throttleCursor: options.throttleCursor || 50,
      throttleEdits: options.throttleEdits || 100,
      batchEdits: options.batchEdits ?? true,
      persistEdits: options.persistEdits ?? false,
      persistComments: options.persistComments ?? true,
    }
    this.conflictResolver = new ConflictResolver()
    this.initialize()
  }

  /**
   * Initialize handler and register message listeners
   */
  private initialize(): void {
    // Editor messages
    this.transport.on<CollaborativeEditorChangeMessage>('collaborativeEditorChange', (msg) => {
      if (isCollaborativeEditorChangeMessage(msg)) this.handleEditorChange(msg)
    })
    this.transport.on<CollaborativeEditorSyncMessage>('collaborativeEditorSync', (msg) => {
      if (isCollaborativeEditorSyncMessage(msg)) this.handleEditorSync(msg)
    })

    // Presence messages
    this.transport.on<PresenceJoinMessage>('presenceJoin', (msg) => {
      if (isPresenceJoinMessage(msg)) this.handlePresenceJoin(msg)
    })
    this.transport.on<PresenceLeaveMessage>('presenceLeave', (msg) => {
      if (isPresenceLeaveMessage(msg)) this.handlePresenceLeave(msg)
    })
    this.transport.on<PresenceUpdateMessage>('presenceUpdate', (msg) => {
      if (isPresenceUpdateMessage(msg)) this.handlePresenceUpdate(msg)
    })

    // Cursor messages
    this.transport.on<CursorMoveMessage>('cursorMove', (msg) => {
      if (isCursorMoveMessage(msg)) this.handleCursorMove(msg)
    })
    this.transport.on<CursorSelectionMessage>('cursorSelection', (msg) => {
      if (isCursorSelectionMessage(msg)) this.handleCursorSelection(msg)
    })

    // Canvas messages
    this.transport.on<CanvasDrawMessage>('canvasDraw', (msg) => {
      if (isCanvasDrawMessage(msg)) this.handleCanvasDraw(msg)
    })
    this.transport.on<CanvasClearMessage>('canvasClear', (msg) => {
      if (isCanvasClearMessage(msg)) this.handleCanvasClear(msg)
    })

    // Comment messages
    this.transport.on<CommentCreateMessage>('commentCreate', (msg) => {
      if (isCommentCreateMessage(msg)) this.handleCommentCreate(msg)
    })
    this.transport.on<CommentReplyMessage>('commentReply', (msg) => {
      if (isCommentReplyMessage(msg)) this.handleCommentReply(msg)
    })
    this.transport.on<CommentResolveMessage>('commentResolve', (msg) => {
      if (isCommentResolveMessage(msg)) this.handleCommentResolve(msg)
    })
    this.transport.on<CommentReactMessage>('commentReact', (msg) => {
      if (isCommentReactMessage(msg)) this.handleCommentReact(msg)
    })

    // Start presence checking
    this.startPresenceCheck()
  }

  /**
   * Handle editor change message
   */
  async handleEditorChange(message: CollaborativeEditorChangeMessage): Promise<void> {
    const room = this.getOrCreateRoom(message.documentId)
    const doc = room.documents.get(message.documentId)

    if (doc) {
      // Check for conflicts
      if (message.version !== doc.version) {
        // Version mismatch - potential conflict
        this.emit('conflict', {
          type: 'conflict',
          roomId: message.documentId,
          userId: message.userId,
          data: { expected: doc.version, received: message.version },
        })
        return
      }

      // Apply changes using conflict resolver
      const operations = message.changes.map((change) =>
        this.conflictResolver.convertEditorOperation(change)
      )
      const newContent = this.conflictResolver.applyOperations(doc.content, operations)

      // Update document
      room.documents.set(message.documentId, {
        content: newContent,
        version: doc.version + 1,
      })
    }

    // Emit event
    this.emit('editorChange', {
      type: 'editorChange',
      roomId: message.documentId,
      userId: message.userId,
      data: message,
    })

    // Broadcast to other users
    this.transport.send(message as any)
  }

  /**
   * Handle editor sync message
   */
  async handleEditorSync(message: CollaborativeEditorSyncMessage): Promise<void> {
    const room = this.getOrCreateRoom(message.documentId)

    // Update document
    room.documents.set(message.documentId, {
      content: message.content,
      version: message.version,
    })

    // Emit event
    this.emit('editorSync', {
      type: 'editorSync',
      roomId: message.documentId,
      data: message,
    })
  }

  /**
   * Handle presence join message
   */
  async handlePresenceJoin(message: PresenceJoinMessage): Promise<void> {
    const room = this.getOrCreateRoom(message.roomId)

    // Add user to room
    room.users.set(message.user.id, {
      ...message.user,
      status: 'online',
      lastSeen: Date.now(),
    })

    // Emit event
    this.emit('presenceJoin', {
      type: 'presenceJoin',
      roomId: message.roomId,
      userId: message.user.id,
      data: message.user,
    })

    // Broadcast to other users
    this.transport.send(message as any)
  }

  /**
   * Handle presence leave message
   */
  async handlePresenceLeave(message: PresenceLeaveMessage): Promise<void> {
    const room = this.rooms.get(message.roomId)
    if (!room) return

    // Remove user from room
    room.users.delete(message.userId)

    // Emit event
    this.emit('presenceLeave', {
      type: 'presenceLeave',
      roomId: message.roomId,
      userId: message.userId,
    })

    // Broadcast to other users
    this.transport.send(message as any)
  }

  /**
   * Handle presence update message
   */
  async handlePresenceUpdate(message: PresenceUpdateMessage): Promise<void> {
    const room = this.rooms.get(message.roomId)
    if (!room) return

    const user = room.users.get(message.userId)
    if (user) {
      user.status = message.status
      user.lastSeen = Date.now()
    }

    // Emit event
    this.emit('presenceUpdate', {
      type: 'presenceUpdate',
      roomId: message.roomId,
      userId: message.userId,
      data: { status: message.status, metadata: message.metadata },
    })

    // Broadcast to other users
    this.transport.send(message as any)
  }

  /**
   * Handle cursor move message
   */
  async handleCursorMove(message: CursorMoveMessage): Promise<void> {
    // Throttle cursor updates
    const now = Date.now()
    const lastUpdate = this.lastCursorUpdate.get(message.userId) || 0
    if (now - lastUpdate < this.options.throttleCursor) {
      return
    }
    this.lastCursorUpdate.set(message.userId, now)

    const room = this.rooms.get(message.roomId)
    if (room) {
      room.cursors.set(message.userId, message.position)
    }

    // Emit event
    this.emit('cursorMove', {
      type: 'cursorMove',
      roomId: message.roomId,
      userId: message.userId,
      data: message.position,
    })

    // Broadcast if enabled
    if (this.options.broadcastCursor) {
      this.transport.send(message as any)
    }
  }

  /**
   * Handle cursor selection message
   */
  async handleCursorSelection(message: CursorSelectionMessage): Promise<void> {
    const room = this.rooms.get(message.roomId)
    if (room) {
      room.selections.set(message.userId, message.selection)
    }

    // Emit event
    this.emit('cursorSelection', {
      type: 'cursorSelection',
      roomId: message.roomId,
      userId: message.userId,
      data: message.selection,
    })

    // Broadcast if enabled
    if (this.options.broadcastSelection) {
      this.transport.send(message as any)
    }
  }

  /**
   * Handle canvas draw message
   */
  async handleCanvasDraw(message: CanvasDrawMessage): Promise<void> {
    // Emit event
    this.emit('canvasDraw', {
      type: 'canvasDraw',
      roomId: message.canvasId,
      userId: message.userId,
      data: message.action,
    })

    // Broadcast to other users
    this.transport.send(message as any)
  }

  /**
   * Handle canvas clear message
   */
  async handleCanvasClear(message: CanvasClearMessage): Promise<void> {
    // Emit event
    this.emit('canvasClear', {
      type: 'canvasClear',
      roomId: message.canvasId,
      userId: message.userId,
    })

    // Broadcast to other users
    this.transport.send(message as any)
  }

  /**
   * Handle comment create message
   */
  async handleCommentCreate(message: CommentCreateMessage): Promise<string> {
    // Emit event
    this.emit('commentCreate', {
      type: 'commentCreate',
      roomId: message.entityId,
      userId: message.userId,
      data: message,
    })

    // Broadcast to other users
    this.transport.send(message as any)

    // Return thread ID
    return message.threadId
  }

  /**
   * Handle comment reply message
   */
  async handleCommentReply(message: CommentReplyMessage): Promise<string> {
    // Emit event
    this.emit('commentReply', {
      type: 'commentReply',
      userId: message.userId,
      data: message,
    })

    // Broadcast to other users
    this.transport.send(message as any)

    // Return comment ID (would be generated by backend)
    return `${message.threadId}_${Date.now()}`
  }

  /**
   * Handle comment resolve message
   */
  async handleCommentResolve(message: CommentResolveMessage): Promise<void> {
    // Emit event
    this.emit('commentResolve', {
      type: 'commentResolve',
      userId: message.userId,
      data: message,
    })

    // Broadcast to other users
    this.transport.send(message as any)
  }

  /**
   * Handle comment react message
   */
  async handleCommentReact(message: CommentReactMessage): Promise<void> {
    // Emit event
    this.emit('commentReact', {
      type: 'commentReact',
      userId: message.userId,
      data: message,
    })

    // Broadcast to other users
    this.transport.send(message as any)
  }

  /**
   * Join a collaboration room
   */
  async joinRoom(roomId: string, userId: string, user: PresenceUser): Promise<void> {
    const message: PresenceJoinMessage = {
      type: 'presenceJoin',
      componentId: `room-${roomId}`,
      roomId,
      user,
      timestamp: new Date().toISOString(),
    }

    await this.handlePresenceJoin(message)

    this.emit('roomJoined', {
      type: 'roomJoined',
      roomId,
      userId,
      data: user,
    })
  }

  /**
   * Leave a collaboration room
   */
  async leaveRoom(roomId: string, userId: string): Promise<void> {
    const message: PresenceLeaveMessage = {
      type: 'presenceLeave',
      componentId: `room-${roomId}`,
      roomId,
      userId,
      timestamp: new Date().toISOString(),
    }

    await this.handlePresenceLeave(message)

    this.emit('roomLeft', {
      type: 'roomLeft',
      roomId,
      userId,
    })
  }

  /**
   * Get users in a room
   */
  async getRoomUsers(roomId: string): Promise<(PresenceUser & { status: PresenceStatus })[]> {
    const room = this.rooms.get(roomId)
    if (!room) return []

    return Array.from(room.users.values()).map((user) => ({
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      color: user.color,
      status: user.status,
    }))
  }

  /**
   * Subscribe to room events
   */
  subscribeToRoom(roomId: string, callback: (event: CollaborationEventData) => void): () => void {
    const handler: CollaborationEventHandler = (data) => {
      if (data.roomId === roomId) {
        callback(data)
      }
    }

    // Subscribe to all event types
    const eventTypes: CollaborationEventType[] = [
      'editorChange',
      'editorSync',
      'presenceJoin',
      'presenceLeave',
      'presenceUpdate',
      'cursorMove',
      'cursorSelection',
      'canvasDraw',
      'canvasClear',
      'commentCreate',
      'commentReply',
      'commentResolve',
      'commentReact',
    ]

    eventTypes.forEach((type) => {
      this.on(type, handler)
    })

    // Return unsubscribe function
    return () => {
      eventTypes.forEach((type) => {
        this.off(type, handler)
      })
    }
  }

  /**
   * Register event handler
   */
  on(event: CollaborationEventType, handler: CollaborationEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(handler)
  }

  /**
   * Unregister event handler
   */
  off(event: CollaborationEventType, handler: CollaborationEventHandler): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) handlers.delete(handler)
  }

  /**
   * Emit event
   */
  private emit(event: CollaborationEventType, data: CollaborationEventData): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach((handler) => handler(data))
    }
  }

  /**
   * Get or create room state
   */
  private getOrCreateRoom(roomId: string): RoomState {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        roomId,
        users: new Map(),
        documents: new Map(),
        cursors: new Map(),
        selections: new Map(),
      })
    }
    return this.rooms.get(roomId)!
  }

  /**
   * Start presence checking
   */
  private startPresenceCheck(): void {
    if (this.presenceCheckTimer) return

    this.presenceCheckTimer = setInterval(() => {
      const now = Date.now()
      for (const room of this.rooms.values()) {
        for (const [userId, user] of room.users) {
          if (now - user.lastSeen > this.options.presenceTimeout) {
            user.status = 'away'
            this.emit('presenceUpdate', {
              type: 'presenceUpdate',
              roomId: room.roomId,
              userId,
              data: { status: 'away' },
            })
          }
        }
      }
    }, this.options.presenceTimeout / 2)
  }

  /**
   * Stop presence checking
   */
  private stopPresenceCheck(): void {
    if (this.presenceCheckTimer) {
      clearInterval(this.presenceCheckTimer)
      this.presenceCheckTimer = null
    }
  }

  /**
   * Destroy handler and cleanup
   */
  destroy(): void {
    this.stopPresenceCheck()
    this.eventHandlers.clear()
    this.rooms.clear()
    this.lastCursorUpdate.clear()
    this.lastEditUpdate.clear()
    this.pendingEdits.clear()
  }
}
