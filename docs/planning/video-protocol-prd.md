# A2UI Video Protocol: Product Requirements Document

**Version:** 2.0
**Status:** Future Planning (Post AIKit Video Implementation)
**Dependencies:** `@ainative/ai-kit-video` (ai-kit/packages/video) including AI+Database intelligence
**Timeline:** TBD (After AIKit Video Epics 13 & 14 completion)
**Last Updated:** 2026-02-07

---

## Executive Summary

The A2UI Video Protocol extends the A2UI specification (v0.9) to support video components and real-time video streaming. This is **NOT a reimplementation** of video functionality - it provides protocol-level definitions that map to the comprehensive video SDK in `@ainative/ai-kit-video`.

**Core Principle**: Thin protocol layer that leverages AIKit Video's battle-tested implementations.

---

## Problem Statement

**Current State:**
- A2UI protocol defines 17 standard components (text, button, card, etc.)
- No video component types exist
- No protocol for agent-initiated video streaming
- No WebSocket extensions for real-time video communication

**Target Users:**
- A2UI agent developers wanting video capabilities
- A2UI renderer implementations (React, Vue, Svelte when available)
- Developers building video-enabled agent interfaces

---

## Solution Overview

Extend A2UI protocol with:

### Epic 1: Core Video Protocol
1. **Video Component Types** - Protocol definitions for video elements
2. **WebSocket Video Protocol** - Real-time video streaming messages
3. **A2UI Message Extensions** - New message types for video operations
4. **Type Definitions** - TypeScript types for all video protocol elements
5. **Registry Extensions** - Video components in A2UI ComponentRegistry

### Epic 2: AI Intelligence Protocol (NEW)
6. **Semantic Search Protocol** - Messages for AI-powered video search
7. **AI Metadata Protocol** - Access to transcripts, summaries, highlights, topics
8. **Progress Tracking Protocol** - Cross-device sync and scene-aware resume
9. **Recommendations Protocol** - AI-powered video suggestions
10. **AI Component Properties** - Configuration for AI features in components

**Architecture:**
```
┌─────────────────────────────────────────────┐
│  @ainative/ai-kit-a2ui-react-video          │
│  Framework bindings (Future)                │
└─────────────────────────────────────────────┘
                    ↓ uses
┌─────────────────────────────────────────────┐
│  @ainative/ai-kit-video                     │
│  Full video implementation (AIKit)          │
│  - Recording, WebRTC, Generation, etc.      │
└─────────────────────────────────────────────┘
                    ↑ imports
┌─────────────────────────────────────────────┐
│  @ainative/ai-kit-a2ui-core/video           │
│  Protocol definitions (THIS)                │
│  - Component types                          │
│  - WebSocket protocol                       │
│  - Message schemas                          │
└─────────────────────────────────────────────┘
```

---

## Goals & Objectives

### Primary Goals
1. Define A2UI video component types
2. Specify WebSocket video streaming protocol
3. Extend A2UI message types for video
4. Maintain A2UI protocol consistency
5. Zero implementation duplication with AIKit Video

### Success Metrics
- **Protocol Coverage**: 100% of video use cases
- **Type Safety**: Full TypeScript definitions
- **Compatibility**: Works with all A2UI renderers
- **Bundle Size**: < 5 KB (types only, no implementations)
- **Integration**: Seamless with AIKit Video

---

## Protocol Extensions

### 1. Video Component Types

Extend `ComponentType` union with video components:

```typescript
// Existing A2UI types
export type ComponentType =
  | 'card' | 'text' | 'button' | 'row' | 'column'
  | 'modal' | 'tabs' | 'list' | 'textField' | 'checkBox'
  | 'slider' | 'choicePicker' | 'dateTimeInput' | 'image'
  | 'video' | 'audioPlayer' | 'icon' | 'divider'
  // NEW: Video protocol types
  | 'videoRecorder'     // Screen/camera recording
  | 'videoCall'         // Real-time video communication
  | 'aiVideo'          // AI-generated video
  | 'aiVideoPlayer'    // Interactive video player

// Component definitions
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
      noiseCancellation?: boolean
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
    }
  }
}
```

### 2. WebSocket Video Protocol

New message types for real-time video operations:

