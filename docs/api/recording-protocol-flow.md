# Video Recording Protocol Flow

**Version**: 0.10.0-alpha
**Last Updated**: 2026-02-08
**Status**: Specification

## Overview

This document specifies the WebSocket message flow for the A2UI Video Recording protocol. The recording flow enables agents to request screen/camera recordings from renderers and receive the resulting video with AI-generated metadata.

## Message Types

The recording flow uses three primary message types:

1. **A2UIRequestRecording** (Agent → Renderer) - Initiates recording
2. **A2UIRecordingStarted** (Renderer → Agent) - Confirms recording began
3. **A2UIRecordingComplete** (Renderer → Agent) - Delivers finished video with metadata

## Basic Recording Flow

```mermaid
sequenceDiagram
    participant Agent
    participant Renderer
    participant User
    participant AIKit as AIKit Video

    Agent->>Renderer: A2UIRequestRecording
    Note over Agent,Renderer: {type: 'requestRecording', surfaceId, recordingId, mode, options}

    Renderer->>User: Prompt for permission
    Note over User: Browser permission dialog

    User->>Renderer: Grant permission

    Renderer->>AIKit: Start recording
    Note over AIKit: Initialize VideoRecorder

    Renderer->>Agent: A2UIRecordingStarted
    Note over Renderer,Agent: {type: 'recordingStarted', recordingId, timestamp}

    Note over User,AIKit: User records video/screen

    User->>Renderer: Stop recording

    Renderer->>AIKit: Stop & process

    alt AI Processing Enabled
        AIKit->>AIKit: Generate transcript
        AIKit->>AIKit: Detect highlights
        AIKit->>AIKit: Create summary
    end

    AIKit->>Renderer: Video + metadata ready

    Renderer->>Agent: A2UIRecordingComplete
    Note over Renderer,Agent: {type: 'recordingComplete', recordingId,<br/>videoUrl, duration, transcript, highlights}
```

## Recording with AI Features

When AI features are enabled in the recording request, AIKit Video performs post-processing:

```mermaid
sequenceDiagram
    participant Agent
    participant Renderer
    participant AIKit as AIKit Video
    participant ZeroDB

    Agent->>Renderer: requestRecording
    Note over Agent,Renderer: {ai: {transcribe: true, highlights: true, summary: true}}

    Renderer->>AIKit: startRecording(options)

    Note over Renderer,Agent: ...recording happens...

    AIKit->>AIKit: stopRecording()

    AIKit->>AIKit: Transcribe audio
    Note over AIKit: Speech-to-text processing

    AIKit->>AIKit: Detect highlights
    Note over AIKit: ML-based scene detection

    AIKit->>AIKit: Generate summary
    Note over AIKit: LLM summarization

    opt ZeroDB Integration
        AIKit->>ZeroDB: Store video + metadata
        ZeroDB->>AIKit: Video URL + vector embeddings
    end

    AIKit->>Renderer: Complete with metadata

    Renderer->>Agent: recordingComplete
    Note over Renderer,Agent: {videoUrl, duration, transcript,<br/>highlights: [{timestamp, confidence}],<br/>summary}
```

## Screen Recording Flow

```mermaid
sequenceDiagram
    participant Agent
    participant Renderer
    participant Browser
    participant User

    Agent->>Renderer: requestRecording
    Note over Agent,Renderer: {mode: 'screen', audio: true}

    Renderer->>Browser: getDisplayMedia()

    Browser->>User: Screen picker dialog
    Note over User: Select screen/window/tab

    User->>Browser: Select source

    Browser->>Renderer: MediaStream (video + audio)

    Renderer->>Agent: recordingStarted

    Note over Renderer,User: Recording indicator visible

    User->>Renderer: Click stop (or Browser stop button)

    Renderer->>Browser: Stop tracks

    Renderer->>Agent: recordingComplete
    Note over Renderer,Agent: {videoUrl: blob URL or CDN URL}
```

## Camera Recording Flow

```mermaid
sequenceDiagram
    participant Agent
    participant Renderer
    participant Browser
    participant User

    Agent->>Renderer: requestRecording
    Note over Agent,Renderer: {mode: 'camera', audio: true, quality: 'high'}

    Renderer->>Browser: getUserMedia({video, audio})

    Browser->>User: Camera permission prompt

    User->>Browser: Allow

    Browser->>Renderer: MediaStream

    Renderer->>User: Show camera preview

    Renderer->>Agent: recordingStarted

    User->>Renderer: Record session

    User->>Renderer: Stop recording

    Renderer->>Agent: recordingComplete
    Note over Renderer,Agent: {videoUrl, duration}
```

## Picture-in-Picture (PiP) Recording Flow

```mermaid
sequenceDiagram
    participant Agent
    participant Renderer
    participant Browser
    participant User

    Agent->>Renderer: requestRecording
    Note over Agent,Renderer: {mode: 'pip', audio: true}

    Renderer->>Browser: getDisplayMedia() + getUserMedia()

    Browser->>User: Permission prompts

    User->>Browser: Grant both permissions

    Browser->>Renderer: Screen MediaStream
    Browser->>Renderer: Camera MediaStream

    Renderer->>Renderer: Composite streams
    Note over Renderer: Canvas-based composition:<br/>Screen + camera overlay

    Renderer->>Agent: recordingStarted

    User->>Renderer: Record session

    User->>Renderer: Stop

    Renderer->>Agent: recordingComplete
    Note over Renderer,Agent: {videoUrl: composited video}
```

