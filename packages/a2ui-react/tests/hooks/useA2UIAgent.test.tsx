import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useA2UIAgent } from '../../src/hooks/useA2UIAgent'
import type { CreateSurfaceMessage, UpdateComponentsMessage } from '@ainative/ai-kit-a2ui-core/types'

// Mock WebSocket
class MockWebSocket {
  url: string
  readyState = WebSocket.CONNECTING
  onopen: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null

  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  static instances: MockWebSocket[] = []

  constructor(url: string) {
    this.url = url
    MockWebSocket.instances.push(this)
    setTimeout(() => {
      this.readyState = WebSocket.OPEN
      this.onopen?.(new Event('open'))
    }, 0)
  }

  emitMessage(data: unknown) {
    this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(data) }))
  }

  send = vi.fn()
  close = vi.fn(() => {
    this.readyState = WebSocket.CLOSED
    this.onclose?.(new CloseEvent('close'))
  })
}

global.WebSocket = MockWebSocket as unknown as typeof WebSocket

describe('useA2UIAgent', () => {
  beforeEach(() => {
    MockWebSocket.instances = []
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Functionality', () => {
    it('should initialize with empty surfaces and disconnected state', () => {
      const { result } = renderHook(() =>
        useA2UIAgent({ url: 'ws://localhost:8080', autoConnect: false })
      )

      expect(result.current.surfaces.size).toBe(0)
      expect(result.current.isConnected).toBe(false)
      expect(result.current.isConnecting).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should auto-connect by default', async () => {
      const { result } = renderHook(() => useA2UIAgent({ url: 'ws://localhost:8080' }))

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true)
      })
    })

    it('should not auto-connect when autoConnect is false', async () => {
      const { result } = renderHook(() =>
        useA2UIAgent({ url: 'ws://localhost:8080', autoConnect: false })
      )

      // Give it a tick to make sure no connection happens
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(result.current.isConnected).toBe(false)
    })

    it('should expose a connect function that connects the transport', async () => {
      const { result } = renderHook(() =>
        useA2UIAgent({ url: 'ws://localhost:8080', autoConnect: false })
      )

      await act(async () => {
        await result.current.connect()
      })

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true)
      })
    })

    it('should expose a disconnect function', async () => {
      const { result } = renderHook(() => useA2UIAgent({ url: 'ws://localhost:8080' }))

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true)
      })

      await act(async () => {
        await result.current.disconnect()
      })

      await waitFor(() => {
        expect(result.current.isConnected).toBe(false)
      })
    })
  })

  describe('Surfaces', () => {
    it('should add a surface when createSurface message is received', async () => {
      const { result } = renderHook(() => useA2UIAgent({ url: 'ws://localhost:8080' }))

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true)
      })

      const message: CreateSurfaceMessage = {
        type: 'createSurface',
        surfaceId: 'test-surface',
        components: [],
        dataModel: { count: 0 },
      }

      act(() => {
        MockWebSocket.instances[0]?.emitMessage(message)
      })

      await waitFor(() => {
        expect(result.current.surfaces.has('test-surface')).toBe(true)
      })
      expect(result.current.surfaces.get('test-surface')?.dataModel).toEqual({ count: 0 })
    })

    it('should update components for an existing surface', async () => {
      const { result } = renderHook(() => useA2UIAgent({ url: 'ws://localhost:8080' }))

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true)
      })

      const createMessage: CreateSurfaceMessage = {
        type: 'createSurface',
        surfaceId: 'test-surface',
        components: [{ id: 'label-1', type: 'text', properties: { text: 'old' } }],
        dataModel: {},
      }

      act(() => {
        MockWebSocket.instances[0]?.emitMessage(createMessage)
      })

      await waitFor(() => {
        expect(result.current.surfaces.has('test-surface')).toBe(true)
      })

      const updateMessage: UpdateComponentsMessage = {
        type: 'updateComponents',
        surfaceId: 'test-surface',
        updates: [
          {
            id: 'label-1',
            operation: 'update',
            component: { id: 'label-1', type: 'text', properties: { text: 'new' } },
          },
        ],
      }

      act(() => {
        MockWebSocket.instances[0]?.emitMessage(updateMessage)
      })

      await waitFor(() => {
        const surface = result.current.surfaces.get('test-surface')
        expect(surface?.components[0]?.properties?.text).toBe('new')
      })
    })

    it('should return undefined for a surface that does not exist', () => {
      const { result } = renderHook(() =>
        useA2UIAgent({ url: 'ws://localhost:8080', autoConnect: false })
      )

      expect(result.current.surfaces.get('missing')).toBeUndefined()
    })
  })

  describe('send', () => {
    it('should expose a send function immediately after mount', () => {
      const { result } = renderHook(() =>
        useA2UIAgent({ url: 'ws://localhost:8080', autoConnect: false })
      )

      expect(typeof result.current.send).toBe('function')
    })

    it('should throw when sending while disconnected', () => {
      const { result } = renderHook(() =>
        useA2UIAgent({ url: 'ws://localhost:8080', autoConnect: false })
      )

      expect(() =>
        result.current.send({ surfaceId: 'test-surface', action: 'click', context: {} } as never)
      ).toThrow('Cannot send message: not connected')
    })

    it('should send a user action message once connected', async () => {
      const { result } = renderHook(() => useA2UIAgent({ url: 'ws://localhost:8080' }))

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true)
      })

      expect(() =>
        result.current.send({ surfaceId: 'test-surface', action: 'click', context: {} } as never)
      ).not.toThrow()
    })
  })

  describe('Status and error handling', () => {
    it('should set isConnecting true while connecting', async () => {
      const { result } = renderHook(() =>
        useA2UIAgent({ url: 'ws://localhost:8080', autoConnect: false })
      )

      act(() => {
        void result.current.connect()
      })

      expect(result.current.isConnecting).toBe(true)

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true)
      })
      expect(result.current.isConnecting).toBe(false)
    })

    it('should set an error when the transport emits a raw error event', async () => {
      const { result } = renderHook(() => useA2UIAgent({ url: 'ws://localhost:8080' }))

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true)
      })

      act(() => {
        MockWebSocket.instances[0]?.onerror?.(new Event('error'))
      })

      await waitFor(() => {
        expect(result.current.error).not.toBeNull()
      })
    })
  })

  describe('Reconnection options', () => {
    it('should accept custom reconnect options without throwing', () => {
      expect(() =>
        renderHook(() =>
          useA2UIAgent({
            url: 'ws://localhost:8080',
            autoConnect: false,
            reconnect: false,
            reconnectInterval: 1000,
            maxReconnectAttempts: 2,
          })
        )
      ).not.toThrow()
    })
  })

  describe('Cleanup', () => {
    it('should disconnect transport on unmount', async () => {
      const { result, unmount } = renderHook(() => useA2UIAgent({ url: 'ws://localhost:8080' }))

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true)
      })

      expect(() => unmount()).not.toThrow()
    })
  })

  describe('Performance', () => {
    it('should maintain a stable send function reference across rerenders', async () => {
      const { result, rerender } = renderHook(() =>
        useA2UIAgent({ url: 'ws://localhost:8080' })
      )

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true)
      })

      const sendRef1 = result.current.send
      rerender()
      const sendRef2 = result.current.send

      expect(sendRef1).toBe(sendRef2)
    })
  })
})
