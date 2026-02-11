/**
 * AI Metadata State Type Definitions
 * Issue #28: Define AI-generated video metadata state types
 *
 * This module defines comprehensive TypeScript types for AI-generated metadata
 * including transcripts, summaries, topics, highlights, chapters, and sentiment analysis.
 */

// ============================================================================
// Transcript Metadata
// ============================================================================

/**
 * Transcript segment with timestamp and text
 * Represents a single segment of transcribed speech with timing information
 */
export interface TranscriptSegment {
  /** Start time in seconds */
  startTime: number
  /** End time in seconds */
  endTime: number
  /** Transcribed text for this segment */
  text: string
  /** Speaker identifier (if speaker diarization is available) */
  speaker?: string
  /** Confidence score 0-1 */
  confidence: number
}

/**
 * Complete transcript metadata
 * Contains all transcript segments and metadata about the transcription
 */
export interface TranscriptMetadata {
  /** Array of transcript segments */
  segments: TranscriptSegment[]
  /** Language code (ISO 639-1, e.g., 'en', 'es', 'fr') */
  language: string
  /** Overall transcription confidence score 0-1 */
  confidence: number
  /** Total duration covered by transcript in seconds */
  duration: number
  /** Word count across all segments */
  wordCount: number
  /** Optional model used for transcription (e.g., 'whisper-large-v3') */
  model?: string
  /** ISO 8601 timestamp when transcription was generated */
  generatedAt: string
}

// ============================================================================
// Summary Metadata
// ============================================================================

/**
 * Summary types
 */
export type SummaryType = 'short' | 'long' | 'bullet' | 'abstract'

/**
 * Summary metadata with multiple summary variants
 * Provides different length and format summaries of the content
 */
export interface SummaryMetadata {
  /** Short summary (1-2 sentences, ~50-100 words) */
  short: string
  /** Long summary (multiple paragraphs, ~200-500 words) */
  long: string
  /** Bullet point summary (array of key points) */
  bulletPoints: string[]
  /** Abstract/executive summary (formal, ~100-200 words) */
  abstract?: string
  /** Key takeaways from the content */
  keyTakeaways: string[]
  /** Optional target audience for the content */
  targetAudience?: string
  /** ISO 8601 timestamp when summary was generated */
  generatedAt: string
}

// ============================================================================
// Topic Metadata
// ============================================================================

/**
 * Topic category types
 */
export type TopicCategory =
  | 'technology'
  | 'business'
  | 'education'
  | 'entertainment'
  | 'science'
  | 'health'
  | 'politics'
  | 'sports'
  | 'other'

/**
 * Individual topic with confidence score
 * Represents a detected topic or theme in the content
 */
export interface Topic {
  /** Topic name or label */
  name: string
  /** Confidence score 0-1 */
  confidence: number
  /** Optional topic category */
  category?: TopicCategory
  /** Optional relevance score 0-1 */
  relevance?: number
  /** Optional timestamp ranges where this topic appears */
  timeRanges?: Array<{ startTime: number; endTime: number }>
}

/**
 * Topic metadata with all detected topics
 * Contains comprehensive topic analysis of the content
 */
export interface TopicMetadata {
  /** Array of detected topics, sorted by confidence */
  topics: Topic[]
  /** Primary/main topic of the content */
  primaryTopic: Topic
  /** Optional secondary topics */
  secondaryTopics?: Topic[]
  /** Overall topic detection confidence 0-1 */
  confidence: number
  /** ISO 8601 timestamp when topics were detected */
  generatedAt: string
}

// ============================================================================
// Highlight Metadata
// ============================================================================

/**
 * Highlight type classifications
 */
export type HighlightType =
  | 'key-moment'
  | 'important-quote'
  | 'visual-peak'
  | 'action-item'
  | 'decision-point'
  | 'question'
  | 'summary'

/**
 * Individual highlight with timestamp
 * Represents a significant moment in the content
 */
export interface Highlight {
  /** Timestamp in seconds where highlight occurs */
  timestamp: number
  /** Duration of the highlight in seconds */
  duration: number
  /** Confidence score 0-1 */
  confidence: number
  /** Type of highlight */
  type: HighlightType
  /** Optional description of the highlight */
  description?: string
  /** Optional transcript excerpt for this highlight */
  excerpt?: string
  /** Optional thumbnail URL for visual reference */
  thumbnailUrl?: string
}

/**
 * Highlight metadata with all detected highlights
 * Contains AI-detected significant moments in the content
 */
export interface HighlightMetadata {
  /** Array of highlights, sorted by timestamp */
  highlights: Highlight[]
  /** Total number of highlights detected */
  count: number
  /** Average confidence score across all highlights */
  averageConfidence: number
  /** ISO 8601 timestamp when highlights were detected */
  generatedAt: string
}

// ============================================================================
// Chapter Metadata
// ============================================================================

/**
 * Individual chapter with description
 * Represents a logical section or chapter in the content
 */
export interface Chapter {
  /** Chapter number (1-indexed) */
  number: number
  /** Chapter title */
  title: string
  /** Chapter description or summary */
  description: string
  /** Start time in seconds */
  startTime: number
  /** End time in seconds */
  endTime: number
  /** Optional chapter thumbnail URL */
  thumbnailUrl?: string
  /** Optional keywords for this chapter */
  keywords?: string[]
}

/**
 * Chapter metadata with all chapters
 * Provides structured segmentation of content into logical chapters
 */
