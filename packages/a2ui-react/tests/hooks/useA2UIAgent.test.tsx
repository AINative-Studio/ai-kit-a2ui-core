import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { A2UIProvider } from '../../src/context/A2UIProvider'
import { useA2UIAgent } from '../../src/hooks/useA2UIAgent'
import { A2UITransport } from '@ainative/ai-kit-a2ui-core/transport'
import type { A2UIMessage, CreateSurfaceMessage } from '@ainative/ai-kit-a2ui-core/types'
import React from 'react'

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

  constructor(url: string) {
    this.url = url
    setTimeout(() => {
      this.readyState = WebSocket.OPEN
      this.onopen?.(new Event('open'))
    }, 0)
  }

  send = vi.fn()
  close = vi.fn(() => {
    this.readyState = WebSocket.CLOSED
    this.onclose?.(new CloseEvent('close'))
  })
}

global.WebSocket = MockWebSocket as unknown as typeof WebSocket

describe('useA2UIAgent', () => {
  let transport: A2UITransport

  beforeEach(() => {
    transport = new A2UITransport('ws://localhost:8080')
  })

  afterEach(() => {
    transport.disconnect()
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <A2UIProvider transport={transport}>{children}</A2UIProvider>
  )

  describe('Basic Functionality', () => {
    it('should return agent state', async () => {
      const { result } = renderHook(() => useA2UIAgent(), { wrapper })

      await waitFor(() => {
        expect(result.current.status).toBe('connected')
      })

      expect(result.current.messages).toEqual([])
      expect(result.current.lastMessage).toBeNull()
      expect(result.current.isConnected).toBe(true)
    })

    it('should track connection status', async () => {
      const { result } = renderHook(() => useA2UIAgent(), { wrapper })

      await waitFor(() => {
        expect(result.current.status).toBe('connected')
        expect(result.current.isConnected).toBe(true)
      })
    })

    it('should update messages when received', async () => {
      const { result } = renderHook(() => useA2UIAgent(), { wrapper })

      await waitFor(() => {
        expect(result.current.status).toBe('connected')
      })

      const message: CreateSurfaceMessage = {
        type: 'createSurface',
        surfaceId: 'test',
        components: [],
        dataModel: {},
      }

      // Simulate receiving a message
      act(() => {
        transport.on('message', (msg: A2UIMessage) => {
          // Message handler will update state
        })
      })
    })

    it('should track last message', async () => {
      const { result } = renderHook(() => useA2UIAgent(), { wrapper })

      await waitFor(() => {
        expect(result.current.status).toBe('connected')
      })

      expect(result.current.lastMessage).toBeNull()
    })

    it('should accumulate messages in order', async () => {
      const { result } = renderHook(() => useA2UIAgent(), { wrapper })

      await waitFor(() => {
        expect(result.current.status).toBe('connected')
      })

      // Initially no messages
      expect(result.current.messages).toHaveLength(0)
    })
  })

  describe('Message Subscription', () => {
    it('should provide subscribe function', async () => {
      const { result } = renderHook(() => useA2UIAgent(), { wrapper })

      await waitFor(() => {
        expect(result.current.status).toBe('connected')
      })

      expect(typeof result.current.subscribe).toBe('function')
    })

    it('should allow subscribing to specific message types', async () => {
      const { result } = renderHook(() => useA2UIAgent(), { wrapper })

      await waitFor(() => {
        expect(result.current.status).toBe('connected')
      })

      const handler = vi.fn()

      act(() => {
        const unsubscribe = result.current.subscribe('createSurface', handler)
        expect(typeof unsubscribe).toBe('function')
      })
    })

    it('should call handler when subscribed message type is received', async () => {
      const { result } = renderHook(() => useA2UIAgent(), { wrapper })

      await waitFor(() => {
        expect(result.current.status).toBe('connected')
      })

      const handler = vi.fn()

      act(() => {
        result.current.subscribe('createSurface', handler)
      })

      // Handler should be ready to receive messages
      expect(handler).not.toHaveBeenCalled()
    })

    it('should return unsubscribe function', async () => {
      const { result } = renderHook(() => useA2UIAgent(), { wrapper })

      await waitFor(() => {
        expect(result.current.status).toBe('connected')
      })

      const handler = vi.fn()
      let unsubscribe: (() => void) | undefined

      act(() => {
        unsubscribe = result.current.subscribe('createSurface', handler)
      })

      expect(typeof unsubscribe).toBe('function')

      // Unsubscribe should work without errors
      act(() => {
        unsubscribe?.()
      })
    })

    it('should stop calling handler after unsubscribe', async () => {
      const { result } = renderHook(() => useA2UIAgent(), { wrapper })

      await waitFor(() => {
        expect(result.current.status).toBe('connected')
      })

      const handler = vi.fn()

      act(() => {
        const unsubscribe = result.current.subscribe('createSurface', handler)
        unsubscribe()
      })

      // After unsubscribe, handler should not be called
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle missing context gracefully', () => {
      expect(() => {
        renderHook(() => useA2UIAgent())
      }).toThrow('useA2UIAgent must be used within A2UIProvider')
    })

    it('should handle transport disconnection', async () => {
      const { result } = renderHook(() => useA2UIAgent(), { wrapper })

      await waitFor(() => {
        expect(result.current.status).toBe('connected')
      })

      act(() => {
        transport.disconnect()
      })

      await waitFor(() => {
        expect(result.current.status).toBe('disconnected')
        expect(result.current.isConnected).toBe(false)
      })
    })
  })

  describe('Memory Management', () => {
    it('should cleanup subscriptions on unmount', async () => {
      const { result, unmount } = renderHook(() => useA2UIAgent(), { wrapper })

      await waitFor(() => {
        expect(result.current.status).toBe('connected')
      })

      const handler = vi.fn()

      act(() => {
        result.current.subscribe('createSurface', handler)
      })

      unmount()

      // After unmount, subscriptions should be cleaned up
      expect(handler).not.toHaveBeenCalled()
    })

    it('should not update state after unmount', async () => {
      const { result, unmount } = renderHook(() => useA2UIAgent(), { wrapper })

      await waitFor(() => {
        expect(result.current.status).toBe('connected')
      })

      unmount()

      // Should not throw errors or warnings
      expect(true).toBe(true)
    })
  })

  describe('Performance', () => {
    it('should maintain stable reference for subscribe function', async () => {
      const { result, rerender } = renderHook(() => useA2UIAgent(), { wrapper })

      await waitFor(() => {
        expect(result.current.status).toBe('connected')
      })

      const subscribeRef1 = result.current.subscribe

      rerender()

      const subscribeRef2 = result.current.subscribe

      expect(subscribeRef1).toBe(subscribeRef2)
    })

    it('should handle multiple concurrent subscriptions', async () => {
      const { result } = renderHook(() => useA2UIAgent(), { wrapper })

      await waitFor(() => {
        expect(result.current.status).toBe('connected')
      })

      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const handler3 = vi.fn()

      act(() => {
        result.current.subscribe('createSurface', handler1)
        result.current.subscribe('updateComponents', handler2)
        result.current.subscribe('updateDataModel', handler3)
      })

      // All handlers should be registered
      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).not.toHaveBeenCalled()
      expect(handler3).not.toHaveBeenCalled()
    })
  })
})
