# AIKit Video Integration Requirements for A2UI Core

**Date:** 2026-02-08
**Version:** 1.0
**Status:** Planning
**Dependencies:** `@ainative/ai-kit-video` Epics 13 & 14

---

## Executive Summary

This document specifies the **exact requirements** for integrating AIKit Video primitives into the A2UI protocol layer. The A2UI Core package will provide **type definitions and protocol schemas only** - no video implementation code. All video functionality is provided by `@ainative/ai-kit-video`.

---

## 1. Architecture Overview

### 1.1 Layered Architecture

```
┌─────────────────────────────────────────────┐
│  A2UI Agent (Python/TypeScript)             │
│  Sends JSON messages over WebSocket         │
└─────────────────────────────────────────────┘
                    ↓ Protocol Messages
┌─────────────────────────────────────────────┐
│  @ainative/ai-kit-a2ui-core                 │
│  Protocol Layer (Types & Schemas)           │
│  - Component type definitions               │
│  - Message type definitions                 │
│  - Data model types                         │
│  - WebSocket message routing                │
└─────────────────────────────────────────────┘
                    ↓ Type Imports
┌─────────────────────────────────────────────┐
│  @ainative/ai-kit-a2ui-react                │
│  Framework Renderer                         │
│  - Converts A2UI components to React        │
│  - Handles user interactions                │
│  - Manages UI state                         │
└─────────────────────────────────────────────┘
                    ↓ Component Imports
┌─────────────────────────────────────────────┐
│  @ainative/ai-kit-video                     │
│  Video Implementation (AIKit)               │
│  - VideoRecorder component                  │
│  - VideoCall component                      │
│  - AIVideo component                        │
│  - AIVideoPlayer component                  │
│  - All video business logic                 │
└─────────────────────────────────────────────┘
```

### 1.2 Separation of Concerns

| Layer | Responsibility | Package |
|-------|---------------|---------|
| **Protocol** | Type definitions, message schemas | `@ainative/ai-kit-a2ui-core` |
| **Renderer** | Framework integration, UI state | `@ainative/ai-kit-a2ui-react` |
| **Implementation** | Video recording, WebRTC, AI generation | `@ainative/ai-kit-video` |

**Key Principle:** A2UI Core is a **thin protocol layer** with zero dependencies. It defines **what** the protocol is, not **how** to implement video.

---

## 2. Required AIKit Video Exports

### 2.1 Epic 13: Core Video Components

For A2UI protocol integration, AIKit Video **must export** the following:

#### 2.1.1 VideoRecorder Component

```typescript
// From @ainative/ai-kit-video
export interface VideoRecorderProps {
  mode: 'screen' | 'camera' | 'pip'
  audio?: boolean
  quality?: 'low' | 'medium' | 'high'
  onStart?: () => void
  onComplete?: (result: RecordingResult) => void
  onError?: (error: Error) => void

  // AI options (Epic 14)
  ai?: {
    transcribe?: boolean
    highlights?: boolean
    summary?: boolean
    zerodb?: boolean  // Auto-store in ZeroDB
  }
}

export interface RecordingResult {
  videoUrl: string
  duration: number
  transcript?: string  // If AI transcription enabled
  highlights?: HighlightData[]  // If AI highlights enabled
  summary?: string  // If AI summary enabled
}

export const VideoRecorder: React.FC<VideoRecorderProps>
```

#### 2.1.2 VideoCall Component

```typescript
// From @ainative/ai-kit-video
export interface VideoCallProps {
  roomId: string
  layout?: 'grid' | 'speaker' | 'sidebar'
  features?: {
    chat?: boolean
    screenShare?: boolean
    recording?: boolean
  }
  onJoin?: () => void
  onLeave?: () => void
  onError?: (error: Error) => void

  // AI options (Epic 14)
  ai?: {
    liveTranscription?: boolean
    liveCaptions?: boolean
    translation?: string  // Language code
    noiseCancellation?: boolean
    speakerIdentification?: boolean
    actionItemDetection?: boolean
  }
}

export const VideoCall: React.FC<VideoCallProps>
```

#### 2.1.3 AIVideo Component (Video Generation)