```typescript
// Agent → Renderer: Request video recording
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

// Renderer → Agent: Recording started
export interface A2UIRecordingStarted extends A2UIMessage {
  type: 'recordingStarted'
  surfaceId: SurfaceId
  recordingId: string
  timestamp: string
}

// Renderer → Agent: Recording complete
export interface A2UIRecordingComplete extends A2UIMessage {
  type: 'recordingComplete'
  surfaceId: SurfaceId
  recordingId: string
  videoUrl: string
  duration: number
  transcript?: string
  highlights?: Array<{timestamp: number, confidence: number}>
}

// Agent → Renderer: Initiate video call
export interface A2UIInitiateVideoCall extends A2UIMessage {
  type: 'initiateVideoCall'
  surfaceId: SurfaceId
  callId: string
  roomId: string
  participants?: string[]
}

// Renderer → Agent: Call joined
export interface A2UIVideoCallJoined extends A2UIMessage {
  type: 'videoCallJoined'
  surfaceId: SurfaceId
  callId: string
  participantId: string
  timestamp: string
}

// Renderer → Agent: Call ended
export interface A2UIVideoCallEnded extends A2UIMessage {
  type: 'videoCallEnded'
  surfaceId: SurfaceId
  callId: string
  duration: number
  transcript?: string
  summary?: string
  actionItems?: string[]
}

// Agent → Renderer: Generate video
export interface A2UIGenerateVideo extends A2UIMessage {
  type: 'generateVideo'
  surfaceId: SurfaceId
  videoId: string
  prompt: string
  data?: Record<string, any>
  template?: string
}

// Renderer → Agent: Video generation progress
export interface A2UIVideoGenerationProgress extends A2UIMessage {
  type: 'videoGenerationProgress'
  surfaceId: SurfaceId
  videoId: string
  progress: number  // 0-100
  frame?: string    // base64 preview frame
}

// Renderer → Agent: Video generation complete
export interface A2UIVideoGenerationComplete extends A2UIMessage {
  type: 'videoGenerationComplete'
  surfaceId: SurfaceId
  videoId: string
  videoUrl: string
  composition: object
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
```

### 3. Data Model Extensions

Support for video-related data in A2UI data models:

```typescript
// Video state in data model
export interface A2UIVideoState {
  recordings: Record<string, {
    id: string
    status: 'idle' | 'recording' | 'processing' | 'complete'
    videoUrl?: string
    transcript?: string
    duration?: number
  }>
  calls: Record<string, {
    id: string
    roomId: string
    status: 'idle' | 'connecting' | 'active' | 'ended'
    participants: Array<{id: string, name: string}>
    transcript?: string
  }>
  generatedVideos: Record<string, {
    id: string
    status: 'idle' | 'generating' | 'complete' | 'error'
    progress?: number
    videoUrl?: string
  }>
}

// Example data model with video state
const dataModel = {
  user: { name: 'Alice' },
  videoState: {
    recordings: {
      'rec-1': {
        id: 'rec-1',
        status: 'complete',
        videoUrl: 'https://cdn.example.com/rec-1.mp4',
        transcript: '...',
        duration: 120
      }
    }
  }
}
```

---

## Integration with AIKit Video

The A2UI protocol types are implemented by AIKit Video components:

```typescript
// In A2UI renderer (React example - future)
import { ComponentRegistry } from '@ainative/ai-kit-a2ui-core/registry'
import { VideoRecorder, VideoCall, AIVideo, AIVideoPlayer } from '@ainative/ai-kit-video'

// Register AIKit Video components for A2UI types
registry.register('videoRecorder', {
  type: 'videoRecorder',
  component: VideoRecorder,  // From AIKit Video
  category: 'media',
  description: 'Record screen, camera, or both'
})

registry.register('videoCall', {
  type: 'videoCall',
  component: VideoCall,  // From AIKit Video
  category: 'communication',
  description: 'Real-time video conferencing'
})

registry.register('aiVideo', {
  type: 'aiVideo',
  component: AIVideo,  // From AIKit Video
  category: 'generation',
  description: 'AI-generated video'
})

registry.register('aiVideoPlayer', {
  type: 'aiVideoPlayer',
  component: AIVideoPlayer,  // From AIKit Video
  category: 'media',
  description: 'Interactive AI-aware video player'
})
```

---

## Implementation Strategy

### Phase 1: Type Definitions (Weeks 1-2)
- Define video component types
- Define WebSocket message types
- Extend A2UI protocol types
- Comprehensive TypeScript definitions

