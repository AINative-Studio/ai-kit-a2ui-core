# AI Implementation Guide

**Version**: 0.11.0-alpha (Epic 2)
**Last Updated**: 2026-02-10
**Target**: Developers building AI-enhanced video features with A2UI

## Table of Contents

- [Overview](#overview)
- [Semantic Search Implementation](#semantic-search-implementation)
- [AI Metadata Extraction](#ai-metadata-extraction)
- [Progress Tracking Implementation](#progress-tracking-implementation)
- [Recommendation System Implementation](#recommendation-system-implementation)
- [Testing Strategies](#testing-strategies)
- [Performance Optimization](#performance-optimization)
- [Error Handling](#error-handling)
- [Production Deployment](#production-deployment)

---

## Overview

This guide provides complete implementation patterns for building AI-enhanced video features using the A2UI protocol. The AI features leverage vector embeddings, semantic search, and machine learning models to provide intelligent video experiences.

### Architecture Stack

```
┌─────────────────────────────────────────────────────┐
│              A2UI Agent (Your Code)                 │
│  ┌──────────────────────────────────────────────┐  │
│  │  Semantic Search │ Recommendations │ Metadata │  │
│  └──────────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────────┘
                 │ WebSocket (A2UI Protocol)
┌────────────────┴────────────────────────────────────┐
│          A2UI Renderer (Frontend)                   │
│  ┌──────────────────────────────────────────────┐  │
│  │  VideoRecorder │ VideoCall │ AIVideoPlayer   │  │
│  └──────────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────┐
│              AIKit Video Service                    │
│  ┌──────────────────────────────────────────────┐  │
│  │  Vector Search │ AI Pipeline │ ZeroDB        │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Prerequisites

- A2UI Core Library v0.11+
- Node.js 18+ or Python 3.11+
- AIKit Video service access
- Vector database (ZeroDB or compatible)
- AI provider (OpenAI, Anthropic, or local LLM)

---

## Semantic Search Implementation

### 1. Basic Semantic Search

Semantic search allows users to find videos using natural language queries instead of exact keyword matches.

#### Agent Implementation (TypeScript)

```typescript
import { A2UITransport } from '@ainative/ai-kit-a2ui-core/transport'
import type { A2UIMessage } from '@ainative/ai-kit-a2ui-core/types'

class SemanticSearchAgent {
  private transport: A2UITransport

  constructor(url: string) {
    this.transport = new A2UITransport(url)
    this.setupListeners()
  }

  private setupListeners(): void {
    // Listen for search results from renderer
    this.transport.on('message', (message: A2UIMessage) => {
      if (message.type === 'searchResults') {
        this.handleSearchResults(message)
      }
    })
  }

  /**
   * Perform semantic video search
   * @param query Natural language search query
   * @param filters Optional metadata filters
   */
  async searchVideos(
    query: string,
    filters?: SearchFilters
  ): Promise<void> {
    await this.transport.send({
      type: 'searchVideos',
      surfaceId: 'search-surface',
      query,
      filters: {
        duration: filters?.duration,
        topics: filters?.topics,
        sentiment: filters?.sentiment,
        dateRange: filters?.dateRange
      },
      options: {
        limit: filters?.limit || 10,
        includeTimestamps: true,
        includeTranscript: true
      }
    })
  }

  private handleSearchResults(message: any): void {
    const results = message.results.map((result: any) => ({
      videoId: result.videoId,
      title: result.title,
      relevanceScore: result.confidence,
      matchedSegments: result.relevantTimestamps,
      transcript: result.matchedTranscript,
      metadata: result.metadata
    }))

    console.log(`Found ${results.length} videos`)
    this.displayResults(results)
  }

  private displayResults(results: SearchResult[]): void {
    // Update UI components with search results
    this.transport.send({
      type: 'updateComponents',
      surfaceId: 'search-surface',
      updates: [
        {
          id: 'results-list',
          properties: {
            items: results.map(r => ({
              id: r.videoId,
              title: r.title,
              score: r.relevanceScore,
              segments: r.matchedSegments
            }))
          }
        }
      ]
    })
  }
}

// Type definitions
interface SearchFilters {
  duration?: { min?: number; max?: number }
  topics?: string[]
  sentiment?: 'positive' | 'neutral' | 'negative'
  dateRange?: { start: string; end: string }
  limit?: number
}

interface SearchResult {
  videoId: string
  title: string
  relevanceScore: number
  matchedSegments: TimestampMatch[]
  transcript: string
  metadata: VideoMetadata
}

interface TimestampMatch {
  time: number
  text: string
  confidence: number
}

interface VideoMetadata {
  duration: number
  topics: string[]
  summary: string
  sentiment?: string
}
```

#### Usage Example

```typescript
const agent = new SemanticSearchAgent('wss://api.example.com/video')

// Simple search
await agent.searchVideos('product demo videos')

// Advanced search with filters
await agent.searchVideos('pricing discussion', {
  duration: { min: 60, max: 300 },
  topics: ['sales', 'product'],
  sentiment: 'positive',
  limit: 5
})
```

### 2. Real-Time Search with Debouncing

Implement real-time search with proper debouncing for better UX:

```typescript
class RealTimeSearchAgent extends SemanticSearchAgent {
  private searchDebounceTimer: NodeJS.Timeout | null = null
  private searchCache = new Map<string, SearchResult[]>()

  /**
   * Real-time search with debouncing
   */
  async searchWithDebounce(
    query: string,
    delay: number = 300
  ): Promise<void> {
    // Clear existing timer
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer)
    }

    // Check cache first
    if (this.searchCache.has(query)) {
      this.displayResults(this.searchCache.get(query)!)
      return
    }

    // Set new timer
    this.searchDebounceTimer = setTimeout(async () => {
      await this.searchVideos(query)
    }, delay)
  }

  protected handleSearchResults(message: any): void {
    super.handleSearchResults(message)

    // Cache results
    const query = message.originalQuery
    this.searchCache.set(query, message.results)

    // Limit cache size
    if (this.searchCache.size > 50) {
      const firstKey = this.searchCache.keys().next().value
      this.searchCache.delete(firstKey)
    }
  }
}
```

### 3. Timestamp-Aware Search

Search within video content and jump to relevant timestamps:

```typescript
class TimestampSearchAgent {
  private transport: A2UITransport

  /**
   * Search and create jumpable timeline
   */
  async searchWithTimestamps(query: string, videoId?: string): Promise<void> {
    await this.transport.send({
      type: 'searchVideos',
      surfaceId: 'player-surface',
      query,
      filters: videoId ? { videoId } : undefined,
      options: {
        includeTimestamps: true,
        includeTranscript: true,
        timestampWindow: 30 // seconds before/after match
      }
    })
  }

  /**
   * Create interactive timeline with search matches
   */
  private createInteractiveTimeline(
    videoId: string,
    matches: TimestampMatch[]
  ): void {
    this.transport.send({
      type: 'createSurface',
      surfaceId: `video-${videoId}`,
      components: [
        // Video player
        {
          id: 'player',
          type: 'aiVideoPlayer',
          properties: {
            videoId,
            autoplay: false,
            controls: true
          }
        },
        // Timeline with markers
        {
          id: 'timeline',
          type: 'column',
          children: matches.map((match, i) => ({
            id: `match-${i}`,
            type: 'button',
            properties: {
              label: `${this.formatTime(match.time)} - ${match.text}`,
              action: 'seekVideo',
              context: {
                videoId,
                timestamp: match.time
              },
              variant: 'text'
            }
          }))
        },
        // Match highlights
        {
          id: 'highlights',
          type: 'card',
          properties: {
            title: 'Search Matches',
            subtitle: `Found ${matches.length} segments`
          },
          children: matches.map((match, i) => ({
            id: `highlight-${i}`,
            type: 'text',
            properties: {
              value: `[${this.formatTime(match.time)}] ${match.text}`,
              fontSize: 14,
              color: match.confidence > 0.8 ? '#059669' : '#6b7280'
            }
          }))
        }
      ]
    })
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
}
```

### 4. Backend Integration with Vector Database

Server-side implementation for vector search:

```python
from typing import List, Dict, Optional
import numpy as np
from openai import OpenAI
from zerodb_mcp import ZeroDBClient

class VideoSemanticSearch:
    """
    Backend semantic search using vector embeddings
    """
    def __init__(self, zerodb_client: ZeroDBClient, openai_api_key: str):
        self.db = zerodb_client
        self.openai = OpenAI(api_key=openai_api_key)
        self.embedding_model = "text-embedding-3-small"

    async def search_videos(
        self,
        query: str,
        limit: int = 10,
        filters: Optional[Dict] = None
    ) -> List[Dict]:
        """
        Perform semantic video search

        Args:
            query: Natural language search query
            limit: Maximum results to return
            filters: Optional metadata filters

        Returns:
            List of video results with relevance scores
        """
        # 1. Generate query embedding
        query_embedding = await self._get_embedding(query)

        # 2. Search vector database
        results = await self.db.vector_search(
            vector=query_embedding,
            limit=limit,
            metadata_filter=filters
        )

        # 3. Enrich with metadata
        enriched_results = []
        for result in results:
            video_meta = await self.db.get_video_metadata(result['video_id'])
            enriched_results.append({
                'videoId': result['video_id'],
                'confidence': result['similarity'],
                'relevantTimestamps': await self._find_timestamps(
                    result['video_id'],
                    query_embedding
                ),
                'matchedTranscript': await self._extract_matched_text(
                    result['video_id'],
                    query_embedding
                ),
                'metadata': video_meta
            })

        return enriched_results

    async def _get_embedding(self, text: str) -> np.ndarray:
        """Generate text embedding using OpenAI"""
        response = self.openai.embeddings.create(
            model=self.embedding_model,
            input=text
        )
        return np.array(response.data[0].embedding)

    async def _find_timestamps(
        self,
        video_id: str,
        query_embedding: np.ndarray,
        threshold: float = 0.7
    ) -> List[Dict]:
        """Find relevant timestamps within video"""
        # Get transcript chunks with timestamps
        chunks = await self.db.get_transcript_chunks(video_id)

        matches = []
        for chunk in chunks:
            chunk_embedding = np.array(chunk['embedding'])
            similarity = self._cosine_similarity(query_embedding, chunk_embedding)

            if similarity >= threshold:
                matches.append({
                    'time': chunk['timestamp'],
                    'text': chunk['text'],
                    'confidence': float(similarity)
                })

        # Sort by relevance
        return sorted(matches, key=lambda x: x['confidence'], reverse=True)[:5]

    async def _extract_matched_text(
        self,
        video_id: str,
        query_embedding: np.ndarray
    ) -> str:
        """Extract most relevant transcript excerpt"""
        timestamps = await self._find_timestamps(video_id, query_embedding)
        if not timestamps:
            return ""

        # Get full transcript context around best match
        best_match = timestamps[0]
        transcript = await self.db.get_transcript(
            video_id,
            start=max(0, best_match['time'] - 30),
            end=best_match['time'] + 30
        )

        return transcript

    @staticmethod
    def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
        """Calculate cosine similarity between vectors"""
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

# Usage
search = VideoSemanticSearch(zerodb_client, openai_api_key)
results = await search.search_videos(
    "product demo videos",
    limit=10,
    filters={"duration": {"$gte": 60, "$lte": 300}}
)
```

---

## AI Metadata Extraction

### 1. Automatic Metadata Processing

Extract AI-powered metadata (transcripts, summaries, topics) from videos:

```typescript
class MetadataExtractor {
  private transport: A2UITransport
  private processingQueue = new Map<string, MetadataRequest>()

  /**
   * Request AI metadata extraction for a video
   */
  async extractMetadata(
    videoId: string,
    features: MetadataFeature[] = ['transcript', 'summary', 'topics']
  ): Promise<void> {
    const requestId = `meta-${videoId}-${Date.now()}`

    this.processingQueue.set(requestId, {
      videoId,
      features,
      status: 'pending',
      startTime: Date.now()
    })

    await this.transport.send({
      type: 'requestMetadata',
      surfaceId: 'metadata-surface',
      videoId,
      requestId,
      features,
      options: {
        priority: 'high',
        callback: '/handlers/onMetadataReady'
      }
    })
  }

  /**
   * Handle metadata extraction completion
   */
  private async handleMetadataReady(message: any): Promise<void> {
    const { videoId, requestId, metadata, processingTime } = message

    const request = this.processingQueue.get(requestId)
    if (!request) return

    // Update status
    request.status = 'complete'
    request.metadata = metadata

    console.log(`Metadata ready for ${videoId} (${processingTime}ms)`)

    // Store in database
    await this.storeMetadata(videoId, metadata)

    // Update UI
    this.updateVideoMetadata(videoId, metadata)

    // Clean up queue
    this.processingQueue.delete(requestId)
  }

  /**
   * Extract metadata with progress tracking
   */
  async extractWithProgress(
    videoId: string,
    onProgress: (progress: number, stage: string) => void
  ): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      this.transport.on('metadataProgress', (msg) => {
        if (msg.videoId === videoId) {
          onProgress(msg.progress, msg.stage)
        }
      })

      this.transport.on('videoMetadataReady', (msg) => {
        if (msg.videoId === videoId) {
          resolve(msg.metadata)
        }
      })

      this.extractMetadata(videoId)
    })
  }

  private async storeMetadata(
    videoId: string,
    metadata: VideoMetadata
  ): Promise<void> {
    // Store in your database
    await fetch(`/api/videos/${videoId}/metadata`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metadata)
    })
  }

  private updateVideoMetadata(
    videoId: string,
    metadata: VideoMetadata
  ): void {
    this.transport.send({
      type: 'updateComponents',
      surfaceId: 'video-detail',
      updates: [
        {
          id: 'video-title',
          properties: { value: metadata.title }
        },
        {
          id: 'video-summary',
          properties: { value: metadata.summary }
        },
        {
          id: 'video-topics',
          properties: {
            tags: metadata.topics.map(t => ({ label: t, color: '#3b82f6' }))
          }
        },
        {
          id: 'transcript',
          properties: { content: metadata.transcript }
        }
      ]
    })
  }
}

type MetadataFeature = 'transcript' | 'summary' | 'topics' | 'sentiment' | 'entities'

interface MetadataRequest {
  videoId: string
  features: MetadataFeature[]
  status: 'pending' | 'processing' | 'complete' | 'error'
  startTime: number
  metadata?: VideoMetadata
}

interface VideoMetadata {
  title: string
  summary: string
  transcript: TranscriptSegment[]
  topics: string[]
  sentiment?: 'positive' | 'neutral' | 'negative'
  entities?: Entity[]
  duration: number
  language: string
}

interface TranscriptSegment {
  timestamp: number
  text: string
  speaker?: string
  confidence: number
}

interface Entity {
  text: string
  type: 'person' | 'organization' | 'location' | 'product'
  mentions: number[]
}
```

### 2. Batch Metadata Processing

Process multiple videos efficiently:

```typescript
class BatchMetadataProcessor {
  private transport: A2UITransport
  private batchSize = 5
  private maxConcurrent = 3

  /**
   * Process multiple videos in batches
   */
  async processBatch(videoIds: string[]): Promise<Map<string, VideoMetadata>> {
    const results = new Map<string, VideoMetadata>()
    const batches = this.createBatches(videoIds, this.batchSize)

    for (const batch of batches) {
      const promises = batch.map(videoId =>
        this.extractMetadataWithRetry(videoId)
      )

      const batchResults = await Promise.allSettled(promises)

      batchResults.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          results.set(batch[i], result.value)
        } else {
          console.error(`Failed to process ${batch[i]}:`, result.reason)
        }
      })

      // Rate limiting
      await this.delay(1000)
    }

    return results
  }

  private async extractMetadataWithRetry(
    videoId: string,
    maxRetries: number = 3
  ): Promise<VideoMetadata> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.extractMetadataPromise(videoId)
      } catch (error) {
        if (attempt === maxRetries) throw error
        await this.delay(1000 * attempt)
      }
    }
    throw new Error(`Failed after ${maxRetries} attempts`)
  }

  private extractMetadataPromise(videoId: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Metadata extraction timeout'))
      }, 60000)

      this.transport.on('videoMetadataReady', (msg) => {
        if (msg.videoId === videoId) {
          clearTimeout(timeout)
          resolve(msg.metadata)
        }
      })

      this.transport.send({
        type: 'requestMetadata',
        surfaceId: 'batch-surface',
        videoId,
        features: ['transcript', 'summary', 'topics']
      })
    })
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = []
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize))
    }
    return batches
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
```

### 3. Backend AI Pipeline

Server-side AI processing pipeline:

```python
import asyncio
from typing import List, Dict, Optional
from openai import OpenAI
import anthropic
from zerodb_mcp import ZeroDBClient