## Data Model Updates

The agent can track recording state via the data model:

```mermaid
sequenceDiagram
    participant Agent
    participant Renderer

    Agent->>Renderer: createSurface
    Note over Agent,Renderer: {dataModel: {videoState: {recordings: {}}}}

    Agent->>Renderer: requestRecording
    Note over Agent,Renderer: recordingId: 'rec-1'

    Agent->>Renderer: updateDataModel
    Note over Agent,Renderer: {path: '/videoState/recordings/rec-1',<br/>operation: 'set',<br/>value: {status: 'idle'}}

    Renderer->>Agent: recordingStarted

    Agent->>Renderer: updateDataModel
    Note over Agent,Renderer: {path: '/videoState/recordings/rec-1/status',<br/>operation: 'set',<br/>value: 'recording'}

    Renderer->>Agent: recordingComplete

    Agent->>Renderer: updateDataModel
    Note over Agent,Renderer: {path: '/videoState/recordings/rec-1',<br/>operation: 'set',<br/>value: {status: 'complete', videoUrl, duration, transcript}}
```

## Message Schemas

### A2UIRequestRecording

```typescript
interface A2UIRequestRecording extends A2UIMessage {
  type: 'requestRecording'
  surfaceId: string
  recordingId: string
  mode: 'screen' | 'camera' | 'pip'
  options?: {
    audio?: boolean          // Include audio track (default: true)
    quality?: string         // 'low' | 'medium' | 'high'
    duration?: number        // Max duration in seconds (optional)
    ai?: {
      transcribe?: boolean   // Generate transcript
      highlights?: boolean   // Detect highlights
      summary?: boolean      // Generate summary
      zerodb?: boolean       // Auto-store in ZeroDB
    }
  }
}
```

### A2UIRecordingStarted

```typescript
interface A2UIRecordingStarted extends A2UIMessage {
  type: 'recordingStarted'
  surfaceId: string
  recordingId: string
  timestamp: string         // ISO 8601 timestamp
  metadata?: {
    deviceId?: string       // Camera/mic device ID
    resolution?: string     // e.g., '1920x1080'
  }
}
```

### A2UIRecordingComplete

```typescript
interface A2UIRecordingComplete extends A2UIMessage {
  type: 'recordingComplete'
  surfaceId: string
  recordingId: string
  videoUrl: string          // Blob URL or CDN URL
  duration: number          // Duration in seconds
  metadata?: {
    resolution?: string
    fps?: number
    codec?: string
    fileSize?: number       // Bytes
  }
  // AI-generated fields (if AI enabled)
  transcript?: string
  highlights?: Array<{
    timestamp: number       // Seconds into video
    confidence: number      // 0-1
    reason?: string
  }>
  summary?: string
  topics?: string[]
  tags?: string[]
}
```

## Error Handling

See [error-handling-flow.md](./error-handling-flow.md) for comprehensive error scenarios.

Quick examples:

```mermaid
sequenceDiagram
    participant Agent
    participant Renderer
    participant User

    Agent->>Renderer: requestRecording

    alt User Denies Permission
        Renderer->>User: Request permission
        User->>Renderer: Deny
        Renderer->>Agent: error
        Note over Renderer,Agent: {code: 'PERMISSION_DENIED',<br/>message: 'User denied camera/screen access'}

    else Recording Timeout
        Renderer->>Agent: recordingStarted
        Note over Renderer: Max duration exceeded
        Renderer->>Agent: recordingComplete
        Note over Renderer,Agent: {duration: maxDuration}

    else Network Failure During Upload
        Renderer->>Renderer: Recording complete locally
        Renderer->>Agent: error
        Note over Renderer,Agent: {code: 'UPLOAD_FAILED',<br/>message: 'Failed to upload video',<br/>details: {localBlobUrl}}
    end
```

## Implementation Notes

### For Agent Developers

1. Always generate unique `recordingId` values (UUID recommended)
2. Handle both synchronous errors (permissions) and asynchronous completion
3. Update data model state to reflect recording progress in UI
4. Consider maximum duration limits for recordings
5. AI features require additional processing time - inform users

### For Renderer Implementers

1. Use AIKit Video's `VideoRecorder` component for implementation
2. Request browser permissions before sending `recordingStarted`
3. Handle permission denials gracefully with error messages
4. Stream upload large videos to avoid memory issues
5. Support blob URLs for immediate playback, CDN URLs for persistence
6. Implement quality settings (resolution, bitrate, codec)

### Performance Considerations

- **Screen recording**: High CPU usage, 720p-1080p recommended
- **Camera recording**: Lower overhead, up to 4K possible
- **PiP recording**: Highest CPU usage (compositing), limit to 1080p
- **AI processing**: Adds 10-60 seconds depending on video length
- **Upload**: Large files may take minutes on slow connections

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Screen recording | ✅ | ✅ | ✅ 13+ | ✅ |
| Camera recording | ✅ | ✅ | ✅ | ✅ |
| Audio capture | ✅ | ✅ | ✅ | ✅ |
| PiP mode | ✅ | ⚠️ Manual | ⚠️ Manual | ✅ |

## Related Documents

- [Video Call Protocol Flow](./video-call-protocol-flow.md)
- [Video Generation Protocol Flow](./video-generation-protocol-flow.md)
- [Error Handling Flow](./error-handling-flow.md)
- [Video Protocol PRD](../planning/video-protocol-prd.md)
