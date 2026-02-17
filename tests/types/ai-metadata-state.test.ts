/**
 * AI Metadata State Types Tests
 * Tests for Issue #28: AI metadata state type definitions
 *
 * Comprehensive BDD-style tests for all AI-generated metadata types:
 * - TranscriptMetadata
 * - SummaryMetadata
 * - TopicMetadata
 * - HighlightMetadata
 * - ChapterMetadata
 * - SentimentMetadata
 * - AIMetadataState
 */

import { describe, it, expect } from 'vitest'
import type {
  TranscriptSegment,
  TranscriptMetadata,
  SummaryType,
  SummaryMetadata,
  TopicCategory,
  Topic,
  TopicMetadata,
  HighlightType,
  Highlight,
  HighlightMetadata,
  Chapter,
  ChapterMetadata,
  SentimentType,
  SentimentScore,
  SentimentTimestamp,
  EmotionDetection,
  SentimentMetadata,
  AIMetadataProcessingState,
  AIMetadataState,
} from '../../src/types/ai-metadata-state.js'
import {
  isTranscriptMetadata,
  isSummaryMetadata,
  isTopicMetadata,
  isHighlightMetadata,
  isChapterMetadata,
  isSentimentMetadata,
  isAIMetadataState,
} from '../../src/types/ai-metadata-state.js'

