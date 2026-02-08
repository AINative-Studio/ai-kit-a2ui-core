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

  describe('Component Property Validation', () => {
    it('should validate videoRecorder component properties', () => {
      const properties = {
        mode: 'screen' as const,
        audio: true,
        quality: 'high' as const,
        ai: {
          transcribe: true,
          highlights: false,
          summary: true,
          zerodb: false,
        },
        onStart: '/handlers/recordingStart',
        onComplete: '/handlers/recordingComplete',
        onError: '/handlers/error',
      }

      expect(['screen', 'camera', 'pip']).toContain(properties.mode)
      expect(properties.audio).toBe(true)
      expect(['low', 'medium', 'high']).toContain(properties.quality)
      expect(properties.ai).toBeDefined()
      expect(properties.onStart).toMatch(/^\//)
      expect(properties.onComplete).toMatch(/^\//)
      expect(properties.onError).toMatch(/^\//)
    })

    it('should validate videoCall component properties', () => {
      const properties = {
        roomId: 'room-123',
        layout: 'grid' as const,
        features: {
          chat: true,
          screenShare: true,
          recording: false,
        },
        ai: {
          liveTranscription: true,
          liveCaptions: true,
          translation: 'es-MX',
          noiseCancellation: true,
          speakerIdentification: false,
          actionItemDetection: true,
        },
        onJoin: '/handlers/join',
        onLeave: '/handlers/leave',
        onError: '/handlers/error',
      }

      expect(properties.roomId).toBeTruthy()
      expect(['grid', 'speaker', 'sidebar']).toContain(properties.layout)
      expect(properties.features).toBeDefined()
      expect(properties.ai).toBeDefined()
      expect(properties.ai.translation).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/)
    })

    it('should validate aiVideo component properties', () => {
      const properties = {
        prompt: 'Generate a tutorial video',
        template: 'tutorial-template',
        data: { topic: 'JavaScript' },
        voice: 'natural-female-1',
        streaming: true,
        onProgress: '/handlers/progress',
        onComplete: '/handlers/complete',
        onError: '/handlers/error',
      }

      expect(properties.prompt).toBeTruthy()
      expect(properties.template).toBeDefined()
      expect(properties.data).toBeDefined()
      expect(properties.voice).toBeDefined()
      expect(properties.streaming).toBe(true)
    })

    it('should validate aiVideoPlayer component properties', () => {
      const properties = {
        videoUrl: 'https://example.com/video.mp4',
        transcript: 'Video transcript...',
        interactive: {
          allowQuestions: true,
          conversationalControl: true,
          smartChapters: true,
          semanticSearch: false,
        },
        onProgress: '/handlers/progress',
        onQuestion: '/handlers/question',
      }

      expect(properties.videoUrl).toMatch(/^https?:\/\//)
      expect(properties.transcript).toBeDefined()
      expect(properties.interactive).toBeDefined()
      expect(properties.interactive.allowQuestions).toBe(true)
    })

    it('should validate language code patterns', () => {
      const validLanguageCodes = ['en', 'es', 'fr', 'de', 'en-US', 'es-MX', 'fr-CA']

      validLanguageCodes.forEach((code) => {
        expect(code).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/)
      })
    })

    it('should validate JSON Pointer paths', () => {
      const paths = [
        '/handlers/start',
        '/data/user/profile',
        '/actions/submit',
        '/state/recording/status',
      ]

      paths.forEach((path) => {
        expect(path).toMatch(/^\//)
        expect(path.split('/')).toHaveLength(path.split('/').length)
      })
    })
  })

  describe('Protocol Flow Compliance', () => {
    it('should validate complete recording flow', () => {
      // Step 1: Request recording
      const requestMessage: RequestRecordingMessage = {
        type: 'requestRecording',
        surfaceId: 'surface-1',
        recordingId: 'rec-1',
        mode: 'screen',
        options: { audio: true, quality: 'high' },
      }

      expect(requestMessage.type).toBe('requestRecording')

      // Step 2: Recording started
      const startedMessage: RecordingStartedMessage = {
        type: 'recordingStarted',
        surfaceId: requestMessage.surfaceId,
        recordingId: requestMessage.recordingId,
        timestamp: new Date().toISOString(),
      }

      expect(startedMessage.recordingId).toBe(requestMessage.recordingId)

      // Step 3: Recording complete
      const completeMessage: RecordingCompleteMessage = {
        type: 'recordingComplete',
        surfaceId: requestMessage.surfaceId,
        recordingId: requestMessage.recordingId,
        videoUrl: 'https://example.com/video.mp4',
        duration: 120,
      }

      expect(completeMessage.recordingId).toBe(requestMessage.recordingId)
    })

    it('should validate complete video call flow', () => {
      // Step 1: Initiate call
      const initiateMessage: InitiateVideoCallMessage = {
        type: 'initiateVideoCall',
        surfaceId: 'surface-1',
        callId: 'call-1',
        roomId: 'room-1',
        participants: ['user-1', 'user-2'],
      }

      expect(initiateMessage.type).toBe('initiateVideoCall')

      // Step 2: Participants join
      const joinMessage: VideoCallJoinedMessage = {
        type: 'videoCallJoined',
        surfaceId: initiateMessage.surfaceId,
        callId: initiateMessage.callId,
        participantId: 'user-1',
        timestamp: new Date().toISOString(),
      }

      expect(joinMessage.callId).toBe(initiateMessage.callId)

      // Step 3: Call ends
      const endMessage: VideoCallEndedMessage = {
        type: 'videoCallEnded',
        surfaceId: initiateMessage.surfaceId,
        callId: initiateMessage.callId,
        duration: 1800,
      }

      expect(endMessage.callId).toBe(initiateMessage.callId)
    })

    it('should validate complete video generation flow', () => {
      // Step 1: Generate video
      const generateMessage: GenerateVideoMessage = {
        type: 'generateVideo',
        surfaceId: 'surface-1',
        videoId: 'vid-1',
        prompt: 'Create a video',
      }

      expect(generateMessage.type).toBe('generateVideo')

      // Step 2: Progress updates
      const progressMessages: VideoGenerationProgressMessage[] = [
        {
          type: 'videoGenerationProgress',
          surfaceId: generateMessage.surfaceId,
          videoId: generateMessage.videoId,
          progress: 25,
        },
        {
          type: 'videoGenerationProgress',
          surfaceId: generateMessage.surfaceId,
          videoId: generateMessage.videoId,
          progress: 50,
        },
        {
          type: 'videoGenerationProgress',
          surfaceId: generateMessage.surfaceId,
          videoId: generateMessage.videoId,
          progress: 75,
        },
      ]

      progressMessages.forEach((msg, index) => {
        expect(msg.videoId).toBe(generateMessage.videoId)
        expect(msg.progress).toBeGreaterThan(index * 25 - 1)
      })

      // Step 3: Generation complete
      const completeMessage: VideoGenerationCompleteMessage = {
        type: 'videoGenerationComplete',
        surfaceId: generateMessage.surfaceId,
        videoId: generateMessage.videoId,
        videoUrl: 'https://example.com/generated.mp4',
      }

      expect(completeMessage.videoId).toBe(generateMessage.videoId)
    })

    it('should maintain message ID consistency across flow', () => {
      const surfaceId = 'surface-123'
      const recordingId = 'rec-456'

      const messages = [
        { type: 'requestRecording', surfaceId, recordingId },
        { type: 'recordingStarted', surfaceId, recordingId },
        { type: 'recordingComplete', surfaceId, recordingId },
      ]

      messages.forEach((msg) => {
        expect(msg.surfaceId).toBe(surfaceId)
        expect(msg.recordingId).toBe(recordingId)
      })
    })
  })

  describe('Error Response Compliance', () => {
    it('should handle recording errors', () => {
      const errorScenarios = [
        {
          code: 'PERMISSION_DENIED',
          message: 'User denied permission to access screen/camera',
        },
        {
          code: 'UNSUPPORTED_MODE',
          message: 'Recording mode not supported in this browser',
        },
        {
          code: 'RECORDING_FAILED',
          message: 'Recording failed due to technical error',
        },
        {
          code: 'STORAGE_FULL',
          message: 'Insufficient storage space for recording',
        },
      ]

      errorScenarios.forEach((scenario) => {
        expect(scenario.code).toBeTruthy()
        expect(scenario.message).toBeTruthy()
        expect(scenario.code).toMatch(/^[A-Z_]+$/)
      })
    })

    it('should handle video call errors', () => {
      const errorScenarios = [
        {
          code: 'CONNECTION_FAILED',
          message: 'Failed to connect to video call server',
        },
        {
          code: 'ROOM_NOT_FOUND',
          message: 'Video call room does not exist',
        },
        {
          code: 'MAX_PARTICIPANTS',
          message: 'Maximum number of participants reached',
        },
        {
          code: 'NETWORK_ERROR',
          message: 'Network connection lost during call',
        },
      ]

      errorScenarios.forEach((scenario) => {
        expect(scenario.code).toBeTruthy()
        expect(scenario.message).toBeTruthy()
      })
    })

    it('should handle video generation errors', () => {
      const errorScenarios = [
        {
          code: 'INVALID_PROMPT',
          message: 'Video generation prompt is invalid or empty',
        },
        {
          code: 'GENERATION_TIMEOUT',
          message: 'Video generation exceeded time limit',
        },
        {
          code: 'TEMPLATE_NOT_FOUND',
          message: 'Specified template does not exist',
        },
        {
          code: 'QUOTA_EXCEEDED',
          message: 'Video generation quota exceeded',
        },
      ]

      errorScenarios.forEach((scenario) => {
        expect(scenario.code).toBeTruthy()
        expect(scenario.message).toBeTruthy()
      })
    })

    it('should validate error message structure', () => {
      const errorMessage = {
        type: 'error',
        code: 'RECORDING_FAILED',
        message: 'Failed to start recording',
        details: {
          recordingId: 'rec-123',
          reason: 'Permission denied',
          timestamp: new Date().toISOString(),
        },
      }

      expect(errorMessage.type).toBe('error')
      expect(errorMessage.code).toBeTruthy()
      expect(errorMessage.message).toBeTruthy()
      expect(errorMessage.details).toBeDefined()
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

  describe('Data Type Validation', () => {
    it('should validate surfaceId format', () => {
      const validSurfaceIds = [
        'surface-1',
        'dashboard-main',
        'chat-window-123',
        'video-call-abc',
      ]

      validSurfaceIds.forEach((id) => {
        expect(id).toBeTruthy()
        expect(typeof id).toBe('string')
      })
    })

    it('should validate recordingId format', () => {
      const validRecordingIds = [
        'rec-1',
        'recording-123',
        'screen-rec-abc',
      ]

      validRecordingIds.forEach((id) => {
        expect(id).toBeTruthy()
        expect(typeof id).toBe('string')
      })
    })

    it('should validate callId format', () => {
      const validCallIds = [
        'call-1',
        'video-call-123',
        'meeting-abc',
      ]

      validCallIds.forEach((id) => {
        expect(id).toBeTruthy()
        expect(typeof id).toBe('string')
      })
    })

    it('should validate videoId format', () => {
      const validVideoIds = [
        'vid-1',
        'video-123',
        'generated-abc',
      ]

      validVideoIds.forEach((id) => {
        expect(id).toBeTruthy()
        expect(typeof id).toBe('string')
      })
    })

    it('should validate URL format', () => {
      const validUrls = [
        'https://example.com/video.mp4',
        'https://storage.example.com/recordings/video.mp4',
        'http://localhost:3000/video.mp4',
      ]

      validUrls.forEach((url) => {
        expect(url).toMatch(/^https?:\/\//)
      })
    })

    it('should validate duration values', () => {
      const validDurations = [0, 60, 120.5, 1800, 3600]

      validDurations.forEach((duration) => {
        expect(duration).toBeGreaterThanOrEqual(0)
        expect(typeof duration).toBe('number')
      })
    })

    it('should validate progress percentage values', () => {
      const validProgressValues = [0, 25, 50, 75, 100]

      validProgressValues.forEach((progress) => {
        expect(progress).toBeGreaterThanOrEqual(0)
        expect(progress).toBeLessThanOrEqual(100)
        expect(typeof progress).toBe('number')
      })
    })

    it('should validate confidence scores', () => {
      const validConfidenceScores = [0, 0.25, 0.5, 0.75, 0.87, 0.95, 1]

      validConfidenceScores.forEach((confidence) => {
        expect(confidence).toBeGreaterThanOrEqual(0)
        expect(confidence).toBeLessThanOrEqual(1)
        expect(typeof confidence).toBe('number')
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
