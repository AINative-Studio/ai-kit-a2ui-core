import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { A2UIProvider } from '../../src/context/A2UIProvider'
import { useA2UI } from '../../src/hooks/useA2UI'
import React from 'react'

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

describe('useA2UI', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <A2UIProvider url="ws://localhost:8080">{children}</A2UIProvider>
  )

  it('should return the full context value', async () => {
    const { result } = renderHook(() => useA2UI(), { wrapper })

    expect(result.current.surfaces).toBeInstanceOf(Map)
    expect(typeof result.current.getSurface).toBe('function')
    expect(typeof result.current.getComponent).toBe('function')
    expect(result.current.isConnected).toBe(false)

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true)
    })
  })

  it('should throw when used outside a provider', () => {
    expect(() => {
      renderHook(() => useA2UI())
    }).toThrow('useA2UIContext must be used within an A2UIProvider')
  })
})
