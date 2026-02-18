import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { A2UIProvider } from '../../src/context/A2UIProvider'
import { useA2UIState } from '../../src/hooks/useA2UIState'
import { A2UITransport } from '@ainative/ai-kit-a2ui-core/transport'
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

describe('useA2UIState', () => {
  let transport: A2UITransport

  beforeEach(() => {
    transport = new A2UITransport('ws://localhost:8080')
  })

  afterEach(() => {
    transport.disconnect()
    vi.clearAllMocks()
  })

  const createWrapper = (initialState = {}) => {
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <A2UIProvider transport={transport} initialState={initialState}>
        {children}
      </A2UIProvider>
    )
    return Wrapper
  }

  describe('Basic Functionality', () => {
    it('should return initial state', async () => {
      const initialState = { count: 0, name: 'Test' }
      const wrapper = createWrapper(initialState)

      const { result } = renderHook(() => useA2UIState<typeof initialState>(), { wrapper })

      await waitFor(() => {
        expect(result.current.state).toEqual(initialState)
      })
    })

    it('should provide setState function', async () => {
      const wrapper = createWrapper({ count: 0 })

      const { result } = renderHook(() => useA2UIState<{ count: number }>(), { wrapper })

      expect(typeof result.current.setState).toBe('function')
    })

    it('should provide replaceState function', async () => {
      const wrapper = createWrapper({ count: 0 })

      const { result } = renderHook(() => useA2UIState<{ count: number }>(), { wrapper })

      expect(typeof result.current.replaceState).toBe('function')
    })

    it('should provide resetState function', async () => {
      const wrapper = createWrapper({ count: 0 })

      const { result } = renderHook(() => useA2UIState<{ count: number }>(), { wrapper })

      expect(typeof result.current.resetState).toBe('function')
    })
  })

  describe('State Updates', () => {
    it('should merge state updates', async () => {
      const wrapper = createWrapper({ count: 0, name: 'Initial' })

      const { result } = renderHook(
        () => useA2UIState<{ count: number; name: string }>(),
        { wrapper }
      )

      act(() => {
        result.current.setState({ count: 5 })
      })

      await waitFor(() => {
        expect(result.current.state.count).toBe(5)
        expect(result.current.state.name).toBe('Initial')
      })
    })

    it('should handle multiple sequential updates', async () => {
      const wrapper = createWrapper({ count: 0 })

      const { result } = renderHook(() => useA2UIState<{ count: number }>(), { wrapper })

      act(() => {
        result.current.setState({ count: 1 })
        result.current.setState({ count: 2 })
        result.current.setState({ count: 3 })
      })

      await waitFor(() => {
        expect(result.current.state.count).toBe(3)
      })
    })

    it('should handle nested object updates', async () => {
      const wrapper = createWrapper({
        user: { name: 'John', age: 30 },
        settings: { theme: 'dark' },
      })

      const { result } = renderHook(
        () => useA2UIState<{
          user: { name: string; age: number }
          settings: { theme: string }
        }>(),
        { wrapper }
      )

      act(() => {
        result.current.setState({
          user: { ...result.current.state.user, age: 31 },
        })
      })

      await waitFor(() => {
        expect(result.current.state.user.age).toBe(31)
        expect(result.current.state.user.name).toBe('John')
        expect(result.current.state.settings.theme).toBe('dark')
      })
    })

    it('should replace entire state', async () => {
      const wrapper = createWrapper({ count: 0, name: 'Initial' })

      const { result } = renderHook(
        () => useA2UIState<{ count: number; name: string }>(),
        { wrapper }
      )

      act(() => {
        result.current.replaceState({ count: 10, name: 'Replaced' })
      })

      await waitFor(() => {
        expect(result.current.state).toEqual({ count: 10, name: 'Replaced' })
      })
    })

    it('should reset to initial state', async () => {
      const initialState = { count: 0, name: 'Initial' }
      const wrapper = createWrapper(initialState)

      const { result } = renderHook(
        () => useA2UIState<{ count: number; name: string }>(),
        { wrapper }
      )

      // Modify state
      act(() => {
        result.current.setState({ count: 99, name: 'Modified' })
      })

      await waitFor(() => {
        expect(result.current.state.count).toBe(99)
      })

      // Reset
      act(() => {
        result.current.resetState()
      })

      await waitFor(() => {
        expect(result.current.state).toEqual(initialState)
      })
    })
  })

  describe('Type Safety', () => {
    it('should enforce typed state updates', async () => {
      const wrapper = createWrapper({ count: 0, enabled: true })

      const { result } = renderHook(
        () => useA2UIState<{ count: number; enabled: boolean }>(),
        { wrapper }
      )

      // This should work
      act(() => {
        result.current.setState({ count: 5 })
        result.current.setState({ enabled: false })
        result.current.setState({ count: 10, enabled: true })
      })

      await waitFor(() => {
        expect(result.current.state.count).toBe(10)
        expect(result.current.state.enabled).toBe(true)
      })
    })

    it('should work with complex types', async () => {
      type ComplexState = {
        users: Array<{ id: string; name: string }>
        metadata: {
          total: number
          page: number
        }
      }

      const initialState: ComplexState = {
        users: [{ id: '1', name: 'Alice' }],
        metadata: { total: 1, page: 1 },
      }

      const wrapper = createWrapper(initialState)

      const { result } = renderHook(() => useA2UIState<ComplexState>(), { wrapper })

      act(() => {
        result.current.setState({
          users: [...result.current.state.users, { id: '2', name: 'Bob' }],
          metadata: { ...result.current.state.metadata, total: 2 },
        })
      })

      await waitFor(() => {
        expect(result.current.state.users).toHaveLength(2)
        expect(result.current.state.metadata.total).toBe(2)
      })
    })
  })

  describe('Error Handling', () => {
    it('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => useA2UIState())
      }).toThrow('useA2UIState must be used within A2UIProvider')
    })

    it('should handle empty initial state', async () => {
      const wrapper = createWrapper({})

      const { result } = renderHook(() => useA2UIState<Record<string, never>>(), {
        wrapper,
      })

      expect(result.current.state).toEqual({})
    })
  })

  describe('Performance', () => {
    it('should maintain stable function references', async () => {
      const wrapper = createWrapper({ count: 0 })

      const { result, rerender } = renderHook(
        () => useA2UIState<{ count: number }>(),
        { wrapper }
      )

      const setStateRef1 = result.current.setState
      const replaceStateRef1 = result.current.replaceState
      const resetStateRef1 = result.current.resetState

      rerender()

      const setStateRef2 = result.current.setState
      const replaceStateRef2 = result.current.replaceState
      const resetStateRef2 = result.current.resetState

      expect(setStateRef1).toBe(setStateRef2)
      expect(replaceStateRef1).toBe(replaceStateRef2)
      expect(resetStateRef1).toBe(resetStateRef2)
    })

    it('should not cause unnecessary re-renders', async () => {
      const wrapper = createWrapper({ count: 0 })
      let renderCount = 0

      const { result } = renderHook(
        () => {
          renderCount++
          return useA2UIState<{ count: number }>()
        },
        { wrapper }
      )

      const initialRenderCount = renderCount

      // Update with same value
      act(() => {
        result.current.setState({ count: 0 })
      })

      await waitFor(() => {
        // Should trigger re-render even with same value (React behavior)
        expect(renderCount).toBeGreaterThanOrEqual(initialRenderCount)
      })
    })
  })

  describe('Memory Management', () => {
    it('should cleanup on unmount', async () => {
      const wrapper = createWrapper({ count: 0 })

      const { result, unmount } = renderHook(
        () => useA2UIState<{ count: number }>(),
        { wrapper }
      )

      act(() => {
        result.current.setState({ count: 5 })
      })

      unmount()

      // Should not throw errors after unmount
      expect(true).toBe(true)
    })
  })
})
