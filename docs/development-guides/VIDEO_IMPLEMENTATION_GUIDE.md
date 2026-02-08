# A2UI Video Renderer Implementation Guide

Complete guide for developers building video renderers using the A2UI protocol.

## Table of Contents

- [Setup Instructions](#setup-instructions)
- [Component Implementation Guide](#component-implementation-guide)
- [Message Handler Implementation](#message-handler-implementation)
- [State Management Guide](#state-management-guide)
- [Testing Guide](#testing-guide)
- [Complete Examples](#complete-examples)

---

## Setup Instructions

### Prerequisites

- **Node.js** >= 18.0.0
- **TypeScript** >= 5.0 (recommended)
- **Modern browser** with WebRTC support (for video calls)
- **MediaRecorder API** support (for recording)

### Installation

```bash
npm install @ainative/ai-kit-a2ui-core
```

Or with your preferred package manager:

```bash
yarn add @ainative/ai-kit-a2ui-core
pnpm add @ainative/ai-kit-a2ui-core
```

### Basic Project Setup

```typescript
// src/renderer.ts
import { A2UITransport } from '@ainative/ai-kit-a2ui-core/transport'
import { JSONPointer } from '@ainative/ai-kit-a2ui-core/json-pointer'
import type {
  A2UIComponent,
  RequestRecordingMessage,
  InitiateVideoCallMessage,
  GenerateVideoMessage,
} from '@ainative/ai-kit-a2ui-core/types'

// Initialize transport
const transport = new A2UITransport('wss://api.ainative.studio/agents/demo', {
  reconnect: true,
  reconnectInterval: 3000,
  maxReconnectAttempts: 5,
})

// Connect to agent
await transport.connect()
```

### Framework-Specific Setup

#### React Setup

```typescript
// hooks/useA2UIRenderer.ts
import { useEffect, useState } from 'react'
import { A2UITransport } from '@ainative/ai-kit-a2ui-core/transport'
import type { A2UIComponent } from '@ainative/ai-kit-a2ui-core/types'

export function useA2UIRenderer(url: string) {
  const [transport] = useState(() => new A2UITransport(url))
  const [components, setComponents] = useState<A2UIComponent[]>([])
  const [dataModel, setDataModel] = useState<Record<string, unknown>>({})
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')

  useEffect(() => {
    transport.on('statusChange', setStatus)

    transport.on('createSurface', ({ components, dataModel }) => {
      setComponents(components)
      setDataModel(dataModel || {})
    })

    transport.on('updateComponents', ({ updates }) => {
      setComponents((prev) => applyComponentUpdates(prev, updates))
    })

    transport.on('updateDataModel', ({ updates }) => {
      setDataModel((prev) => applyDataUpdates(prev, updates))
    })

    transport.connect()

    return () => {
      transport.disconnect()
    }
  }, [transport])

  return { transport, components, dataModel, status }
}
```

#### Vue Setup

```typescript
// composables/useA2UIRenderer.ts
import { ref, onMounted, onUnmounted } from 'vue'
import { A2UITransport } from '@ainative/ai-kit-a2ui-core/transport'
import type { A2UIComponent } from '@ainative/ai-kit-a2ui-core/types'

export function useA2UIRenderer(url: string) {
  const transport = new A2UITransport(url)
  const components = ref<A2UIComponent[]>([])
  const dataModel = ref<Record<string, unknown>>({})
  const status = ref<'connecting' | 'connected' | 'disconnected'>('connecting')

  onMounted(() => {
    transport.on('statusChange', (newStatus) => {
      status.value = newStatus
    })

    transport.on('createSurface', ({ components: newComponents, dataModel: newData }) => {
      components.value = newComponents
      dataModel.value = newData || {}
    })

    transport.connect()
  })

  onUnmounted(() => {
    transport.disconnect()
  })

  return { transport, components, dataModel, status }
}
```

---

## Component Implementation Guide

### Video Recorder Component

The `videoRecorder` component enables screen/camera recording with AI features.

#### Component Interface

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

#### Implementation Example

```typescript
// components/VideoRecorder.tsx
import { useState, useRef, useCallback } from 'react'
import type { VideoRecorderComponent } from '@ainative/ai-kit-a2ui-core/types'

interface VideoRecorderProps {
  component: VideoRecorderComponent
  onRecordingComplete: (data: {
    videoUrl: string
    duration: number
    transcript?: string
    highlights?: Array<{ timestamp: number; confidence: number }>
  }) => void
}

export function VideoRecorder({ component, onRecordingComplete }: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number>(0)

  const startRecording = useCallback(async () => {
    try {
      let stream: MediaStream

      // Get media stream based on mode
      if (component.properties.mode === 'screen') {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: { mediaSource: 'screen' },
          audio: component.properties.audio ?? false,
        })
      } else if (component.properties.mode === 'camera') {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: component.properties.audio ?? false,
        })
      } else {
        // Picture-in-Picture: combine screen and camera
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { mediaSource: 'screen' },
        })
        const cameraStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: component.properties.audio ?? false,
        })
        // Combine streams (implementation depends on your video processing library)
        stream = screenStream // Simplified
      }

      // Configure quality
      const videoBitsPerSecond =
        component.properties.quality === 'high'
          ? 2500000
          : component.properties.quality === 'medium'
            ? 1000000
            : 500000

      // Create MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(stream, {
        videoBitsPerSecond,
      })

      chunksRef.current = []
      startTimeRef.current = Date.now()

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        const duration = (Date.now() - startTimeRef.current) / 1000

        // Upload video and get URL
        const videoUrl = await uploadVideo(blob)

        // Process with AI if enabled
        let transcript: string | undefined
        let highlights: Array<{ timestamp: number; confidence: number }> | undefined

        if (component.properties.ai?.transcribe) {
          transcript = await transcribeVideo(videoUrl)
        }

        if (component.properties.ai?.highlights) {
          highlights = await detectHighlights(videoUrl)
        }

        // Call completion handler
        onRecordingComplete({
          videoUrl,
          duration,
          transcript,
          highlights,
        })

        // Cleanup
        stream.getTracks().forEach((track) => track.stop())
        setIsRecording(false)
        setRecordingTime(0)
      }

      mediaRecorderRef.current.start(1000) // Capture every second
      setIsRecording(true)

      // Update recording time
      const interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)

      return () => clearInterval(interval)
    } catch (error) {
      console.error('Failed to start recording:', error)
      // Handle error via onError callback
    }
  }, [component.properties, onRecordingComplete])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
  }, [])

  return (
    <div className="video-recorder">
      {!isRecording ? (
        <button onClick={startRecording} className="record-button">
          Start Recording
        </button>
      ) : (
        <div className="recording-controls">
          <div className="recording-indicator">
            <span className="pulse-dot"></span>
            Recording: {formatTime(recordingTime)}
          </div>
          <button onClick={stopRecording} className="stop-button">
            Stop Recording
          </button>
        </div>
      )}
    </div>
  )
}

// Helper functions
async function uploadVideo(blob: Blob): Promise<string> {
  // Upload to your storage service and return URL
  const formData = new FormData()
  formData.append('video', blob)
  const response = await fetch('/api/upload-video', {
    method: 'POST',
    body: formData,
  })
  const { url } = await response.json()
  return url
}

async function transcribeVideo(videoUrl: string): Promise<string> {
  // Call transcription service
  const response = await fetch('/api/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoUrl }),
  })
  const { transcript } = await response.json()
  return transcript
}

async function detectHighlights(
  videoUrl: string
): Promise<Array<{ timestamp: number; confidence: number }>> {
  // Call AI highlight detection service
  const response = await fetch('/api/detect-highlights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoUrl }),
  })
  const { highlights } = await response.json()
  return highlights
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
```

### Video Call Component

The `videoCall` component enables multi-participant video conferencing.

#### Component Interface

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

#### Implementation Example

```typescript
// components/VideoCall.tsx
import { useState, useEffect, useRef } from 'react'
import type { VideoCallComponent, VideoCallParticipant } from '@ainative/ai-kit-a2ui-core/types'

interface VideoCallProps {
  component: VideoCallComponent
  onParticipantJoined: (participant: VideoCallParticipant) => void
  onCallEnded: (data: {
    duration: number
    transcript?: string
    summary?: string
    actionItems?: string[]
  }) => void
}

export function VideoCall({ component, onParticipantJoined, onCallEnded }: VideoCallProps) {
  const [participants, setParticipants] = useState<VideoCallParticipant[]>([])
  const [isCallActive, setIsCallActive] = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [transcript, setTranscript] = useState<string>('')
  const callStartTimeRef = useRef<number>(0)
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map())

  useEffect(() => {
    if (isCallActive) {
      initializeCall()
    }

    return () => {
      cleanup()
    }
  }, [isCallActive])

  const initializeCall = async () => {
    try {
      // Get local media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

      // Apply AI audio enhancements if enabled
      if (component.properties.ai?.noiseCancellation) {
        // Apply noise cancellation to audio track
        const audioTrack = stream.getAudioTracks()[0]
        // Implementation depends on your audio processing library
      }

      setLocalStream(stream)
      callStartTimeRef.current = Date.now()

      // Initialize WebRTC signaling
      await joinRoom(component.properties.roomId, stream)

      // Start live transcription if enabled
      if (component.properties.ai?.liveTranscription) {
        startLiveTranscription(stream)
      }
    } catch (error) {
      console.error('Failed to initialize call:', error)
    }
  }

  const joinRoom = async (roomId: string, stream: MediaStream) => {
    // Connect to signaling server
    const ws = new WebSocket(`wss://signaling.example.com/${roomId}`)

    ws.onmessage = async (event) => {
      const message = JSON.parse(event.data)

      switch (message.type) {
        case 'participant-joined':
          await handleParticipantJoined(message.participantId, stream)
          break
        case 'offer':
          await handleOffer(message.participantId, message.offer, stream)
          break
        case 'answer':
          await handleAnswer(message.participantId, message.answer)
          break
        case 'ice-candidate':
          await handleIceCandidate(message.participantId, message.candidate)
          break
      }
    }
  }

  const handleParticipantJoined = async (participantId: string, stream: MediaStream) => {
    // Create peer connection
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    })

    // Add local stream
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream)
    })

    // Handle remote stream
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0]
      // Add to participants list with video element
      const participant: VideoCallParticipant = {
        id: participantId,
        name: 'Participant', // Get from signaling
        role: 'participant',
        isMuted: false,
        isVideoEnabled: true,
        joinedAt: new Date().toISOString(),
      }

      setParticipants((prev) => [...prev, participant])
      onParticipantJoined(participant)
    }

    peerConnectionsRef.current.set(participantId, pc)

    // Create and send offer
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    // Send offer via signaling server
  }

  const startLiveTranscription = (stream: MediaStream) => {
    // Use Web Speech API or external service
    const recognition = new (window as any).webkitSpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event: any) => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' '
        } else {
          interimTranscript += transcript
        }
      }

      setTranscript((prev) => prev + finalTranscript)
    }

    recognition.start()
  }

  const endCall = async () => {
    const duration = (Date.now() - callStartTimeRef.current) / 1000

    // Generate AI summary if enabled
    let summary: string | undefined
    let actionItems: string[] | undefined

    if (transcript && component.properties.ai?.actionItemDetection) {
      const aiAnalysis = await analyzeTranscript(transcript)
      summary = aiAnalysis.summary
      actionItems = aiAnalysis.actionItems
    }

    onCallEnded({
      duration,
      transcript,
      summary,
      actionItems,
    })

    setIsCallActive(false)
    cleanup()
  }

  const cleanup = () => {
    localStream?.getTracks().forEach((track) => track.stop())
    peerConnectionsRef.current.forEach((pc) => pc.close())
    peerConnectionsRef.current.clear()
    setParticipants([])
  }

  const renderParticipants = () => {
    const layout = component.properties.layout || 'grid'

    return (
      <div className={`participants-${layout}`}>
        {participants.map((participant) => (
          <div key={participant.id} className="participant">
            <video autoPlay playsInline />
            <div className="participant-info">
              <span>{participant.name}</span>
              {participant.isMuted && <span>🔇</span>}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="video-call">
      {!isCallActive ? (
        <button onClick={() => setIsCallActive(true)}>Join Call</button>
      ) : (
        <>
          <div className="call-container">
            {renderParticipants()}

            {component.properties.ai?.liveCaptions && transcript && (
              <div className="live-captions">{transcript.split(' ').slice(-20).join(' ')}</div>
            )}
          </div>

          <div className="call-controls">
            <button onClick={endCall}>End Call</button>
            {component.properties.features?.screenShare && (
              <button onClick={() => {/* Share screen */}}>Share Screen</button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

async function analyzeTranscript(
  transcript: string
): Promise<{ summary: string; actionItems: string[] }> {
  // Call AI service to analyze transcript
  const response = await fetch('/api/analyze-transcript', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript }),
  })
  return response.json()
}

// Additional helper functions for WebRTC signaling...
function handleOffer(participantId: string, offer: RTCSessionDescriptionInit, stream: MediaStream) {
  // Implementation
}

function handleAnswer(participantId: string, answer: RTCSessionDescriptionInit) {
  // Implementation
}

function handleIceCandidate(participantId: string, candidate: RTCIceCandidateInit) {
  // Implementation
}
```

### AI Video Generation Component

The `aiVideo` component generates videos from prompts using AI.

#### Component Interface

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

#### Implementation Example

```typescript
// components/AIVideo.tsx
import { useState, useEffect } from 'react'
import type { AIVideoComponent } from '@ainative/ai-kit-a2ui-core/types'

interface AIVideoProps {
  component: AIVideoComponent
  onProgress: (progress: number, frame?: string) => void
  onComplete: (videoUrl: string, composition: any) => void
}

export function AIVideo({ component, onProgress, onComplete }: AIVideoProps) {
  const [progress, setProgress] = useState(0)
  const [previewFrame, setPreviewFrame] = useState<string>()
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (component.properties.prompt || component.properties.template) {
      startGeneration()
    }
  }, [component.properties])

  const startGeneration = async () => {
    setIsGenerating(true)

    try {
      // Start video generation
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: component.properties.prompt,
          template: component.properties.template,
          data: component.properties.data,
          voice: component.properties.voice,
          streaming: component.properties.streaming,
        }),
      })

      if (component.properties.streaming) {
        // Handle streaming response
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        while (reader) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'progress') {
                setProgress(data.progress)
                if (data.frame) {
                  setPreviewFrame(data.frame)
                }
                onProgress(data.progress, data.frame)
              } else if (data.type === 'complete') {
                setIsGenerating(false)
                onComplete(data.videoUrl, data.composition)
              }
            }
          }
        }
      } else {
        // Handle regular response
        const result = await response.json()
        setIsGenerating(false)
        onComplete(result.videoUrl, result.composition)
      }
    } catch (error) {
      console.error('Video generation failed:', error)
      setIsGenerating(false)
    }
  }

  return (
    <div className="ai-video-generator">
      {isGenerating ? (
        <div className="generation-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p>{progress}% complete</p>
          {previewFrame && <img src={previewFrame} alt="Preview" className="preview-frame" />}
        </div>
      ) : (
        <div className="generation-idle">
          <p>Ready to generate video</p>
        </div>
      )}
    </div>
  )
}
```

### AI Video Player Component

The `aiVideoPlayer` component provides interactive video playback with AI features.

#### Component Interface

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

#### Implementation Example

```typescript
// components/AIVideoPlayer.tsx
import { useState, useRef, useEffect } from 'react'
import type { AIVideoPlayerComponent } from '@ainative/ai-kit-a2ui-core/types'

