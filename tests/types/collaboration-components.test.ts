/**
 * Collaboration Components Tests
 */

import { describe, it, expect } from 'vitest'
import {
  type CollaborativeEditorComponent,
  type PresenceIndicatorComponent,
  type CollaborativeCanvasComponent,
  type SharedCursorComponent,
  type CommentThreadComponent,
  isCollaborativeEditorComponent,
  isPresenceIndicatorComponent,
  isCollaborativeCanvasComponent,
  isSharedCursorComponent,
  isCommentThreadComponent,
  isCollaborationComponent,
  validateCollaborationComponent,
} from '../../src/types/collaboration-components.js'

describe('CollaborationComponents', () => {
  describe('CollaborativeEditorComponent', () => {
    it('should create valid collaborative editor component', () => {
      const component: CollaborativeEditorComponent = {
        type: 'collaborativeEditor',
        id: 'editor-1',
        properties: {
          documentId: 'doc-123',
          mode: 'code',
          language: 'typescript',
          showCursors: true,
          showSelections: true,
          showPresence: true,
          allowComments: true,
          versionHistory: true,
          conflictResolution: 'operational-transform',
          syncMode: 'realtime',
        },
      }

      expect(component.type).toBe('collaborativeEditor')
      expect(component.properties.documentId).toBe('doc-123')
      expect(component.properties.mode).toBe('code')
      expect(isCollaborativeEditorComponent(component)).toBe(true)
    })

    it('should support all editor modes', () => {
      const modes: Array<'text' | 'rich-text' | 'markdown' | 'code'> = [
        'text',
        'rich-text',
        'markdown',
        'code',
      ]

      modes.forEach((mode) => {
        const component: CollaborativeEditorComponent = {
          type: 'collaborativeEditor',
          id: `editor-${mode}`,
          properties: {
            documentId: 'doc-1',
            mode,
          },
        }

        expect(component.properties.mode).toBe(mode)
      })
    })

    it('should support all conflict resolution strategies', () => {
      const strategies: Array<'last-write-wins' | 'operational-transform' | 'crdt'> = [
        'last-write-wins',
        'operational-transform',
        'crdt',
      ]

      strategies.forEach((strategy) => {
        const component: CollaborativeEditorComponent = {
          type: 'collaborativeEditor',
          id: 'editor-1',
          properties: {
            documentId: 'doc-1',
            conflictResolution: strategy,
          },
        }

        expect(component.properties.conflictResolution).toBe(strategy)
      })
    })

    it('should validate collaborative editor', () => {
      const valid: CollaborativeEditorComponent = {
        type: 'collaborativeEditor',
        id: 'editor-1',
        properties: {
          documentId: 'doc-1',
        },
      }

      const result = validateCollaborationComponent(valid)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid editor', () => {
      const invalid = {
        type: 'collaborativeEditor',
        id: 'editor-1',
        properties: {
          // Missing documentId
        },
      }

      const result = validateCollaborationComponent(invalid)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('collaborativeEditor requires documentId')
    })
  })

  describe('PresenceIndicatorComponent', () => {
    it('should create valid presence indicator component', () => {
      const component: PresenceIndicatorComponent = {
        type: 'presenceIndicator',
        id: 'presence-1',
        properties: {
          roomId: 'room-123',
          maxVisible: 5,
          showAvatars: true,
          showNames: true,
          showStatus: true,
          layout: 'stack',
          clickable: true,
        },
      }

      expect(component.type).toBe('presenceIndicator')
      expect(component.properties.roomId).toBe('room-123')
      expect(isPresenceIndicatorComponent(component)).toBe(true)
    })

    it('should support all layout types', () => {
      const layouts: Array<'stack' | 'grid' | 'list'> = ['stack', 'grid', 'list']

      layouts.forEach((layout) => {
        const component: PresenceIndicatorComponent = {
          type: 'presenceIndicator',
          id: 'presence-1',
          properties: {
            roomId: 'room-1',
            layout,
          },
        }

        expect(component.properties.layout).toBe(layout)
      })
    })

    it('should validate presence indicator', () => {
      const valid: PresenceIndicatorComponent = {
        type: 'presenceIndicator',
        id: 'presence-1',
        properties: {
          roomId: 'room-1',
        },
      }

      const result = validateCollaborationComponent(valid)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('CollaborativeCanvasComponent', () => {
    it('should create valid collaborative canvas component', () => {
      const component: CollaborativeCanvasComponent = {
        type: 'collaborativeCanvas',
        id: 'canvas-1',
        properties: {
          canvasId: 'canvas-123',
          tools: ['pen', 'eraser', 'shapes', 'text'],
          showToolbar: true,
          allowDrawing: true,
          allowShapes: true,
          allowText: true,
          showGrid: true,
          snapToGrid: true,
          gridSize: 20,
          backgroundColor: '#ffffff',
          width: 1920,
          height: 1080,
          zoomEnabled: true,
          panEnabled: true,
        },
      }

      expect(component.type).toBe('collaborativeCanvas')
      expect(component.properties.canvasId).toBe('canvas-123')
      expect(component.properties.tools).toContain('pen')
      expect(isCollaborativeCanvasComponent(component)).toBe(true)
    })

    it('should support all tools', () => {
      const tools = ['pen', 'eraser', 'shapes', 'text', 'sticky-notes', 'images'] as const

      const component: CollaborativeCanvasComponent = {
        type: 'collaborativeCanvas',
        id: 'canvas-1',
        properties: {
          canvasId: 'canvas-1',
          tools: [...tools],
        },
      }

      expect(component.properties.tools).toHaveLength(6)
    })

    it('should validate collaborative canvas', () => {
      const valid: CollaborativeCanvasComponent = {
        type: 'collaborativeCanvas',
        id: 'canvas-1',
        properties: {
          canvasId: 'canvas-1',
          tools: ['pen'],
        },
      }

      const result = validateCollaborationComponent(valid)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject canvas without tools', () => {
      const invalid = {
        type: 'collaborativeCanvas',
        id: 'canvas-1',
        properties: {
          canvasId: 'canvas-1',
          tools: [],
        },
      }

      const result = validateCollaborationComponent(invalid)
      expect(result.valid).toBe(false)
    })
  })

  describe('SharedCursorComponent', () => {
    it('should create valid shared cursor component', () => {
      const component: SharedCursorComponent = {
        type: 'sharedCursor',
        id: 'cursor-1',
        properties: {
          roomId: 'room-123',
          userId: 'user-456',
          userName: 'John Doe',
          color: '#ff0000',
          position: { x: 100, y: 200 },
          visible: true,
        },
      }

      expect(component.type).toBe('sharedCursor')
      expect(component.properties.position).toEqual({ x: 100, y: 200 })
      expect(isSharedCursorComponent(component)).toBe(true)
    })

    it('should validate shared cursor', () => {
      const valid: SharedCursorComponent = {
        type: 'sharedCursor',
        id: 'cursor-1',
        properties: {
          roomId: 'room-1',
          userId: 'user-1',
          userName: 'User',
          color: '#000',
          position: { x: 0, y: 0 },
          visible: true,
        },
      }

      const result = validateCollaborationComponent(valid)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject cursor without position', () => {
      const invalid = {
        type: 'sharedCursor',
        id: 'cursor-1',
        properties: {
          roomId: 'room-1',
          userId: 'user-1',
          userName: 'User',
          color: '#000',
          visible: true,
        },
      }

      const result = validateCollaborationComponent(invalid)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('sharedCursor requires valid position {x, y}')
    })
  })

  describe('CommentThreadComponent', () => {
    it('should create valid comment thread component', () => {
      const component: CommentThreadComponent = {
        type: 'commentThread',
        id: 'thread-1',
        properties: {
          threadId: 'thread-123',
          entityId: 'doc-456',
          entityType: 'document',
          position: { x: 100, y: 200 },
          comments: [
            {
              id: 'comment-1',
              userId: 'user-1',
              userName: 'John Doe',
              userAvatar: 'https://example.com/avatar.jpg',
              content: 'This is a comment',
              timestamp: new Date(),
              edited: false,
              reactions: { '👍': 2, '❤️': 1 },
            },
          ],
          resolved: false,
          allowReply: true,
          allowReactions: true,
          allowResolve: true,
        },
      }

      expect(component.type).toBe('commentThread')
      expect(component.properties.comments).toHaveLength(1)
      expect(isCommentThreadComponent(component)).toBe(true)
    })

    it('should validate comment thread', () => {
      const valid: CommentThreadComponent = {
        type: 'commentThread',
        id: 'thread-1',
        properties: {
          threadId: 'thread-1',
          entityId: 'entity-1',
          entityType: 'document',
          comments: [],
        },
      }

      const result = validateCollaborationComponent(valid)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject thread without required fields', () => {
      const invalid = {
        type: 'commentThread',
        id: 'thread-1',
        properties: {
          threadId: 'thread-1',
          // Missing entityId and entityType
        },
      }

      const result = validateCollaborationComponent(invalid)
      expect(result.valid).toBe(false)
    })
  })

  describe('Type Guards', () => {
    it('should identify collaboration components', () => {
      const components = [
        {
          type: 'collaborativeEditor',
          id: 'editor-1',
          properties: { documentId: 'doc-1' },
        },
        {
          type: 'presenceIndicator',
          id: 'presence-1',
          properties: { roomId: 'room-1' },
        },
        {
          type: 'collaborativeCanvas',
          id: 'canvas-1',
          properties: { canvasId: 'canvas-1', tools: ['pen'] },
        },
        {
          type: 'sharedCursor',
          id: 'cursor-1',
          properties: {
            roomId: 'room-1',
            userId: 'user-1',
            userName: 'User',
            color: '#000',
            position: { x: 0, y: 0 },
            visible: true,
          },
        },
        {
          type: 'commentThread',
          id: 'thread-1',
          properties: {
            threadId: 'thread-1',
            entityId: 'entity-1',
            entityType: 'doc',
            comments: [],
          },
        },
      ]

      components.forEach((component) => {
        expect(isCollaborationComponent(component)).toBe(true)
      })
    })

    it('should reject non-collaboration components', () => {
      const nonCollaboration = { type: 'button', id: 'btn-1', properties: { label: 'Click' } }

      expect(isCollaborationComponent(nonCollaboration)).toBe(false)
    })
  })
})
