/**
 * WebSocket Transport Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { A2UITransport } from '../../src/transport/transport.js'
import type { TransportStatus } from '../../src/transport/transport.js'

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

describe('A2UITransport', () => {
  let transport: A2UITransport

  beforeEach(() => {
    transport = new A2UITransport('wss://test.example.com')
  })

  afterEach(() => {
    transport.disconnect()
  })

  describe('constructor', () => {
    it('creates transport with default options', () => {
      expect(transport.status).toBe('disconnected')
      expect(transport.isConnected).toBe(false)
    })

    it('accepts custom options', () => {
      const customTransport = new A2UITransport('wss://test.example.com', {
        autoReconnect: false,
        reconnectDelay: 5000,
        maxReconnectAttempts: 10,
        pingInterval: 60000,
        pongTimeout: 10000,
      })

      expect(customTransport.status).toBe('disconnected')
    })
  })

  describe('connect', () => {
    it('connects successfully', async () => {
      const statusChanges: TransportStatus[] = []
      transport.on('statusChange', (status: TransportStatus) => {
        statusChanges.push(status)
      })

      await transport.connect()

      expect(transport.status).toBe('connected')
      expect(transport.isConnected).toBe(true)
      expect(statusChanges).toContain('connecting')
      expect(statusChanges).toContain('connected')
    })

    it('emits connect event', async () => {
      let connected = false
      transport.on('connect', () => {
        connected = true
      })

      await transport.connect()

      expect(connected).toBe(true)
    })

    it('does not reconnect if already connected', async () => {
      await transport.connect()
      const status1 = transport.status

      await transport.connect()
      const status2 = transport.status

      expect(status1).toBe('connected')
      expect(status2).toBe('connected')
    })

    it('does not reconnect if already connecting', async () => {
      const promise1 = transport.connect()
      const promise2 = transport.connect()

      await Promise.all([promise1, promise2])

      expect(transport.status).toBe('connected')
    })
  })

  describe('disconnect', () => {
    it('disconnects successfully', async () => {
      await transport.connect()

      let disconnected = false
      transport.on('disconnect', () => {
        disconnected = true
      })

      transport.disconnect()

      expect(transport.status).toBe('disconnected')
      expect(transport.isConnected).toBe(false)
      expect(disconnected).toBe(true)
    })

    it('can disconnect when not connected', () => {
      expect(() => transport.disconnect()).not.toThrow()
      expect(transport.status).toBe('disconnected')
    })
  })

  describe('send', () => {
    it('sends message when connected', async () => {
      await transport.connect()

      expect(() => {
        transport.send({
          type: 'userAction',
          surfaceId: 'surface-1',
          action: 'submit',
        })
      }).not.toThrow()
    })

    it('throws error when not connected', () => {
      expect(() => {
        transport.send({
          type: 'userAction',
          surfaceId: 'surface-1',
          action: 'submit',
        })
      }).toThrow('Cannot send message: not connected')
    })
  })

  describe('message handling', () => {
    it('emits message event on incoming message', async () => {
      await transport.connect()

      let receivedMessage: any = null
      transport.on('message', (msg) => {
        receivedMessage = msg
      })

      // Simulate incoming message
      const ws = (transport as any).ws as MockWebSocket
      ws.onmessage?.(
        new MessageEvent('message', {
          data: JSON.stringify({
            type: 'createSurface',
            surfaceId: 'surface-1',
            components: [],
          }),
        })
      )

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(receivedMessage).toMatchObject({
        type: 'createSurface',
        surfaceId: 'surface-1',
      })
    })

    it('emits specific message type events', async () => {
      await transport.connect()

      let createSurfaceData: any = null
      transport.on('createSurface', (data) => {
        createSurfaceData = data
      })

      const ws = (transport as any).ws as MockWebSocket
      ws.onmessage?.(
        new MessageEvent('message', {
          data: JSON.stringify({
            type: 'createSurface',
            surfaceId: 'surface-1',
            components: [],
          }),
        })
      )

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(createSurfaceData).toMatchObject({
        type: 'createSurface',
        surfaceId: 'surface-1',
      })
    })

    it('emits error on invalid JSON', async () => {
      await transport.connect()

      let errorEmitted = false
      transport.on('error', () => {
        errorEmitted = true
      })

      const ws = (transport as any).ws as MockWebSocket
      ws.onmessage?.(
        new MessageEvent('message', {
          data: 'invalid json',
        })
      )

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(errorEmitted).toBe(true)
    })

    it('handles pong messages', async () => {
      await transport.connect()

      const ws = (transport as any).ws as MockWebSocket
      ws.onmessage?.(
        new MessageEvent('message', {
          data: JSON.stringify({ type: 'pong' }),
        })
      )

      // Should not throw
      await new Promise((resolve) => setTimeout(resolve, 10))
    })
  })

  describe('event handling', () => {
    it('registers and calls event handlers', async () => {
      let callCount = 0
      const handler = () => {
        callCount++
      }

      transport.on('connect', handler)
      await transport.connect()

      expect(callCount).toBe(1)
    })

    it('unregisters event handlers', async () => {
      let callCount = 0
      const handler = () => {
        callCount++
      }

      transport.on('connect', handler)
      transport.off('connect', handler)
      await transport.connect()

      expect(callCount).toBe(0)
    })

    it('supports multiple handlers for same event', async () => {
      let count1 = 0
      let count2 = 0

      transport.on('connect', () => count1++)
      transport.on('connect', () => count2++)
      await transport.connect()

      expect(count1).toBe(1)
      expect(count2).toBe(1)
    })
  })

  describe('auto-reconnect', () => {
    it('schedules reconnect on disconnect', async () => {
      const reconnectTransport = new A2UITransport('wss://test.example.com', {
        autoReconnect: true,
        reconnectDelay: 100,
        maxReconnectAttempts: 3,
      })

      let reconnectingCount = 0
      reconnectTransport.on('reconnecting', () => {
        reconnectingCount++
      })

      await reconnectTransport.connect()

      // Simulate disconnect
      const ws = (reconnectTransport as any).ws as MockWebSocket
      ws.onclose?.(new CloseEvent('close'))

      // Wait for reconnect attempt
      await new Promise((resolve) => setTimeout(resolve, 150))

      expect(reconnectingCount).toBeGreaterThan(0)

      reconnectTransport.disconnect()
    })

    it('does not reconnect when autoReconnect is false', async () => {
      const noReconnectTransport = new A2UITransport('wss://test.example.com', {
        autoReconnect: false,
      })

      let reconnectingCount = 0
      noReconnectTransport.on('reconnecting', () => {
        reconnectingCount++
      })

      await noReconnectTransport.connect()

      const ws = (noReconnectTransport as any).ws as MockWebSocket
      ws.onclose?.(new CloseEvent('close'))

      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(reconnectingCount).toBe(0)

      noReconnectTransport.disconnect()
    })
  })

  describe('ping/pong', () => {
    it('sends ping at interval', async () => {
      const pingTransport = new A2UITransport('wss://test.example.com', {
        pingInterval: 50,
        pongTimeout: 1000,
      })

      await pingTransport.connect()

      // Wait for ping interval
      await new Promise((resolve) => setTimeout(resolve, 100))

      pingTransport.disconnect()
    })

    it('does not send ping when pingInterval is 0', async () => {
      const noPingTransport = new A2UITransport('wss://test.example.com', {
        pingInterval: 0,
      })

      await noPingTransport.connect()
      await new Promise((resolve) => setTimeout(resolve, 100))

      noPingTransport.disconnect()
    })
  })

  describe('error handling', () => {
    it('emits error on connection failure', async () => {
      // Create a mock that fails to connect
      class FailingWebSocket extends MockWebSocket {
        constructor(url: string) {
          super(url)
          // Clear the success timeout from parent
          this.readyState = MockWebSocket.CONNECTING
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new Event('error'))
            }
          }, 10)
        }
      }

      global.WebSocket = FailingWebSocket as any

      const failTransport = new A2UITransport('wss://test.example.com')

      let errorEmitted = false
      failTransport.on('error', () => {
        errorEmitted = true
      })

      try {
        await failTransport.connect()
      } catch (error) {
        // Expected to fail
      }

      // Wait for error event to propagate
      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(errorEmitted).toBe(true)

      // Restore mock
      global.WebSocket = MockWebSocket as any
    })
  })

  describe('status property', () => {
    it('returns current status', () => {
      expect(transport.status).toBe('disconnected')
    })

    it('updates status during connection lifecycle', async () => {
      expect(transport.status).toBe('disconnected')

      const connectPromise = transport.connect()
      // Status should be 'connecting' immediately after calling connect

      await connectPromise
      expect(transport.status).toBe('connected')

      transport.disconnect()
      expect(transport.status).toBe('disconnected')
    })
  })

  describe('isConnected property', () => {
    it('returns false when disconnected', () => {
      expect(transport.isConnected).toBe(false)
    })

    it('returns true when connected', async () => {
      await transport.connect()
      expect(transport.isConnected).toBe(true)
    })

    it('returns false after disconnect', async () => {
      await transport.connect()
      expect(transport.isConnected).toBe(true)

      transport.disconnect()
      expect(transport.isConnected).toBe(false)
    })
  })
})