interface AIVideoPlayerProps {
  component: AIVideoPlayerComponent
  onQuestion: (question: string) => Promise<{ answer: string; timestamp?: number }>
}

export function AIVideoPlayer({ component, onQuestion }: AIVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<{ answer: string; timestamp?: number } | null>(null)
  const [chapters, setChapters] = useState<Array<{ title: string; timestamp: number }>>([])

  useEffect(() => {
    if (component.properties.interactive?.smartChapters && component.properties.transcript) {
      generateSmartChapters(component.properties.transcript)
    }
  }, [component.properties])

  const generateSmartChapters = async (transcript: string) => {
    // Call AI to generate chapters from transcript
    const response = await fetch('/api/generate-chapters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript }),
    })
    const { chapters } = await response.json()
    setChapters(chapters)
  }

  const handleAskQuestion = async () => {
    if (!question.trim()) return

    const result = await onQuestion(question)
    setAnswer(result)

    // Jump to relevant timestamp if provided
    if (result.timestamp !== undefined && videoRef.current) {
      videoRef.current.currentTime = result.timestamp
    }

    setQuestion('')
  }

  const handleConversationalControl = async (command: string) => {
    // Parse natural language commands like "skip to the part about React hooks"
    const response = await fetch('/api/parse-video-command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command,
        transcript: component.properties.transcript,
        currentTime,
      }),
    })
    const { action, timestamp } = await response.json()

    if (action === 'seek' && timestamp !== undefined && videoRef.current) {
      videoRef.current.currentTime = timestamp
    }
  }

  return (
    <div className="ai-video-player">
      <video
        ref={videoRef}
        src={component.properties.videoUrl}
        controls
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
      />

      {component.properties.interactive?.smartChapters && chapters.length > 0 && (
        <div className="smart-chapters">
          <h4>Chapters</h4>
          <ul>
            {chapters.map((chapter, idx) => (
              <li key={idx}>
                <button
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = chapter.timestamp
                    }
                  }}
                >
                  {chapter.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {component.properties.interactive?.allowQuestions && (
        <div className="question-panel">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about the video..."
            onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
          />
          <button onClick={handleAskQuestion}>Ask</button>

          {answer && (
            <div className="answer">
              <strong>Answer:</strong> {answer.answer}
              {answer.timestamp !== undefined && (
                <span> (at {Math.floor(answer.timestamp)}s)</span>
              )}
            </div>
          )}
        </div>
      )}

      {component.properties.interactive?.conversationalControl && (
        <div className="conversational-control">
          <input
            type="text"
            placeholder='Try: "skip to the introduction" or "show me the demo"'
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleConversationalControl(e.currentTarget.value)
                e.currentTarget.value = ''
              }
            }}
          />
        </div>
      )}
    </div>
  )
}
```

---

## Message Handler Implementation

### Setting Up Message Handlers

```typescript
// handlers/VideoMessageHandlers.ts
import { A2UITransport } from '@ainative/ai-kit-a2ui-core/transport'
import type {
  RequestRecordingMessage,
  RecordingStartedMessage,
  RecordingCompleteMessage,
  InitiateVideoCallMessage,
  VideoCallJoinedMessage,
  VideoCallEndedMessage,
  GenerateVideoMessage,
  VideoGenerationProgressMessage,
  VideoGenerationCompleteMessage,
} from '@ainative/ai-kit-a2ui-core/types'

