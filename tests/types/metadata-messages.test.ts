/**
 * Metadata Message Types Tests
 * Tests for Issue #29: Define metadata message types (Epic 2)
 *
 * Test coverage requirements:
 * - RequestMetadataMessage type validation
 * - VideoMetadataReadyMessage type validation
 * - Type guards for both message types
 * - Real-world usage scenarios
 * - >= 80% code coverage
 */

import { describe, it, expect } from 'vitest'
import type {
  RequestMetadataMessage,
  VideoMetadataReadyMessage,
  VideoMetadata,
  Transcript,
  TranscriptWord,
  Speaker,
  SentimentAnalysis,
  Highlight,
  Chapter,
} from '../../src/types/ai-intelligence-protocol.js'
import {
  isRequestMetadataMessage,
  isVideoMetadataReadyMessage,
} from '../../src/types/ai-intelligence-protocol.js'

describe('Metadata Message Types (Issue #29)', () => {
  describe('RequestMetadataMessage', () => {
    describe('when creating a request metadata message', () => {
      it('should have all required properties', () => {
        const message: RequestMetadataMessage = {
          type: 'requestMetadata',
          surfaceId: 'metadata-surface-1',
          videoId: 'vid-123',
        }

        expect(message.type).toBe('requestMetadata')
        expect(message.surfaceId).toBe('metadata-surface-1')
        expect(message.videoId).toBe('vid-123')
      })

      it('should support optional features array', () => {
        const message: RequestMetadataMessage = {
          type: 'requestMetadata',
          surfaceId: 'metadata-surface-1',
          videoId: 'vid-123',
          features: ['transcript', 'summary'],
        }

        expect(message.features).toHaveLength(2)
        expect(message.features).toContain('transcript')
        expect(message.features).toContain('summary')
      })

      it('should support transcript feature request', () => {
        const message: RequestMetadataMessage = {
          type: 'requestMetadata',
          surfaceId: 'metadata-surface-1',
          videoId: 'vid-123',
          features: ['transcript'],
        }

        expect(message.features).toContain('transcript')
      })

      it('should support summary feature request', () => {
        const message: RequestMetadataMessage = {
          type: 'requestMetadata',
          surfaceId: 'metadata-surface-1',
          videoId: 'vid-123',
          features: ['summary'],
        }

        expect(message.features).toContain('summary')
      })

      it('should support topics feature request', () => {
        const message: RequestMetadataMessage = {
          type: 'requestMetadata',
          surfaceId: 'metadata-surface-1',
          videoId: 'vid-123',
          features: ['topics'],
        }

        expect(message.features).toContain('topics')
      })

      it('should support highlights feature request', () => {
        const message: RequestMetadataMessage = {
          type: 'requestMetadata',
          surfaceId: 'metadata-surface-1',
          videoId: 'vid-123',
          features: ['highlights'],
        }

        expect(message.features).toContain('highlights')
      })

      it('should support chapters feature request', () => {
        const message: RequestMetadataMessage = {
          type: 'requestMetadata',
          surfaceId: 'metadata-surface-1',
          videoId: 'vid-123',
          features: ['chapters'],
        }

        expect(message.features).toContain('chapters')
      })

      it('should support sentiment feature request', () => {
        const message: RequestMetadataMessage = {
          type: 'requestMetadata',
          surfaceId: 'metadata-surface-1',
          videoId: 'vid-123',
          features: ['sentiment'],
        }

        expect(message.features).toContain('sentiment')
      })

      it('should support multiple features', () => {
        const message: RequestMetadataMessage = {
          type: 'requestMetadata',
          surfaceId: 'metadata-surface-1',
          videoId: 'vid-123',
          features: ['transcript', 'summary', 'topics', 'highlights', 'chapters', 'sentiment'],
        }

        expect(message.features).toHaveLength(6)
        expect(message.features).toContain('transcript')
        expect(message.features).toContain('summary')
        expect(message.features).toContain('topics')
        expect(message.features).toContain('highlights')
        expect(message.features).toContain('chapters')
        expect(message.features).toContain('sentiment')
      })

      it('should support optional message id', () => {
        const message: RequestMetadataMessage = {
          type: 'requestMetadata',
          surfaceId: 'metadata-surface-1',
          videoId: 'vid-123',
          id: 'msg-001',
        }

        expect(message.id).toBe('msg-001')
      })

      it('should support optional timestamp', () => {
        const timestamp = Date.now()
        const message: RequestMetadataMessage = {
          type: 'requestMetadata',
          surfaceId: 'metadata-surface-1',
          videoId: 'vid-123',
          timestamp,
        }

        expect(message.timestamp).toBe(timestamp)
      })

      it('should allow omitting features to request all', () => {
        const message: RequestMetadataMessage = {
          type: 'requestMetadata',
          surfaceId: 'metadata-surface-1',
          videoId: 'vid-123',
        }

        expect(message.features).toBeUndefined()
      })
    })

    describe('when using type guard', () => {
      it('should identify requestMetadata messages', () => {
        const message = {
          type: 'requestMetadata',
          surfaceId: 'metadata-surface-1',
          videoId: 'vid-123',
        }

        expect(isRequestMetadataMessage(message)).toBe(true)
      })

      it('should reject other message types', () => {
        const message = {
          type: 'videoMetadataReady',
          surfaceId: 'metadata-surface-1',
          videoId: 'vid-123',
          metadata: {},
        }

        expect(isRequestMetadataMessage(message)).toBe(false)
      })

      it('should reject non-video messages', () => {
        const message = {
          type: 'createSurface',
          surfaceId: 'surface-1',
          components: [],
        }

        expect(isRequestMetadataMessage(message)).toBe(false)
      })

      it('should reject null', () => {
        expect(isRequestMetadataMessage(null)).toBe(false)
      })

      it('should reject undefined', () => {
        expect(isRequestMetadataMessage(undefined)).toBe(false)
      })

      it('should reject primitives', () => {
        expect(isRequestMetadataMessage('test')).toBe(false)
        expect(isRequestMetadataMessage(123)).toBe(false)
        expect(isRequestMetadataMessage(true)).toBe(false)
      })
    })
  })

  describe('VideoMetadataReadyMessage', () => {
    describe('when creating a metadata ready message', () => {
      it('should have all required properties', () => {
        const message: VideoMetadataReadyMessage = {
          type: 'videoMetadataReady',
          surfaceId: 'metadata-surface-1',
          videoId: 'vid-123',
          metadata: {},
        }

        expect(message.type).toBe('videoMetadataReady')
        expect(message.surfaceId).toBe('metadata-surface-1')
        expect(message.videoId).toBe('vid-123')
        expect(message.metadata).toBeDefined()
      })

      it('should support transcript metadata', () => {
        const transcript: Transcript = {
          text: 'This is the full transcript text.',
          words: [
            { text: 'This', start: 0, end: 0.5, confidence: 0.99 },
            { text: 'is', start: 0.5, end: 0.7, confidence: 0.98 },
          ],
        }

        const message: VideoMetadataReadyMessage = {
          type: 'videoMetadataReady',
          surfaceId: 'metadata-surface-1',
          videoId: 'vid-123',
          metadata: {
            transcript,
          },
        }

        expect(message.metadata.transcript).toBeDefined()
        expect(message.metadata.transcript?.text).toBe('This is the full transcript text.')
        expect(message.metadata.transcript?.words).toHaveLength(2)
      })

      it('should support transcript with speakers', () => {
        const transcript: Transcript = {
          text: 'Full transcript',
          words: [
            { text: 'Full', start: 0, end: 0.5 },
            { text: 'transcript', start: 0.5, end: 1.2 },
          ],
          speakers: [
            {
              id: 'speaker-1',
              name: 'John Doe',
              segments: [
                { start: 0, end: 5 },
                { start: 10, end: 15 },
              ],
            },
          ],
        }

        const message: VideoMetadataReadyMessage = {
          type: 'videoMetadataReady',
          surfaceId: 'metadata-surface-1',
          videoId: 'vid-123',
          metadata: {
            transcript,
          },
        }

        expect(message.metadata.transcript?.speakers).toHaveLength(1)
        expect(message.metadata.transcript?.speakers?.[0].name).toBe('John Doe')
      })

      it('should support summary metadata', () => {
        const message: VideoMetadataReadyMessage = {
          type: 'videoMetadataReady',
          surfaceId: 'metadata-surface-1',
          videoId: 'vid-123',
          metadata: {
            summary: 'This video discusses product features and pricing.',
          },
        }

        expect(message.metadata.summary).toBe('This video discusses product features and pricing.')
      })

      it('should support topics metadata', () => {
        const message: VideoMetadataReadyMessage = {
          type: 'videoMetadataReady',
          surfaceId: 'metadata-surface-1',
          videoId: 'vid-123',
          metadata: {
            topics: ['product', 'pricing', 'features'],
          },
        }

        expect(message.metadata.topics).toHaveLength(3)
        expect(message.metadata.topics).toContain('product')
        expect(message.metadata.topics).toContain('pricing')
      })

      it('should support tags metadata', () => {
        const message: VideoMetadataReadyMessage = {
          type: 'videoMetadataReady',
          surfaceId: 'metadata-surface-1',
          videoId: 'vid-123',
          metadata: {
            tags: ['tutorial', 'demo', 'beginner'],
          },
        }

        expect(message.metadata.tags).toHaveLength(3)
        expect(message.metadata.tags).toContain('tutorial')
      })

      it('should support sentiment analysis', () => {
        const sentiment: SentimentAnalysis = {
          overall: 'positive',
          score: 0.75,
          timeline: [
            { timestamp: 0, sentiment: 0.6 },
            { timestamp: 30, sentiment: 0.8 },
            { timestamp: 60, sentiment: 0.9 },
          ],
        }

        const message: VideoMetadataReadyMessage = {
          type: 'videoMetadataReady',
          surfaceId: 'metadata-surface-1',
          videoId: 'vid-123',
          metadata: {
            sentiment,
          },
        }

        expect(message.metadata.sentiment?.overall).toBe('positive')
        expect(message.metadata.sentiment?.score).toBe(0.75)
        expect(message.metadata.sentiment?.timeline).toHaveLength(3)
      })

      it('should support negative sentiment', () => {
        const sentiment: SentimentAnalysis = {
          overall: 'negative',
          score: -0.5,
          timeline: [],
        }

        const message: VideoMetadataReadyMessage = {
          type: 'videoMetadataReady',
          surfaceId: 'metadata-surface-1',
          videoId: 'vid-123',
          metadata: {
            sentiment,
          },
        }

        expect(message.metadata.sentiment?.overall).toBe('negative')
        expect(message.metadata.sentiment?.score).toBe(-0.5)
      })

      it('should support neutral sentiment', () => {
        const sentiment: SentimentAnalysis = {
          overall: 'neutral',
          score: 0.0,
          timeline: [],
        }

        const message: VideoMetadataReadyMessage = {
          type: 'videoMetadataReady',
          surfaceId: 'metadata-surface-1',
          videoId: 'vid-123',
          metadata: {
            sentiment,
          },
        }

        expect(message.metadata.sentiment?.overall).toBe('neutral')
        expect(message.metadata.sentiment?.score).toBe(0.0)
      })

      it('should support highlights metadata', () => {
        const highlights: Highlight[] = [
          {
            timestamp: 45,
            duration: 10,
            reason: 'Key product feature demonstrated',
            confidence: 0.92,
            thumbnailUrl: 'https://example.com/thumb1.jpg',
          },
          {
            timestamp: 120,
            duration: 15,
            reason: 'Important decision point',
            confidence: 0.88,
          },
        ]

        const message: VideoMetadataReadyMessage = {
          type: 'videoMetadataReady',
          surfaceId: 'metadata-surface-1',
          videoId: 'vid-123',
          metadata: {
            highlights,
          },
        }

        expect(message.metadata.highlights).toHaveLength(2)
        expect(message.metadata.highlights?.[0].timestamp).toBe(45)
        expect(message.metadata.highlights?.[0].confidence).toBe(0.92)
      })

      it('should support chapters metadata', () => {
        const chapters: Chapter[] = [
          {
            start: 0,
            end: 120,
            title: 'Introduction',
            summary: 'Overview of the product',
          },
          {
            start: 120,
            end: 300,
            title: 'Features',
            summary: 'Detailed feature walkthrough',
          },
        ]

        const message: VideoMetadataReadyMessage = {
          type: 'videoMetadataReady',
          surfaceId: 'metadata-surface-1',
          videoId: 'vid-123',
          metadata: {
            chapters,
          },
        }

        expect(message.metadata.chapters).toHaveLength(2)
        expect(message.metadata.chapters?.[0].title).toBe('Introduction')
        expect(message.metadata.chapters?.[1].start).toBe(120)
      })

      it('should support partial metadata delivery', () => {
        const message: VideoMetadataReadyMessage = {
          type: 'videoMetadataReady',
          surfaceId: 'metadata-surface-1',
          videoId: 'vid-123',
          partial: true,
          metadata: {
            transcript: {
              text: 'Partial transcript...',
              words: [],
            },
          },
        }

        expect(message.partial).toBe(true)
        expect(message.metadata.transcript).toBeDefined()
      })

      it('should support complete metadata delivery', () => {
        const message: VideoMetadataReadyMessage = {
          type: 'videoMetadataReady',
          surfaceId: 'metadata-surface-1',
          videoId: 'vid-123',
          partial: false,
          metadata: {
            transcript: {
              text: 'Complete transcript',
              words: [],
            },
            summary: 'Complete summary',
            topics: ['topic1', 'topic2'],
          },
        }

        expect(message.partial).toBe(false)
        expect(message.metadata.transcript).toBeDefined()
        expect(message.metadata.summary).toBeDefined()
        expect(message.metadata.topics).toBeDefined()
      })

      it('should support all metadata fields together', () => {
        const metadata: VideoMetadata = {
          transcript: {
            text: 'Full transcript text',
            words: [
              { text: 'Full', start: 0, end: 0.5, confidence: 0.99 },
            ],
            speakers: [
              {
                id: 'speaker-1',
                name: 'John',
                segments: [{ start: 0, end: 10 }],
              },
            ],
          },
          summary: 'Video summary',
          topics: ['topic1', 'topic2'],
          tags: ['tag1', 'tag2'],
          sentiment: {
            overall: 'positive',
            score: 0.8,
            timeline: [{ timestamp: 0, sentiment: 0.8 }],
          },
          highlights: [
            {
              timestamp: 30,
              duration: 5,
              reason: 'Important moment',
              confidence: 0.9,
            },
          ],
          chapters: [
            {
              start: 0,
              end: 60,
              title: 'Chapter 1',
              summary: 'First chapter',
            },
          ],
        }

        const message: VideoMetadataReadyMessage = {
          type: 'videoMetadataReady',
          surfaceId: 'metadata-surface-1',
          videoId: 'vid-123',
          metadata,
        }

        expect(message.metadata.transcript).toBeDefined()
        expect(message.metadata.summary).toBeDefined()
        expect(message.metadata.topics).toBeDefined()
        expect(message.metadata.tags).toBeDefined()
        expect(message.metadata.sentiment).toBeDefined()
        expect(message.metadata.highlights).toBeDefined()
        expect(message.metadata.chapters).toBeDefined()
      })

      it('should support optional message id', () => {
        const message: VideoMetadataReadyMessage = {
          type: 'videoMetadataReady',
          surfaceId: 'metadata-surface-1',
          videoId: 'vid-123',
          metadata: {},
          id: 'msg-002',
        }

        expect(message.id).toBe('msg-002')
      })

      it('should support optional timestamp', () => {
        const timestamp = Date.now()
        const message: VideoMetadataReadyMessage = {
          type: 'videoMetadataReady',
          surfaceId: 'metadata-surface-1',
          videoId: 'vid-123',
          metadata: {},
          timestamp,
        }

        expect(message.timestamp).toBe(timestamp)
      })
    })

    describe('when using type guard', () => {
      it('should identify videoMetadataReady messages', () => {
        const message = {
          type: 'videoMetadataReady',
          surfaceId: 'metadata-surface-1',
          videoId: 'vid-123',
          metadata: {},
        }

        expect(isVideoMetadataReadyMessage(message)).toBe(true)
      })

      it('should reject other message types', () => {
        const message = {
          type: 'requestMetadata',
          surfaceId: 'metadata-surface-1',
          videoId: 'vid-123',
        }

        expect(isVideoMetadataReadyMessage(message)).toBe(false)
      })

      it('should reject non-video messages', () => {
        const message = {
          type: 'createSurface',
          surfaceId: 'surface-1',
          components: [],
        }

        expect(isVideoMetadataReadyMessage(message)).toBe(false)
      })

      it('should reject null', () => {
        expect(isVideoMetadataReadyMessage(null)).toBe(false)
      })

      it('should reject undefined', () => {
        expect(isVideoMetadataReadyMessage(undefined)).toBe(false)
      })

      it('should reject primitives', () => {
        expect(isVideoMetadataReadyMessage('test')).toBe(false)
        expect(isVideoMetadataReadyMessage(123)).toBe(false)
        expect(isVideoMetadataReadyMessage(true)).toBe(false)
      })
    })
  })

  describe('Real-world Metadata Scenarios', () => {
    describe('complete metadata generation flow', () => {
      it('should handle full metadata lifecycle', () => {
        // Agent requests all metadata
        const requestMessage: RequestMetadataMessage = {
          type: 'requestMetadata',
          surfaceId: 'video-analysis',
          videoId: 'vid-webinar-001',
          id: 'msg-req-001',
          timestamp: Date.now(),
        }

        expect(isRequestMetadataMessage(requestMessage)).toBe(true)
        expect(requestMessage.features).toBeUndefined() // Request all features

        // Renderer delivers complete metadata
        const readyMessage: VideoMetadataReadyMessage = {
          type: 'videoMetadataReady',
          surfaceId: 'video-analysis',
          videoId: 'vid-webinar-001',
          partial: false,
          metadata: {
            transcript: {
              text: 'Welcome to our Q1 webinar. Today we will discuss...',
              words: [
                { text: 'Welcome', start: 0, end: 0.5, confidence: 0.99 },
                { text: 'to', start: 0.5, end: 0.6, confidence: 0.98 },
              ],
              speakers: [
                {
                  id: 'speaker-1',
                  name: 'Sarah Johnson',
                  segments: [{ start: 0, end: 300 }],
                },
              ],
            },
            summary: 'Q1 webinar covering company results, product updates, and Q&A.',
            topics: ['quarterly results', 'product updates', 'Q&A'],
            tags: ['webinar', 'Q1', 'company'],
            sentiment: {
              overall: 'positive',
              score: 0.72,
              timeline: [
                { timestamp: 0, sentiment: 0.7 },
                { timestamp: 600, sentiment: 0.75 },
              ],
            },
            highlights: [
              {
                timestamp: 120,
                duration: 30,
                reason: 'Q1 results announcement',
                confidence: 0.95,
              },
              {
                timestamp: 450,
                duration: 45,
                reason: 'New product demo',
                confidence: 0.88,
              },
            ],
            chapters: [
              { start: 0, end: 300, title: 'Introduction', summary: 'Welcome and agenda' },
              { start: 300, end: 900, title: 'Q1 Results', summary: 'Financial performance' },
              { start: 900, end: 1800, title: 'Q&A', summary: 'Audience questions' },
            ],
          },
          id: 'msg-ready-001',
          timestamp: Date.now(),
        }

        expect(isVideoMetadataReadyMessage(readyMessage)).toBe(true)
        expect(readyMessage.metadata.transcript).toBeDefined()
        expect(readyMessage.metadata.summary).toBeDefined()
        expect(readyMessage.metadata.topics).toHaveLength(3)
        expect(readyMessage.metadata.highlights).toHaveLength(2)
        expect(readyMessage.metadata.chapters).toHaveLength(3)
      })
    })

    describe('partial metadata delivery', () => {
      it('should handle progressive metadata generation', () => {
        // Request specific features
        const requestMessage: RequestMetadataMessage = {
          type: 'requestMetadata',
          surfaceId: 'video-analysis',
          videoId: 'vid-tutorial-001',
          features: ['transcript', 'summary', 'highlights'],
        }

        expect(requestMessage.features).toHaveLength(3)

        // First partial delivery - transcript only
        const partialMessage1: VideoMetadataReadyMessage = {
          type: 'videoMetadataReady',
          surfaceId: 'video-analysis',
          videoId: 'vid-tutorial-001',
          partial: true,
          metadata: {
            transcript: {
              text: 'In this tutorial...',
              words: [{ text: 'In', start: 0, end: 0.2 }],
            },
          },
        }

        expect(partialMessage1.partial).toBe(true)
        expect(partialMessage1.metadata.transcript).toBeDefined()
        expect(partialMessage1.metadata.summary).toBeUndefined()

        // Second partial delivery - summary added
        const partialMessage2: VideoMetadataReadyMessage = {
          type: 'videoMetadataReady',
          surfaceId: 'video-analysis',
          videoId: 'vid-tutorial-001',
          partial: true,
          metadata: {
            summary: 'Tutorial on advanced features',
          },
        }

        expect(partialMessage2.partial).toBe(true)
        expect(partialMessage2.metadata.summary).toBeDefined()

        // Final delivery - highlights added
        const finalMessage: VideoMetadataReadyMessage = {
          type: 'videoMetadataReady',
          surfaceId: 'video-analysis',
          videoId: 'vid-tutorial-001',
          partial: false,
          metadata: {
            highlights: [
              { timestamp: 60, duration: 10, reason: 'Key concept', confidence: 0.9 },
            ],
          },
        }

        expect(finalMessage.partial).toBe(false)
        expect(finalMessage.metadata.highlights).toHaveLength(1)
      })
    })

    describe('feature-specific requests', () => {
      it('should handle transcript-only request', () => {
        const requestMessage: RequestMetadataMessage = {
          type: 'requestMetadata',
          surfaceId: 'video-analysis',
          videoId: 'vid-001',
          features: ['transcript'],
        }

        const readyMessage: VideoMetadataReadyMessage = {
          type: 'videoMetadataReady',
          surfaceId: 'video-analysis',
          videoId: 'vid-001',
          metadata: {
            transcript: {
              text: 'Transcript only',
              words: [],
            },
          },
        }

        expect(requestMessage.features).toEqual(['transcript'])
        expect(readyMessage.metadata.transcript).toBeDefined()
        expect(readyMessage.metadata.summary).toBeUndefined()
      })

      it('should handle highlights-only request', () => {
        const requestMessage: RequestMetadataMessage = {
          type: 'requestMetadata',
          surfaceId: 'video-analysis',
          videoId: 'vid-001',
          features: ['highlights'],
        }

        const readyMessage: VideoMetadataReadyMessage = {
          type: 'videoMetadataReady',
          surfaceId: 'video-analysis',
          videoId: 'vid-001',
          metadata: {
            highlights: [
              { timestamp: 30, duration: 5, reason: 'Peak moment', confidence: 0.95 },
            ],
          },
        }

        expect(requestMessage.features).toEqual(['highlights'])
        expect(readyMessage.metadata.highlights).toHaveLength(1)
      })
    })

    describe('error and edge cases', () => {
      it('should handle empty metadata', () => {
        const message: VideoMetadataReadyMessage = {
          type: 'videoMetadataReady',
          surfaceId: 'video-analysis',
          videoId: 'vid-001',
          metadata: {},
        }

        expect(message.metadata).toBeDefined()
        expect(Object.keys(message.metadata)).toHaveLength(0)
      })

      it('should handle metadata with empty arrays', () => {
        const message: VideoMetadataReadyMessage = {
          type: 'videoMetadataReady',
          surfaceId: 'video-analysis',
          videoId: 'vid-001',
          metadata: {
            topics: [],
            tags: [],
            highlights: [],
            chapters: [],
          },
        }

        expect(message.metadata.topics).toHaveLength(0)
        expect(message.metadata.tags).toHaveLength(0)
        expect(message.metadata.highlights).toHaveLength(0)
        expect(message.metadata.chapters).toHaveLength(0)
      })

      it('should handle very long transcripts', () => {
        const longTranscript = 'A'.repeat(10000)
        const message: VideoMetadataReadyMessage = {
          type: 'videoMetadataReady',
          surfaceId: 'video-analysis',
          videoId: 'vid-001',
          metadata: {
            transcript: {
              text: longTranscript,
              words: [],
            },
          },
        }

        expect(message.metadata.transcript?.text.length).toBe(10000)
      })

      it('should handle many highlights', () => {
        const highlights: Highlight[] = Array.from({ length: 50 }, (_, i) => ({
          timestamp: i * 10,
          duration: 5,
          reason: `Highlight ${i}`,
          confidence: 0.8 + Math.random() * 0.2,
        }))

        const message: VideoMetadataReadyMessage = {
          type: 'videoMetadataReady',
          surfaceId: 'video-analysis',
          videoId: 'vid-001',
          metadata: {
            highlights,
          },
        }

        expect(message.metadata.highlights).toHaveLength(50)
      })

      it('should handle sentiment score boundaries', () => {
        const negativeMessage: VideoMetadataReadyMessage = {
          type: 'videoMetadataReady',
          surfaceId: 'video-analysis',
          videoId: 'vid-001',
          metadata: {
            sentiment: {
              overall: 'negative',
              score: -1.0,
              timeline: [],
            },
          },
        }

        const positiveMessage: VideoMetadataReadyMessage = {
          type: 'videoMetadataReady',
          surfaceId: 'video-analysis',
          videoId: 'vid-002',
          metadata: {
            sentiment: {
              overall: 'positive',
              score: 1.0,
              timeline: [],
            },
          },
        }

        expect(negativeMessage.metadata.sentiment?.score).toBe(-1.0)
        expect(positiveMessage.metadata.sentiment?.score).toBe(1.0)
      })
    })
  })
})
