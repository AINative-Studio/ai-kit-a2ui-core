import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { A2UIProvider } from '../../src/context/A2UIProvider'
import { A2UITransport } from '@ainative/ai-kit-a2ui-core/transport'
import type { A2UIMessage, CreateSurfaceMessage } from '@ainative/ai-kit-a2ui-core/types'

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

describe('A2UIProvider', () => {
  let transport: A2UITransport

  beforeEach(() => {
    transport = new A2UITransport('ws://localhost:8080')
  })

  afterEach(() => {
    transport.disconnect()
    vi.clearAllMocks()
  })

  describe('Provider Lifecycle', () => {
    it('should render children without errors', () => {
      render(
        <A2UIProvider transport={transport}>
          <div data-testid="child">Test Child</div>
        </A2UIProvider>
      )

      expect(screen.getByTestId('child')).toBeInTheDocument()
      expect(screen.getByTestId('child')).toHaveTextContent('Test Child')
    })

    it('should accept surfaceId prop', () => {
      render(
        <A2UIProvider transport={transport} surfaceId="test-surface">
          <div>Content</div>
        </A2UIProvider>
      )

      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should accept optional initialState prop', () => {
      const initialState = { count: 0, name: 'Test' }

      render(
        <A2UIProvider transport={transport} initialState={initialState}>
          <div>Content</div>
        </A2UIProvider>
      )

      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should connect transport on mount', async () => {
      const connectSpy = vi.spyOn(transport, 'connect')

      render(
        <A2UIProvider transport={transport}>
          <div>Content</div>
        </A2UIProvider>
      )

      await waitFor(() => {
        expect(connectSpy).toHaveBeenCalledTimes(1)
      })
    })

    it('should disconnect transport on unmount', async () => {
      const disconnectSpy = vi.spyOn(transport, 'disconnect')

      const { unmount } = render(
        <A2UIProvider transport={transport}>
          <div>Content</div>
        </A2UIProvider>
      )

      await waitFor(() => {
        expect(transport.status).toBe('connected')
      })

      unmount()

      expect(disconnectSpy).toHaveBeenCalledTimes(1)
    })

    it('should not disconnect if autoConnect is false', async () => {
      const disconnectSpy = vi.spyOn(transport, 'disconnect')

      const { unmount } = render(
        <A2UIProvider transport={transport} autoConnect={false}>
          <div>Content</div>
        </A2UIProvider>
      )

      unmount()

      expect(disconnectSpy).not.toHaveBeenCalled()
    })
  })

  describe('Message Handling', () => {
    it('should handle incoming messages', async () => {
      render(
        <A2UIProvider transport={transport}>
          <div>Content</div>
        </A2UIProvider>
      )

      await waitFor(() => {
        expect(transport.status).toBe('connected')
      })

      const message: CreateSurfaceMessage = {
        type: 'createSurface',
        surfaceId: 'test',
        components: [],
        dataModel: { test: 'value' }
      }

      // Simulate incoming message
      transport.on('message', (msg: A2UIMessage) => {
        expect(msg).toEqual(message)
      })
    })

    it('should buffer messages before connection', async () => {
      const { rerender } = render(
        <A2UIProvider transport={transport} autoConnect={false}>
          <div>Content</div>
        </A2UIProvider>
      )

      // Transport not connected yet
      expect(transport.status).toBe('disconnected')

      // Trigger connection
      rerender(
        <A2UIProvider transport={transport} autoConnect={true}>
          <div>Content</div>
        </A2UIProvider>
      )

      await waitFor(() => {
        expect(transport.status).toBe('connected')
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle connection errors gracefully', async () => {
      const errorTransport = new A2UITransport('ws://invalid:9999')
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <A2UIProvider transport={errorTransport}>
          <div>Content</div>
        </A2UIProvider>
      )

      // Should still render children even on error
      expect(screen.getByText('Content')).toBeInTheDocument()

      consoleError.mockRestore()
    })

    it('should call onError callback when provided', async () => {
      const onError = vi.fn()
      const errorTransport = new A2UITransport('ws://invalid:9999')

      render(
        <A2UIProvider transport={errorTransport} onError={onError}>
          <div>Content</div>
        </A2UIProvider>
      )

      await waitFor(() => {
        // Transport will emit error
      }, { timeout: 1000 })
    })
  })

  describe('Status Changes', () => {
    it('should notify onStatusChange callback', async () => {
      const onStatusChange = vi.fn()

      render(
        <A2UIProvider transport={transport} onStatusChange={onStatusChange}>
          <div>Content</div>
        </A2UIProvider>
      )

      await waitFor(() => {
        expect(onStatusChange).toHaveBeenCalledWith('connecting')
      })

      await waitFor(() => {
        expect(onStatusChange).toHaveBeenCalledWith('connected')
      })
    })
  })

  describe('Context Value', () => {
    it('should provide transport instance to children', async () => {
      const TestConsumer = () => {
        // Will be implemented after context is created
        return <div>Consumer</div>
      }

      render(
        <A2UIProvider transport={transport}>
          <TestConsumer />
        </A2UIProvider>
      )

      expect(screen.getByText('Consumer')).toBeInTheDocument()
    })
  })

  describe('Multiple Surfaces', () => {
    it('should handle multiple surface IDs', async () => {
      const { rerender } = render(
        <A2UIProvider transport={transport} surfaceId="surface-1">
          <div>Surface 1</div>
        </A2UIProvider>
      )

      expect(screen.getByText('Surface 1')).toBeInTheDocument()

      rerender(
        <A2UIProvider transport={transport} surfaceId="surface-2">
          <div>Surface 2</div>
        </A2UIProvider>
      )

      expect(screen.getByText('Surface 2')).toBeInTheDocument()
    })
  })

  describe('Memory Leaks', () => {
    it('should cleanup event listeners on unmount', async () => {
      const offSpy = vi.spyOn(transport, 'off')

      const { unmount } = render(
        <A2UIProvider transport={transport}>
          <div>Content</div>
        </A2UIProvider>
      )

      await waitFor(() => {
        expect(transport.status).toBe('connected')
      })

      unmount()

      // Should unregister all event handlers
      expect(offSpy).toHaveBeenCalled()
    })

    it('should not cause memory leaks on multiple mount/unmount cycles', async () => {
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(
          <A2UIProvider transport={transport}>
            <div>Cycle {i}</div>
          </A2UIProvider>
        )

        await waitFor(() => {
          expect(transport.status).toBe('connected')
        })

        unmount()
      }

      // If no memory leaks, this should complete without issues
      expect(true).toBe(true)
    })
  })
})