export class VideoMessageHandlers {
  constructor(private transport: A2UITransport) {
    this.setupHandlers()
  }

  private setupHandlers() {
    // Recording handlers
    this.transport.on<RequestRecordingMessage>('requestRecording', this.handleRequestRecording)
    this.transport.on<RecordingStartedMessage>('recordingStarted', this.handleRecordingStarted)
    this.transport.on<RecordingCompleteMessage>('recordingComplete', this.handleRecordingComplete)

    // Video call handlers
    this.transport.on<InitiateVideoCallMessage>('initiateVideoCall', this.handleInitiateVideoCall)
    this.transport.on<VideoCallJoinedMessage>('videoCallJoined', this.handleVideoCallJoined)
    this.transport.on<VideoCallEndedMessage>('videoCallEnded', this.handleVideoCallEnded)

    // Video generation handlers
    this.transport.on<GenerateVideoMessage>('generateVideo', this.handleGenerateVideo)
    this.transport.on<VideoGenerationProgressMessage>(
      'videoGenerationProgress',
      this.handleVideoGenerationProgress
    )
    this.transport.on<VideoGenerationCompleteMessage>(
      'videoGenerationComplete',
      this.handleVideoGenerationComplete
    )
  }

  // Recording message handlers
  private handleRequestRecording = (message: RequestRecordingMessage) => {
    console.log('Agent requested recording:', message)

    // Trigger UI to start recording
    const event = new CustomEvent('a2ui:startRecording', {
      detail: {
        recordingId: message.recordingId,
        mode: message.mode,
        options: message.options,
      },
    })
    window.dispatchEvent(event)
  }

