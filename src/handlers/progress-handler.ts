/**
 * A2UI Video Progress Handler (Issue #31 - Epic 2)
 * Manages video playback progress with cross-device sync and scene-aware resume
 */

import type { A2UITransport } from '../transport/index.js'
import type {
  UpdateProgressMessage,
  ProgressSyncMessage,
  RequestProgressMessage,
  ProgressClearedMessage,
  ProgressConflictMessage,
  PlaybackPosition,
  SessionInfo,
  SceneContext,
  ProgressTrackingState,
} from '../types/progress-tracking.js'
import {
  isUpdateProgressMessage,
  isProgressSyncMessage,
  isRequestProgressMessage,
  isProgressClearedMessage,
  isProgressConflictMessage,
  calculateProgress,
  isVideoCompleted,
  findCurrentScene,
  getNextScenes,
  resolveProgressConflict,
} from '../types/progress-tracking.js'

export type ProgressEventType =
  | 'progressUpdated'
  | 'progressSynced'
  | 'progressRequested'
  | 'progressCleared'
  | 'progressConflict'
  | 'sceneChanged'
  | 'videoCompleted'
  | 'syncRequired'

export interface ProgressEventData {
  videoId: string
  userId: string
  position?: PlaybackPosition
  scene?: SceneContext
  session?: SessionInfo
  conflict?: {
    sessions: SessionInfo[]
    resolution: 'use_latest' | 'use_furthest' | 'prompt_user'
  }
}

export type ProgressEventHandler = (data: ProgressEventData) => void
export type ProgressSyncStrategy = 'manual' | 'automatic' | 'scene-boundary'

export interface ProgressHandlerOptions {
  autoSync?: boolean
  syncStrategy?: ProgressSyncStrategy
  syncInterval?: number
  sceneBoundaryThreshold?: number
  completionThreshold?: number
  enableConflictResolution?: boolean
  defaultConflictResolution?: 'use_latest' | 'use_furthest' | 'prompt_user'
}

interface ProgressState {
  videoId: string
  userId: string
  position: PlaybackPosition
  session: SessionInfo
  state: ProgressTrackingState
  lastSyncedAt: number
  lastSceneId?: string
}

export class ProgressHandler {
  private readonly transport: A2UITransport
  private readonly options: Required<ProgressHandlerOptions>
  private readonly eventHandlers = new Map<ProgressEventType, Set<ProgressEventHandler>>()
  private readonly progressStates = new Map<string, ProgressState>()
  private syncTimer: ReturnType<typeof setInterval> | null = null
  private scenes = new Map<string, SceneContext[]>()

  constructor(transport: A2UITransport, options: ProgressHandlerOptions = {}) {
    this.transport = transport
    this.options = {
      autoSync: options.autoSync ?? true,
      syncStrategy: options.syncStrategy ?? 'automatic',
      syncInterval: options.syncInterval ?? 10000,
      sceneBoundaryThreshold: options.sceneBoundaryThreshold ?? 5,
      completionThreshold: options.completionThreshold ?? 95,
      enableConflictResolution: options.enableConflictResolution ?? true,
      defaultConflictResolution: options.defaultConflictResolution ?? 'use_furthest',
    }
    this.initialize()
  }

  private initialize(): void {
    this.transport.on<UpdateProgressMessage>('updateProgress', (msg) => {
      if (isUpdateProgressMessage(msg)) this.handleUpdateProgress(msg)
    })
    this.transport.on<ProgressSyncMessage>('progressSync', (msg) => {
      if (isProgressSyncMessage(msg)) this.handleProgressSync(msg)
    })
    this.transport.on<RequestProgressMessage>('requestProgress', (msg) => {
      if (isRequestProgressMessage(msg)) this.handleRequestProgress(msg)
    })
    this.transport.on<ProgressClearedMessage>('progressCleared', (msg) => {
      if (isProgressClearedMessage(msg)) this.handleProgressCleared(msg)
    })
    this.transport.on<ProgressConflictMessage>('progressConflict', (msg) => {
      if (isProgressConflictMessage(msg)) this.handleProgressConflict(msg)
    })
    if (this.options.autoSync && this.options.syncStrategy === 'automatic') {
      this.startAutoSync()
    }
  }

  updateProgress(
    surfaceId: string,
    videoId: string,
    userId: string,
    position: PlaybackPosition,
    session: SessionInfo,
    state: ProgressTrackingState = 'active'
  ): void {
    const stateKey = this.getStateKey(videoId, userId)
    const previousState = this.progressStates.get(stateKey)
    const scenes = this.scenes.get(videoId) || []
    const currentScene = findCurrentScene(position.position, scenes)
    const sceneChanged = currentScene && previousState?.lastSceneId !== currentScene.sceneId

    this.progressStates.set(stateKey, {
      videoId,
      userId,
      position,
      session,
      state,
      lastSyncedAt: Date.now(),
      lastSceneId: currentScene?.sceneId,
    })

    const message: UpdateProgressMessage = {
      type: 'updateProgress',
      surfaceId,
      videoId,
      userId,
      position,
      session,
      state,
      timestamp: new Date().toISOString(),
    }
    this.transport.send(message)
    this.emit('progressUpdated', { videoId, userId, position, scene: currentScene, session })

    if (sceneChanged && currentScene) {
      this.emit('sceneChanged', { videoId, userId, position, scene: currentScene, session })
    }

    if (isVideoCompleted(position.position, position.duration, this.options.completionThreshold)) {
      this.emit('videoCompleted', { videoId, userId, position, session })
    }

    if (this.options.syncStrategy === 'scene-boundary' && sceneChanged) {
      this.emit('syncRequired', { videoId, userId, position, scene: currentScene, session })
    }
  }