class AIMetadataExtractor:
    """
    Server-side AI metadata extraction pipeline
    """
    def __init__(
        self,
        zerodb_client: ZeroDBClient,
        openai_api_key: str,
        anthropic_api_key: Optional[str] = None
    ):
        self.db = zerodb_client
        self.openai = OpenAI(api_key=openai_api_key)
        self.claude = anthropic.Anthropic(api_key=anthropic_api_key) if anthropic_api_key else None

    async def extract_all_metadata(
        self,
        video_id: str,
        video_url: str,
        features: List[str]
    ) -> Dict:
        """
        Extract all requested metadata features
        """
        metadata = {
            'videoId': video_id,
            'processedAt': datetime.utcnow().isoformat()
        }

        # Run extraction tasks in parallel
        tasks = []

        if 'transcript' in features:
            tasks.append(self._extract_transcript(video_url))
        if 'summary' in features:
            tasks.append(self._generate_summary(video_url))
        if 'topics' in features:
            tasks.append(self._extract_topics(video_url))
        if 'sentiment' in features:
            tasks.append(self._analyze_sentiment(video_url))
        if 'entities' in features:
            tasks.append(self._extract_entities(video_url))

        # Execute in parallel
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Merge results
        for i, feature in enumerate(['transcript', 'summary', 'topics', 'sentiment', 'entities']):
            if feature in features:
                result = results.pop(0)
                if not isinstance(result, Exception):
                    metadata[feature] = result

        # Generate embeddings
        if 'transcript' in metadata:
            metadata['embedding'] = await self._generate_embedding(
                metadata.get('summary', '') or metadata['transcript'][:1000]
            )

        # Store in database
        await self.db.upsert_metadata(video_id, metadata)

        return metadata

    async def _extract_transcript(self, video_url: str) -> List[Dict]:
        """
        Extract transcript using Whisper API
        """
        # Download audio
        audio_file = await self._extract_audio(video_url)

        # Transcribe with timestamps
        with open(audio_file, 'rb') as f:
            transcript = self.openai.audio.transcriptions.create(
                model="whisper-1",
                file=f,
                response_format="verbose_json",
                timestamp_granularities=["segment"]
            )

        # Format segments
        segments = []
        for seg in transcript.segments:
            segments.append({
                'timestamp': seg['start'],
                'text': seg['text'],
                'confidence': seg.get('no_speech_prob', 0)
            })

        return segments

    async def _generate_summary(self, video_url: str) -> str:
        """
        Generate video summary using Claude
        """
        if not self.claude:
            return ""

        # Get transcript
        transcript = await self._extract_transcript(video_url)
        full_text = " ".join([seg['text'] for seg in transcript])

        # Generate summary
        message = self.claude.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=500,
            messages=[{
                "role": "user",
                "content": f"Summarize this video transcript in 2-3 sentences:\n\n{full_text}"
            }]
        )

        return message.content[0].text

    async def _extract_topics(self, video_url: str) -> List[str]:
        """
        Extract main topics using GPT-4
        """
        transcript = await self._extract_transcript(video_url)
        full_text = " ".join([seg['text'] for seg in transcript[:50]])  # First 50 segments

        response = self.openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "Extract 3-5 main topics from the video transcript. Return as JSON array."
                },
                {"role": "user", "content": full_text}
            ],
            response_format={"type": "json_object"}
        )

        result = json.loads(response.choices[0].message.content)
        return result.get('topics', [])

    async def _analyze_sentiment(self, video_url: str) -> str:
        """
        Analyze overall sentiment
        """
        transcript = await self._extract_transcript(video_url)
        full_text = " ".join([seg['text'] for seg in transcript])

        response = self.openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "Analyze sentiment. Respond with only: positive, neutral, or negative"
                },
                {"role": "user", "content": full_text}
            ]
        )

        return response.choices[0].message.content.strip().lower()

    async def _extract_entities(self, video_url: str) -> List[Dict]:
        """
        Extract named entities (people, organizations, etc.)
        """
        transcript = await self._extract_transcript(video_url)
        full_text = " ".join([seg['text'] for seg in transcript])

        response = self.openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "Extract named entities (people, organizations, locations, products). Return JSON array."
                },
                {"role": "user", "content": full_text}
            ],
            response_format={"type": "json_object"}
        )

        result = json.loads(response.choices[0].message.content)
        return result.get('entities', [])

    async def _generate_embedding(self, text: str) -> List[float]:
        """
        Generate vector embedding
        """
        response = self.openai.embeddings.create(
            model="text-embedding-3-small",
            input=text[:8000]  # Truncate to model limit
        )
        return response.data[0].embedding

    async def _extract_audio(self, video_url: str) -> str:
        """
        Extract audio from video using ffmpeg
        """
        import subprocess
        import tempfile

        audio_file = tempfile.mktemp(suffix='.mp3')
        subprocess.run([
            'ffmpeg', '-i', video_url,
            '-vn', '-acodec', 'libmp3lame',
            '-q:a', '2', audio_file
        ], check=True)

        return audio_file