  private handleRecordingStarted = (message: RecordingStartedMessage) => {
    console.log('Recording started:', message)
    // Update UI state
  }

  private handleRecordingComplete = (message: RecordingCompleteMessage) => {
    console.log('Recording complete:', message)

    // Process the completed recording
    if (message.transcript) {
      console.log('Transcript:', message.transcript)
    }

    if (message.highlights) {
      console.log('Highlights detected:', message.highlights.length)
    }

    // Update UI with video player
    const event = new CustomEvent('a2ui:recordingComplete', {
      detail: message,
    })
    window.dispatchEvent(event)
  }

  // Video call message handlers
  private handleInitiateVideoCall = (message: InitiateVideoCallMessage) => {
    console.log('Agent initiated video call:', message)

    // Show video call UI
    const event = new CustomEvent('a2ui:initiateCall', {
      detail: {
        callId: message.callId,
        roomId: message.roomId,
        participants: message.participants,
      },
    })
    window.dispatchEvent(event)
  }

  private handleVideoCallJoined = (message: VideoCallJoinedMessage) => {
    console.log('Participant joined:', message.participantId)

    // Add participant to UI
    const event = new CustomEvent('a2ui:participantJoined', {
      detail: message,
    })
    window.dispatchEvent(event)
  }

  private handleVideoCallEnded = (message: VideoCallEndedMessage) => {
    console.log('Call ended:', message)

    // Display call summary
    if (message.summary) {
      console.log('AI Summary:', message.summary)
    }

    if (message.actionItems) {
      console.log('Action Items:', message.actionItems)
    }

    // Clean up call UI
    const event = new CustomEvent('a2ui:callEnded', {
      detail: message,
    })
    window.dispatchEvent(event)
  }

  // Video generation message handlers
  private handleGenerateVideo = (message: GenerateVideoMessage) => {
    console.log('Agent requested video generation:', message)

    // Show generation UI
    const event = new CustomEvent('a2ui:startGeneration', {
      detail: {
        videoId: message.videoId,
        prompt: message.prompt,
        template: message.template,
        data: message.data,
      },
    })
    window.dispatchEvent(event)
  }

  private handleVideoGenerationProgress = (message: VideoGenerationProgressMessage) => {
    console.log(`Generation progress: ${message.progress}%`)

    // Update progress UI
    const event = new CustomEvent('a2ui:generationProgress', {
      detail: {
        videoId: message.videoId,
        progress: message.progress,
        frame: message.frame,
      },
    })
    window.dispatchEvent(event)
  }

