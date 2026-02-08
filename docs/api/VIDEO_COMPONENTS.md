# Video Components API Reference

Complete API documentation for A2UI video components (v0.10 protocol extension).

## Table of Contents

- [Overview](#overview)
- [VideoRecorder Component](#videorecorder-component)
- [VideoCall Component](#videocall-component)
- [AIVideo Component](#aivideo-component)
- [AIVideoPlayer Component](#aivideoplayer-component)
- [Video State Management](#video-state-management)
- [Message Types](#message-types)
- [Type Definitions](#type-definitions)

---

## Overview

The A2UI video protocol extension adds four new component types for video interactions:

1. **videoRecorder** - Screen and camera recording with AI features
2. **videoCall** - Real-time video conferencing with AI enhancements
3. **aiVideo** - AI-generated video from text prompts
4. **aiVideoPlayer** - Interactive video player with AI capabilities

All video components integrate seamlessly with the A2UI protocol and support AI-powered features like transcription, summarization, and semantic search.

---

## VideoRecorder Component

Record screen, camera, or picture-in-picture video with optional AI processing.

### Component Type

```typescript
interface VideoRecorderComponent extends A2UIComponent {
  type: 'videoRecorder'
  properties: VideoRecorderProperties
}

interface VideoRecorderProperties {
  /** Recording mode */
  mode: 'screen' | 'camera' | 'pip'
  /** Enable audio recording */
  audio?: boolean
  /** Video quality setting */
  quality?: 'low' | 'medium' | 'high'
  /** AI processing options */
  ai?: {
    transcribe?: boolean
    highlights?: boolean
    summary?: boolean
  }
  /** JSON pointer to action handler */
  onComplete?: string
}
```

### Basic Example

```typescript
// Agent creates a screen recorder
const screenRecorder: VideoRecorderComponent = {
  id: 'recorder-1',
  type: 'videoRecorder',
  properties: {
    mode: 'screen',
    audio: true,
    quality: 'high'
  }
}

// Send via A2UI transport
transport.send({
  type: 'createSurface',
  surfaceId: 'recording-session',
  components: [screenRecorder]
})
```

### With AI Features

```typescript
// Screen recording with AI transcription and highlights
const aiRecorder: VideoRecorderComponent = {
  id: 'ai-recorder',
  type: 'videoRecorder',
  properties: {
    mode: 'screen',
    audio: true,
    quality: 'high',
    ai: {
      transcribe: true,      // Auto-generate transcript
      highlights: true,       // Detect key moments
      summary: true          // Generate summary
    },
    onComplete: '/handlers/onRecordingComplete'
  }
}
```

### Picture-in-Picture Mode

```typescript
// Camera + screen recording (PiP)
const pipRecorder: VideoRecorderComponent = {
  id: 'pip-recorder',
  type: 'videoRecorder',
  properties: {
    mode: 'pip',
    audio: true,
    quality: 'high',
    ai: {
      transcribe: true
    }
  }
}
```

### Recording Workflow

```typescript
// 1. Agent requests recording
transport.send({
  type: 'requestRecording',
  surfaceId: 'demo-session',
  recordingId: 'rec-001',
  mode: 'screen',
  options: {
    audio: true,
    quality: 'high'
  }
})

// 2. Renderer notifies recording started
transport.on('recordingStarted', ({ recordingId, timestamp }) => {
  console.log(`Recording ${recordingId} started at ${timestamp}`)
})

// 3. Renderer sends completion data
transport.on('recordingComplete', ({
  recordingId,
  videoUrl,
  duration,
  transcript,
  highlights
}) => {
  console.log(`Recording complete: ${videoUrl}`)
  console.log(`Duration: ${duration}s`)
  console.log(`Transcript: ${transcript}`)
  console.log(`Highlights: ${highlights.length} detected`)
})
```

### Use Cases

**Tutorial Recording**
```typescript
const tutorialRecorder: VideoRecorderComponent = {
  id: 'tutorial-rec',
  type: 'videoRecorder',
  properties: {
    mode: 'screen',
    audio: true,
    quality: 'high',
    ai: {
      transcribe: true,
      highlights: true,
      summary: true
    }
  }
}
```

**Bug Report Recording**
```typescript
const bugRecorder: VideoRecorderComponent = {
  id: 'bug-rec',
  type: 'videoRecorder',
  properties: {
    mode: 'screen',
    audio: false,
    quality: 'medium',
    ai: {
      transcribe: false,
      highlights: true  // Capture error moments
    }
  }
}
```

**Demo Recording with Narration**
```typescript
const demoRecorder: VideoRecorderComponent = {
  id: 'demo-rec',
  type: 'videoRecorder',
  properties: {
    mode: 'pip',
    audio: true,
    quality: 'high',
    ai: {
      transcribe: true,
      summary: true
    }
  }
}
```

---

## VideoCall Component

Real-time video conferencing with AI enhancements.

### Component Type

```typescript
interface VideoCallComponent extends A2UIComponent {
  type: 'videoCall'
  properties: VideoCallProperties
}

interface VideoCallProperties {
  /** Video call room identifier */
  roomId: string
  /** Participant layout */
  layout?: 'grid' | 'speaker' | 'sidebar'
  /** Feature toggles */
  features?: {
    chat?: boolean
    screenShare?: boolean
    recording?: boolean
  }
  /** AI features */
  ai?: {
    liveTranscription?: boolean
    liveCaptions?: boolean
    noiseCancellation?: boolean
  }
}
```

### Basic Example

```typescript
// Simple video call
const videoCall: VideoCallComponent = {
  id: 'call-1',
  type: 'videoCall',
  properties: {
    roomId: 'meeting-room-123',
    layout: 'grid',
    features: {
      chat: true,
      screenShare: true,
      recording: false
    }
  }
}
```

### With AI Features

```typescript
// Video call with AI enhancements
const aiVideoCall: VideoCallComponent = {
  id: 'ai-call',
  type: 'videoCall',
  properties: {
    roomId: 'ai-meeting-456',
    layout: 'speaker',
    features: {
      chat: true,
      screenShare: true,
      recording: true
    },
    ai: {
      liveTranscription: true,      // Real-time transcript
      liveCaptions: true,            // Show captions
      noiseCancellation: true        // Remove background noise
    }
  }
}
```

### Call Workflow

```typescript
// 1. Agent initiates call
transport.send({
  type: 'initiateVideoCall',
  surfaceId: 'meeting-surface',
  callId: 'call-001',
  roomId: 'team-standup',
  participants: ['user-1', 'user-2', 'user-3']
})

// 2. Renderer notifies participant joined
transport.on('videoCallJoined', ({
  callId,
  participantId,
  timestamp
}) => {
  console.log(`${participantId} joined call ${callId}`)
})

// 3. Renderer sends call summary on end
transport.on('videoCallEnded', ({
  callId,
  duration,
  transcript,
  summary,
  actionItems
}) => {
  console.log(`Call ${callId} ended (${duration}s)`)
  console.log(`Summary: ${summary}`)
  console.log(`Action items: ${actionItems.join(', ')}`)
})
```

### Use Cases

**Team Meeting**
```typescript
const teamMeeting: VideoCallComponent = {
  id: 'team-call',
  type: 'videoCall',
  properties: {
    roomId: 'daily-standup',
    layout: 'grid',
    features: {
      chat: true,
      screenShare: true,
      recording: true
    },
    ai: {
      liveTranscription: true,
      liveCaptions: false
    }
  }
}
```

**One-on-One Interview**
```typescript
const interview: VideoCallComponent = {
  id: 'interview-call',
  type: 'videoCall',
  properties: {
    roomId: 'interview-room',
    layout: 'speaker',
    features: {
      chat: false,
      screenShare: true,
      recording: true
    },
    ai: {
      liveTranscription: true,
      liveCaptions: true,
      noiseCancellation: true
    }
  }
}
```

**Webinar**
```typescript
const webinar: VideoCallComponent = {
  id: 'webinar-call',
  type: 'videoCall',
  properties: {
    roomId: 'public-webinar',
    layout: 'sidebar',
    features: {
      chat: true,
      screenShare: true,
      recording: true
    },
    ai: {
      liveTranscription: true,
      liveCaptions: true
    }
  }
}
```

---

## AIVideo Component

Generate videos from text prompts using AI.

### Component Type

```typescript
interface AIVideoComponent extends A2UIComponent {
  type: 'aiVideo'
  properties: AIVideoProperties
}

interface AIVideoProperties {
  /** Generation prompt */
  prompt?: string
  /** Template identifier */
  template?: string
  /** Template data */
  data?: Record<string, any>
  /** Voice identifier */
  voice?: string
  /** Enable streaming generation */
  streaming?: boolean
  /** JSON pointer to generation handler */
  onGenerate?: string
}
```

### Basic Example

```typescript
// Generate video from prompt
const aiVideo: AIVideoComponent = {
  id: 'gen-video-1',
  type: 'aiVideo',
  properties: {
    prompt: 'Create a product demo video showing our new dashboard features',
    voice: 'professional-male',
    streaming: true
  }
}
```

### Template-Based Generation

```typescript
// Generate from template
const templateVideo: AIVideoComponent = {
  id: 'template-video',
  type: 'aiVideo',
  properties: {
    template: 'product-announcement',
    data: {
      productName: 'Dashboard 2.0',
      features: [
        'Real-time analytics',
        'Custom widgets',
        'AI insights'
      ],
      releaseDate: '2026-03-01'
    },
    voice: 'enthusiastic-female',
    streaming: true,
    onGenerate: '/handlers/onVideoGenerated'
  }
}
```

### Generation Workflow

```typescript
// 1. Agent requests video generation
transport.send({
  type: 'generateVideo',
  surfaceId: 'content-studio',
  videoId: 'vid-001',
  prompt: 'Create tutorial for feature X',
  data: { steps: ['Step 1', 'Step 2', 'Step 3'] }
})

// 2. Renderer sends progress updates
transport.on('videoGenerationProgress', ({
  videoId,
  progress,
  frame
}) => {
  console.log(`Generation ${progress}% complete`)
  // Optional: display preview frame
})

// 3. Renderer sends completion
transport.on('videoGenerationComplete', ({
  videoId,
  videoUrl,
  composition
}) => {
  console.log(`Video generated: ${videoUrl}`)
  console.log('Composition:', composition)
})
```

### Use Cases

**Product Demo**
```typescript
const productDemo: AIVideoComponent = {
  id: 'demo-gen',
  type: 'aiVideo',
  properties: {
    template: 'product-demo',
    data: {
      product: 'AI Assistant',
      features: ['Natural language', 'Context aware', 'Multi-modal'],
      screenshots: ['url1', 'url2', 'url3']
    },
    voice: 'professional-male',
    streaming: true
  }
}
```

**Tutorial Video**
```typescript
const tutorial: AIVideoComponent = {
  id: 'tutorial-gen',
  type: 'aiVideo',
  properties: {
    prompt: 'Create step-by-step tutorial for setting up authentication',
    data: {
      steps: [
        { title: 'Install SDK', code: 'npm install auth-sdk' },
        { title: 'Configure', code: 'auth.configure({...})' },
        { title: 'Test', code: 'auth.login()' }
      ]
    },
    voice: 'friendly-female',
    streaming: true
  }
}
```

**Social Media Content**
```typescript
const socialContent: AIVideoComponent = {
  id: 'social-gen',
  type: 'aiVideo',
  properties: {
    template: 'social-square',
    data: {
      headline: 'New Feature Alert!',
      description: 'AI-powered video editing is here',
      cta: 'Try it now'
    },
    voice: 'energetic-female',
    streaming: true
  }
}
```

---

## AIVideoPlayer Component

Interactive video player with AI-powered features.

### Component Type

```typescript
interface AIVideoPlayerComponent extends A2UIComponent {
  type: 'aiVideoPlayer'
  properties: AIVideoPlayerProperties
}

interface AIVideoPlayerProperties {
  /** Video source URL */
  videoUrl: string
  /** Transcript text */
  transcript?: string
  /** Interactive features */
  interactive?: {
    allowQuestions?: boolean
    conversationalControl?: boolean
    smartChapters?: boolean
  }
}
```

### Basic Example

```typescript
// Standard video player
const player: AIVideoPlayerComponent = {
  id: 'player-1',
  type: 'aiVideoPlayer',
  properties: {
    videoUrl: 'https://cdn.example.com/video.mp4',
    transcript: 'Video transcript text here...'
  }
}
```

### With Interactive Features

```typescript
// Interactive AI-powered player
const interactivePlayer: AIVideoPlayerComponent = {
  id: 'ai-player',
  type: 'aiVideoPlayer',
  properties: {
    videoUrl: 'https://cdn.example.com/tutorial.mp4',
    transcript: 'In this tutorial we will cover...',
    interactive: {
      allowQuestions: true,           // Users can ask about content
      conversationalControl: true,     // "Skip to pricing section"
      smartChapters: true             // AI-generated chapters
    }
  }
}
```

### Use Cases

**Educational Content**
```typescript
const educationalPlayer: AIVideoPlayerComponent = {
  id: 'edu-player',
  type: 'aiVideoPlayer',
  properties: {
    videoUrl: 'https://cdn.example.com/lesson.mp4',
    transcript: 'Lesson transcript...',
    interactive: {
      allowQuestions: true,
      conversationalControl: true,
      smartChapters: true
    }
  }
}
```

**Product Documentation**
```typescript
const docsPlayer: AIVideoPlayerComponent = {
  id: 'docs-player',
  type: 'aiVideoPlayer',
  properties: {
    videoUrl: 'https://cdn.example.com/docs-video.mp4',
    interactive: {
      allowQuestions: true,
      conversationalControl: true,
      smartChapters: true
    }
  }
}
```

**Training Videos**
```typescript
const trainingPlayer: AIVideoPlayerComponent = {
  id: 'training-player',
  type: 'aiVideoPlayer',
  properties: {
    videoUrl: 'https://cdn.example.com/training.mp4',
    transcript: 'Training content...',
    interactive: {
      allowQuestions: true,
      conversationalControl: false,
      smartChapters: true
    }
  }
}
```

---

## Video State Management

Manage video state in the A2UI data model.

### State Structure

```typescript
interface A2UIVideoState {
  recordings: Record<string, RecordingState>
  calls: Record<string, CallState>
  generatedVideos: Record<string, GeneratedVideoState>
}

interface RecordingState {
  id: string
  status: 'idle' | 'recording' | 'processing' | 'complete'
  videoUrl?: string
  transcript?: string
  duration?: number
}

interface CallState {
  id: string
  roomId: string
  status: 'idle' | 'connecting' | 'active' | 'ended'
  participants: Array<{ id: string; name: string }>
  transcript?: string
}

interface GeneratedVideoState {
  id: string
  status: 'idle' | 'generating' | 'complete' | 'error'
  progress?: number
  videoUrl?: string
}
```

### Example Data Model

```typescript
const dataModel = {
  user: { name: 'Alice', email: 'alice@example.com' },
  videoState: {
    recordings: {
      'rec-001': {
        id: 'rec-001',
        status: 'complete',
        videoUrl: 'https://cdn.example.com/rec-001.mp4',
        transcript: 'Recording transcript...',
        duration: 120
      }
    },
    calls: {
      'call-001': {
        id: 'call-001',
        roomId: 'team-meeting',
        status: 'active',
        participants: [
          { id: 'user-1', name: 'Alice' },
          { id: 'user-2', name: 'Bob' }
        ]
      }
    },
    generatedVideos: {
      'vid-001': {
        id: 'vid-001',
        status: 'generating',
        progress: 45
      }
    }
  }
}
```

### Accessing Video State

```typescript
import { JSONPointer } from '@ainative/ai-kit-a2ui-core/json-pointer'

// Get recording status
const status = JSONPointer.resolve(
  dataModel,
  '/videoState/recordings/rec-001/status'
)  // 'complete'

// Get video URL
const videoUrl = JSONPointer.resolve(
  dataModel,
  '/videoState/recordings/rec-001/videoUrl'
)  // 'https://...'

// Get generation progress
const progress = JSONPointer.resolve(
  dataModel,
  '/videoState/generatedVideos/vid-001/progress'
)  // 45
```

### Updating Video State

```typescript
// Update recording status
transport.send({
  type: 'updateDataModel',
  surfaceId: 'video-studio',
  updates: [{
    path: '/videoState/recordings/rec-001/status',
    operation: 'set',
    value: 'processing'
  }]
})

// Update generation progress
transport.send({
  type: 'updateDataModel',
  surfaceId: 'content-studio',
  updates: [{
    path: '/videoState/generatedVideos/vid-001/progress',
    operation: 'set',
    value: 75
  }]
})
```

---

## Message Types

### Recording Messages

#### RequestRecording (Agent → Renderer)

```typescript
interface A2UIRequestRecording extends A2UIMessage {
  type: 'requestRecording'
  surfaceId: string
  recordingId: string
  mode: 'screen' | 'camera' | 'pip'
  options?: {
    audio?: boolean
    quality?: string
    duration?: number
  }
}
```

#### RecordingStarted (Renderer → Agent)

```typescript
interface A2UIRecordingStarted extends A2UIMessage {
  type: 'recordingStarted'
  surfaceId: string
  recordingId: string
  timestamp: string
}
```

#### RecordingComplete (Renderer → Agent)

```typescript
interface A2UIRecordingComplete extends A2UIMessage {
  type: 'recordingComplete'
  surfaceId: string
  recordingId: string
  videoUrl: string
  duration: number
  transcript?: string
  highlights?: Array<{ timestamp: number; confidence: number }>
}
```

### Call Messages

#### InitiateVideoCall (Agent → Renderer)

```typescript
interface A2UIInitiateVideoCall extends A2UIMessage {
  type: 'initiateVideoCall'
  surfaceId: string
  callId: string
  roomId: string
  participants?: string[]
}
```

#### VideoCallJoined (Renderer → Agent)

```typescript
interface A2UIVideoCallJoined extends A2UIMessage {
  type: 'videoCallJoined'
  surfaceId: string
  callId: string
  participantId: string
  timestamp: string
}
```

#### VideoCallEnded (Renderer → Agent)

```typescript
interface A2UIVideoCallEnded extends A2UIMessage {
  type: 'videoCallEnded'
  surfaceId: string
  callId: string
  duration: number
  transcript?: string
  summary?: string
  actionItems?: string[]
}
```

### Generation Messages

#### GenerateVideo (Agent → Renderer)

```typescript
interface A2UIGenerateVideo extends A2UIMessage {
  type: 'generateVideo'
  surfaceId: string
  videoId: string
  prompt: string
  data?: Record<string, any>
  template?: string
}
```

#### VideoGenerationProgress (Renderer → Agent)

```typescript
interface A2UIVideoGenerationProgress extends A2UIMessage {
  type: 'videoGenerationProgress'
  surfaceId: string
  videoId: string
  progress: number  // 0-100
  frame?: string    // base64 preview frame
}
```

#### VideoGenerationComplete (Renderer → Agent)

```typescript
interface A2UIVideoGenerationComplete extends A2UIMessage {
  type: 'videoGenerationComplete'
  surfaceId: string
  videoId: string
  videoUrl: string
  composition: object
}
```

---

## Type Definitions

### Component Type Union

```typescript
type ComponentType =
  | 'card' | 'text' | 'button' | 'row' | 'column'
  | 'modal' | 'tabs' | 'list' | 'textField' | 'checkBox'
  | 'slider' | 'choicePicker' | 'dateTimeInput' | 'image'
  | 'video' | 'audioPlayer' | 'icon' | 'divider'
  // Video protocol types (v0.10)
  | 'videoRecorder'
  | 'videoCall'
  | 'aiVideo'
  | 'aiVideoPlayer'
```

### Message Type Union

```typescript
type A2UIMessage =
  // Core messages
  | A2UICreateSurface
  | A2UIUpdateComponents
  | A2UIUpdateDataModel
  | A2UIDeleteSurface
  | A2UIUserAction
  | A2UIError
  // Video messages (v0.10)
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

### Complete Type Exports

```typescript
// Import all video types
import type {
  VideoRecorderComponent,
  VideoCallComponent,
  AIVideoComponent,
  AIVideoPlayerComponent,
  A2UIVideoState,
  A2UIRequestRecording,
  A2UIRecordingComplete,
  A2UIInitiateVideoCall,
  A2UIVideoCallEnded,
  A2UIGenerateVideo,
  A2UIVideoGenerationComplete
} from '@ainative/ai-kit-a2ui-core/types'
```

---

## See Also

- [Integration Patterns](./VIDEO_INTEGRATION_PATTERNS.md) - Common integration patterns
- [Use Cases](./VIDEO_USE_CASES.md) - Real-world examples
- [Video Protocol PRD](../planning/video-protocol-prd.md) - Complete specification
- [Main API Documentation](./API.md) - Core A2UI API
