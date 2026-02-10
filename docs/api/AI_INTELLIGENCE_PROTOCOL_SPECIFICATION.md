# AI Intelligence Protocol Specification

**Version**: 0.11.0
**Status**: Proposed (Epic 2)
**Last Updated**: 2026-02-10
**Dependencies**: A2UI v0.9 Core Protocol, AIKit Video Epic 14

---

## Table of Contents

1. [Overview](#overview)
2. [Message Types](#message-types)
3. [Semantic Video Search](#semantic-video-search)
4. [AI Metadata Extraction](#ai-metadata-extraction)
5. [Progress Tracking](#progress-tracking)
6. [Hybrid Recommendations](#hybrid-recommendations)
7. [AI Component Specifications](#ai-component-specifications)
8. [Vector Search Implementation](#vector-search-implementation)
9. [Error Handling](#error-handling)
10. [Implementation Guidelines](#implementation-guidelines)
11. [Security & Privacy](#security--privacy)
12. [Performance Considerations](#performance-considerations)

---

## Overview

The A2UI AI Intelligence Protocol extends the core A2UI protocol with advanced AI capabilities for video content. This Epic 2 extension enables agents to leverage semantic search, intelligent metadata extraction, cross-device progress synchronization, and personalized recommendations powered by hybrid AI algorithms.

### Design Principles

1. **AI-First**: Natural language queries, not keyword matching
2. **Progressive Enhancement**: Graceful degradation when AI unavailable
3. **Privacy-Aware**: User data handling with opt-in controls
4. **Performance-Optimized**: Caching, pre-computation, async operations
5. **Framework-Agnostic**: Works across all A2UI renderers

### Protocol Extension

This specification adds **8 new message types** to the A2UI protocol:

- **Search**: `searchVideos`, `searchResults`
- **Metadata**: `requestMetadata`, `videoMetadataReady`
- **Progress**: `updateProgress`, `progressSync`
- **Recommendations**: `requestRecommendations`, `recommendations`

---

## Message Types

### Complete Message Type Enumeration

```typescript
// Extended A2UI message types (v0.11)
export type AIMessageType =
  // Semantic Search
  | 'searchVideos'
  | 'searchResults'
  // AI Metadata
  | 'requestMetadata'
  | 'videoMetadataReady'
  // Progress Tracking
  | 'updateProgress'
  | 'progressSync'
  // Recommendations
  | 'requestRecommendations'
  | 'recommendations'

// Complete protocol includes base + video + AI types
export type A2UIMessageType =
  | BaseMessageType           // Core protocol (Issue #1)
  | VideoMessageType          // Video protocol (Epic 1)
  | AIMessageType             // AI protocol (Epic 2)
```

### Message Direction Reference

| Message Type | Direction | Purpose |
|-------------|-----------|---------|
| `searchVideos` | Agent → Renderer | Request semantic video search |
| `searchResults` | Renderer → Agent | Return search results with relevance |
| `requestMetadata` | Agent → Renderer | Request AI metadata extraction |
| `videoMetadataReady` | Renderer → Agent | Deliver AI-generated metadata |
| `updateProgress` | Renderer → Agent | Report playback progress |
| `progressSync` | Agent → Renderer | Sync progress across devices |
| `requestRecommendations` | Agent → Renderer | Request personalized videos |
| `recommendations` | Renderer → Agent | Deliver recommendations |

---

## Semantic Video Search

### Overview

Semantic video search enables natural language queries using vector embeddings and similarity matching. Unlike keyword search, semantic search understands intent and context.

### SearchVideos Message

**Direction**: Agent → Renderer

```typescript
interface SearchVideosMessage extends BaseMessage {
  type: 'searchVideos'

  /** Surface identifier */
  surfaceId: string

  /** Natural language search query */
  query: string

  /** Optional filters for refined search */
  filters?: {
    /** Duration range in seconds */
    duration?: {
      min?: number
      max?: number
    }

    /** Date range for video creation */
    dateRange?: {
      after?: string     // ISO 8601
      before?: string   // ISO 8601
    }

    /** Sentiment filter */
    sentiment?: 'positive' | 'neutral' | 'negative'

    /** Topic filter (AND logic) */
    topics?: string[]

    /** Tag filter (OR logic) */
    tags?: string[]

    /** Language filter (ISO 639-1) */
    language?: string
  }

  /** Maximum results (default: 10, max: 100) */
  limit?: number

  /** Pagination offset (default: 0) */
  offset?: number

  /** Optional user context for personalization */
  userContext?: {
    userId?: string
    recentSearches?: string[]
    preferences?: Record<string, unknown>
  }
}
```

**Example**:

```typescript
// Natural language search
{
  type: 'searchVideos',
  surfaceId: 'main',
  query: 'product demo videos showing pricing features',
  filters: {
    duration: { min: 60, max: 300 },  // 1-5 minutes
    sentiment: 'positive',
    topics: ['product', 'sales']
  },
  limit: 20
}

// Contextual search with user preferences
{
  type: 'searchVideos',
  surfaceId: 'main',
  query: 'tutorial for beginners',
  userContext: {
    userId: 'user-123',
    recentSearches: ['onboarding', 'getting started'],
    preferences: { skillLevel: 'beginner' }
  },
  limit: 10
}
```

### SearchResults Message

**Direction**: Renderer → Agent

```typescript
interface SearchResultsMessage extends BaseMessage {
  type: 'searchResults'

  /** Surface identifier */
  surfaceId: string

  /** Original query for reference */
  query: string

  /** Search results ordered by relevance */
  results: VideoSearchResult[]

  /** Total matching videos (for pagination) */
  totalResults: number

  /** Search execution time in milliseconds */
  executionTimeMs: number

  /** Search metadata */
  metadata?: {
    /** Query embedding dimension */
    embeddingDimension?: number

    /** Number of vectors searched */
    vectorsSearched?: number

    /** Applied filters summary */
    appliedFilters?: string[]
  }
}

interface VideoSearchResult {
  /** Unique video identifier */
  videoId: string

  /** Video title */
  title: string

  /** Thumbnail URL */
  thumbnail?: string

  /** Overall relevance score (0-1) */
  confidence: number

  /** Timestamp-specific matches */
  relevantTimestamps: TimestampMatch[]

  /** Matched transcript excerpt */
  matchedTranscript: string

  /** Video metadata */
  metadata: {
    /** Duration in seconds */
    duration: number

    /** Video topics */
    topics: string[]

    /** AI-generated summary */
    summary: string

    /** Creation timestamp (ISO 8601) */
    createdAt: string

    /** Optional view count */
    viewCount?: number

    /** Optional rating (0-5) */
    rating?: number

    /** Optional language (ISO 639-1) */
    language?: string
  }
}

interface TimestampMatch {
  /** Timestamp in seconds */
  time: number

  /** Transcript text at this timestamp */
  text: string

  /** Match confidence (0-1) */
  confidence: number

  /** Optional chapter title containing this timestamp */
  chapterTitle?: string
}
```

**Example**:

```typescript
{
  type: 'searchResults',
  surfaceId: 'main',
  query: 'product demo videos showing pricing features',
  results: [
    {
      videoId: 'vid-001',
      title: 'Product Pricing Overview - Q4 2025',
      thumbnail: 'https://cdn.example.com/thumb-001.jpg',
      confidence: 0.94,
      relevantTimestamps: [
        {
          time: 145,
          text: 'Our pricing tiers are designed for every team size...',
          confidence: 0.96,
          chapterTitle: 'Pricing Plans'
        },
        {
          time: 312,
          text: 'Let me compare our pricing with competitors...',
          confidence: 0.89,
          chapterTitle: 'Competitive Analysis'
        }
      ],
      matchedTranscript: '...pricing tiers...enterprise plan...competitive pricing...',
      metadata: {
        duration: 420,
        topics: ['product', 'sales', 'pricing'],
        summary: 'Comprehensive overview of pricing structure and plans',
        createdAt: '2025-10-15T14:30:00Z',
        viewCount: 1234,
        rating: 4.7,
        language: 'en'
      }
    }
    // ... more results
  ],
  totalResults: 47,
  executionTimeMs: 234,
  metadata: {
    embeddingDimension: 1536,
    vectorsSearched: 5000,
    appliedFilters: ['duration', 'sentiment', 'topics']
  }
}
```

### Search Algorithm

1. **Query Embedding**: Convert natural language query to vector (e.g., OpenAI text-embedding-3-small)
2. **Vector Similarity**: Find nearest neighbor videos using cosine similarity
3. **Timestamp Matching**: Match query against transcript chunks with timestamps
4. **Filter Application**: Apply metadata filters (duration, topics, etc.)
5. **Ranking**: Combine vector similarity + metadata relevance + user context
6. **Result Enrichment**: Attach metadata, thumbnails, matched excerpts

---

## AI Metadata Extraction

### Overview

AI metadata extraction automatically generates rich metadata from video content including transcripts, summaries, topics, highlights, chapters, and sentiment analysis.

### RequestMetadata Message

**Direction**: Agent → Renderer

```typescript
interface RequestMetadataMessage extends BaseMessage {
  type: 'requestMetadata'

  /** Surface identifier */
  surfaceId: string

  /** Video identifier */
  videoId: string

  /** Requested metadata features (omit for all) */
  features?: MetadataFeature[]

  /** Processing priority */
  priority?: 'low' | 'normal' | 'high'

  /** Allow partial results */
  allowPartial?: boolean
}

type MetadataFeature =
  | 'transcript'          // Full transcript with timestamps
  | 'summary'             // AI-generated summary
  | 'topics'              // Topic extraction
  | 'tags'                // Automatic tagging
  | 'highlights'          // AI-detected highlights
  | 'chapters'            // Smart chapter detection
  | 'sentiment'           // Sentiment analysis
  | 'speakers'            // Speaker identification
  | 'actionItems'         // Action item detection
  | 'keyFrames'           // Key frame extraction
```

**Example**:

```typescript
// Request all metadata
{
  type: 'requestMetadata',
  surfaceId: 'main',
  videoId: 'vid-001',
  priority: 'high'
}

// Request specific features only
{
  type: 'requestMetadata',
  surfaceId: 'main',
  videoId: 'vid-001',
  features: ['transcript', 'summary', 'topics'],
  allowPartial: true  // Stream results as they become available
}
```

### VideoMetadataReady Message

**Direction**: Renderer → Agent

```typescript
interface VideoMetadataReadyMessage extends BaseMessage {
  type: 'videoMetadataReady'

  /** Surface identifier */
  surfaceId: string

  /** Video identifier */
  videoId: string

  /** Partial delivery indicator */
  partial: boolean

  /** Generated metadata */
  metadata: VideoMetadata

  /** Processing time in milliseconds */
  processingTimeMs?: number
}

interface VideoMetadata {
  /** Full transcript with word-level timestamps */
  transcript?: Transcript

  /** AI-generated summary */
  summary?: string

  /** Extracted topics */
  topics?: string[]

  /** Automatic tags */
  tags?: string[]

  /** AI-detected highlights */
  highlights?: Highlight[]

  /** Smart chapters */
  chapters?: Chapter[]

  /** Sentiment analysis */
  sentiment?: SentimentAnalysis

  /** Speaker identification */
  speakers?: Speaker[]

  /** Detected action items */
  actionItems?: string[]

  /** Key frames */
  keyFrames?: KeyFrame[]
}

interface Transcript {
  /** Full text transcript */
  text: string

  /** Word-level timestamps */
  words: TranscriptWord[]

  /** Optional speaker segments */
  segments?: TranscriptSegment[]
}

interface TranscriptWord {
  /** Word text */
  text: string

  /** Start time in seconds */
  start: number

  /** End time in seconds */
  end: number

  /** Confidence score (0-1) */
  confidence?: number

  /** Speaker identifier */
  speaker?: string
}

interface TranscriptSegment {
  /** Segment start time */
  start: number

  /** Segment end time */
  end: number

  /** Segment text */
  text: string

  /** Speaker identifier */
  speaker?: string
}

interface Highlight {
  /** Timestamp in seconds */
  timestamp: number

  /** Highlight duration in seconds */
  duration: number

  /** Reason for highlight */
  reason: string

  /** Confidence score (0-1) */
  confidence: number

  /** Thumbnail URL */
  thumbnailUrl?: string

  /** Associated tags */
  tags?: string[]
}

interface Chapter {
  /** Chapter start time */
  start: number

  /** Chapter end time */
  end: number

  /** Chapter title */
  title: string

  /** Chapter summary */
  summary?: string

  /** Chapter thumbnail */
  thumbnail?: string
}

interface SentimentAnalysis {
  /** Overall sentiment */
  overall: 'positive' | 'neutral' | 'negative'

  /** Overall sentiment score (-1 to 1) */
  score: number

  /** Sentiment timeline */
  timeline: SentimentPoint[]

  /** Sentiment distribution */
  distribution?: {
    positive: number
    neutral: number
    negative: number
  }
}

interface SentimentPoint {
  /** Timestamp in seconds */
  timestamp: number

  /** Sentiment score (-1 to 1) */
  sentiment: number

  /** Confidence (0-1) */
  confidence?: number
}

interface Speaker {
  /** Speaker identifier */
  id: string

  /** Speaker name (if identified) */
  name?: string

  /** Speaking segments */
  segments: Array<{ start: number; end: number }>

  /** Total speaking time in seconds */
  totalTime?: number

  /** Speaker role (if detected) */
  role?: string
}

interface KeyFrame {
  /** Timestamp in seconds */
  timestamp: number

  /** Frame image URL */
  imageUrl: string

  /** Frame description */
  description?: string

  /** Visual embedding for similarity */
  embedding?: number[]
}
```

**Example**:

```typescript
// Complete metadata delivery
{
  type: 'videoMetadataReady',
  surfaceId: 'main',
  videoId: 'vid-001',
  partial: false,
  metadata: {
    transcript: {
      text: 'Welcome to our product demo. Today we will cover...',
      words: [
        { text: 'Welcome', start: 0.0, end: 0.5, confidence: 0.98, speaker: 'spk-1' },
        { text: 'to', start: 0.5, end: 0.6, confidence: 0.99, speaker: 'spk-1' },
        // ... more words
      ],
      segments: [
        {
          start: 0.0,
          end: 15.3,
          text: 'Welcome to our product demo. Today we will cover pricing and features.',
          speaker: 'spk-1'
        }
      ]
    },
    summary: 'Comprehensive product demo covering pricing plans, key features, and customer success stories. Includes live demonstration and Q&A session.',
    topics: ['product demo', 'pricing', 'features', 'customer success'],
    tags: ['sales', 'onboarding', 'tutorial'],
    highlights: [
      {
        timestamp: 145,
        duration: 30,
        reason: 'Detailed pricing comparison',
        confidence: 0.92,
        thumbnailUrl: 'https://cdn.example.com/highlight-1.jpg',
        tags: ['pricing', 'important']
      }
    ],
    chapters: [
      {
        start: 0,
        end: 120,
        title: 'Introduction',
        summary: 'Overview of the demo agenda',
        thumbnail: 'https://cdn.example.com/chapter-0.jpg'
      },
      {
        start: 120,
        end: 300,
        title: 'Pricing Overview',
        summary: 'Detailed explanation of pricing tiers',
        thumbnail: 'https://cdn.example.com/chapter-1.jpg'
      }
    ],
    sentiment: {
      overall: 'positive',
      score: 0.78,
      timeline: [
        { timestamp: 0, sentiment: 0.6, confidence: 0.85 },
        { timestamp: 60, sentiment: 0.8, confidence: 0.91 },
        { timestamp: 120, sentiment: 0.85, confidence: 0.94 }
      ],
      distribution: {
        positive: 0.78,
        neutral: 0.18,
        negative: 0.04
      }
    },
    speakers: [
      {
        id: 'spk-1',
        name: 'Alice Johnson',
        segments: [
          { start: 0, end: 150 },
          { start: 200, end: 400 }
        ],
        totalTime: 350,
        role: 'presenter'
      }
    ],
    actionItems: [
      'Review pricing tiers for enterprise customers',
      'Schedule follow-up demo for advanced features'
    ]
  },
  processingTimeMs: 15234
}

// Partial metadata delivery (progressive enhancement)
{
  type: 'videoMetadataReady',
  surfaceId: 'main',
  videoId: 'vid-001',
  partial: true,  // More metadata coming
  metadata: {
    transcript: {
      text: 'Welcome to our product demo...',
      words: [/* ... */]
    }
    // Summary and other features still processing
  },
  processingTimeMs: 3500
}
```

### Metadata Generation Pipeline

1. **Audio Extraction**: Extract audio track from video
2. **Transcription**: Speech-to-text with word-level timestamps
3. **Speaker Diarization**: Identify and separate speakers
4. **Summarization**: Generate concise summary using LLM
5. **Topic Extraction**: Identify main topics and themes
6. **Highlight Detection**: Find important moments using multimodal analysis
7. **Chapter Generation**: Detect natural chapter boundaries
8. **Sentiment Analysis**: Analyze emotional tone throughout video
9. **Action Item Detection**: Extract actionable tasks from transcript
10. **Embedding Generation**: Create vector embeddings for search

---

## Progress Tracking

### Overview

Cross-device progress tracking enables users to resume videos from where they left off on any device with scene-aware context.

### UpdateProgress Message

**Direction**: Renderer → Agent

```typescript
interface UpdateProgressMessage extends BaseMessage {
  type: 'updateProgress'

  /** Surface identifier */
  surfaceId: string

  /** Video identifier */
  videoId: string

  /** User identifier */
  userId: string

  /** Current playback position in seconds */
  position: number

  /** Completion rate (0-1) */
  completionRate: number

  /** Device identifier */
  device: DeviceType

  /** Update timestamp (ISO 8601) */
  timestamp: string

  /** Optional playback context */
  context?: {
    /** Playback speed */
    playbackSpeed?: number

    /** Video quality */
    quality?: string

    /** Viewport size */
    viewportSize?: { width: number; height: number }

    /** Full screen status */
    isFullScreen?: boolean
  }
}

type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'tv'
```

**Example**:

```typescript
{
  type: 'updateProgress',
  surfaceId: 'main',
  videoId: 'vid-001',
  userId: 'user-123',
  position: 145.7,
  completionRate: 0.35,
  device: 'desktop',
  timestamp: '2026-02-10T14:30:45Z',
  context: {
    playbackSpeed: 1.0,
    quality: '1080p',
    viewportSize: { width: 1920, height: 1080 },
    isFullScreen: false
  }
}
```

### ProgressSync Message

**Direction**: Agent → Renderer

```typescript
interface ProgressSyncMessage extends BaseMessage {
  type: 'progressSync'

  /** Surface identifier */
  surfaceId: string

  /** Video identifier */
  videoId: string

  /** User identifier */
  userId: string

  /** Last known position in seconds */
  position: number

  /** Last watched timestamp (ISO 8601) */
  lastWatched: string

  /** Completion rate (0-1) */
  completionRate: number

  /** Device where last watched */
  device: DeviceType

  /** Scene-aware metadata */
  sceneMetadata?: SceneMetadata
}

interface SceneMetadata {
  /** Chapter title containing this position */
  chapterTitle?: string

  /** Chapter start time */
  chapterStart?: number

  /** Context text for resume prompt */
  contextText?: string

  /** Thumbnail at this position */
  thumbnail?: string

  /** Transcript excerpt */
  transcriptExcerpt?: string
}
```

**Example**:

```typescript
{
  type: 'progressSync',
  surfaceId: 'mobile-app',
  videoId: 'vid-001',
  userId: 'user-123',
  position: 145.7,
  lastWatched: '2026-02-10T14:30:45Z',
  completionRate: 0.35,
  device: 'desktop',
  sceneMetadata: {
    chapterTitle: 'Pricing Overview',
    chapterStart: 120,
    contextText: 'Discussing enterprise pricing tiers and volume discounts',
    thumbnail: 'https://cdn.example.com/scene-145.jpg',
    transcriptExcerpt: '...our enterprise plan offers unlimited seats with volume discounts...'
  }
}
```

### Progress Tracking Behavior

**Update Frequency**:
- Send `updateProgress` every 10-30 seconds during active playback
- Send final update when video paused or closed
- Debounce rapid position changes (seeking)

**Resume UX**:
```
┌─────────────────────────────────────────────┐
│  Resume from where you left off?           │
│                                             │
│  Pricing Overview                           │
│  [Thumbnail]                                │
│  "Discussing enterprise pricing tiers..."   │
│                                             │
│  Last watched on Desktop, 2 hours ago       │
│  2:25 of 7:00 (35% complete)               │
│                                             │
│  [Resume]  [Start Over]                    │
└─────────────────────────────────────────────┘
```

---

## Hybrid Recommendations

### Overview

Hybrid recommendation engine combines content-based, collaborative filtering, and contextual signals to deliver personalized video suggestions.

### RequestRecommendations Message

**Direction**: Agent → Renderer

```typescript
interface RequestRecommendationsMessage extends BaseMessage {
  type: 'requestRecommendations'

  /** Surface identifier */
  surfaceId: string

  /** User identifier for personalization */
  userId: string

  /** Recommendation context */
  context?: RecommendationContext

  /** Recommendation strategy */
  strategy?: RecommendationStrategy

  /** Maximum recommendations (default: 5, max: 20) */
  limit?: number
}

type RecommendationStrategy =
  | 'content'         // Content-based similarity
  | 'collaborative'   // User-based collaborative filtering
  | 'hybrid'          // Weighted combination (default)

interface RecommendationContext {
  /** Current video being watched */
  currentVideoId?: string

  /** Recently viewed video topics */
  recentTopics?: string[]

  /** Session duration in minutes */
  sessionDuration?: number

  /** Device type */
  device?: DeviceType

  /** Time of day */
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'

  /** User intent */
  intent?: 'learning' | 'entertainment' | 'work' | 'research'

  /** Explicit user preferences */
  preferences?: {
    /** Preferred video length */
    videoLength?: 'short' | 'medium' | 'long'

    /** Preferred topics */
    favoriteTopics?: string[]

    /** Excluded topics */
    excludeTopics?: string[]
  }
}
```

**Example**:

```typescript
// Auto-play "watch next" after video completion
{
  type: 'requestRecommendations',
  surfaceId: 'main',
  userId: 'user-123',
  context: {
    currentVideoId: 'vid-001',
    recentTopics: ['product demo', 'pricing'],
    sessionDuration: 45,
    device: 'desktop',
    timeOfDay: 'afternoon',
    intent: 'work'
  },
  strategy: 'hybrid',
  limit: 5
}

// Personalized homepage recommendations
{
  type: 'requestRecommendations',
  surfaceId: 'homepage',
  userId: 'user-123',
  context: {
    device: 'mobile',
    timeOfDay: 'evening',
    preferences: {
      videoLength: 'short',
      favoriteTopics: ['tutorials', 'product updates']
    }
  },
  strategy: 'hybrid',
  limit: 10
}
```

### Recommendations Message

**Direction**: Renderer → Agent

```typescript
interface RecommendationsMessage extends BaseMessage {
  type: 'recommendations'

  /** Surface identifier */
  surfaceId: string

  /** Personalized recommendations */
  recommendations: VideoRecommendation[]

  /** Strategy used */
  strategy: RecommendationStrategy

  /** Generation timestamp (ISO 8601) */
  generatedAt: string

  /** Recommendation metadata */
  metadata?: RecommendationMetadata
}

interface VideoRecommendation {
  /** Unique video identifier */
  videoId: string

  /** Video title */
  title: string

  /** Thumbnail URL */
  thumbnail: string

  /** Human-readable reason */
  reason: string

  /** Recommendation confidence (0-1) */
  confidence: number

  /** Video metadata */
  metadata: {
    /** Duration in seconds */
    duration: number

    /** Video topics */
    topics: string[]

    /** AI-generated summary */
    summary: string

    /** Optional view count */
    viewCount?: number

    /** Optional rating (0-5) */
    rating?: number

    /** Creation date (ISO 8601) */
    createdAt?: string
  }

  /** Hybrid scoring breakdown */
  scores?: {
    /** Content similarity score (0-1) */
    content?: number

    /** Collaborative filtering score (0-1) */
    collaborative?: number

    /** Contextual relevance score (0-1) */
    contextual?: number
  }
}

interface RecommendationMetadata {
  /** Total videos evaluated */
  totalEvaluated?: number

  /** Processing time in milliseconds */
  processingTimeMs?: number

  /** Hybrid strategy weights */
  weights?: {
    content?: number
    collaborative?: number
    contextual?: number
  }

  /** Personalization signals used */
  signals?: string[]
}
```

**Example**:

```typescript
{
  type: 'recommendations',
  surfaceId: 'main',
  recommendations: [
    {
      videoId: 'vid-042',
      title: 'Advanced Pricing Strategies for Enterprise Sales',
      thumbnail: 'https://cdn.example.com/thumb-042.jpg',
      reason: 'Based on your interest in pricing and enterprise features',
      confidence: 0.94,
      metadata: {
        duration: 420,
        topics: ['pricing', 'enterprise', 'sales'],
        summary: 'Deep dive into enterprise pricing models and negotiation strategies',
        viewCount: 5420,
        rating: 4.8,
        createdAt: '2025-12-01T10:00:00Z'
      },
      scores: {
        content: 0.92,      // High topic similarity
        collaborative: 0.89, // Similar users watched this
        contextual: 0.87     // Relevant to current session
      }
    },
    {
      videoId: 'vid-087',
      title: 'Customer Success Stories: Enterprise Migrations',
      thumbnail: 'https://cdn.example.com/thumb-087.jpg',
      reason: 'Watched by users with similar viewing patterns',
      confidence: 0.88,
      metadata: {
        duration: 600,
        topics: ['customer success', 'enterprise', 'case study'],
        summary: 'Real-world examples of successful enterprise deployments',
        viewCount: 3200,
        rating: 4.6,
        createdAt: '2025-11-15T14:30:00Z'
      },
      scores: {
        content: 0.75,
        collaborative: 0.95,  // Strong collaborative signal
        contextual: 0.82
      }
    }
  ],
  strategy: 'hybrid',
  generatedAt: '2026-02-10T15:45:00Z',
  metadata: {
    totalEvaluated: 1247,
    processingTimeMs: 567,
    weights: {
      content: 0.40,
      collaborative: 0.40,
      contextual: 0.20
    },
    signals: [
      'watch_history',
      'topic_affinity',
      'similar_users',
      'session_context',
      'time_of_day'
    ]
  }
}
```

### Recommendation Algorithm

**Hybrid Scoring Formula**:
```
final_score = (w_content × content_score) +
              (w_collaborative × collaborative_score) +
              (w_contextual × contextual_score)

where: w_content + w_collaborative + w_contextual = 1.0
```

**Default Weights**:
- Content: 40% (topic similarity, vector similarity)
- Collaborative: 40% (user-based filtering)
- Contextual: 20% (device, time, session)

**Content-Based Signals**:
- Topic overlap with watched videos
- Vector similarity (transcript embeddings)
- Sentiment alignment
- Duration preferences
- Quality/rating thresholds

**Collaborative Signals**:
- Co-watch patterns (users who watched A also watched B)
- User clustering (k-means on watch vectors)
- Temporal patterns (watch sequence mining)

**Contextual Signals**:
- Device type (mobile → shorter videos)
- Time of day (evening → entertainment)
- Session duration (long session → deeper content)
- User intent (explicit or inferred)

---

## AI Component Specifications

### aiVideoPlayer Component

Enhanced video player with AI-powered interactive features.

```typescript
interface AIVideoPlayerProperties {
  /** Video URL */
  videoUrl: string

  /** Optional transcript for display */
  transcript?: string

  /** Interactive features */
  interactive?: {
    /** Allow natural language questions */
    allowQuestions?: boolean

    /** Conversational playback control */
    conversationalControl?: boolean

    /** AI-generated smart chapters */
    smartChapters?: boolean

    /** Semantic search within video */
    semanticSearch?: boolean

    /** Auto-jump to relevant sections */
    autoNavigation?: boolean
  }

  /** AI enhancement features */
  ai?: {
    /** Show live captions */
    liveCaptions?: boolean

    /** Highlight detection */
    showHighlights?: boolean

    /** Sentiment visualization */
    sentimentTimeline?: boolean

    /** Speaker labels */
    speakerLabels?: boolean
  }

  /** Event handlers */
  onProgress?: string      // Action name for progress updates
  onQuestion?: string      // Action name for user questions
  onSemanticSearch?: string // Action name for in-video search
}
```

**Example**:

```typescript
{
  id: 'ai-player-1',
  type: 'aiVideoPlayer',
  properties: {
    videoUrl: 'https://cdn.example.com/vid-001.mp4',
    transcript: 'Welcome to our product demo...',
    interactive: {
      allowQuestions: true,
      conversationalControl: true,
      smartChapters: true,
      semanticSearch: true,
      autoNavigation: true
    },
    ai: {
      liveCaptions: true,
      showHighlights: true,
      sentimentTimeline: true,
      speakerLabels: true
    },
    onProgress: 'handleVideoProgress',
    onQuestion: 'handleUserQuestion',
    onSemanticSearch: 'handleInVideoSearch'
  }
}
```

### videoRecorder Component (AI Extensions)

Enhanced recorder with AI processing options.

```typescript
interface VideoRecorderProperties {
  /** Recording mode */
  mode: 'screen' | 'camera' | 'pip'

  /** Basic options */
  audio?: boolean
  quality?: 'low' | 'medium' | 'high'

  /** AI processing options */
  ai?: {
    /** Generate transcript */
    transcribe?: boolean

    /** Detect highlights */
    highlights?: boolean

    /** Generate summary */
    summary?: boolean

    /** Store in ZeroDB with vectors */
    zerodb?: boolean

    /** Extract topics */
    topics?: boolean

    /** Generate chapters */
    chapters?: boolean

    /** Sentiment analysis */
    sentiment?: boolean
  }

  /** Event handlers */
  onStart?: string
  onComplete?: string
  onError?: string
  onMetadataReady?: string  // Triggered when AI processing completes
}
```

### videoCall Component (AI Extensions)

Enhanced video call with AI features.

```typescript
interface VideoCallProperties {
  /** Room identifier */
  roomId: string

  /** Layout */
  layout?: 'grid' | 'speaker' | 'sidebar'

  /** Features */
  features?: {
    chat?: boolean
    screenShare?: boolean
    recording?: boolean
  }

  /** AI features */
  ai?: {
    /** Live transcription */
    liveTranscription?: boolean

    /** Live captions */
    liveCaptions?: boolean

    /** Real-time translation */
    translation?: string  // ISO 639-1 language code

    /** AI noise cancellation */
    noiseCancellation?: boolean

    /** Speaker identification */
    speakerIdentification?: boolean

    /** Action item detection */
    actionItemDetection?: boolean

    /** Meeting summary */
    autoSummary?: boolean

    /** Sentiment monitoring */
    sentimentMonitoring?: boolean
  }

  /** Event handlers */
  onJoin?: string
  onLeave?: string
  onError?: string
  onTranscriptUpdate?: string
  onActionItem?: string
}
```

---

## Vector Search Implementation

### Vector Database Schema

```sql
-- Videos table
CREATE TABLE videos (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  duration INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  metadata JSONB
);

-- Transcript chunks with embeddings
CREATE TABLE transcript_chunks (
  id UUID PRIMARY KEY,
  video_id UUID REFERENCES videos(id),
  chunk_index INTEGER NOT NULL,
  start_time DECIMAL NOT NULL,  -- seconds
  end_time DECIMAL NOT NULL,
  text TEXT NOT NULL,
  embedding VECTOR(1536),  -- OpenAI embedding dimension
  speaker_id TEXT,
  CONSTRAINT unique_chunk UNIQUE (video_id, chunk_index)
);

-- Video embeddings (full video summary)
CREATE TABLE video_embeddings (
  video_id UUID PRIMARY KEY REFERENCES videos(id),
  summary TEXT NOT NULL,
  embedding VECTOR(1536),
  topics TEXT[],
  tags TEXT[]
);

-- User progress
CREATE TABLE user_progress (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  video_id UUID REFERENCES videos(id),
  position DECIMAL NOT NULL,
  completion_rate DECIMAL NOT NULL,
  device TEXT NOT NULL,
  last_watched TIMESTAMPTZ NOT NULL,
  CONSTRAINT unique_user_video UNIQUE (user_id, video_id)
);

-- User watch history
CREATE TABLE watch_history (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  video_id UUID REFERENCES videos(id),
  watched_at TIMESTAMPTZ NOT NULL,
  completion_rate DECIMAL NOT NULL,
  watch_duration INTEGER NOT NULL  -- seconds
);

-- Indexes for performance
CREATE INDEX idx_transcript_embedding ON transcript_chunks
  USING ivfflat (embedding vector_cosine_ops);

CREATE INDEX idx_video_embedding ON video_embeddings
  USING ivfflat (embedding vector_cosine_ops);

CREATE INDEX idx_user_progress_user ON user_progress (user_id);
CREATE INDEX idx_watch_history_user ON watch_history (user_id);
```

### Vector Search Query

```sql
-- Semantic search with filters
WITH query_embedding AS (
  -- Query embedding generated by AI model
  SELECT $1::vector(1536) AS embedding
),
semantic_results AS (
  SELECT
    v.id,
    v.title,
    v.url,
    v.duration,
    v.metadata,
    ve.summary,
    ve.topics,
    1 - (ve.embedding <=> qe.embedding) AS similarity
  FROM videos v
  JOIN video_embeddings ve ON ve.video_id = v.id
  CROSS JOIN query_embedding qe
  WHERE
    -- Apply filters
    v.duration BETWEEN $2 AND $3  -- duration filter
    AND ve.topics && $4  -- topics filter (array overlap)
  ORDER BY ve.embedding <=> qe.embedding
  LIMIT 50
),
timestamp_matches AS (
  SELECT
    tc.video_id,
    jsonb_agg(
      jsonb_build_object(
        'time', tc.start_time,
        'text', tc.text,
        'confidence', 1 - (tc.embedding <=> qe.embedding)
      ) ORDER BY tc.embedding <=> qe.embedding
    ) FILTER (WHERE 1 - (tc.embedding <=> qe.embedding) > 0.7) AS relevant_timestamps
  FROM transcript_chunks tc
  CROSS JOIN query_embedding qe
  WHERE tc.video_id IN (SELECT id FROM semantic_results)
  GROUP BY tc.video_id
)
SELECT
  sr.*,
  tm.relevant_timestamps
FROM semantic_results sr
LEFT JOIN timestamp_matches tm ON tm.video_id = sr.id
ORDER BY sr.similarity DESC
LIMIT $5;  -- result limit
```

### Embedding Generation

**Video-Level Embeddings**:
1. Generate transcript
2. Create summary (LLM)
3. Combine: `title + summary + topics`
4. Generate embedding: `text-embedding-3-small`
5. Store in `video_embeddings`

**Chunk-Level Embeddings**:
1. Split transcript into chunks (30-60 seconds)
2. Generate embedding for each chunk
3. Store with timestamps in `transcript_chunks`
4. Enables timestamp-specific search

**Query Embeddings**:
1. User query → embedding model
2. Vector similarity search
3. Rank by cosine similarity

---

## Error Handling

### AI-Specific Error Codes

```typescript
type AIErrorCode =
  // Search errors
  | 'SEARCH_EMBEDDING_FAILED'
  | 'SEARCH_QUERY_INVALID'
  | 'SEARCH_TIMEOUT'
  | 'SEARCH_NO_RESULTS'

  // Metadata errors
  | 'METADATA_TRANSCRIPTION_FAILED'
  | 'METADATA_SUMMARIZATION_FAILED'
  | 'METADATA_VIDEO_NOT_FOUND'
  | 'METADATA_PROCESSING_TIMEOUT'
  | 'METADATA_INSUFFICIENT_AUDIO'

  // Progress errors
  | 'PROGRESS_INVALID_POSITION'
  | 'PROGRESS_USER_NOT_FOUND'
  | 'PROGRESS_SYNC_FAILED'

  // Recommendation errors
  | 'RECOMMENDATIONS_INSUFFICIENT_DATA'
  | 'RECOMMENDATIONS_MODEL_UNAVAILABLE'
  | 'RECOMMENDATIONS_TIMEOUT'
  | 'RECOMMENDATIONS_USER_NOT_FOUND'

  // Generic AI errors
  | 'AI_SERVICE_UNAVAILABLE'
  | 'AI_RATE_LIMIT_EXCEEDED'
  | 'AI_QUOTA_EXCEEDED'
```

### Error Message Format

```typescript
interface AIErrorMessage extends BaseMessage {
  type: 'error'

  /** Error code */
  code: AIErrorCode

  /** Human-readable message */
  message: string

  /** Error context */
  details?: {
    /** Original request that caused error */
    originalRequest?: string

    /** Retry recommended */
    retryable?: boolean

    /** Estimated retry delay (ms) */
    retryAfter?: number

    /** Fallback strategy available */
    fallbackAvailable?: boolean
  }
}
```

### Error Examples

```typescript
// Search timeout
{
  type: 'error',
  code: 'SEARCH_TIMEOUT',
  message: 'Semantic search exceeded timeout limit (5s)',
  details: {
    originalRequest: 'searchVideos',
    retryable: true,
    retryAfter: 1000,
    fallbackAvailable: true  // Can fall back to keyword search
  }
}

// Metadata processing failed
{
  type: 'error',
  code: 'METADATA_TRANSCRIPTION_FAILED',
  message: 'Failed to transcribe video: insufficient audio quality',
  details: {
    originalRequest: 'requestMetadata',
    retryable: false,
    fallbackAvailable: false
  }
}

// Rate limit
{
  type: 'error',
  code: 'AI_RATE_LIMIT_EXCEEDED',
  message: 'AI service rate limit exceeded. Please try again in 60 seconds.',
  details: {
    retryable: true,
    retryAfter: 60000
  }
}
```

### Graceful Degradation

1. **Search**: Fall back to keyword search if vector search fails
2. **Metadata**: Deliver partial results (transcript only if summary fails)
3. **Recommendations**: Use content-based only if collaborative fails
4. **Progress**: Use local storage if sync fails

---

## Implementation Guidelines

### For Agent Developers

**Best Practices**:

1. **Search**:
   - Use natural language queries, not keywords
   - Apply filters to narrow results
   - Check for empty results and provide fallback

2. **Metadata**:
   - Check if metadata exists before requesting
   - Use `allowPartial: true` for progressive enhancement
   - Cache metadata in data model

3. **Progress**:
   - Update every 10-30 seconds during playback
   - Send final update on pause/close
   - Show scene-aware resume prompts

4. **Recommendations**:
   - Request on video end for "watch next"
   - Use hybrid strategy for best results
   - Provide rich context for better personalization

**Example Agent Flow**:

```typescript
// 1. User searches for videos
agent.send({
  type: 'searchVideos',
  surfaceId: 'main',
  query: 'pricing strategy videos',
  filters: { duration: { max: 300 } },
  limit: 10
})

// 2. Agent receives results and updates UI
transport.on('searchResults', ({ results }) => {
  agent.send({
    type: 'updateComponents',
    surfaceId: 'main',
    updates: [{
      id: 'search-results',
      operation: 'update',
      component: {
        id: 'search-results',
        type: 'list',
        properties: {
          items: results.map(r => ({
            videoId: r.videoId,
            title: r.title,
            thumbnail: r.thumbnail,
            relevance: r.confidence
          }))
        }
      }
    }]
  })
})

// 3. User selects video, agent requests metadata
agent.send({
  type: 'requestMetadata',
  surfaceId: 'main',
  videoId: 'vid-001',
  features: ['transcript', 'summary', 'chapters'],
  allowPartial: true
})

// 4. Agent receives metadata and enhances UI
transport.on('videoMetadataReady', ({ metadata, partial }) => {
  // Update UI with available metadata
  // If partial, expect more updates
})

// 5. User watches video, renderer sends progress
transport.on('updateProgress', ({ videoId, userId, position }) => {
  // Store progress in database
})

// 6. Video ends, agent requests recommendations
agent.send({
  type: 'requestRecommendations',
  surfaceId: 'main',
  userId: 'user-123',
  context: {
    currentVideoId: 'vid-001',
    recentTopics: metadata.topics,
    device: 'desktop'
  },
  strategy: 'hybrid',
  limit: 5
})

// 7. Agent receives recommendations and shows "watch next"
transport.on('recommendations', ({ recommendations }) => {
  // Display recommendations
})
```

### For Renderer Developers

**Implementation Checklist**:

- [ ] Vector database setup (pgvector)
- [ ] Embedding generation pipeline
- [ ] Transcript chunking logic
- [ ] Semantic search endpoint
- [ ] Metadata caching layer
- [ ] Background metadata processing
- [ ] Progress tracking storage
- [ ] Recommendation engine
- [ ] Error handling and fallbacks

**Performance Optimizations**:

1. **Caching**:
   - Cache embeddings aggressively
   - Cache metadata for 24 hours
   - Use CDN for thumbnails/videos

2. **Pre-computation**:
   - Generate embeddings on video upload
   - Pre-compute recommendations nightly
   - Build user preference profiles

3. **Indexing**:
   - IVFFlat index for vector search
   - B-tree indexes on filters
   - Composite indexes for common queries

4. **Async Processing**:
   - Queue metadata generation jobs
   - Stream partial results
   - Use background workers

---

## Security & Privacy

### Data Privacy

1. **User Consent**:
   - Require opt-in for progress tracking
   - Require opt-in for recommendations
   - Allow data export/deletion (GDPR)

2. **Data Minimization**:
   - Store only necessary metadata
   - Anonymize analytics data
   - Auto-delete old progress data

3. **Access Control**:
   - User-scoped progress data
   - Organization-scoped video metadata
   - Role-based recommendation access

### Security Measures

1. **Input Validation**:
   - Sanitize search queries
   - Validate vector dimensions
   - Rate limit AI requests

2. **Authentication**:
   - Require auth for personal data
   - API keys for renderer services
   - Token expiration

3. **Data Encryption**:
   - TLS for all communications
   - Encrypted storage for PII
   - Secure embedding storage

---

## Performance Considerations

### Latency Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| Vector search | < 500ms | 90th percentile |
| Metadata request (cached) | < 100ms | Database lookup |
| Metadata generation | 10-60s | Depends on video length |
| Progress sync | < 100ms | Real-time requirement |
| Recommendations | < 1000ms | Hybrid strategy |

### Scalability

**Vector Search**:
- IVFFlat index: ~10M vectors
- Query throughput: ~1000 QPS
- P95 latency: < 500ms

**Metadata Generation**:
- Queue-based processing
- Parallel workers
- Priority queuing

**Recommendations**:
- Pre-computed candidates
- Real-time ranking
- Cache popular recommendations

### Optimization Techniques

1. **Vector Search**:
   - Use quantization (HNSW, IVFFlat)
   - Limit search space with filters
   - Cache popular queries

2. **Metadata**:
   - Batch processing
   - Progressive delivery
   - CDN for media

3. **Recommendations**:
   - Pre-compute user profiles
   - Candidate generation + ranking pipeline
   - A/B testing for weights

---

## Appendix

### Related Documents

- [A2UI Core Protocol](./API.md)
- [Video Protocol Specification](./VIDEO_PROTOCOL_SPECIFICATION.md)
- [AI Intelligence Protocol Flow](./ai-intelligence-protocol-flow.md)
- [Video Component Documentation](./VIDEO_COMPONENTS.md)

### Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.11.0 | 2026-02-10 | Initial AI Intelligence Protocol specification |

### Credits

Specification authored by AINative Studio engineering team.

---

**End of AI Intelligence Protocol Specification**