# Usage
extractor = AIMetadataExtractor(zerodb_client, openai_key, anthropic_key)
metadata = await extractor.extract_all_metadata(
    video_id="vid-123",
    video_url="https://cdn.example.com/video.mp4",
    features=["transcript", "summary", "topics", "sentiment"]
)
```

---

## Progress Tracking Implementation

### 1. Cross-Device Progress Sync

Track and synchronize video playback progress across devices:

```typescript
class ProgressTracker {
  private transport: A2UITransport
  private progressBuffer: Map<string, ProgressUpdate> = new Map()
  private syncInterval = 5000 // 5 seconds

  constructor(transport: A2UITransport, private userId: string) {
    this.transport = transport
    this.startProgressSync()
  }

  /**
   * Track video playback progress
   */
  async updateProgress(
    videoId: string,
    timestamp: number,
    duration: number,
    deviceId: string
  ): Promise<void> {
    const progress: ProgressUpdate = {
      videoId,
      userId: this.userId,
      timestamp,
      duration,
      percentage: (timestamp / duration) * 100,
      deviceId,
      updatedAt: new Date().toISOString()
    }

    // Buffer update
    this.progressBuffer.set(videoId, progress)
  }

  /**
   * Sync progress to server periodically
   */
  private startProgressSync(): void {
    setInterval(async () => {
      if (this.progressBuffer.size === 0) return

      const updates = Array.from(this.progressBuffer.values())
      this.progressBuffer.clear()

      await this.transport.send({
        type: 'updateProgress',
        surfaceId: 'progress-sync',
        userId: this.userId,
        updates: updates.map(u => ({
          videoId: u.videoId,
          timestamp: u.timestamp,
          percentage: u.percentage,
          deviceId: u.deviceId,
          updatedAt: u.updatedAt
        }))
      })
    }, this.syncInterval)
  }

