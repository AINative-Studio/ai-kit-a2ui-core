import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { A2UIProvider } from '../../src/context/A2UIProvider'
import { useA2UIAction } from '../../src/hooks/useA2UIAction'
import type { UserActionMessage } from '@ainative/ai-kit-a2ui-core/types'
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
  static instances: MockWebSocket[] = []

  constructor(url: string) {
    this.url = url
    MockWebSocket.instances.push(this)
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
  beforeEach(() => {
    MockWebSocket.instances = []
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <A2UIProvider url="ws://localhost:8080">{children}</A2UIProvider>
  )

  describe('Basic Functionality', () => {
    it('should provide an executeAction function', () => {
      const { result } = renderHook(() => useA2UIAction('test-surface'), { wrapper })

      expect(typeof result.current.executeAction).toBe('function')
    })

    it('should provide a clearError function', () => {
      const { result } = renderHook(() => useA2UIAction('test-surface'), { wrapper })

      expect(typeof result.current.clearError).toBe('function')
    })

    it('should start with isLoading false and no error', () => {
      const { result } = renderHook(() => useA2UIAction('test-surface'), { wrapper })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe('Sending Actions', () => {
    it('should set an error and not send when not connected', () => {
      const { result } = renderHook(() => useA2UIAction('test-surface'), { wrapper })

      act(() => {
        result.current.executeAction('button-1', 'click')
      })

      expect(result.current.error?.message).toBe('Cannot execute action: not connected to agent')
    })

    it('should send a user action message once connected', async () => {
      const { result } = renderHook(() => useA2UIAction('test-surface'), { wrapper })

      await waitFor(() => {
        expect(MockWebSocket.instances[0]?.readyState).toBe(MockWebSocket.OPEN)
      })

      const sendSpy = MockWebSocket.instances[0]!.send

      act(() => {
        result.current.executeAction('button-1', 'click')
      })

      await waitFor(() => {
        expect(sendSpy).toHaveBeenCalled()
      })

      const sentMessage = JSON.parse(sendSpy.mock.calls[0]![0] as string) as UserActionMessage
      expect(sentMessage.type).toBe('userAction')
      expect(sentMessage.action).toBe('click')
      expect(sentMessage.componentId).toBe('button-1')
      expect(sentMessage.surfaceId).toBe('test-surface')
    })

    it('should include context data in the action message', async () => {
      const { result } = renderHook(() => useA2UIAction('test-surface'), { wrapper })

      await waitFor(() => {
        expect(MockWebSocket.instances[0]?.readyState).toBe(MockWebSocket.OPEN)
      })

      const sendSpy = MockWebSocket.instances[0]!.send
      const context = { buttonId: 'submit', value: 'test' }

      act(() => {
        result.current.executeAction('button-1', 'click', context)
      })

      await waitFor(() => {
        expect(sendSpy).toHaveBeenCalled()
      })

      const sentMessage = JSON.parse(sendSpy.mock.calls[0]![0] as string) as UserActionMessage
      expect(sentMessage.context).toEqual(context)
    })

    it('should default context to an empty object when omitted', async () => {
      const { result } = renderHook(() => useA2UIAction('test-surface'), { wrapper })

      await waitFor(() => {
        expect(MockWebSocket.instances[0]?.readyState).toBe(MockWebSocket.OPEN)
      })

      const sendSpy = MockWebSocket.instances[0]!.send

      act(() => {
        result.current.executeAction('button-1', 'click')
      })

      await waitFor(() => {
        expect(sendSpy).toHaveBeenCalled()
      })

      const sentMessage = JSON.parse(sendSpy.mock.calls[0]![0] as string) as UserActionMessage
      expect(sentMessage.context).toEqual({})
    })

    it('should send multiple actions independently', async () => {
      const { result } = renderHook(() => useA2UIAction('test-surface'), { wrapper })

      await waitFor(() => {
        expect(MockWebSocket.instances[0]?.readyState).toBe(MockWebSocket.OPEN)
      })

      const sendSpy = MockWebSocket.instances[0]!.send

      act(() => {
        result.current.executeAction('a', 'click')
        result.current.executeAction('b', 'click')
        result.current.executeAction('c', 'click')
      })

      await waitFor(() => {
        expect(sendSpy).toHaveBeenCalledTimes(3)
      })
    })
  })

  describe('Error Handling', () => {
    it('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => useA2UIAction('test-surface'))
      }).toThrow('useA2UIContext must be used within an A2UIProvider')
    })

    it('should clear error state via clearError', () => {
      const { result } = renderHook(() => useA2UIAction('test-surface'), { wrapper })

      act(() => {
        result.current.executeAction('button-1', 'click')
      })

      expect(result.current.error).not.toBeNull()

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })

    it('should clear a previous error on the next successful send', async () => {
      const { result } = renderHook(() => useA2UIAction('test-surface'), { wrapper })

      act(() => {
        result.current.executeAction('button-1', 'click')
      })

      expect(result.current.error).not.toBeNull()

      await waitFor(() => {
        expect(MockWebSocket.instances[0]?.readyState).toBe(MockWebSocket.OPEN)
      })

      act(() => {
        result.current.executeAction('button-1', 'click')
      })

      await waitFor(() => {
        expect(result.current.error).toBeNull()
      })
    })
  })

  describe('Send Failures', () => {
    it('should set an error when transport.send throws synchronously', async () => {
      const { result } = renderHook(() => useA2UIAction('test-surface'), { wrapper })

      await waitFor(() => {
        expect(MockWebSocket.instances[0]?.readyState).toBe(MockWebSocket.OPEN)
      })

      MockWebSocket.instances[0]!.send.mockImplementationOnce(() => {
        throw new Error('boom')
      })

      act(() => {
        result.current.executeAction('button-1', 'click')
      })

      expect(result.current.error?.message).toBe('boom')
      expect(result.current.isLoading).toBe(false)
    })

    it('should wrap a non-Error throw in an Error', async () => {
      const { result } = renderHook(() => useA2UIAction('test-surface'), { wrapper })

      await waitFor(() => {
        expect(MockWebSocket.instances[0]?.readyState).toBe(MockWebSocket.OPEN)
      })

      MockWebSocket.instances[0]!.send.mockImplementationOnce(() => {
        throw 'not an error object'
      })

      act(() => {
        result.current.executeAction('button-1', 'click')
      })

      expect(result.current.error?.message).toBe('Failed to execute action')
    })
  })

  describe('Loading Timeout Safety Net', () => {
    it('should reset isLoading after the 5s safety timeout even with no response', async () => {
      vi.useFakeTimers()
      const { result } = renderHook(() => useA2UIAction('test-surface'), { wrapper })

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })

      act(() => {
        result.current.executeAction('button-1', 'click')
      })

      expect(result.current.isLoading).toBe(true)

      act(() => {
        vi.advanceTimersByTime(5000)
      })

      expect(result.current.isLoading).toBe(false)
      vi.useRealTimers()
    })
  })

  describe('Pending State', () => {
    it('should set isLoading true immediately after a successful send, then reset', async () => {
      const { result } = renderHook(() => useA2UIAction('test-surface'), { wrapper })

      await waitFor(() => {
        expect(MockWebSocket.instances[0]?.readyState).toBe(MockWebSocket.OPEN)
      })

      act(() => {
        result.current.executeAction('button-1', 'click')
      })

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe('Performance', () => {
    it('should maintain a stable executeAction reference across rerenders', async () => {
      const { result, rerender } = renderHook(() => useA2UIAction('test-surface'), { wrapper })

      await waitFor(() => {
        expect(MockWebSocket.instances[0]?.readyState).toBe(MockWebSocket.OPEN)
      })

      const executeActionRef1 = result.current.executeAction
      rerender()
      const executeActionRef2 = result.current.executeAction

      expect(executeActionRef1).toBe(executeActionRef2)
    })

    it('should handle rapid action sends', async () => {
      const { result } = renderHook(() => useA2UIAction('test-surface'), { wrapper })

      await waitFor(() => {
        expect(MockWebSocket.instances[0]?.readyState).toBe(MockWebSocket.OPEN)
      })

      const sendSpy = MockWebSocket.instances[0]!.send

      act(() => {
        for (let i = 0; i < 50; i++) {
          result.current.executeAction(`button-${i}`, 'click')
        }
      })

      await waitFor(() => {
        expect(sendSpy).toHaveBeenCalledTimes(50)
      })
    })
  })

  describe('Memory Management', () => {
    it('should not throw when unmounted', async () => {
      const { result, unmount } = renderHook(() => useA2UIAction('test-surface'), { wrapper })

      await waitFor(() => {
        expect(MockWebSocket.instances[0]?.readyState).toBe(MockWebSocket.OPEN)
      })

      act(() => {
        result.current.executeAction('button-1', 'click')
      })

      expect(() => unmount()).not.toThrow()
    })
  })
})
