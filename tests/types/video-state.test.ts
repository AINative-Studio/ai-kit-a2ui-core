/**
 * Video State Types Tests
 * Tests for Issue #18: Video state type definitions
 */

import { describe, it, expect } from 'vitest'
import type {
  VideoRecorderState,
  VideoRecorderStatus,
  VideoRecorderStateTransition,
  RecordingError,
  RecordingMetadata,
  VideoCallState,
  VideoCallStatus,
  VideoCallStateTransition,
  CallParticipantState,
  CallQualityMetrics,
  CallError,
  VideoGenerationState,
  VideoGenerationStatus,
  VideoGenerationStateTransition,
  GenerationStage,
  GenerationError,
  GenerationMetadata,
  VideoPlayerState,
  VideoPlayerStatus,
  VideoPlayerStateTransition,
  PlayerError,
  VideoPlayerMetadata,
  PlaybackSpeed,
  StateTransition,
} from '../../src/types/video-state.js'
import {
  isVideoRecorderState,
  isVideoCallState,
  isVideoGenerationState,
  isVideoPlayerState,
} from '../../src/types/video-state.js'

describe('Video Recorder State', () => {
  describe('VideoRecorderState interface', () => {
    describe('when creating a basic recorder state', () => {
      it('should support idle status', () => {
        const state: VideoRecorderState = {
          status: 'idle',
        }

        expect(state.status).toBe('idle')
      })

      it('should support recording status with full details', () => {
        const state: VideoRecorderState = {
          status: 'recording',
          recordingId: 'rec-123',
          mode: 'screen',
          quality: 'high',
          currentDuration: 45,
          maxDuration: 300,
          audioEnabled: true,
        }

        expect(state.status).toBe('recording')
        expect(state.recordingId).toBe('rec-123')
        expect(state.mode).toBe('screen')
        expect(state.quality).toBe('high')
        expect(state.currentDuration).toBe(45)
        expect(state.audioEnabled).toBe(true)
      })

      it('should support complete status with video URL', () => {
        const state: VideoRecorderState = {
          status: 'complete',
          recordingId: 'rec-123',
          videoUrl: 'https://example.com/video.mp4',
          metadata: {
            startedAt: '2026-02-08T10:00:00Z',
            endedAt: '2026-02-08T10:05:00Z',
            duration: 300,
            fileSize: 52428800,
            width: 1920,
            height: 1080,
            frameRate: 30,
            codec: 'h264',
          },
        }

        expect(state.status).toBe('complete')
        expect(state.videoUrl).toBeDefined()
        expect(state.metadata?.duration).toBe(300)
        expect(state.metadata?.width).toBe(1920)
      })

      it('should support error status with error details', () => {
        const error: RecordingError = {
          type: 'permission_denied',
          message: 'User denied screen recording permission',
          code: 'ERR_PERMISSION',
        }

        const state: VideoRecorderState = {
          status: 'error',
          error,
        }

        expect(state.status).toBe('error')
        expect(state.error?.type).toBe('permission_denied')
        expect(state.error?.message).toContain('permission')
      })

      it('should support processing status with progress', () => {
        const state: VideoRecorderState = {
          status: 'processing',
          recordingId: 'rec-123',
          processingProgress: 67,
        }

        expect(state.status).toBe('processing')
        expect(state.processingProgress).toBe(67)
      })
    })

    describe('when working with recorder status types', () => {
      it('should support all recorder status values', () => {
        const statuses: VideoRecorderStatus[] = [
          'idle',
          'initializing',
          'ready',
          'recording',
          'paused',
          'stopping',
          'processing',
          'complete',
          'error',
        ]

        statuses.forEach((status) => {
          const state: VideoRecorderState = { status }
          expect(state.status).toBe(status)
        })
      })
    })

    describe('when working with recording modes', () => {
      it('should support screen recording mode', () => {
        const state: VideoRecorderState = {
          status: 'ready',
          mode: 'screen',
        }

        expect(state.mode).toBe('screen')
      })

      it('should support camera recording mode', () => {
        const state: VideoRecorderState = {
          status: 'ready',
          mode: 'camera',
        }

        expect(state.mode).toBe('camera')
      })

      it('should support picture-in-picture mode', () => {
        const state: VideoRecorderState = {
          status: 'ready',
          mode: 'pip',
        }

        expect(state.mode).toBe('pip')
      })
    })

    describe('when using type guard', () => {
      it('should identify valid recorder state', () => {
        const state: VideoRecorderState = {
          status: 'recording',
        }

        expect(isVideoRecorderState(state)).toBe(true)
      })

      it('should reject invalid objects', () => {
        expect(isVideoRecorderState({})).toBe(false)
        expect(isVideoRecorderState(null)).toBe(false)
        expect(isVideoRecorderState(undefined)).toBe(false)
        expect(isVideoRecorderState('string')).toBe(false)
      })
    })
  })

  describe('VideoRecorderStateTransition', () => {
    describe('when creating state transitions', () => {
      it('should track status changes', () => {
        const transition: VideoRecorderStateTransition = {
          from: 'ready',
          to: 'recording',
          timestamp: '2026-02-08T10:00:00Z',
          reason: 'User clicked record button',
        }

        expect(transition.from).toBe('ready')
        expect(transition.to).toBe('recording')
        expect(transition.timestamp).toBeDefined()
      })

      it('should support additional transition data', () => {
        const transition: VideoRecorderStateTransition = {
          from: 'recording',
          to: 'complete',
          timestamp: '2026-02-08T10:05:00Z',
          data: {
            duration: 300,
            fileSize: 52428800,
          },
        }

        expect(transition.data?.duration).toBe(300)
      })
    })
  })
})

