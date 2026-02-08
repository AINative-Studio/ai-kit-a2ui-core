# Video Call Protocol Flow

**Version**: 0.10.0-alpha
**Last Updated**: 2026-02-08
**Status**: Specification

## Overview

This document specifies the WebSocket message flow for the A2UI Video Call protocol. The call flow enables agents to initiate real-time video conferencing sessions, manage participants, and receive AI-generated call metadata (transcripts, summaries, action items).

## Message Types

The video call flow uses three primary message types:

1. **A2UIInitiateVideoCall** (Agent → Renderer) - Creates a video call room
2. **A2UIVideoCallJoined** (Renderer → Agent) - Confirms participant joined
3. **A2UIVideoCallEnded** (Renderer → Agent) - Delivers call results with metadata

## Basic Video Call Flow

```mermaid
sequenceDiagram
    participant Agent
    participant Renderer
    participant User
    participant AIKit as AIKit Video
    participant WebRTC

    Agent->>Renderer: A2UIInitiateVideoCall
    Note over Agent,Renderer: {type: 'initiateVideoCall', surfaceId,<br/>callId, roomId, participants}

    Renderer->>AIKit: Initialize VideoCall component

    AIKit->>WebRTC: Connect to signaling server

    WebRTC->>AIKit: Connection ready

    Renderer->>User: Show call UI

    User->>Renderer: Join call

    Renderer->>WebRTC: Join room
    Note over WebRTC: Establish peer connections

    Renderer->>Agent: A2UIVideoCallJoined
    Note over Renderer,Agent: {type: 'videoCallJoined', callId,<br/>participantId, timestamp}

    Note over User,WebRTC: Video call in progress

    loop Other Participants Join
        WebRTC->>Renderer: Participant joined
        Renderer->>Agent: A2UIVideoCallJoined
        Note over Renderer,Agent: Additional participant events
    end

    User->>Renderer: End call

    Renderer->>WebRTC: Disconnect

    alt AI Features Enabled
        AIKit->>AIKit: Generate transcript
        AIKit->>AIKit: Summarize call
        AIKit->>AIKit: Extract action items
    end

    Renderer->>Agent: A2UIVideoCallEnded
    Note over Renderer,Agent: {type: 'videoCallEnded', callId,<br/>duration, transcript, summary, actionItems}
```

## Multi-Participant Call Flow

```mermaid
sequenceDiagram
    participant Agent
    participant Renderer1 as Renderer (User A)
    participant Renderer2 as Renderer (User B)
    participant Renderer3 as Renderer (User C)
    participant WebRTC as WebRTC Mesh

    Agent->>Renderer1: initiateVideoCall
    Note over Agent,Renderer1: {roomId: 'room-123', participants: ['userA', 'userB', 'userC']}

    Renderer1->>WebRTC: Create room
    Renderer1->>Agent: videoCallJoined (userA)

    Agent->>Renderer2: initiateVideoCall
    Note over Agent,Renderer2: {roomId: 'room-123'}

    Renderer2->>WebRTC: Join room
    Renderer2->>Agent: videoCallJoined (userB)

    WebRTC->>Renderer1: Peer connected (userB)
    WebRTC->>Renderer2: Peer connected (userA)

    Agent->>Renderer3: initiateVideoCall
    Note over Agent,Renderer3: {roomId: 'room-123'}

    Renderer3->>WebRTC: Join room
    Renderer3->>Agent: videoCallJoined (userC)

    WebRTC->>Renderer1: Peer connected (userC)
    WebRTC->>Renderer2: Peer connected (userC)
    WebRTC->>Renderer3: Peer connected (userA, userB)

    Note over Renderer1,Renderer3: All participants connected

    Renderer1->>WebRTC: End call
    Renderer1->>Agent: videoCallEnded (userA)

    Note over Renderer2,Renderer3: Call continues with remaining participants
```

## Call with AI Features

When AI features are enabled, AIKit Video provides real-time enhancements:

```mermaid
sequenceDiagram
    participant Agent
    participant Renderer
    participant AIKit as AIKit Video
    participant AI as AI Services

    Agent->>Renderer: initiateVideoCall
    Note over Agent,Renderer: {ai: {liveTranscription: true,<br/>liveCaptions: true,<br/>noiseCancellation: true}}

    Renderer->>AIKit: startCall(options)

    alt Live Transcription Enabled
        loop During Call
            AIKit->>AI: Stream audio chunks
            AI->>AIKit: Transcription results
            AIKit->>Renderer: Update transcript
            Renderer->>User: Display live transcript
        end
    end

    alt Live Captions Enabled
        loop During Call
            AIKit->>AI: Stream audio
            AI->>AIKit: Caption text
            AIKit->>Renderer: Show captions
            Renderer->>User: Overlay captions on video
        end
    end

    alt Noise Cancellation Enabled
        AIKit->>AI: Process audio stream
        AI->>AIKit: Clean audio
        AIKit->>Renderer: Enhanced audio track
    end

    Renderer->>AIKit: End call

    AIKit->>AI: Summarize full transcript
    AI->>AIKit: Summary + action items

    Renderer->>Agent: videoCallEnded
    Note over Renderer,Agent: {transcript, summary,<br/>actionItems, speakers}
```

## Screen Sharing During Call

```mermaid
sequenceDiagram
    participant User
    participant Renderer
    participant AIKit as AIKit Video
    participant WebRTC

    Note over User,WebRTC: Call already in progress

    User->>Renderer: Click "Share Screen"

    Renderer->>AIKit: requestScreenShare()

    AIKit->>User: Screen picker dialog

    User->>AIKit: Select screen/window

    AIKit->>WebRTC: Add screen track to peer connection

    WebRTC->>WebRTC: Renegotiate streams

    loop Other Participants
        WebRTC->>Renderer: Screen track available
        Renderer->>User: Show shared screen
    end

    User->>Renderer: Stop sharing

    Renderer->>AIKit: stopScreenShare()

    AIKit->>WebRTC: Remove screen track

    WebRTC->>WebRTC: Renegotiate streams
```

## Recording a Video Call

```mermaid
sequenceDiagram
    participant Agent
    participant Renderer
    participant AIKit as AIKit Video
    participant Storage

    Note over Agent,AIKit: Call in progress

    Agent->>Renderer: updateComponents
    Note over Agent,Renderer: Enable recording feature in UI

    Renderer->>User: Show "Record" button

    User->>Renderer: Start recording

    Renderer->>AIKit: startCallRecording()

    AIKit->>AIKit: Capture composite stream
    Note over AIKit: All participants + shared screens

    AIKit->>Renderer: Recording started

    Note over Renderer,User: Recording indicator visible

    User->>Renderer: Stop recording

    Renderer->>AIKit: stopCallRecording()

    AIKit->>AIKit: Process recording

    opt AI Features
        AIKit->>AIKit: Generate transcript
        AIKit->>AIKit: Create chapters
        AIKit->>AIKit: Detect highlights
    end

    AIKit->>Storage: Upload recording

    Storage->>AIKit: Video URL

    AIKit->>Renderer: Recording complete

    Renderer->>Agent: recordingComplete
    Note over Renderer,Agent: {videoUrl, duration, transcript, chapters, highlights}
```

## Call State Transitions

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Connecting: initiateVideoCall
    Connecting --> Connected: videoCallJoined (self)
    Connected --> Active: videoCallJoined (peer)
    Active --> Active: participants join/leave
    Active --> Ending: User ends call
    Ending --> Ended: videoCallEnded
    Ended --> [*]

    Connecting --> Error: Connection failed
    Connected --> Error: Peer connection failed
    Active --> Error: Fatal error
    Error --> [*]