describe('AI Metadata State Types', () => {
  // ==============================================
  // TranscriptMetadata Tests
  // ==============================================

  describe('TranscriptMetadata', () => {
    describe('when creating transcript segments', () => {
      it('should have all required properties', () => {
        const segment: TranscriptSegment = {
          startTime: 0,
          endTime: 5.5,
          text: 'Hello world',
          confidence: 0.95,
        }

        expect(segment.startTime).toBe(0)
        expect(segment.endTime).toBe(5.5)
        expect(segment.text).toBe('Hello world')
        expect(segment.confidence).toBe(0.95)
      })

      it('should support optional speaker identification', () => {
        const segment: TranscriptSegment = {
          startTime: 0,
          endTime: 5.5,
          text: 'Hello world',
          speaker: 'speaker-1',
          confidence: 0.95,
        }

        expect(segment.speaker).toBe('speaker-1')
      })

      it('should support confidence scores between 0 and 1', () => {
        const segments: TranscriptSegment[] = [
          { startTime: 0, endTime: 2, text: 'Low confidence', confidence: 0.1 },
          { startTime: 2, endTime: 4, text: 'Medium confidence', confidence: 0.5 },
          { startTime: 4, endTime: 6, text: 'High confidence', confidence: 1.0 },
        ]

        expect(segments[0].confidence).toBe(0.1)
        expect(segments[1].confidence).toBe(0.5)
        expect(segments[2].confidence).toBe(1.0)
      })
    })

    describe('when creating transcript metadata', () => {
      it('should have all required properties', () => {
        const metadata: TranscriptMetadata = {
          segments: [
            { startTime: 0, endTime: 5, text: 'First segment', confidence: 0.95 },
            { startTime: 5, endTime: 10, text: 'Second segment', confidence: 0.92 },
          ],
          language: 'en',
          confidence: 0.935,
          duration: 10,
          wordCount: 4,
          generatedAt: '2026-02-10T10:00:00Z',
        }

        expect(metadata.segments).toHaveLength(2)
        expect(metadata.language).toBe('en')
        expect(metadata.confidence).toBe(0.935)
        expect(metadata.duration).toBe(10)
        expect(metadata.wordCount).toBe(4)
        expect(metadata.generatedAt).toBe('2026-02-10T10:00:00Z')
      })

      it('should support different language codes', () => {
        const languages = ['en', 'es', 'fr', 'de', 'ja', 'zh']

        languages.forEach(lang => {
          const metadata: TranscriptMetadata = {
            segments: [],
            language: lang,
            confidence: 0.9,
            duration: 0,
            wordCount: 0,
            generatedAt: '2026-02-10T10:00:00Z',
          }

          expect(metadata.language).toBe(lang)
        })
      })

      it('should support optional transcription model', () => {
        const metadata: TranscriptMetadata = {
          segments: [],
          language: 'en',
          confidence: 0.95,
          duration: 10,
          wordCount: 50,
          model: 'whisper-large-v3',
          generatedAt: '2026-02-10T10:00:00Z',
        }

        expect(metadata.model).toBe('whisper-large-v3')
      })
    })

    describe('when using type guard', () => {
      it('should identify valid transcript metadata', () => {
        const metadata = {
          segments: [{ startTime: 0, endTime: 5, text: 'Hello', confidence: 0.9 }],
          language: 'en',
          confidence: 0.9,
          duration: 5,
        }

        expect(isTranscriptMetadata(metadata)).toBe(true)
      })

      it('should reject invalid objects', () => {
        expect(isTranscriptMetadata(null)).toBe(false)
        expect(isTranscriptMetadata({})).toBe(false)
        expect(isTranscriptMetadata({ segments: 'not-array' })).toBe(false)
      })
    })
  })

  // ==============================================
  // SummaryMetadata Tests
  // ==============================================

  describe('SummaryMetadata', () => {
    describe('when creating summary metadata', () => {
      it('should have all required properties', () => {
        const metadata: SummaryMetadata = {
          short: 'Brief overview of the content.',
          long: 'This is a comprehensive summary.',
          bulletPoints: ['Point 1', 'Point 2', 'Point 3'],
          keyTakeaways: ['Takeaway 1', 'Takeaway 2'],
          generatedAt: '2026-02-10T10:00:00Z',
        }

        expect(metadata.short).toContain('Brief overview')
        expect(metadata.long).toContain('comprehensive summary')
        expect(metadata.bulletPoints).toHaveLength(3)
        expect(metadata.keyTakeaways).toHaveLength(2)
      })

      it('should support optional abstract summary', () => {
        const metadata: SummaryMetadata = {
          short: 'Brief',
          long: 'Long',
          bulletPoints: ['Point 1'],
          keyTakeaways: ['Takeaway 1'],
          abstract: 'Executive summary',
          generatedAt: '2026-02-10T10:00:00Z',
        }

        expect(metadata.abstract).toBe('Executive summary')
      })

      it('should support optional target audience', () => {
        const metadata: SummaryMetadata = {
          short: 'Technical',
          long: 'Technical explanation',
          bulletPoints: ['Point 1'],
          keyTakeaways: ['Takeaway 1'],
          targetAudience: 'Developers',
          generatedAt: '2026-02-10T10:00:00Z',
        }

        expect(metadata.targetAudience).toBe('Developers')
      })
    })

    describe('when using type guard', () => {
      it('should identify valid summary metadata', () => {
        const metadata = {
          short: 'Short',
          long: 'Long',
          bulletPoints: ['Point 1'],
          keyTakeaways: ['Takeaway 1'],
        }

        expect(isSummaryMetadata(metadata)).toBe(true)
      })

      it('should reject invalid objects', () => {
        expect(isSummaryMetadata(null)).toBe(false)
        expect(isSummaryMetadata({})).toBe(false)
      })
    })
  })

  // ==============================================
  // TopicMetadata Tests
  // ==============================================

  describe('TopicMetadata', () => {
    describe('when creating topics', () => {
      it('should have all required properties', () => {
        const topic: Topic = {
          name: 'Machine Learning',
          confidence: 0.92,
        }

        expect(topic.name).toBe('Machine Learning')
        expect(topic.confidence).toBe(0.92)
      })

      it('should support optional category', () => {
        const topic: Topic = {
          name: 'Test',
          confidence: 0.9,
          category: 'technology',
        }

        expect(topic.category).toBe('technology')
      })

      it('should support optional relevance score', () => {
        const topic: Topic = {
          name: 'AI Ethics',
          confidence: 0.88,
          relevance: 0.95,
        }

        expect(topic.relevance).toBe(0.95)
      })
    })

    describe('when creating topic metadata', () => {
      it('should have all required properties', () => {
        const metadata: TopicMetadata = {
          topics: [
            { name: 'AI', confidence: 0.95 },
            { name: 'ML', confidence: 0.88 },
          ],
          primaryTopic: { name: 'AI', confidence: 0.95 },
          confidence: 0.915,
          generatedAt: '2026-02-10T10:00:00Z',
        }

        expect(metadata.topics).toHaveLength(2)
        expect(metadata.primaryTopic.name).toBe('AI')
        expect(metadata.confidence).toBe(0.915)
      })
    })

    describe('when using type guard', () => {
      it('should identify valid topic metadata', () => {
        const metadata = {
          topics: [{ name: 'Test', confidence: 0.9 }],
          primaryTopic: { name: 'Test', confidence: 0.9 },
          confidence: 0.9,
        }

        expect(isTopicMetadata(metadata)).toBe(true)
      })

      it('should reject invalid objects', () => {
        expect(isTopicMetadata(null)).toBe(false)
        expect(isTopicMetadata({})).toBe(false)
      })
    })
  })

  // ==============================================
  // HighlightMetadata Tests
  // ==============================================

  describe('HighlightMetadata', () => {
    describe('when creating highlights', () => {
      it('should have all required properties', () => {
        const highlight: Highlight = {
          timestamp: 45.5,
          duration: 5.0,
          confidence: 0.92,
          type: 'key-moment',
        }

        expect(highlight.timestamp).toBe(45.5)
        expect(highlight.duration).toBe(5.0)
        expect(highlight.confidence).toBe(0.92)
        expect(highlight.type).toBe('key-moment')
      })

      it('should support all highlight types', () => {
        const types: HighlightType[] = [
          'key-moment',
          'important-quote',
          'visual-peak',
          'action-item',
          'decision-point',
          'question',
          'summary',
        ]

        types.forEach(type => {
          const highlight: Highlight = {
            timestamp: 10,
            duration: 5,
            confidence: 0.9,
            type,
          }

          expect(highlight.type).toBe(type)
        })
      })

      it('should support optional description', () => {
        const highlight: Highlight = {
          timestamp: 30,
          duration: 8,
          confidence: 0.95,
          type: 'key-moment',
          description: 'Critical decision point',
        }

        expect(highlight.description).toBe('Critical decision point')
      })
    })

    describe('when creating highlight metadata', () => {
      it('should have all required properties', () => {
        const metadata: HighlightMetadata = {
          highlights: [
            { timestamp: 10, duration: 5, confidence: 0.9, type: 'key-moment' },
            { timestamp: 45, duration: 8, confidence: 0.95, type: 'important-quote' },
          ],
          count: 2,
          averageConfidence: 0.925,
          generatedAt: '2026-02-10T10:00:00Z',
        }

        expect(metadata.highlights).toHaveLength(2)
        expect(metadata.count).toBe(2)
        expect(metadata.averageConfidence).toBe(0.925)
      })
    })

    describe('when using type guard', () => {
      it('should identify valid highlight metadata', () => {
        const metadata = {
          highlights: [{ timestamp: 10, duration: 5, confidence: 0.9, type: 'key-moment' }],
          count: 1,
          averageConfidence: 0.9,
        }

        expect(isHighlightMetadata(metadata)).toBe(true)
      })

      it('should reject invalid objects', () => {
        expect(isHighlightMetadata(null)).toBe(false)
        expect(isHighlightMetadata({})).toBe(false)
      })
    })
  })

  // ==============================================
  // ChapterMetadata Tests
  // ==============================================

  describe('ChapterMetadata', () => {
    describe('when creating chapters', () => {
      it('should have all required properties', () => {
        const chapter: Chapter = {
          number: 1,
          title: 'Introduction',
          description: 'Overview',
          startTime: 0,
          endTime: 120,
        }

        expect(chapter.number).toBe(1)
        expect(chapter.title).toBe('Introduction')
        expect(chapter.description).toBe('Overview')
        expect(chapter.startTime).toBe(0)
        expect(chapter.endTime).toBe(120)
      })

      it('should support optional thumbnail URL', () => {
        const chapter: Chapter = {
          number: 1,
          title: 'Chapter 1',
          description: 'First',
          startTime: 0,
          endTime: 60,
          thumbnailUrl: 'https://example.com/ch1.jpg',
        }

        expect(chapter.thumbnailUrl).toContain('ch1.jpg')
      })

      it('should support optional keywords', () => {
        const chapter: Chapter = {
          number: 2,
          title: 'Technical',
          description: 'Deep dive',
          startTime: 120,
          endTime: 300,
          keywords: ['API', 'REST', 'GraphQL'],
        }

        expect(chapter.keywords).toHaveLength(3)
      })
    })

    describe('when creating chapter metadata', () => {
      it('should have all required properties', () => {
        const metadata: ChapterMetadata = {
          chapters: [
            { number: 1, title: 'Ch 1', description: 'First', startTime: 0, endTime: 100 },
            { number: 2, title: 'Ch 2', description: 'Second', startTime: 100, endTime: 200 },
          ],
          count: 2,
          averageDuration: 100,
          generatedAt: '2026-02-10T10:00:00Z',
        }

        expect(metadata.chapters).toHaveLength(2)
        expect(metadata.count).toBe(2)
        expect(metadata.averageDuration).toBe(100)
      })
    })

    describe('when using type guard', () => {
      it('should identify valid chapter metadata', () => {
        const metadata = {
          chapters: [
            { number: 1, title: 'Ch 1', description: 'First', startTime: 0, endTime: 100 },
          ],
          count: 1,
          averageDuration: 100,
        }

        expect(isChapterMetadata(metadata)).toBe(true)
      })

      it('should reject invalid objects', () => {
        expect(isChapterMetadata(null)).toBe(false)
        expect(isChapterMetadata({})).toBe(false)
      })
    })
  })

  // ==============================================
  // SentimentMetadata Tests
  // ==============================================

  describe('SentimentMetadata', () => {
    describe('when creating sentiment scores', () => {
      it('should have all required properties', () => {
        const scores: SentimentScore = {
          positive: 0.7,
          negative: 0.1,
          neutral: 0.2,
        }

        expect(scores.positive).toBe(0.7)
        expect(scores.negative).toBe(0.1)
        expect(scores.neutral).toBe(0.2)
      })

      it('should support optional mixed sentiment', () => {
        const scores: SentimentScore = {
          positive: 0.4,
          negative: 0.3,
          neutral: 0.2,
          mixed: 0.1,
        }

        expect(scores.mixed).toBe(0.1)
      })
    })

    describe('when creating emotion detection', () => {
      it('should have all required properties', () => {
        const emotion: EmotionDetection = {
          emotion: 'joy',
          confidence: 0.92,
          timestamp: 45,
        }

        expect(emotion.emotion).toBe('joy')
        expect(emotion.confidence).toBe(0.92)
        expect(emotion.timestamp).toBe(45)
      })
    })

    describe('when creating sentiment metadata', () => {
      it('should have all required properties', () => {
        const metadata: SentimentMetadata = {
          overall: 'positive',
          overallScores: { positive: 0.7, negative: 0.1, neutral: 0.2 },
          confidence: 0.85,
          timeline: [
            {
              timestamp: 10,
              sentiment: 'positive',
              scores: { positive: 0.8, negative: 0.1, neutral: 0.1 },
              confidence: 0.9,
            },
          ],
          generatedAt: '2026-02-10T10:00:00Z',
        }

        expect(metadata.overall).toBe('positive')
        expect(metadata.overallScores.positive).toBe(0.7)
        expect(metadata.confidence).toBe(0.85)
        expect(metadata.timeline).toHaveLength(1)
      })

      it('should support optional emotions', () => {
        const metadata: SentimentMetadata = {
          overall: 'positive',
          overallScores: { positive: 0.7, negative: 0.1, neutral: 0.2 },
          confidence: 0.85,
          timeline: [],
          emotions: [{ emotion: 'joy', confidence: 0.9, timestamp: 10 }],
          generatedAt: '2026-02-10T10:00:00Z',
        }

        expect(metadata.emotions).toHaveLength(1)
      })

      it('should support optional trend', () => {
        const metadata: SentimentMetadata = {
          overall: 'positive',
          overallScores: { positive: 0.7, negative: 0.1, neutral: 0.2 },
          confidence: 0.85,
          timeline: [],
          trend: 'improving',
          generatedAt: '2026-02-10T10:00:00Z',
        }

        expect(metadata.trend).toBe('improving')
      })
    })

    describe('when using type guard', () => {
      it('should identify valid sentiment metadata', () => {
        const metadata = {
          overall: 'positive',
          overallScores: { positive: 0.7, negative: 0.1, neutral: 0.2 },
          confidence: 0.85,
          timeline: [],
        }

        expect(isSentimentMetadata(metadata)).toBe(true)
      })

      it('should reject invalid objects', () => {
        expect(isSentimentMetadata(null)).toBe(false)
        expect(isSentimentMetadata({})).toBe(false)
      })
    })
  })

  // ==============================================
  // AIMetadataState Tests
  // ==============================================

  describe('AIMetadataState', () => {
    describe('when creating AI metadata state', () => {
      it('should have all required properties', () => {
        const state: AIMetadataState = {
          contentId: 'video-123',
          state: 'idle',
          progress: 0,
        }

        expect(state.contentId).toBe('video-123')
        expect(state.state).toBe('idle')
        expect(state.progress).toBe(0)
      })

      it('should support all processing states', () => {
        const states: AIMetadataProcessingState[] = ['idle', 'processing', 'complete', 'error']

        states.forEach(processingState => {
          const state: AIMetadataState = {
            contentId: 'video-123',
            state: processingState,
            progress: 0,
          }

          expect(state.state).toBe(processingState)
        })
      })

      it('should track progress percentage', () => {
        const progressValues = [0, 25, 50, 75, 100]

        progressValues.forEach(progress => {
          const state: AIMetadataState = {
            contentId: 'video-123',
            state: 'processing',
            progress,
          }

          expect(state.progress).toBe(progress)
        })
      })

      it('should support optional transcript', () => {
        const state: AIMetadataState = {
          contentId: 'video-123',
          state: 'complete',
          progress: 100,
          transcript: {
            segments: [{ startTime: 0, endTime: 5, text: 'Hello', confidence: 0.9 }],
            language: 'en',
            confidence: 0.9,
            duration: 5,
            wordCount: 1,
            generatedAt: '2026-02-10T10:00:00Z',
          },
        }

        expect(state.transcript).toBeDefined()
        expect(state.transcript?.language).toBe('en')
      })

      it('should support optional summary', () => {
        const state: AIMetadataState = {
          contentId: 'video-123',
          state: 'complete',
          progress: 100,
          summary: {
            short: 'Brief',
            long: 'Long',
            bulletPoints: ['Point 1'],
            keyTakeaways: ['Takeaway 1'],
            generatedAt: '2026-02-10T10:00:00Z',
          },
        }

        expect(state.summary).toBeDefined()
      })

      it('should support error state with message', () => {
        const state: AIMetadataState = {
          contentId: 'video-123',
          state: 'error',
          progress: 45,
          error: 'Processing timeout',
        }

        expect(state.state).toBe('error')
        expect(state.error).toBe('Processing timeout')
      })

      it('should track processing timestamps', () => {
        const state: AIMetadataState = {
          contentId: 'video-123',
          state: 'complete',
          progress: 100,
          startedAt: '2026-02-10T10:00:00Z',
          completedAt: '2026-02-10T10:05:00Z',
          processingTime: 300000,
        }

        expect(state.startedAt).toBe('2026-02-10T10:00:00Z')
        expect(state.completedAt).toBe('2026-02-10T10:05:00Z')
        expect(state.processingTime).toBe(300000)
      })

      it('should support complete state with all metadata', () => {
        const state: AIMetadataState = {
          contentId: 'video-456',
          state: 'complete',
          progress: 100,
          transcript: {
            segments: [{ startTime: 0, endTime: 10, text: 'Complete', confidence: 0.95 }],
            language: 'en',
            confidence: 0.95,
            duration: 10,
            wordCount: 1,
            generatedAt: '2026-02-10T10:01:00Z',
          },
          summary: {
            short: 'Summary',
            long: 'Long summary',
            bulletPoints: ['Point 1'],
            keyTakeaways: ['Takeaway 1'],
            generatedAt: '2026-02-10T10:02:00Z',
          },
          topics: {
            topics: [{ name: 'Topic', confidence: 0.9 }],
            primaryTopic: { name: 'Topic', confidence: 0.9 },
            confidence: 0.9,
            generatedAt: '2026-02-10T10:03:00Z',
          },
          highlights: {
            highlights: [{ timestamp: 5, duration: 2, confidence: 0.92, type: 'key-moment' }],
            count: 1,
            averageConfidence: 0.92,
            generatedAt: '2026-02-10T10:04:00Z',
          },
          chapters: {
            chapters: [
              { number: 1, title: 'Chapter', description: 'Description', startTime: 0, endTime: 10 },
            ],
            count: 1,
            averageDuration: 10,
            generatedAt: '2026-02-10T10:05:00Z',
          },
          sentiment: {
            overall: 'positive',
            overallScores: { positive: 0.8, negative: 0.1, neutral: 0.1 },
            confidence: 0.88,
            timeline: [],
            generatedAt: '2026-02-10T10:06:00Z',
          },
          startedAt: '2026-02-10T10:00:00Z',
          completedAt: '2026-02-10T10:06:00Z',
          processingTime: 360000,
        }

        expect(state.transcript).toBeDefined()
        expect(state.summary).toBeDefined()
        expect(state.topics).toBeDefined()
        expect(state.highlights).toBeDefined()
        expect(state.chapters).toBeDefined()
        expect(state.sentiment).toBeDefined()
      })
    })

    describe('when using type guard', () => {
      it('should identify valid AI metadata state', () => {
        const state = {
          contentId: 'video-123',
          state: 'idle',
          progress: 0,
        }

        expect(isAIMetadataState(state)).toBe(true)
      })

      it('should reject invalid objects', () => {
        expect(isAIMetadataState(null)).toBe(false)
        expect(isAIMetadataState({})).toBe(false)
        expect(isAIMetadataState({ contentId: 'test' })).toBe(false)
      })
    })
  })
})
