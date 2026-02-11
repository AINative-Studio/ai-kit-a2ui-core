/**
 * Collaboration Messages Tests
 */

import { describe, it, expect } from 'vitest'
import {
  type CollaborativeEditorChangeMessage,
  type CollaborativeEditorSyncMessage,
  type PresenceJoinMessage,
  type PresenceLeaveMessage,
  type PresenceUpdateMessage,
  type CursorMoveMessage,
  type CursorSelectionMessage,
  type CanvasDrawMessage,
  type CanvasClearMessage,
  type CommentCreateMessage,
  type CommentReplyMessage,
  type CommentResolveMessage,
  type CommentReactMessage,
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
  isCollaborationMessage,
  validateCollaborationMessage,
} from '../../src/types/collaboration-messages.js'

describe('CollaborationMessages', () => {
  describe('EditorMessages', () => {
    it('should create valid editor change message', () => {
      const message: CollaborativeEditorChangeMessage = {
        type: 'collaborativeEditorChange',
        componentId: 'editor-1',
        documentId: 'doc-123',
        changes: [
          { type: 'insert', position: 0, content: 'Hello' },
          { type: 'delete', position: 5, length: 3 },
          { type: 'replace', position: 10, length: 5, content: 'World' },
        ],
        userId: 'user-456',
        version: 1,
        timestamp: new Date().toISOString(),
      }

      expect(message.type).toBe('collaborativeEditorChange')
      expect(message.changes).toHaveLength(3)
      expect(isCollaborativeEditorChangeMessage(message)).toBe(true)
    })

    it('should create valid editor sync message', () => {
      const message: CollaborativeEditorSyncMessage = {
        type: 'collaborativeEditorSync',
        componentId: 'editor-1',
        documentId: 'doc-123',
        content: 'Full document content',
        version: 5,
        timestamp: new Date().toISOString(),
      }

      expect(message.type).toBe('collaborativeEditorSync')
      expect(isCollaborativeEditorSyncMessage(message)).toBe(true)
    })

    it('should validate editor change message', () => {
      const valid: CollaborativeEditorChangeMessage = {
        type: 'collaborativeEditorChange',
        componentId: 'editor-1',
        documentId: 'doc-1',
        changes: [{ type: 'insert', position: 0, content: 'Hello' }],
        userId: 'user-1',
        version: 1,
      }

      const result = validateCollaborationMessage(valid)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid editor message', () => {
      const invalid = {
        type: 'collaborativeEditorChange',
        componentId: 'editor-1',
        // Missing required fields
      }

      const result = validateCollaborationMessage(invalid)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('PresenceMessages', () => {
    it('should create valid presence join message', () => {
      const message: PresenceJoinMessage = {
        type: 'presenceJoin',
        componentId: 'presence-1',
        roomId: 'room-123',
        user: {
          id: 'user-456',
          name: 'John Doe',
          avatar: 'https://example.com/avatar.jpg',
          color: '#ff0000',
        },
        timestamp: new Date().toISOString(),
      }

      expect(message.type).toBe('presenceJoin')
      expect(message.user.name).toBe('John Doe')
      expect(isPresenceJoinMessage(message)).toBe(true)
    })

    it('should create valid presence leave message', () => {
      const message: PresenceLeaveMessage = {
        type: 'presenceLeave',
        componentId: 'presence-1',
        roomId: 'room-123',
        userId: 'user-456',
        timestamp: new Date().toISOString(),
      }

      expect(message.type).toBe('presenceLeave')
      expect(isPresenceLeaveMessage(message)).toBe(true)
    })

    it('should create valid presence update message', () => {
      const message: PresenceUpdateMessage = {
        type: 'presenceUpdate',
        componentId: 'presence-1',
        roomId: 'room-123',
        userId: 'user-456',
        status: 'typing',
        metadata: { editingSection: 'introduction' },
        timestamp: new Date().toISOString(),
      }

      expect(message.type).toBe('presenceUpdate')
      expect(message.status).toBe('typing')
      expect(isPresenceUpdateMessage(message)).toBe(true)
    })

    it('should support all presence statuses', () => {
      const statuses: Array<'online' | 'away' | 'typing' | 'viewing' | 'idle'> = [
        'online',
        'away',
        'typing',
        'viewing',
        'idle',
      ]

      statuses.forEach((status) => {
        const message: PresenceUpdateMessage = {
          type: 'presenceUpdate',
          componentId: 'presence-1',
          roomId: 'room-1',
          userId: 'user-1',
          status,
        }

        expect(message.status).toBe(status)
      })
    })

    it('should validate presence messages', () => {
      const valid: PresenceJoinMessage = {
        type: 'presenceJoin',
        componentId: 'presence-1',
        roomId: 'room-1',
        user: { id: 'user-1', name: 'User' },
      }

      const result = validateCollaborationMessage(valid)
      expect(result.valid).toBe(true)
    })
  })

  describe('CursorMessages', () => {
    it('should create valid cursor move message', () => {
      const message: CursorMoveMessage = {
        type: 'cursorMove',
        componentId: 'cursor-1',
        roomId: 'room-123',
        userId: 'user-456',
        position: { x: 100, y: 200 },
        timestamp: new Date().toISOString(),
      }

      expect(message.type).toBe('cursorMove')
      expect(message.position).toEqual({ x: 100, y: 200 })
      expect(isCursorMoveMessage(message)).toBe(true)
    })

    it('should create valid cursor selection message', () => {
      const message: CursorSelectionMessage = {
        type: 'cursorSelection',
        componentId: 'cursor-1',
        roomId: 'room-123',
        userId: 'user-456',
        selection: { start: 10, end: 20 },
        timestamp: new Date().toISOString(),
      }

      expect(message.type).toBe('cursorSelection')
      expect(message.selection.start).toBe(10)
      expect(message.selection.end).toBe(20)
      expect(isCursorSelectionMessage(message)).toBe(true)
    })

    it('should validate cursor messages', () => {
      const valid: CursorMoveMessage = {
        type: 'cursorMove',
        componentId: 'cursor-1',
        roomId: 'room-1',
        userId: 'user-1',
        position: { x: 0, y: 0 },
      }

      const result = validateCollaborationMessage(valid)
      expect(result.valid).toBe(true)
    })
  })

  describe('CanvasMessages', () => {
    it('should create valid canvas draw message', () => {
      const message: CanvasDrawMessage = {
        type: 'canvasDraw',
        componentId: 'canvas-1',
        canvasId: 'canvas-123',
        userId: 'user-456',
        action: {
          type: 'draw',
          tool: 'pen',
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 10 },
            { x: 20, y: 20 },
          ],
          color: '#000000',
          width: 2,
        },
        timestamp: new Date().toISOString(),
      }

      expect(message.type).toBe('canvasDraw')
      expect(message.action.points).toHaveLength(3)
      expect(isCanvasDrawMessage(message)).toBe(true)
    })

    it('should support shape drawing', () => {
      const message: CanvasDrawMessage = {
        type: 'canvasDraw',
        componentId: 'canvas-1',
        canvasId: 'canvas-123',
        userId: 'user-456',
        action: {
          type: 'shape',
          tool: 'shapes',
          shape: {
            type: 'rectangle',
            x: 10,
            y: 10,
            width: 100,
            height: 50,
          },
          color: '#ff0000',
        },
      }

      expect(message.action.shape?.type).toBe('rectangle')
    })

    it('should support text annotation', () => {
      const message: CanvasDrawMessage = {
        type: 'canvasDraw',
        componentId: 'canvas-1',
        canvasId: 'canvas-123',
        userId: 'user-456',
        action: {
          type: 'text',
          tool: 'text',
          text: {
            content: 'Hello',
            x: 50,
            y: 50,
            fontSize: 16,
            color: '#000000',
          },
        },
      }

      expect(message.action.text?.content).toBe('Hello')
    })

    it('should create valid canvas clear message', () => {
      const message: CanvasClearMessage = {
        type: 'canvasClear',
        componentId: 'canvas-1',
        canvasId: 'canvas-123',
        userId: 'user-456',
        timestamp: new Date().toISOString(),
      }

      expect(message.type).toBe('canvasClear')
      expect(isCanvasClearMessage(message)).toBe(true)
    })

    it('should validate canvas messages', () => {
      const valid: CanvasDrawMessage = {
        type: 'canvasDraw',
        componentId: 'canvas-1',
        canvasId: 'canvas-1',
        userId: 'user-1',
        action: {
          type: 'draw',
          tool: 'pen',
        },
      }

      const result = validateCollaborationMessage(valid)
      expect(result.valid).toBe(true)
    })
  })

  describe('CommentMessages', () => {
    it('should create valid comment create message', () => {
      const message: CommentCreateMessage = {
        type: 'commentCreate',
        componentId: 'comment-1',
        threadId: 'thread-123',
        entityId: 'doc-456',
        entityType: 'document',
        position: { x: 100, y: 200 },
        content: 'This is a comment',
        userId: 'user-789',
        timestamp: new Date().toISOString(),
      }

      expect(message.type).toBe('commentCreate')
      expect(message.content).toBe('This is a comment')
      expect(isCommentCreateMessage(message)).toBe(true)
    })

    it('should create valid comment reply message', () => {
      const message: CommentReplyMessage = {
        type: 'commentReply',
        componentId: 'comment-1',
        threadId: 'thread-123',
        commentId: 'comment-456',
        content: 'This is a reply',
        userId: 'user-789',
        timestamp: new Date().toISOString(),
      }

      expect(message.type).toBe('commentReply')
      expect(isCommentReplyMessage(message)).toBe(true)
    })

    it('should create valid comment resolve message', () => {
      const message: CommentResolveMessage = {
        type: 'commentResolve',
        componentId: 'comment-1',
        threadId: 'thread-123',
        resolved: true,
        userId: 'user-789',
        timestamp: new Date().toISOString(),
      }

      expect(message.type).toBe('commentResolve')
      expect(message.resolved).toBe(true)
      expect(isCommentResolveMessage(message)).toBe(true)
    })

    it('should create valid comment react message', () => {
      const message: CommentReactMessage = {
        type: 'commentReact',
        componentId: 'comment-1',
        threadId: 'thread-123',
        commentId: 'comment-456',
        reaction: '👍',
        userId: 'user-789',
        timestamp: new Date().toISOString(),
      }

      expect(message.type).toBe('commentReact')
      expect(message.reaction).toBe('👍')
      expect(isCommentReactMessage(message)).toBe(true)
    })

    it('should validate comment messages', () => {
      const valid: CommentCreateMessage = {
        type: 'commentCreate',
        componentId: 'comment-1',
        threadId: 'thread-1',
        entityId: 'entity-1',
        entityType: 'document',
        content: 'Comment',
        userId: 'user-1',
      }

      const result = validateCollaborationMessage(valid)
      expect(result.valid).toBe(true)
    })
  })

  describe('Type Guards', () => {
    it('should identify collaboration messages', () => {
      const messages = [
        { type: 'collaborativeEditorChange', componentId: 'c1', documentId: 'd1', changes: [], userId: 'u1', version: 1 },
        { type: 'presenceJoin', componentId: 'c1', roomId: 'r1', user: { id: 'u1', name: 'User' } },
        { type: 'cursorMove', componentId: 'c1', roomId: 'r1', userId: 'u1', position: { x: 0, y: 0 } },
        { type: 'canvasDraw', componentId: 'c1', canvasId: 'ca1', userId: 'u1', action: { type: 'draw', tool: 'pen' } },
        { type: 'commentCreate', componentId: 'c1', threadId: 't1', entityId: 'e1', entityType: 'doc', content: 'Hi', userId: 'u1' },
      ]

      messages.forEach((message) => {
        expect(isCollaborationMessage(message)).toBe(true)
      })
    })

    it('should reject non-collaboration messages', () => {
      const nonCollaboration = { type: 'userAction', surfaceId: 's1', action: 'click' }

      expect(isCollaborationMessage(nonCollaboration)).toBe(false)
    })
  })

  describe('Message Validation', () => {
    it('should reject messages without type', () => {
      const invalid = { componentId: 'c1' }

      const result = validateCollaborationMessage(invalid)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Message must have a valid type')
    })

    it('should reject messages without componentId', () => {
      const invalid = { type: 'presenceJoin' }

      const result = validateCollaborationMessage(invalid)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Message must have a componentId')
    })

    it('should reject unknown message types', () => {
      const invalid = {
        type: 'unknownType',
        componentId: 'c1',
      }

      const result = validateCollaborationMessage(invalid)
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('Unknown collaboration message type')
    })
  })
})