  requestProgress(surfaceId: string, videoId: string, userId: string, deviceId: string): void {
    const message: RequestProgressMessage = {
      type: 'requestProgress',
      surfaceId,
      videoId,
      userId,
      deviceId,
    }
    this.transport.send(message)
  }

  setScenes(videoId: string, scenes: SceneContext[]): void {
    this.scenes.set(videoId, scenes)
  }

  getScenes(videoId: string): SceneContext[] {
    return this.scenes.get(videoId) || []
  }

  getProgressState(videoId: string, userId: string): ProgressState | undefined {
    return this.progressStates.get(this.getStateKey(videoId, userId))
  }

  clearProgress(videoId: string, userId: string): void {
    this.progressStates.delete(this.getStateKey(videoId, userId))
  }

  on(event: ProgressEventType, handler: ProgressEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(handler)
  }

  off(event: ProgressEventType, handler: ProgressEventHandler): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) handlers.delete(handler)
  }

  startAutoSync(): void {
    if (this.syncTimer) return
    this.syncTimer = setInterval(() => {
      for (const state of this.progressStates.values()) {
        if (state.state === 'active' || state.state === 'paused') {
          const timeSinceLastSync = Date.now() - state.lastSyncedAt
          if (timeSinceLastSync >= this.options.syncInterval) {
            this.emit('syncRequired', {
              videoId: state.videoId,
              userId: state.userId,
              position: state.position,
              session: state.session,
            })
          }
        }
      }
    }, this.options.syncInterval)
  }

  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
      this.syncTimer = null
    }
  }

  destroy(): void {
    this.stopAutoSync()
    this.eventHandlers.clear()
    this.progressStates.clear()
    this.scenes.clear()
  }

  private handleUpdateProgress(msg: UpdateProgressMessage): void {
    const stateKey = this.getStateKey(msg.videoId, msg.userId)
    const previousState = this.progressStates.get(stateKey)

    this.progressStates.set(stateKey, {
      videoId: msg.videoId,
      userId: msg.userId,
      position: msg.position,
      session: msg.session,
      state: msg.state,
      lastSyncedAt: Date.now(),
      lastSceneId: msg.position.currentScene?.sceneId,
    })

    const sceneChanged = msg.position.currentScene && previousState?.lastSceneId !== msg.position.currentScene.sceneId

    this.emit('progressUpdated', {
      videoId: msg.videoId,
      userId: msg.userId,
      position: msg.position,
      scene: msg.position.currentScene,
      session: msg.session,
    })

    if (sceneChanged && msg.position.currentScene) {
      this.emit('sceneChanged', {
        videoId: msg.videoId,
        userId: msg.userId,
        position: msg.position,
        scene: msg.position.currentScene,
        session: msg.session,
      })
    }

    if (isVideoCompleted(msg.position.position, msg.position.duration, this.options.completionThreshold)) {
      this.emit('videoCompleted', {
        videoId: msg.videoId,
        userId: msg.userId,
        position: msg.position,
        session: msg.session,
      })
    }
  }

  private handleProgressSync(msg: ProgressSyncMessage): void {
    const stateKey = this.getStateKey(msg.videoId, msg.userId)
    if (msg.sourceSession) {
      this.progressStates.set(stateKey, {
        videoId: msg.videoId,
        userId: msg.userId,
        position: msg.position,
        session: msg.sourceSession,
        state: msg.position.isPlaying ? 'active' : 'paused',
        lastSyncedAt: Date.now(),
        lastSceneId: msg.position.currentScene?.sceneId,
      })
    }
    this.emit('progressSynced', {
      videoId: msg.videoId,
      userId: msg.userId,
      position: msg.position,
      scene: msg.position.currentScene,
      session: msg.sourceSession,
    })
  }

  private handleRequestProgress(msg: RequestProgressMessage): void {
    this.emit('progressRequested', {
      videoId: msg.videoId,
      userId: msg.userId,
    })
  }

  private handleProgressCleared(msg: ProgressClearedMessage): void {
    this.clearProgress(msg.videoId, msg.userId)
    this.emit('progressCleared', {
      videoId: msg.videoId,
      userId: msg.userId,
    })
  }

  private handleProgressConflict(msg: ProgressConflictMessage): void {
    if (this.options.enableConflictResolution && msg.resolution !== 'prompt_user') {
      const stateKey = this.getStateKey(msg.videoId, msg.userId)
      const currentState = this.progressStates.get(stateKey)
      if (currentState) {
        const positions = new Map<string, PlaybackPosition>()
        positions.set(currentState.session.sessionId, currentState.position)
        const resolvedSession = resolveProgressConflict(msg.conflictingSessions, positions, msg.resolution)
        if (resolvedSession) {
          this.emit('progressConflict', {
            videoId: msg.videoId,
            userId: msg.userId,
            session: resolvedSession,
            conflict: {
              sessions: msg.conflictingSessions,
              resolution: msg.resolution,
            },
          })
          return
        }
      }
    }
    this.emit('progressConflict', {
      videoId: msg.videoId,
      userId: msg.userId,
      conflict: {
        sessions: msg.conflictingSessions,
        resolution: msg.resolution,
      },
    })
  }

  private emit(event: ProgressEventType, data: ProgressEventData): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach((handler) => handler(data))
    }
  }

  private getStateKey(videoId: string, userId: string): string {
    return `${videoId}:${userId}`
  }
}