```typescript
// From @ainative/ai-kit-video
export interface AIVideoProps {
  prompt?: string
  template?: string
  data?: Record<string, any>
  voice?: string
  streaming?: boolean
  onProgress?: (progress: number) => void
  onComplete?: (result: GenerationResult) => void
  onError?: (error: Error) => void
}

export interface GenerationResult {
  videoUrl: string
  composition: object
  duration: number
}

export const AIVideo: React.FC<AIVideoProps>
```

#### 2.1.4 AIVideoPlayer Component

```typescript
// From @ainative/ai-kit-video
export interface AIVideoPlayerProps {
  videoUrl: string
  transcript?: string

  // Interactive AI features (Epic 14)
  interactive?: {
    allowQuestions?: boolean
    conversationalControl?: boolean
    smartChapters?: boolean
    semanticSearch?: boolean
  }

  onProgress?: (position: number) => void
  onQuestion?: (question: string) => Promise<string>
}

export const AIVideoPlayer: React.FC<AIVideoPlayerProps>
```

### 2.2 Epic 14: AI Intelligence Hooks

For AI features, AIKit Video **must export** React hooks:

#### 2.2.1 Video Search Hook

```typescript
// From @ainative/ai-kit-video
export function useVideoSearch() {
  return {
    search: async (query: string, filters?: SearchFilters) => {
      // Returns semantic search results
      return SearchResult[]
    },
    results: SearchResult[],
    loading: boolean,
    error: Error | null
  }
}

export interface SearchResult {
  videoId: string
  title: string
  relevantTimestamps: Array<{ time: number, text: string }>
  matchedTranscript: string
  confidence: number
  metadata: VideoMetadata
}
```

#### 2.2.2 Video Metadata Hook

```typescript
// From @ainative/ai-kit-video
export function useVideoMetadata(videoId: string) {
  return {
    metadata: VideoMetadata | null,
    loading: boolean,
    error: Error | null,
    refresh: () => Promise<void>
  }
}

export interface VideoMetadata {
  transcript: TranscriptData
  summary: string
  topics: string[]
  tags: string[]
  sentiment: SentimentData
  highlights: HighlightData[]
  chapters: ChapterData[]
}
```

#### 2.2.3 Progress Tracking Hook

```typescript
// From @ainative/ai-kit-video
export function useVideoProgress(videoId: string, userId: string) {
  return {
    progress: ProgressData | null,
    updateProgress: (position: number) => Promise<void>,
    syncProgress: () => Promise<void>,  // Cross-device sync
    loading: boolean,
    error: Error | null
  }
}

export interface ProgressData {
  position: number
  completionRate: number
  lastWatched: string
  device: string
  sceneMetadata?: {
    chapterTitle: string
    contextText: string
  }
}
```

#### 2.2.4 Recommendations Hook

```typescript
// From @ainative/ai-kit-video
export function useVideoRecommendations(userId: string, options?: RecommendationOptions) {
  return {
    recommendations: RecommendationData[],
    refresh: () => Promise<void>,
    loading: boolean,
    error: Error | null
  }
}

export interface RecommendationOptions {
  currentVideoId?: string
  recentTopics?: string[]
  strategy?: 'content' | 'collaborative' | 'hybrid'
  limit?: number
}

export interface RecommendationData {
  videoId: string
  title: string
  thumbnail: string
  reason: string
  confidence: number
  metadata: VideoMetadata
}
```

---

## 3. A2UI Core Protocol Layer Requirements

### 3.1 What A2UI Core MUST Provide

#### 3.1.1 Component Type Definitions