  private handleVideoGenerationComplete = (message: VideoGenerationCompleteMessage) => {
    console.log('Video generation complete:', message.videoUrl)

    // Show completed video
    const event = new CustomEvent('a2ui:generationComplete', {
      detail: message,
    })
    window.dispatchEvent(event)
  }
}
```

### Sending Messages to Agent

```typescript
// services/VideoMessageService.ts
import type { A2UITransport } from '@ainative/ai-kit-a2ui-core/transport'
import type {
  RecordingStartedMessage,
  RecordingCompleteMessage,
  VideoCallJoinedMessage,
  VideoCallEndedMessage,
} from '@ainative/ai-kit-a2ui-core/types'

export class VideoMessageService {
  constructor(private transport: A2UITransport) {}

  // Notify agent that recording has started
  notifyRecordingStarted(surfaceId: string, recordingId: string) {
    const message: RecordingStartedMessage = {
      type: 'recordingStarted',
      surfaceId,
      recordingId,
      timestamp: new Date().toISOString(),
    }

    this.transport.send(message)
  }

  // Notify agent that recording is complete
  notifyRecordingComplete(
    surfaceId: string,
    recordingId: string,
    videoUrl: string,
    duration: number,
    transcript?: string,
    highlights?: Array<{ timestamp: number; confidence: number }>
  ) {
    const message: RecordingCompleteMessage = {
      type: 'recordingComplete',
      surfaceId,
      recordingId,
      videoUrl,
      duration,
      transcript,
      highlights,
    }

    this.transport.send(message)
  }

  // Notify agent that participant joined call
  notifyParticipantJoined(
    surfaceId: string,
    callId: string,
    participantId: string,
    participant?: any
  ) {
    const message: VideoCallJoinedMessage = {
      type: 'videoCallJoined',
      surfaceId,
      callId,
      participantId,
      timestamp: new Date().toISOString(),
      participant,
    }

    this.transport.send(message)
  }

  // Notify agent that call ended
  notifyCallEnded(
    surfaceId: string,
    callId: string,
    duration: number,
    transcript?: string,
    summary?: string,
    actionItems?: string[],
    participants?: any[]
  ) {
    const message: VideoCallEndedMessage = {
      type: 'videoCallEnded',
      surfaceId,
      callId,
      duration,
      transcript,
      summary,
      actionItems,
      participants,
    }

    this.transport.send(message)
  }
}
```

---

## State Management Guide

### Video State Management

```typescript
// state/VideoState.ts
import { create } from 'zustand'
import type {
  RecordingState,
  VideoCallState,
  VideoGenerationState,
  VideoCallParticipant,
} from '@ainative/ai-kit-a2ui-core/types'

interface RecordingStateData {
  recordingId: string | null
  state: RecordingState
  videoUrl: string | null
  duration: number
  transcript: string | null
  highlights: Array<{ timestamp: number; confidence: number }>
}

interface VideoCallStateData {
  callId: string | null
  roomId: string | null
  state: VideoCallState
  participants: VideoCallParticipant[]
  localStream: MediaStream | null
  duration: number
  transcript: string
}

interface VideoGenerationStateData {
  videoId: string | null
  state: VideoGenerationState
  progress: number
  previewFrame: string | null
  videoUrl: string | null
  composition: any
}

interface VideoStore {
  // Recording state
  recording: RecordingStateData
  setRecordingState: (state: Partial<RecordingStateData>) => void
  startRecording: (recordingId: string) => void
  completeRecording: (videoUrl: string, duration: number, transcript?: string) => void
  resetRecording: () => void

  // Video call state
  videoCall: VideoCallStateData
  setVideoCallState: (state: Partial<VideoCallStateData>) => void
  startCall: (callId: string, roomId: string) => void
  addParticipant: (participant: VideoCallParticipant) => void
  removeParticipant: (participantId: string) => void
  endCall: () => void
  resetVideoCall: () => void

  // Video generation state
  videoGeneration: VideoGenerationStateData
  setVideoGenerationState: (state: Partial<VideoGenerationStateData>) => void
  startGeneration: (videoId: string) => void
  updateProgress: (progress: number, frame?: string) => void
  completeGeneration: (videoUrl: string, composition: any) => void
  resetVideoGeneration: () => void
}

