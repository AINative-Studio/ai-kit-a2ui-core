/**
 * Metadata Message Types Tests
 * Tests for Issue #29: Metadata message type definitions (Epic 2)
 */

import { describe, it, expect } from 'vitest'
import type {
  RequestMetadataMessage,
  MetadataReadyMessage,
  MetadataProgressMessage,
  MetadataType,
  MetadataPriority,
  MetadataProcessingState,
} from '../../src/types/metadata-messages.js'
import {
  isRequestMetadataMessage,
  isMetadataReadyMessage,
  isMetadataProgressMessage,
  isMetadataMessage,
  isValidMetadataType,
  filterValidMetadataTypes,
  hasAllMetadataTypes,
  getMissingMetadataTypes,
} from '../../src/types/metadata-messages.js'

describe('Metadata Message Types', () => {
  describe('RequestMetadataMessage', () => {
    describe('when creating a request metadata message', () => {
      it('should have all required properties', () => {
        const message: RequestMetadataMessage = {
          type: 'requestMetadata',
          surfaceId: 'video-player-1',
          contentId: 'rec-abc-123',
          metadataTypes: ['transcript', 'summary'],
        }

        expect(message.type).toBe('requestMetadata')
        expect(message.surfaceId).toBe('video-player-1')
        expect(message.contentId).toBe('rec-abc-123')
        expect(message.metadataTypes).toEqual(['transcript', 'summary'])
      })

      it('should support single metadata type request', () => {
        const message: RequestMetadataMessage = {
          type: 'requestMetadata',
          surfaceId: 'video-player-1',
          contentId: 'rec-abc-123',
          metadataTypes: ['transcript'],
        }

        expect(message.metadataTypes).toHaveLength(1)
        expect(message.metadataTypes[0]).toBe('transcript')
      })

      it('should support all metadata types', () => {
        const allTypes: MetadataType[] = [
          'transcript',
          'summary',
          'topics',
          'highlights',
          'chapters',
          'sentiment',
        ]

        const message: RequestMetadataMessage = {
          type: 'requestMetadata',
          surfaceId: 'video-player-1',
          contentId: 'rec-abc-123',
          metadataTypes: allTypes,
        }

        expect(message.metadataTypes).toHaveLength(6)
        expect(message.metadataTypes).toContain('transcript')
        expect(message.metadataTypes).toContain('sentiment')
      })

      it('should support priority option', () => {
        const message: RequestMetadataMessage = {
          type: 'requestMetadata',
          surfaceId: 'video-player-1',
          contentId: 'rec-abc-123',
          metadataTypes: ['transcript'],
          options: { priority: 'high' },
        }

        expect(message.options?.priority).toBe('high')
      })

      it('should support all priority levels', () => {
        const priorities: MetadataPriority[] = ['low', 'normal', 'high', 'urgent']

        priorities.forEach((priority) => {
          const message: RequestMetadataMessage = {
            type: 'requestMetadata',
            surfaceId: 'video-player-1',
            contentId: 'rec-abc-123',
            metadataTypes: ['transcript'],
            options: { priority },
          }

          expect(message.options?.priority).toBe(priority)
        })
      })

      it('should support language option', () => {
        const message: RequestMetadataMessage = {
          type: 'requestMetadata',
          surfaceId: 'video-player-1',
          contentId: 'rec-abc-123',
          metadataTypes: ['transcript', 'summary'],
          options: { language: 'en' },
        }

        expect(message.options?.language).toBe('en')
      })

      it('should support speaker diarization option', () => {
        const message: RequestMetadataMessage = {
          type: 'requestMetadata',
          surfaceId: 'video-player-1',
          contentId: 'rec-abc-123',
          metadataTypes: ['transcript'],
          options: { enableSpeakerDiarization: true },
        }

        expect(message.options?.enableSpeakerDiarization).toBe(true)
      })

      it('should support emotion detection option', () => {
        const message: RequestMetadataMessage = {
          type: 'requestMetadata',
          surfaceId: 'video-player-1',
          contentId: 'rec-abc-123',
          metadataTypes: ['sentiment'],
          options: { enableEmotionDetection: true },
        }

        expect(message.options?.enableEmotionDetection).toBe(true)
      })

      it('should support all options together', () => {
        const message: RequestMetadataMessage = {
          type: 'requestMetadata',
          surfaceId: 'video-player-1',
          contentId: 'rec-abc-123',
          metadataTypes: ['transcript', 'summary', 'topics', 'highlights'],
          options: {
            priority: 'high',
            language: 'en',
            enableSpeakerDiarization: true,
            enableEmotionDetection: true,
            maxProcessingTime: 600,
            model: 'whisper-large-v3',
            webhookUrl: 'https://api.example.com/webhooks/metadata',
            customParams: { key: 'value' },
          },
          id: 'msg-request-001',
          timestamp: Date.now(),
        }

        expect(message.options?.priority).toBe('high')
        expect(message.options?.language).toBe('en')
        expect(message.options?.enableSpeakerDiarization).toBe(true)
        expect(message.id).toBe('msg-request-001')
        expect(message.timestamp).toBeDefined()
      })
    })

    describe('when using type guard', () => {
      it('should identify requestMetadata messages', () => {
        const message = {
          type: 'requestMetadata',
          surfaceId: 'video-player-1',
          contentId: 'rec-abc-123',
          metadataTypes: ['transcript'],
        }

        expect(isRequestMetadataMessage(message)).toBe(true)
      })

      it('should reject other message types', () => {
        const message = {
          type: 'metadataReady',
          surfaceId: 'video-player-1',
          contentId: 'rec-abc-123',
          state: 'ready',
          metadata: {},
          processingTime: 1000,
          completedAt: '2026-02-10T12:00:00Z',
        }

        expect(isRequestMetadataMessage(message)).toBe(false)
      })

      it('should reject messages without required fields', () => {
        const invalidMessages = [
          { type: 'requestMetadata', surfaceId: 'test' },
          { type: 'requestMetadata', contentId: 'test' },
          { type: 'requestMetadata', metadataTypes: [] },
          { surfaceId: 'test', contentId: 'test', metadataTypes: [] },
        ]

        invalidMessages.forEach((msg) => {
          expect(isRequestMetadataMessage(msg)).toBe(false)
        })
      })
    })
  })

  describe('MetadataReadyMessage', () => {
    describe('when creating a metadata ready message', () => {
      it('should have all required properties', () => {
        const message: MetadataReadyMessage = {
          type: 'metadataReady',
          surfaceId: 'video-player-1',
          contentId: 'rec-abc-123',
          state: 'ready',
          metadata: {},
          processingTime: 12500,
          completedAt: '2026-02-10T12:30:00.000Z',
        }

        expect(message.type).toBe('metadataReady')
        expect(message.surfaceId).toBe('video-player-1')
        expect(message.contentId).toBe('rec-abc-123')
        expect(message.state).toBe('ready')
        expect(message.processingTime).toBe(12500)
        expect(message.completedAt).toBe('2026-02-10T12:30:00.000Z')
      })

      it('should support all processing states', () => {
        const states: MetadataProcessingState[] = ['pending', 'processing', 'ready', 'error']

        states.forEach((state) => {
          const message: MetadataReadyMessage = {
            type: 'metadataReady',
            surfaceId: 'video-player-1',
            contentId: 'rec-abc-123',
            state,
            metadata: {},
            processingTime: 1000,
            completedAt: '2026-02-10T12:00:00Z',
          }

          expect(message.state).toBe(state)
        })
      })

      it('should support transcript metadata', () => {
        const message: MetadataReadyMessage = {
          type: 'metadataReady',
          surfaceId: 'video-player-1',
          contentId: 'rec-abc-123',
          state: 'ready',
          metadata: {
            transcript: {
              segments: [
                {
                  startTime: 0,
                  endTime: 5,
                  text: 'Hello world',
                  confidence: 0.95,
                },
              ],
              language: 'en',
              confidence: 0.95,
              duration: 5,
              wordCount: 2,
              generatedAt: '2026-02-10T12:00:00Z',
            },
          },
          processingTime: 5000,
          completedAt: '2026-02-10T12:00:05Z',
        }

        expect(message.metadata.transcript).toBeDefined()
        expect(message.metadata.transcript?.segments).toHaveLength(1)
        expect(message.metadata.transcript?.language).toBe('en')
      })

      it('should support error state with error details', () => {
        const message: MetadataReadyMessage = {
          type: 'metadataReady',
          surfaceId: 'video-player-1',
          contentId: 'rec-abc-123',
          state: 'error',
          metadata: {},
          processingTime: 1000,
          completedAt: '2026-02-10T12:00:01Z',
          error: {
            code: 'PROCESSING_ERROR',
            message: 'Failed to process transcript',
            failedTypes: ['transcript'],
            details: { reason: 'Unsupported audio format' },
          },
        }

        expect(message.state).toBe('error')
        expect(message.error).toBeDefined()
        expect(message.error?.code).toBe('PROCESSING_ERROR')
        expect(message.error?.failedTypes).toContain('transcript')
      })

      it('should support partial results flag', () => {
        const message: MetadataReadyMessage = {
          type: 'metadataReady',
          surfaceId: 'video-player-1',
          contentId: 'rec-abc-123',
          state: 'ready',
          metadata: {
            transcript: {
              segments: [],
              language: 'en',
              confidence: 0.95,
              duration: 100,
              wordCount: 200,
              generatedAt: '2026-02-10T12:00:00Z',
            },
          },
          processingTime: 5000,
          completedAt: '2026-02-10T12:00:05Z',
          isPartial: true,
        }

        expect(message.isPartial).toBe(true)
      })

      it('should support processing statistics', () => {
        const message: MetadataReadyMessage = {
          type: 'metadataReady',
          surfaceId: 'video-player-1',
          contentId: 'rec-abc-123',
          state: 'ready',
          metadata: {
            transcript: {
              segments: [],
              language: 'en',
              confidence: 0.95,
              duration: 100,
              wordCount: 200,
              generatedAt: '2026-02-10T12:00:00Z',
            },
            summary: {
              short: 'Brief',
              long: 'Long',
              bulletPoints: [],
              keyTakeaways: [],
              generatedAt: '2026-02-10T12:00:00Z',
            },
          },
          processingTime: 8000,
          completedAt: '2026-02-10T12:00:08Z',
          stats: {
            successCount: 2,
            failedCount: 1,
            totalRequested: 3,
          },
        }

        expect(message.stats).toBeDefined()
        expect(message.stats?.successCount).toBe(2)
        expect(message.stats?.failedCount).toBe(1)
        expect(message.stats?.totalRequested).toBe(3)
      })
    })

    describe('when using type guard', () => {
      it('should identify metadataReady messages', () => {
        const message = {
          type: 'metadataReady',
          surfaceId: 'video-player-1',
          contentId: 'rec-abc-123',
          state: 'ready',
          metadata: {},
          processingTime: 1000,
          completedAt: '2026-02-10T12:00:00Z',
        }

        expect(isMetadataReadyMessage(message)).toBe(true)
      })

      it('should reject other message types', () => {
        const message = {
          type: 'requestMetadata',
          surfaceId: 'video-player-1',
          contentId: 'rec-abc-123',
          metadataTypes: ['transcript'],
        }

        expect(isMetadataReadyMessage(message)).toBe(false)
      })

      it('should reject messages without required fields', () => {
        const invalidMessages = [
          { type: 'metadataReady', surfaceId: 'test' },
          { type: 'metadataReady', contentId: 'test' },
          { type: 'metadataReady', state: 'ready' },
          { type: 'metadataReady', metadata: {} },
        ]

        invalidMessages.forEach((msg) => {
          expect(isMetadataReadyMessage(msg)).toBe(false)
        })
      })
    })
  })

  describe('MetadataProgressMessage', () => {
    describe('when creating a metadata progress message', () => {
      it('should have all required properties', () => {
        const message: MetadataProgressMessage = {
          type: 'metadataProgress',
          surfaceId: 'video-player-1',
          contentId: 'rec-abc-123',
          progress: 45,
        }

        expect(message.type).toBe('metadataProgress')
        expect(message.surfaceId).toBe('video-player-1')
        expect(message.contentId).toBe('rec-abc-123')
        expect(message.progress).toBe(45)
      })

      it('should support progress from 0 to 100', () => {
        const progressValues = [0, 25, 50, 75, 100]

        progressValues.forEach((progress) => {
          const message: MetadataProgressMessage = {
            type: 'metadataProgress',
            surfaceId: 'video-player-1',
            contentId: 'rec-abc-123',
            progress,
          }

          expect(message.progress).toBe(progress)
        })
      })

      it('should support current type indicator', () => {
        const message: MetadataProgressMessage = {
          type: 'metadataProgress',
          surfaceId: 'video-player-1',
          contentId: 'rec-abc-123',
          progress: 30,
          currentType: 'transcript',
        }

        expect(message.currentType).toBe('transcript')
      })

      it('should support completed types array', () => {
        const message: MetadataProgressMessage = {
          type: 'metadataProgress',
          surfaceId: 'video-player-1',
          contentId: 'rec-abc-123',
          progress: 60,
          currentType: 'highlights',
          completedTypes: ['transcript', 'summary'],
        }

        expect(message.completedTypes).toHaveLength(2)
        expect(message.completedTypes).toContain('transcript')
        expect(message.completedTypes).toContain('summary')
      })
    })

    describe('when using type guard', () => {
      it('should identify metadataProgress messages', () => {
        const message = {
          type: 'metadataProgress',
          surfaceId: 'video-player-1',
          contentId: 'rec-abc-123',
          progress: 50,
        }

        expect(isMetadataProgressMessage(message)).toBe(true)
      })

      it('should reject other message types', () => {
        const message = {
          type: 'metadataReady',
          surfaceId: 'video-player-1',
          contentId: 'rec-abc-123',
          state: 'ready',
          metadata: {},
          processingTime: 1000,
          completedAt: '2026-02-10T12:00:00Z',
        }

        expect(isMetadataProgressMessage(message)).toBe(false)
      })
    })
  })

  describe('Utility Functions', () => {
    describe('isValidMetadataType', () => {
      it('should validate correct metadata types', () => {
        const validTypes = ['transcript', 'summary', 'topics', 'highlights', 'chapters', 'sentiment']

        validTypes.forEach((type) => {
          expect(isValidMetadataType(type)).toBe(true)
        })
      })

      it('should reject invalid metadata types', () => {
        const invalidTypes = ['invalid', 'unknown', 'test', '']

        invalidTypes.forEach((type) => {
          expect(isValidMetadataType(type)).toBe(false)
        })
      })
    })

    describe('filterValidMetadataTypes', () => {
      it('should filter out invalid types', () => {
        const input = ['transcript', 'invalid', 'summary', 'unknown', 'topics']
        const result = filterValidMetadataTypes(input)

        expect(result).toHaveLength(3)
        expect(result).toEqual(['transcript', 'summary', 'topics'])
      })

      it('should return empty array for all invalid types', () => {
        const input = ['invalid', 'unknown', 'test']
        const result = filterValidMetadataTypes(input)

        expect(result).toHaveLength(0)
      })

      it('should return all types if all are valid', () => {
        const input = ['transcript', 'summary', 'topics']
        const result = filterValidMetadataTypes(input)

        expect(result).toHaveLength(3)
        expect(result).toEqual(input)
      })
    })

    describe('hasAllMetadataTypes', () => {
      it('should return true when all requested types are present', () => {
        const requested: MetadataType[] = ['transcript', 'summary']
        const response: MetadataReadyMessage = {
          type: 'metadataReady',
          surfaceId: 'test',
          contentId: 'test',
          state: 'ready',
          metadata: {
            transcript: {
              segments: [],
              language: 'en',
              confidence: 0.95,
              duration: 100,
              wordCount: 200,
              generatedAt: '2026-02-10T12:00:00Z',
            },
            summary: {
              short: 'Brief',
              long: 'Long',
              bulletPoints: [],
              keyTakeaways: [],
              generatedAt: '2026-02-10T12:00:00Z',
            },
          },
          processingTime: 1000,
          completedAt: '2026-02-10T12:00:00Z',
        }

        expect(hasAllMetadataTypes(requested, response)).toBe(true)
      })

      it('should return false when some types are missing', () => {
        const requested: MetadataType[] = ['transcript', 'summary', 'topics']
        const response: MetadataReadyMessage = {
          type: 'metadataReady',
          surfaceId: 'test',
          contentId: 'test',
          state: 'ready',
          metadata: {
            transcript: {
              segments: [],
              language: 'en',
              confidence: 0.95,
              duration: 100,
              wordCount: 200,
              generatedAt: '2026-02-10T12:00:00Z',
            },
          },
          processingTime: 1000,
          completedAt: '2026-02-10T12:00:00Z',
        }

        expect(hasAllMetadataTypes(requested, response)).toBe(false)
      })
    })

    describe('getMissingMetadataTypes', () => {
      it('should return empty array when all types are present', () => {
        const requested: MetadataType[] = ['transcript', 'summary']
        const response: MetadataReadyMessage = {
          type: 'metadataReady',
          surfaceId: 'test',
          contentId: 'test',
          state: 'ready',
          metadata: {
            transcript: {
              segments: [],
              language: 'en',
              confidence: 0.95,
              duration: 100,
              wordCount: 200,
              generatedAt: '2026-02-10T12:00:00Z',
            },
            summary: {
              short: 'Brief',
              long: 'Long',
              bulletPoints: [],
              keyTakeaways: [],
              generatedAt: '2026-02-10T12:00:00Z',
            },
          },
          processingTime: 1000,
          completedAt: '2026-02-10T12:00:00Z',
        }

        expect(getMissingMetadataTypes(requested, response)).toHaveLength(0)
      })

      it('should return missing types', () => {
        const requested: MetadataType[] = ['transcript', 'summary', 'topics', 'highlights']
        const response: MetadataReadyMessage = {
          type: 'metadataReady',
          surfaceId: 'test',
          contentId: 'test',
          state: 'ready',
          metadata: {
            transcript: {
              segments: [],
              language: 'en',
              confidence: 0.95,
              duration: 100,
              wordCount: 200,
              generatedAt: '2026-02-10T12:00:00Z',
            },
            summary: {
              short: 'Brief',
              long: 'Long',
              bulletPoints: [],
              keyTakeaways: [],
              generatedAt: '2026-02-10T12:00:00Z',
            },
          },
          processingTime: 1000,
          completedAt: '2026-02-10T12:00:00Z',
        }

        const missing = getMissingMetadataTypes(requested, response)
        expect(missing).toHaveLength(2)
        expect(missing).toContain('topics')
        expect(missing).toContain('highlights')
      })
    })

    describe('isMetadataMessage', () => {
      it('should identify request messages', () => {
        const message = {
          type: 'requestMetadata',
          surfaceId: 'test',
          contentId: 'test',
          metadataTypes: ['transcript'],
        }

        expect(isMetadataMessage(message)).toBe(true)
      })

      it('should identify ready messages', () => {
        const message = {
          type: 'metadataReady',
          surfaceId: 'test',
          contentId: 'test',
          state: 'ready',
          metadata: {},
          processingTime: 1000,
          completedAt: '2026-02-10T12:00:00Z',
        }

        expect(isMetadataMessage(message)).toBe(true)
      })

      it('should identify progress messages', () => {
        const message = {
          type: 'metadataProgress',
          surfaceId: 'test',
          contentId: 'test',
          progress: 50,
        }

        expect(isMetadataMessage(message)).toBe(true)
      })

      it('should reject non-metadata messages', () => {
        const message = {
          type: 'createSurface',
          surfaceId: 'test',
          components: [],
        }

        expect(isMetadataMessage(message)).toBe(false)
      })
    })
  })
})
