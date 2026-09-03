import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { A2UIProvider, useA2UIContext } from '../../src/context/A2UIProvider'
import type {
  CreateSurfaceMessage,
  UpdateComponentsMessage,
  UpdateDataModelMessage,
} from '@ainative/ai-kit-a2ui-core/types'

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
  static autoOpen = true

  constructor(url: string) {
    this.url = url
    MockWebSocket.instances.push(this)
    if (MockWebSocket.autoOpen) {
      setTimeout(() => {
        this.readyState = WebSocket.OPEN
        this.onopen?.(new Event('open'))
      }, 0)
    }
  }

  emitMessage(data: unknown) {
    this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(data) }))
  }

  emitError() {
    this.onerror?.(new Event('error'))
  }

  send = vi.fn()
  close = vi.fn(() => {
    this.readyState = WebSocket.CLOSED
    this.onclose?.(new CloseEvent('close'))
  })
}

global.WebSocket = MockWebSocket as unknown as typeof WebSocket

describe('A2UIProvider', () => {
  beforeEach(() => {
    MockWebSocket.instances = []
    MockWebSocket.autoOpen = true
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Provider Lifecycle', () => {
    it('should render children without errors', () => {
      render(
        <A2UIProvider url="ws://localhost:8080">
          <div data-testid="child">Test Child</div>
        </A2UIProvider>
      )

      expect(screen.getByTestId('child')).toBeInTheDocument()
      expect(screen.getByTestId('child')).toHaveTextContent('Test Child')
    })

    it('should connect automatically on mount by default', async () => {
      render(
        <A2UIProvider url="ws://localhost:8080">
          <div>Content</div>
        </A2UIProvider>
      )

      await waitFor(() => {
        expect(MockWebSocket.instances).toHaveLength(1)
        expect(MockWebSocket.instances[0]?.readyState).toBe(MockWebSocket.OPEN)
      })
    })

    it('should not connect automatically when autoConnect is false', async () => {
      render(
        <A2UIProvider url="ws://localhost:8080" autoConnect={false}>
          <div>Content</div>
        </A2UIProvider>
      )

      // Give any accidental async connect a chance to happen
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(MockWebSocket.instances).toHaveLength(0)
    })

    it('should close the underlying socket on unmount', async () => {
      const { unmount } = render(
        <A2UIProvider url="ws://localhost:8080">
          <div>Content</div>
        </A2UIProvider>
      )

      await waitFor(() => {
        expect(MockWebSocket.instances[0]?.readyState).toBe(MockWebSocket.OPEN)
      })

      unmount()

      expect(MockWebSocket.instances[0]?.close).toHaveBeenCalled()
    })
  })

  describe('Message Handling', () => {
    it('should add a surface when a createSurface message is received', async () => {
      const TestConsumer = () => {
        const { getSurface } = useA2UIContext()
        const surface = getSurface('test-surface')
        return <div>{surface ? 'has-surface' : 'no-surface'}</div>
      }

      render(
        <A2UIProvider url="ws://localhost:8080">
          <TestConsumer />
        </A2UIProvider>
      )

      await waitFor(() => {
        expect(MockWebSocket.instances[0]?.readyState).toBe(MockWebSocket.OPEN)
      })

      expect(screen.getByText('no-surface')).toBeInTheDocument()

      const message: CreateSurfaceMessage = {
        type: 'createSurface',
        surfaceId: 'test-surface',
        components: [],
        dataModel: { test: 'value' },
      }

      act(() => {
        MockWebSocket.instances[0]?.emitMessage(message)
      })

      await waitFor(() => {
        expect(screen.getByText('has-surface')).toBeInTheDocument()
      })
    })

    it('should update, add, and remove components via updateComponents', async () => {
      const TestConsumer = () => {
        const { getSurface } = useA2UIContext()
        const surface = getSurface('test-surface')
        return (
          <div>
            {surface?.components.map((c) => (
              <span key={c.id}>{`${c.id}:${JSON.stringify(c.properties)}`}</span>
            ))}
          </div>
        )
      }

      render(
        <A2UIProvider url="ws://localhost:8080">
          <TestConsumer />
        </A2UIProvider>
      )

      await waitFor(() => {
        expect(MockWebSocket.instances[0]?.readyState).toBe(MockWebSocket.OPEN)
      })

      const createMessage: CreateSurfaceMessage = {
        type: 'createSurface',
        surfaceId: 'test-surface',
        components: [
          { id: 'a', type: 'text', properties: { text: 'old' } },
          { id: 'b', type: 'text', properties: { text: 'keep' } },
        ],
        dataModel: {},
      }

      act(() => {
        MockWebSocket.instances[0]?.emitMessage(createMessage)
      })

      await waitFor(() => {
        expect(screen.getByText('a:{"text":"old"}')).toBeInTheDocument()
      })

      const updateMessage: UpdateComponentsMessage = {
        type: 'updateComponents',
        surfaceId: 'test-surface',
        updates: [
          {
            id: 'a',
            operation: 'update',
            component: { id: 'a', type: 'text', properties: { text: 'new' } },
          },
          {
            id: 'c',
            operation: 'add',
            component: { id: 'c', type: 'text', properties: { text: 'added' } },
          },
          { id: 'b', operation: 'remove' },
        ],
      }

      act(() => {
        MockWebSocket.instances[0]?.emitMessage(updateMessage)
      })

      await waitFor(() => {
        expect(screen.getByText('a:{"text":"new"}')).toBeInTheDocument()
        expect(screen.getByText('c:{"text":"added"}')).toBeInTheDocument()
        expect(screen.queryByText(/^b:/)).not.toBeInTheDocument()
      })
    })

    it('should replace an existing component when an add update targets its id', async () => {
      const TestConsumer = () => {
        const { getSurface } = useA2UIContext()
        const surface = getSurface('test-surface')
        return (
          <div>
            {surface?.components.map((c) => (
              <span key={c.id}>{`${c.id}:${c.type}`}</span>
            ))}
          </div>
        )
      }

      render(
        <A2UIProvider url="ws://localhost:8080">
          <TestConsumer />
        </A2UIProvider>
      )

      await waitFor(() => {
        expect(MockWebSocket.instances[0]?.readyState).toBe(MockWebSocket.OPEN)
      })

      act(() => {
        MockWebSocket.instances[0]?.emitMessage({
          type: 'createSurface',
          surfaceId: 'test-surface',
          components: [{ id: 'a', type: 'text', properties: {} }],
          dataModel: {},
        } as CreateSurfaceMessage)
      })

      await waitFor(() => {
        expect(screen.getByText('a:text')).toBeInTheDocument()
      })

      act(() => {
        MockWebSocket.instances[0]?.emitMessage({
          type: 'updateComponents',
          surfaceId: 'test-surface',
          updates: [
            {
              id: 'a',
              operation: 'add',
              component: { id: 'a', type: 'image', properties: {} },
            },
          ],
        } as UpdateComponentsMessage)
      })

      await waitFor(() => {
        expect(screen.getByText('a:image')).toBeInTheDocument()
      })
    })

    it('should ignore updateDataModel for a surface that does not exist', async () => {
      render(
        <A2UIProvider url="ws://localhost:8080">
          <div>Content</div>
        </A2UIProvider>
      )

      await waitFor(() => {
        expect(MockWebSocket.instances[0]?.readyState).toBe(MockWebSocket.OPEN)
      })

      expect(() => {
        act(() => {
          MockWebSocket.instances[0]?.emitMessage({
            type: 'updateDataModel',
            surfaceId: 'missing-surface',
            updates: [{ path: '/count', value: 1 }],
          } as UpdateDataModelMessage)
        })
      }).not.toThrow()
    })

    it('should ignore updateComponents for a surface that does not exist', async () => {
      render(
        <A2UIProvider url="ws://localhost:8080">
          <div>Content</div>
        </A2UIProvider>
      )

      await waitFor(() => {
        expect(MockWebSocket.instances[0]?.readyState).toBe(MockWebSocket.OPEN)
      })

      const updateMessage: UpdateComponentsMessage = {
        type: 'updateComponents',
        surfaceId: 'missing-surface',
        updates: [{ id: 'a', operation: 'remove' }],
      }

      expect(() => {
        act(() => {
          MockWebSocket.instances[0]?.emitMessage(updateMessage)
        })
      }).not.toThrow()
    })

    it('should update the data model at a nested path via updateDataModel', async () => {
      const TestConsumer = () => {
        const { getSurface } = useA2UIContext()
        const surface = getSurface('test-surface')
        return <div>{JSON.stringify(surface?.dataModel ?? {})}</div>
      }

      render(
        <A2UIProvider url="ws://localhost:8080">
          <TestConsumer />
        </A2UIProvider>
      )

      await waitFor(() => {
        expect(MockWebSocket.instances[0]?.readyState).toBe(MockWebSocket.OPEN)
      })

      const createMessage: CreateSurfaceMessage = {
        type: 'createSurface',
        surfaceId: 'test-surface',
        components: [],
        dataModel: {},
      }

      act(() => {
        MockWebSocket.instances[0]?.emitMessage(createMessage)
      })

      await waitFor(() => {
        expect(screen.getByText('{}')).toBeInTheDocument()
      })

      // Creates intermediate objects along the path that don't exist yet.
      const nestedUpdate: UpdateDataModelMessage = {
        type: 'updateDataModel',
        surfaceId: 'test-surface',
        updates: [{ path: '/user/profile/name', value: 'Alice' }],
      }

      act(() => {
        MockWebSocket.instances[0]?.emitMessage(nestedUpdate)
      })

      await waitFor(() => {
        expect(
          screen.getByText('{"user":{"profile":{"name":"Alice"}}}')
        ).toBeInTheDocument()
      })

      // Root-path update merges an object into the existing data model.
      const rootUpdate: UpdateDataModelMessage = {
        type: 'updateDataModel',
        surfaceId: 'test-surface',
        updates: [{ path: '/', value: { count: 1 } }],
      }

      act(() => {
        MockWebSocket.instances[0]?.emitMessage(rootUpdate)
      })

      await waitFor(() => {
        const text = screen.getByText(/count/).textContent
        expect(text).toContain('"count":1')
        expect(text).toContain('"name":"Alice"')
      })
    })

    it('should ignore a root-path update whose value is an array', async () => {
      const TestConsumer = () => {
        const { getSurface } = useA2UIContext()
        const surface = getSurface('test-surface')
        return <div>{JSON.stringify(surface?.dataModel ?? {})}</div>
      }

      render(
        <A2UIProvider url="ws://localhost:8080">
          <TestConsumer />
        </A2UIProvider>
      )

      await waitFor(() => {
        expect(MockWebSocket.instances[0]?.readyState).toBe(MockWebSocket.OPEN)
      })

      act(() => {
        MockWebSocket.instances[0]?.emitMessage({
          type: 'createSurface',
          surfaceId: 'test-surface',
          components: [],
          dataModel: { count: 1 },
        } as CreateSurfaceMessage)
      })

      await waitFor(() => {
        expect(screen.getByText('{"count":1}')).toBeInTheDocument()
      })

      // An array value at the root path is not a valid merge source and
      // should be silently ignored, leaving the data model unchanged.
      act(() => {
        MockWebSocket.instances[0]?.emitMessage({
          type: 'updateDataModel',
          surfaceId: 'test-surface',
          updates: [{ path: '/', value: [1, 2, 3] }],
        } as UpdateDataModelMessage)
      })

      // Give any (incorrect) state update a chance to happen before asserting.
      await new Promise((resolve) => setTimeout(resolve, 10))
      expect(screen.getByText('{"count":1}')).toBeInTheDocument()
    })

    it('should treat an empty-string path the same as a root update', async () => {
      const TestConsumer = () => {
        const { getSurface } = useA2UIContext()
        const surface = getSurface('test-surface')
        return <div>{JSON.stringify(surface?.dataModel ?? {})}</div>
      }

      render(
        <A2UIProvider url="ws://localhost:8080">
          <TestConsumer />
        </A2UIProvider>
      )

      await waitFor(() => {
        expect(MockWebSocket.instances[0]?.readyState).toBe(MockWebSocket.OPEN)
      })

      act(() => {
        MockWebSocket.instances[0]?.emitMessage({
          type: 'createSurface',
          surfaceId: 'test-surface',
          components: [],
          dataModel: {},
        } as CreateSurfaceMessage)
      })

      await waitFor(() => {
        expect(screen.getByText('{}')).toBeInTheDocument()
      })

      act(() => {
        MockWebSocket.instances[0]?.emitMessage({
          type: 'updateDataModel',
          surfaceId: 'test-surface',
          updates: [{ path: '', value: { merged: true } }],
        } as UpdateDataModelMessage)
      })

      await waitFor(() => {
        expect(screen.getByText('{"merged":true}')).toBeInTheDocument()
      })
    })

    it('should be a no-op for a malformed path with no segments after the leading slashes', async () => {
      const TestConsumer = () => {
        const { getSurface } = useA2UIContext()
        const surface = getSurface('test-surface')
        return <div>{JSON.stringify(surface?.dataModel ?? {})}</div>
      }

      render(
        <A2UIProvider url="ws://localhost:8080">
          <TestConsumer />
        </A2UIProvider>
      )

      await waitFor(() => {
        expect(MockWebSocket.instances[0]?.readyState).toBe(MockWebSocket.OPEN)
      })

      act(() => {
        MockWebSocket.instances[0]?.emitMessage({
          type: 'createSurface',
          surfaceId: 'test-surface',
          components: [],
          dataModel: { count: 1 },
        } as CreateSurfaceMessage)
      })

      await waitFor(() => {
        expect(screen.getByText('{"count":1}')).toBeInTheDocument()
      })

      // "//" splits (after stripping the leading slash) into ["", ""],
      // which the empty-segment filter reduces to zero parts — a malformed
      // path with nothing left to navigate.
      expect(() => {
        act(() => {
          MockWebSocket.instances[0]?.emitMessage({
            type: 'updateDataModel',
            surfaceId: 'test-surface',
            updates: [{ path: '//', value: 'unreachable' }],
          } as UpdateDataModelMessage)
        })
      }).not.toThrow()

      await new Promise((resolve) => setTimeout(resolve, 10))
      expect(screen.getByText('{"count":1}')).toBeInTheDocument()
    })

    it('should remove a surface on deleteSurface', async () => {
      const TestConsumer = () => {
        const { getSurface } = useA2UIContext()
        const surface = getSurface('test-surface')
        return <div>{surface ? 'has-surface' : 'no-surface'}</div>
      }

      render(
        <A2UIProvider url="ws://localhost:8080">
          <TestConsumer />
        </A2UIProvider>
      )

      await waitFor(() => {
        expect(MockWebSocket.instances[0]?.readyState).toBe(MockWebSocket.OPEN)
      })

      const createMessage: CreateSurfaceMessage = {
        type: 'createSurface',
        surfaceId: 'test-surface',
        components: [],
        dataModel: {},
      }

      act(() => {
        MockWebSocket.instances[0]?.emitMessage(createMessage)
      })

      await waitFor(() => {
        expect(screen.getByText('has-surface')).toBeInTheDocument()
      })

      act(() => {
        MockWebSocket.instances[0]?.emitMessage({
          type: 'deleteSurface',
          surfaceId: 'test-surface',
        })
      })

      await waitFor(() => {
        expect(screen.getByText('no-surface')).toBeInTheDocument()
      })
    })

    it('should provide getComponent to read a specific component from a surface', async () => {
      const TestConsumer = () => {
        const { getComponent } = useA2UIContext()
        const component = getComponent('test-surface', 'label-1')
        return <div>{component ? 'found' : 'not-found'}</div>
      }

      render(
        <A2UIProvider url="ws://localhost:8080">
          <TestConsumer />
        </A2UIProvider>
      )

      await waitFor(() => {
        expect(MockWebSocket.instances[0]?.readyState).toBe(MockWebSocket.OPEN)
      })

      expect(screen.getByText('not-found')).toBeInTheDocument()

      act(() => {
        MockWebSocket.instances[0]?.emitMessage({
          type: 'createSurface',
          surfaceId: 'test-surface',
          components: [{ id: 'label-1', type: 'text', properties: {} }],
          dataModel: {},
        } as CreateSurfaceMessage)
      })

      await waitFor(() => {
        expect(screen.getByText('found')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should call onError when the transport fails to connect', async () => {
      const onError = vi.fn()
      MockWebSocket.autoOpen = false

      render(
        <A2UIProvider url="ws://localhost:8080" onError={onError}>
          <div>Content</div>
        </A2UIProvider>
      )

      await waitFor(() => {
        expect(MockWebSocket.instances).toHaveLength(1)
      })

      act(() => {
        MockWebSocket.instances[0]?.onerror?.(new Event('error'))
      })

      await waitFor(() => {
        expect(onError).toHaveBeenCalled()
      })
    })

    it('should call onError when the transport reports an error', async () => {
      const onError = vi.fn()

      render(
        <A2UIProvider url="ws://invalid:9999" onError={onError}>
          <div>Content</div>
        </A2UIProvider>
      )

      await waitFor(() => {
        expect(MockWebSocket.instances).toHaveLength(1)
      })

      act(() => {
        MockWebSocket.instances[0]?.emitError()
      })

      await waitFor(() => {
        expect(onError).toHaveBeenCalled()
      })
    })

    it('should still render children when the transport errors', async () => {
      render(
        <A2UIProvider url="ws://invalid:9999">
          <div>Content</div>
        </A2UIProvider>
      )

      expect(screen.getByText('Content')).toBeInTheDocument()

      await waitFor(() => {
        expect(MockWebSocket.instances).toHaveLength(1)
      })

      act(() => {
        MockWebSocket.instances[0]?.emitError()
      })

      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })

  describe('Status Changes', () => {
    it('should call onConnect once connected', async () => {
      const onConnect = vi.fn()

      render(
        <A2UIProvider url="ws://localhost:8080" onConnect={onConnect}>
          <div>Content</div>
        </A2UIProvider>
      )

      await waitFor(() => {
        expect(onConnect).toHaveBeenCalledTimes(1)
      })
    })

    it('should call onDisconnect when the socket closes after connecting', async () => {
      const onDisconnect = vi.fn()

      render(
        <A2UIProvider url="ws://localhost:8080" onDisconnect={onDisconnect}>
          <div>Content</div>
        </A2UIProvider>
      )

      await waitFor(() => {
        expect(MockWebSocket.instances[0]?.readyState).toBe(MockWebSocket.OPEN)
      })

      act(() => {
        MockWebSocket.instances[0]?.close()
      })

      await waitFor(() => {
        expect(onDisconnect).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Context Value', () => {
    it('should provide isConnected to children via context', async () => {
      const TestConsumer = () => {
        const { isConnected } = useA2UIContext()
        return <div>{isConnected ? 'connected' : 'not-connected'}</div>
      }

      render(
        <A2UIProvider url="ws://localhost:8080">
          <TestConsumer />
        </A2UIProvider>
      )

      expect(screen.getByText('not-connected')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByText('connected')).toBeInTheDocument()
      })
    })

    it('should throw when useA2UIContext is used outside a provider', () => {
      const TestConsumer = () => {
        useA2UIContext()
        return <div>Consumer</div>
      }

      expect(() => render(<TestConsumer />)).toThrow(
        'useA2UIContext must be used within an A2UIProvider'
      )
    })
  })

  describe('Memory Leaks', () => {
    it('should not throw across multiple mount/unmount cycles', async () => {
      for (let i = 0; i < 5; i++) {
        const { unmount } = render(
          <A2UIProvider url="ws://localhost:8080">
            <div>Cycle {i}</div>
          </A2UIProvider>
        )

        await waitFor(() => {
          expect(MockWebSocket.instances[MockWebSocket.instances.length - 1]?.readyState).toBe(
            MockWebSocket.OPEN
          )
        })

        expect(() => unmount()).not.toThrow()
      }

      expect(MockWebSocket.instances).toHaveLength(5)
    })
  })
})