describe('Video Call State', () => {
  describe('VideoCallState interface', () => {
    describe('when creating a basic call state', () => {
      it('should support idle status', () => {
        const state: VideoCallState = {
          status: 'idle',
        }

        expect(state.status).toBe('idle')
      })

      it('should support active call with participants', () => {
        const participants: CallParticipantState[] = [
          {
            id: 'user-1',
            name: 'Alice Johnson',
            role: 'host',
            isMuted: false,
            isVideoEnabled: true,
            connectionQuality: 95,
          },
          {
            id: 'user-2',
            name: 'Bob Smith',
            role: 'participant',
            isMuted: true,
            isVideoEnabled: false,
            connectionQuality: 78,
          },
        ]

        const state: VideoCallState = {
          status: 'active',
          callId: 'call-123',
          roomId: 'room-456',
          startedAt: '2026-02-08T10:00:00Z',
          currentDuration: 180,
          participants,
          currentParticipantId: 'user-1',
          isRecording: true,
        }

        expect(state.status).toBe('active')
        expect(state.participants).toHaveLength(2)
        expect(state.participants?.[0].role).toBe('host')
        expect(state.isRecording).toBe(true)
      })

      it('should support call quality metrics', () => {
        const metrics: CallQualityMetrics = {
          overallQuality: 85,
          audioQuality: 90,
          videoQuality: 80,
          latency: 45,
          packetLoss: 0.5,
          bandwidth: 2500,
        }

        const state: VideoCallState = {
          status: 'active',
          qualityMetrics: metrics,
        }

        expect(state.qualityMetrics?.overallQuality).toBe(85)
        expect(state.qualityMetrics?.latency).toBe(45)
      })

      it('should support ended call with metadata', () => {
        const state: VideoCallState = {
          status: 'ended',
          callId: 'call-123',
          startedAt: '2026-02-08T10:00:00Z',
          endedAt: '2026-02-08T11:00:00Z',
          currentDuration: 3600,
          transcript: 'Full call transcript...',
          summary: 'Team discussed quarterly goals',
          actionItems: ['Complete roadmap', 'Schedule follow-up'],
        }

        expect(state.status).toBe('ended')
        expect(state.currentDuration).toBe(3600)
        expect(state.actionItems).toHaveLength(2)
      })

      it('should support error status with error details', () => {
        const error: CallError = {
          type: 'connection_failed',
          message: 'Failed to connect to video server',
          code: 'ERR_CONNECTION',
        }

        const state: VideoCallState = {
          status: 'error',
          error,
        }

        expect(state.status).toBe('error')
        expect(state.error?.type).toBe('connection_failed')
      })
    })

    describe('when working with call status types', () => {
      it('should support all call status values', () => {
        const statuses: VideoCallStatus[] = [
          'idle',
          'initializing',
          'connecting',
          'connected',
          'active',
          'reconnecting',
          'ending',
          'ended',
          'error',
        ]

        statuses.forEach((status) => {
          const state: VideoCallState = { status }
          expect(state.status).toBe(status)
        })
      })
    })

    describe('when working with participants', () => {
      it('should track participant state changes', () => {
        const participant: CallParticipantState = {
          id: 'user-1',
          name: 'Alice',
          role: 'host',
          isMuted: false,
          isVideoEnabled: true,
          isScreenSharing: true,
          connectionQuality: 92,
          avatarUrl: 'https://example.com/avatar.jpg',
          joinedAt: '2026-02-08T10:00:00Z',
        }

        expect(participant.isScreenSharing).toBe(true)
        expect(participant.connectionQuality).toBe(92)
      })

      it('should support participant leave tracking', () => {
        const participant: CallParticipantState = {
          id: 'user-2',
          name: 'Bob',
          role: 'participant',
          isMuted: true,
          isVideoEnabled: false,
          joinedAt: '2026-02-08T10:00:00Z',
          leftAt: '2026-02-08T10:30:00Z',
        }

        expect(participant.leftAt).toBeDefined()
      })
    })

    describe('when using type guard', () => {
      it('should identify valid call state', () => {
        const state: VideoCallState = {
          status: 'active',
        }

        expect(isVideoCallState(state)).toBe(true)
      })

      it('should reject invalid objects', () => {
        expect(isVideoCallState({})).toBe(false)
        expect(isVideoCallState(null)).toBe(false)
      })
    })
  })

  describe('VideoCallStateTransition', () => {
    describe('when creating state transitions', () => {
      it('should track call status changes', () => {
        const transition: VideoCallStateTransition = {
          from: 'connecting',
          to: 'active',
          timestamp: '2026-02-08T10:00:30Z',
          reason: 'Connection established',
        }

        expect(transition.from).toBe('connecting')
        expect(transition.to).toBe('active')
      })
    })
  })
})