```

## Data Model Updates

The agent can track call state via the data model:

```mermaid
sequenceDiagram
    participant Agent
    participant Renderer

    Agent->>Renderer: createSurface
    Note over Agent,Renderer: {dataModel: {videoState: {calls: {}}}}

    Agent->>Renderer: initiateVideoCall
    Note over Agent,Renderer: callId: 'call-1'

    Agent->>Renderer: updateDataModel
    Note over Agent,Renderer: {path: '/videoState/calls/call-1',<br/>operation: 'set',<br/>value: {status: 'connecting', participants: []}}

    Renderer->>Agent: videoCallJoined
    Note over Renderer,Agent: participantId: 'user-1'

    Agent->>Renderer: updateDataModel
    Note over Agent,Renderer: {path: '/videoState/calls/call-1',<br/>operation: 'set',<br/>value: {status: 'active', participants: [{id: 'user-1'}]}}

    Renderer->>Agent: videoCallJoined
    Note over Renderer,Agent: participantId: 'user-2'

    Agent->>Renderer: updateDataModel
    Note over Agent,Renderer: Add user-2 to participants array

    Renderer->>Agent: videoCallEnded

    Agent->>Renderer: updateDataModel
    Note over Agent,Renderer: {path: '/videoState/calls/call-1/status',<br/>operation: 'set',<br/>value: 'ended'}
```

## Message Schemas

### A2UIInitiateVideoCall

```typescript
interface A2UIInitiateVideoCall extends A2UIMessage {
  type: 'initiateVideoCall'
  surfaceId: string
  callId: string
  roomId: string           // WebRTC room identifier
  participants?: string[]  // Optional initial participant list
  features?: {
    chat?: boolean         // Enable text chat (default: false)
    screenShare?: boolean  // Allow screen sharing (default: true)
    recording?: boolean    // Allow call recording (default: false)
  }
  layout?: 'grid' | 'speaker' | 'sidebar'  // UI layout hint
  ai?: {
    liveTranscription?: boolean   // Real-time transcription
    liveCaptions?: boolean        // Live caption overlay
    translation?: string          // Target language code (e.g., 'es', 'fr')
    noiseCancellation?: boolean   // AI noise removal
    speakerIdentification?: boolean  // Identify speakers in transcript
    actionItemDetection?: boolean    // Auto-detect action items
    zerodb?: boolean              // Auto-store call data in ZeroDB
  }
}
```

### A2UIVideoCallJoined

```typescript
interface A2UIVideoCallJoined extends A2UIMessage {
  type: 'videoCallJoined'
  surfaceId: string
  callId: string
  participantId: string    // User ID of participant
  timestamp: string        // ISO 8601 timestamp
  metadata?: {
    displayName?: string
    isLocal?: boolean      // True if this is the local user
    deviceInfo?: {
      camera?: string
      microphone?: string
    }
  }
}
```

### A2UIVideoCallEnded

```typescript
interface A2UIVideoCallEnded extends A2UIMessage {
  type: 'videoCallEnded'
  surfaceId: string
  callId: string
  duration: number         // Call duration in seconds
  endedBy?: string         // Participant ID who ended the call
  reason?: 'user_ended' | 'timeout' | 'error' | 'all_left'

  // AI-generated fields (if AI enabled)
  transcript?: string
  transcriptSegments?: Array<{
    speaker: string
    text: string
    timestamp: number
  }>
  summary?: string
  actionItems?: string[]
  topics?: string[]
  sentiment?: 'positive' | 'neutral' | 'negative'

  // Call statistics
  stats?: {
    peakParticipants?: number
    averageQuality?: number     // 0-1
    totalDataTransferred?: number  // Bytes
    screenShareDuration?: number   // Seconds
  }
}
```

## Error Handling

See [error-handling-flow.md](./error-handling-flow.md) for comprehensive error scenarios.

Quick examples:

```mermaid
sequenceDiagram
    participant Agent
    participant Renderer
    participant WebRTC

    Agent->>Renderer: initiateVideoCall

    alt Connection Timeout
        Renderer->>WebRTC: Connect
        Note over WebRTC: Signaling server unreachable
        Renderer->>Agent: error
        Note over Renderer,Agent: {code: 'CONNECTION_TIMEOUT',<br/>message: 'Failed to connect to call'}

    else Room Full
        Renderer->>WebRTC: Join room
        WebRTC->>Renderer: Room at capacity
        Renderer->>Agent: error
        Note over Renderer,Agent: {code: 'ROOM_FULL',<br/>message: 'Maximum participants reached'}

    else Network Quality Degradation
        Renderer->>Agent: videoCallJoined
        Note over Renderer,WebRTC: Call quality drops
        Renderer->>Agent: error
        Note over Renderer,Agent: {code: 'QUALITY_DEGRADED',<br/>message: 'Poor network connection',<br/>details: {quality: 0.3}}
    end
