# A2UI Video Protocol Specification (v0.10)

**Version:** 0.10.0
**Status:** Draft
**Last Updated:** 2026-02-08
**Author:** AINative Studio

---

## Table of Contents

1. [Introduction](#introduction)
2. [Protocol Overview](#protocol-overview)
3. [Message Types](#message-types)
4. [Component Specification](#component-specification)
5. [State Management](#state-management)
6. [Error Handling](#error-handling)
7. [Message Flow Diagrams](#message-flow-diagrams)
8. [Type Definitions](#type-definitions)
9. [Implementation Guidelines](#implementation-guidelines)
10. [Examples](#examples)
11. [Versioning and Compatibility](#versioning-and-compatibility)

---

## Introduction

### Purpose

The A2UI Video Protocol extends the A2UI specification (v0.9) to support video components and real-time video streaming. This specification defines the protocol-level message types, component schemas, and communication patterns that enable AI agents to create video-enabled user interfaces.

### Scope

This document specifies:

- **Message type definitions** for video operations (recording, calls, generation)
- **Component type definitions** for video UI elements
- **State management patterns** for video data
- **Error handling specifications** for video operations
- **Communication protocols** between agents and renderers

This document does NOT specify:

- Video implementation details (handled by `@ainative/ai-kit-video`)
- WebRTC signaling protocols (handled by AIKit Video)
- AI video generation algorithms (handled by AIKit Video)
- Storage or CDN integration patterns

### Key Principles

1. **Protocol Layer Only** - Type definitions and schemas, no implementations
2. **Framework Agnostic** - Works with any renderer (React, Vue, Svelte, etc.)
3. **Type Safe** - Complete TypeScript definitions for all protocol elements
4. **Backward Compatible** - Extends v0.9 without breaking changes
5. **Implementation Agnostic** - Video functionality provided by AIKit Video package

---

## Protocol Overview

### Architecture

```
┌─────────────────────────────────────────────┐
│  AI Agent (Python/TypeScript/Other)        │
│  Sends video protocol messages             │
└─────────────────────────────────────────────┘
                    ↓ WebSocket (JSON)
┌─────────────────────────────────────────────┐
│  A2UI Core Protocol Layer                   │
│  - Message routing                          │
│  - Type validation                          │
│  - State management                         │
└─────────────────────────────────────────────┘
                    ↓ Type-safe events
┌─────────────────────────────────────────────┐
│  Framework Renderer (React/Vue/Svelte)      │
│  - Renders video components                 │
│  - Handles user interactions                │
│  - Manages video state                      │
└─────────────────────────────────────────────┘
                    ↓ Component imports
┌─────────────────────────────────────────────┐
│  AIKit Video Implementation                 │
│  - VideoRecorder component                  │
│  - VideoCall component                      │
│  - AIVideo generation                       │
│  - AIVideoPlayer component                  │
└─────────────────────────────────────────────┘
```

### Protocol Extensions

A2UI v0.10 adds:

- **4 new component types**: `videoRecorder`, `videoCall`, `aiVideo`, `aiVideoPlayer`
- **9 new message types**: Recording, call, and generation lifecycle messages
- **Video state types**: Recording, call, and generation state definitions
- **Error codes**: Video-specific error handling

### Communication Pattern

The protocol follows a bidirectional message-passing pattern:

1. **Agent → Renderer**: Command messages (request recording, initiate call, generate video)
2. **Renderer → Agent**: Status messages (started, progress, complete, error)
3. **User Interactions**: Handled through existing `userAction` messages

---

## Message Types

### Recording Messages

#### RequestRecordingMessage (Agent → Renderer)

Requests the renderer to start a video/screen recording.

```typescript
interface RequestRecordingMessage extends BaseMessage {
  type: 'requestRecording'
  surfaceId: string
  recordingId: string
  mode: 'screen' | 'camera' | 'pip'
  options?: {
    audio?: boolean
    quality?: 'low' | 'medium' | 'high'
    duration?: number
  }
}
```

**Fields:**

- `surfaceId` (string, required) - Surface identifier where recording is requested
- `recordingId` (string, required) - Unique identifier for this recording session
- `mode` (enum, required) - Recording mode:
  - `screen`: Screen capture only
  - `camera`: Camera capture only
  - `pip`: Picture-in-picture (screen + camera)
- `options.audio` (boolean, optional) - Include audio in recording (default: true)
- `options.quality` (enum, optional) - Video quality (default: 'high')
- `options.duration` (number, optional) - Maximum duration in seconds

**Example:**

```json
{
  "type": "requestRecording",
  "surfaceId": "dashboard-1",
  "recordingId": "rec-123",
  "mode": "screen",
  "options": {
    "audio": true,
    "quality": "high",
    "duration": 300
  }
}
```

#### RecordingStartedMessage (Renderer → Agent)

Confirms recording has started successfully.

```typescript
interface RecordingStartedMessage extends BaseMessage {
  type: 'recordingStarted'
  surfaceId: string
  recordingId: string
  timestamp: string
}
```

**Fields:**

- `surfaceId` (string, required) - Surface identifier
- `recordingId` (string, required) - Recording identifier from request
- `timestamp` (string, required) - ISO 8601 timestamp when recording started

**Example:**

```json
{
  "type": "recordingStarted",
  "surfaceId": "dashboard-1",
  "recordingId": "rec-123",
  "timestamp": "2026-02-08T10:30:00.000Z"
}
```

#### RecordingCompleteMessage (Renderer → Agent)

Sent when recording is finished and processed.

```typescript
interface RecordingCompleteMessage extends BaseMessage {
  type: 'recordingComplete'
  surfaceId: string
  recordingId: string
  videoUrl: string
  duration: number
  transcript?: string
  highlights?: Array<{
    timestamp: number
    confidence: number
  }>
}
```

**Fields:**

- `surfaceId` (string, required) - Surface identifier
- `recordingId` (string, required) - Recording identifier
- `videoUrl` (string, required) - URL to the recorded video file
- `duration` (number, required) - Total duration in seconds
- `transcript` (string, optional) - AI-generated transcript (if AI transcription enabled)
- `highlights` (array, optional) - AI-detected highlight moments with confidence scores

**Example:**

```json
{
  "type": "recordingComplete",
  "surfaceId": "dashboard-1",
  "recordingId": "rec-123",
  "videoUrl": "https://cdn.example.com/recordings/rec-123.mp4",
  "duration": 125.5,
  "transcript": "In this video, I'll show you how to...",
  "highlights": [
    { "timestamp": 15.2, "confidence": 0.95 },
    { "timestamp": 67.8, "confidence": 0.88 }
  ]
}
```

### Video Call Messages

#### InitiateVideoCallMessage (Agent → Renderer)

Requests to start a video call session.

```typescript
interface InitiateVideoCallMessage extends BaseMessage {
  type: 'initiateVideoCall'
  surfaceId: string
  callId: string
  roomId: string
  participants?: string[]
}
```

**Fields:**

- `surfaceId` (string, required) - Surface identifier
- `callId` (string, required) - Unique call identifier
- `roomId` (string, required) - Room/session identifier for WebRTC
- `participants` (array, optional) - List of participant identifiers to invite

**Example:**

```json
{
  "type": "initiateVideoCall",
  "surfaceId": "meeting-room",
  "callId": "call-456",
  "roomId": "room-abc123",
  "participants": ["user-001", "user-002", "user-003"]
}
```

#### VideoCallJoinedMessage (Renderer → Agent)

Sent when a participant joins the call.

```typescript
interface VideoCallJoinedMessage extends BaseMessage {
  type: 'videoCallJoined'
  surfaceId: string
  callId: string
  participantId: string
  timestamp: string
  participant?: VideoCallParticipant
}
```

**VideoCallParticipant Type:**

```typescript
interface VideoCallParticipant {
  id: string
  name: string
  role: 'host' | 'participant'
  isMuted: boolean
  isVideoEnabled: boolean
  avatarUrl?: string
  joinedAt?: string
}
```

**Fields:**

- `surfaceId` (string, required) - Surface identifier
- `callId` (string, required) - Call identifier
- `participantId` (string, required) - ID of participant who joined
- `timestamp` (string, required) - ISO 8601 timestamp
- `participant` (object, optional) - Full participant details

**Example:**

```json
{
  "type": "videoCallJoined",
  "surfaceId": "meeting-room",
  "callId": "call-456",
  "participantId": "user-001",
  "timestamp": "2026-02-08T10:35:00.000Z",
  "participant": {
    "id": "user-001",
    "name": "Alice Johnson",
    "role": "host",
    "isMuted": false,
    "isVideoEnabled": true,
    "avatarUrl": "https://example.com/avatar-001.jpg",
    "joinedAt": "2026-02-08T10:35:00.000Z"
  }
}
```

#### VideoCallEndedMessage (Renderer → Agent)

Sent when the call ends.

```typescript
interface VideoCallEndedMessage extends BaseMessage {
  type: 'videoCallEnded'
  surfaceId: string
  callId: string
  duration: number
  transcript?: string
  summary?: string
  actionItems?: string[]
  participants?: VideoCallParticipant[]
}
```

**Fields:**

- `surfaceId` (string, required) - Surface identifier
- `callId` (string, required) - Call identifier
- `duration` (number, required) - Total call duration in seconds
- `transcript` (string, optional) - AI-generated call transcript
- `summary` (string, optional) - AI-generated call summary
- `actionItems` (array, optional) - AI-detected action items
- `participants` (array, optional) - Final list of all participants

**Example:**

```json
{
  "type": "videoCallEnded",
  "surfaceId": "meeting-room",
  "callId": "call-456",
  "duration": 1847,
  "transcript": "Alice: Let's start with the project update...",
  "summary": "Team discussed project milestones and decided to launch beta on March 1st.",
  "actionItems": [
    "Alice to finalize designs by Feb 15",
    "Bob to complete API integration by Feb 20",
    "Team to schedule beta launch review"
  ]
}
```

### Video Generation Messages

#### GenerateVideoMessage (Agent → Renderer)

Requests AI video generation.

```typescript
interface GenerateVideoMessage extends BaseMessage {
  type: 'generateVideo'
  surfaceId: string
  videoId: string
  prompt: string
  data?: Record<string, unknown>
  template?: string
}
```

**Fields:**

- `surfaceId` (string, required) - Surface identifier
- `videoId` (string, required) - Unique video identifier
- `prompt` (string, required) - Generation prompt/instructions
- `data` (object, optional) - Template data for programmatic generation
- `template` (string, optional) - Template identifier for composition

**Example:**

```json
{
  "type": "generateVideo",
  "surfaceId": "content-studio",
  "videoId": "vid-789",
  "prompt": "Create a 30-second product demo video",
  "data": {
    "productName": "AI Assistant Pro",
    "features": ["Voice control", "Smart automation", "Multi-language"],
    "price": "$9.99/month"
  },
  "template": "product-showcase-v2"
}
```

#### VideoGenerationProgressMessage (Renderer → Agent)

Streaming progress updates during generation.

```typescript
interface VideoGenerationProgressMessage extends BaseMessage {
  type: 'videoGenerationProgress'
  surfaceId: string
  videoId: string
  progress: number
  frame?: string
}
```

**Fields:**

- `surfaceId` (string, required) - Surface identifier
- `videoId` (string, required) - Video identifier
- `progress` (number, required) - Progress percentage (0-100)
- `frame` (string, optional) - Base64-encoded preview frame

**Example:**

```json
{
  "type": "videoGenerationProgress",
  "surfaceId": "content-studio",
  "videoId": "vid-789",
  "progress": 45,
  "frame": "data:image/png;base64,iVBORw0KGgoAAAANS..."
}
```

#### VideoGenerationCompleteMessage (Renderer → Agent)

Sent when video generation is finished.

```typescript
interface VideoGenerationCompleteMessage extends BaseMessage {
  type: 'videoGenerationComplete'
  surfaceId: string
  videoId: string
  videoUrl: string
  composition?: Record<string, unknown>
}
```

**Fields:**

- `surfaceId` (string, required) - Surface identifier
- `videoId` (string, required) - Video identifier
- `videoUrl` (string, required) - URL to generated video
- `composition` (object, optional) - Remotion composition metadata

**Example:**

```json
{
  "type": "videoGenerationComplete",
  "surfaceId": "content-studio",
  "videoId": "vid-789",
  "videoUrl": "https://cdn.example.com/generated/vid-789.mp4",
  "composition": {
    "durationInFrames": 900,
    "fps": 30,
    "width": 1920,
    "height": 1080
  }
}
```

---

## Component Specification

### VideoRecorder Component

Records screen, camera, or both with optional AI features.

```typescript
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
      zerodb?: boolean
    }
    onStart?: string
    onComplete?: string
    onError?: string
  }
}
```

**Properties:**

- `mode` (enum, required) - Recording mode
- `audio` (boolean, optional) - Include audio (default: true)
- `quality` (enum, optional) - Video quality (default: 'high')
- `ai.transcribe` (boolean, optional) - Enable AI transcription (default: false)
- `ai.highlights` (boolean, optional) - Enable AI highlight detection (default: false)
- `ai.summary` (boolean, optional) - Enable AI summary generation (default: false)
- `ai.zerodb` (boolean, optional) - Auto-store in ZeroDB (default: false)
- `onStart` (string, optional) - JSON pointer to action handler when recording starts
- `onComplete` (string, optional) - JSON pointer to action handler when recording completes
- `onError` (string, optional) - JSON pointer to error handler

**Example:**

```json
{
  "id": "recorder-1",
  "type": "videoRecorder",
  "properties": {
    "mode": "screen",
    "audio": true,
    "quality": "high",
    "ai": {
      "transcribe": true,
      "highlights": true,
      "summary": false,
      "zerodb": true
    },
    "onComplete": "/actions/handleRecordingComplete"
  }
}
```

### VideoCall Component

Real-time video conferencing with AI enhancements.

```typescript
interface VideoCallComponent extends A2UIComponent {
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
    onJoin?: string
    onLeave?: string
    onError?: string
  }
}
```

**Properties:**

- `roomId` (string, required) - Room/session identifier
- `layout` (enum, optional) - UI layout (default: 'grid')
- `features.chat` (boolean, optional) - Enable chat (default: true)
- `features.screenShare` (boolean, optional) - Enable screen sharing (default: true)
- `features.recording` (boolean, optional) - Enable call recording (default: false)
- `ai.liveTranscription` (boolean, optional) - Enable live transcription (default: false)
- `ai.liveCaptions` (boolean, optional) - Enable live captions (default: false)
- `ai.translation` (string, optional) - Language code for translation (e.g., 'es', 'fr')
- `ai.noiseCancellation` (boolean, optional) - Enable AI noise cancellation (default: false)
- `ai.speakerIdentification` (boolean, optional) - Identify speakers (default: false)
- `ai.actionItemDetection` (boolean, optional) - Detect action items (default: false)
- `onJoin` (string, optional) - JSON pointer to join handler
- `onLeave` (string, optional) - JSON pointer to leave handler
- `onError` (string, optional) - JSON pointer to error handler

**Example:**

```json
{
  "id": "call-1",
  "type": "videoCall",
  "properties": {
    "roomId": "room-abc123",
    "layout": "speaker",
    "features": {
      "chat": true,
      "screenShare": true,
      "recording": true
    },
    "ai": {
      "liveTranscription": true,
      "liveCaptions": true,
      "noiseCancellation": true,
      "actionItemDetection": true
    },
    "onJoin": "/actions/handleCallJoin",
    "onLeave": "/actions/handleCallLeave"
  }
}
```

### AIVideo Component

AI-generated video from prompts or templates.

```typescript
interface AIVideoComponent extends A2UIComponent {
  type: 'aiVideo'
  properties: {
    prompt?: string
    template?: string
    data?: Record<string, unknown>
    voice?: string
    streaming?: boolean
    onProgress?: string
    onComplete?: string
    onError?: string
  }
}
```

**Properties:**

- `prompt` (string, optional) - Generation prompt/instructions
- `template` (string, optional) - Template identifier
- `data` (object, optional) - Template data
- `voice` (string, optional) - Voice identifier for narration
- `streaming` (boolean, optional) - Enable streaming preview (default: true)
- `onProgress` (string, optional) - JSON pointer to progress handler
- `onComplete` (string, optional) - JSON pointer to completion handler
- `onError` (string, optional) - JSON pointer to error handler

**Example:**

```json
{
  "id": "ai-video-1",
  "type": "aiVideo",
  "properties": {
    "prompt": "Create a tutorial video about React hooks",
    "template": "tutorial-v1",
    "data": {
      "title": "React Hooks Guide",
      "sections": ["useState", "useEffect", "useContext"]
    },
    "voice": "professional-male",
    "streaming": true,
    "onComplete": "/actions/handleVideoGenerated"
  }
}
```

### AIVideoPlayer Component

Interactive AI-aware video player with Q&A capabilities.

```typescript
interface AIVideoPlayerComponent extends A2UIComponent {
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
    onProgress?: string
    onQuestion?: string
  }
}
```

**Properties:**

- `videoUrl` (string, required) - Video URL to play
- `transcript` (string, optional) - Video transcript
- `interactive.allowQuestions` (boolean, optional) - Enable Q&A (default: true)
- `interactive.conversationalControl` (boolean, optional) - Voice/text control (default: true)
- `interactive.smartChapters` (boolean, optional) - AI-generated chapters (default: true)
- `interactive.semanticSearch` (boolean, optional) - Semantic search in video (default: true)
- `onProgress` (string, optional) - JSON pointer to progress handler
- `onQuestion` (string, optional) - JSON pointer to question handler

**Example:**

```json
{
  "id": "player-1",
  "type": "aiVideoPlayer",
  "properties": {
    "videoUrl": "https://cdn.example.com/videos/tutorial-123.mp4",
    "transcript": "Welcome to this tutorial on React hooks...",
    "interactive": {
      "allowQuestions": true,
      "conversationalControl": true,
      "smartChapters": true,
      "semanticSearch": true
    },
    "onQuestion": "/actions/handleVideoQuestion"
  }
}
```

---

## State Management

### Video State Structure

The protocol defines a standardized state structure for video data in the A2UI data model.

```typescript
interface A2UIVideoState {
  recordings: Record<string, RecordingState>
  calls: Record<string, CallState>
  generatedVideos: Record<string, GeneratedVideoState>
}

interface RecordingState {
  id: string
  status: 'idle' | 'recording' | 'processing' | 'complete' | 'error'
  mode: 'screen' | 'camera' | 'pip'
  videoUrl?: string
  transcript?: string
  duration?: number
  error?: string
  startedAt?: string
  completedAt?: string
}

interface CallState {
  id: string
  roomId: string
  status: 'idle' | 'connecting' | 'active' | 'ended' | 'error'
  participants: VideoCallParticipant[]
  transcript?: string
  summary?: string
  actionItems?: string[]
  duration?: number
  error?: string
  startedAt?: string
  endedAt?: string
}

interface GeneratedVideoState {
  id: string
  status: 'idle' | 'generating' | 'complete' | 'error'
  progress: number
  videoUrl?: string
  composition?: Record<string, unknown>
  error?: string
  startedAt?: string
  completedAt?: string
}
```

### State Update Examples

#### Recording State Updates

```json
{
  "type": "updateDataModel",
  "surfaceId": "dashboard-1",
  "updates": [
    {
      "path": "/videoState/recordings/rec-123",
      "operation": "set",
      "value": {
        "id": "rec-123",
        "status": "recording",
        "mode": "screen",
        "startedAt": "2026-02-08T10:30:00.000Z"
      }
    }
  ]
}
```

#### Call State Updates

```json
{
  "type": "updateDataModel",
  "surfaceId": "meeting-room",
  "updates": [
    {
      "path": "/videoState/calls/call-456/status",
      "operation": "set",
      "value": "active"
    },
    {
      "path": "/videoState/calls/call-456/participants",
      "operation": "set",
      "value": [
        {
          "id": "user-001",
          "name": "Alice",
          "role": "host",
          "isMuted": false,
          "isVideoEnabled": true
        }
      ]
    }
  ]
}
```

#### Generation State Updates

```json
{
  "type": "updateDataModel",
  "surfaceId": "content-studio",
  "updates": [
    {
      "path": "/videoState/generatedVideos/vid-789/progress",
      "operation": "set",
      "value": 45
    }
  ]
}
```

---

## Error Handling

### Error Codes

The protocol defines standardized error codes for video operations.

#### Recording Errors

- `RECORDING_PERMISSION_DENIED` - User denied screen/camera permissions
- `RECORDING_NOT_SUPPORTED` - Browser doesn't support MediaRecorder API
- `RECORDING_DEVICE_ERROR` - Hardware device error (camera/mic failure)
- `RECORDING_STORAGE_ERROR` - Failed to save recording
- `RECORDING_DURATION_EXCEEDED` - Recording exceeded maximum duration
- `RECORDING_CANCELLED` - User cancelled recording

#### Call Errors

- `CALL_CONNECTION_FAILED` - Failed to connect to room
- `CALL_PERMISSION_DENIED` - User denied camera/mic permissions
- `CALL_ROOM_FULL` - Maximum participants reached
- `CALL_INVALID_ROOM` - Room ID is invalid or expired
- `CALL_NETWORK_ERROR` - Network connectivity issues
- `CALL_DEVICE_ERROR` - Camera/mic hardware error

#### Generation Errors

- `GENERATION_FAILED` - Video generation failed
- `GENERATION_TIMEOUT` - Generation took too long
- `GENERATION_INVALID_PROMPT` - Prompt is invalid or unsupported
- `GENERATION_INVALID_TEMPLATE` - Template not found or invalid
- `GENERATION_QUOTA_EXCEEDED` - Generation quota exceeded

### Error Message Structure

```typescript
interface VideoErrorMessage extends ErrorMessage {
  type: 'error'
  code: string
  message: string
  details?: {
    videoId?: string
    recordingId?: string
    callId?: string
    surfaceId?: string
    originalError?: unknown
  }
}
```

### Error Handling Examples

#### Recording Error

```json
{
  "type": "error",
  "code": "RECORDING_PERMISSION_DENIED",
  "message": "User denied screen recording permission",
  "details": {
    "surfaceId": "dashboard-1",
    "recordingId": "rec-123"
  }
}
```

#### Call Error

```json
{
  "type": "error",
  "code": "CALL_CONNECTION_FAILED",
  "message": "Failed to connect to video call room",
  "details": {
    "surfaceId": "meeting-room",
    "callId": "call-456",
    "originalError": "WebRTC peer connection failed"
  }
}
```

#### Generation Error

```json
{
  "type": "error",
  "code": "GENERATION_TIMEOUT",
  "message": "Video generation exceeded maximum time limit",
  "details": {
    "surfaceId": "content-studio",
    "videoId": "vid-789"
  }
}
```

---

## Message Flow Diagrams

### Recording Flow

```
┌─────────┐                 ┌──────────┐                ┌──────┐
│  Agent  │                 │ Renderer │                │ User │
└────┬────┘                 └────┬─────┘                └───┬──┘
     │                           │                          │
     │ RequestRecording          │                          │
     │──────────────────────────>│                          │
     │                           │                          │
     │                           │ Request permission       │
     │                           │<─────────────────────────│
     │                           │                          │
     │                           │ Grant permission         │
     │                           │─────────────────────────>│
     │                           │                          │
     │ RecordingStarted          │                          │
     │<──────────────────────────│                          │
     │                           │                          │
     │                           │    Recording active      │
     │                           │<─────────────────────────│
     │                           │                          │
     │                           │ Stop recording           │
     │                           │<─────────────────────────│
     │                           │                          │
     │                           │ [Processing video]       │
     │                           │                          │
     │ RecordingComplete         │                          │
     │<──────────────────────────│                          │
     │ (with videoUrl,           │                          │
     │  transcript, highlights)  │                          │
     │                           │                          │
```

### Video Call Flow

```
┌─────────┐                 ┌──────────┐                ┌──────────────┐
│  Agent  │                 │ Renderer │                │ Participants │
└────┬────┘                 └────┬─────┘                └──────┬───────┘
     │                           │                             │
     │ InitiateVideoCall         │                             │
     │──────────────────────────>│                             │
     │                           │                             │
     │                           │ Join room                   │
     │                           │<────────────────────────────│
     │                           │                             │
     │ VideoCallJoined           │                             │
     │<──────────────────────────│                             │
     │ (participant info)        │                             │
     │                           │                             │
     │                           │   Active call               │
     │                           │<───────────────────────────>│
     │                           │                             │
     │                           │ Leave call                  │
     │                           │<────────────────────────────│
     │                           │                             │
     │ VideoCallEnded            │                             │
     │<──────────────────────────│                             │
     │ (transcript, summary,     │                             │
     │  action items)            │                             │
     │                           │                             │
```

### Video Generation Flow

```
┌─────────┐                 ┌──────────┐
│  Agent  │                 │ Renderer │
└────┬────┘                 └────┬─────┘
     │                           │
     │ GenerateVideo             │
     │──────────────────────────>│
     │ (prompt, template, data)  │
     │                           │
     │                           │ [Start generation]
     │                           │
     │ VideoGenerationProgress   │
     │<──────────────────────────│
     │ (progress: 10%)           │
     │                           │
     │ VideoGenerationProgress   │
     │<──────────────────────────│
     │ (progress: 25%, frame)    │
     │                           │
     │ VideoGenerationProgress   │
     │<──────────────────────────│
     │ (progress: 50%, frame)    │
     │                           │
     │ ...                       │
     │                           │
     │ VideoGenerationProgress   │
     │<──────────────────────────│
     │ (progress: 100%)          │
     │                           │
     │ VideoGenerationComplete   │
     │<──────────────────────────│
     │ (videoUrl, composition)   │
     │                           │
```

---

## Type Definitions

### Complete TypeScript Definitions

```typescript
// ============================================================================
// Component Types
// ============================================================================

export type VideoComponentType =
  | 'videoRecorder'
  | 'videoCall'
  | 'aiVideo'
  | 'aiVideoPlayer'

export type RecordingMode = 'screen' | 'camera' | 'pip'
export type VideoQuality = 'low' | 'medium' | 'high'
export type VideoLayout = 'grid' | 'speaker' | 'sidebar'

export interface VideoRecorderComponent extends A2UIComponent {
  type: 'videoRecorder'
  properties: {
    mode: RecordingMode
    audio?: boolean
    quality?: VideoQuality
    ai?: {
      transcribe?: boolean
      highlights?: boolean
      summary?: boolean
      zerodb?: boolean
    }
    onStart?: string
    onComplete?: string
    onError?: string
  }
}

export interface VideoCallComponent extends A2UIComponent {
  type: 'videoCall'
  properties: {
    roomId: string
    layout?: VideoLayout
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
    onJoin?: string
    onLeave?: string
    onError?: string
  }
}

export interface AIVideoComponent extends A2UIComponent {
  type: 'aiVideo'
  properties: {
    prompt?: string
    template?: string
    data?: Record<string, unknown>
    voice?: string
    streaming?: boolean
    onProgress?: string
    onComplete?: string
    onError?: string
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
    onProgress?: string
    onQuestion?: string
  }
}

// ============================================================================
// Message Types
// ============================================================================

export type VideoMessageType =
  | 'requestRecording'
  | 'recordingStarted'
  | 'recordingComplete'
  | 'initiateVideoCall'
  | 'videoCallJoined'
  | 'videoCallEnded'
  | 'generateVideo'
  | 'videoGenerationProgress'
  | 'videoGenerationComplete'

export interface RequestRecordingMessage extends BaseMessage {
  type: 'requestRecording'
  surfaceId: string
  recordingId: string
  mode: RecordingMode
  options?: {
    audio?: boolean
    quality?: VideoQuality
    duration?: number
  }
}

export interface RecordingStartedMessage extends BaseMessage {
  type: 'recordingStarted'
  surfaceId: string
  recordingId: string
  timestamp: string
}

export interface RecordingCompleteMessage extends BaseMessage {
  type: 'recordingComplete'
  surfaceId: string
  recordingId: string
  videoUrl: string
  duration: number
  transcript?: string
  highlights?: Array<{
    timestamp: number
    confidence: number
  }>
}

export interface InitiateVideoCallMessage extends BaseMessage {
  type: 'initiateVideoCall'
  surfaceId: string
  callId: string
  roomId: string
  participants?: string[]
}

export interface VideoCallJoinedMessage extends BaseMessage {
  type: 'videoCallJoined'
  surfaceId: string
  callId: string
  participantId: string
  timestamp: string
  participant?: VideoCallParticipant
}

export interface VideoCallEndedMessage extends BaseMessage {
  type: 'videoCallEnded'
  surfaceId: string
  callId: string
  duration: number
  transcript?: string
  summary?: string
  actionItems?: string[]
  participants?: VideoCallParticipant[]
}

export interface GenerateVideoMessage extends BaseMessage {
  type: 'generateVideo'
  surfaceId: string
  videoId: string
  prompt: string
  data?: Record<string, unknown>
  template?: string
}

export interface VideoGenerationProgressMessage extends BaseMessage {
  type: 'videoGenerationProgress'
  surfaceId: string
  videoId: string
  progress: number
  frame?: string
}

export interface VideoGenerationCompleteMessage extends BaseMessage {
  type: 'videoGenerationComplete'
  surfaceId: string
  videoId: string
  videoUrl: string
  composition?: Record<string, unknown>
}

export type VideoMessage =
  | RequestRecordingMessage
  | RecordingStartedMessage
  | RecordingCompleteMessage
  | InitiateVideoCallMessage
  | VideoCallJoinedMessage
  | VideoCallEndedMessage
  | GenerateVideoMessage
  | VideoGenerationProgressMessage
  | VideoGenerationCompleteMessage

// ============================================================================
// State Types
// ============================================================================

export type RecordingState = 'idle' | 'recording' | 'processing' | 'complete' | 'error'
export type VideoCallState = 'idle' | 'connecting' | 'active' | 'ended' | 'error'
export type VideoGenerationState = 'idle' | 'generating' | 'complete' | 'error'

export interface VideoCallParticipant {
  id: string
  name: string
  role: 'host' | 'participant'
  isMuted: boolean
  isVideoEnabled: boolean
  avatarUrl?: string
  joinedAt?: string
}

export interface A2UIVideoState {
  recordings: Record<string, {
    id: string
    status: RecordingState
    mode: RecordingMode
    videoUrl?: string
    transcript?: string
    duration?: number
    error?: string
    startedAt?: string
    completedAt?: string
  }>
  calls: Record<string, {
    id: string
    roomId: string
    status: VideoCallState
    participants: VideoCallParticipant[]
    transcript?: string
    summary?: string
    actionItems?: string[]
    duration?: number
    error?: string
    startedAt?: string
    endedAt?: string
  }>
  generatedVideos: Record<string, {
    id: string
    status: VideoGenerationState
    progress: number
    videoUrl?: string
    composition?: Record<string, unknown>
    error?: string
    startedAt?: string
    completedAt?: string
  }>
}
```

---

## Implementation Guidelines

### For Agent Developers

1. **Use Descriptive IDs**: Always use meaningful identifiers for recordings, calls, and videos
2. **Handle State Updates**: Update data model when receiving status messages
3. **Implement Error Handlers**: Always provide error handling for video operations
4. **Respect User Permissions**: Be prepared for permission denial errors
5. **Provide Feedback**: Show progress and status to users during operations

### For Renderer Developers

1. **Import AIKit Video**: Use `@ainative/ai-kit-video` for video implementations
2. **Register Components**: Register video components in ComponentRegistry
3. **Handle Permissions**: Request browser permissions before operations
4. **Send Status Updates**: Always send started/progress/complete messages
5. **Error Reporting**: Send detailed error messages with codes

### For Framework Integration

```typescript
// React renderer example
import {
  VideoRecorder,
  VideoCall,
  AIVideo,
  AIVideoPlayer
} from '@ainative/ai-kit-video'
import { ComponentRegistry } from '@ainative/ai-kit-a2ui-core/registry'

// Register video components
const registry = ComponentRegistry.standard()

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

---

## Examples

### Complete Recording Example

#### Agent Creates Recording UI

```json
{
  "type": "createSurface",
  "surfaceId": "screen-recorder",
  "components": [
    {
      "id": "card-1",
      "type": "card",
      "properties": {
        "title": "Screen Recording"
      },
      "children": ["recorder-1", "status-1"]
    },
    {
      "id": "recorder-1",
      "type": "videoRecorder",
      "properties": {
        "mode": "screen",
        "audio": true,
        "quality": "high",
        "ai": {
          "transcribe": true,
          "highlights": true
        },
        "onComplete": "/actions/handleRecordingComplete"
      }
    },
    {
      "id": "status-1",
      "type": "text",
      "properties": {
        "value": "",
        "dataBinding": "/recordingStatus"
      }
    }
  ],
  "dataModel": {
    "recordingStatus": "Ready to record",
    "videoState": {
      "recordings": {}
    }
  }
}
```

#### User Starts Recording

Renderer sends:

```json
{
  "type": "recordingStarted",
  "surfaceId": "screen-recorder",
  "recordingId": "rec-001",
  "timestamp": "2026-02-08T10:30:00.000Z"
}
```

Agent updates UI:

```json
{
  "type": "updateDataModel",
  "surfaceId": "screen-recorder",
  "updates": [
    {
      "path": "/recordingStatus",
      "operation": "set",
      "value": "Recording in progress..."
    },
    {
      "path": "/videoState/recordings/rec-001",
      "operation": "set",
      "value": {
        "id": "rec-001",
        "status": "recording",
        "mode": "screen",
        "startedAt": "2026-02-08T10:30:00.000Z"
      }
    }
  ]
}
```

#### Recording Completes

Renderer sends:

```json
{
  "type": "recordingComplete",
  "surfaceId": "screen-recorder",
  "recordingId": "rec-001",
  "videoUrl": "https://cdn.example.com/recordings/rec-001.mp4",
  "duration": 125.5,
  "transcript": "Welcome to this tutorial on A2UI video protocol...",
  "highlights": [
    { "timestamp": 15.2, "confidence": 0.95 },
    { "timestamp": 67.8, "confidence": 0.88 }
  ]
}
```

Agent shows results:

```json
{
  "type": "updateComponents",
  "surfaceId": "screen-recorder",
  "updates": [
    {
      "id": "player-1",
      "operation": "add",
      "component": {
        "id": "player-1",
        "type": "aiVideoPlayer",
        "properties": {
          "videoUrl": "https://cdn.example.com/recordings/rec-001.mp4",
          "transcript": "Welcome to this tutorial on A2UI video protocol...",
          "interactive": {
            "allowQuestions": true,
            "smartChapters": true
          }
        }
      }
    }
  ]
}
```

### Complete Video Call Example

#### Agent Initiates Call

```json
{
  "type": "createSurface",
  "surfaceId": "video-meeting",
  "components": [
    {
      "id": "call-1",
      "type": "videoCall",
      "properties": {
        "roomId": "meeting-abc123",
        "layout": "grid",
        "features": {
          "chat": true,
          "screenShare": true,
          "recording": true
        },
        "ai": {
          "liveTranscription": true,
          "actionItemDetection": true
        },
        "onLeave": "/actions/handleCallEnd"
      }
    }
  ],
  "dataModel": {
    "videoState": {
      "calls": {}
    }
  }
}
```

Then sends initiate message:

```json
{
  "type": "initiateVideoCall",
  "surfaceId": "video-meeting",
  "callId": "call-001",
  "roomId": "meeting-abc123",
  "participants": ["user-001", "user-002", "user-003"]
}
```

#### Participants Join

Renderer sends for each participant:

```json
{
  "type": "videoCallJoined",
  "surfaceId": "video-meeting",
  "callId": "call-001",
  "participantId": "user-001",
  "timestamp": "2026-02-08T14:00:00.000Z",
  "participant": {
    "id": "user-001",
    "name": "Alice Johnson",
    "role": "host",
    "isMuted": false,
    "isVideoEnabled": true,
    "avatarUrl": "https://example.com/avatars/alice.jpg"
  }
}
```

#### Call Ends

Renderer sends:

```json
{
  "type": "videoCallEnded",
  "surfaceId": "video-meeting",
  "callId": "call-001",
  "duration": 1847,
  "transcript": "Alice: Let's start with the project update...",
  "summary": "Team discussed Q1 project milestones and decided to launch beta version on March 1st.",
  "actionItems": [
    "Alice to finalize UI designs by Feb 15",
    "Bob to complete API integration by Feb 20",
    "Team to schedule beta launch review meeting"
  ],
  "participants": [
    {
      "id": "user-001",
      "name": "Alice Johnson",
      "role": "host",
      "isMuted": false,
      "isVideoEnabled": true
    },
    {
      "id": "user-002",
      "name": "Bob Smith",
      "role": "participant",
      "isMuted": false,
      "isVideoEnabled": true
    }
  ]
}
```

---

## Versioning and Compatibility

### Protocol Version: 0.10.0

This specification defines A2UI protocol version 0.10, which extends v0.9 with video capabilities.

### Changes from v0.9

**Added:**
- 4 new component types: `videoRecorder`, `videoCall`, `aiVideo`, `aiVideoPlayer`
- 9 new message types for video operations
- Video state management structures
- Video-specific error codes

**Backward Compatibility:**
- All v0.9 components and messages remain unchanged
- Renderers without video support can gracefully ignore video messages
- Agents can detect video capability and fall back to v0.9

### Capability Detection

Renderers should advertise video support during handshake:

```json
{
  "type": "handshake",
  "version": "0.10",
  "capabilities": {
    "video": {
      "recording": true,
      "calls": true,
      "generation": true,
      "aiFeatures": ["transcription", "highlights", "summary"]
    }
  }
}
```

### Graceful Degradation

If video is not supported:

1. Agent receives error: `VIDEO_NOT_SUPPORTED`
2. Agent falls back to alternative UI (e.g., file upload)
3. User experience degrades gracefully

---

## Appendix

### References

- [A2UI Specification v0.9](https://github.com/google/a2ui)
- [RFC 6901: JSON Pointer](https://datatracker.ietf.org/doc/html/rfc6901)
- [WebSocket Protocol (RFC 6455)](https://datatracker.ietf.org/doc/html/rfc6455)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [WebRTC Specification](https://www.w3.org/TR/webrtc/)

### Glossary

- **Agent**: AI system that generates A2UI messages
- **Renderer**: Client application that displays A2UI components
- **Surface**: Independent UI instance with its own components and data model
- **Component**: UI element with type, properties, and optional children
- **Data Model**: JSON data structure that can be bound to component properties
- **JSON Pointer**: RFC 6901 syntax for referencing JSON data

### Related Documentation

- [AIKit Video Integration Requirements](/docs/planning/AIKIT_VIDEO_INTEGRATION_REQUIREMENTS.md)
- [Video Protocol PRD](/docs/planning/video-protocol-prd.md)
- [A2UI Core API Documentation](/README.md)

---

**Document Status:** Draft
**Next Review:** TBD
**Feedback:** Please submit issues or PRs to the GitHub repository

**Copyright:** © 2026 AINative Studio
**License:** MIT
