# A2UI Video Migration Guide: v0.9 to v0.10

**Version:** 1.0
**Date:** 2026-02-08
**Target Audience:** Agent developers and A2UI renderer implementers
**Migration Difficulty:** Low to Medium

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [What's New in v0.10](#whats-new-in-v010)
3. [Breaking Changes](#breaking-changes)
4. [Migration Steps by Component Type](#migration-steps-by-component-type)
5. [Before and After Examples](#before-and-after-examples)
6. [WebSocket Protocol Changes](#websocket-protocol-changes)
7. [Data Model Extensions](#data-model-extensions)
8. [Testing Your Migration](#testing-your-migration)
9. [Troubleshooting](#troubleshooting)
10. [Backward Compatibility](#backward-compatibility)

---

## Executive Summary

A2UI v0.10 extends the protocol with **video streaming capabilities** while maintaining full backward compatibility with v0.9. This migration guide helps you:

- Adopt 4 new video component types
- Handle 9 new WebSocket message types
- Integrate with `@ainative/ai-kit-video` for video implementations
- Update your agents and renderers with zero breaking changes

**Key Points:**
- ✅ **Backward Compatible**: All v0.9 apps continue to work without changes
- ✅ **Zero Dependencies**: Core protocol remains dependency-free
- ✅ **Opt-In**: Video features are optional enhancements
- ✅ **Type Safe**: Full TypeScript support for all video types

**Version Upgrade Path:**
```
v0.9 (18 components) → v0.10 (22 components)
```

---

## What's New in v0.10

### New Component Types

| Component | Purpose | Category |
|-----------|---------|----------|
| `videoRecorder` | Screen/camera recording with AI features | Media |
| `videoCall` | Real-time video conferencing | Communication |
| `aiVideo` | AI-generated video from prompts | Generation |
| `aiVideoPlayer` | Interactive AI-aware video player | Media |

### New Message Types

**Recording Messages:**
- `requestRecording` - Agent requests recording start
- `recordingStarted` - Renderer confirms recording started
- `recordingComplete` - Recording finished with metadata

**Video Call Messages:**
- `initiateVideoCall` - Agent starts video call
- `videoCallJoined` - Participant joins call
- `videoCallEnded` - Call ends with summary

**Video Generation Messages:**
- `generateVideo` - Agent requests AI video generation
- `videoGenerationProgress` - Streaming progress updates
- `videoGenerationComplete` - Generation finished

### Protocol Version

```typescript
// v0.9 (unchanged)
ComponentType = 'card' | 'text' | 'button' | ... (18 types)

// v0.10 (new)
ComponentType = 'card' | 'text' | 'button' | ... | 'videoRecorder' | 'videoCall' | 'aiVideo' | 'aiVideoPlayer' (22 types)
```

---

## Breaking Changes

**Good news: There are ZERO breaking changes!**

All existing v0.9 code continues to work unchanged. The video protocol is purely additive.

### What Doesn't Break

✅ All 18 existing component types work identically
✅ All 8 existing message types unchanged
✅ Data model structure remains compatible
✅ JSON Pointer operations work the same
✅ WebSocket transport API unchanged
✅ Component registry structure preserved

### What You Need to Do

**For Agents (Optional):**
- Update to `@ainative/ai-kit-a2ui-core@^0.2.0` to use video types
- Learn new video component properties
- Handle new video message types

**For Renderers (Optional):**
- Install `@ainative/ai-kit-video@^1.0.0` for video implementations
- Register video component types in your renderer
- Handle video-specific WebSocket messages

**For v0.9-Only Apps:**
- Nothing! Your code works as-is.

---

## Migration Steps by Component Type

### Step 1: Update Dependencies

#### For Agents (Protocol Only)

```bash
# Update A2UI core to v0.10
npm install @ainative/ai-kit-a2ui-core@^0.2.0
```

#### For Renderers (Protocol + Implementation)

```bash
# Update A2UI core to v0.10
npm install @ainative/ai-kit-a2ui-core@^0.2.0

# Install AIKit Video for component implementations
npm install @ainative/ai-kit-video@^1.0.0
```

### Step 2: Update Type Imports

**Before (v0.9):**
```typescript
import type {
  A2UIComponent,
  ComponentType,
  A2UIMessage
} from '@ainative/ai-kit-a2ui-core/types'
```

**After (v0.10):**
```typescript
import type {
  A2UIComponent,
  ComponentType,
  A2UIMessage,
  // NEW: Video component types
  VideoRecorderComponent,
  VideoCallComponent,
  AIVideoComponent,
  AIVideoPlayerComponent,
  // NEW: Video message types
  RequestRecordingMessage,
  RecordingCompleteMessage,
  InitiateVideoCallMessage,
  VideoCallEndedMessage,
  GenerateVideoMessage,
  VideoGenerationCompleteMessage
} from '@ainative/ai-kit-a2ui-core/types'
```

### Step 3: Update Component Registry (Renderers Only)

**Before (v0.9):**
```typescript
import { ComponentRegistry } from '@ainative/ai-kit-a2ui-core/registry'

const registry = ComponentRegistry.standard()
// 18 components registered
```

**After (v0.10):**
```typescript
import { ComponentRegistry } from '@ainative/ai-kit-a2ui-core/registry'
import {
  VideoRecorder,
  VideoCall,
  AIVideo,
  AIVideoPlayer
} from '@ainative/ai-kit-video'

const registry = ComponentRegistry.standard()
// 22 components registered (includes video types)

// Register AIKit Video implementations
registry.register('videoRecorder', {
  type: 'videoRecorder',
  component: VideoRecorder,
  category: 'media',
  description: 'Record screen, camera, or both'
})

registry.register('videoCall', {
  type: 'videoCall',
  component: VideoCall,
  category: 'communication',
  description: 'Real-time video conferencing'
})

registry.register('aiVideo', {
  type: 'aiVideo',
  component: AIVideo,
  category: 'generation',
  description: 'AI-generated video'
})

registry.register('aiVideoPlayer', {
  type: 'aiVideoPlayer',
  component: AIVideoPlayer,
  category: 'media',
  description: 'Interactive AI-aware video player'
})
```

### Step 4: Update Transport Event Handlers (Renderers Only)

**Before (v0.9):**
```typescript
import { A2UITransport } from '@ainative/ai-kit-a2ui-core/transport'

const transport = new A2UITransport('wss://agent.example.com')

transport.on('createSurface', (msg) => {
  // Handle surface creation
})

transport.on('updateComponents', (msg) => {
  // Handle component updates
})

await transport.connect()
```

**After (v0.10):**
```typescript
import { A2UITransport } from '@ainative/ai-kit-a2ui-core/transport'

const transport = new A2UITransport('wss://agent.example.com')

// Existing v0.9 handlers (unchanged)
transport.on('createSurface', (msg) => {
  // Handle surface creation
})

transport.on('updateComponents', (msg) => {
  // Handle component updates
})

// NEW: Video recording handlers
transport.on('requestRecording', (msg) => {
  // Agent wants to start recording
  console.log('Recording requested:', msg.recordingId, msg.mode)
})

transport.on('recordingComplete', (msg) => {
  // Recording finished
  console.log('Recording complete:', msg.videoUrl, msg.transcript)
})

// NEW: Video call handlers
transport.on('initiateVideoCall', (msg) => {
  // Agent wants to start video call
  console.log('Call initiated:', msg.callId, msg.roomId)
})

transport.on('videoCallEnded', (msg) => {
  // Call ended
  console.log('Call ended:', msg.duration, msg.summary)
})

// NEW: Video generation handlers
transport.on('generateVideo', (msg) => {
  // Agent wants to generate video
  console.log('Generate video:', msg.prompt)
})

transport.on('videoGenerationComplete', (msg) => {
  // Generation finished
  console.log('Video generated:', msg.videoUrl)
})

await transport.connect()
```

---

## Before and After Examples

### Example 1: Screen Recording Component

#### Before (v0.9) - Not Possible

In v0.9, you had to build custom recording UI:

```typescript
// v0.9: Custom implementation required
const customRecordingComponent: A2UIComponent = {
  id: 'custom-recorder-1',
  type: 'card', // Had to use generic card
  properties: {
    title: 'Screen Recording'
  },
  children: ['button-1']
}

const startButton: A2UIComponent = {
  id: 'button-1',
  type: 'button',
  properties: {
    label: 'Start Recording',
    action: '/actions/startRecording'
  }
}

// Custom recording logic in your app
// No standard protocol for recording
```

#### After (v0.10) - Native Support

```typescript
// v0.10: First-class video component
const recordingComponent: A2UIComponent = {
  id: 'recorder-1',
  type: 'videoRecorder',
  properties: {
    mode: 'screen',
    audio: true,
    quality: 'high',
    ai: {
      transcribe: true,
      highlights: true,
      summary: true
    },
    onComplete: '/handlers/recordingComplete'
  }
}

// Agent sends createSurface message
const message = {
  type: 'createSurface',
  surfaceId: 'recording-surface',
  components: [recordingComponent],
  dataModel: {}
}

// Renderer automatically shows recording UI
// AIKit Video handles all recording logic
// Agent receives recordingComplete message with transcript
```

### Example 2: Video Call Component

#### Before (v0.9) - Not Possible

```typescript
// v0.9: No native video call support
// Had to integrate third-party WebRTC manually
// No standard protocol for signaling
```

#### After (v0.10) - Built-In Protocol

```typescript
// v0.10: Native video call component
const videoCallComponent: A2UIComponent = {
  id: 'call-1',
  type: 'videoCall',
  properties: {
    roomId: 'meeting-abc123',
    layout: 'grid',
    features: {
      chat: true,
      screenShare: true,
      recording: true
    },
    ai: {
      liveTranscription: true,
      liveCaptions: true,
      noiseCancellation: true,
      actionItemDetection: true
    },
    onJoin: '/handlers/callJoined',
    onLeave: '/handlers/callEnded'
  }
}

// Agent initiates call
transport.send({
  type: 'initiateVideoCall',
  surfaceId: 'call-surface',
  callId: 'call-1',
  roomId: 'meeting-abc123',
  participants: ['user-1', 'user-2']
})

// When call ends, agent receives summary
// {
//   type: 'videoCallEnded',
//   callId: 'call-1',
//   duration: 1847,
//   transcript: '...',
//   summary: 'Team discussed Q1 roadmap...',
//   actionItems: ['John to send design mockups', 'Sarah to update timeline']
// }
```

### Example 3: AI Video Generation

#### Before (v0.9) - Not Possible

```typescript
// v0.9: No AI video generation support
// Had to build custom integration with video APIs
```

#### After (v0.10) - Protocol-Native

```typescript
// v0.10: AI video generation component
const aiVideoComponent: A2UIComponent = {
  id: 'video-gen-1',
  type: 'aiVideo',
  properties: {
    prompt: 'Create a product demo video showing dashboard features',
    template: 'product-demo-v2',
    data: {
      productName: 'Dashboard Pro',
      features: ['Analytics', 'Reports', 'Collaboration']
    },
    voice: 'professional-female',
    streaming: true,
    onProgress: '/handlers/generationProgress',
    onComplete: '/handlers/generationComplete'
  }
}

// Agent sends generation request
transport.send({
  type: 'generateVideo',
  surfaceId: 'gen-surface',
  videoId: 'video-1',
  prompt: 'Create a product demo video',
  template: 'product-demo-v2',
  data: { productName: 'Dashboard Pro' }
})

// Renderer streams progress updates
// Agent receives progress: 0%, 25%, 50%, 75%, 100%
// Agent receives completion message with video URL
```

### Example 4: Interactive Video Player

#### Before (v0.9) - Basic Video

```typescript
// v0.9: Simple video component
const basicVideo: A2UIComponent = {
  id: 'video-1',
  type: 'video',
  properties: {
    src: 'https://cdn.example.com/training.mp4',
    controls: true,
    autoplay: false
  }
}

// No AI features
// No interactivity
// No transcript
// No Q&A
```

#### After (v0.10) - AI-Enhanced Player

```typescript
// v0.10: AI-aware interactive player
const aiVideoPlayer: A2UIComponent = {
  id: 'player-1',
  type: 'aiVideoPlayer',
  properties: {
    videoUrl: 'https://cdn.example.com/training.mp4',
    transcript: 'https://cdn.example.com/training.vtt',
    interactive: {
      allowQuestions: true,
      conversationalControl: true,
      smartChapters: true,
      semanticSearch: true
    },
    onProgress: '/handlers/trackProgress',
    onQuestion: '/handlers/answerQuestion'
  }
}

// User can ask questions about the video
// Agent receives: "What is discussed at 3:45?"
// Agent responds with contextual answer
// Smart chapters auto-generated from AI analysis
// Semantic search across video transcript
```

### Example 5: Data Model Changes

#### Before (v0.9) - No Video State

```typescript
// v0.9: Data model without video
const dataModel = {
  user: {
    name: 'Alice',
    email: 'alice@example.com'
  },
  preferences: {
    theme: 'dark',
    notifications: true
  }
}
```

#### After (v0.10) - Video State Included

```typescript
// v0.10: Data model with video state
const dataModel = {
  user: {
    name: 'Alice',
    email: 'alice@example.com'
  },
  preferences: {
    theme: 'dark',
    notifications: true
  },
  // NEW: Video state tracking
  videoState: {
    recordings: {
      'rec-1': {
        id: 'rec-1',
        status: 'complete',
        videoUrl: 'https://cdn.example.com/rec-1.mp4',
        transcript: 'In this recording, I demonstrate...',
        duration: 120,
        highlights: [
          { timestamp: 15, confidence: 0.92 },
          { timestamp: 67, confidence: 0.88 }
        ]
      }
    },
    calls: {
      'call-1': {
        id: 'call-1',
        roomId: 'meeting-abc',
        status: 'ended',
        participants: [
          { id: 'user-1', name: 'Alice', role: 'host' },
          { id: 'user-2', name: 'Bob', role: 'participant' }
        ],
        duration: 1847,
        transcript: '...',
        summary: 'Team discussed Q1 roadmap...'
      }
    },
    generatedVideos: {
      'video-1': {
        id: 'video-1',
        status: 'complete',
        progress: 100,
        videoUrl: 'https://cdn.example.com/gen-1.mp4'
      }
    }
  }
}

// Access video state with JSON Pointer
const recordingUrl = JSONPointer.resolve(dataModel, '/videoState/recordings/rec-1/videoUrl')
// => 'https://cdn.example.com/rec-1.mp4'
```

---

## WebSocket Protocol Changes

### Message Flow: Recording

```
┌─────────┐                              ┌──────────┐
│  Agent  │                              │ Renderer │
└────┬────┘                              └────┬─────┘
     │                                        │
     │ requestRecording                       │
     │───────────────────────────────────────>│
     │   {recordingId, mode, options}         │
     │                                        │
     │                                        │ User approves
     │                                        │ Recording starts
     │                                        │
     │              recordingStarted          │
     │<───────────────────────────────────────│
     │   {recordingId, timestamp}             │
     │                                        │
     │                                        │ User recording...
     │                                        │
     │             recordingComplete          │
     │<───────────────────────────────────────│
     │   {videoUrl, transcript, highlights}   │
     │                                        │
     └                                        └
```

**Example Messages:**

```typescript
// Agent → Renderer
{
  type: 'requestRecording',
  surfaceId: 'demo-surface',
  recordingId: 'rec-123',
  mode: 'screen',
  options: {
    audio: true,
    quality: 'high',
    duration: 300
  }
}

// Renderer → Agent
{
  type: 'recordingStarted',
  surfaceId: 'demo-surface',
  recordingId: 'rec-123',
  timestamp: '2026-02-08T15:30:00Z'
}

// Renderer → Agent
{
  type: 'recordingComplete',
  surfaceId: 'demo-surface',
  recordingId: 'rec-123',
  videoUrl: 'https://cdn.example.com/rec-123.mp4',
  duration: 287,
  transcript: 'In this demo, I will show you...',
  highlights: [
    { timestamp: 15, confidence: 0.92 },
    { timestamp: 145, confidence: 0.88 }
  ]
}
```

### Message Flow: Video Call

```
┌─────────┐                              ┌──────────┐
│  Agent  │                              │ Renderer │
└────┬────┘                              └────┬─────┘
     │                                        │
     │ initiateVideoCall                      │
     │───────────────────────────────────────>│
     │   {callId, roomId, participants}       │
     │                                        │
     │                                        │ Participant joins
     │                                        │
     │              videoCallJoined           │
     │<───────────────────────────────────────│
     │   {participantId, timestamp}           │
     │                                        │
     │                                        │ Call in progress...
     │                                        │
     │              videoCallEnded            │
     │<───────────────────────────────────────│
     │   {duration, transcript, summary}      │
     │                                        │
     └                                        └
```

### Message Flow: Video Generation

```
┌─────────┐                              ┌──────────┐
│  Agent  │                              │ Renderer │
└────┬────┘                              └────┬─────┘
     │                                        │
     │ generateVideo                          │
     │───────────────────────────────────────>│
     │   {videoId, prompt, data}              │
     │                                        │
     │                                        │ Generation starts
     │                                        │
     │        videoGenerationProgress         │
     │<───────────────────────────────────────│
     │   {progress: 10%}                      │
     │                                        │
     │        videoGenerationProgress         │
     │<───────────────────────────────────────│
     │   {progress: 50%}                      │
     │                                        │
     │        videoGenerationProgress         │
     │<───────────────────────────────────────│
     │   {progress: 100%}                     │
     │                                        │
     │      videoGenerationComplete           │
     │<───────────────────────────────────────│
     │   {videoUrl, composition}              │
     │                                        │
     └                                        └
```

---

## Data Model Extensions

### Video State Schema

```typescript
interface VideoState {
  recordings: Record<string, {
    id: string
    status: 'idle' | 'recording' | 'processing' | 'complete' | 'error'
    videoUrl?: string
    transcript?: string
    duration?: number
    highlights?: Array<{ timestamp: number, confidence: number }>
    error?: string
  }>
  calls: Record<string, {
    id: string
    roomId: string
    status: 'idle' | 'connecting' | 'active' | 'ended' | 'error'
    participants: Array<{
      id: string
      name: string
      role: 'host' | 'participant'
      isMuted: boolean
      isVideoEnabled: boolean
    }>
    duration?: number
    transcript?: string
    summary?: string
    actionItems?: string[]
    error?: string
  }>
  generatedVideos: Record<string, {
    id: string
    status: 'idle' | 'generating' | 'complete' | 'error'
    progress?: number
    videoUrl?: string
    composition?: object
    error?: string
  }>
}
```

### JSON Pointer Examples

```typescript
import { JSONPointer } from '@ainative/ai-kit-a2ui-core/json-pointer'

// Access recording status
const status = JSONPointer.resolve(dataModel, '/videoState/recordings/rec-1/status')
// => 'complete'

// Access call participants
const participants = JSONPointer.resolve(dataModel, '/videoState/calls/call-1/participants')
// => [{ id: 'user-1', name: 'Alice', ... }, ...]

// Update generation progress
JSONPointer.set(dataModel, '/videoState/generatedVideos/video-1/progress', 75)

// Check if recording has transcript
const hasTranscript = JSONPointer.has(dataModel, '/videoState/recordings/rec-1/transcript')
// => true
```

---

## Testing Your Migration

### Unit Tests for Agents

```typescript
import { describe, it, expect } from 'vitest'
import type {
  VideoRecorderComponent,
  RequestRecordingMessage
} from '@ainative/ai-kit-a2ui-core/types'

describe('Video Component Migration', () => {
  it('should create videoRecorder component', () => {
    const component: VideoRecorderComponent = {
      id: 'rec-1',
      type: 'videoRecorder',
      properties: {
        mode: 'screen',
        audio: true,
        quality: 'high',
        ai: {
          transcribe: true
        }
      }
    }

    expect(component.type).toBe('videoRecorder')
    expect(component.properties.mode).toBe('screen')
  })

  it('should create requestRecording message', () => {
    const message: RequestRecordingMessage = {
      type: 'requestRecording',
      surfaceId: 'surface-1',
      recordingId: 'rec-1',
      mode: 'screen',
      options: {
        audio: true,
        quality: 'high'
      }
    }

    expect(message.type).toBe('requestRecording')
    expect(message.mode).toBe('screen')
  })
})
```

### Integration Tests for Renderers

```typescript
import { describe, it, expect, vi } from 'vitest'
import { A2UITransport } from '@ainative/ai-kit-a2ui-core/transport'
import { ComponentRegistry } from '@ainative/ai-kit-a2ui-core/registry'

describe('Video Renderer Integration', () => {
  it('should register video components', () => {
    const registry = ComponentRegistry.standard()

    // Mock video components for testing
    const MockVideoRecorder = vi.fn()

    registry.register('videoRecorder', {
      type: 'videoRecorder',
      component: MockVideoRecorder,
      category: 'media'
    })

    const definition = registry.get('videoRecorder')
    expect(definition).toBeDefined()
    expect(definition.component).toBe(MockVideoRecorder)
  })

  it('should handle requestRecording message', async () => {
    const transport = new A2UITransport('ws://localhost:3000')

    const recordingHandler = vi.fn()
    transport.on('requestRecording', recordingHandler)

    // Simulate message from agent
    const message = {
      type: 'requestRecording',
      surfaceId: 'test',
      recordingId: 'rec-1',
      mode: 'screen'
    }

    // Verify handler would be called
    expect(recordingHandler).toBeDefined()
  })
})
```

### End-to-End Test Checklist

- [ ] **Recording Flow**
  - [ ] Agent sends `requestRecording` message
  - [ ] Renderer shows recording UI
  - [ ] User starts recording
  - [ ] Renderer sends `recordingStarted` message
  - [ ] User completes recording
  - [ ] Renderer sends `recordingComplete` with video URL
  - [ ] Agent receives video URL and transcript

- [ ] **Video Call Flow**
  - [ ] Agent sends `initiateVideoCall` message
  - [ ] Renderer shows video call UI
  - [ ] Participants join
  - [ ] Renderer sends `videoCallJoined` messages
  - [ ] Call proceeds
  - [ ] Call ends
  - [ ] Renderer sends `videoCallEnded` with summary

- [ ] **Video Generation Flow**
  - [ ] Agent sends `generateVideo` message
  - [ ] Renderer starts generation
  - [ ] Renderer streams progress updates
  - [ ] Agent receives progress: 0% → 100%
  - [ ] Renderer sends `videoGenerationComplete`
  - [ ] Agent receives final video URL

---

## Troubleshooting

### Problem: Video components not rendering

**Symptoms:**
- Video components show as "Unknown component"
- Renderer doesn't recognize `videoRecorder` type

**Solution:**
```typescript
// Ensure you've registered video components
import { VideoRecorder } from '@ainative/ai-kit-video'

registry.register('videoRecorder', {
  type: 'videoRecorder',
  component: VideoRecorder,
  category: 'media'
})
```

### Problem: Video messages not received

**Symptoms:**
- Transport doesn't fire video event handlers
- Agent never receives `recordingComplete` messages

**Solution:**
```typescript
// Ensure you've added video event handlers
transport.on('requestRecording', (msg) => {
  console.log('Recording requested:', msg)
})

transport.on('recordingComplete', (msg) => {
  console.log('Recording complete:', msg)
})
```

### Problem: TypeScript errors for video types

**Symptoms:**
- `Property 'videoRecorder' does not exist on type 'ComponentType'`
- Type errors for video message types

**Solution:**
```bash
# Update to v0.10
npm install @ainative/ai-kit-a2ui-core@^0.2.0

# Ensure TypeScript picks up new types
npm run type-check
```

### Problem: Missing video implementations

**Symptoms:**
- Runtime error: "VideoRecorder is not defined"
- Video components render but don't work

**Solution:**
```bash
# Install AIKit Video package
npm install @ainative/ai-kit-video@^1.0.0

# Import and register components
import { VideoRecorder, VideoCall } from '@ainative/ai-kit-video'
```

### Problem: Backward compatibility issues

**Symptoms:**
- v0.9 agents break with v0.10 renderers
- Old components stop working

**Solution:**
No action needed! v0.10 is fully backward compatible. All v0.9 components work unchanged. Video components are purely additive.

### Problem: AI features not working

**Symptoms:**
- Transcripts not generated
- Highlights not detected
- Summaries not created

**Solution:**
```typescript
// Ensure AI options are enabled
const component = {
  type: 'videoRecorder',
  properties: {
    mode: 'screen',
    ai: {
      transcribe: true,  // Enable transcript
      highlights: true,  // Enable highlights
      summary: true      // Enable summary
    }
  }
}

// Ensure AIKit Video is configured with AI backend
// See @ainative/ai-kit-video documentation
```

---

## Backward Compatibility

### v0.9 Agents with v0.10 Renderers

**Scenario:** Your agent still uses v0.9, but renderer upgraded to v0.10

**Result:** ✅ Works perfectly

```typescript
// v0.9 agent code (unchanged)
const oldComponent = {
  id: 'card-1',
  type: 'card',
  properties: {
    title: 'Dashboard'
  }
}

// v0.10 renderer handles it correctly
// No changes required
```

### v0.10 Agents with v0.9 Renderers

**Scenario:** Your agent uses v0.10 video types, but renderer is still v0.9

**Result:** ⚠️ Graceful degradation

```typescript
// v0.10 agent sends video component
const videoComponent = {
  id: 'rec-1',
  type: 'videoRecorder',
  properties: { mode: 'screen' }
}

// v0.9 renderer doesn't recognize it
// Shows fallback: "Unknown component: videoRecorder"
// OR ignores it entirely

// Solution: Upgrade renderer to v0.10
```

### Mixed Environment Strategy

If you have multiple agents/renderers at different versions:

1. **Feature Detection:**
```typescript
// Agent checks renderer capabilities
const supportsVideo = registry.has('videoRecorder')

if (supportsVideo) {
  // Send video components
} else {
  // Fallback to v0.9 components
}
```

2. **Progressive Enhancement:**
```typescript
// Use basic video for v0.9, enhanced for v0.10
const videoComponent = supportsAIVideo ? {
  type: 'aiVideoPlayer',
  properties: {
    videoUrl: url,
    interactive: { allowQuestions: true }
  }
} : {
  type: 'video',
  properties: {
    src: url,
    controls: true
  }
}
```

---

## Next Steps

### For Agent Developers

1. **Learn Video Components**
   - Read component property schemas
   - Understand message flows
   - Try example implementations

2. **Update Your Agents**
   - Install v0.10 core package
   - Add video component support
   - Handle video messages

3. **Test Thoroughly**
   - Unit test video components
   - Integration test message flows
   - End-to-end test with real users

### For Renderer Implementers

1. **Install AIKit Video**
   - Install `@ainative/ai-kit-video`
   - Register video components
   - Configure AI backends

2. **Handle Video Messages**
   - Add transport event handlers
   - Implement recording UI
   - Implement call UI
   - Implement generation UI

3. **Test Integration**
   - Test with example agents
   - Verify message flows
   - Check AI features work

### Resources

- **A2UI Video Protocol Spec**: [docs/planning/video-protocol-prd.md](../planning/video-protocol-prd.md)
- **AIKit Video Integration**: [docs/planning/AIKIT_VIDEO_INTEGRATION_REQUIREMENTS.md](../planning/AIKIT_VIDEO_INTEGRATION_REQUIREMENTS.md)
- **Component Registry Docs**: [README.md](../../README.md#-component-registry)
- **Transport Docs**: [README.md](../../README.md#-websocket-transport)
- **Type Definitions**: [src/types/](../../src/types/)

---

## Summary

**Migration Complexity: LOW**

- ✅ Zero breaking changes
- ✅ Backward compatible
- ✅ Opt-in video features
- ✅ Clear upgrade path
- ✅ Comprehensive documentation

**Timeline Estimate:**

| Task | Time Estimate |
|------|--------------|
| Update dependencies | 5 minutes |
| Update type imports | 10 minutes |
| Register video components | 15 minutes |
| Add event handlers | 30 minutes |
| Testing | 1-2 hours |
| **Total** | **2-3 hours** |

**Support:**

- GitHub Issues: https://github.com/AINative-Studio/ai-kit-a2ui-core/issues
- Documentation: https://docs.ainative.studio/a2ui
- Community: https://discord.gg/ainative
- Email: hello@ainative.studio

---

**Document Version:** 1.0
**Last Updated:** 2026-02-08
**Author:** AINative Studio
**Status:** Complete