  /**
   * Retrieve progress for video across all devices
   */
  async getProgress(videoId: string): Promise<ProgressUpdate | null> {
    return new Promise((resolve) => {
      this.transport.on('progressSync', (message) => {
        if (message.videoId === videoId) {
          resolve(message.progress)
        }
      })

      this.transport.send({
        type: 'requestProgress',
        surfaceId: 'progress-sync',
        userId: this.userId,
        videoId
      })

      // Timeout after 5 seconds
      setTimeout(() => resolve(null), 5000)
    })
  }

  /**
   * Resume video from last position
   */
  async resumeVideo(videoId: string): Promise<number> {
    const progress = await this.getProgress(videoId)

    if (!progress) {
      return 0
    }

    // Resume from 5 seconds before last position
    const resumeTime = Math.max(0, progress.timestamp - 5)

    console.log(
      `Resuming ${videoId} at ${resumeTime}s ` +
      `(${progress.percentage.toFixed(1)}% complete) ` +
      `from device: ${progress.deviceId}`
    )

    return resumeTime
  }

  /**
   * Create UI component for resume prompt
   */
  createResumePrompt(videoId: string, progress: ProgressUpdate): void {
    this.transport.send({
      type: 'createSurface',
      surfaceId: `resume-${videoId}`,
      components: [
        {
          id: 'resume-card',
          type: 'card',
          properties: {
            title: 'Resume Video?',
            subtitle: `Continue from ${this.formatTime(progress.timestamp)}`
          },
          children: [
            {
              id: 'progress-bar',
              type: 'slider',
              properties: {
                value: progress.percentage,
                disabled: true,
                min: 0,
                max: 100
              }
            },
            {
              id: 'resume-button',
              type: 'button',
              properties: {
                label: 'Resume',
                action: 'resumeVideo',
                context: {
                  videoId,
                  timestamp: progress.timestamp
                },
                variant: 'primary'
              }
            },
            {
              id: 'restart-button',
              type: 'button',
              properties: {
                label: 'Start Over',
                action: 'restartVideo',
                context: { videoId },
                variant: 'secondary'
              }
            }
          ]
        }
      ]
    })
  }

  private formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m}:${s.toString().padStart(2, '0')}`
  }
}

interface ProgressUpdate {
  videoId: string
  userId: string
  timestamp: number
  duration: number
  percentage: number
  deviceId: string
  updatedAt: string
}
```

### 2. Watch History Analytics

Track and analyze viewing patterns:

```typescript
class WatchHistoryTracker {
  private transport: A2UITransport

  /**
   * Track comprehensive watch session
   */
  async trackWatchSession(session: WatchSession): Promise<void> {
    await this.transport.send({
      type: 'recordWatchSession',
      surfaceId: 'analytics',
      session: {
        videoId: session.videoId,
        userId: session.userId,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.duration,
        watchedDuration: session.watchedDuration,
        completionRate: (session.watchedDuration / session.duration) * 100,
        interactions: session.interactions,
        device: session.deviceInfo,
        location: session.location
      }
    })
  }

  /**
   * Get user watch history with analytics
   */
  async getWatchHistory(
    userId: string,
    options: HistoryOptions = {}
  ): Promise<WatchHistory> {
    const response = await fetch(
      `/api/users/${userId}/watch-history?` +
      new URLSearchParams(options as any)
    )
    return response.json()
  }

  /**
   * Generate watch time heatmap
   */
  async generateHeatmap(videoId: string): Promise<Heatmap> {
    const response = await fetch(`/api/videos/${videoId}/heatmap`)
    return response.json()
  }

  /**
   * Display watch history UI
   */
  displayWatchHistory(history: WatchHistory): void {
    this.transport.send({
      type: 'createSurface',
      surfaceId: 'watch-history',
      components: [
        {
          id: 'history-card',
          type: 'card',
          properties: {
            title: 'Watch History',
            subtitle: `${history.totalVideos} videos watched`
          }
        },
        {
          id: 'history-list',
          type: 'list',
          children: history.sessions.map((session, i) => ({
            id: `session-${i}`,
            type: 'card',
            properties: {
              title: session.videoTitle,
              subtitle: `${this.formatDate(session.watchedAt)} • ${session.completionRate.toFixed(0)}% complete`
            },
            children: [
              {
                id: `progress-${i}`,
                type: 'slider',
                properties: {
                  value: session.completionRate,
                  disabled: true,
                  min: 0,
                  max: 100
                }
              },
              {
                id: `resume-${i}`,
                type: 'button',
                properties: {
                  label: 'Continue Watching',
                  action: 'resumeVideo',
                  context: {
                    videoId: session.videoId,
                    timestamp: session.lastPosition
                  }
                }
              }
            ]
          }))
        }
      ]
    })
  }

  private formatDate(iso: string): string {
    const date = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }
}

interface WatchSession {
  videoId: string
  userId: string
  startTime: string
  endTime: string
  duration: number
  watchedDuration: number
  interactions: Interaction[]
  deviceInfo: DeviceInfo
  location?: string
}

interface Interaction {
  type: 'play' | 'pause' | 'seek' | 'skip' | 'speed' | 'quality'
  timestamp: number
  value?: any
}

interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet' | 'tv'
  browser: string
  os: string
}

interface HistoryOptions {
  limit?: number
  offset?: number
  startDate?: string
  endDate?: string
}

interface WatchHistory {
  totalVideos: number
  totalDuration: number
  sessions: SessionSummary[]
}

interface SessionSummary {
  videoId: string
  videoTitle: string
  watchedAt: string
  completionRate: number
  lastPosition: number
}

interface Heatmap {
  videoId: string
  segments: HeatmapSegment[]
}

interface HeatmapSegment {
  start: number
  end: number
  views: number
  averageCompletionRate: number
}
```

---

## Recommendation System Implementation

### 1. Hybrid Recommendation Agent

Implement personalized video recommendations using hybrid AI scoring:

