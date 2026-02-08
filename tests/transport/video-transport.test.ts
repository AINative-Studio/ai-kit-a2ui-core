/**
 * WebSocket Video Transport Tests
 * BDD-style tests for video message handling
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { A2UITransport } from '../../src/transport/transport.js'
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
} from '../../src/types/index.js'

// Mock CloseEvent for Node.js environment
class MockCloseEvent extends Event {
  constructor(type: string) {
    super(type)
  }
}
global.CloseEvent = MockCloseEvent as any

// Mock WebSocket
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
    // Simulate async connection
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

// Replace global WebSocket with mock
global.WebSocket = MockWebSocket as any

describe('A2UITransport - Video Message Handlers', () => {
  let transport: A2UITransport

  beforeEach(() => {
    transport = new A2UITransport('wss://test.example.com')
  })

  afterEach(() => {
    transport.disconnect()
  })

  describe('Recording Messages', () => {
    describe('Given an agent wants to request a recording', () => {
      it('When sending requestRecording message, Then transport emits the message', async () => {
        await transport.connect()

        const message: RequestRecordingMessage = {
          type: 'requestRecording',
          surfaceId: 'surface-1',
          recordingId: 'rec-1',
          mode: 'screen',
          options: {
            audio: true,
            quality: 'high',
            duration: 300,
          },
        }

        expect(() => transport.send(message)).not.toThrow()
      })
    })

    describe('Given a renderer has started recording', () => {
      it('When receiving recordingStarted message, Then transport emits event to handlers', async () => {
        await transport.connect()

        let receivedMessage: RecordingStartedMessage | null = null
        transport.on<RecordingStartedMessage>('recordingStarted', (msg) => {
          receivedMessage = msg
        })

        const ws = (transport as any).ws as MockWebSocket
        const message: RecordingStartedMessage = {
          type: 'recordingStarted',
          surfaceId: 'surface-1',
          recordingId: 'rec-1',
          timestamp: new Date().toISOString(),
        }

        ws.onmessage?.(new MessageEvent('message', { data: JSON.stringify(message) }))

        await new Promise((resolve) => setTimeout(resolve, 10))

        expect(receivedMessage).not.toBeNull()
        expect(receivedMessage?.type).toBe('recordingStarted')
        expect(receivedMessage?.recordingId).toBe('rec-1')
      })
    })

    describe('Given a recording has finished', () => {
      it('When receiving recordingComplete message, Then handler receives video data', async () => {
        await transport.connect()

        let receivedMessage: RecordingCompleteMessage | null = null
        transport.on<RecordingCompleteMessage>('recordingComplete', (msg) => {
          receivedMessage = msg
        })

        const ws = (transport as any).ws as MockWebSocket
        const message: RecordingCompleteMessage = {
          type: 'recordingComplete',
          surfaceId: 'surface-1',
          recordingId: 'rec-1',
          videoUrl: 'https://cdn.example.com/rec-1.mp4',
          duration: 120,
          transcript: 'This is a test recording',
          highlights: [
            { timestamp: 30, confidence: 0.9 },
            { timestamp: 60, confidence: 0.85 },
          ],
        }

        ws.onmessage?.(new MessageEvent('message', { data: JSON.stringify(message) }))

        await new Promise((resolve) => setTimeout(resolve, 10))

        expect(receivedMessage).not.toBeNull()
        expect(receivedMessage?.videoUrl).toBe('https://cdn.example.com/rec-1.mp4')
        expect(receivedMessage?.transcript).toBe('This is a test recording')
        expect(receivedMessage?.highlights).toHaveLength(2)
      })
    })
  })

  describe('Video Call Messages', () => {
    describe('Given an agent wants to initiate a video call', () => {
      it('When sending initiateVideoCall message, Then transport sends it successfully', async () => {
        await transport.connect()

        const message: InitiateVideoCallMessage = {
          type: 'initiateVideoCall',
          surfaceId: 'surface-1',
          callId: 'call-1',
          roomId: 'room-abc',
          participants: [
            { id: 'user-1', name: 'Alice' },
            { id: 'user-2', name: 'Bob' },
          ],
        }

        expect(() => transport.send(message)).not.toThrow()
      })
    })

    describe('Given a participant has joined the call', () => {
      it('When receiving videoCallJoined message, Then transport emits event', async () => {
        await transport.connect()

        let receivedMessage: VideoCallJoinedMessage | null = null
        transport.on<VideoCallJoinedMessage>('videoCallJoined', (msg) => {
          receivedMessage = msg
        })

        const ws = (transport as any).ws as MockWebSocket
        const message: VideoCallJoinedMessage = {
          type: 'videoCallJoined',
          surfaceId: 'surface-1',
          callId: 'call-1',
          participantId: 'user-1',
          timestamp: new Date().toISOString(),
        }

        ws.onmessage?.(new MessageEvent('message', { data: JSON.stringify(message) }))

        await new Promise((resolve) => setTimeout(resolve, 10))

        expect(receivedMessage).not.toBeNull()
        expect(receivedMessage?.type).toBe('videoCallJoined')
        expect(receivedMessage?.participantId).toBe('user-1')
      })
    })

    describe('Given a video call has ended', () => {
      it('When receiving videoCallEnded message, Then handler receives call summary', async () => {
        await transport.connect()

        let receivedMessage: VideoCallEndedMessage | null = null
        transport.on<VideoCallEndedMessage>('videoCallEnded', (msg) => {
          receivedMessage = msg
        })

        const ws = (transport as any).ws as MockWebSocket
        const message: VideoCallEndedMessage = {
          type: 'videoCallEnded',
          surfaceId: 'surface-1',
          callId: 'call-1',
          duration: 1800,
          transcript: 'Full call transcript...',
          summary: 'Meeting summary: discussed project timeline',
          actionItems: ['Review designs by Friday', 'Schedule follow-up meeting'],
        }

        ws.onmessage?.(new MessageEvent('message', { data: JSON.stringify(message) }))

        await new Promise((resolve) => setTimeout(resolve, 10))

        expect(receivedMessage).not.toBeNull()
        expect(receivedMessage?.duration).toBe(1800)
        expect(receivedMessage?.actionItems).toHaveLength(2)
      })
    })
  })

  describe('Video Generation Messages', () => {
    describe('Given an agent wants to generate a video', () => {
      it('When sending generateVideo message, Then transport sends it successfully', async () => {
        await transport.connect()

        const message: GenerateVideoMessage = {
          type: 'generateVideo',
          surfaceId: 'surface-1',
          videoId: 'vid-1',
          prompt: 'Create a promotional video for our product',
          data: { productName: 'AI Kit', features: ['Fast', 'Reliable', 'Secure'] },
          template: 'promo-template-1',
        }

        expect(() => transport.send(message)).not.toThrow()
      })
    })

    describe('Given video generation is in progress', () => {
      it('When receiving videoGenerationProgress messages, Then handler receives updates', async () => {
        await transport.connect()

        const progressUpdates: number[] = []
        transport.on<VideoGenerationProgressMessage>('videoGenerationProgress', (msg) => {
          progressUpdates.push(msg.progress)
        })

        const ws = (transport as any).ws as MockWebSocket

        // Simulate multiple progress updates
        const updates = [25, 50, 75, 100]
        for (const progress of updates) {
          const message: VideoGenerationProgressMessage = {
            type: 'videoGenerationProgress',
            surfaceId: 'surface-1',
            videoId: 'vid-1',
            progress,
            frame: progress === 50 ? 'base64encodedframe...' : undefined,
          }

          ws.onmessage?.(new MessageEvent('message', { data: JSON.stringify(message) }))
        }

        await new Promise((resolve) => setTimeout(resolve, 10))

        expect(progressUpdates).toEqual([25, 50, 75, 100])
      })
    })

    describe('Given video generation has completed', () => {
      it('When receiving videoGenerationComplete message, Then handler receives video URL', async () => {
        await transport.connect()

        let receivedMessage: VideoGenerationCompleteMessage | null = null
        transport.on<VideoGenerationCompleteMessage>('videoGenerationComplete', (msg) => {
          receivedMessage = msg
        })

        const ws = (transport as any).ws as MockWebSocket
        const message: VideoGenerationCompleteMessage = {
          type: 'videoGenerationComplete',
          surfaceId: 'surface-1',
          videoId: 'vid-1',
          videoUrl: 'https://cdn.example.com/generated-vid-1.mp4',
          composition: { fps: 30, width: 1920, height: 1080 },
        }

        ws.onmessage?.(new MessageEvent('message', { data: JSON.stringify(message) }))

        await new Promise((resolve) => setTimeout(resolve, 10))

        expect(receivedMessage).not.toBeNull()
        expect(receivedMessage?.videoUrl).toBe('https://cdn.example.com/generated-vid-1.mp4')
        expect(receivedMessage?.composition).toBeDefined()
      })
    })
  })

  describe('Error Handling', () => {
    describe('Given an invalid video message is received', () => {
      it('When message has invalid JSON, Then transport emits error', async () => {
        await transport.connect()

        let errorEmitted = false
        transport.on('error', () => {
          errorEmitted = true
        })

        const ws = (transport as any).ws as MockWebSocket
        ws.onmessage?.(new MessageEvent('message', { data: 'invalid json {' }))

        await new Promise((resolve) => setTimeout(resolve, 10))

        expect(errorEmitted).toBe(true)
      })
    })

    describe('Given a video message is sent when disconnected', () => {
      it('When transport is not connected, Then send throws error', () => {
        const message: RequestRecordingMessage = {
          type: 'requestRecording',
          surfaceId: 'surface-1',
          recordingId: 'rec-1',
          mode: 'screen',
        }

        expect(() => transport.send(message)).toThrow('Cannot send message: not connected')
      })
    })
  })

  describe('Generic Message Handler', () => {
    describe('Given any video message is received', () => {
      it('When message arrives, Then both specific and generic handlers are called', async () => {
        await transport.connect()

        let specificCalled = false
        let genericCalled = false

        transport.on<RecordingStartedMessage>('recordingStarted', () => {
          specificCalled = true
        })

        transport.on('message', (msg) => {
          if (msg.type === 'recordingStarted') {
            genericCalled = true
          }
        })

        const ws = (transport as any).ws as MockWebSocket
        const message: RecordingStartedMessage = {
          type: 'recordingStarted',
          surfaceId: 'surface-1',
          recordingId: 'rec-1',
          timestamp: new Date().toISOString(),
        }

        ws.onmessage?.(new MessageEvent('message', { data: JSON.stringify(message) }))

        await new Promise((resolve) => setTimeout(resolve, 10))

        expect(specificCalled).toBe(true)
        expect(genericCalled).toBe(true)
      })
    })
  })

  describe('Multiple Handlers', () => {
    describe('Given multiple handlers for the same video message type', () => {
      it('When message is received, Then all handlers are invoked', async () => {
        await transport.connect()

        let handler1Called = false
        let handler2Called = false
        let handler3Called = false

        transport.on<RecordingCompleteMessage>('recordingComplete', () => {
          handler1Called = true
        })
        transport.on<RecordingCompleteMessage>('recordingComplete', () => {
          handler2Called = true
        })
        transport.on<RecordingCompleteMessage>('recordingComplete', () => {
          handler3Called = true
        })

        const ws = (transport as any).ws as MockWebSocket
        const message: RecordingCompleteMessage = {
          type: 'recordingComplete',
          surfaceId: 'surface-1',
          recordingId: 'rec-1',
          videoUrl: 'https://cdn.example.com/rec-1.mp4',
          duration: 120,
        }

        ws.onmessage?.(new MessageEvent('message', { data: JSON.stringify(message) }))

        await new Promise((resolve) => setTimeout(resolve, 10))

        expect(handler1Called).toBe(true)
        expect(handler2Called).toBe(true)
        expect(handler3Called).toBe(true)
      })
    })
  })

  describe('Handler Unregistration', () => {
    describe('Given a handler is registered and then unregistered', () => {
      it('When message is received, Then unregistered handler is not called', async () => {
        await transport.connect()

        let handlerCalled = false
        const handler = () => {
          handlerCalled = true
        }

        transport.on<VideoCallJoinedMessage>('videoCallJoined', handler)
        transport.off<VideoCallJoinedMessage>('videoCallJoined', handler)

        const ws = (transport as any).ws as MockWebSocket
        const message: VideoCallJoinedMessage = {
          type: 'videoCallJoined',
          surfaceId: 'surface-1',
          callId: 'call-1',
          participantId: 'user-1',
          timestamp: new Date().toISOString(),
        }

        ws.onmessage?.(new MessageEvent('message', { data: JSON.stringify(message) }))

        await new Promise((resolve) => setTimeout(resolve, 10))

        expect(handlerCalled).toBe(false)
      })
    })
  })
})