export interface ChapterMetadata {
  /** Array of chapters, sorted by start time */
  chapters: Chapter[]
  /** Total number of chapters */
  count: number
  /** Average chapter duration in seconds */
  averageDuration: number
  /** ISO 8601 timestamp when chapters were generated */
  generatedAt: string
}

// ============================================================================
// Sentiment Analysis Metadata
// ============================================================================

/**
 * Sentiment types
 */
export type SentimentType = 'positive' | 'negative' | 'neutral' | 'mixed'

/**
 * Sentiment score breakdown
 * Provides detailed sentiment analysis scores
 */
export interface SentimentScore {
  /** Positive sentiment score 0-1 */
  positive: number
  /** Negative sentiment score 0-1 */
  negative: number
  /** Neutral sentiment score 0-1 */
  neutral: number
  /** Mixed sentiment score 0-1 */
  mixed?: number
}

/**
 * Sentiment over time data point
 * Represents sentiment at a specific point in time
 */
export interface SentimentTimestamp {
  /** Timestamp in seconds */
  timestamp: number
  /** Sentiment type at this timestamp */
  sentiment: SentimentType
  /** Sentiment scores at this timestamp */
  scores: SentimentScore
  /** Confidence score 0-1 */
  confidence: number
}

/**
 * Emotion detection
 * Optional emotion classification
 */
export interface EmotionDetection {
  /** Detected emotion (e.g., 'joy', 'anger', 'sadness', 'fear', 'surprise') */
  emotion: string
  /** Confidence score 0-1 */
  confidence: number
  /** Timestamp in seconds where emotion is detected */
  timestamp: number
}

/**
 * Sentiment metadata with comprehensive sentiment analysis
 * Provides overall sentiment and sentiment tracking over time
 */
export interface SentimentMetadata {
  /** Overall sentiment classification */
  overall: SentimentType
  /** Overall sentiment scores */
  overallScores: SentimentScore
  /** Overall sentiment confidence 0-1 */
  confidence: number
  /** Sentiment tracking over time */
  timeline: SentimentTimestamp[]
  /** Optional emotion detection throughout content */
  emotions?: EmotionDetection[]
  /** Optional sentiment trend ('improving', 'declining', 'stable') */
  trend?: 'improving' | 'declining' | 'stable'
  /** ISO 8601 timestamp when sentiment analysis was performed */
  generatedAt: string
}

// ============================================================================
// Complete AI Metadata State
// ============================================================================

/**
 * Processing state for AI metadata
 */
export type AIMetadataProcessingState = 'idle' | 'processing' | 'complete' | 'error'

/**
 * Complete AI metadata state
 * Aggregates all AI-generated metadata for a video or content piece
 */
export interface AIMetadataState {
  /** Content identifier (video ID, recording ID, etc.) */
  contentId: string
  /** Processing state */
  state: AIMetadataProcessingState
  /** Progress percentage 0-100 (for processing state) */
  progress: number
  /** Transcript metadata */
  transcript?: TranscriptMetadata
  /** Summary metadata */
  summary?: SummaryMetadata
  /** Topic metadata */
  topics?: TopicMetadata
  /** Highlight metadata */
  highlights?: HighlightMetadata
  /** Chapter metadata */
  chapters?: ChapterMetadata
  /** Sentiment analysis metadata */
  sentiment?: SentimentMetadata
  /** Optional error message (for error state) */
  error?: string
  /** ISO 8601 timestamp when metadata processing started */
  startedAt?: string
  /** ISO 8601 timestamp when metadata processing completed */
  completedAt?: string
  /** Total processing time in milliseconds */
  processingTime?: number
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for TranscriptMetadata
 */
export function isTranscriptMetadata(obj: unknown): obj is TranscriptMetadata {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'segments' in obj &&
    Array.isArray((obj as any).segments) &&
    'language' in obj &&
    'confidence' in obj &&
    'duration' in obj
  )
}

/**
 * Type guard for SummaryMetadata
 */
export function isSummaryMetadata(obj: unknown): obj is SummaryMetadata {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'short' in obj &&
    'long' in obj &&
    'bulletPoints' in obj &&
    Array.isArray((obj as any).bulletPoints) &&
    'keyTakeaways' in obj
  )
}

/**
 * Type guard for TopicMetadata
 */
export function isTopicMetadata(obj: unknown): obj is TopicMetadata {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'topics' in obj &&
    Array.isArray((obj as any).topics) &&
    'primaryTopic' in obj &&
    'confidence' in obj
  )
}

/**
 * Type guard for HighlightMetadata
 */
export function isHighlightMetadata(obj: unknown): obj is HighlightMetadata {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'highlights' in obj &&
    Array.isArray((obj as any).highlights) &&
    'count' in obj &&
    'averageConfidence' in obj
  )
}

/**
 * Type guard for ChapterMetadata
 */
export function isChapterMetadata(obj: unknown): obj is ChapterMetadata {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'chapters' in obj &&
    Array.isArray((obj as any).chapters) &&
    'count' in obj &&
    'averageDuration' in obj
  )
}

/**
 * Type guard for SentimentMetadata
 */
export function isSentimentMetadata(obj: unknown): obj is SentimentMetadata {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'overall' in obj &&
    'overallScores' in obj &&
    'confidence' in obj &&
    'timeline' in obj &&
    Array.isArray((obj as any).timeline)
  )
}

/**
 * Type guard for AIMetadataState
 */
export function isAIMetadataState(obj: unknown): obj is AIMetadataState {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'contentId' in obj &&
    'state' in obj &&
    'progress' in obj &&
    typeof (obj as any).progress === 'number'
  )
}