```typescript
import type {
  RequestRecommendationsMessage,
  RecommendationsMessage,
  VideoRecommendation,
  RecommendationStrategy
} from '@ainative/ai-kit-a2ui-core/types'

class RecommendationAgent {
  private transport: A2UITransport

  constructor(transport: A2UITransport) {
    this.transport = transport
    this.setupListeners()
  }

  private setupListeners(): void {
    this.transport.on('recommendations', (message: RecommendationsMessage) => {
      this.handleRecommendations(message)
    })
  }

  /**
   * Request personalized video recommendations
   */
  async getRecommendations(
    userId: string,
    context?: RecommendationContext
  ): Promise<void> {
    const message: RequestRecommendationsMessage = {
      type: 'requestRecommendations',
      surfaceId: 'recommendations',
      userId,
      context: {
        currentVideoId: context?.currentVideoId,
        recentTopics: context?.recentTopics || [],
        sessionDuration: context?.sessionDuration || 0,
        device: context?.device || 'desktop',
        timeOfDay: this.getTimeOfDay()
      },
      strategy: context?.strategy || 'hybrid',
      limit: context?.limit || 5
    }

    await this.transport.send(message)
  }

  /**
   * Get contextual recommendations based on current video
   */
  async getRelatedVideos(
    currentVideoId: string,
    userId: string
  ): Promise<void> {
    await this.getRecommendations(userId, {
      currentVideoId,
      strategy: 'content',
      limit: 5
    })
  }

  /**
   * Get personalized recommendations based on watch history
   */
  async getPersonalizedFeed(userId: string): Promise<void> {
    // Get user's recent watch history
    const watchHistory = await this.fetchWatchHistory(userId)

    await this.getRecommendations(userId, {
      recentTopics: watchHistory.topics,
      sessionDuration: watchHistory.totalMinutes,
      strategy: 'hybrid',
      limit: 10
    })
  }

  private handleRecommendations(message: RecommendationsMessage): void {
    const { recommendations, strategy, metadata } = message

    console.log(
      `Received ${recommendations.length} recommendations ` +
      `(strategy: ${strategy}, processed in ${metadata?.processingTimeMs}ms)`
    )

    this.displayRecommendations(recommendations, strategy)
  }

  /**
   * Display recommendations in UI
   */
  private displayRecommendations(
    recommendations: VideoRecommendation[],
    strategy: RecommendationStrategy
  ): void {
    this.transport.send({
      type: 'createSurface',
      surfaceId: 'recommendations-feed',
      components: [
        {
          id: 'recommendations-header',
          type: 'heading',
          properties: {
            level: 2,
            value: this.getRecommendationTitle(strategy)
          }
        },
        {
          id: 'recommendations-grid',
          type: 'row',
          properties: {
            gap: 16,
            wrap: true
          },
          children: recommendations.map((rec, i) =>
            this.createRecommendationCard(rec, i)
          )
        }
      ]
    })
  }

  /**
   * Create individual recommendation card
   */
  private createRecommendationCard(
    rec: VideoRecommendation,
    index: number
  ): any {
    return {
      id: `rec-card-${index}`,
      type: 'card',
      properties: {
        clickable: true,
        action: 'playVideo',
        context: { videoId: rec.videoId }
      },
      children: [
        // Thumbnail
        {
          id: `rec-thumb-${index}`,
          type: 'image',
          properties: {
            src: rec.thumbnail,
            alt: rec.title,
            aspectRatio: '16/9'
          }
        },
        // Title
        {
          id: `rec-title-${index}`,
          type: 'heading',
          properties: {
            level: 3,
            value: rec.title,
            fontSize: 16
          }
        },
        // Recommendation reason
        {
          id: `rec-reason-${index}`,
          type: 'text',
          properties: {
            value: rec.reason,
            fontSize: 14,
            color: '#6b7280'
          }
        },
        // Metadata row
        {
          id: `rec-meta-${index}`,
          type: 'row',
          properties: {
            gap: 8,
            align: 'center'
          },
          children: [
            {
              id: `rec-duration-${index}`,
              type: 'text',
              properties: {
                value: this.formatDuration(rec.metadata.duration),
                fontSize: 12,
                color: '#9ca3af'
              }
            },
            {
              id: `rec-confidence-${index}`,
              type: 'text',
              properties: {
                value: `${(rec.confidence * 100).toFixed(0)}% match`,
                fontSize: 12,
                color: this.getConfidenceColor(rec.confidence)
              }
            }
          ]
        },
        // Topics tags
        {
          id: `rec-topics-${index}`,
          type: 'row',
          properties: {
            gap: 4,
            wrap: true
          },
          children: rec.metadata.topics.slice(0, 3).map((topic, t) => ({
            id: `rec-topic-${index}-${t}`,
            type: 'text',
            properties: {
              value: `#${topic}`,
              fontSize: 11,
              color: '#3b82f6'
            }
          }))
        },
        // Score breakdown (if available)
        ...(rec.scores ? [this.createScoreBreakdown(rec.scores, index)] : [])
      ]
    }
  }

  /**
   * Create score breakdown visualization
   */
  private createScoreBreakdown(scores: any, index: number): any {
    return {
      id: `rec-scores-${index}`,
      type: 'column',
      properties: {
        gap: 4
      },
      children: [
        {
          id: `score-label-${index}`,
          type: 'text',
          properties: {
            value: 'Score Breakdown',
            fontSize: 11,
            color: '#6b7280'
          }
        },
        ...(scores.content !== undefined ? [{
          id: `score-content-${index}`,
          type: 'slider',
          properties: {
            value: scores.content * 100,
            disabled: true,
            label: 'Content',
            min: 0,
            max: 100
          }
        }] : []),
        ...(scores.collaborative !== undefined ? [{
          id: `score-collab-${index}`,
          type: 'slider',
          properties: {
            value: scores.collaborative * 100,
            disabled: true,
            label: 'Collaborative',
            min: 0,
            max: 100
          }
        }] : []),
        ...(scores.contextual !== undefined ? [{
          id: `score-context-${index}`,
          type: 'slider',
          properties: {
            value: scores.contextual * 100,
            disabled: true,
            label: 'Contextual',
            min: 0,
            max: 100
          }
        }] : [])
      ]
    }
  }

  private getRecommendationTitle(strategy: RecommendationStrategy): string {
    switch (strategy) {
      case 'content':
        return 'Similar Videos'
      case 'collaborative':
        return 'People Also Watched'
      case 'hybrid':
        return 'Recommended For You'
      default:
        return 'Recommendations'
    }
  }

  private getConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) return '#059669' // green
    if (confidence >= 0.6) return '#3b82f6' // blue
    return '#6b7280' // gray
  }

  private formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    if (mins < 60) return `${mins}m`
    const hours = Math.floor(mins / 60)
    const remainingMins = mins % 60
    return `${hours}h ${remainingMins}m`
  }

  private getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours()
    if (hour < 12) return 'morning'
    if (hour < 17) return 'afternoon'
    if (hour < 21) return 'evening'
    return 'night'
  }

  private async fetchWatchHistory(userId: string): Promise<any> {
    const response = await fetch(`/api/users/${userId}/watch-history`)
    return response.json()
  }
}

interface RecommendationContext {
  currentVideoId?: string
  recentTopics?: string[]
  sessionDuration?: number
  device?: 'desktop' | 'mobile' | 'tablet'
  strategy?: RecommendationStrategy
  limit?: number
}
```

### 2. Backend Hybrid Recommendation Engine

Server-side recommendation system with multiple strategies:

```python
from typing import List, Dict, Optional, Tuple
import numpy as np
from datetime import datetime, timedelta
from zerodb_mcp import ZeroDBClient