```typescript
// In @ainative/ai-kit-a2ui-core/types/components.ts

// Extend ComponentType union
export type ComponentType =
  | 'card' | 'text' | 'button' | 'row' | 'column'
  | 'modal' | 'tabs' | 'list' | 'textField' | 'checkBox'
  | 'slider' | 'choicePicker' | 'dateTimeInput' | 'image'
  | 'video' | 'audioPlayer' | 'icon' | 'divider'
  // NEW: Video protocol types
  | 'videoRecorder'
  | 'videoCall'
  | 'aiVideo'
  | 'aiVideoPlayer'

// Component interfaces
export interface VideoRecorderComponent extends A2UIComponent {
  type: 'videoRecorder'
  properties: {
    mode: 'screen' | 'camera' | 'pip'
    audio?: boolean
    quality?: 'low' | 'medium' | 'high'
    ai?: {
      transcribe?: boolean
      highlights?: boolean
      summary?: boolean
      zerodb?: boolean
    }
    onComplete?: string  // JSON pointer to action handler
  }
}

export interface VideoCallComponent extends A2UIComponent {
  type: 'videoCall'
  properties: {
    roomId: string
    layout?: 'grid' | 'speaker' | 'sidebar'
    features?: {
      chat?: boolean
      screenShare?: boolean
      recording?: boolean
    }
    ai?: {
      liveTranscription?: boolean
      liveCaptions?: boolean
      translation?: string
      noiseCancellation?: boolean
      speakerIdentification?: boolean
      actionItemDetection?: boolean
    }
  }
}

export interface AIVideoComponent extends A2UIComponent {
  type: 'aiVideo'
  properties: {
    prompt?: string
    template?: string
    data?: Record<string, any>
    voice?: string
    streaming?: boolean
    onGenerate?: string  // JSON pointer
  }
}

export interface AIVideoPlayerComponent extends A2UIComponent {
  type: 'aiVideoPlayer'
  properties: {
    videoUrl: string
    transcript?: string
    interactive?: {
      allowQuestions?: boolean
      conversationalControl?: boolean
      smartChapters?: boolean
      semanticSearch?: boolean
    }
  }
}
```

#### 3.1.2 Message Type Definitions

```typescript
// In @ainative/ai-kit-a2ui-core/types/protocol.ts

// Recording Messages
export interface A2UIRequestRecording extends A2UIMessage {
  type: 'requestRecording'
  surfaceId: SurfaceId
  recordingId: string
  mode: 'screen' | 'camera' | 'pip'
  options?: {
    audio?: boolean
    quality?: string
    duration?: number
  }
}

export interface A2UIRecordingStarted extends A2UIMessage {
  type: 'recordingStarted'
  surfaceId: SurfaceId
  recordingId: string
  timestamp: string
}

export interface A2UIRecordingComplete extends A2UIMessage {
  type: 'recordingComplete'
  surfaceId: SurfaceId
  recordingId: string
  videoUrl: string
  duration: number
  transcript?: string
  highlights?: Array<{timestamp: number, confidence: number}>
}

// Video Call Messages
export interface A2UIInitiateVideoCall extends A2UIMessage {
  type: 'initiateVideoCall'
  surfaceId: SurfaceId
  callId: string
  roomId: string
  participants?: string[]
}

export interface A2UIVideoCallJoined extends A2UIMessage {
  type: 'videoCallJoined'
  surfaceId: SurfaceId
  callId: string
  participantId: string
  timestamp: string
}

export interface A2UIVideoCallEnded extends A2UIMessage {
  type: 'videoCallEnded'
  surfaceId: SurfaceId
  callId: string
  duration: number
  transcript?: string
  summary?: string
  actionItems?: string[]
}

// Video Generation Messages
export interface A2UIGenerateVideo extends A2UIMessage {
  type: 'generateVideo'
  surfaceId: SurfaceId
  videoId: string
  prompt: string
  data?: Record<string, any>
  template?: string
}

export interface A2UIVideoGenerationProgress extends A2UIMessage {
  type: 'videoGenerationProgress'
  surfaceId: SurfaceId
  videoId: string
  progress: number  // 0-100
  frame?: string    // base64 preview frame
}

export interface A2UIVideoGenerationComplete extends A2UIMessage {
  type: 'videoGenerationComplete'
  surfaceId: SurfaceId
  videoId: string
  videoUrl: string
  composition: object
}

// AI Intelligence Messages (Epic 2)
export interface A2UISearchVideos extends A2UIMessage {
  type: 'searchVideos'
  surfaceId: SurfaceId
  query: string
  filters?: SearchFilters
  limit?: number
}

export interface A2UISearchResults extends A2UIMessage {
  type: 'searchResults'
  surfaceId: SurfaceId
  results: SearchResult[]
}

export interface A2UIRequestMetadata extends A2UIMessage {
  type: 'requestMetadata'
  surfaceId: SurfaceId
  videoId: string
  features?: string[]  // ['transcript', 'summary', 'topics', 'highlights']
}

export interface A2UIVideoMetadataReady extends A2UIMessage {
  type: 'videoMetadataReady'
  surfaceId: SurfaceId
  videoId: string
  metadata: VideoMetadata
}

export interface A2UIUpdateProgress extends A2UIMessage {
  type: 'updateProgress'
  surfaceId: SurfaceId
  videoId: string
  userId: string
  position: number
  completionRate: number
  device: string
  timestamp: string
}

export interface A2UIProgressSync extends A2UIMessage {
  type: 'progressSync'
  surfaceId: SurfaceId
  videoId: string
  userId: string
  position: number
  sceneMetadata?: {
    chapterTitle: string
    contextText: string
  }
}

export interface A2UIRequestRecommendations extends A2UIMessage {
  type: 'requestRecommendations'
  surfaceId: SurfaceId
  userId: string
  context?: {
    currentVideoId?: string
    recentTopics?: string[]
  }
  strategy?: 'content' | 'collaborative' | 'hybrid'
  limit?: number
}

export interface A2UIRecommendations extends A2UIMessage {
  type: 'recommendations'
  surfaceId: SurfaceId
  recommendations: RecommendationData[]
}

// Extend A2UIMessage union
export type A2UIMessage =
  | A2UICreateSurface
  | A2UIUpdateComponents
  | A2UIUserAction
  // ... existing types
  | A2UIRequestRecording
  | A2UIRecordingStarted
  | A2UIRecordingComplete
  | A2UIInitiateVideoCall
  | A2UIVideoCallJoined
  | A2UIVideoCallEnded
  | A2UIGenerateVideo
  | A2UIVideoGenerationProgress
  | A2UIVideoGenerationComplete
  | A2UISearchVideos
  | A2UISearchResults
  | A2UIRequestMetadata
  | A2UIVideoMetadataReady
  | A2UIUpdateProgress
  | A2UIProgressSync
  | A2UIRequestRecommendations
  | A2UIRecommendations
```

