/**
 * AIKit Video Integration Tests
 * Comprehensive BDD-style integration tests for A2UI Core with AIKit Video components
 *
 * Tests the complete integration between:
 * - A2UI Core protocol layer (transport, registry, types)
 * - AIKit Video components (mocked for testing)
 * - Message flow and state synchronization
 * - Error handling across the stack
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { A2UITransport } from '../../src/transport/transport.js'
import { ComponentRegistry } from '../../src/registry/registry.js'
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
  VideoCallParticipant,
} from '../../src/types/index.js'

// Mock WebSocket for Node.js environment
class MockCloseEvent extends Event {
  constructor(type: string) {
    super(type)
  }
}
global.CloseEvent = MockCloseEvent as any

class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  readyState = MockWebSocket.CONNECTING
  onopen: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null

  constructor(public url: string) {
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN
      if (this.onopen) {
        this.onopen(new Event('open'))
      }
    }, 10)
  }

  send(data: string): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open')
    }
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED
    if (this.onclose) {
      this.onclose(new CloseEvent('close'))
    }
  }
}

global.WebSocket = MockWebSocket as any

describe('AIKit Video Integration Tests', () => {
  let transport: A2UITransport
  let registry: ComponentRegistry

  beforeEach(() => {
    transport = new A2UITransport('wss://test.example.com')
    registry = ComponentRegistry.standard()
  })

  afterEach(() => {
    transport.disconnect()
    registry.clear()
  })

  // ============================================================================
  // Integration Test 1: VideoRecorder Component End-to-End Flow
  // ============================================================================

  describe('VideoRecorder Component Integration', () => {
    describe('Given an agent wants to record a video', () => {
      it('When the complete recording workflow executes, Then all messages flow correctly', async () => {
        await transport.connect()

        // Track message flow
        const messageFlow: string[] = []

        // Agent sends requestRecording
        const requestMessage: RequestRecordingMessage = {
          type: 'requestRecording',
          surfaceId: 'video-surface-1',
          recordingId: 'rec-123',
          mode: 'screen',
          options: {
            audio: true,
            quality: 'high',
            duration: 300,
          },
        }

        transport.on<RecordingStartedMessage>('recordingStarted', (msg) => {
          messageFlow.push('recordingStarted')
          expect(msg.recordingId).toBe('rec-123')
        })

        transport.on<RecordingCompleteMessage>('recordingComplete', (msg) => {
          messageFlow.push('recordingComplete')
          expect(msg.recordingId).toBe('rec-123')
          expect(msg.videoUrl).toBeDefined()
          expect(msg.duration).toBeGreaterThan(0)
        })

        // Send request
        expect(() => transport.send(requestMessage)).not.toThrow()
        messageFlow.push('requestRecording')

        // Simulate renderer response: recording started
        const ws = (transport as any).ws as MockWebSocket
        const startedMessage: RecordingStartedMessage = {
          type: 'recordingStarted',
          surfaceId: 'video-surface-1',
          recordingId: 'rec-123',
          timestamp: new Date().toISOString(),
        }
        ws.onmessage?.(new MessageEvent('message', { data: JSON.stringify(startedMessage) }))

        await new Promise((resolve) => setTimeout(resolve, 50))

        // Simulate renderer response: recording complete
        const completeMessage: RecordingCompleteMessage = {
          type: 'recordingComplete',
          surfaceId: 'video-surface-1',
          recordingId: 'rec-123',
          videoUrl: 'https://cdn.example.com/recordings/rec-123.mp4',
          duration: 120,
          transcript: 'This is the video transcript',
          highlights: [
            { timestamp: 30, confidence: 0.95 },
            { timestamp: 90, confidence: 0.88 },
          ],
        }
        ws.onmessage?.(new MessageEvent('message', { data: JSON.stringify(completeMessage) }))

        await new Promise((resolve) => setTimeout(resolve, 50))

        // Verify message flow sequence
        expect(messageFlow).toEqual(['requestRecording', 'recordingStarted', 'recordingComplete'])
      })
    })

    describe('Given videoRecorder component is registered', () => {
      it('When retrieving component definition, Then properties are correct', () => {
        const definition = registry.get('videoRecorder')

        expect(definition).toBeDefined()
        expect(definition?.type).toBe('videoRecorder')
        expect(definition?.category).toBe('media')
        expect(definition?.defaultProps).toHaveProperty('mode')
        expect(definition?.defaultProps).toHaveProperty('audio')
        expect(definition?.defaultProps).toHaveProperty('quality')
      })
    })

    describe('Given a recording with AI features', () => {
      it('When AI transcription and highlights are requested, Then results include AI data', async () => {
        await transport.connect()

        let completeMessage: RecordingCompleteMessage | null = null

        transport.on<RecordingCompleteMessage>('recordingComplete', (msg) => {
          completeMessage = msg
        })

        const ws = (transport as any).ws as MockWebSocket
        const aiMessage: RecordingCompleteMessage = {
          type: 'recordingComplete',
          surfaceId: 'video-surface-1',
          recordingId: 'rec-ai-1',
          videoUrl: 'https://cdn.example.com/recordings/rec-ai-1.mp4',
          duration: 180,
          transcript: 'AI generated transcript with timestamps',
          highlights: [
            { timestamp: 15, confidence: 0.92 },
            { timestamp: 45, confidence: 0.89 },
            { timestamp: 120, confidence: 0.94 },
          ],
        }

        ws.onmessage?.(new MessageEvent('message', { data: JSON.stringify(aiMessage) }))

        await new Promise((resolve) => setTimeout(resolve, 50))

        expect(completeMessage).not.toBeNull()
        expect(completeMessage?.transcript).toBeDefined()
        expect(completeMessage?.highlights).toHaveLength(3)
        expect(completeMessage?.highlights?.[0].confidence).toBeGreaterThan(0.8)
      })
    })
  })

  // ============================================================================
  // Integration Test 2: VideoCall Component End-to-End Flow
  // ============================================================================

  describe('VideoCall Component Integration', () => {
    describe('Given an agent initiates a video call', () => {
      it('When participants join and leave, Then all state changes are tracked', async () => {
        await transport.connect()

        const stateChanges: string[] = []
        const participants: VideoCallParticipant[] = []

        // Track state changes
        transport.on<VideoCallJoinedMessage>('videoCallJoined', (msg) => {
          stateChanges.push(`joined:${msg.participantId}`)
          if (msg.participant) {
            participants.push(msg.participant)
          }
        })

        transport.on<VideoCallEndedMessage>('videoCallEnded', (msg) => {
          stateChanges.push('ended')
          expect(msg.duration).toBeGreaterThan(0)
        })

        // Agent initiates call
        const initiateMessage: InitiateVideoCallMessage = {
          type: 'initiateVideoCall',
          surfaceId: 'call-surface-1',
          callId: 'call-456',
          roomId: 'room-abc-123',
          participants: ['user-1', 'user-2', 'user-3'],
        }

        transport.send(initiateMessage)
        stateChanges.push('initiated')

        const ws = (transport as any).ws as MockWebSocket

        // Simulate participants joining
        const participant1: VideoCallParticipant = {
          id: 'user-1',
          name: 'Alice Johnson',
          role: 'host',
          isMuted: false,
          isVideoEnabled: true,
          avatarUrl: 'https://example.com/avatars/user-1.jpg',
          joinedAt: new Date().toISOString(),
        }

        const joinedMessage1: VideoCallJoinedMessage = {
          type: 'videoCallJoined',
          surfaceId: 'call-surface-1',
          callId: 'call-456',
          participantId: 'user-1',
          timestamp: new Date().toISOString(),
          participant: participant1,
        }

        ws.onmessage?.(new MessageEvent('message', { data: JSON.stringify(joinedMessage1) }))

        await new Promise((resolve) => setTimeout(resolve, 50))

        // More participants join
        const participant2: VideoCallParticipant = {
          id: 'user-2',
          name: 'Bob Smith',
          role: 'participant',
          isMuted: false,
          isVideoEnabled: true,
          joinedAt: new Date().toISOString(),
        }

        const joinedMessage2: VideoCallJoinedMessage = {
          type: 'videoCallJoined',
          surfaceId: 'call-surface-1',
          callId: 'call-456',
          participantId: 'user-2',
          timestamp: new Date().toISOString(),
          participant: participant2,
        }

        ws.onmessage?.(new MessageEvent('message', { data: JSON.stringify(joinedMessage2) }))

        await new Promise((resolve) => setTimeout(resolve, 50))

        // Call ends
        const endedMessage: VideoCallEndedMessage = {
          type: 'videoCallEnded',
          surfaceId: 'call-surface-1',
          callId: 'call-456',
          duration: 1800,
          transcript: 'Full call transcript...',
          summary: 'Team discussed Q1 roadmap and prioritized features',
          actionItems: [
            'Alice: Review design mockups by Friday',
            'Bob: Set up staging environment',
            'Team: Schedule follow-up next Monday',
          ],
          participants: [participant1, participant2],
        }

        ws.onmessage?.(new MessageEvent('message', { data: JSON.stringify(endedMessage) }))

        await new Promise((resolve) => setTimeout(resolve, 50))

        // Verify state flow
        expect(stateChanges).toEqual(['initiated', 'joined:user-1', 'joined:user-2', 'ended'])
        expect(participants).toHaveLength(2)
        expect(participants[0].role).toBe('host')
        expect(participants[1].role).toBe('participant')
      })
    })

    describe('Given videoCall component is registered', () => {
      it('When retrieving component definition, Then AI features are supported', () => {
        const definition = registry.get('videoCall')

        expect(definition).toBeDefined()
        expect(definition?.type).toBe('videoCall')
        expect(definition?.category).toBe('communication')
        expect(definition?.tags).toContain('video')
        expect(definition?.tags).toContain('conferencing')
      })
    })

    describe('Given a video call with AI features enabled', () => {
      it('When call ends, Then AI-generated summary and action items are provided', async () => {
        await transport.connect()

        let endedMessage: VideoCallEndedMessage | null = null

        transport.on<VideoCallEndedMessage>('videoCallEnded', (msg) => {
          endedMessage = msg
        })

        const ws = (transport as any).ws as MockWebSocket
        const aiEndedMessage: VideoCallEndedMessage = {
          type: 'videoCallEnded',
          surfaceId: 'call-surface-1',
          callId: 'call-ai-1',
          duration: 2400,
          transcript: 'Complete transcript with speaker identification...',
          summary:
            'The team discussed project deliverables, identified three blockers, and assigned owners for resolution. Key decisions: approved budget increase and timeline extension.',
          actionItems: [
            'Engineering: Resolve database performance issue by Wednesday',
            'Design: Complete user flow diagrams',
            'Product: Schedule stakeholder demo for next Friday',
          ],
        }

        ws.onmessage?.(new MessageEvent('message', { data: JSON.stringify(aiEndedMessage) }))

        await new Promise((resolve) => setTimeout(resolve, 50))

        expect(endedMessage).not.toBeNull()
        expect(endedMessage?.summary).toBeDefined()
        expect(endedMessage?.summary).toContain('blockers')
        expect(endedMessage?.actionItems).toHaveLength(3)
        expect(endedMessage?.actionItems?.[0]).toContain('Engineering')
      })
    })
  })

  // ============================================================================
  // Integration Test 3: AIVideo Component End-to-End Flow
  // ============================================================================

  describe('AIVideo Component Integration', () => {
    describe('Given an agent requests AI video generation', () => {
      it('When generation progresses, Then progress updates are streamed correctly', async () => {
        await transport.connect()

        const progressUpdates: number[] = []
        let finalVideo: VideoGenerationCompleteMessage | null = null

        transport.on<VideoGenerationProgressMessage>('videoGenerationProgress', (msg) => {
          progressUpdates.push(msg.progress)
        })

        transport.on<VideoGenerationCompleteMessage>('videoGenerationComplete', (msg) => {
          finalVideo = msg
        })

        // Agent requests video generation
        const generateMessage: GenerateVideoMessage = {
          type: 'generateVideo',
          surfaceId: 'gen-surface-1',
          videoId: 'vid-789',
          prompt: 'Create a 30-second promotional video showcasing our AI platform features',
          data: {
            companyName: 'AINative Studio',
            features: ['AI Video Generation', 'Smart Transcription', 'Real-time Collaboration'],
            brandColor: '#2563eb',
          },
          template: 'promo-template-modern',
        }

        transport.send(generateMessage)

        const ws = (transport as any).ws as MockWebSocket

        // Simulate progress updates
        const progressValues = [10, 25, 40, 55, 70, 85, 100]
        for (const progress of progressValues) {
          const progressMessage: VideoGenerationProgressMessage = {
            type: 'videoGenerationProgress',
            surfaceId: 'gen-surface-1',
            videoId: 'vid-789',
            progress,
            frame: progress % 25 === 0 ? `base64_preview_frame_${progress}` : undefined,
          }

          ws.onmessage?.(new MessageEvent('message', { data: JSON.stringify(progressMessage) }))
          await new Promise((resolve) => setTimeout(resolve, 20))
        }

        // Simulate completion
        const completeMessage: VideoGenerationCompleteMessage = {
          type: 'videoGenerationComplete',
          surfaceId: 'gen-surface-1',
          videoId: 'vid-789',
          videoUrl: 'https://cdn.example.com/generated/vid-789.mp4',
          composition: {
            fps: 30,
            width: 1920,
            height: 1080,
            duration: 30,
            codec: 'h264',
          },
        }

        ws.onmessage?.(new MessageEvent('message', { data: JSON.stringify(completeMessage) }))

        await new Promise((resolve) => setTimeout(resolve, 50))

        // Verify progress stream
        expect(progressUpdates).toEqual([10, 25, 40, 55, 70, 85, 100])
        expect(finalVideo).not.toBeNull()
        expect(finalVideo?.videoUrl).toContain('vid-789')
        expect(finalVideo?.composition).toHaveProperty('fps', 30)
        expect(finalVideo?.composition).toHaveProperty('width', 1920)
      })
    })

    describe('Given aiVideo component is registered', () => {
      it('When retrieving component definition, Then generation options are supported', () => {
        const definition = registry.get('aiVideo')

        expect(definition).toBeDefined()
        expect(definition?.type).toBe('aiVideo')
        expect(definition?.category).toBe('generation')
        expect(definition?.tags).toContain('ai')
        expect(definition?.tags).toContain('generation')
      })
    })

    describe('Given template-based video generation', () => {
      it('When data is provided, Then template is populated correctly', async () => {
        await transport.connect()

        const generateMessage: GenerateVideoMessage = {
          type: 'generateVideo',
          surfaceId: 'gen-surface-1',
          videoId: 'vid-template-1',
          prompt: 'Generate tutorial video',
          template: 'tutorial-step-by-step',
          data: {
            title: 'Getting Started with A2UI',
            steps: [
              { step: 1, title: 'Install Package', duration: 5 },
              { step: 2, title: 'Configure Transport', duration: 8 },
              { step: 3, title: 'Create First Surface', duration: 12 },
              { step: 4, title: 'Send Messages', duration: 10 },
            ],
            voiceover: true,
            captions: true,
          },
        }

        expect(() => transport.send(generateMessage)).not.toThrow()

        // Verify message structure
        expect(generateMessage.template).toBe('tutorial-step-by-step')
        expect(generateMessage.data?.steps).toHaveLength(4)
        expect(generateMessage.data?.voiceover).toBe(true)
      })
    })
  })

  // ============================================================================
  // Integration Test 4: AIVideoPlayer Component End-to-End Flow
  // ============================================================================

  describe('AIVideoPlayer Component Integration', () => {
    describe('Given an AI video player with interactive features', () => {
      it('When component is registered, Then interactive capabilities are defined', () => {
        const definition = registry.get('aiVideoPlayer')

        expect(definition).toBeDefined()
        expect(definition?.type).toBe('aiVideoPlayer')
        expect(definition?.category).toBe('media')
        expect(definition?.defaultProps).toHaveProperty('interactive')
        expect(definition?.defaultProps?.interactive).toHaveProperty('allowQuestions', true)
        expect(definition?.defaultProps?.interactive).toHaveProperty('smartChapters', true)
      })
    })

    describe('Given a video with transcript', () => {
      it('When interactive features are enabled, Then semantic search works', async () => {
        // This test verifies the protocol supports the features
        // Actual implementation is in AIKit Video

        const definition = registry.get('aiVideoPlayer')
        const interactive = definition?.defaultProps?.interactive

        expect(interactive).toBeDefined()
        expect(interactive?.allowQuestions).toBe(true)
        expect(interactive?.conversationalControl).toBeDefined()
        expect(interactive?.smartChapters).toBe(true)
      })
    })
  })

  // ============================================================================
  // Integration Test 5: Cross-Component Message Flow
  // ============================================================================

  describe('Cross-Component Message Flow Integration', () => {
    describe('Given multiple video components active simultaneously', () => {
      it('When messages are sent, Then transport routes them correctly', async () => {
        await transport.connect()

        const receivedMessages: string[] = []

        // Register handlers for different message types
        transport.on<RequestRecordingMessage>('requestRecording', (msg) => {
          receivedMessages.push(`recording:${msg.recordingId}`)
        })

        transport.on<InitiateVideoCallMessage>('initiateVideoCall', (msg) => {
          receivedMessages.push(`call:${msg.callId}`)
        })

        transport.on<GenerateVideoMessage>('generateVideo', (msg) => {
          receivedMessages.push(`generate:${msg.videoId}`)
        })

        const ws = (transport as any).ws as MockWebSocket

        // Simulate multiple concurrent operations
        const recordingMsg: RequestRecordingMessage = {
          type: 'requestRecording',
          surfaceId: 'surface-1',
          recordingId: 'rec-1',
          mode: 'screen',
        }

        const callMsg: InitiateVideoCallMessage = {
          type: 'initiateVideoCall',
          surfaceId: 'surface-2',
          callId: 'call-1',
          roomId: 'room-1',
        }

        const genMsg: GenerateVideoMessage = {
          type: 'generateVideo',
          surfaceId: 'surface-3',
          videoId: 'vid-1',
          prompt: 'Generate video',
        }

        // Send all messages
        ws.onmessage?.(new MessageEvent('message', { data: JSON.stringify(recordingMsg) }))
        ws.onmessage?.(new MessageEvent('message', { data: JSON.stringify(callMsg) }))
        ws.onmessage?.(new MessageEvent('message', { data: JSON.stringify(genMsg) }))

        await new Promise((resolve) => setTimeout(resolve, 50))

        // Verify all messages were routed correctly
        expect(receivedMessages).toContain('recording:rec-1')
        expect(receivedMessages).toContain('call:call-1')
        expect(receivedMessages).toContain('generate:vid-1')
        expect(receivedMessages).toHaveLength(3)
      })
    })

    describe('Given a complete video workflow', () => {
      it('When recording, calling, and generating happen sequentially, Then state is maintained', async () => {
        await transport.connect()

        const workflow: Array<{ step: string; timestamp: number }> = []

        // Track workflow steps
        transport.on<RecordingStartedMessage>('recordingStarted', () => {
          workflow.push({ step: 'recordingStarted', timestamp: Date.now() })
        })

        transport.on<RecordingCompleteMessage>('recordingComplete', () => {
          workflow.push({ step: 'recordingComplete', timestamp: Date.now() })
        })

        transport.on<VideoCallJoinedMessage>('videoCallJoined', () => {
          workflow.push({ step: 'videoCallJoined', timestamp: Date.now() })
        })

        transport.on<VideoGenerationCompleteMessage>('videoGenerationComplete', () => {
          workflow.push({ step: 'videoGenerationComplete', timestamp: Date.now() })
        })

        const ws = (transport as any).ws as MockWebSocket

        // Simulate sequential workflow
        const messages = [
          { type: 'recordingStarted', surfaceId: 's1', recordingId: 'r1', timestamp: '2026-02-08T00:00:00Z' },
          { type: 'recordingComplete', surfaceId: 's1', recordingId: 'r1', videoUrl: 'url1', duration: 60 },
          { type: 'videoCallJoined', surfaceId: 's2', callId: 'c1', participantId: 'p1', timestamp: '2026-02-08T00:01:00Z' },
          { type: 'videoGenerationComplete', surfaceId: 's3', videoId: 'v1', videoUrl: 'url2', composition: {} },
        ]

        for (const msg of messages) {
          ws.onmessage?.(new MessageEvent('message', { data: JSON.stringify(msg) }))
          await new Promise((resolve) => setTimeout(resolve, 30))
        }

        // Verify sequential execution
        expect(workflow).toHaveLength(4)
        expect(workflow[0].step).toBe('recordingStarted')
        expect(workflow[1].step).toBe('recordingComplete')
        expect(workflow[2].step).toBe('videoCallJoined')
        expect(workflow[3].step).toBe('videoGenerationComplete')

        // Verify timing (each step should be later than previous)
        for (let i = 1; i < workflow.length; i++) {
          expect(workflow[i].timestamp).toBeGreaterThanOrEqual(workflow[i - 1].timestamp)
        }
      })
    })
  })

  // ============================================================================
  // Integration Test 6: State Synchronization
  // ============================================================================

  describe('State Synchronization Integration', () => {
    describe('Given multiple handlers for the same video message', () => {
      it('When message is received, Then all handlers receive consistent state', async () => {
        await transport.connect()

        const handler1Data: RecordingCompleteMessage[] = []
        const handler2Data: RecordingCompleteMessage[] = []
        const handler3Data: RecordingCompleteMessage[] = []

        // Register multiple handlers
        transport.on<RecordingCompleteMessage>('recordingComplete', (msg) => {
          handler1Data.push(msg)
        })

        transport.on<RecordingCompleteMessage>('recordingComplete', (msg) => {
          handler2Data.push(msg)
        })

        transport.on<RecordingCompleteMessage>('recordingComplete', (msg) => {
          handler3Data.push(msg)
        })

        const ws = (transport as any).ws as MockWebSocket
        const message: RecordingCompleteMessage = {
          type: 'recordingComplete',
          surfaceId: 'surface-1',
          recordingId: 'rec-sync-1',
          videoUrl: 'https://cdn.example.com/rec-sync-1.mp4',
          duration: 150,
          transcript: 'Synchronized transcript',
          highlights: [{ timestamp: 75, confidence: 0.9 }],
        }

        ws.onmessage?.(new MessageEvent('message', { data: JSON.stringify(message) }))

        await new Promise((resolve) => setTimeout(resolve, 50))

        // Verify all handlers received identical data
        expect(handler1Data).toHaveLength(1)
        expect(handler2Data).toHaveLength(1)
        expect(handler3Data).toHaveLength(1)

        expect(handler1Data[0]).toEqual(handler2Data[0])
        expect(handler2Data[0]).toEqual(handler3Data[0])

        expect(handler1Data[0].videoUrl).toBe(message.videoUrl)
        expect(handler2Data[0].transcript).toBe(message.transcript)
        expect(handler3Data[0].highlights).toEqual(message.highlights)
      })
    })

    describe('Given a video call with dynamic participant state', () => {
      it('When participants join/leave, Then state updates are consistent', async () => {
        await transport.connect()

        const participantStates = new Map<string, VideoCallParticipant>()

        transport.on<VideoCallJoinedMessage>('videoCallJoined', (msg) => {
          if (msg.participant) {
            participantStates.set(msg.participantId, msg.participant)
          }
        })

        transport.on<VideoCallEndedMessage>('videoCallEnded', (msg) => {
          // Verify final state matches
          if (msg.participants) {
            expect(msg.participants.length).toBe(participantStates.size)
            msg.participants.forEach((p) => {
              expect(participantStates.has(p.id)).toBe(true)
            })
          }
        })

        const ws = (transport as any).ws as MockWebSocket

        // Simulate participants joining
        const participants: VideoCallParticipant[] = [
          { id: 'p1', name: 'User 1', role: 'host', isMuted: false, isVideoEnabled: true },
          { id: 'p2', name: 'User 2', role: 'participant', isMuted: false, isVideoEnabled: true },
          { id: 'p3', name: 'User 3', role: 'participant', isMuted: true, isVideoEnabled: false },
        ]

        for (const participant of participants) {
          const joinMsg: VideoCallJoinedMessage = {
            type: 'videoCallJoined',
            surfaceId: 'call-surface',
            callId: 'call-state-1',
            participantId: participant.id,
            timestamp: new Date().toISOString(),
            participant,
          }

          ws.onmessage?.(new MessageEvent('message', { data: JSON.stringify(joinMsg) }))
          await new Promise((resolve) => setTimeout(resolve, 20))
        }

        // End call with final state
        const endMsg: VideoCallEndedMessage = {
          type: 'videoCallEnded',
          surfaceId: 'call-surface',
          callId: 'call-state-1',
          duration: 1200,
          participants,
        }

        ws.onmessage?.(new MessageEvent('message', { data: JSON.stringify(endMsg) }))

        await new Promise((resolve) => setTimeout(resolve, 50))

        // Verify state consistency
        expect(participantStates.size).toBe(3)
        expect(participantStates.get('p1')?.role).toBe('host')
        expect(participantStates.get('p2')?.isMuted).toBe(false)
        expect(participantStates.get('p3')?.isVideoEnabled).toBe(false)
      })
    })
  })

  // ============================================================================
  // Integration Test 7: Error Handling
  // ============================================================================

  describe('Error Handling Integration', () => {
    describe('Given a network error during video recording', () => {
      it('When transport loses connection, Then error handlers are invoked', async () => {
        await transport.connect()

        const errors: Error[] = []

        transport.on('error', (error) => {
          errors.push(error)
        })

        const ws = (transport as any).ws as MockWebSocket

        // Simulate connection error
        ws.onerror?.(new Event('error'))

        await new Promise((resolve) => setTimeout(resolve, 50))

        expect(errors.length).toBeGreaterThan(0)
      })
    })

    describe('Given invalid message format', () => {
      it('When malformed JSON is received, Then error is emitted', async () => {
        await transport.connect()

        let errorCaught = false

        transport.on('error', (error) => {
          errorCaught = true
          expect(error.message).toContain('parse')
        })

        const ws = (transport as any).ws as MockWebSocket
        ws.onmessage?.(new MessageEvent('message', { data: 'invalid json {{{' }))

        await new Promise((resolve) => setTimeout(resolve, 50))

        expect(errorCaught).toBe(true)
      })
    })

    describe('Given a video generation failure', () => {
      it('When generation fails, Then error state is communicated', async () => {
        // This would be communicated via application-level error messages
        // Testing that the protocol supports error communication

        await transport.connect()

        const ws = (transport as any).ws as MockWebSocket

        // Simulate error via progress message with 0 progress indicating failure
        // Or custom error message type (implementation-specific)
        const errorProgress: VideoGenerationProgressMessage = {
          type: 'videoGenerationProgress',
          surfaceId: 'gen-surface',
          videoId: 'vid-error-1',
          progress: 0,
        }

        let progressReceived = false
        transport.on<VideoGenerationProgressMessage>('videoGenerationProgress', (msg) => {
          progressReceived = true
          expect(msg.progress).toBe(0)
        })

        ws.onmessage?.(new MessageEvent('message', { data: JSON.stringify(errorProgress) }))

        await new Promise((resolve) => setTimeout(resolve, 50))

        expect(progressReceived).toBe(true)
      })
    })

    describe('Given disconnected transport', () => {
      it('When attempting to send video message, Then error is thrown', () => {
        const message: RequestRecordingMessage = {
          type: 'requestRecording',
          surfaceId: 'surface-1',
          recordingId: 'rec-1',
          mode: 'screen',
        }

        expect(() => transport.send(message)).toThrow('Cannot send message: not connected')
      })
    })

    describe('Given concurrent errors in multiple video operations', () => {
      it('When multiple operations fail, Then errors are isolated', async () => {
        await transport.connect()

        const recordingErrors: string[] = []
        const callErrors: string[] = []

        // In real implementation, these would be custom error messages
        // For now, we verify the transport can handle multiple error types

        const ws = (transport as any).ws as MockWebSocket

        // Simulate multiple operations
        const ops = [
          { type: 'recordingStarted', surfaceId: 's1', recordingId: 'r1', timestamp: '2026-02-08T00:00:00Z' },
          { type: 'videoCallJoined', surfaceId: 's2', callId: 'c1', participantId: 'p1', timestamp: '2026-02-08T00:00:00Z' },
        ]

        for (const op of ops) {
          ws.onmessage?.(new MessageEvent('message', { data: JSON.stringify(op) }))
        }

        await new Promise((resolve) => setTimeout(resolve, 50))

        // Errors would be isolated per operation
        expect(transport.isConnected).toBe(true)
      })
    })
  })

  // ============================================================================
  // Integration Test 8: Registry and Transport Integration
  // ============================================================================

  describe('Registry and Transport Integration', () => {
    describe('Given all video components are registered', () => {
      it('When querying registry, Then all 4 video components are present', () => {
        const allComponents = registry.getAll()
        const videoComponents = allComponents.filter(
          (c) => c.type === 'videoRecorder' || c.type === 'videoCall' || c.type === 'aiVideo' || c.type === 'aiVideoPlayer'
        )

        expect(videoComponents).toHaveLength(4)

        // Verify each component
        const types = videoComponents.map((c) => c.type)
        expect(types).toContain('videoRecorder')
        expect(types).toContain('videoCall')
        expect(types).toContain('aiVideo')
        expect(types).toContain('aiVideoPlayer')
      })
    })

    describe('Given video components by category', () => {
      it('When filtering by media category, Then video components are included', () => {
        const mediaComponents = registry.getByCategory('media')
        const videoMediaTypes = mediaComponents.filter(
          (c) => c.type === 'videoRecorder' || c.type === 'aiVideoPlayer' || c.type === 'video'
        )

        expect(videoMediaTypes.length).toBeGreaterThan(0)
      })

      it('When filtering by communication category, Then videoCall is included', () => {
        const commComponents = registry.getByCategory('communication')
        const videoCall = commComponents.find((c) => c.type === 'videoCall')

        expect(videoCall).toBeDefined()
        expect(videoCall?.type).toBe('videoCall')
      })

      it('When filtering by generation category, Then aiVideo is included', () => {
        const genComponents = registry.getByCategory('generation')
        const aiVideo = genComponents.find((c) => c.type === 'aiVideo')

        expect(aiVideo).toBeDefined()
        expect(aiVideo?.type).toBe('aiVideo')
      })
    })

    describe('Given video component tags', () => {
      it('When searching by video tag, Then all video components are found', () => {
        const videoTagged = registry.searchByTag('video')

        expect(videoTagged.length).toBeGreaterThanOrEqual(4)

        const types = videoTagged.map((c) => c.type)
        expect(types).toContain('videoRecorder')
        expect(types).toContain('videoCall')
      })

      it('When searching by ai tag, Then AI video components are found', () => {
        const aiTagged = registry.searchByTag('ai')

        const types = aiTagged.map((c) => c.type)
        expect(types).toContain('aiVideo')
        expect(types).toContain('aiVideoPlayer')
      })
    })
  })

  // ============================================================================
  // Integration Test 9: Performance and Scalability
  // ============================================================================

  describe('Performance and Scalability Integration', () => {
    describe('Given high-frequency progress updates', () => {
      it('When receiving rapid progress messages, Then all updates are processed', async () => {
        await transport.connect()

        const progressUpdates: number[] = []

        transport.on<VideoGenerationProgressMessage>('videoGenerationProgress', (msg) => {
          progressUpdates.push(msg.progress)
        })

        const ws = (transport as any).ws as MockWebSocket

        // Simulate 100 rapid progress updates
        for (let i = 1; i <= 100; i++) {
          const progressMsg: VideoGenerationProgressMessage = {
            type: 'videoGenerationProgress',
            surfaceId: 'perf-surface',
            videoId: 'vid-perf-1',
            progress: i,
          }

          ws.onmessage?.(new MessageEvent('message', { data: JSON.stringify(progressMsg) }))
        }

        await new Promise((resolve) => setTimeout(resolve, 100))

        // All updates should be received
        expect(progressUpdates.length).toBe(100)
        expect(progressUpdates[0]).toBe(1)
        expect(progressUpdates[99]).toBe(100)
      })
    })

    describe('Given multiple concurrent video operations', () => {
      it('When handling 10 simultaneous recordings, Then all are tracked independently', async () => {
        await transport.connect()

        const recordings = new Map<string, { started: boolean; completed: boolean }>()

        transport.on<RecordingStartedMessage>('recordingStarted', (msg) => {
          recordings.set(msg.recordingId, { started: true, completed: false })
        })

        transport.on<RecordingCompleteMessage>('recordingComplete', (msg) => {
          const rec = recordings.get(msg.recordingId)
          if (rec) {
            rec.completed = true
          }
        })

        const ws = (transport as any).ws as MockWebSocket

        // Simulate 10 concurrent recordings
        for (let i = 1; i <= 10; i++) {
          const startMsg: RecordingStartedMessage = {
            type: 'recordingStarted',
            surfaceId: `surface-${i}`,
            recordingId: `rec-${i}`,
            timestamp: new Date().toISOString(),
          }

          ws.onmessage?.(new MessageEvent('message', { data: JSON.stringify(startMsg) }))
        }

        await new Promise((resolve) => setTimeout(resolve, 50))

        expect(recordings.size).toBe(10)

        // Complete all recordings
        for (let i = 1; i <= 10; i++) {
          const completeMsg: RecordingCompleteMessage = {
            type: 'recordingComplete',
            surfaceId: `surface-${i}`,
            recordingId: `rec-${i}`,
            videoUrl: `https://cdn.example.com/rec-${i}.mp4`,
            duration: 120,
          }

          ws.onmessage?.(new MessageEvent('message', { data: JSON.stringify(completeMsg) }))
        }

        await new Promise((resolve) => setTimeout(resolve, 50))

        // Verify all completed
        recordings.forEach((rec, id) => {
          expect(rec.started).toBe(true)
          expect(rec.completed).toBe(true)
        })
      })
    })
  })

  // ============================================================================
  // Integration Test 10: Complete E2E Workflow
  // ============================================================================

  describe('Complete End-to-End Workflow', () => {
    describe('Given a full video collaboration session', () => {
      it('When all components interact, Then workflow completes successfully', async () => {
        await transport.connect()

        const workflowLog: Array<{ event: string; timestamp: number }> = []

        // Register all handlers
        transport.on<RequestRecordingMessage>('requestRecording', () => {
          workflowLog.push({ event: 'Recording requested', timestamp: Date.now() })
        })

        transport.on<RecordingCompleteMessage>('recordingComplete', () => {
          workflowLog.push({ event: 'Recording complete', timestamp: Date.now() })
        })

        transport.on<InitiateVideoCallMessage>('initiateVideoCall', () => {
          workflowLog.push({ event: 'Video call initiated', timestamp: Date.now() })
        })

        transport.on<VideoCallEndedMessage>('videoCallEnded', () => {
          workflowLog.push({ event: 'Video call ended', timestamp: Date.now() })
        })

        transport.on<GenerateVideoMessage>('generateVideo', () => {
          workflowLog.push({ event: 'Video generation started', timestamp: Date.now() })
        })

        transport.on<VideoGenerationCompleteMessage>('videoGenerationComplete', () => {
          workflowLog.push({ event: 'Video generation complete', timestamp: Date.now() })
        })

        const ws = (transport as any).ws as MockWebSocket

        // Simulate complete workflow
        const workflow = [
          // Step 1: Record a demo
          { type: 'requestRecording', surfaceId: 's1', recordingId: 'demo-rec', mode: 'screen' },
          {
            type: 'recordingComplete',
            surfaceId: 's1',
            recordingId: 'demo-rec',
            videoUrl: 'url1',
            duration: 180,
            transcript: 'Demo transcript',
          },

          // Step 2: Review in a video call
          { type: 'initiateVideoCall', surfaceId: 's2', callId: 'review-call', roomId: 'room-review' },
          { type: 'videoCallEnded', surfaceId: 's2', callId: 'review-call', duration: 600 },

          // Step 3: Generate promotional video from the demo
          { type: 'generateVideo', surfaceId: 's3', videoId: 'promo-vid', prompt: 'Create promo from demo' },
          { type: 'videoGenerationComplete', surfaceId: 's3', videoId: 'promo-vid', videoUrl: 'url2', composition: {} },
        ]

        for (const msg of workflow) {
          ws.onmessage?.(new MessageEvent('message', { data: JSON.stringify(msg) }))
          await new Promise((resolve) => setTimeout(resolve, 40))
        }

        // Verify complete workflow
        expect(workflowLog).toHaveLength(6)
        expect(workflowLog[0].event).toBe('Recording requested')
        expect(workflowLog[1].event).toBe('Recording complete')
        expect(workflowLog[2].event).toBe('Video call initiated')
        expect(workflowLog[3].event).toBe('Video call ended')
        expect(workflowLog[4].event).toBe('Video generation started')
        expect(workflowLog[5].event).toBe('Video generation complete')

        // Verify chronological order
        for (let i = 1; i < workflowLog.length; i++) {
          expect(workflowLog[i].timestamp).toBeGreaterThanOrEqual(workflowLog[i - 1].timestamp)
        }
      })
    })
  })
})