class HybridRecommendationEngine:
    """
    Hybrid recommendation engine combining:
    - Content-based filtering (semantic similarity)
    - Collaborative filtering (user behavior)
    - Contextual recommendations (time, device, session)
    """

    def __init__(self, zerodb_client: ZeroDBClient):
        self.db = zerodb_client
        self.weights = {
            'content': 0.4,
            'collaborative': 0.4,
            'contextual': 0.2
        }

    async def get_recommendations(
        self,
        user_id: str,
        context: Optional[Dict] = None,
        strategy: str = 'hybrid',
        limit: int = 10
    ) -> List[Dict]:
        """
        Get personalized video recommendations

        Args:
            user_id: User identifier
            context: Contextual information (current video, topics, etc.)
            strategy: 'content', 'collaborative', or 'hybrid'
            limit: Maximum number of recommendations

        Returns:
            List of video recommendations with scores
        """
        if strategy == 'content':
            return await self._content_based_recommendations(
                user_id, context, limit
            )
        elif strategy == 'collaborative':
            return await self._collaborative_recommendations(
                user_id, context, limit
            )
        else:
            return await self._hybrid_recommendations(
                user_id, context, limit
            )

    async def _hybrid_recommendations(
        self,
        user_id: str,
        context: Optional[Dict],
        limit: int
    ) -> List[Dict]:
        """
        Combine multiple recommendation strategies
        """
        # Get scores from each strategy
        content_recs = await self._content_based_recommendations(
            user_id, context, limit * 2
        )
        collab_recs = await self._collaborative_recommendations(
            user_id, context, limit * 2
        )
        context_recs = await self._contextual_recommendations(
            user_id, context, limit * 2
        )

        # Merge and score
        video_scores = {}

        for rec in content_recs:
            vid_id = rec['videoId']
            video_scores[vid_id] = {
                'content': rec['score'],
                'collaborative': 0,
                'contextual': 0,
                'metadata': rec['metadata']
            }

        for rec in collab_recs:
            vid_id = rec['videoId']
            if vid_id not in video_scores:
                video_scores[vid_id] = {
                    'content': 0,
                    'collaborative': 0,
                    'contextual': 0,
                    'metadata': rec['metadata']
                }
            video_scores[vid_id]['collaborative'] = rec['score']

        for rec in context_recs:
            vid_id = rec['videoId']
            if vid_id not in video_scores:
                video_scores[vid_id] = {
                    'content': 0,
                    'collaborative': 0,
                    'contextual': 0,
                    'metadata': rec['metadata']
                }
            video_scores[vid_id]['contextual'] = rec['score']

        # Calculate hybrid scores
        recommendations = []
        for vid_id, scores in video_scores.items():
            hybrid_score = (
                scores['content'] * self.weights['content'] +
                scores['collaborative'] * self.weights['collaborative'] +
                scores['contextual'] * self.weights['contextual']
            )

            recommendations.append({
                'videoId': vid_id,
                'title': scores['metadata']['title'],
                'thumbnail': scores['metadata']['thumbnail'],
                'confidence': hybrid_score,
                'reason': self._generate_reason(scores, hybrid_score),
                'metadata': scores['metadata'],
                'scores': {
                    'content': scores['content'],
                    'collaborative': scores['collaborative'],
                    'contextual': scores['contextual']
                }
            })

        # Sort by hybrid score and return top N
        recommendations.sort(key=lambda x: x['confidence'], reverse=True)
        return recommendations[:limit]

    async def _content_based_recommendations(
        self,
        user_id: str,
        context: Optional[Dict],
        limit: int
    ) -> List[Dict]:
        """
        Content-based filtering using vector similarity
        """
        # Get user's watch history
        watch_history = await self.db.get_user_watch_history(user_id, limit=50)

        if not watch_history:
            # Cold start: use popular videos
            return await self._get_popular_videos(limit)

        # Get embeddings for watched videos
        watched_embeddings = []
        for video in watch_history:
            embedding = await self.db.get_video_embedding(video['video_id'])
            if embedding:
                watched_embeddings.append(embedding)

        if not watched_embeddings:
            return await self._get_popular_videos(limit)

        # Average embeddings to create user profile
        user_profile = np.mean(watched_embeddings, axis=0)

        # If current video context, blend with it
        if context and context.get('currentVideoId'):
            current_embedding = await self.db.get_video_embedding(
                context['currentVideoId']
            )
            if current_embedding:
                user_profile = (user_profile * 0.7 + current_embedding * 0.3)

        # Find similar videos
        similar_videos = await self.db.vector_search(
            vector=user_profile.tolist(),
            limit=limit * 2,
            metadata_filter={
                'videoId': {'$nin': [v['video_id'] for v in watch_history]}
            }
        )

        # Format results
        recommendations = []
        for video in similar_videos:
            metadata = await self.db.get_video_metadata(video['video_id'])
            recommendations.append({
                'videoId': video['video_id'],
                'score': video['similarity'],
                'metadata': metadata
            })

        return recommendations[:limit]

    async def _collaborative_recommendations(
        self,
        user_id: str,
        context: Optional[Dict],
        limit: int
    ) -> List[Dict]:
        """
        Collaborative filtering based on similar users
        """
        # Get similar users (users with similar watch patterns)
        similar_users = await self.db.find_similar_users(user_id, limit=50)

        if not similar_users:
            return []

        # Get videos watched by similar users
        candidate_videos = {}
        for sim_user in similar_users:
            user_videos = await self.db.get_user_watch_history(
                sim_user['user_id'],
                limit=20
            )

            for video in user_videos:
                vid_id = video['video_id']
                if vid_id not in candidate_videos:
                    candidate_videos[vid_id] = {
                        'count': 0,
                        'total_similarity': 0,
                        'avg_rating': 0,
                        'ratings': []
                    }

                candidate_videos[vid_id]['count'] += 1
                candidate_videos[vid_id]['total_similarity'] += sim_user['similarity']

                if 'rating' in video:
                    candidate_videos[vid_id]['ratings'].append(video['rating'])

        # Calculate scores
        recommendations = []
        for vid_id, data in candidate_videos.items():
            # Skip if already watched
            if await self.db.user_watched_video(user_id, vid_id):
                continue

            # Score based on frequency and similarity
            score = (
                (data['count'] / len(similar_users)) * 0.6 +
                (data['total_similarity'] / data['count']) * 0.4
            )

            metadata = await self.db.get_video_metadata(vid_id)
            recommendations.append({
                'videoId': vid_id,
                'score': score,
                'metadata': metadata
            })

        # Sort and return top N
        recommendations.sort(key=lambda x: x['score'], reverse=True)
        return recommendations[:limit]

    async def _contextual_recommendations(
        self,
        user_id: str,
        context: Optional[Dict],
        limit: int
    ) -> List[Dict]:
        """
        Context-aware recommendations based on:
        - Time of day
        - Device type
        - Session duration
        - Recent topics
        """
        if not context:
            return []

        # Build contextual filters
        filters = {}

        # Time-based preferences
        time_of_day = context.get('timeOfDay', 'afternoon')
        if time_of_day == 'morning':
            # Shorter, educational content in morning
            filters['duration'] = {'$lt': 600}  # < 10 minutes
            filters['topics'] = {'$in': ['education', 'news', 'productivity']}
        elif time_of_day == 'evening':
            # Longer, entertainment content in evening
            filters['duration'] = {'$gte': 600}
            filters['topics'] = {'$in': ['entertainment', 'tutorial', 'review']}

        # Device-based preferences
        device = context.get('device', 'desktop')
        if device == 'mobile':
            # Shorter videos for mobile
            filters['duration'] = {'$lt': 900}  # < 15 minutes

        # Topic filters
        recent_topics = context.get('recentTopics', [])
        if recent_topics:
            filters['topics'] = {'$in': recent_topics}

        # Query with filters
        results = await self.db.query_videos(
            filters=filters,
            limit=limit * 2,
            sort_by='popularity'
        )

        # Score based on context match
        recommendations = []
        for video in results:
            score = 0.5  # Base score

            # Boost for topic match
            video_topics = set(video.get('topics', []))
            if video_topics.intersection(set(recent_topics)):
                score += 0.3

            # Boost for optimal duration
            duration = video.get('duration', 0)
            if device == 'mobile' and duration < 600:
                score += 0.2

            recommendations.append({
                'videoId': video['video_id'],
                'score': min(score, 1.0),
                'metadata': video
            })

        recommendations.sort(key=lambda x: x['score'], reverse=True)
        return recommendations[:limit]

    async def _get_popular_videos(self, limit: int) -> List[Dict]:
        """
        Fallback: get popular videos for cold start
        """
        popular = await self.db.query_videos(
            filters={},
            limit=limit,
            sort_by='view_count'
        )

        return [{
            'videoId': v['video_id'],
            'score': 0.5,
            'metadata': v
        } for v in popular]

    def _generate_reason(self, scores: Dict, hybrid_score: float) -> str:
        """
        Generate human-readable recommendation reason
        """
        max_score_type = max(scores.items(), key=lambda x: x[1] if x[0] != 'metadata' else 0)[0]

        if max_score_type == 'content':
            return "Based on videos you've watched"
        elif max_score_type == 'collaborative':
            return "Popular with similar users"
        elif max_score_type == 'contextual':
            return "Recommended for you right now"
        else:
            return "Personalized for you"