describe('Video Generation State', () => {
  describe('VideoGenerationState interface', () => {
    describe('when creating a basic generation state', () => {
      it('should support idle status', () => {
        const state: VideoGenerationState = {
          status: 'idle',
        }

        expect(state.status).toBe('idle')
      })

      it('should support generating status with progress', () => {
        const stage: GenerationStage = {
          name: 'rendering',
          description: 'Rendering video frames',
          progress: 45,
          startedAt: '2026-02-08T10:00:00Z',
        }

        const state: VideoGenerationState = {
          status: 'generating',
          videoId: 'video-123',
          prompt: 'Create a product demo video',
          templateId: 'template-001',
          progress: 45,
          currentStage: stage,
          previewFrame: 'data:image/png;base64,iVBORw0...',
        }

        expect(state.status).toBe('generating')
        expect(state.progress).toBe(45)
        expect(state.currentStage?.name).toBe('rendering')
      })

      it('should support complete status with metadata', () => {
        const metadata: GenerationMetadata = {
          templateId: 'template-001',
          compositionName: 'ProductDemo',
          duration: 60,
          width: 1920,
          height: 1080,
          frameRate: 30,
          startedAt: '2026-02-08T10:00:00Z',
          completedAt: '2026-02-08T10:02:00Z',
          generationTime: 120,
        }

        const state: VideoGenerationState = {
          status: 'complete',
          videoId: 'video-123',
          videoUrl: 'https://example.com/generated-video.mp4',
          metadata,
        }

        expect(state.status).toBe('complete')
        expect(state.videoUrl).toBeDefined()
        expect(state.metadata?.duration).toBe(60)
      })

      it('should support error status with error details', () => {
        const error: GenerationError = {
          type: 'generation_failed',
          message: 'Failed to generate video from prompt',
          code: 'ERR_GENERATION',
        }

        const state: VideoGenerationState = {
          status: 'error',
          error,
        }

        expect(state.status).toBe('error')
        expect(state.error?.type).toBe('generation_failed')
      })

      it('should track multiple generation stages', () => {
        const stages: GenerationStage[] = [
          {
            name: 'initialization',
            progress: 100,
            startedAt: '2026-02-08T10:00:00Z',
            completedAt: '2026-02-08T10:00:10Z',
          },
          {
            name: 'rendering',
            progress: 45,
            startedAt: '2026-02-08T10:00:10Z',
          },
          {
            name: 'processing',
            progress: 0,
          },
        ]

        const state: VideoGenerationState = {
          status: 'generating',
          stages,
          currentStage: stages[1],
          estimatedTimeRemaining: 180,
        }

        expect(state.stages).toHaveLength(3)
        expect(state.currentStage?.name).toBe('rendering')
        expect(state.estimatedTimeRemaining).toBe(180)
      })
    })

    describe('when working with generation status types', () => {
      it('should support all generation status values', () => {
        const statuses: VideoGenerationStatus[] = [
          'idle',
          'queued',
          'initializing',
          'generating',
          'rendering',
          'processing',
          'complete',
          'cancelled',
          'error',
        ]

        statuses.forEach((status) => {
          const state: VideoGenerationState = { status }
          expect(state.status).toBe(status)
        })
      })
    })

    describe('when using type guard', () => {
      it('should identify valid generation state', () => {
        const state: VideoGenerationState = {
          status: 'generating',
        }

        expect(isVideoGenerationState(state)).toBe(true)
      })

      it('should reject invalid objects', () => {
        expect(isVideoGenerationState({})).toBe(false)
        expect(isVideoGenerationState(null)).toBe(false)
      })
    })
  })

  describe('VideoGenerationStateTransition', () => {
    describe('when creating state transitions', () => {
      it('should track generation status changes', () => {
        const transition: VideoGenerationStateTransition = {
          from: 'queued',
          to: 'generating',
          timestamp: '2026-02-08T10:00:00Z',
          reason: 'Processing started',
        }

        expect(transition.from).toBe('queued')
        expect(transition.to).toBe('generating')
      })
    })
  })
})