### Phase 2: Protocol Documentation (Weeks 3-4)
- Specification document
- Message flow diagrams
- Integration examples
- Migration guide

### Phase 3: Registry Extensions (Week 5)
- Update ComponentRegistry with video types
- Standard catalog additions
- Validation schemas

### Phase 4: Integration Testing (Weeks 6-8)
- End-to-end tests with AIKit Video
- Protocol compliance tests
- Renderer integration tests
- Performance benchmarks

---

## Protocol Specifications

### Message Flow: Recording

```
Agent                    Renderer                   User
  |                         |                        |
  |-- requestRecording ---->|                        |
  |                         |<---- user approves ----|
  |<--- recordingStarted ---|                        |
  |                         |                        |
  |                         |   (user records)       |
  |                         |                        |
  |<-- recordingComplete ---|                        |
  |  (with videoUrl,        |                        |
  |   transcript, etc.)     |                        |
```

### Message Flow: Video Call

```
Agent                    Renderer                   Participants
  |                         |                        |
  |-- initiateVideoCall --->|                        |
  |                         |<---- joins ------------|
  |<-- videoCallJoined -----|                        |
  |                         |                        |
  |                         |   (call active)        |
  |                         |                        |
  |<---- videoCallEnded ----|                        |
  |  (with transcript,      |                        |
  |   summary, actions)     |                        |
```

### Message Flow: Video Generation

```
Agent                    Renderer
  |                         |
  |--- generateVideo ------>|
  |                         |
  |<-- progress: 10% -------|
  |<-- progress: 25% -------|
  |<-- progress: 50% -------|
  |         ...             |
  |<-- progress: 100% ------|
  |                         |
  |<-- generationComplete --|
  |   (with videoUrl)       |
```

---

## Non-Goals (Out of Scope)