#### 3.1.3 Transport Extensions

```typescript
// In @ainative/ai-kit-a2ui-core/transport/transport.ts

export class A2UITransport extends EventEmitter {
  // Existing methods...

  // NEW: Video message event handlers
  on(event: 'requestRecording', handler: (message: A2UIRequestRecording) => void): void
  on(event: 'recordingStarted', handler: (message: A2UIRecordingStarted) => void): void
  on(event: 'recordingComplete', handler: (message: A2UIRecordingComplete) => void): void
  on(event: 'initiateVideoCall', handler: (message: A2UIInitiateVideoCall) => void): void
  on(event: 'videoCallJoined', handler: (message: A2UIVideoCallJoined) => void): void
  on(event: 'videoCallEnded', handler: (message: A2UIVideoCallEnded) => void): void
  on(event: 'generateVideo', handler: (message: A2UIGenerateVideo) => void): void
  on(event: 'videoGenerationProgress', handler: (message: A2UIVideoGenerationProgress) => void): void
  on(event: 'videoGenerationComplete', handler: (message: A2UIVideoGenerationComplete) => void): void

  // Epic 2: AI Intelligence events
  on(event: 'searchVideos', handler: (message: A2UISearchVideos) => void): void
  on(event: 'searchResults', handler: (message: A2UISearchResults) => void): void
  on(event: 'requestMetadata', handler: (message: A2UIRequestMetadata) => void): void
  on(event: 'videoMetadataReady', handler: (message: A2UIVideoMetadataReady) => void): void
  on(event: 'updateProgress', handler: (message: A2UIUpdateProgress) => void): void
  on(event: 'progressSync', handler: (message: A2UIProgressSync) => void): void
  on(event: 'requestRecommendations', handler: (message: A2UIRequestRecommendations) => void): void
  on(event: 'recommendations', handler: (message: A2UIRecommendations) => void): void
}
```

#### 3.1.4 Component Registry Extensions