export const useVideoStore = create<VideoStore>((set) => ({
  // Recording state
  recording: {
    recordingId: null,
    state: 'idle',
    videoUrl: null,
    duration: 0,
    transcript: null,
    highlights: [],
  },

  setRecordingState: (state) =>
    set((prev) => ({
      recording: { ...prev.recording, ...state },
    })),

  startRecording: (recordingId) =>
    set((prev) => ({
      recording: {
        ...prev.recording,
        recordingId,
        state: 'recording',
        videoUrl: null,
        duration: 0,
        transcript: null,
        highlights: [],
      },
    })),

  completeRecording: (videoUrl, duration, transcript) =>
    set((prev) => ({
      recording: {
        ...prev.recording,
        state: 'complete',
        videoUrl,
        duration,
        transcript: transcript || null,
      },
    })),

  resetRecording: () =>
    set({
      recording: {
        recordingId: null,
        state: 'idle',
        videoUrl: null,
        duration: 0,
        transcript: null,
        highlights: [],
      },
    }),

  // Video call state
  videoCall: {
    callId: null,
    roomId: null,
    state: 'idle',
    participants: [],
    localStream: null,
    duration: 0,
    transcript: '',
  },

  setVideoCallState: (state) =>
    set((prev) => ({
      videoCall: { ...prev.videoCall, ...state },
    })),

  startCall: (callId, roomId) =>
    set((prev) => ({
      videoCall: {
        ...prev.videoCall,
        callId,
        roomId,
        state: 'connecting',
        participants: [],
        duration: 0,
        transcript: '',
      },
    })),

  addParticipant: (participant) =>
    set((prev) => ({
      videoCall: {
        ...prev.videoCall,
        participants: [...prev.videoCall.participants, participant],
        state: 'active',
      },
    })),

  removeParticipant: (participantId) =>
    set((prev) => ({
      videoCall: {
        ...prev.videoCall,
        participants: prev.videoCall.participants.filter((p) => p.id !== participantId),
      },
    })),

  endCall: () =>
    set((prev) => ({
      videoCall: {
        ...prev.videoCall,
        state: 'ended',
      },
    })),

  resetVideoCall: () =>
    set({
      videoCall: {
        callId: null,
        roomId: null,
        state: 'idle',
        participants: [],
        localStream: null,
        duration: 0,
        transcript: '',
      },
    }),

  // Video generation state
  videoGeneration: {
    videoId: null,
    state: 'idle',
    progress: 0,
    previewFrame: null,
    videoUrl: null,
    composition: null,
  },

  setVideoGenerationState: (state) =>
    set((prev) => ({
      videoGeneration: { ...prev.videoGeneration, ...state },
    })),

  startGeneration: (videoId) =>
    set((prev) => ({
      videoGeneration: {
        ...prev.videoGeneration,
        videoId,
        state: 'generating',
        progress: 0,
        previewFrame: null,
        videoUrl: null,
        composition: null,
      },
    })),

  updateProgress: (progress, frame) =>
    set((prev) => ({
      videoGeneration: {
        ...prev.videoGeneration,
        progress,
        previewFrame: frame || prev.videoGeneration.previewFrame,
      },
    })),

  completeGeneration: (videoUrl, composition) =>
    set((prev) => ({
      videoGeneration: {
        ...prev.videoGeneration,
        state: 'complete',
        progress: 100,
        videoUrl,
        composition,
      },
    })),

  resetVideoGeneration: () =>
    set({
      videoGeneration: {
        videoId: null,
        state: 'idle',
        progress: 0,
        previewFrame: null,
        videoUrl: null,
        composition: null,
      },
    }),
}))
```

### Using Video State in Components

```typescript
// Example usage in React component
import { useVideoStore } from './state/VideoState'

function RecordingComponent() {
  const { recording, startRecording, completeRecording } = useVideoStore()

  const handleStartRecording = () => {
    startRecording('rec-' + Date.now())
    // Start actual recording...
  }

  const handleStopRecording = (videoUrl: string, duration: number) => {
    completeRecording(videoUrl, duration)
  }

  return (
    <div>
      <p>State: {recording.state}</p>
      {recording.state === 'idle' && (
        <button onClick={handleStartRecording}>Start Recording</button>
      )}
      {recording.state === 'recording' && (
        <button onClick={() => handleStopRecording('url', 60)}>Stop Recording</button>
      )}
      {recording.state === 'complete' && <video src={recording.videoUrl!} controls />}
    </div>
  )
}
```

---

## Testing Guide

### Unit Testing Message Handlers

```typescript
// __tests__/VideoMessageHandlers.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { A2UITransport } from '@ainative/ai-kit-a2ui-core/transport'
import type { RequestRecordingMessage } from '@ainative/ai-kit-a2ui-core/types'

describe('Video Message Handlers', () => {
  let transport: A2UITransport

  beforeEach(async () => {
    transport = new A2UITransport('wss://test.example.com')
    await transport.connect()
  })

  afterEach(() => {
    transport.disconnect()
  })

  describe('Given an agent requests recording', () => {
    it('When requestRecording message is received, Then handler is invoked', async () => {
      // Arrange
      let receivedMessage: RequestRecordingMessage | null = null
      transport.on<RequestRecordingMessage>('requestRecording', (msg) => {
        receivedMessage = msg
      })

      const message: RequestRecordingMessage = {
        type: 'requestRecording',
        surfaceId: 'surface-1',
        recordingId: 'rec-1',
        mode: 'screen',
        options: { audio: true, quality: 'high' },
      }

      // Act
      const ws = (transport as any).ws
      ws.onmessage?.(new MessageEvent('message', { data: JSON.stringify(message) }))
      await new Promise((resolve) => setTimeout(resolve, 10))

      // Assert
      expect(receivedMessage).not.toBeNull()
      expect(receivedMessage?.recordingId).toBe('rec-1')
      expect(receivedMessage?.mode).toBe('screen')
    })
  })

  describe('Given recording is complete', () => {
    it('When sending recordingComplete message, Then agent receives it', () => {
      // Arrange
      const sendSpy = vi.spyOn(transport, 'send')

      // Act
      transport.send({
        type: 'recordingComplete',
        surfaceId: 'surface-1',
        recordingId: 'rec-1',
        videoUrl: 'https://example.com/video.mp4',
        duration: 120,
        transcript: 'Test transcript',
      })

      // Assert
      expect(sendSpy).toHaveBeenCalled()
    })
  })
})
```

### Integration Testing Video Components

```typescript
// __tests__/VideoRecorder.integration.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VideoRecorder } from '../components/VideoRecorder'

// Mock MediaDevices API
const mockGetDisplayMedia = vi.fn()
const mockGetUserMedia = vi.fn()

beforeEach(() => {
  Object.defineProperty(navigator, 'mediaDevices', {
    value: {
      getDisplayMedia: mockGetDisplayMedia,
      getUserMedia: mockGetUserMedia,
    },
    writable: true,
  })

  // Mock MediaRecorder
  global.MediaRecorder = class MockMediaRecorder {
    ondataavailable: ((event: any) => void) | null = null
    onstop: (() => void) | null = null

    constructor(stream: MediaStream, options: any) {}

    start(timeslice: number) {
      // Simulate recording
    }

    stop() {
      if (this.onstop) {
        this.onstop()
      }
    }
  } as any
})

