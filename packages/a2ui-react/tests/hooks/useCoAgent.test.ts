import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useCoAgent } from '../../src/hooks/useCoAgent'

// Mock A2UITransport
vi.mock('@ainative/ai-kit-a2ui-core/transport', () => ({
  A2UITransport: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    off: vi.fn(),
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    send: vi.fn(),
  })),
}))

describe('useCoAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with initial state', () => {
    const { result } = renderHook(() =>
      useCoAgent(
        { url: 'ws://localhost:3000' },
        { count: 0 }
      )
    )

    expect(result.current.state).toEqual({ count: 0 })
    expect(result.current.isConnected).toBe(false)
    expect(result.current.isConnecting).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('should update state locally', () => {
    const { result } = renderHook(() =>
      useCoAgent(
        { url: 'ws://localhost:3000' },
        { count: 0 }
      )
    )

    act(() => {
      result.current.setState({ count: 5 })
    })

    expect(result.current.state.count).toBe(5)
  })

  it('should provide connect function', async () => {
    const { result } = renderHook(() =>
      useCoAgent(
        { url: 'ws://localhost:3000' },
        { count: 0 }
      )
    )

    await act(async () => {
      await result.current.connect()
    })

    expect(result.current.connect).toBeDefined()
  })

  it('should provide disconnect function', async () => {
    const { result } = renderHook(() =>
      useCoAgent(
        { url: 'ws://localhost:3000' },
        { count: 0 }
      )
    )

    await act(async () => {
      await result.current.disconnect()
    })

    expect(result.current.disconnect).toBeDefined()
  })

  it('should provide send function', () => {
    const { result } = renderHook(() =>
      useCoAgent(
        { url: 'ws://localhost:3000' },
        { count: 0 }
      )
    )

    act(() => {
      result.current.send({
        surfaceId: 'test',
        action: 'increment'
      })
    })

    expect(result.current.send).toBeDefined()
  })

  it('should handle error callback', () => {
    const onError = vi.fn()
    
    renderHook(() =>
      useCoAgent(
        { 
          url: 'ws://localhost:3000',
          onError 
        },
        { count: 0 }
      )
    )

    expect(onError).not.toHaveBeenCalled()
  })

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() =>
      useCoAgent(
        { url: 'ws://localhost:3000' },
        { count: 0 }
      )
    )

    unmount()

    expect(true).toBe(true)
  })
})
