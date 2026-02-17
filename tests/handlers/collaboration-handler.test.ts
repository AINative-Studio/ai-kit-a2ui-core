/**
 * Collaboration Handler Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CollaborationHandler } from '../../src/handlers/collaboration-handler.js'
import type {
  CollaborativeEditorChangeMessage,
  PresenceJoinMessage,
  PresenceLeaveMessage,
  PresenceUpdateMessage,
  CursorMoveMessage,
  CanvasDrawMessage,
  CommentCreateMessage,
} from '../../src/types/collaboration-messages.js'

// Mock transport
class MockTransport {
  private handlers = new Map<string, Set<(data: any) => void>>()

  on<T>(event: string, handler: (data: T) => void): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler as any)
  }

  off<T>(event: string, handler: (data: T) => void): void {
    const handlers = this.handlers.get(event)
    if (handlers) handlers.delete(handler as any)
  }

  send(message: any): void {
    // Mock send - do nothing
  }

  emit(event: string, data: any): void {
    const handlers = this.handlers.get(event)
    if (handlers) {
      handlers.forEach((handler) => handler(data))
    }
  }
}

describe('CollaborationHandler', () => {
  let transport: MockTransport
  let handler: CollaborationHandler

  beforeEach(() => {
    transport = new MockTransport()
    handler = new CollaborationHandler(transport as any, {
      conflictResolution: 'operational-transform',
      presenceTimeout: 60000,
      throttleCursor: 50,
      throttleEdits: 100,
    })
  })

  describe('Initialization', () => {
    it('should create handler with default options', () => {
      const defaultHandler = new CollaborationHandler(transport as any)
      expect(defaultHandler).toBeDefined()
    })

    it('should create handler with custom options', () => {
      const customHandler = new CollaborationHandler(transport as any, {
        conflictResolution: 'crdt',
        presenceTimeout: 30000,
        broadcastCursor: false,
      })
      expect(customHandler).toBeDefined()
    })
  })

  describe('Editor Operations', () => {
    it('should handle editor change message', async () => {
      const message: CollaborativeEditorChangeMessage = {
        type: 'collaborativeEditorChange',
        componentId: 'editor-1',
        documentId: 'doc-1',
        changes: [{ type: 'insert', position: 0, content: 'Hello' }],
        userId: 'user-1',
        version: 0,
      }

      const eventSpy = vi.fn()
      handler.on('editorChange', eventSpy)

      await handler.handleEditorChange(message)

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'editorChange',
          userId: 'user-1',
        })
      )
    })

    it('should handle editor sync message', async () => {
      const message: any = {
        type: 'collaborativeEditorSync',
        componentId: 'editor-1',
        documentId: 'doc-1',
        content: 'Full document content',
        version: 5,
      }

      const eventSpy = vi.fn()
      handler.on('editorSync', eventSpy)

      await handler.handleEditorSync(message)

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'editorSync',
        })
      )
    })

    it('should detect version conflicts', async () => {
      const conflictSpy = vi.fn()
      handler.on('conflict', conflictSpy)

      // Initialize document with sync to set version
      const syncMessage: any = {
        type: 'collaborativeEditorSync',
        componentId: 'editor-1',
        documentId: 'doc-1',
        content: 'Initial content',
        version: 5,
      }
      await handler.handleEditorSync(syncMessage)

      // Try to apply change with wrong version
      const conflictMessage: CollaborativeEditorChangeMessage = {
        type: 'collaborativeEditorChange',
        componentId: 'editor-1',
        documentId: 'doc-1',
        changes: [{ type: 'insert', position: 7, content: ' Content' }],
        userId: 'user-2',
        version: 3, // Wrong version (expects 5)
      }

      await handler.handleEditorChange(conflictMessage)

      expect(conflictSpy).toHaveBeenCalled()
    })
  })

  describe('Presence Operations', () => {
    it('should handle presence join', async () => {
      const message: PresenceJoinMessage = {
        type: 'presenceJoin',
        componentId: 'presence-1',
        roomId: 'room-1',
        user: {
          id: 'user-1',
          name: 'John Doe',
          avatar: 'https://example.com/avatar.jpg',
          color: '#ff0000',
        },
      }

      const eventSpy = vi.fn()
      handler.on('presenceJoin', eventSpy)

      await handler.handlePresenceJoin(message)

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'presenceJoin',
          roomId: 'room-1',
          userId: 'user-1',
        })
      )
    })

    it('should handle presence leave', async () => {
      // First join
      const joinMessage: PresenceJoinMessage = {
        type: 'presenceJoin',
        componentId: 'presence-1',
        roomId: 'room-1',
        user: { id: 'user-1', name: 'John' },
      }
      await handler.handlePresenceJoin(joinMessage)

      // Then leave
      const leaveMessage: PresenceLeaveMessage = {
        type: 'presenceLeave',
        componentId: 'presence-1',
        roomId: 'room-1',
        userId: 'user-1',
      }

      const eventSpy = vi.fn()
      handler.on('presenceLeave', eventSpy)

      await handler.handlePresenceLeave(leaveMessage)

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'presenceLeave',
          userId: 'user-1',
        })
      )
    })

    it('should handle presence update', async () => {
      // First join
      await handler.handlePresenceJoin({
        type: 'presenceJoin',
        componentId: 'presence-1',
        roomId: 'room-1',
        user: { id: 'user-1', name: 'John' },
      })

      // Then update
      const updateMessage: PresenceUpdateMessage = {
        type: 'presenceUpdate',
        componentId: 'presence-1',
        roomId: 'room-1',
        userId: 'user-1',
        status: 'typing',
      }

      const eventSpy = vi.fn()
      handler.on('presenceUpdate', eventSpy)

      await handler.handlePresenceUpdate(updateMessage)

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'presenceUpdate',
          userId: 'user-1',
        })
      )
    })

    it('should get room users', async () => {
      await handler.joinRoom('room-1', 'user-1', {
        id: 'user-1',
        name: 'John',
      })

      await handler.joinRoom('room-1', 'user-2', {
        id: 'user-2',
        name: 'Jane',
      })

      const users = await handler.getRoomUsers('room-1')
      expect(users).toHaveLength(2)
      expect(users.find((u) => u.id === 'user-1')).toBeDefined()
      expect(users.find((u) => u.id === 'user-2')).toBeDefined()
    })
  })

  describe('Cursor Operations', () => {
    it('should handle cursor move', async () => {
      const message: CursorMoveMessage = {
        type: 'cursorMove',
        componentId: 'cursor-1',
        roomId: 'room-1',
        userId: 'user-1',
        position: { x: 100, y: 200 },
      }

      const eventSpy = vi.fn()
      handler.on('cursorMove', eventSpy)

      await handler.handleCursorMove(message)

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'cursorMove',
          userId: 'user-1',
          data: { x: 100, y: 200 },
        })
      )
    })

    it('should handle cursor selection', async () => {
      const message: any = {
        type: 'cursorSelection',
        componentId: 'cursor-1',
        roomId: 'room-1',
        userId: 'user-1',
        selection: { start: 0, end: 10 },
      }

      const eventSpy = vi.fn()
      handler.on('cursorSelection', eventSpy)

      await handler.handleCursorSelection(message)

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'cursorSelection',
          userId: 'user-1',
        })
      )
    })

    it('should throttle cursor updates', async () => {
      const message1: CursorMoveMessage = {
        type: 'cursorMove',
        componentId: 'cursor-1',
        roomId: 'room-1',
        userId: 'user-1',
        position: { x: 100, y: 200 },
      }

      const message2: CursorMoveMessage = {
        ...message1,
        position: { x: 110, y: 210 },
      }

      const eventSpy = vi.fn()
      handler.on('cursorMove', eventSpy)

      await handler.handleCursorMove(message1)
      await handler.handleCursorMove(message2) // Should be throttled

      expect(eventSpy).toHaveBeenCalledTimes(1) // Only first call
    })
  })

  describe('Canvas Operations', () => {
    it('should handle canvas draw', async () => {
      const message: CanvasDrawMessage = {
        type: 'canvasDraw',
        componentId: 'canvas-1',
        canvasId: 'canvas-1',
        userId: 'user-1',
        action: {
          type: 'draw',
          tool: 'pen',
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 10 },
          ],
          color: '#000000',
        },
      }

      const eventSpy = vi.fn()
      handler.on('canvasDraw', eventSpy)

      await handler.handleCanvasDraw(message)

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'canvasDraw',
          userId: 'user-1',
        })
      )
    })

    it('should handle canvas clear', async () => {
      const message: any = {
        type: 'canvasClear',
        componentId: 'canvas-1',
        canvasId: 'canvas-1',
        userId: 'user-1',
      }

      const eventSpy = vi.fn()
      handler.on('canvasClear', eventSpy)

      await handler.handleCanvasClear(message)

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'canvasClear',
          userId: 'user-1',
        })
      )
    })
  })

  describe('Comment Operations', () => {
    it('should handle comment create', async () => {
      const message: CommentCreateMessage = {
        type: 'commentCreate',
        componentId: 'comment-1',
        threadId: 'thread-1',
        entityId: 'doc-1',
        entityType: 'document',
        content: 'This is a comment',
        userId: 'user-1',
      }

      const eventSpy = vi.fn()
      handler.on('commentCreate', eventSpy)

      const threadId = await handler.handleCommentCreate(message)

      expect(threadId).toBe('thread-1')
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'commentCreate',
          userId: 'user-1',
        })
      )
    })

    it('should handle comment reply', async () => {
      const message: any = {
        type: 'commentReply',
        componentId: 'comment-1',
        threadId: 'thread-1',
        commentId: 'comment-1',
        content: 'This is a reply',
        userId: 'user-1',
      }

      const eventSpy = vi.fn()
      handler.on('commentReply', eventSpy)

      const commentId = await handler.handleCommentReply(message)

      expect(commentId).toContain('thread-1')
      expect(eventSpy).toHaveBeenCalled()
    })

    it('should handle comment resolve', async () => {
      const message: any = {
        type: 'commentResolve',
        componentId: 'comment-1',
        threadId: 'thread-1',
        resolved: true,
        userId: 'user-1',
      }

      const eventSpy = vi.fn()
      handler.on('commentResolve', eventSpy)

      await handler.handleCommentResolve(message)

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'commentResolve',
          userId: 'user-1',
        })
      )
    })

    it('should handle comment react', async () => {
      const message: any = {
        type: 'commentReact',
        componentId: 'comment-1',
        threadId: 'thread-1',
        commentId: 'comment-1',
        reaction: '👍',
        userId: 'user-1',
      }

      const eventSpy = vi.fn()
      handler.on('commentReact', eventSpy)

      await handler.handleCommentReact(message)

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'commentReact',
          userId: 'user-1',
        })
      )
    })
  })

  describe('Room Management', () => {
    it('should join room', async () => {
      const eventSpy = vi.fn()
      handler.on('roomJoined', eventSpy)

      await handler.joinRoom('room-1', 'user-1', {
        id: 'user-1',
        name: 'John',
      })

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'roomJoined',
          roomId: 'room-1',
          userId: 'user-1',
        })
      )
    })

    it('should leave room', async () => {
      await handler.joinRoom('room-1', 'user-1', {
        id: 'user-1',
        name: 'John',
      })

      const eventSpy = vi.fn()
      handler.on('roomLeft', eventSpy)

      await handler.leaveRoom('room-1', 'user-1')

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'roomLeft',
          roomId: 'room-1',
          userId: 'user-1',
        })
      )
    })

    it('should subscribe to room events', async () => {
      const callback = vi.fn()
      const unsubscribe = handler.subscribeToRoom('room-1', callback)

      // Trigger an event in the room
      await handler.joinRoom('room-1', 'user-1', {
        id: 'user-1',
        name: 'John',
      })

      expect(callback).toHaveBeenCalled()

      // Unsubscribe
      unsubscribe()

      // Should not receive further events
      callback.mockClear()
      await handler.joinRoom('room-1', 'user-2', {
        id: 'user-2',
        name: 'Jane',
      })

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('Event Handlers', () => {
    it('should register and unregister event handlers', () => {
      const callback = vi.fn()

      handler.on('editorChange', callback)
      handler.off('editorChange', callback)

      // Should not be called after unregistering
      handler['emit']('editorChange', { type: 'editorChange' } as any)
      expect(callback).not.toHaveBeenCalled()
    })

    it('should support multiple handlers for same event', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      handler.on('editorChange', callback1)
      handler.on('editorChange', callback2)

      handler['emit']('editorChange', { type: 'editorChange' } as any)

      expect(callback1).toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()
    })
  })

  describe('Cleanup', () => {
    it('should destroy handler and cleanup resources', () => {
      handler.destroy()

      // Verify cleanup
      const users = handler['rooms']
      expect(users.size).toBe(0)
    })
  })
})