describe('VideoRecorder Component', () => {
  describe('Given a videoRecorder component is rendered', () => {
    it('When user clicks start recording, Then MediaRecorder is initialized', async () => {
      // Arrange
      const mockStream = {} as MediaStream
      mockGetDisplayMedia.mockResolvedValue(mockStream)

      const onRecordingComplete = vi.fn()
      const component = {
        id: 'recorder-1',
        type: 'videoRecorder' as const,
        properties: {
          mode: 'screen' as const,
          audio: true,
          quality: 'high' as const,
        },
      }

      render(<VideoRecorder component={component} onRecordingComplete={onRecordingComplete} />)

      // Act
      const startButton = screen.getByText('Start Recording')
      await userEvent.click(startButton)

      // Assert
      await waitFor(() => {
        expect(mockGetDisplayMedia).toHaveBeenCalled()
      })
    })
  })

  describe('Given recording is in progress', () => {
    it('When user clicks stop, Then recording completes', async () => {
      // Arrange
      const mockStream = {
        getTracks: () => [{ stop: vi.fn() }],
      } as any
      mockGetDisplayMedia.mockResolvedValue(mockStream)

      const onRecordingComplete = vi.fn()
      const component = {
        id: 'recorder-1',
        type: 'videoRecorder' as const,
        properties: {
          mode: 'screen' as const,
        },
      }

      render(<VideoRecorder component={component} onRecordingComplete={onRecordingComplete} />)

      // Start recording
      const startButton = screen.getByText('Start Recording')
      await userEvent.click(startButton)

      // Act
      const stopButton = await screen.findByText('Stop Recording')
      await userEvent.click(stopButton)

      // Assert
      await waitFor(() => {
        expect(onRecordingComplete).toHaveBeenCalled()
      })
    })
  })
})
```

### End-to-End Testing

```typescript
// __tests__/e2e/VideoWorkflow.e2e.test.ts
import { describe, it, expect } from 'vitest'
import { A2UITransport } from '@ainative/ai-kit-a2ui-core/transport'
import type { RequestRecordingMessage, RecordingCompleteMessage } from '@ainative/ai-kit-a2ui-core/types'

describe('Video Recording E2E Workflow', () => {
  it('Should complete full recording workflow', async () => {
    // Arrange
    const transport = new A2UITransport('wss://test.example.com')
    await transport.connect()

    const receivedMessages: any[] = []

    // Listen for agent messages
    transport.on<RequestRecordingMessage>('requestRecording', (msg) => {
      receivedMessages.push({ type: 'requestRecording', ...msg })
    })

    // Simulate agent requesting recording
    const ws = (transport as any).ws
    ws.onmessage?.(
      new MessageEvent('message', {
        data: JSON.stringify({
          type: 'requestRecording',
          surfaceId: 'surface-1',
          recordingId: 'rec-1',
          mode: 'screen',
        }),
      })
    )

    await new Promise((resolve) => setTimeout(resolve, 100))

    // Assert request was received
    expect(receivedMessages).toHaveLength(1)
    expect(receivedMessages[0].type).toBe('requestRecording')

    // Simulate recording completion
    const completeMessage: RecordingCompleteMessage = {
      type: 'recordingComplete',
      surfaceId: 'surface-1',
      recordingId: 'rec-1',
      videoUrl: 'https://cdn.example.com/rec-1.mp4',
      duration: 120,
      transcript: 'Test recording transcript',
    }

    transport.send(completeMessage)

    // Cleanup
    await transport.disconnect()
  })
})
```

---

## Complete Examples

### Full Video Recording Flow

```typescript
// examples/VideoRecordingFlow.tsx
import React, { useState, useEffect } from 'react'
import { A2UITransport } from '@ainative/ai-kit-a2ui-core/transport'
import { VideoRecorder } from '../components/VideoRecorder'
import { useVideoStore } from '../state/VideoState'
import type { RequestRecordingMessage, RecordingCompleteMessage } from '@ainative/ai-kit-a2ui-core/types'

export function VideoRecordingFlow() {
  const [transport] = useState(() => new A2UITransport('wss://api.ainative.studio/agents/demo'))
  const { recording, startRecording, completeRecording, resetRecording } = useVideoStore()
  const [showRecorder, setShowRecorder] = useState(false)

  useEffect(() => {
    // Setup message handlers
    transport.on<RequestRecordingMessage>('requestRecording', (message) => {
      console.log('Agent requested recording:', message)
      startRecording(message.recordingId)
      setShowRecorder(true)
    })

    // Connect to agent
    transport.connect()

    return () => {
      transport.disconnect()
    }
  }, [transport, startRecording])

  const handleRecordingComplete = async (data: {
    videoUrl: string
    duration: number
    transcript?: string
    highlights?: Array<{ timestamp: number; confidence: number }>
  }) => {
    // Update local state
    completeRecording(data.videoUrl, data.duration, data.transcript)

    // Notify agent
    const message: RecordingCompleteMessage = {
      type: 'recordingComplete',
      surfaceId: 'demo-surface',
      recordingId: recording.recordingId!,
      videoUrl: data.videoUrl,
      duration: data.duration,
      transcript: data.transcript,
      highlights: data.highlights,
    }

    transport.send(message)
    setShowRecorder(false)
  }

  return (
    <div className="video-recording-flow">
      <h1>Video Recording Demo</h1>

      {recording.state === 'idle' && (
        <div>
          <p>Waiting for agent to request recording...</p>
          <button onClick={() => setShowRecorder(true)}>Manual Start</button>
        </div>
      )}

      {showRecorder && (
        <VideoRecorder
          component={{
            id: 'recorder-1',
            type: 'videoRecorder',
            properties: {
              mode: 'screen',
              audio: true,
              quality: 'high',
              ai: {
                transcribe: true,
                highlights: true,
              },
            },
          }}
          onRecordingComplete={handleRecordingComplete}
        />
      )}

      {recording.state === 'complete' && (
        <div className="recording-result">
          <h2>Recording Complete</h2>
          <video src={recording.videoUrl!} controls style={{ width: '100%', maxWidth: 800 }} />

          {recording.transcript && (
            <div className="transcript">
              <h3>Transcript</h3>
              <p>{recording.transcript}</p>
            </div>
          )}

          <button onClick={resetRecording}>Start New Recording</button>
        </div>
      )}
    </div>
  )
}
```

### Full Video Call Flow

```typescript
// examples/VideoCallFlow.tsx
import React, { useState, useEffect } from 'react'
import { A2UITransport } from '@ainative/ai-kit-a2ui-core/transport'
import { VideoCall } from '../components/VideoCall'
import { useVideoStore } from '../state/VideoState'
import type {
  InitiateVideoCallMessage,
  VideoCallJoinedMessage,
  VideoCallEndedMessage,
  VideoCallParticipant,
} from '@ainative/ai-kit-a2ui-core/types'