describe('Video Player State', () => {
  describe('VideoPlayerState interface', () => {
    describe('when creating a basic player state', () => {
      it('should support idle status', () => {
        const state: VideoPlayerState = {
          status: 'idle',
        }

        expect(state.status).toBe('idle')
      })

      it('should support playing status with playback info', () => {
        const state: VideoPlayerState = {
          status: 'playing',
          videoUrl: 'https://example.com/video.mp4',
          currentTime: 45.5,
          duration: 300,
          playbackSpeed: 1,
          volume: 80,
          isMuted: false,
          isFullscreen: false,
          showControls: true,
        }

        expect(state.status).toBe('playing')
        expect(state.currentTime).toBe(45.5)
        expect(state.duration).toBe(300)
        expect(state.playbackSpeed).toBe(1)
      })

      it('should support player metadata', () => {
        const metadata: VideoPlayerMetadata = {
          title: 'Product Demo',
          description: 'Complete product walkthrough',
          thumbnailUrl: 'https://example.com/thumb.jpg',
          duration: 300,
          width: 1920,
          height: 1080,
          format: 'mp4',
          fileSize: 52428800,
        }

        const state: VideoPlayerState = {
          status: 'ready',
          metadata,
        }

        expect(state.metadata?.title).toBe('Product Demo')
        expect(state.metadata?.width).toBe(1920)
      })

      it('should support buffering with buffer ranges', () => {
        const state: VideoPlayerState = {
          status: 'buffering',
          currentTime: 45,
          buffered: [
            { start: 0, end: 50 },
            { start: 60, end: 80 },
          ],
        }

        expect(state.status).toBe('buffering')
        expect(state.buffered).toHaveLength(2)
      })

      it('should support error status with error details', () => {
        const error: PlayerError = {
          type: 'media_not_found',
          message: 'Video file not found',
          code: '404',
        }

        const state: VideoPlayerState = {
          status: 'error',
          error,
        }

        expect(state.status).toBe('error')
        expect(state.error?.type).toBe('media_not_found')
      })
    })

    describe('when working with player status types', () => {
      it('should support all player status values', () => {
        const statuses: VideoPlayerStatus[] = [
          'idle',
          'loading',
          'ready',
          'playing',
          'paused',
          'buffering',
          'seeking',
          'ended',
          'error',
        ]

        statuses.forEach((status) => {
          const state: VideoPlayerState = { status }
          expect(state.status).toBe(status)
        })
      })
    })

    describe('when working with playback speeds', () => {
      it('should support all playback speed values', () => {
        const speeds: PlaybackSpeed[] = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

        speeds.forEach((speed) => {
          const state: VideoPlayerState = {
            status: 'playing',
            playbackSpeed: speed,
          }
          expect(state.playbackSpeed).toBe(speed)
        })
      })
    })

    describe('when using type guard', () => {
      it('should identify valid player state', () => {
        const state: VideoPlayerState = {
          status: 'playing',
        }

        expect(isVideoPlayerState(state)).toBe(true)
      })

      it('should reject invalid objects', () => {
        expect(isVideoPlayerState({})).toBe(false)
        expect(isVideoPlayerState(null)).toBe(false)
      })
    })
  })

  describe('VideoPlayerStateTransition', () => {
    describe('when creating state transitions', () => {
      it('should track player status changes', () => {
        const transition: VideoPlayerStateTransition = {
          from: 'paused',
          to: 'playing',
          timestamp: '2026-02-08T10:00:00Z',
          reason: 'User clicked play button',
        }

        expect(transition.from).toBe('paused')
        expect(transition.to).toBe('playing')
      })
    })
  })
})

