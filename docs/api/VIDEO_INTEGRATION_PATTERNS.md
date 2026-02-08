# Video Integration Patterns

Common patterns and best practices for integrating A2UI video components into your applications.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Agent-Side Integration](#agent-side-integration)
- [Renderer Integration](#renderer-integration)
- [React Integration Example](#react-integration-example)
- [Data Binding Patterns](#data-binding-patterns)
- [Error Handling](#error-handling)
- [Performance Optimization](#performance-optimization)
- [Testing Patterns](#testing-patterns)

---

## Architecture Overview

### The A2UI Video Stack

```
┌──────────────────────────────────────────────────────┐
│  AI Agent (Python, TypeScript, etc.)                 │
│  • Generates video component JSON                    │
│  • Handles video events                              │
│  • Manages video state                               │
└──────────────────────────────────────────────────────┘
                      ↓ WebSocket
┌──────────────────────────────────────────────────────┐
│  @ainative/ai-kit-a2ui-core                          │
│  • Protocol definitions                              │
│  • Message validation                                │
│  • WebSocket transport                               │
└──────────────────────────────────────────────────────┘
                      ↓ Type-safe APIs
┌──────────────────────────────────────────────────────┐
│  @ainative/ai-kit-video                              │
│  • Video components implementation                   │
│  • Recording, calls, generation                      │
│  • AI features (transcription, etc.)                 │
└──────────────────────────────────────────────────────┘
                      ↓ Framework bindings
┌──────────────────────────────────────────────────────┐
│  Framework Renderer (React, Vue, Svelte)             │
│  • Renders video components                          │
│  • Handles user interactions                         │
│  • Sends events to agent                             │
└──────────────────────────────────────────────────────┘
```

### Component Registration Flow

```typescript
import { ComponentRegistry } from '@ainative/ai-kit-a2ui-core/registry'
import { VideoRecorder, VideoCall, AIVideo, AIVideoPlayer } from '@ainative/ai-kit-video'

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

## Agent-Side Integration

### Pattern 1: Recording Session Agent

Complete agent implementation for screen recording workflow.

```typescript
import { A2UITransport } from '@ainative/ai-kit-a2ui-core/transport'
import type {
  VideoRecorderComponent,
  A2UIRecordingComplete
} from '@ainative/ai-kit-a2ui-core/types'

class RecordingAgent {
  private transport: A2UITransport
  private recordings = new Map<string, RecordingData>()

  constructor(wsUrl: string) {
    this.transport = new A2UITransport(wsUrl)
    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    // Handle recording completion
    this.transport.on('recordingComplete', this.handleRecordingComplete.bind(this))

    // Handle user actions
    this.transport.on('userAction', this.handleUserAction.bind(this))
  }

  async createRecordingSession(userId: string) {
    const recordingId = `rec-${Date.now()}`

    // Create UI with video recorder
    await this.transport.send({
      type: 'createSurface',
      surfaceId: `recording-${userId}`,
      components: [
        {
          id: 'title',
          type: 'text',
          properties: {
            value: 'Record Your Screen',
            fontSize: 24,
            fontWeight: 'bold'
          }
        },
        {
          id: 'recorder',
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
        } as VideoRecorderComponent,
        {
          id: 'start-btn',
          type: 'button',
          properties: {
            label: 'Start Recording',
            action: 'startRecording',
            variant: 'primary'
          }
        }
      ],
      dataModel: {
        userId,
        recordingId,
        status: 'idle'
      }
    })

    this.recordings.set(recordingId, {
      id: recordingId,
      userId,
      startTime: null,
      videoUrl: null
    })

    return recordingId
  }

  private async handleUserAction({ action, surfaceId, dataModel }: any) {
    if (action === 'startRecording') {
      const { recordingId } = dataModel

      // Request recording start
      await this.transport.send({
        type: 'requestRecording',
        surfaceId,
        recordingId,
        mode: 'screen',
        options: {
          audio: true,
          quality: 'high'
        }
      })

      // Update UI to show recording state
      await this.transport.send({
        type: 'updateDataModel',
        surfaceId,
        updates: [{
          path: '/status',
          operation: 'set',
          value: 'recording'
        }]
      })
    }
  }

  private async handleRecordingComplete({
    recordingId,
    videoUrl,
    duration,
    transcript,
    highlights
  }: A2UIRecordingComplete) {
    const recording = this.recordings.get(recordingId)
    if (!recording) return

    // Store recording data
    recording.videoUrl = videoUrl
    recording.duration = duration
    recording.transcript = transcript
    recording.highlights = highlights

    // Update UI with results
    await this.transport.send({
      type: 'updateComponents',
      surfaceId: `recording-${recording.userId}`,
      updates: [
        {
          id: 'result',
          operation: 'add',
          component: {
            id: 'result',
            type: 'card',
            properties: {
              title: 'Recording Complete',
              subtitle: `Duration: ${duration}s`
            },
            children: ['player', 'transcript']
          }
        },
        {
          id: 'player',
          operation: 'add',
          component: {
            id: 'player',
            type: 'aiVideoPlayer',
            properties: {
              videoUrl,
              transcript
            }
          }
        },
        {
          id: 'transcript',
          operation: 'add',
          component: {
            id: 'transcript',
            type: 'text',
            properties: {
              value: transcript || 'No transcript available',
              fontSize: 14
            }
          }
        }
      ]
    })

    console.log(`Recording ${recordingId} complete:`, {
      videoUrl,
      duration,
      highlightsCount: highlights?.length || 0
    })
  }

  async connect() {
    await this.transport.connect()
  }

  async disconnect() {
    await this.transport.disconnect()
  }
}

// Usage
const agent = new RecordingAgent('wss://agent.example.com')
await agent.connect()
await agent.createRecordingSession('user-123')
```

### Pattern 2: Video Call Agent

Agent for managing video conferencing.

```typescript
import { A2UITransport } from '@ainative/ai-kit-a2ui-core/transport'
import type {
  VideoCallComponent,
  A2UIVideoCallEnded
} from '@ainative/ai-kit-a2ui-core/types'

class VideoCallAgent {
  private transport: A2UITransport
  private activeCalls = new Map<string, CallData>()

  constructor(wsUrl: string) {
    this.transport = new A2UITransport(wsUrl)
    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    this.transport.on('videoCallJoined', this.handleParticipantJoined.bind(this))
    this.transport.on('videoCallEnded', this.handleCallEnded.bind(this))
  }

  async startCall(roomId: string, participants: string[]) {
    const callId = `call-${Date.now()}`

    // Create video call UI
    await this.transport.send({
      type: 'createSurface',
      surfaceId: `call-${callId}`,
      components: [
        {
          id: 'call',
          type: 'videoCall',
          properties: {
            roomId,
            layout: 'grid',
            features: {
              chat: true,
              screenShare: true,
              recording: true
            },
            ai: {
              liveTranscription: true,
              liveCaptions: true,
              noiseCancellation: true
            }
          }
        } as VideoCallComponent,
        {
          id: 'participants',
          type: 'text',
          properties: {
            value: 'Waiting for participants...',
            dataBinding: '/participantStatus'
          }
        }
      ],
      dataModel: {
        callId,
        roomId,
        participants: [],
        participantStatus: 'Waiting for participants...'
      }
    })

    // Initiate call
    await this.transport.send({
      type: 'initiateVideoCall',
      surfaceId: `call-${callId}`,
      callId,
      roomId,
      participants
    })

    this.activeCalls.set(callId, {
      id: callId,
      roomId,
      participants: [],
      startTime: Date.now()
    })

    return callId
  }

  private async handleParticipantJoined({ callId, participantId }: any) {
    const call = this.activeCalls.get(callId)
    if (!call) return

    call.participants.push(participantId)

    // Update participant list in UI
    await this.transport.send({
      type: 'updateDataModel',
      surfaceId: `call-${callId}`,
      updates: [{
        path: '/participantStatus',
        operation: 'set',
        value: `${call.participants.length} participants in call`
      }]
    })

    console.log(`Participant ${participantId} joined call ${callId}`)
  }

  private async handleCallEnded({
    callId,
    duration,
    transcript,
    summary,
    actionItems
  }: A2UIVideoCallEnded) {
    const call = this.activeCalls.get(callId)
    if (!call) return

    // Display call summary
    await this.transport.send({
      type: 'updateComponents',
      surfaceId: `call-${callId}`,
      updates: [
        {
          id: 'summary-card',
          operation: 'add',
          component: {
            id: 'summary-card',
            type: 'card',
            properties: {
              title: 'Call Summary',
              subtitle: `Duration: ${Math.floor(duration / 60)}m ${duration % 60}s`
            },
            children: ['summary', 'actions']
          }
        },
        {
          id: 'summary',
          operation: 'add',
          component: {
            id: 'summary',
            type: 'text',
            properties: {
              value: summary || 'No summary available'
            }
          }
        },
        {
          id: 'actions',
          operation: 'add',
          component: {
            id: 'actions',
            type: 'list',
            properties: {
              items: actionItems || [],
              emptyMessage: 'No action items'
            }
          }
        }
      ]
    })

    this.activeCalls.delete(callId)

    console.log(`Call ${callId} ended:`, {
      duration,
      participants: call.participants.length,
      actionItems: actionItems?.length || 0
    })
  }

  async connect() {
    await this.transport.connect()
  }
}

// Usage
const callAgent = new VideoCallAgent('wss://agent.example.com')
await callAgent.connect()
await callAgent.startCall('team-meeting', ['user-1', 'user-2', 'user-3'])
```

### Pattern 3: AI Video Generation Agent

Agent for generating videos with AI.

```typescript
import { A2UITransport } from '@ainative/ai-kit-a2ui-core/transport'
import type {
  AIVideoComponent,
  A2UIVideoGenerationComplete
} from '@ainative/ai-kit-a2ui-core/types'

class VideoGenerationAgent {
  private transport: A2UITransport

  constructor(wsUrl: string) {
    this.transport = new A2UITransport(wsUrl)
    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    this.transport.on('videoGenerationProgress', this.handleProgress.bind(this))
    this.transport.on('videoGenerationComplete', this.handleComplete.bind(this))
  }

  async generateVideo(prompt: string, data?: Record<string, any>) {
    const videoId = `vid-${Date.now()}`

    // Create generation UI
    await this.transport.send({
      type: 'createSurface',
      surfaceId: `gen-${videoId}`,
      components: [
        {
          id: 'title',
          type: 'text',
          properties: {
            value: 'Generating Video...',
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        {
          id: 'generator',
          type: 'aiVideo',
          properties: {
            prompt,
            data,
            streaming: true
          }
        } as AIVideoComponent,
        {
          id: 'progress',
          type: 'text',
          properties: {
            value: '0% complete',
            dataBinding: '/progressText'
          }
        }
      ],
      dataModel: {
        videoId,
        progress: 0,
        progressText: '0% complete',
        status: 'generating'
      }
    })

    // Request generation
    await this.transport.send({
      type: 'generateVideo',
      surfaceId: `gen-${videoId}`,
      videoId,
      prompt,
      data
    })

    return videoId
  }

  private async handleProgress({ videoId, progress, frame }: any) {
    // Update progress in UI
    await this.transport.send({
      type: 'updateDataModel',
      surfaceId: `gen-${videoId}`,
      updates: [
        {
          path: '/progress',
          operation: 'set',
          value: progress
        },
        {
          path: '/progressText',
          operation: 'set',
          value: `${progress}% complete`
        }
      ]
    })

    console.log(`Generation ${progress}% complete`)
  }

  private async handleComplete({ videoId, videoUrl, composition }: A2UIVideoGenerationComplete) {
    // Replace generator with player
    await this.transport.send({
      type: 'updateComponents',
      surfaceId: `gen-${videoId}`,
      updates: [
        {
          id: 'title',
          operation: 'update',
          component: {
            id: 'title',
            type: 'text',
            properties: {
              value: 'Video Generated Successfully!',
              fontSize: 20,
              fontWeight: 'bold',
              color: '#22c55e'
            }
          }
        },
        {
          id: 'generator',
          operation: 'remove'
        },
        {
          id: 'progress',
          operation: 'remove'
        },
        {
          id: 'player',
          operation: 'add',
          component: {
            id: 'player',
            type: 'aiVideoPlayer',
            properties: {
              videoUrl
            }
          }
        },
        {
          id: 'download-btn',
          operation: 'add',
          component: {
            id: 'download-btn',
            type: 'button',
            properties: {
              label: 'Download Video',
              action: 'download',
              variant: 'primary'
            }
          }
        }
      ]
    })

    console.log(`Video ${videoId} generated:`, videoUrl)
  }

  async connect() {
    await this.transport.connect()
  }
}

// Usage
const genAgent = new VideoGenerationAgent('wss://agent.example.com')
await genAgent.connect()
await genAgent.generateVideo('Create a product demo video', {
  product: 'AI Assistant',
  features: ['Smart', 'Fast', 'Intuitive']
})
```

---

## Renderer Integration

### React Renderer Pattern

Complete React integration with video components.

```typescript
import React, { useEffect, useState } from 'react'
import { A2UITransport } from '@ainative/ai-kit-a2ui-core/transport'
import { ComponentRegistry } from '@ainative/ai-kit-a2ui-core/registry'
import { JSONPointer } from '@ainative/ai-kit-a2ui-core/json-pointer'
import type {
  A2UIComponent,
  VideoRecorderComponent,
  VideoCallComponent,
  AIVideoComponent,
  AIVideoPlayerComponent
} from '@ainative/ai-kit-a2ui-core/types'

// Import video components from AIKit Video
import {
  VideoRecorder,
  VideoCall,
  AIVideoGenerator,
  AIVideoPlayer
} from '@ainative/ai-kit-video'

interface A2UIRendererProps {
  wsUrl: string
}

export const A2UIRenderer: React.FC<A2UIRendererProps> = ({ wsUrl }) => {
  const [transport, setTransport] = useState<A2UITransport | null>(null)
  const [components, setComponents] = useState<A2UIComponent[]>([])
  const [dataModel, setDataModel] = useState<Record<string, any>>({})
  const [registry] = useState(() => {
    const reg = ComponentRegistry.standard()

    // Register video components
    reg.register('videoRecorder', {
      type: 'videoRecorder',
      component: VideoRecorder,
      category: 'media',
      description: 'Video recorder'
    })

    reg.register('videoCall', {
      type: 'videoCall',
      component: VideoCall,
      category: 'communication',
      description: 'Video call'
    })

    reg.register('aiVideo', {
      type: 'aiVideo',
      component: AIVideoGenerator,
      category: 'generation',
      description: 'AI video generator'
    })

    reg.register('aiVideoPlayer', {
      type: 'aiVideoPlayer',
      component: AIVideoPlayer,
      category: 'media',
      description: 'AI video player'
    })

    return reg
  })

  useEffect(() => {
    const t = new A2UITransport(wsUrl)

    // Handle surface creation
    t.on('createSurface', ({ components: comps, dataModel: dm }) => {
      setComponents(comps)
      setDataModel(dm || {})
    })

    // Handle component updates
    t.on('updateComponents', ({ updates }) => {
      setComponents(prev => {
        const next = [...prev]
        updates.forEach(update => {
          const idx = next.findIndex(c => c.id === update.id)

          if (update.operation === 'add') {
            next.push(update.component!)
          } else if (update.operation === 'update') {
            if (idx >= 0) next[idx] = update.component!
          } else if (update.operation === 'remove') {
            if (idx >= 0) next.splice(idx, 1)
          }
        })
        return next
      })
    })

    // Handle data model updates
    t.on('updateDataModel', ({ updates }) => {
      setDataModel(prev => {
        const next = { ...prev }
        updates.forEach(update => {
          if (update.operation === 'set') {
            JSONPointer.set(next, update.path, update.value)
          } else if (update.operation === 'remove') {
            JSONPointer.remove(next, update.path)
          }
        })
        return next
      })
    })

    t.connect()
    setTransport(t)

    return () => {
      t.disconnect()
    }
  }, [wsUrl])

  const renderComponent = (component: A2UIComponent): React.ReactNode => {
    const def = registry.get(component.type)
    if (!def) return null

    const props = {
      ...component.properties,
      dataModel,
      onAction: (action: string, context?: any) => {
        transport?.send({
          type: 'userAction',
          surfaceId: 'current',
          action,
          componentId: component.id,
          context,
          dataModel
        })
      }
    }

    // Render based on component type
    switch (component.type) {
      case 'videoRecorder':
        return (
          <VideoRecorder
            key={component.id}
            mode={(component as VideoRecorderComponent).properties.mode}
            audio={(component as VideoRecorderComponent).properties.audio}
            quality={(component as VideoRecorderComponent).properties.quality}
            ai={(component as VideoRecorderComponent).properties.ai}
            onComplete={(result) => {
              // Send completion to agent
              transport?.send({
                type: 'recordingComplete',
                surfaceId: 'current',
                recordingId: component.id,
                videoUrl: result.videoUrl,
                duration: result.duration,
                transcript: result.transcript,
                highlights: result.highlights
              })
            }}
          />
        )

      case 'videoCall':
        return (
          <VideoCall
            key={component.id}
            roomId={(component as VideoCallComponent).properties.roomId}
            layout={(component as VideoCallComponent).properties.layout}
            features={(component as VideoCallComponent).properties.features}
            ai={(component as VideoCallComponent).properties.ai}
            onJoined={(participantId) => {
              transport?.send({
                type: 'videoCallJoined',
                surfaceId: 'current',
                callId: component.id,
                participantId,
                timestamp: new Date().toISOString()
              })
            }}
            onEnded={(summary) => {
              transport?.send({
                type: 'videoCallEnded',
                surfaceId: 'current',
                callId: component.id,
                duration: summary.duration,
                transcript: summary.transcript,
                summary: summary.summary,
                actionItems: summary.actionItems
              })
            }}
          />
        )

      case 'aiVideo':
        return (
          <AIVideoGenerator
            key={component.id}
            prompt={(component as AIVideoComponent).properties.prompt}
            template={(component as AIVideoComponent).properties.template}
            data={(component as AIVideoComponent).properties.data}
            voice={(component as AIVideoComponent).properties.voice}
            streaming={(component as AIVideoComponent).properties.streaming}
            onProgress={(progress, frame) => {
              transport?.send({
                type: 'videoGenerationProgress',
                surfaceId: 'current',
                videoId: component.id,
                progress,
                frame
              })
            }}
            onComplete={(videoUrl, composition) => {
              transport?.send({
                type: 'videoGenerationComplete',
                surfaceId: 'current',
                videoId: component.id,
                videoUrl,
                composition
              })
            }}
          />
        )

      case 'aiVideoPlayer':
        return (
          <AIVideoPlayer
            key={component.id}
            videoUrl={(component as AIVideoPlayerComponent).properties.videoUrl}
            transcript={(component as AIVideoPlayerComponent).properties.transcript}
            interactive={(component as AIVideoPlayerComponent).properties.interactive}
          />
        )

      // Handle other component types...
      default:
        return <div key={component.id}>Unknown component: {component.type}</div>
    }
  }

  return (
    <div className="a2ui-renderer">
      {components.map(renderComponent)}
    </div>
  )
}
```

---

## Data Binding Patterns

### Two-Way Data Binding

```typescript
// Agent creates form with data binding
await transport.send({
  type: 'createSurface',
  surfaceId: 'settings',
  components: [
    {
      id: 'recording-quality',
      type: 'choicePicker',
      properties: {
        label: 'Recording Quality',
        options: [
          { value: 'low', label: 'Low (480p)' },
          { value: 'medium', label: 'Medium (720p)' },
          { value: 'high', label: 'High (1080p)' }
        ],
        dataBinding: '/settings/recordingQuality'
      }
    },
    {
      id: 'recorder',
      type: 'videoRecorder',
      properties: {
        mode: 'screen',
        audio: true,
        quality: '{{/settings/recordingQuality}}'  // Reactive binding
      }
    }
  ],
  dataModel: {
    settings: {
      recordingQuality: 'medium'
    }
  }
})

// When user changes quality, recorder updates automatically
```

### Computed Values

```typescript
// Use JSON Pointer for computed values
const dataModel = {
  recordings: {
    'rec-1': { duration: 120, size: 50 },
    'rec-2': { duration: 90, size: 35 },
    'rec-3': { duration: 180, size: 75 }
  }
}

// Compute total duration
const totalDuration = Object.values(dataModel.recordings)
  .reduce((sum, rec) => sum + rec.duration, 0)

// Update UI
await transport.send({
  type: 'updateDataModel',
  surfaceId: 'dashboard',
  updates: [{
    path: '/stats/totalDuration',
    operation: 'set',
    value: totalDuration
  }]
})
```

---

## Error Handling

### Graceful Error Recovery

```typescript
class VideoAgent {
  private async handleRecordingError(error: Error, recordingId: string) {
    // Log error
    console.error(`Recording ${recordingId} failed:`, error)

    // Update UI with error message
    await this.transport.send({
      type: 'updateComponents',
      surfaceId: 'recording',
      updates: [
        {
          id: 'error-message',
          operation: 'add',
          component: {
            id: 'error-message',
            type: 'card',
            properties: {
              title: 'Recording Failed',
              subtitle: error.message,
              backgroundColor: '#fee2e2'
            },
            children: ['retry-btn']
          }
        },
        {
          id: 'retry-btn',
          operation: 'add',
          component: {
            id: 'retry-btn',
            type: 'button',
            properties: {
              label: 'Try Again',
              action: 'retryRecording',
              variant: 'primary'
            }
          }
        }
      ]
    })

    // Update state
    await this.transport.send({
      type: 'updateDataModel',
      surfaceId: 'recording',
      updates: [{
        path: '/status',
        operation: 'set',
        value: 'error'
      }]
    })
  }
}
```

### Permission Errors

```typescript
// Handle permission denied
transport.on('error', ({ code, message, details }) => {
  if (code === 'PERMISSION_DENIED') {
    // Show permission request UI
    transport.send({
      type: 'updateComponents',
      surfaceId: 'recording',
      updates: [{
        id: 'permission-prompt',
        operation: 'add',
        component: {
          id: 'permission-prompt',
          type: 'card',
          properties: {
            title: 'Permission Required',
            subtitle: 'Please allow screen recording access'
          }
        }
      }]
    })
  }
})
```

---

## Performance Optimization

### Lazy Component Loading

```typescript
// Load video components on-demand
const lazyLoadVideoComponents = async () => {
  const { VideoRecorder, VideoCall, AIVideo, AIVideoPlayer } = await import(
    '@ainative/ai-kit-video'
  )

  registry.register('videoRecorder', {
    type: 'videoRecorder',
    component: VideoRecorder,
    category: 'media',
    description: 'Video recorder'
  })

  // Register other components...
}

// Only load when needed
transport.on('createSurface', async ({ components }) => {
  const hasVideoComponents = components.some(c =>
    ['videoRecorder', 'videoCall', 'aiVideo', 'aiVideoPlayer'].includes(c.type)
  )

  if (hasVideoComponents) {
    await lazyLoadVideoComponents()
  }
})
```

### Debounced Updates

```typescript
import { debounce } from 'lodash-es'

const updateProgress = debounce((videoId: string, progress: number) => {
  transport.send({
    type: 'videoGenerationProgress',
    surfaceId: 'generation',
    videoId,
    progress
  })
}, 500)  // Update max once per 500ms

// Use in video generation
generator.on('progress', (progress) => {
  updateProgress('vid-123', progress)
})
```

---

## Testing Patterns

### Unit Testing Video Messages

```typescript
import { describe, test, expect, vi } from 'vitest'
import { A2UITransport } from '@ainative/ai-kit-a2ui-core/transport'

describe('Video Recording Workflow', () => {
  test('should handle recording completion', async () => {
    const transport = new A2UITransport('ws://localhost:3000')
    const handler = vi.fn()

    transport.on('recordingComplete', handler)

    // Simulate recording completion
    transport.emit('recordingComplete', {
      type: 'recordingComplete',
      surfaceId: 'test',
      recordingId: 'rec-1',
      videoUrl: 'https://example.com/video.mp4',
      duration: 120,
      transcript: 'Test transcript'
    })

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        recordingId: 'rec-1',
        videoUrl: 'https://example.com/video.mp4',
        duration: 120
      })
    )
  })
})
```

### Integration Testing

```typescript
import { render, screen } from '@testing-library/react'
import { A2UIRenderer } from './A2UIRenderer'

describe('A2UIRenderer Video Integration', () => {
  test('should render video recorder component', async () => {
    const mockTransport = createMockTransport()

    render(<A2UIRenderer wsUrl="ws://test" />)

    // Simulate agent creating video recorder
    mockTransport.emit('createSurface', {
      surfaceId: 'test',
      components: [
        {
          id: 'rec-1',
          type: 'videoRecorder',
          properties: {
            mode: 'screen',
            audio: true,
            quality: 'high'
          }
        }
      ],
      dataModel: {}
    })

    // Verify recorder is rendered
    expect(screen.getByTestId('video-recorder')).toBeInTheDocument()
  })
})
```

---

## See Also

- [Video Components API](./VIDEO_COMPONENTS.md) - Component reference
- [Use Cases](./VIDEO_USE_CASES.md) - Real-world examples
- [Main API Documentation](./API.md) - Core A2UI API
- [Video Protocol PRD](../planning/video-protocol-prd.md) - Complete specification
