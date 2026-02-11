/**
 * Progress Tracking Message Types Tests
 * Tests for Issue #30: Progress tracking message type definitions
 */

import { describe, it, expect } from 'vitest'
import type {
  UpdateProgressMessage,
  ProgressSyncMessage,
  RequestProgressMessage,
  ProgressClearedMessage,
  ProgressConflictMessage,
  PlaybackPosition,
  SessionInfo,
  SceneContext,
  DeviceType,
  ProgressTrackingState,
} from '../../src/types/progress-tracking.js'
import {
  isUpdateProgressMessage,
  isProgressSyncMessage,
  isRequestProgressMessage,
  isProgressClearedMessage,
  isProgressConflictMessage,
  isProgressTrackingMessage,
  calculateProgress,
  isVideoCompleted,
  findCurrentScene,
  getNextScenes,
  resolveProgressConflict,
} from '../../src/types/progress-tracking.js'

describe('Progress Tracking Message Types', () => {
  describe('UpdateProgressMessage', () => {
    it('should have all required properties', () => {
      const position: PlaybackPosition = {
        position: 120,
        duration: 600,
        progress: 20,
        isPlaying: true,
      }

      const session: SessionInfo = {
        sessionId: 'sess-123',
        deviceId: 'device-abc',
        deviceType: 'mobile',
        startedAt: '2026-02-10T10:00:00Z',
        lastActivityAt: '2026-02-10T10:02:00Z',
      }

      const message: UpdateProgressMessage = {
        type: 'updateProgress',
        surfaceId: 'video-surface-1',
        videoId: 'video-123',
        userId: 'user-456',
        position,
        session,
        state: 'active',
        timestamp: '2026-02-10T10:02:00Z',
      }

      expect(message.type).toBe('updateProgress')
      expect(message.videoId).toBe('video-123')
      expect(message.position.position).toBe(120)
    })

    it('should identify updateProgress messages', () => {
      const message = {
        type: 'updateProgress',
        surfaceId: 'video-surface-1',
        videoId: 'video-123',
        userId: 'user-456',
        position: {
          position: 120,
          duration: 600,
          progress: 20,
          isPlaying: true,
        },
        session: {
          sessionId: 'sess-123',
          deviceId: 'device-abc',
          deviceType: 'mobile',
          startedAt: '2026-02-10T10:00:00Z',
          lastActivityAt: '2026-02-10T10:02:00Z',
        },
        state: 'active',
        timestamp: '2026-02-10T10:02:00Z',
      }

      expect(isUpdateProgressMessage(message)).toBe(true)
      expect(isProgressTrackingMessage(message)).toBe(true)
    })
  })

  describe('ProgressSyncMessage', () => {
    it('should have all required properties', () => {
      const message: ProgressSyncMessage = {
        type: 'progressSync',
        surfaceId: 'video-surface-1',
        videoId: 'video-123',
        userId: 'user-456',
        position: {
          position: 240,
          duration: 600,
          progress: 40,
          isPlaying: false,
        },
        isResume: true,
        lastSavedAt: '2026-02-10T09:55:00Z',
      }

      expect(message.type).toBe('progressSync')
      expect(message.isResume).toBe(true)
      expect(message.position.position).toBe(240)
    })

    it('should identify progressSync messages', () => {
      const message = {
        type: 'progressSync',
        surfaceId: 'video-surface-1',
        videoId: 'video-123',
        userId: 'user-456',
        position: {
          position: 240,
          duration: 600,
          progress: 40,
          isPlaying: false,
        },
        isResume: true,
        lastSavedAt: '2026-02-10T09:55:00Z',
      }

      expect(isProgressSyncMessage(message)).toBe(true)
      expect(isProgressTrackingMessage(message)).toBe(true)
    })
  })

  describe('Utility Functions', () => {
    describe('calculateProgress', () => {
      it('should calculate correct progress percentage', () => {
        expect(calculateProgress(0, 600)).toBe(0)
        expect(calculateProgress(150, 600)).toBe(25)
        expect(calculateProgress(300, 600)).toBe(50)
        expect(calculateProgress(450, 600)).toBe(75)
        expect(calculateProgress(600, 600)).toBe(100)
      })

      it('should handle edge cases', () => {
        expect(calculateProgress(0, 0)).toBe(0)
        expect(calculateProgress(100, 0)).toBe(0)
        expect(calculateProgress(-10, 600)).toBe(0)
        expect(calculateProgress(700, 600)).toBe(100)
      })
    })

    describe('isVideoCompleted', () => {
      it('should determine completion with default threshold', () => {
        expect(isVideoCompleted(570, 600)).toBe(true)
        expect(isVideoCompleted(590, 600)).toBe(true)
        expect(isVideoCompleted(550, 600)).toBe(false)
      })

      it('should support custom completion threshold', () => {
        expect(isVideoCompleted(500, 600, 80)).toBe(true)
        expect(isVideoCompleted(500, 600, 90)).toBe(false)
      })
    })

    describe('findCurrentScene', () => {
      const scenes: SceneContext[] = [
        {
          sceneId: 'scene-1',
          title: 'Introduction',
          startTime: 0,
          endTime: 120,
        },
        {
          sceneId: 'scene-2',
          title: 'Main Content',
          startTime: 120,
          endTime: 480,
        },
      ]

      it('should find the correct scene', () => {
        expect(findCurrentScene(60, scenes)?.title).toBe('Introduction')
        expect(findCurrentScene(300, scenes)?.title).toBe('Main Content')
      })

      it('should return undefined for position outside scenes', () => {
        expect(findCurrentScene(600, scenes)).toBeUndefined()
      })
    })

    describe('getNextScenes', () => {
      const scenes: SceneContext[] = [
        { sceneId: 'scene-1', title: 'Intro', startTime: 0, endTime: 120 },
        { sceneId: 'scene-2', title: 'Chapter 1', startTime: 120, endTime: 240 },
        { sceneId: 'scene-3', title: 'Chapter 2', startTime: 240, endTime: 360 },
      ]

      it('should return next scenes with default limit', () => {
        const next = getNextScenes(100, scenes)
        expect(next).toHaveLength(2)
        expect(next[0].title).toBe('Chapter 1')
      })

      it('should return empty array when at end', () => {
        const next = getNextScenes(400, scenes)
        expect(next).toHaveLength(0)
      })
    })

    describe('resolveProgressConflict', () => {
      const sessions: SessionInfo[] = [
        {
          sessionId: 'sess-1',
          deviceId: 'device-1',
          deviceType: 'desktop',
          startedAt: '2026-02-10T10:00:00Z',
          lastActivityAt: '2026-02-10T10:10:00Z',
        },
        {
          sessionId: 'sess-2',
          deviceId: 'device-2',
          deviceType: 'mobile',
          startedAt: '2026-02-10T10:05:00Z',
          lastActivityAt: '2026-02-10T10:15:00Z',
        },
      ]

      const positions = new Map<string, PlaybackPosition>([
        ['sess-1', { position: 300, duration: 600, progress: 50, isPlaying: false }],
        ['sess-2', { position: 450, duration: 600, progress: 75, isPlaying: true }],
      ])

      it('should resolve using latest activity strategy', () => {
        const resolved = resolveProgressConflict(sessions, positions, 'use_latest')
        expect(resolved?.sessionId).toBe('sess-2')
      })

      it('should resolve using furthest progress strategy', () => {
        const resolved = resolveProgressConflict(sessions, positions, 'use_furthest')
        expect(resolved?.sessionId).toBe('sess-2')
      })

      it('should handle empty sessions array', () => {
        const resolved = resolveProgressConflict([], positions, 'use_latest')
        expect(resolved).toBeUndefined()
      })
    })
  })
})