describe('State Transitions', () => {
  describe('StateTransition generic interface', () => {
    describe('when creating state transitions', () => {
      it('should work with any state type', () => {
        type CustomStatus = 'ready' | 'processing' | 'done'
        const transition: StateTransition<CustomStatus> = {
          from: 'ready',
          to: 'processing',
          timestamp: '2026-02-08T10:00:00Z',
        }

        expect(transition.from).toBe('ready')
        expect(transition.to).toBe('processing')
      })

      it('should support optional reason', () => {
        const transition: VideoRecorderStateTransition = {
          from: 'idle',
          to: 'recording',
          timestamp: '2026-02-08T10:00:00Z',
          reason: 'User initiated recording',
        }

        expect(transition.reason).toBeDefined()
      })

      it('should support optional additional data', () => {
        const transition: VideoCallStateTransition = {
          from: 'connecting',
          to: 'active',
          timestamp: '2026-02-08T10:00:00Z',
          data: {
            participantCount: 5,
            roomId: 'room-123',
          },
        }

        expect(transition.data?.participantCount).toBe(5)
      })
    })
  })
})

describe('Real-world Scenarios', () => {
  describe('complete recording flow', () => {
    it('should track state through full lifecycle', () => {
      const states: VideoRecorderState[] = [
        { status: 'idle' },
        { status: 'initializing', recordingId: 'rec-001' },
        {
          status: 'ready',
          recordingId: 'rec-001',
          mode: 'screen',
          quality: 'high',
        },
        {
          status: 'recording',
          recordingId: 'rec-001',
          currentDuration: 150,
          audioEnabled: true,
        },
        { status: 'stopping', recordingId: 'rec-001' },
        { status: 'processing', recordingId: 'rec-001', processingProgress: 50 },
        {
          status: 'complete',
          recordingId: 'rec-001',
          videoUrl: 'https://example.com/video.mp4',
          metadata: {
            duration: 150,
            fileSize: 26214400,
          },
        },
      ]

      expect(states[0].status).toBe('idle')
      expect(states[6].status).toBe('complete')
      expect(states[6].videoUrl).toBeDefined()
    })
  })

  describe('complete video call flow', () => {
    it('should track call state through full lifecycle', () => {
      const initialState: VideoCallState = {
        status: 'idle',
      }

      const connectingState: VideoCallState = {
        status: 'connecting',
        callId: 'call-001',
        roomId: 'room-abc',
      }

      const activeState: VideoCallState = {
        status: 'active',
        callId: 'call-001',
        roomId: 'room-abc',
        startedAt: '2026-02-08T10:00:00Z',
        participants: [
          {
            id: 'user-1',
            name: 'Alice',
            role: 'host',
            isMuted: false,
            isVideoEnabled: true,
          },
        ],
      }

      const endedState: VideoCallState = {
        status: 'ended',
        callId: 'call-001',
        endedAt: '2026-02-08T11:00:00Z',
        currentDuration: 3600,
      }

      expect(initialState.status).toBe('idle')
      expect(activeState.participants).toHaveLength(1)
      expect(endedState.currentDuration).toBe(3600)
    })
  })

  describe('complete video generation flow', () => {
    it('should track generation through multiple stages', () => {
      const state: VideoGenerationState = {
        status: 'generating',
        videoId: 'video-001',
        prompt: 'Generate product video',
        progress: 50,
        stages: [
          {
            name: 'initialization',
            progress: 100,
            completedAt: '2026-02-08T10:00:10Z',
          },
          {
            name: 'rendering',
            progress: 50,
            startedAt: '2026-02-08T10:00:10Z',
          },
          {
            name: 'processing',
            progress: 0,
          },
        ],
        currentStage: {
          name: 'rendering',
          progress: 50,
          startedAt: '2026-02-08T10:00:10Z',
        },
        estimatedTimeRemaining: 60,
      }

      expect(state.stages).toHaveLength(3)
      expect(state.currentStage?.name).toBe('rendering')
      expect(state.estimatedTimeRemaining).toBe(60)
    })
  })

  describe('complete video playback flow', () => {
    it('should track player state through playback', () => {
      const loadingState: VideoPlayerState = {
        status: 'loading',
        videoUrl: 'https://example.com/video.mp4',
      }

      const playingState: VideoPlayerState = {
        status: 'playing',
        videoUrl: 'https://example.com/video.mp4',
        currentTime: 45,
        duration: 300,
        playbackSpeed: 1.5,
        volume: 75,
      }

      const pausedState: VideoPlayerState = {
        ...playingState,
        status: 'paused',
        currentTime: 120,
      }

      const endedState: VideoPlayerState = {
        ...playingState,
        status: 'ended',
        currentTime: 300,
      }

      expect(loadingState.status).toBe('loading')
      expect(playingState.playbackSpeed).toBe(1.5)
      expect(pausedState.currentTime).toBe(120)
      expect(endedState.status).toBe('ended')
    })
  })
})