### NOT in A2UI Protocol Layer
- ❌ Video rendering implementations (that's AIKit Video)
- ❌ WebRTC signaling server (that's AIKit Video)
- ❌ AI video generation engine (that's AIKit Video)
- ❌ Video processing/transcription (that's AIKit Video)
- ❌ Storage/CDN integration (that's AIKit Video)

### What A2UI Protocol DOES Provide
- ✅ Component type definitions
- ✅ WebSocket message schemas
- ✅ Protocol specifications
- ✅ TypeScript types
- ✅ Integration patterns

---

## Testing Strategy

### Protocol Compliance Tests
```typescript
describe('A2UI Video Protocol', () => {
  test('videoRecorder component type is valid', () => {
    const component: VideoRecorderComponent = {
      id: 'rec-1',
      type: 'videoRecorder',
      properties: {
        mode: 'screen',
        audio: true,
        quality: 'high'
      }
    }
    expect(validateA2UIComponent(component)).toBe(true)
  })

  test('requestRecording message is valid', () => {
    const message: A2UIRequestRecording = {
      type: 'requestRecording',
      surfaceId: 'surface-1',
      recordingId: 'rec-1',
      mode: 'screen'
    }
    expect(validateA2UIMessage(message)).toBe(true)
  })
})
```

### Integration Tests with AIKit Video
```typescript
describe('A2UI + AIKit Video Integration', () => {
  test('VideoRecorder component renders correctly', async () => {
    const transport = new A2UITransport('ws://localhost:3000')

    transport.on('createSurface', ({ components }) => {
      const recorderComp = components.find(c => c.type === 'videoRecorder')
      expect(recorderComp).toBeDefined()

      // Should render AIKit Video's VideoRecorder component
      const rendered = registry.get('videoRecorder')
      expect(rendered.component).toBe(VideoRecorder)
    })
  })
})
```

---

## AI Intelligence Protocol (Epic 2)

**Purpose**: Expose AIKit Video's AI+Database intelligence features through A2UI protocol, enabling agents to leverage semantic search, AI metadata, progress tracking, and recommendations.

### Semantic Search Messages

```typescript
// Agent → Renderer: Search videos semantically
export interface A2UISearchVideos extends A2UIMessage {
  type: 'searchVideos'
  surfaceId: SurfaceId
  query: string
  filters?: {
    duration?: { min?: number, max?: number }
    dateRange?: { after?: string, before?: string }
    sentiment?: 'positive' | 'neutral' | 'negative'
    topics?: string[]
  }
  limit?: number
}

// Renderer → Agent: Search results
export interface A2UISearchResults extends A2UIMessage {
  type: 'searchResults'
  surfaceId: SurfaceId
  results: Array<{
    videoId: string
    title: string
    relevantTimestamps: Array<{ time: number, text: string }>
    matchedTranscript: string
    confidence: number
    metadata: {
      duration: number
      topics: string[]
      summary: string
    }
  }>
}
```

### AI Metadata Messages

```typescript
// Renderer → Agent: AI metadata ready
export interface A2UIVideoMetadataReady extends A2UIMessage {
  type: 'videoMetadataReady'
  surfaceId: SurfaceId
  videoId: string
  metadata: {
    transcript: {
      text: string
      words: Array<{ text: string, start: number, end: number }>
      speakers?: Array<{ id: string, name?: string }>
    }
    summary: string
    topics: string[]
    tags: string[]
    sentiment: {
      overall: 'positive' | 'neutral' | 'negative'
      timeline: Array<{ timestamp: number, sentiment: number }>
    }
    highlights: Array<{
      timestamp: number
      duration: number
      reason: string
      confidence: number
    }>
    chapters: Array<{
      start: number
      end: number
      title: string
    }>
  }
}

// Agent → Renderer: Request AI metadata
export interface A2UIRequestMetadata extends A2UIMessage {
  type: 'requestMetadata'
  surfaceId: SurfaceId
  videoId: string
  features?: string[]  // ['transcript', 'summary', 'topics', 'highlights']
}
```

### Progress Tracking Messages

```typescript
// Renderer → Agent: Progress update
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

// Agent → Renderer: Sync progress across devices
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
```

### Recommendations Messages

```typescript
// Agent → Renderer: Request recommendations
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

// Renderer → Agent: Recommendations
export interface A2UIRecommendations extends A2UIMessage {
  type: 'recommendations'
  surfaceId: SurfaceId
  recommendations: Array<{
    videoId: string
    title: string
    thumbnail: string
    reason: string
    confidence: number
    metadata: {
      duration: number
      topics: string[]
      summary: string
    }
  }>
}
```

### Extended Video State Types

```typescript
// Extended A2UIVideoState with AI metadata
export interface A2UIVideoState {
  // Basic state
  recordings: Record<string, RecordingState>
  calls: Record<string, CallState>
  generatedVideos: Record<string, GeneratedVideoState>

  // AI Intelligence (NEW)
  searchResults?: {
    query: string
    results: SearchResult[]
    timestamp: string
  }
  metadata: Record<string, {
    transcript?: TranscriptData
    summary?: string
    topics?: string[]
    tags?: string[]
    sentiment?: SentimentData
    highlights?: HighlightData[]
    chapters?: ChapterData[]
  }>
  progress: Record<string, {  // userId -> progress
    [userId: string]: {
      position: number
      lastWatched: string
      completionRate: number
      device: string
    }
  }>
  recommendations?: {
    videos: RecommendationData[]
    lastUpdated: string
  }
}
```

### AI Component Property Extensions

```typescript
// Extended VideoRecorderComponent with AI options
export interface VideoRecorderComponent extends A2UIComponent {
  type: 'videoRecorder'
  properties: {
    mode: 'screen' | 'camera' | 'pip'
    audio?: boolean
    quality?: 'low' | 'medium' | 'high'
    // AI options (NEW)
    ai?: {
      transcribe?: boolean
      highlights?: boolean
      summary?: boolean
      zerodb?: boolean  // Auto-store in ZeroDB
    }
    onComplete?: string
  }
}

// Extended VideoCallComponent with AI options
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
    // AI options (NEW)
    ai?: {
      liveTranscription?: boolean
      liveCaptions?: boolean
      translation?: string  // Language code
      noiseCancellation?: boolean
      speakerIdentification?: boolean
      actionItemDetection?: boolean
      zerodb?: boolean
    }
  }
}

// Extended AIVideoPlayerComponent with AI options
export interface AIVideoPlayerComponent extends A2UIComponent {
  type: 'aiVideoPlayer'
  properties: {
    videoUrl: string
    transcript?: string
    // AI interactive options (NEW)
    interactive?: {
      allowQuestions?: boolean
      conversationalControl?: boolean
      smartChapters?: boolean
      semanticSearch?: boolean
    }
  }
}
```

---

## Documentation Requirements

### For A2UI Agent Developers
- How to use video components in agent responses
- WebSocket message examples
- Best practices for video in conversational UI

### For A2UI Renderer Implementers
- How to handle video protocol messages
- Integration with AIKit Video
- Framework-specific examples (React, Vue, Svelte)

### Migration Guide
- Adding video to existing A2UI agents
- Updating renderers for video support
- Backward compatibility considerations

---

## Versioning Strategy

**A2UI Protocol Version**: v0.10 (proposed for Epic 1) → v0.11 (proposed for Epic 2)

**Changes from v0.9 (Epic 1)**:
- Added 4 video component types
- Added 8 new message types (recording, calls, generation)
- Extended data model for video state
- No breaking changes to existing v0.9 protocol

**Changes from v0.10 (Epic 2 - AI Intelligence)**:
- Added 8 new AI message types (search, metadata, progress, recommendations)
- Extended video component properties with AI options
- Extended A2UIVideoState with AI metadata fields
- No breaking changes to v0.10 protocol
- AI features are optional and gracefully degrade

**Compatibility**:
- Backward compatible with v0.9
- Renderers without video support gracefully degrade
- AI features are opt-in via component properties
- Optional feature detection for AI capabilities

---

## Open Questions

1. **Bandwidth Considerations**: Should protocol include quality negotiation for video calls?
2. **Security**: How to handle video permissions and privacy in A2UI?
3. **Offline Support**: How do recordings work in offline-first A2UI apps?
4. **Mobile**: Any mobile-specific protocol considerations?

---

## Dependencies

### Required Before Implementation

**Epic 1 Prerequisites**:
- ✅ A2UI v0.9 specification stable
- ⏳ AIKit Video Epic 13 complete (AIKIT-72 through AIKIT-125)
- ⏳ AIKit Video production-tested
- ⏳ A2UI framework packages started (React, Vue, Svelte)

**Epic 2 Prerequisites**:
- ⏳ Epic 1 complete
- ⏳ AIKit Video Epic 14 complete (AIKIT-126 through AIKIT-142)
- ⏳ ZeroDB integration in AIKit Video tested
- ⏳ AI features (semantic search, recommendations) production-ready

### External Dependencies
- `@ainative/ai-kit-video` - Video implementations
- `@ainative/ai-kit-a2ui-core` - Core A2UI protocol

---

## Success Criteria

### Definition of Done
- [ ] All video component types defined
- [ ] All WebSocket messages specified
- [ ] TypeScript types 100% complete
- [ ] Protocol documentation published
- [ ] Integration tests passing with AIKit Video
- [ ] Example agent + renderer implementations
- [ ] Backward compatibility verified

### Launch Readiness
- [ ] Specification reviewed by A2UI community
- [ ] Reference implementation in React renderer
- [ ] Migration guide published
- [ ] Performance benchmarks documented

---

## Timeline & Milestones

**Estimated Duration**: 8 weeks

**Prerequisites**: AIKit Video Phase 5 completion (Weeks 21-32 of AIKit backlog)

**Start Date**: TBD (Q3 2026 earliest)

**Milestones**:
- Week 1-2: Type definitions complete
- Week 3-4: Protocol documentation complete
- Week 5: Registry extensions complete
- Week 6-8: Integration testing and launch

---

## Conclusion

The A2UI Video Protocol provides a thin, elegant layer that extends A2UI to support video while leveraging the comprehensive AIKit Video implementation. This approach:

1. **Avoids duplication** - No reimplementation of video logic
2. **Maintains protocol consistency** - Follows A2UI design patterns
3. **Enables innovation** - Agents can now use video as first-class UI
4. **Scales gracefully** - Framework-agnostic, works everywhere

**Core Value**: "Make A2UI video-native without reinventing video."

---

**Document Version**: 2.0
**Last Updated**: 2026-02-07
**Author**: AINative Studio
**Status**: Future Planning - Awaiting AIKit Video Completion (Epics 13 & 14)

**Changelog**:
- **v2.0** (2026-02-07): Added Epic 2: AI Intelligence Protocol - semantic search, AI metadata, progress tracking, recommendations (8 new message types, extended component properties)
- **v1.0** (2026-02-07): Initial PRD with Epic 1: Core Video Protocol