```typescript
// In @ainative/ai-kit-a2ui-core/registry/standard.ts

export function createStandardRegistry(): ComponentRegistry {
  const registry = new ComponentRegistry()

  // ... existing 17 components

  // Video components (Epic 1)
  registry.register('videoRecorder', {
    type: 'videoRecorder',
    category: 'media',
    description: 'Record screen, camera, or both with optional AI features',
    defaultProps: {
      mode: 'screen',
      audio: true,
      quality: 'high'
    }
  })

  registry.register('videoCall', {
    type: 'videoCall',
    category: 'communication',
    description: 'Real-time video conferencing with AI enhancements',
    defaultProps: {
      layout: 'grid',
      features: {
        chat: true,
        screenShare: true,
        recording: false
      }
    }
  })

  registry.register('aiVideo', {
    type: 'aiVideo',
    category: 'generation',
    description: 'AI-generated video from text prompts',
    defaultProps: {
      streaming: true
    }
  })

  registry.register('aiVideoPlayer', {
    type: 'aiVideoPlayer',
    category: 'media',
    description: 'Interactive AI-aware video player with Q&A',
    defaultProps: {
      interactive: {
        allowQuestions: true,
        conversationalControl: true,
        smartChapters: true
      }
    }
  })

  return registry
}
```

### 3.2 What A2UI Core MUST NOT Provide

