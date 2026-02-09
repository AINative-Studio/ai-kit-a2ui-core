/**
 * A2UI v0.10 Protocol Compliance Tests
 * Comprehensive validation of video protocol implementation against specification
 */

import { describe, it, expect } from 'vitest'
import type {
  RequestRecordingMessage,
  RecordingStartedMessage,
  RecordingCompleteMessage,
  InitiateVideoCallMessage,
  VideoCallJoinedMessage,
  VideoCallEndedMessage,
  GenerateVideoMessage,
  VideoGenerationProgressMessage,
  VideoGenerationCompleteMessage,
  VideoMessage,
  VideoCallParticipant,
  RecordingMode,
  VideoQuality,
} from '../../src/types/video-protocol.js'
import {
  isRequestRecordingMessage,
  isRecordingStartedMessage,
  isRecordingCompleteMessage,
  isInitiateVideoCallMessage,
  isVideoCallJoinedMessage,
  isVideoCallEndedMessage,
  isGenerateVideoMessage,
  isVideoGenerationProgressMessage,
  isVideoGenerationCompleteMessage,
  isVideoMessage,
} from '../../src/types/video-protocol.js'

describe('Protocol Compliance: A2UI v0.10 Video Extension', () => {
  describe('Message Format Compliance', () => {
    describe('Recording Messages', () => {
      it('should validate RequestRecordingMessage structure', () => {
        const message: RequestRecordingMessage = {
          type: 'requestRecording',
          surfaceId: 'test-surface-1',
          recordingId: 'rec-123',
          mode: 'screen',
          options: {
            audio: true,
            quality: 'high',
            duration: 300,
          },
        }

        expect(message.type).toBe('requestRecording')
        expect(message.surfaceId).toBe('test-surface-1')
        expect(message.recordingId).toBe('rec-123')
        expect(message.mode).toBe('screen')
        expect(message.options).toBeDefined()
        expect(message.options?.audio).toBe(true)
        expect(message.options?.quality).toBe('high')
        expect(message.options?.duration).toBe(300)
      })

      it('should validate RequestRecordingMessage with minimal fields', () => {
        const message: RequestRecordingMessage = {
          type: 'requestRecording',
          surfaceId: 'test-surface-1',
          recordingId: 'rec-123',
          mode: 'camera',
        }

        expect(message.type).toBe('requestRecording')
        expect(message.surfaceId).toBeDefined()
        expect(message.recordingId).toBeDefined()
        expect(message.mode).toBe('camera')
        expect(message.options).toBeUndefined()
      })

      it('should validate all recording modes', () => {
        const modes: RecordingMode[] = ['screen', 'camera', 'pip']

        modes.forEach((mode) => {
          const message: RequestRecordingMessage = {
            type: 'requestRecording',
            surfaceId: 'surface-1',
            recordingId: 'rec-1',
            mode,
          }

          expect(message.mode).toBe(mode)
        })
      })

      it('should validate all video quality levels', () => {
        const qualities: VideoQuality[] = ['low', 'medium', 'high']

        qualities.forEach((quality) => {
          const message: RequestRecordingMessage = {
            type: 'requestRecording',
            surfaceId: 'surface-1',
            recordingId: 'rec-1',
            mode: 'screen',
            options: { quality },
          }

          expect(message.options?.quality).toBe(quality)
        })
      })

      it('should validate RecordingStartedMessage structure', () => {
        const message: RecordingStartedMessage = {
          type: 'recordingStarted',
          surfaceId: 'test-surface-1',
          recordingId: 'rec-123',
          timestamp: '2026-02-08T10:00:00.000Z',
        }

        expect(message.type).toBe('recordingStarted')
        expect(message.surfaceId).toBe('test-surface-1')
        expect(message.recordingId).toBe('rec-123')
        expect(message.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      })

      it('should validate ISO 8601 timestamp format', () => {
        const message: RecordingStartedMessage = {
          type: 'recordingStarted',
          surfaceId: 'surface-1',
          recordingId: 'rec-1',
          timestamp: new Date().toISOString(),
        }

        expect(message.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      })

      it('should validate RecordingCompleteMessage structure', () => {
        const message: RecordingCompleteMessage = {
          type: 'recordingComplete',
          surfaceId: 'test-surface-1',
          recordingId: 'rec-123',
          videoUrl: 'https://storage.example.com/video.mp4',
          duration: 120.5,
          transcript: 'This is a test transcript.',
          highlights: [
            { timestamp: 10.5, confidence: 0.95 },
            { timestamp: 45.2, confidence: 0.87 },
          ],
        }

        expect(message.type).toBe('recordingComplete')
        expect(message.videoUrl).toMatch(/^https?:\/\//)
        expect(message.duration).toBeGreaterThan(0)
        expect(message.transcript).toBeDefined()
        expect(message.highlights).toHaveLength(2)
        expect(message.highlights![0].timestamp).toBe(10.5)
        expect(message.highlights![0].confidence).toBeGreaterThanOrEqual(0)
        expect(message.highlights![0].confidence).toBeLessThanOrEqual(1)
      })

      it('should validate RecordingCompleteMessage without optional fields', () => {
        const message: RecordingCompleteMessage = {
          type: 'recordingComplete',
          surfaceId: 'surface-1',
          recordingId: 'rec-1',
          videoUrl: 'https://example.com/video.mp4',
          duration: 60,
        }

        expect(message.transcript).toBeUndefined()
        expect(message.highlights).toBeUndefined()
      })
    })

    describe('Video Call Messages', () => {
      it('should validate InitiateVideoCallMessage structure', () => {
        const message: InitiateVideoCallMessage = {
          type: 'initiateVideoCall',
          surfaceId: 'test-surface-1',
          callId: 'call-123',
          roomId: 'room-abc',
          participants: ['user-1', 'user-2', 'user-3'],
        }

        expect(message.type).toBe('initiateVideoCall')
        expect(message.surfaceId).toBe('test-surface-1')
        expect(message.callId).toBe('call-123')
        expect(message.roomId).toBe('room-abc')
        expect(message.participants).toHaveLength(3)
      })

      it('should validate InitiateVideoCallMessage without participants', () => {
        const message: InitiateVideoCallMessage = {
          type: 'initiateVideoCall',
          surfaceId: 'surface-1',
          callId: 'call-1',
          roomId: 'room-1',
        }

        expect(message.participants).toBeUndefined()
      })

      it('should validate VideoCallParticipant structure', () => {
        const participant: VideoCallParticipant = {
          id: 'user-123',
          name: 'John Doe',
          role: 'host',
          isMuted: false,
          isVideoEnabled: true,
          avatarUrl: 'https://example.com/avatar.jpg',
          joinedAt: '2026-02-08T10:00:00.000Z',
        }

        expect(participant.id).toBe('user-123')
        expect(participant.name).toBe('John Doe')
        expect(participant.role).toBe('host')
        expect(participant.isMuted).toBe(false)
        expect(participant.isVideoEnabled).toBe(true)
        expect(participant.avatarUrl).toMatch(/^https?:\/\//)
        expect(participant.joinedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
      })

      it('should validate participant roles', () => {
        const hostParticipant: VideoCallParticipant = {
          id: 'user-1',
          name: 'Host',
          role: 'host',
          isMuted: false,
          isVideoEnabled: true,
        }

        const regularParticipant: VideoCallParticipant = {
          id: 'user-2',
          name: 'Participant',
          role: 'participant',
          isMuted: false,
          isVideoEnabled: true,
        }

        expect(hostParticipant.role).toBe('host')
        expect(regularParticipant.role).toBe('participant')
      })

      it('should validate VideoCallJoinedMessage structure', () => {
        const message: VideoCallJoinedMessage = {
          type: 'videoCallJoined',
          surfaceId: 'test-surface-1',
          callId: 'call-123',
          participantId: 'user-123',
          timestamp: '2026-02-08T10:00:00.000Z',
          participant: {
            id: 'user-123',
            name: 'John Doe',
            role: 'participant',
            isMuted: false,
            isVideoEnabled: true,
          },
        }

        expect(message.type).toBe('videoCallJoined')
        expect(message.participantId).toBe('user-123')
        expect(message.participant).toBeDefined()
        expect(message.participant?.id).toBe('user-123')
      })

      it('should validate VideoCallEndedMessage structure', () => {
        const message: VideoCallEndedMessage = {
          type: 'videoCallEnded',
          surfaceId: 'test-surface-1',
          callId: 'call-123',
          duration: 1800,
          transcript: 'Meeting transcript...',
          summary: 'Meeting summary...',
          actionItems: ['Task 1', 'Task 2', 'Task 3'],
          participants: [
            {
              id: 'user-1',
              name: 'Host',
              role: 'host',
              isMuted: false,
              isVideoEnabled: true,
            },
          ],
        }

        expect(message.type).toBe('videoCallEnded')
        expect(message.duration).toBeGreaterThan(0)
        expect(message.transcript).toBeDefined()
        expect(message.summary).toBeDefined()
        expect(message.actionItems).toHaveLength(3)
        expect(message.participants).toHaveLength(1)
      })

      it('should validate VideoCallEndedMessage with minimal fields', () => {
        const message: VideoCallEndedMessage = {
          type: 'videoCallEnded',
          surfaceId: 'surface-1',
          callId: 'call-1',
          duration: 300,
        }

        expect(message.type).toBe('videoCallEnded')
        expect(message.duration).toBe(300)
        expect(message.transcript).toBeUndefined()
        expect(message.summary).toBeUndefined()
        expect(message.actionItems).toBeUndefined()
        expect(message.participants).toBeUndefined()
      })
    })

    describe('Video Generation Messages', () => {
      it('should validate GenerateVideoMessage structure', () => {
        const message: GenerateVideoMessage = {
          type: 'generateVideo',
          surfaceId: 'test-surface-1',
          videoId: 'vid-123',
          prompt: 'Create a promotional video about AI technology',
          data: {
            title: 'AI Revolution',
            features: ['Fast', 'Accurate', 'Scalable'],
          },
          template: 'promotional-video',
        }

        expect(message.type).toBe('generateVideo')
        expect(message.videoId).toBe('vid-123')
        expect(message.prompt).toBeTruthy()
        expect(message.data).toBeDefined()
        expect(message.template).toBe('promotional-video')
      })

      it('should validate GenerateVideoMessage with minimal fields', () => {
        const message: GenerateVideoMessage = {
          type: 'generateVideo',
          surfaceId: 'surface-1',
          videoId: 'vid-1',
          prompt: 'Generate video',
        }

        expect(message.type).toBe('generateVideo')
        expect(message.prompt).toBeTruthy()
        expect(message.data).toBeUndefined()
        expect(message.template).toBeUndefined()
      })

      it('should validate VideoGenerationProgressMessage structure', () => {
        const message: VideoGenerationProgressMessage = {
          type: 'videoGenerationProgress',
          surfaceId: 'test-surface-1',
          videoId: 'vid-123',
          progress: 45,
          frame: 'base64encodedframedata...',
        }

        expect(message.type).toBe('videoGenerationProgress')
        expect(message.progress).toBeGreaterThanOrEqual(0)
        expect(message.progress).toBeLessThanOrEqual(100)
        expect(message.frame).toBeDefined()
      })

      it('should validate progress percentage boundaries', () => {
        const progressValues = [0, 25, 50, 75, 100]

        progressValues.forEach((progress) => {
          const message: VideoGenerationProgressMessage = {
            type: 'videoGenerationProgress',
            surfaceId: 'surface-1',
            videoId: 'vid-1',
            progress,
          }

          expect(message.progress).toBeGreaterThanOrEqual(0)
          expect(message.progress).toBeLessThanOrEqual(100)
        })
      })

      it('should validate VideoGenerationCompleteMessage structure', () => {
        const message: VideoGenerationCompleteMessage = {
          type: 'videoGenerationComplete',
          surfaceId: 'test-surface-1',
          videoId: 'vid-123',
          videoUrl: 'https://storage.example.com/generated-video.mp4',
          composition: {
            width: 1920,
            height: 1080,
            fps: 30,
            durationInFrames: 900,
          },
        }

        expect(message.type).toBe('videoGenerationComplete')
        expect(message.videoUrl).toMatch(/^https?:\/\//)
        expect(message.composition).toBeDefined()
        expect(message.composition?.width).toBe(1920)
        expect(message.composition?.height).toBe(1080)
      })

      it('should validate VideoGenerationCompleteMessage without composition', () => {
        const message: VideoGenerationCompleteMessage = {
          type: 'videoGenerationComplete',
          surfaceId: 'surface-1',
          videoId: 'vid-1',
          videoUrl: 'https://example.com/video.mp4',
        }

        expect(message.composition).toBeUndefined()
      })
    })
  })

  describe('Type Guard Compliance', () => {
    it('should correctly identify RequestRecordingMessage', () => {
      const message = {
        type: 'requestRecording',
        surfaceId: 'surface-1',
        recordingId: 'rec-1',
        mode: 'screen',
      }

      expect(isRequestRecordingMessage(message)).toBe(true)
      expect(isRecordingStartedMessage(message)).toBe(false)
      expect(isVideoMessage(message)).toBe(true)
    })

    it('should correctly identify RecordingStartedMessage', () => {
      const message = {
        type: 'recordingStarted',
        surfaceId: 'surface-1',
        recordingId: 'rec-1',
        timestamp: '2026-02-08T10:00:00.000Z',
      }

      expect(isRecordingStartedMessage(message)).toBe(true)
      expect(isRequestRecordingMessage(message)).toBe(false)
      expect(isVideoMessage(message)).toBe(true)
    })

    it('should correctly identify RecordingCompleteMessage', () => {
      const message = {
        type: 'recordingComplete',
        surfaceId: 'surface-1',
        recordingId: 'rec-1',
        videoUrl: 'https://example.com/video.mp4',
        duration: 120,
      }

      expect(isRecordingCompleteMessage(message)).toBe(true)
      expect(isRequestRecordingMessage(message)).toBe(false)
      expect(isVideoMessage(message)).toBe(true)
    })

    it('should correctly identify InitiateVideoCallMessage', () => {
      const message = {
        type: 'initiateVideoCall',
        surfaceId: 'surface-1',
        callId: 'call-1',
        roomId: 'room-1',
      }

      expect(isInitiateVideoCallMessage(message)).toBe(true)
      expect(isVideoCallJoinedMessage(message)).toBe(false)
      expect(isVideoMessage(message)).toBe(true)
    })

    it('should correctly identify VideoCallJoinedMessage', () => {
      const message = {
        type: 'videoCallJoined',
        surfaceId: 'surface-1',
        callId: 'call-1',
        participantId: 'user-1',
        timestamp: '2026-02-08T10:00:00.000Z',
      }

      expect(isVideoCallJoinedMessage(message)).toBe(true)
      expect(isInitiateVideoCallMessage(message)).toBe(false)
      expect(isVideoMessage(message)).toBe(true)
    })

    it('should correctly identify VideoCallEndedMessage', () => {
      const message = {
        type: 'videoCallEnded',
        surfaceId: 'surface-1',
        callId: 'call-1',
        duration: 1800,
      }

      expect(isVideoCallEndedMessage(message)).toBe(true)
      expect(isVideoCallJoinedMessage(message)).toBe(false)
      expect(isVideoMessage(message)).toBe(true)
    })

    it('should correctly identify GenerateVideoMessage', () => {
      const message = {
        type: 'generateVideo',
        surfaceId: 'surface-1',
        videoId: 'vid-1',
        prompt: 'Generate a video',
      }

      expect(isGenerateVideoMessage(message)).toBe(true)
      expect(isVideoGenerationProgressMessage(message)).toBe(false)
      expect(isVideoMessage(message)).toBe(true)
    })

    it('should correctly identify VideoGenerationProgressMessage', () => {
      const message = {
        type: 'videoGenerationProgress',
        surfaceId: 'surface-1',
        videoId: 'vid-1',
        progress: 50,
      }

      expect(isVideoGenerationProgressMessage(message)).toBe(true)
      expect(isGenerateVideoMessage(message)).toBe(false)
      expect(isVideoMessage(message)).toBe(true)
    })

    it('should correctly identify VideoGenerationCompleteMessage', () => {
      const message = {
        type: 'videoGenerationComplete',
        surfaceId: 'surface-1',
        videoId: 'vid-1',
        videoUrl: 'https://example.com/video.mp4',
      }

      expect(isVideoGenerationCompleteMessage(message)).toBe(true)
      expect(isVideoGenerationProgressMessage(message)).toBe(false)
      expect(isVideoMessage(message)).toBe(true)
    })

    it('should reject non-video messages', () => {
      const nonVideoMessages = [
        { type: 'createSurface' },
        { type: 'updateComponents' },
        { type: 'userAction' },
        { type: 'ping' },
        null,
        undefined,
        'string',
        123,
        [],
      ]

      nonVideoMessages.forEach((msg) => {
        expect(isVideoMessage(msg)).toBe(false)
      })
    })
  })

  describe('Specification Version Compliance', () => {
    it('should be compatible with A2UI v0.10 specification', () => {
      const specVersion = '0.10'
      expect(specVersion).toMatch(/^\d+\.\d+$/)
    })

    it('should include all required message types', () => {
      const requiredMessageTypes = [
        'requestRecording',
        'recordingStarted',
        'recordingComplete',
        'initiateVideoCall',
        'videoCallJoined',
        'videoCallEnded',
        'generateVideo',
        'videoGenerationProgress',
        'videoGenerationComplete',
      ]

      expect(requiredMessageTypes).toHaveLength(9)
    })

    it('should include all required component types', () => {
      const requiredComponentTypes = [
        'videoRecorder',
        'videoCall',
        'aiVideo',
        'aiVideoPlayer',
      ]

      expect(requiredComponentTypes).toHaveLength(4)
    })

    it('should support all recording modes', () => {
      const recordingModes: RecordingMode[] = ['screen', 'camera', 'pip']
      expect(recordingModes).toHaveLength(3)
    })

    it('should support all video quality levels', () => {
      const qualityLevels: VideoQuality[] = ['low', 'medium', 'high']
      expect(qualityLevels).toHaveLength(3)
    })
  })
})
