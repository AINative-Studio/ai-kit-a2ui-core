import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { A2UIProvider } from '../../src/context/A2UIProvider'
import { useA2UIState } from '../../src/hooks/useA2UIState'
import type { CreateSurfaceMessage, UpdateDataModelMessage } from '@ainative/ai-kit-a2ui-core/types'
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

describe('useA2UIState', () => {
  beforeEach(() => {
    MockWebSocket.instances = []
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <A2UIProvider url="ws://localhost:8080">{children}</A2UIProvider>
  )

  const createSurfaceWithDataModel = (surfaceId: string, dataModel: Record<string, unknown>) => {
    const message: CreateSurfaceMessage = {
      type: 'createSurface',
      surfaceId,
      components: [],
      dataModel,
    }
    MockWebSocket.instances[0]?.emitMessage(message)
  }

  describe('Basic Functionality', () => {
    it('should return undefined value when the surface does not exist', () => {
      const { result } = renderHook(() => useA2UIState<number>('missing-surface', '/count'), {
        wrapper,
      })

      expect(result.current.value).toBeUndefined()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should return the value at the given JSON pointer path once the surface exists', async () => {
      const { result } = renderHook(
        () => useA2UIState<number>('test-surface', '/count'),
        { wrapper }
      )

      act(() => {
        createSurfaceWithDataModel('test-surface', { count: 5, name: 'Test' })
      })

      await waitFor(() => {
        expect(result.current.value).toBe(5)
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should read nested paths', async () => {
      const { result } = renderHook(
        () => useA2UIState<string>('test-surface', '/user/name'),
        { wrapper }
      )

      act(() => {
        createSurfaceWithDataModel('test-surface', { user: { name: 'Alice', age: 30 } })
      })

      await waitFor(() => {
        expect(result.current.value).toBe('Alice')
      })
    })

    it('should read the whole data model at the root path', async () => {
      const { result } = renderHook(
        () => useA2UIState<Record<string, unknown>>('test-surface', '/'),
        { wrapper }
      )

      act(() => {
        createSurfaceWithDataModel('test-surface', { count: 0, name: 'Root' })
      })

      await waitFor(() => {
        expect(result.current.value).toEqual({ count: 0, name: 'Root' })
      })
    })

    it('should provide a refresh function', () => {
      const { result } = renderHook(() => useA2UIState('test-surface', '/count'), { wrapper })

      expect(typeof result.current.refresh).toBe('function')
    })

    it('should re-read the current value when refresh is called', async () => {
      const { result } = renderHook(
        () => useA2UIState<number>('test-surface', '/count'),
        { wrapper }
      )

      act(() => {
        createSurfaceWithDataModel('test-surface', { count: 1 })
      })

      await waitFor(() => {
        expect(result.current.value).toBe(1)
      })

      act(() => {
        result.current.refresh()
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.value).toBe(1)
      expect(result.current.error).toBeNull()
    })

    it('should be a no-op to call refresh after unmount', async () => {
      const { result, unmount } = renderHook(
        () => useA2UIState<number>('test-surface', '/count'),
        { wrapper }
      )

      unmount()

      expect(() => result.current.refresh()).not.toThrow()
    })
  })

  describe('State Updates', () => {
    it('should update the value when the data model changes', async () => {
      const { result } = renderHook(
        () => useA2UIState<number>('test-surface', '/count'),
        { wrapper }
      )

      act(() => {
        createSurfaceWithDataModel('test-surface', { count: 0 })
      })

      await waitFor(() => {
        expect(result.current.value).toBe(0)
      })

      const updateMessage: UpdateDataModelMessage = {
        type: 'updateDataModel',
        surfaceId: 'test-surface',
        updates: [{ path: '/count', value: 5 }],
      }

      act(() => {
        MockWebSocket.instances[0]?.emitMessage(updateMessage)
      })

      await waitFor(() => {
        expect(result.current.value).toBe(5)
      })
    })

    it('should return undefined for an array index out of bounds', async () => {
      const { result } = renderHook(
        () => useA2UIState<string>('test-surface', '/items/5'),
        { wrapper }
      )

      act(() => {
        createSurfaceWithDataModel('test-surface', { items: ['a', 'b'] })
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      expect(result.current.value).toBeUndefined()
    })

    it('should return undefined when traversing through a non-object value', async () => {
      const { result } = renderHook(
        () => useA2UIState<string>('test-surface', '/count/nested'),
        { wrapper }
      )

      act(() => {
        createSurfaceWithDataModel('test-surface', { count: 5 })
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      expect(result.current.value).toBeUndefined()
    })

    it('should return undefined for a negative array index', async () => {
      const { result } = renderHook(
        () => useA2UIState<string>('test-surface', '/items/-1'),
        { wrapper }
      )

      act(() => {
        createSurfaceWithDataModel('test-surface', { items: ['a', 'b'] })
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      expect(result.current.value).toBeUndefined()
    })

    it('should return undefined for a non-numeric array index', async () => {
      const { result } = renderHook(
        () => useA2UIState<string>('test-surface', '/items/foo'),
        { wrapper }
      )

      act(() => {
        createSurfaceWithDataModel('test-surface', { items: ['a', 'b'] })
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      expect(result.current.value).toBeUndefined()
    })

    it('should read array elements by index', async () => {
      const { result } = renderHook(
        () => useA2UIState<string>('test-surface', '/items/1'),
        { wrapper }
      )

      act(() => {
        createSurfaceWithDataModel('test-surface', { items: ['a', 'b', 'c'] })
      })

      await waitFor(() => {
        expect(result.current.value).toBe('b')
      })
    })
  })

  describe('Error Handling', () => {
    it('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => useA2UIState('test-surface', '/count'))
      }).toThrow('useA2UIContext must be used within an A2UIProvider')
    })
  })

  describe('Performance', () => {
    it('should maintain a stable refresh function reference across rerenders with the same args', async () => {
      const { result, rerender } = renderHook(
        () => useA2UIState<number>('test-surface', '/count'),
        { wrapper }
      )

      act(() => {
        createSurfaceWithDataModel('test-surface', { count: 0 })
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const refreshRef1 = result.current.refresh
      rerender()
      const refreshRef2 = result.current.refresh

      expect(refreshRef1).toBe(refreshRef2)
    })
  })

  describe('Memory Management', () => {
    it('should not throw when unmounted before the surface resolves', () => {
      const { unmount } = renderHook(
        () => useA2UIState<number>('test-surface', '/count'),
        { wrapper }
      )

      expect(() => unmount()).not.toThrow()
    })
  })
})