A2UI Core should **NOT** include:
- ❌ Video recording implementations
- ❌ WebRTC signaling logic
- ❌ AI video generation code
- ❌ Video processing/transcription
- ❌ React components (that's for renderers)
- ❌ Any runtime video logic

**Only protocol definitions and type schemas.**

---

## 4. Framework Renderer Integration

### 4.1 React Renderer Example

```typescript
// In @ainative/ai-kit-a2ui-react (future package)
import { VideoRecorder, VideoCall, AIVideo, AIVideoPlayer } from '@ainative/ai-kit-video'
import { ComponentRegistry } from '@ainative/ai-kit-a2ui-core/registry'
import type {
  VideoRecorderComponent,
  VideoCallComponent,
  AIVideoComponent,
  AIVideoPlayerComponent
} from '@ainative/ai-kit-a2ui-core/types'

// Register AIKit Video components for A2UI protocol types
function registerVideoComponents(registry: ComponentRegistry) {
  registry.register('videoRecorder', {
    type: 'videoRecorder',
    component: VideoRecorder,  // React component from AIKit Video
    category: 'media',
    description: 'Record screen, camera, or both'
  })

  registry.register('videoCall', {
    type: 'videoCall',
    component: VideoCall,  // React component from AIKit Video
    category: 'communication',
    description: 'Real-time video conferencing'
  })

  registry.register('aiVideo', {
    type: 'aiVideo',
    component: AIVideo,  // React component from AIKit Video
    category: 'generation',
    description: 'AI-generated video'
  })

  registry.register('aiVideoPlayer', {
    type: 'aiVideoPlayer',
    component: AIVideoPlayer,  // React component from AIKit Video
    category: 'media',
    description: 'Interactive AI-aware video player'
  })
}

// Component renderer
function renderA2UIComponent(component: A2UIComponent, registry: ComponentRegistry) {
  const definition = registry.get(component.type)

  if (!definition || !definition.component) {
    return <div>Unknown component: {component.type}</div>
  }

  const Component = definition.component
  return <Component {...component.properties} />
}
```

---

## 5. Dependency Chain

### 5.1 Build Order

```
1. @ainative/ai-kit-video (AIKit Video Epics 13 & 14)
   ↓
2. @ainative/ai-kit-a2ui-core (Video protocol types)
   ↓
3. @ainative/ai-kit-a2ui-react (React renderer with video)
   ↓
4. Example agents using video protocol
```

### 5.2 Version Dependencies

```json
// In @ainative/ai-kit-a2ui-react/package.json (future)
{
  "dependencies": {
    "@ainative/ai-kit-a2ui-core": "^0.2.0",  // Video protocol support
    "@ainative/ai-kit-video": "^1.0.0",      // Video implementations
    "react": "^18.0.0"
  }
}
```

### 5.3 Import Paths

```typescript
// Protocol types (no dependencies)
import type {
  VideoRecorderComponent,
  A2UIRequestRecording
} from '@ainative/ai-kit-a2ui-core/types'

// Protocol utilities (no video code)
import { ComponentRegistry, A2UITransport } from '@ainative/ai-kit-a2ui-core'

// Video implementations (React components)
import {
  VideoRecorder,
  VideoCall,
  AIVideo,
  AIVideoPlayer
} from '@ainative/ai-kit-video'

// AI hooks (React hooks)
import {
  useVideoSearch,
  useVideoMetadata,
  useVideoProgress,
  useVideoRecommendations
} from '@ainative/ai-kit-video'
```

---

## 6. Testing Strategy

### 6.1 A2UI Core Tests (Protocol Layer)

**What to test:**
- ✅ Component type definitions compile
- ✅ Message type definitions compile
- ✅ Transport handles video message events
- ✅ Registry includes video components
- ✅ JSON Pointer works with video state
- ✅ Type guards validate video messages

**What NOT to test:**
- ❌ Video recording functionality (that's AIKit Video)
- ❌ WebRTC connections (that's AIKit Video)
- ❌ AI generation (that's AIKit Video)

### 6.2 Mocked AIKit Video for Tests

```typescript
// In tests/fixtures/mocked-video.ts
export const MockedVideoRecorder = vi.fn((props: VideoRecorderProps) => {
  return <div data-testid="video-recorder" {...props} />
})

export const MockedVideoCall = vi.fn((props: VideoCallProps) => {
  return <div data-testid="video-call" {...props} />
})

// Use mocked components in protocol tests
it('should register video components', () => {
  const registry = ComponentRegistry.standard()
  registry.register('videoRecorder', {
    type: 'videoRecorder',
    component: MockedVideoRecorder,
    category: 'media'
  })

  const definition = registry.get('videoRecorder')
  expect(definition.component).toBe(MockedVideoRecorder)
})
```

---

## 7. Documentation Requirements

### 7.1 A2UI Core Documentation

**Must include:**
- Protocol specification for all video message types
- Component type reference with property schemas
- Integration examples showing AIKit Video usage
- Migration guide from v0.9 to v0.10/v0.11
- Message flow diagrams for each video operation

**Example:**

```markdown
## Video Component Types

### videoRecorder

Records screen, camera, or both with optional AI features.

**Component Definition:**
\`\`\`typescript
interface VideoRecorderComponent extends A2UIComponent {
  type: 'videoRecorder'
  properties: {
    mode: 'screen' | 'camera' | 'pip'
    audio?: boolean
    quality?: 'low' | 'medium' | 'high'
    ai?: {
      transcribe?: boolean
      highlights?: boolean
      summary?: boolean
    }
  }
}
\`\`\`

**Example Agent Message:**
\`\`\`json
{
  "type": "createSurface",
  "surfaceId": "recording-1",
  "components": [
    {
      "id": "recorder-1",
      "type": "videoRecorder",
      "properties": {
        "mode": "screen",
        "audio": true,
        "ai": {
          "transcribe": true,
          "highlights": true
        }
      }
    }
  ]
}
\`\`\`

**Implementation Note:**
The actual video recording is handled by `@ainative/ai-kit-video`.
A2UI Core only defines the protocol.
```

---

## 8. Success Criteria

### 8.1 Epic 1 Complete When:

- [ ] All 4 video component types defined
- [ ] All 8 video message types defined
- [ ] Transport handles all video events
- [ ] Registry includes video components
- [ ] Tests passing with mocked video
- [ ] Documentation published
- [ ] Published as `@ainative/ai-kit-a2ui-core@0.2.0`

### 8.2 Epic 2 Complete When:

- [ ] All 8 AI message types defined
- [ ] AI component properties extended
- [ ] Tests passing with mocked AI
- [ ] AI protocol documentation published
- [ ] Published as `@ainative/ai-kit-a2ui-core@0.3.0`

### 8.3 Integration Complete When:

- [ ] Framework renderer uses video protocol
- [ ] Example agent sends video messages
- [ ] AIKit Video components render correctly
- [ ] End-to-end workflow tested
- [ ] Community feedback positive

---

## 9. Conclusion

The A2UI Core video protocol integration is a **thin type layer** that enables AIKit Video to be used in A2UI agents. By keeping A2UI Core dependency-free and implementation-free, we maintain:

1. **Zero Dependencies** - Core package stays lightweight
2. **Framework Agnostic** - Works with React, Vue, Svelte, etc.
3. **Battle-Tested Implementation** - AIKit Video provides proven components
4. **Clear Separation** - Protocol vs implementation
5. **Maintainability** - Changes to video logic don't affect protocol

**Next Step:** Create GitHub issues A2UI-1 through A2UI-32 to begin execution.

---

**Document Version:** 1.0
**Date:** 2026-02-08
**Status:** Ready for Implementation (Pending AIKit Video Completion)
**Author:** AINative Studio