export function VideoCallFlow() {
  const [transport] = useState(() => new A2UITransport('wss://api.ainative.studio/agents/demo'))
  const { videoCall, startCall, addParticipant, endCall, resetVideoCall } = useVideoStore()
  const [showCall, setShowCall] = useState(false)

  useEffect(() => {
    // Setup message handlers
    transport.on<InitiateVideoCallMessage>('initiateVideoCall', (message) => {
      console.log('Agent initiated call:', message)
      startCall(message.callId, message.roomId)
      setShowCall(true)
    })

    transport.connect()

    return () => {
      transport.disconnect()
    }
  }, [transport, startCall])

  const handleParticipantJoined = (participant: VideoCallParticipant) => {
    addParticipant(participant)

    // Notify agent
    const message: VideoCallJoinedMessage = {
      type: 'videoCallJoined',
      surfaceId: 'demo-surface',
      callId: videoCall.callId!,
      participantId: participant.id,
      timestamp: new Date().toISOString(),
      participant,
    }

    transport.send(message)
  }

  const handleCallEnded = (data: {
    duration: number
    transcript?: string
    summary?: string
    actionItems?: string[]
  }) => {
    endCall()

    // Notify agent
    const message: VideoCallEndedMessage = {
      type: 'videoCallEnded',
      surfaceId: 'demo-surface',
      callId: videoCall.callId!,
      duration: data.duration,
      transcript: data.transcript,
      summary: data.summary,
      actionItems: data.actionItems,
      participants: videoCall.participants,
    }

    transport.send(message)
    setShowCall(false)
  }

  return (
    <div className="video-call-flow">
      <h1>Video Call Demo</h1>

      {videoCall.state === 'idle' && !showCall && (
        <div>
          <p>Waiting for agent to initiate call...</p>
          <button
            onClick={() => {
              startCall('manual-call', 'room-123')
              setShowCall(true)
            }}
          >
            Manual Start Call
          </button>
        </div>
      )}

      {showCall && (
        <VideoCall
          component={{
            id: 'call-1',
            type: 'videoCall',
            properties: {
              roomId: videoCall.roomId!,
              layout: 'grid',
              features: {
                chat: true,
                screenShare: true,
                recording: true,
              },
              ai: {
                liveTranscription: true,
                liveCaptions: true,
                noiseCancellation: true,
                actionItemDetection: true,
              },
            },
          }}
          onParticipantJoined={handleParticipantJoined}
          onCallEnded={handleCallEnded}
        />
      )}

      {videoCall.state === 'ended' && (
        <div className="call-summary">
          <h2>Call Summary</h2>
          <p>Duration: {Math.floor(videoCall.duration / 60)} minutes</p>
          <p>Participants: {videoCall.participants.length}</p>

          {videoCall.transcript && (
            <div>
              <h3>Transcript</h3>
              <p>{videoCall.transcript}</p>
            </div>
          )}

          <button onClick={resetVideoCall}>Start New Call</button>
        </div>
      )}
    </div>
  )
}
```

---

## Best Practices

### Performance Optimization

1. **Lazy Loading**: Load video components only when needed
2. **Stream Cleanup**: Always clean up MediaStreams when done
3. **Memory Management**: Dispose of large video blobs promptly
4. **Debouncing**: Debounce progress updates for video generation

### Error Handling

```typescript
// Always wrap media operations in try-catch
try {
  const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
} catch (error) {
  if (error.name === 'NotAllowedError') {
    console.error('User denied screen sharing permission')
  } else if (error.name === 'NotFoundError') {
    console.error('No screen sharing source available')
  } else {
    console.error('Unknown error:', error)
  }
}
```

### Security Considerations

1. **HTTPS Required**: Video features require secure context (HTTPS)
2. **Permissions**: Always check and request permissions
3. **CORS**: Ensure video URLs support CORS for cross-origin access
4. **Content Security Policy**: Configure CSP to allow media sources

---

## Troubleshooting

### Common Issues

**Issue**: MediaRecorder not available
**Solution**: Check browser compatibility or use polyfill

**Issue**: WebRTC connection fails
**Solution**: Verify STUN/TURN server configuration

**Issue**: Video quality is poor
**Solution**: Adjust bitrate settings based on network conditions

**Issue**: Messages not received
**Solution**: Verify WebSocket connection and message type matching

---

## Additional Resources

- [A2UI Video Protocol PRD](../planning/video-protocol-prd.md)
- [Video Components API](../api/VIDEO_COMPONENTS.md)
- [Video Use Cases](../features/VIDEO_USE_CASES.md)
- [Core API Documentation](../API.md)
- [WebRTC Documentation](https://webrtc.org/getting-started/overview)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
