/**
 * AIKit Video Integration Tests - Issue #20
 * Comprehensive integration tests verifying A2UI Core protocol layer works correctly
 * with AIKit Video components.
 *
 * These tests cover:
 * - All 4 video components (videoRecorder, videoCall, aiVideo, aiVideoPlayer)
 * - Message flow testing
 * - State synchronization
 * - Error handling
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
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

describe('AIKit Video Integration Tests - Issue #20', () => {
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

  // Test 1: VideoRecorder Component Integration
  describe('VideoRecorder Component Integration', () => {
    it('should handle complete recording workflow with message flow', async () => {
      await transport.connect()

      const messageFlow: string[] = []

      transport.on<RecordingStartedMessage>('recordingStarted', (msg) => {
        messageFlow.push('started')
        expect(msg.recordingId).toBe('rec-1')
      })

      transport.on<RecordingCompleteMessage>('recordingComplete', (msg) => {
        messageFlow.push('complete')
        expect(msg.videoUrl).toBeDefined()
      })

      const ws = (transport as any).ws as MockWebSocket

      // Simulate recording started
      ws.onmessage?.(
        new MessageEvent('message', {
          data: JSON.stringify({
            type: 'recordingStarted',
            surfaceId: 's1',
            recordingId: 'rec-1',
            timestamp: new Date().toISOString(),
          }),
        })
      )

      await new Promise((resolve) => setTimeout(resolve, 50))

      // Simulate recording complete
      ws.onmessage?.(
        new MessageEvent('message', {
          data: JSON.stringify({
            type: 'recordingComplete',
            surfaceId: 's1',
            recordingId: 'rec-1',
            videoUrl: 'https://example.com/rec-1.mp4',
            duration: 120,
          }),
        })
      )

      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(messageFlow).toEqual(['started', 'complete'])
    })

    it('should verify videoRecorder component is registered', () => {
      const def = registry.get('videoRecorder')
      expect(def).toBeDefined()
      expect(def?.type).toBe('videoRecorder')
      expect(def?.category).toBe('media')
    })
  })

  // Test 2: VideoCall Component Integration
  describe('VideoCall Component Integration', () => {
    it('should handle video call with participants joining and leaving', async () => {
      await transport.connect()

      const participants: string[] = []

      transport.on<VideoCallJoinedMessage>('videoCallJoined', (msg) => {
        participants.push(msg.participantId)
      })

      let callEnded = false
      transport.on<VideoCallEndedMessage>('videoCallEnded', () => {
        callEnded = true
      })

      const ws = (transport as any).ws as MockWebSocket

      // Participant joins
      ws.onmessage?.(
        new MessageEvent('message', {
          data: JSON.stringify({
            type: 'videoCallJoined',
            surfaceId: 's1',
            callId: 'call-1',
            participantId: 'user-1',
            timestamp: new Date().toISOString(),
          }),
        })
      )

      await new Promise((resolve) => setTimeout(resolve, 50))

      // Call ends
      ws.onmessage?.(
        new MessageEvent('message', {
          data: JSON.stringify({
            type: 'videoCallEnded',
            surfaceId: 's1',
            callId: 'call-1',
            duration: 600,
          }),
        })
      )

      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(participants).toContain('user-1')
      expect(callEnded).toBe(true)
    })

    it('should verify videoCall component is registered', () => {
      const def = registry.get('videoCall')
      expect(def).toBeDefined()
      expect(def?.type).toBe('videoCall')
      expect(def?.category).toBe('communication')
    })
  })

  // Test 3: AIVideo Component Integration
  describe('AIVideo Component Integration', () => {
    it('should handle video generation with progress updates', async () => {
      await transport.connect()

      const progressUpdates: number[] = []
      let completed = false

      transport.on<VideoGenerationProgressMessage>('videoGenerationProgress', (msg) => {
        progressUpdates.push(msg.progress)
      })

      transport.on<VideoGenerationCompleteMessage>('videoGenerationComplete', () => {
        completed = true
      })

      const ws = (transport as any).ws as MockWebSocket

      // Simulate progress
      for (const progress of [25, 50, 75, 100]) {
        ws.onmessage?.(
          new MessageEvent('message', {
            data: JSON.stringify({
              type: 'videoGenerationProgress',
              surfaceId: 's1',
              videoId: 'vid-1',
              progress,
            }),
          })
        )
      }

      await new Promise((resolve) => setTimeout(resolve, 50))

      // Simulate completion
      ws.onmessage?.(
        new MessageEvent('message', {
          data: JSON.stringify({
            type: 'videoGenerationComplete',
            surfaceId: 's1',
            videoId: 'vid-1',
            videoUrl: 'https://example.com/vid-1.mp4',
            composition: {},
          }),
        })
      )

      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(progressUpdates).toEqual([25, 50, 75, 100])
      expect(completed).toBe(true)
    })

    it('should verify aiVideo component is registered', () => {
      const def = registry.get('aiVideo')
      expect(def).toBeDefined()
      expect(def?.type).toBe('aiVideo')
      expect(def?.category).toBe('generation')
    })
  })

  // Test 4: AIVideoPlayer Component Integration
  describe('AIVideoPlayer Component Integration', () => {
    it('should verify aiVideoPlayer component is registered with interactive features', () => {
      const def = registry.get('aiVideoPlayer')
      expect(def).toBeDefined()
      expect(def?.type).toBe('aiVideoPlayer')
      expect(def?.category).toBe('media')
      expect(def?.defaultProps?.interactive).toBeDefined()
    })
  })

  // Test 5: Message Flow Testing
  describe('Message Flow Testing', () => {
    it('should route multiple video message types concurrently', async () => {
      await transport.connect()

      const received: string[] = []

      transport.on<RecordingStartedMessage>('recordingStarted', () => received.push('recording'))
      transport.on<VideoCallJoinedMessage>('videoCallJoined', () => received.push('call'))
      transport.on<VideoGenerationProgressMessage>('videoGenerationProgress', () => received.push('generation'))

      const ws = (transport as any).ws as MockWebSocket

      ws.onmessage?.(
        new MessageEvent('message', {
          data: JSON.stringify({
            type: 'recordingStarted',
            surfaceId: 's1',
            recordingId: 'r1',
            timestamp: new Date().toISOString(),
          }),
        })
      )

      ws.onmessage?.(
        new MessageEvent('message', {
          data: JSON.stringify({
            type: 'videoCallJoined',
            surfaceId: 's2',
            callId: 'c1',
            participantId: 'p1',
            timestamp: new Date().toISOString(),
          }),
        })
      )

      ws.onmessage?.(
        new MessageEvent('message', {
          data: JSON.stringify({
            type: 'videoGenerationProgress',
            surfaceId: 's3',
            videoId: 'v1',
            progress: 50,
          }),
        })
      )

      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(received).toContain('recording')
      expect(received).toContain('call')
      expect(received).toContain('generation')
    })
  })

  // Test 6: State Synchronization Testing
  describe('State Synchronization Testing', () => {
    it('should maintain consistent state across multiple handlers', async () => {
      await transport.connect()

      const handler1Data: RecordingCompleteMessage[] = []
      const handler2Data: RecordingCompleteMessage[] = []

      transport.on<RecordingCompleteMessage>('recordingComplete', (msg) => handler1Data.push(msg))
      transport.on<RecordingCompleteMessage>('recordingComplete', (msg) => handler2Data.push(msg))

      const ws = (transport as any).ws as MockWebSocket
      const message = {
        type: 'recordingComplete',
        surfaceId: 's1',
        recordingId: 'rec-1',
        videoUrl: 'https://example.com/rec-1.mp4',
        duration: 120,
      }

      ws.onmessage?.(new MessageEvent('message', { data: JSON.stringify(message) }))

      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(handler1Data).toHaveLength(1)
      expect(handler2Data).toHaveLength(1)
      expect(handler1Data[0]).toEqual(handler2Data[0])
    })
  })

  // Test 7: Error Handling Testing
  describe('Error Handling Testing', () => {
    it('should emit error on invalid JSON message', async () => {
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

    it('should throw error when sending message while disconnected', () => {
      const message: RequestRecordingMessage = {
        type: 'requestRecording',
        surfaceId: 's1',
        recordingId: 'r1',
        mode: 'screen',
      }

      expect(() => transport.send(message)).toThrow('Cannot send message: not connected')
    })
  })

  // Test 8: Registry Integration
  describe('Registry Integration Testing', () => {
    it('should have all 4 video components registered', () => {
      const all = registry.getAll()
      const videoTypes = ['videoRecorder', 'videoCall', 'aiVideo', 'aiVideoPlayer']

      videoTypes.forEach((type) => {
        const component = all.find((c) => c.type === type)
        expect(component).toBeDefined()
      })
    })

    it('should find video components by category', () => {
      const media = registry.getByCategory('media')
      expect(media.some((c) => c.type === 'videoRecorder')).toBe(true)

      const comm = registry.getByCategory('communication')
      expect(comm.some((c) => c.type === 'videoCall')).toBe(true)

      const gen = registry.getByCategory('generation')
      expect(gen.some((c) => c.type === 'aiVideo')).toBe(true)
    })

    it('should find video components by tag', () => {
      const videoTagged = registry.searchByTag('video')
      expect(videoTagged.length).toBeGreaterThan(0)

      const aiTagged = registry.searchByTag('ai')
      const aiTypes = aiTagged.map((c) => c.type)
      expect(aiTypes).toContain('aiVideo')
      expect(aiTypes).toContain('aiVideoPlayer')
    })
  })
})