```

## Implementation Notes

### For Agent Developers

1. Use consistent `roomId` for all participants in same call
2. Generate unique `callId` per user's call instance
3. Handle participant join/leave events to update UI
4. Monitor call quality metrics and inform users
5. AI features (especially live transcription) add latency and cost
6. Consider implementing call timeouts for resource management

### For Renderer Implementers

1. Use AIKit Video's `VideoCall` component for implementation
2. Handle WebRTC signaling through AIKit Video's signaling server
3. Implement reconnection logic for network interruptions
4. Support multiple video layouts (grid, speaker, sidebar)
5. Enable adaptive bitrate based on network conditions
6. Implement echo cancellation and audio level monitoring
7. Handle screen sharing as additional video track

### Performance Considerations

- **WebRTC overhead**: ~1-3 Mbps per participant (video + audio)
- **CPU usage**: Scales with participant count (encoding/decoding)
- **Grid layout**: Shows all participants, high bandwidth
- **Speaker layout**: Shows active speaker, lower bandwidth
- **AI transcription**: Adds ~200ms latency, requires backend processing
- **Screen sharing**: Additional 1-5 Mbps depending on content

### Quality Optimization

1. **Adaptive bitrate**: Reduce quality on poor networks
2. **Simulcast**: Send multiple quality layers, let receivers choose
3. **Voice detection**: Reduce bandwidth when not speaking
4. **Bandwidth estimation**: Monitor and adjust in real-time
5. **Codec selection**: VP9 (better quality) vs VP8 (better compatibility)

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| WebRTC video call | ✅ | ✅ | ✅ | ✅ |
| Screen sharing | ✅ | ✅ | ✅ 13+ | ✅ |
| Audio/Video | ✅ | ✅ | ✅ | ✅ |
| VP9 codec | ✅ | ✅ | ❌ | ✅ |
| Simulcast | ✅ | ⚠️ Limited | ⚠️ Limited | ✅ |

## WebRTC Architecture

AIKit Video uses a configurable WebRTC architecture:

```mermaid
graph TB
    subgraph "Mesh Architecture (2-4 participants)"
        A[User A] <-->|P2P| B[User B]
        A <-->|P2P| C[User C]
        B <-->|P2P| C
    end

    subgraph "SFU Architecture (5+ participants)"
        D[User D] -->|Upload| SFU[Selective Forwarding Unit]
        E[User E] -->|Upload| SFU
        F[User F] -->|Upload| SFU
        SFU -->|Download| D
        SFU -->|Download| E
        SFU -->|Download| F
    end
```

- **Mesh (P2P)**: Low latency, scales to ~4 participants
- **SFU**: Better scalability, supports 10+ participants
- **MCU**: Server-side mixing, highest scalability (future)

## Security Considerations

1. **DTLS-SRTP**: All media encrypted end-to-end
2. **Room authentication**: Validate participants before joining
3. **Token-based access**: Use JWT tokens for room access
4. **Permissions**: Verify camera/mic permissions
5. **Recording consent**: Notify all participants when recording

## Related Documents

- [Recording Protocol Flow](./recording-protocol-flow.md)
- [Video Generation Protocol Flow](./video-generation-protocol-flow.md)
- [Error Handling Flow](./error-handling-flow.md)
- [Video Protocol PRD](../planning/video-protocol-prd.md)