# Usage
engine = HybridRecommendationEngine(zerodb_client)
recommendations = await engine.get_recommendations(
    user_id="user-123",
    context={
        'currentVideoId': 'vid-456',
        'recentTopics': ['product', 'tutorial'],
        'device': 'mobile',
        'timeOfDay': 'evening'
    },
    strategy='hybrid',
    limit=10
)
```

---

## Testing Strategies

### 1. Unit Testing AI Features

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SemanticSearchAgent } from './semantic-search'
import { A2UITransport } from '@ainative/ai-kit-a2ui-core/transport'

describe('SemanticSearchAgent', () => {
  let mockTransport: A2UITransport
  let agent: SemanticSearchAgent

  beforeEach(() => {
    mockTransport = {
      send: vi.fn(),
      on: vi.fn()
    } as any

    agent = new SemanticSearchAgent(mockTransport as any)
  })

  describe('searchVideos', () => {
    it('should send search message with query', async () => {
      await agent.searchVideos('product demo')

      expect(mockTransport.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'searchVideos',
          query: 'product demo'
        })
      )
    })

    it('should apply filters correctly', async () => {
      await agent.searchVideos('tutorial', {
        duration: { min: 60, max: 300 },
        topics: ['product'],
        limit: 5
      })

      expect(mockTransport.send).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            duration: { min: 60, max: 300 },
            topics: ['product']
          }),
          options: expect.objectContaining({
            limit: 5
          })
        })
      )
    })
  })

  describe('handleSearchResults', () => {
    it('should process and display results', () => {
      const mockResults = {
        type: 'searchResults',
        results: [
          {
            videoId: 'vid-1',
            title: 'Test Video',
            confidence: 0.95,
            relevantTimestamps: [{ time: 120, text: 'demo', confidence: 0.9 }],
            metadata: { duration: 300, topics: ['test'] }
          }
        ]
      }

      agent['handleSearchResults'](mockResults)

      expect(mockTransport.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'updateComponents'
        })
      )
    })
  })
})
```

### 2. Integration Testing with Mock Backend

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createTestServer } from './test-utils'
import { SemanticSearchAgent } from './semantic-search'

describe('Semantic Search Integration', () => {
  let testServer: any
  let agent: SemanticSearchAgent

  beforeAll(async () => {
    testServer = await createTestServer()
    agent = new SemanticSearchAgent(testServer.url)
  })

  afterAll(async () => {
    await testServer.close()
  })

  it('should perform end-to-end search', async () => {
    // Mock backend response
    testServer.mockSearchResults([
      {
        videoId: 'vid-1',
        title: 'Product Demo',
        confidence: 0.92,
        relevantTimestamps: [{ time: 45, text: 'pricing features', confidence: 0.88 }]
      }
    ])

    const results = await agent.searchVideos('pricing features')

    expect(results).toHaveLength(1)
    expect(results[0].videoId).toBe('vid-1')
    expect(results[0].confidence).toBeGreaterThan(0.9)
  })

  it('should handle search errors gracefully', async () => {
    testServer.mockError('Service unavailable')

    await expect(
      agent.searchVideos('test query')
    ).rejects.toThrow('Service unavailable')
  })
})
```

### 3. Performance Testing

```typescript
import { describe, it, expect } from 'vitest'
import { performance } from 'perf_hooks'

describe('Search Performance', () => {
  it('should complete search within 2 seconds', async () => {
    const start = performance.now()

    await agent.searchVideos('product demo', {
      limit: 10
    })

    const end = performance.now()
    const duration = end - start

    expect(duration).toBeLessThan(2000)
  })

  it('should handle concurrent searches', async () => {
    const searches = Array.from({ length: 10 }, (_, i) =>
      agent.searchVideos(`query ${i}`)
    )

    const start = performance.now()
    await Promise.all(searches)
    const end = performance.now()

    const avgTime = (end - start) / 10
    expect(avgTime).toBeLessThan(500)
  })
})
```

### 4. Backend Testing with Pytest

```python
import pytest
from unittest.mock import Mock, patch
import numpy as np
from recommendation_engine import HybridRecommendationEngine

@pytest.fixture
def mock_db():
    db = Mock()
    db.get_user_watch_history.return_value = [
        {'video_id': 'vid-1', 'duration': 300},
        {'video_id': 'vid-2', 'duration': 600}
    ]
    return db

@pytest.fixture
def engine(mock_db):
    return HybridRecommendationEngine(mock_db)

class TestHybridRecommendationEngine:
    @pytest.mark.asyncio
    async def test_get_recommendations_content_strategy(self, engine, mock_db):
        """Test content-based recommendations"""
        mock_db.get_video_embedding.return_value = np.random.rand(1536)
        mock_db.vector_search.return_value = [
            {'video_id': 'vid-3', 'similarity': 0.95}
        ]

        recommendations = await engine.get_recommendations(
            user_id='user-1',
            strategy='content',
            limit=5
        )

        assert len(recommendations) <= 5
        assert all('videoId' in rec for rec in recommendations)
        assert all('score' in rec for rec in recommendations)

    @pytest.mark.asyncio
    async def test_hybrid_scoring(self, engine, mock_db):
        """Test hybrid score calculation"""
        recommendations = await engine.get_recommendations(
            user_id='user-1',
            strategy='hybrid',
            limit=10
        )

        for rec in recommendations:
            assert 'scores' in rec
            assert 'content' in rec['scores']
            assert 'collaborative' in rec['scores']
            assert 'contextual' in rec['scores']
            assert 0 <= rec['confidence'] <= 1

    @pytest.mark.asyncio
    async def test_cold_start_fallback(self, engine, mock_db):
        """Test fallback for new users"""
        mock_db.get_user_watch_history.return_value = []

        recommendations = await engine.get_recommendations(
            user_id='new-user',
            strategy='content',
            limit=5
        )

        assert len(recommendations) > 0
        # Should return popular videos
        mock_db.query_videos.assert_called_once()

