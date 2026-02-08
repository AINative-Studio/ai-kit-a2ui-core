/**
 * Recording Message Types Tests
 * Tests for Issue #11: Recording message type definitions
 */

import { describe, it, expect } from 'vitest'
import type {
  RequestRecordingMessage,
  RecordingStartedMessage,
  RecordingCompleteMessage,
  RecordingMode,
  VideoQuality,
} from '../../src/types/video-protocol.js'
import {
  isRequestRecordingMessage,
  isRecordingStartedMessage,
  isRecordingCompleteMessage,
} from '../../src/types/video-protocol.js'

describe('Recording Message Types', () => {
  describe('RequestRecordingMessage', () => {
    describe('when creating a request recording message', () => {
      it('should have all required properties', () => {
        const message: RequestRecordingMessage = {
          type: 'requestRecording',
          surfaceId: 'recording-surface-1',
          recordingId: 'rec-123',
          mode: 'screen',
        }

        expect(message.type).toBe('requestRecording')
        expect(message.surfaceId).toBe('recording-surface-1')
        expect(message.recordingId).toBe('rec-123')
        expect(message.mode).toBe('screen')
      })

      it('should support screen recording mode', () => {
        const message: RequestRecordingMessage = {
          type: 'requestRecording',
          surfaceId: 'recording-surface-1',
          recordingId: 'rec-123',
          mode: 'screen',
        }

        expect(message.mode).toBe('screen')
      })

      it('should support camera recording mode', () => {
        const message: RequestRecordingMessage = {
          type: 'requestRecording',
          surfaceId: 'recording-surface-1',
          recordingId: 'rec-123',
          mode: 'camera',
        }

        expect(message.mode).toBe('camera')
      })

      it('should support picture-in-picture recording mode', () => {
        const message: RequestRecordingMessage = {
          type: 'requestRecording',
          surfaceId: 'recording-surface-1',
          recordingId: 'rec-123',
          mode: 'pip',
        }

        expect(message.mode).toBe('pip')
      })

      it('should support optional audio option', () => {
        const message: RequestRecordingMessage = {
          type: 'requestRecording',
          surfaceId: 'recording-surface-1',
          recordingId: 'rec-123',
          mode: 'screen',
          options: {
            audio: true,
          },
        }

        expect(message.options?.audio).toBe(true)
      })

      it('should support optional quality option', () => {
        const message: RequestRecordingMessage = {
          type: 'requestRecording',
          surfaceId: 'recording-surface-1',
          recordingId: 'rec-123',
          mode: 'screen',
          options: {
            quality: 'high',
          },
        }

        expect(message.options?.quality).toBe('high')
      })

      it('should support low quality option', () => {
        const quality: VideoQuality = 'low'
        const message: RequestRecordingMessage = {
          type: 'requestRecording',
          surfaceId: 'recording-surface-1',
          recordingId: 'rec-123',
          mode: 'screen',
          options: {
            quality,
          },
        }

        expect(message.options?.quality).toBe('low')
      })

      it('should support medium quality option', () => {
        const quality: VideoQuality = 'medium'
        const message: RequestRecordingMessage = {
          type: 'requestRecording',
          surfaceId: 'recording-surface-1',
          recordingId: 'rec-123',
          mode: 'screen',
          options: {
            quality,
          },
        }

        expect(message.options?.quality).toBe('medium')
      })

      it('should support optional duration option', () => {
        const message: RequestRecordingMessage = {
          type: 'requestRecording',
          surfaceId: 'recording-surface-1',
          recordingId: 'rec-123',
          mode: 'screen',
          options: {
            duration: 600,
          },
        }

        expect(message.options?.duration).toBe(600)
      })

      it('should support all options together', () => {
        const message: RequestRecordingMessage = {
          type: 'requestRecording',
          surfaceId: 'recording-surface-1',
          recordingId: 'rec-123',
          mode: 'pip',
          options: {
            audio: true,
            quality: 'high',
            duration: 1800,
          },
        }

        expect(message.options?.audio).toBe(true)
        expect(message.options?.quality).toBe('high')
        expect(message.options?.duration).toBe(1800)
      })

      it('should support optional message id', () => {
        const message: RequestRecordingMessage = {
          type: 'requestRecording',
          surfaceId: 'recording-surface-1',
          recordingId: 'rec-123',
          mode: 'screen',
          id: 'msg-001',
        }

        expect(message.id).toBe('msg-001')
      })

      it('should support optional timestamp', () => {
        const timestamp = Date.now()
        const message: RequestRecordingMessage = {
          type: 'requestRecording',
          surfaceId: 'recording-surface-1',
          recordingId: 'rec-123',
          mode: 'screen',
          timestamp,
        }

        expect(message.timestamp).toBe(timestamp)
      })
    })

    describe('when using type guard', () => {
      it('should identify requestRecording messages', () => {
        const message = {
          type: 'requestRecording',
          surfaceId: 'recording-surface-1',
          recordingId: 'rec-123',
          mode: 'screen',
        }

        expect(isRequestRecordingMessage(message)).toBe(true)
      })

      it('should reject other message types', () => {
        const message = {
          type: 'recordingStarted',
          surfaceId: 'recording-surface-1',
          recordingId: 'rec-123',
          timestamp: '2026-02-08T10:00:00Z',
        }

        expect(isRequestRecordingMessage(message)).toBe(false)
      })

      it('should reject non-video messages', () => {
        const message = {
          type: 'createSurface',
          surfaceId: 'surface-1',
          components: [],
        }

        expect(isRequestRecordingMessage(message)).toBe(false)
      })
    })
  })

  describe('RecordingStartedMessage', () => {
    describe('when creating a recording started message', () => {
      it('should have all required properties', () => {
        const message: RecordingStartedMessage = {
          type: 'recordingStarted',
          surfaceId: 'recording-surface-1',
          recordingId: 'rec-123',
          timestamp: '2026-02-08T10:00:00Z',
        }

        expect(message.type).toBe('recordingStarted')
        expect(message.surfaceId).toBe('recording-surface-1')
        expect(message.recordingId).toBe('rec-123')
        expect(message.timestamp).toBe('2026-02-08T10:00:00Z')
      })

      it('should use ISO 8601 timestamp format', () => {
        const isoTimestamp = '2026-02-08T14:30:00.000Z'
        const message: RecordingStartedMessage = {
          type: 'recordingStarted',
          surfaceId: 'recording-surface-1',
          recordingId: 'rec-123',
          timestamp: isoTimestamp,
        }

        expect(message.timestamp).toBe(isoTimestamp)
        expect(message.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      })

      it('should support optional message id', () => {
        const message: RecordingStartedMessage = {
          type: 'recordingStarted',
          surfaceId: 'recording-surface-1',
          recordingId: 'rec-123',
          timestamp: '2026-02-08T10:00:00Z',
          id: 'msg-002',
        }

        expect(message.id).toBe('msg-002')
      })

      it('should confirm same recording id as request', () => {
        const recordingId = 'rec-abc-123'
        const message: RecordingStartedMessage = {
          type: 'recordingStarted',
          surfaceId: 'recording-surface-1',
          recordingId,
          timestamp: '2026-02-08T10:00:00Z',
        }

        expect(message.recordingId).toBe(recordingId)
      })
    })

    describe('when using type guard', () => {
      it('should identify recordingStarted messages', () => {
        const message = {
          type: 'recordingStarted',
          surfaceId: 'recording-surface-1',
          recordingId: 'rec-123',
          timestamp: '2026-02-08T10:00:00Z',
        }

        expect(isRecordingStartedMessage(message)).toBe(true)
      })

      it('should reject other message types', () => {
        const message = {
          type: 'recordingComplete',
          surfaceId: 'recording-surface-1',
          recordingId: 'rec-123',
          videoUrl: 'https://example.com/recording.mp4',
          duration: 120,
        }

        expect(isRecordingStartedMessage(message)).toBe(false)
      })

      it('should reject request messages', () => {
        const message = {
          type: 'requestRecording',
          surfaceId: 'recording-surface-1',
          recordingId: 'rec-123',
          mode: 'screen',
        }

        expect(isRecordingStartedMessage(message)).toBe(false)
      })
    })
  })

  describe('RecordingCompleteMessage', () => {
    describe('when creating a recording complete message', () => {
      it('should have all required properties', () => {
        const message: RecordingCompleteMessage = {
          type: 'recordingComplete',
          surfaceId: 'recording-surface-1',
          recordingId: 'rec-123',
          videoUrl: 'https://example.com/recording.mp4',
          duration: 120,
        }

        expect(message.type).toBe('recordingComplete')
        expect(message.surfaceId).toBe('recording-surface-1')
        expect(message.recordingId).toBe('rec-123')
        expect(message.videoUrl).toBe('https://example.com/recording.mp4')
        expect(message.duration).toBe(120)
      })

      it('should support video URL as HTTP URL', () => {
        const message: RecordingCompleteMessage = {
          type: 'recordingComplete',
          surfaceId: 'recording-surface-1',
          recordingId: 'rec-123',
          videoUrl: 'https://cdn.example.com/recordings/abc123.webm',
          duration: 300,
        }

        expect(message.videoUrl).toContain('https://')
        expect(message.videoUrl).toContain('.webm')
      })

      it('should support video URL as data URI', () => {
        const dataUri = 'data:video/mp4;base64,AAAAHGZ0eXBpc29t...'
        const message: RecordingCompleteMessage = {
          type: 'recordingComplete',
          surfaceId: 'recording-surface-1',
          recordingId: 'rec-123',
          videoUrl: dataUri,
          duration: 60,
        }

        expect(message.videoUrl).toContain('data:video/mp4')
      })

      it('should support duration in seconds', () => {
        const durationInSeconds = 1800 // 30 minutes
        const message: RecordingCompleteMessage = {
          type: 'recordingComplete',
          surfaceId: 'recording-surface-1',
          recordingId: 'rec-123',
          videoUrl: 'https://example.com/recording.mp4',
          duration: durationInSeconds,
        }

        expect(message.duration).toBe(1800)
      })

      it('should support optional transcript', () => {
        const message: RecordingCompleteMessage = {
          type: 'recordingComplete',
          surfaceId: 'recording-surface-1',
          recordingId: 'rec-123',
          videoUrl: 'https://example.com/recording.mp4',
          duration: 120,
          transcript: 'This is the full transcript of the recording...',
        }

        expect(message.transcript).toBeDefined()
        expect(message.transcript).toContain('full transcript')
      })

      it('should support optional AI highlights', () => {
        const message: RecordingCompleteMessage = {
          type: 'recordingComplete',
          surfaceId: 'recording-surface-1',
          recordingId: 'rec-123',
          videoUrl: 'https://example.com/recording.mp4',
          duration: 300,
          highlights: [
            { timestamp: 45, confidence: 0.95 },
            { timestamp: 120, confidence: 0.88 },
            { timestamp: 240, confidence: 0.92 },
          ],
        }

        expect(message.highlights).toHaveLength(3)
        expect(message.highlights?.[0].timestamp).toBe(45)
        expect(message.highlights?.[0].confidence).toBe(0.95)
      })

      it('should support highlights with confidence scores between 0 and 1', () => {
        const message: RecordingCompleteMessage = {
          type: 'recordingComplete',
          surfaceId: 'recording-surface-1',
          recordingId: 'rec-123',
          videoUrl: 'https://example.com/recording.mp4',
          duration: 180,
          highlights: [
            { timestamp: 30, confidence: 0.0 },
            { timestamp: 90, confidence: 0.5 },
            { timestamp: 150, confidence: 1.0 },
          ],
        }

        expect(message.highlights?.[0].confidence).toBe(0.0)
        expect(message.highlights?.[1].confidence).toBe(0.5)
        expect(message.highlights?.[2].confidence).toBe(1.0)
      })

      it('should support empty highlights array', () => {
        const message: RecordingCompleteMessage = {
          type: 'recordingComplete',
          surfaceId: 'recording-surface-1',
          recordingId: 'rec-123',
          videoUrl: 'https://example.com/recording.mp4',
          duration: 120,
          highlights: [],
        }

        expect(message.highlights).toHaveLength(0)
      })

      it('should support optional message id', () => {
        const message: RecordingCompleteMessage = {
          type: 'recordingComplete',
          surfaceId: 'recording-surface-1',
          recordingId: 'rec-123',
          videoUrl: 'https://example.com/recording.mp4',
          duration: 120,
          id: 'msg-003',
        }

        expect(message.id).toBe('msg-003')
      })

      it('should support optional timestamp', () => {
        const timestamp = Date.now()
        const message: RecordingCompleteMessage = {
          type: 'recordingComplete',
          surfaceId: 'recording-surface-1',
          recordingId: 'rec-123',
          videoUrl: 'https://example.com/recording.mp4',
          duration: 120,
          timestamp,
        }

        expect(message.timestamp).toBe(timestamp)
      })

      it('should support all optional fields together', () => {
        const message: RecordingCompleteMessage = {
          type: 'recordingComplete',
          surfaceId: 'recording-surface-1',
          recordingId: 'rec-123',
          videoUrl: 'https://example.com/recording.mp4',
          duration: 300,
          transcript: 'Full transcript here...',
          highlights: [
            { timestamp: 30, confidence: 0.95 },
            { timestamp: 150, confidence: 0.88 },
          ],
          id: 'msg-003',
          timestamp: Date.now(),
        }

        expect(message.transcript).toBeDefined()
        expect(message.highlights).toHaveLength(2)
        expect(message.id).toBe('msg-003')
        expect(message.timestamp).toBeDefined()
      })
    })

    describe('when using type guard', () => {
      it('should identify recordingComplete messages', () => {
        const message = {
          type: 'recordingComplete',
          surfaceId: 'recording-surface-1',
          recordingId: 'rec-123',
          videoUrl: 'https://example.com/recording.mp4',
          duration: 120,
        }

        expect(isRecordingCompleteMessage(message)).toBe(true)
      })

      it('should reject other message types', () => {
        const message = {
          type: 'recordingStarted',
          surfaceId: 'recording-surface-1',
          recordingId: 'rec-123',
          timestamp: '2026-02-08T10:00:00Z',
        }

        expect(isRecordingCompleteMessage(message)).toBe(false)
      })

      it('should reject request messages', () => {
        const message = {
          type: 'requestRecording',
          surfaceId: 'recording-surface-1',
          recordingId: 'rec-123',
          mode: 'screen',
        }

        expect(isRecordingCompleteMessage(message)).toBe(false)
      })
    })
  })

  describe('Real-world Recording Scenarios', () => {
    describe('complete recording flow', () => {
      it('should handle full recording lifecycle', () => {
        // Agent requests recording
        const requestMessage: RequestRecordingMessage = {
          type: 'requestRecording',
          surfaceId: 'tutorial-recording',
          recordingId: 'rec-tutorial-001',
          mode: 'screen',
          options: {
            audio: true,
            quality: 'high',
            duration: 600,
          },
          id: 'msg-req-001',
          timestamp: 1707390000000,
        }

        expect(isRequestRecordingMessage(requestMessage)).toBe(true)
        expect(requestMessage.mode).toBe('screen')
        expect(requestMessage.options?.audio).toBe(true)

        // Renderer confirms recording started
        const startedMessage: RecordingStartedMessage = {
          type: 'recordingStarted',
          surfaceId: 'tutorial-recording',
          recordingId: 'rec-tutorial-001',
          timestamp: '2026-02-08T10:00:00.500Z',
          id: 'msg-start-001',
        }

        expect(isRecordingStartedMessage(startedMessage)).toBe(true)
        expect(startedMessage.recordingId).toBe(requestMessage.recordingId)

        // Recording completes with AI results
        const completeMessage: RecordingCompleteMessage = {
          type: 'recordingComplete',
          surfaceId: 'tutorial-recording',
          recordingId: 'rec-tutorial-001',
          videoUrl: 'https://cdn.example.com/recordings/tutorial-001.webm',
          duration: 582,
          transcript: 'Welcome to this tutorial on...',
          highlights: [
            { timestamp: 12, confidence: 0.92 },
            { timestamp: 145, confidence: 0.88 },
            { timestamp: 340, confidence: 0.95 },
            { timestamp: 520, confidence: 0.85 },
          ],
          id: 'msg-complete-001',
          timestamp: 1707390582000,
        }

        expect(isRecordingCompleteMessage(completeMessage)).toBe(true)
        expect(completeMessage.duration).toBe(582)
        expect(completeMessage.highlights).toHaveLength(4)
        expect(completeMessage.highlights?.[2].confidence).toBeGreaterThan(0.9)
      })
    })

    describe('different recording mode scenarios', () => {
      it('should handle screen-only recording', () => {
        const message: RequestRecordingMessage = {
          type: 'requestRecording',
          surfaceId: 'demo-recording',
          recordingId: 'rec-screen-001',
          mode: 'screen',
          options: {
            audio: false,
            quality: 'medium',
          },
        }

        const mode: RecordingMode = message.mode
        expect(mode).toBe('screen')
        expect(message.options?.audio).toBe(false)
      })

      it('should handle camera-only recording', () => {
        const message: RequestRecordingMessage = {
          type: 'requestRecording',
          surfaceId: 'video-message',
          recordingId: 'rec-camera-001',
          mode: 'camera',
          options: {
            audio: true,
            quality: 'high',
          },
        }

        const mode: RecordingMode = message.mode
        expect(mode).toBe('camera')
        expect(message.options?.audio).toBe(true)
      })

      it('should handle picture-in-picture recording', () => {
        const message: RequestRecordingMessage = {
          type: 'requestRecording',
          surfaceId: 'presentation',
          recordingId: 'rec-pip-001',
          mode: 'pip',
          options: {
            audio: true,
            quality: 'high',
            duration: 1800,
          },
        }

        const mode: RecordingMode = message.mode
        expect(mode).toBe('pip')
        expect(message.options?.duration).toBe(1800)
      })
    })

    describe('AI features integration', () => {
      it('should handle recording with AI transcript', () => {
        const message: RecordingCompleteMessage = {
          type: 'recordingComplete',
          surfaceId: 'webinar-recording',
          recordingId: 'rec-webinar-001',
          videoUrl: 'https://storage.example.com/webinar-q1.mp4',
          duration: 3600,
          transcript: `
            [00:00:00] Welcome everyone to our Q1 webinar...
            [00:05:30] Let's discuss our quarterly results...
            [00:45:00] Now for the Q&A session...
          `,
        }

        expect(message.transcript).toBeDefined()
        expect(message.transcript).toContain('Q1 webinar')
        expect(message.transcript).toContain('[00:00:00]')
      })

      it('should handle recording with AI highlights detection', () => {
        const message: RecordingCompleteMessage = {
          type: 'recordingComplete',
          surfaceId: 'meeting-recording',
          recordingId: 'rec-meeting-001',
          videoUrl: 'https://storage.example.com/meeting-feb8.mp4',
          duration: 2700,
          highlights: [
            { timestamp: 120, confidence: 0.95 }, // Key decision point
            { timestamp: 450, confidence: 0.88 }, // Important discussion
            { timestamp: 1200, confidence: 0.92 }, // Action items
            { timestamp: 2100, confidence: 0.87 }, // Summary
            { timestamp: 2550, confidence: 0.91 }, // Next steps
          ],
        }

        expect(message.highlights).toHaveLength(5)
        const highConfidenceHighlights = message.highlights?.filter(h => h.confidence > 0.9)
        expect(highConfidenceHighlights).toHaveLength(3)
      })

      it('should handle recording without AI features', () => {
        const message: RecordingCompleteMessage = {
          type: 'recordingComplete',
          surfaceId: 'simple-recording',
          recordingId: 'rec-simple-001',
          videoUrl: 'https://storage.example.com/simple.mp4',
          duration: 180,
        }

        expect(message.transcript).toBeUndefined()
        expect(message.highlights).toBeUndefined()
      })
    })

    describe('error and edge case scenarios', () => {
      it('should handle very short recordings', () => {
        const message: RecordingCompleteMessage = {
          type: 'recordingComplete',
          surfaceId: 'quick-demo',
          recordingId: 'rec-short-001',
          videoUrl: 'https://storage.example.com/short.mp4',
          duration: 5,
        }

        expect(message.duration).toBe(5)
      })

      it('should handle very long recordings', () => {
        const message: RecordingCompleteMessage = {
          type: 'recordingComplete',
          surfaceId: 'long-session',
          recordingId: 'rec-long-001',
          videoUrl: 'https://storage.example.com/long.mp4',
          duration: 14400, // 4 hours
        }

        expect(message.duration).toBe(14400)
      })

      it('should handle recordings with no detected highlights', () => {
        const message: RecordingCompleteMessage = {
          type: 'recordingComplete',
          surfaceId: 'static-content',
          recordingId: 'rec-static-001',
          videoUrl: 'https://storage.example.com/static.mp4',
          duration: 300,
          highlights: [],
        }

        expect(message.highlights).toHaveLength(0)
      })
    })
  })
})
