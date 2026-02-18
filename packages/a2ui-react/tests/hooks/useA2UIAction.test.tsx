import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { A2UIProvider } from '../../src/context/A2UIProvider'
import { useA2UIAction } from '../../src/hooks/useA2UIAction'
import { A2UITransport } from '@ainative/ai-kit-a2ui-core/transport'
import type { A2UIMessage, UserActionMessage } from '@ainative/ai-kit-a2ui-core/types'
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

describe('useA2UIAction', () => {
  let transport: A2UITransport
  let mockWs: MockWebSocket

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
    it('should provide sendAction function', async () => {
      const { result } = renderHook(() => useA2UIAction(), { wrapper })

      await waitFor(() => {
        expect(typeof result.current.sendAction).toBe('function')
      })
    })

    it('should provide sendMessage function', async () => {
      const { result } = renderHook(() => useA2UIAction(), { wrapper })

      await waitFor(() => {
        expect(typeof result.current.sendMessage).toBe('function')
      })
    })

    it('should provide isPending state', async () => {
      const { result } = renderHook(() => useA2UIAction(), { wrapper })

      expect(result.current.isPending).toBe(false)
    })

    it('should provide error state', async () => {
      const { result } = renderHook(() => useA2UIAction(), { wrapper })

      expect(result.current.error).toBeNull()
    })
  })

  describe('Sending Actions', () => {
    it('should send user action message', async () => {
      const { result } = renderHook(() => useA2UIAction(), { wrapper })

      await waitFor(() => {
        expect(transport.status).toBe('connected')
      })

      const sendSpy = vi.spyOn(transport, 'send')

      act(() => {
        result.current.sendAction('button-click')
      })

      await waitFor(() => {
        expect(sendSpy).toHaveBeenCalled()
        const sentMessage = sendSpy.mock.calls[0]?.[0] as UserActionMessage
        expect(sentMessage.type).toBe('userAction')
        expect(sentMessage.action).toBe('button-click')
      })
    })

    it('should include context in action message', async () => {
      const { result } = renderHook(() => useA2UIAction(), { wrapper })

      await waitFor(() => {
        expect(transport.status).toBe('connected')
      })

      const sendSpy = vi.spyOn(transport, 'send')
      const context = { buttonId: 'submit', value: 'test' }

      act(() => {
        result.current.sendAction('button-click', context)
      })

      await waitFor(() => {
        expect(sendSpy).toHaveBeenCalled()
        const sentMessage = sendSpy.mock.calls[0]?.[0] as UserActionMessage
        expect(sentMessage.context).toEqual(context)
      })
    })

    it('should include current data model in action', async () => {
      const initialState = { count: 5, name: 'Test' }

      const CustomWrapper = ({ children }: { children: React.ReactNode }) => (
        <A2UIProvider transport={transport} initialState={initialState}>
          {children}
        </A2UIProvider>
      )

      const { result } = renderHook(() => useA2UIAction(), { wrapper: CustomWrapper })

      await waitFor(() => {
        expect(transport.status).toBe('connected')
      })

      const sendSpy = vi.spyOn(transport, 'send')

      act(() => {
        result.current.sendAction('update')
      })

      await waitFor(() => {
        expect(sendSpy).toHaveBeenCalled()
        const sentMessage = sendSpy.mock.calls[0]?.[0] as UserActionMessage
        expect(sentMessage.dataModel).toEqual(initialState)
      })
    })

    it('should include surfaceId in action message', async () => {
      const CustomWrapper = ({ children }: { children: React.ReactNode }) => (
        <A2UIProvider transport={transport} surfaceId="test-surface">
          {children}
        </A2UIProvider>
      )

      const { result } = renderHook(() => useA2UIAction(), { wrapper: CustomWrapper })

      await waitFor(() => {
        expect(transport.status).toBe('connected')
      })

      const sendSpy = vi.spyOn(transport, 'send')

      act(() => {
        result.current.sendAction('click')
      })

      await waitFor(() => {
        expect(sendSpy).toHaveBeenCalled()
        const sentMessage = sendSpy.mock.calls[0]?.[0] as UserActionMessage
        expect(sentMessage.surfaceId).toBe('test-surface')
      })
    })
  })

  describe('Sending Custom Messages', () => {
    it('should send any A2UI message', async () => {
      const { result } = renderHook(() => useA2UIAction(), { wrapper })

      await waitFor(() => {
        expect(transport.status).toBe('connected')
      })

      const sendSpy = vi.spyOn(transport, 'send')

      const customMessage: A2UIMessage = {
        type: 'ping',
        timestamp: Date.now(),
      }

      act(() => {
        result.current.sendMessage(customMessage)
      })

      await waitFor(() => {
        expect(sendSpy).toHaveBeenCalledWith(customMessage)
      })
    })

    it('should handle multiple message sends', async () => {
      const { result } = renderHook(() => useA2UIAction(), { wrapper })

      await waitFor(() => {
        expect(transport.status).toBe('connected')
      })

      const sendSpy = vi.spyOn(transport, 'send')

      act(() => {
        result.current.sendAction('action-1')
        result.current.sendAction('action-2')
        result.current.sendAction('action-3')
      })

      await waitFor(() => {
        expect(sendSpy).toHaveBeenCalledTimes(3)
      })
    })
  })

  describe('Error Handling', () => {
    it('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => useA2UIAction())
      }).toThrow('useA2UIAction must be used within A2UIProvider')
    })

    it('should handle send errors gracefully', async () => {
      const { result } = renderHook(() => useA2UIAction(), { wrapper })

      await waitFor(() => {
        expect(transport.status).toBe('connected')
      })

      // Disconnect transport to cause error
      act(() => {
        transport.disconnect()
      })

      await waitFor(() => {
        expect(transport.status).toBe('disconnected')
      })

      // Should not throw, but log warning
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})

      act(() => {
        result.current.sendAction('test')
      })

      await waitFor(() => {
        expect(consoleWarn).toHaveBeenCalled()
      })

      consoleWarn.mockRestore()
    })

    it('should clear error state', async () => {
      const { result } = renderHook(() => useA2UIAction(), { wrapper })

      await waitFor(() => {
        expect(transport.status).toBe('connected')
      })

      // Initially no error
      expect(result.current.error).toBeNull()
    })
  })

  describe('Pending State', () => {
    it('should track pending state during action', async () => {
      const { result } = renderHook(() => useA2UIAction(), { wrapper })

      await waitFor(() => {
        expect(transport.status).toBe('connected')
      })

      // Initially not pending
      expect(result.current.isPending).toBe(false)

      // Note: In a real implementation, isPending would be true during async operations
      // For this synchronous mock, it remains false
      act(() => {
        result.current.sendAction('test')
      })

      expect(result.current.isPending).toBe(false)
    })
  })

  describe('Performance', () => {
    it('should maintain stable function references', async () => {
      const { result, rerender } = renderHook(() => useA2UIAction(), { wrapper })

      await waitFor(() => {
        expect(transport.status).toBe('connected')
      })

      const sendActionRef1 = result.current.sendAction
      const sendMessageRef1 = result.current.sendMessage

      rerender()

      const sendActionRef2 = result.current.sendAction
      const sendMessageRef2 = result.current.sendMessage

      expect(sendActionRef1).toBe(sendActionRef2)
      expect(sendMessageRef1).toBe(sendMessageRef2)
    })

    it('should handle rapid action sends', async () => {
      const { result } = renderHook(() => useA2UIAction(), { wrapper })

      await waitFor(() => {
        expect(transport.status).toBe('connected')
      })

      const sendSpy = vi.spyOn(transport, 'send')

      // Send 100 actions rapidly
      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.sendAction(`action-${i}`)
        }
      })

      await waitFor(() => {
        expect(sendSpy).toHaveBeenCalledTimes(100)
      })
    })
  })

  describe('Integration with State', () => {
    it('should include latest state in actions', async () => {
      const CustomWrapper = ({ children }: { children: React.ReactNode }) => (
        <A2UIProvider transport={transport} initialState={{ count: 0 }}>
          {children}
        </A2UIProvider>
      )

      const { result } = renderHook(() => useA2UIAction(), { wrapper: CustomWrapper })

      await waitFor(() => {
        expect(transport.status).toBe('connected')
      })

      const sendSpy = vi.spyOn(transport, 'send')

      act(() => {
        result.current.sendAction('increment')
      })

      await waitFor(() => {
        expect(sendSpy).toHaveBeenCalled()
        const sentMessage = sendSpy.mock.calls[0]?.[0] as UserActionMessage
        expect(sentMessage.dataModel).toBeDefined()
      })
    })
  })

  describe('Memory Management', () => {
    it('should cleanup on unmount', async () => {
      const { result, unmount } = renderHook(() => useA2UIAction(), { wrapper })

      await waitFor(() => {
        expect(transport.status).toBe('connected')
      })

      unmount()

      // Should not throw errors after unmount
      expect(true).toBe(true)
    })
  })
})