@pytest.mark.benchmark
def test_recommendation_performance(engine, benchmark):
    """Benchmark recommendation generation"""
    result = benchmark(
        lambda: engine.get_recommendations(
            user_id='user-1',
            strategy='hybrid',
            limit=10
        )
    )

    assert len(result) == 10
```

### 5. E2E Testing with Playwright

```typescript
import { test, expect } from '@playwright/test'

test.describe('AI Video Search', () => {
  test('should search and display results', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // Enter search query
    await page.fill('[data-testid="search-input"]', 'product demo')
    await page.click('[data-testid="search-button"]')

    // Wait for results
    await page.waitForSelector('[data-testid="search-results"]')

    // Verify results displayed
    const results = await page.$$('[data-testid="video-card"]')
    expect(results.length).toBeGreaterThan(0)

    // Check relevance scores
    const firstResult = results[0]
    const score = await firstResult.getAttribute('data-confidence')
    expect(parseFloat(score!)).toBeGreaterThan(0.5)
  })

  test('should jump to timestamp from search', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // Search and click result
    await page.fill('[data-testid="search-input"]', 'pricing discussion')
    await page.click('[data-testid="search-button"]')
    await page.click('[data-testid="video-card"]:first-child')

    // Click timestamp link
    await page.click('[data-testid="timestamp-link"]:first-child')

    // Verify video seeked
    const currentTime = await page.$eval(
      'video',
      (el: HTMLVideoElement) => el.currentTime
    )
    expect(currentTime).toBeGreaterThan(0)
  })
})
```

---

## Performance Optimization

### 1. Caching Strategy

```typescript
class OptimizedSearchAgent {
  private searchCache = new LRUCache<string, SearchResult[]>({
    max: 100,
    ttl: 1000 * 60 * 5 // 5 minutes
  })

  private embeddingCache = new LRUCache<string, number[]>({
    max: 1000,
    ttl: 1000 * 60 * 60 // 1 hour
  })

  async searchVideos(query: string): Promise<SearchResult[]> {
    // Check cache first
    const cached = this.searchCache.get(query)
    if (cached) {
      console.log('Cache hit for query:', query)
      return cached
    }

    // Perform search
    const results = await this.performSearch(query)

    // Cache results
    this.searchCache.set(query, results)

    return results
  }

  async getEmbedding(text: string): Promise<number[]> {
    const cached = this.embeddingCache.get(text)
    if (cached) return cached

    const embedding = await this.generateEmbedding(text)
    this.embeddingCache.set(text, embedding)

    return embedding
  }
}
```

### 2. Batch Processing

```python
class BatchOptimizedExtractor:
    """Batch process videos for better throughput"""

    async def batch_extract_embeddings(
        self,
        texts: List[str],
        batch_size: int = 100
    ) -> List[np.ndarray]:
        """Generate embeddings in batches"""
        embeddings = []

        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]

            response = self.openai.embeddings.create(
                model="text-embedding-3-small",
                input=batch
            )

            batch_embeddings = [
                np.array(data.embedding)
                for data in response.data
            ]
            embeddings.extend(batch_embeddings)

        return embeddings
```

### 3. Database Indexing

```sql
-- Vector similarity index
CREATE INDEX idx_video_embeddings_vector
ON video_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Metadata indexes for filtering
CREATE INDEX idx_videos_duration ON videos (duration);
CREATE INDEX idx_videos_topics ON videos USING GIN (topics);
CREATE INDEX idx_videos_created_at ON videos (created_at DESC);

-- Composite index for common queries
CREATE INDEX idx_videos_duration_topics
ON videos (duration, topics)
WHERE duration BETWEEN 60 AND 600;
```

---

## Error Handling

### 1. Graceful Degradation

```typescript
class ResilientSearchAgent {
  async searchVideos(query: string): Promise<SearchResult[]> {
    try {
      return await this.performSemanticSearch(query)
    } catch (error) {
      console.error('Semantic search failed:', error)

      // Fallback to keyword search
      try {
        return await this.performKeywordSearch(query)
      } catch (fallbackError) {
        console.error('Keyword search failed:', fallbackError)

        // Last resort: return popular videos
        return await this.getPopularVideos()
      }
    }
  }
}
```

### 2. Retry Logic

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxRetries) throw error

      const delay = baseDelay * Math.pow(2, attempt - 1)
      console.log(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw new Error('Unreachable')
}
```

---

## Production Deployment

### 1. Environment Configuration

```bash
# .env.production

# AI Services
OPENAI_API_KEY=sk-proj-xxx
ANTHROPIC_API_KEY=sk-ant-xxx

# Vector Database
ZERODB_URL=https://api.zerodb.io
ZERODB_PROJECT_ID=proj_xxx
ZERODB_API_KEY=zdb_xxx

# Caching
REDIS_URL=redis://localhost:6379

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
DATADOG_API_KEY=xxx
```

### 2. Monitoring & Logging

```typescript
import * as Sentry from '@sentry/node'

class MonitoredSearchAgent extends SemanticSearchAgent {
  async searchVideos(query: string): Promise<SearchResult[]> {
    const transaction = Sentry.startTransaction({
      op: 'search',
      name: 'Semantic Video Search'
    })

    try {
      const start = performance.now()
      const results = await super.searchVideos(query)
      const duration = performance.now() - start

      // Log metrics
      console.log('Search completed', {
        query,
        results: results.length,
        duration,
        timestamp: new Date().toISOString()
      })

      // Track success
      Sentry.metrics.increment('search.success')
      Sentry.metrics.distribution('search.duration', duration)

      return results
    } catch (error) {
      // Track error
      Sentry.metrics.increment('search.error')
      Sentry.captureException(error, {
        tags: { query },
        contexts: { search: { query } }
      })

      throw error
    } finally {
      transaction.finish()
    }
  }
}
```

### 3. Rate Limiting

```typescript
import { RateLimiter } from 'limiter'

class RateLimitedAgent {
  private limiter = new RateLimiter({
    tokensPerInterval: 100,
    interval: 'minute'
  })

  async searchVideos(query: string): Promise<SearchResult[]> {
    const remainingRequests = await this.limiter.removeTokens(1)

    if (remainingRequests < 0) {
      throw new Error('Rate limit exceeded')
    }

    return await this.performSearch(query)
  }
}
```

---

## Additional Resources

- [A2UI Protocol Specification](../api/protocol-flows-index.md)
- [Video Components API](../api/VIDEO_COMPONENTS.md)
- [Integration Patterns](../api/VIDEO_INTEGRATION_PATTERNS.md)
- [Error Handling Guide](../api/error-handling-flow.md)
- [ZeroDB Documentation](https://docs.zerodb.io)
- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)

---

**Last Updated**: 2026-02-10
**Maintainer**: AINative Studio
**License**: MIT
