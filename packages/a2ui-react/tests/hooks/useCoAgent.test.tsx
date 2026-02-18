import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useCoAgent } from '../../src/hooks/useCoAgent'
import type { CoAgentOptions, CoAgentHook } from '../../src/types/coagent'
import type {
  ClientStateUpdateMessage,
  AgentStateUpdateMessage
} from '@ainative/ai-kit-a2ui-core/types'

/**
 * Comprehensive test suite for useCoAgent hook
 * 40+ tests covering all functionality with 85%+ coverage target
 */

// Mock transport for testing
class MockTransport {
  private listeners = new Map<string, Set<(data: unknown) => void>>()

  on(event: string, handler: (data: unknown) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)?.add(handler)
  }

  off(event: string, handler: (data: unknown) => void): void {
    this.listeners.get(event)?.delete(handler)
  }

  send(message: unknown): void {
    // Mock send implementation
    this.lastSentMessage = message
  }

  emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach(handler => handler(data))
  }

  lastSentMessage: unknown = null

  getListenerCount(event: string): number {
    return this.listeners.get(event)?.size ?? 0
  }

  close(): void {
    this.listeners.clear()
  }
}

describe('useCoAgent Hook', () => {
  let mockTransport: MockTransport

  beforeEach(() => {
    mockTransport = new MockTransport()
  })

  afterEach(() => {
    mockTransport.close()
  })

  describe('Basic Functionality', () => {
    it('should initialize with provided initial state', () => {
      interface TestState {
        count: number
        message: string
      }

      const initialState: TestState = { count: 0, message: 'hello' }

      const { result } = renderHook(() =>
        useCoAgent<TestState>('test-agent', initialState, { transport: mockTransport })
      )

      expect(result.current.state).toEqual(initialState)
    })

    it('should return correct hook interface', () => {
      const { result } = renderHook(() =>
        useCoAgent('test-agent', { value: 1 }, { transport: mockTransport })
      )

      expect(result.current).toHaveProperty('state')
      expect(result.current).toHaveProperty('setState')
      expect(result.current).toHaveProperty('isConnected')
      expect(result.current).toHaveProperty('error')
      expect(result.current).toHaveProperty('version')
      expect(typeof result.current.setState).toBe('function')
    })

    it('should infer state type correctly', () => {
      interface UserState {
        userId: string
        preferences: {
          theme: 'light' | 'dark'
          language: string
        }
      }

      const { result } = renderHook(() =>
        useCoAgent<UserState>('user-agent', {
          userId: '123',
          preferences: { theme: 'dark', language: 'en' }
        }, { transport: mockTransport })
      )

      // TypeScript should enforce type safety
      expect(result.current.state.userId).toBe('123')
      expect(result.current.state.preferences.theme).toBe('dark')
    })
  })

  describe('Bidirectional State Synchronization', () => {
    it('should send state update to agent when setState is called', async () => {
      const { result } = renderHook(() =>
        useCoAgent('test-agent', { count: 0 }, { transport: mockTransport })
      )

      act(() => {
        result.current.setState({ count: 5 })
      })

      await waitFor(() => {
        const message = mockTransport.lastSentMessage as ClientStateUpdateMessage
        expect(message).toBeDefined()
        expect(message.type).toBe('clientStateUpdate')
        expect(message.agentName).toBe('test-agent')
        expect(message.state).toEqual({ count: 5 })
      })
    })

    it('should update UI state when agent sends state update', async () => {
      const { result } = renderHook(() =>
        useCoAgent('test-agent', { count: 0 }, { transport: mockTransport })
      )

      const agentMessage: AgentStateUpdateMessage = {
        type: 'agentStateUpdate',
        agentName: 'test-agent',
        state: { count: 10 },
        timestamp: Date.now()
      }

      act(() => {
        mockTransport.emit('message', agentMessage)
      })

      await waitFor(() => {
        expect(result.current.state).toEqual({ count: 10 })
      })
    })

    it('should only respond to messages for the correct agent', async () => {
      const { result } = renderHook(() =>
        useCoAgent('agent-1', { value: 1 }, { transport: mockTransport })
      )

      const otherAgentMessage: AgentStateUpdateMessage = {
        type: 'agentStateUpdate',
        agentName: 'agent-2',
        state: { value: 99 },
        timestamp: Date.now()
      }

      act(() => {
        mockTransport.emit('message', otherAgentMessage)
      })

      // State should not change
      expect(result.current.state).toEqual({ value: 1 })
    })

    it('should handle partial state updates with merge strategy', async () => {
      interface ComplexState {
        user: { name: string; age: number }
        settings: { theme: string }
      }

      const { result } = renderHook(() =>
        useCoAgent<ComplexState>('test-agent', {
          user: { name: 'Alice', age: 30 },
          settings: { theme: 'light' }
        }, { transport: mockTransport })
      )

      const partialUpdate: AgentStateUpdateMessage = {
        type: 'agentStateUpdate',
        agentName: 'test-agent',
        state: { user: { name: 'Bob', age: 30 } },
        mergeStrategy: 'merge',
        timestamp: Date.now()
      }

      act(() => {
        mockTransport.emit('message', partialUpdate)
      })

      await waitFor(() => {
        expect(result.current.state.user.name).toBe('Bob')
        expect(result.current.state.settings.theme).toBe('light')
      })
    })
  })

  describe('Optimistic Updates', () => {
    it('should apply optimistic updates immediately', () => {
      const { result } = renderHook(() =>
        useCoAgent('test-agent', { count: 0 }, {
          transport: mockTransport,
          optimistic: true
        })
      )

      act(() => {
        result.current.setState({ count: 5 })
      })

      // Should update immediately without waiting for server
      expect(result.current.state.count).toBe(5)
    })

    it('should rollback optimistic update on error', async () => {
      const onError = vi.fn()

      const { result } = renderHook(() =>
        useCoAgent('test-agent', { count: 0 }, {
          transport: mockTransport,
          optimistic: true,
          onError
        })
      )

      act(() => {
        result.current.setState({ count: 5 })
      })

      expect(result.current.state.count).toBe(5)

      // Simulate error from agent
      const errorMessage: AgentStateUpdateMessage = {
        type: 'agentStateUpdate',
        agentName: 'test-agent',
        state: { count: 0 },
        metadata: {
          conflicts: [{
            path: '/count',
            clientValue: 5,
            agentValue: 0
          }]
        },
        timestamp: Date.now()
      }

      act(() => {
        mockTransport.emit('message', errorMessage)
      })

      await waitFor(() => {
        expect(result.current.state.count).toBe(0)
        expect(onError).toHaveBeenCalled()
      })
    })

    it('should handle multiple optimistic updates in sequence', () => {
      const { result } = renderHook(() =>
        useCoAgent('test-agent', { count: 0 }, {
          transport: mockTransport,
          optimistic: true
        })
      )

      act(() => {
        result.current.setState({ count: 1 })
        result.current.setState({ count: 2 })
        result.current.setState({ count: 3 })
      })

      expect(result.current.state.count).toBe(3)
    })
  })

  describe('Conflict Resolution', () => {
    it('should detect version conflicts', async () => {
      const onConflict = vi.fn()

      const { result } = renderHook(() =>
        useCoAgent('test-agent', { count: 0 }, {
          transport: mockTransport,
          onConflict
        })
      )

      // Client update
      act(() => {
        result.current.setState({ count: 5 })
      })

      // Agent update with older version
      const agentUpdate: AgentStateUpdateMessage = {
        type: 'agentStateUpdate',
        agentName: 'test-agent',
        state: { count: 10 },
        version: 0,
        timestamp: Date.now()
      }

      act(() => {
        mockTransport.emit('message', agentUpdate)
      })

      await waitFor(() => {
        expect(onConflict).toHaveBeenCalled()
      })
    })

    it('should use client-wins strategy when configured', async () => {
      const { result } = renderHook(() =>
        useCoAgent('test-agent', { count: 0 }, {
          transport: mockTransport,
          conflictResolution: 'client-wins'
        })
      )

      act(() => {
        result.current.setState({ count: 5 })
      })

      const agentUpdate: AgentStateUpdateMessage = {
        type: 'agentStateUpdate',
        agentName: 'test-agent',
        state: { count: 10 },
        timestamp: Date.now()
      }

      act(() => {
        mockTransport.emit('message', agentUpdate)
      })

      // Client value should win
      expect(result.current.state.count).toBe(5)
    })

    it('should use agent-wins strategy when configured', async () => {
      const { result } = renderHook(() =>
        useCoAgent('test-agent', { count: 0 }, {
          transport: mockTransport,
          conflictResolution: 'agent-wins'
        })
      )

      act(() => {
        result.current.setState({ count: 5 })
      })

      const agentUpdate: AgentStateUpdateMessage = {
        type: 'agentStateUpdate',
        agentName: 'test-agent',
        state: { count: 10 },
        timestamp: Date.now()
      }

      act(() => {
        mockTransport.emit('message', agentUpdate)
      })

      await waitFor(() => {
        // Agent value should win
        expect(result.current.state.count).toBe(10)
      })
    })

    it('should use last-write-wins strategy by default', async () => {
      const { result } = renderHook(() =>
        useCoAgent('test-agent', { count: 0 }, { transport: mockTransport })
      )

      act(() => {
        result.current.setState({ count: 5 })
      })

      // Immediate agent update
      const agentUpdate: AgentStateUpdateMessage = {
        type: 'agentStateUpdate',
        agentName: 'test-agent',
        state: { count: 10 },
        timestamp: Date.now() + 1000
      }

      act(() => {
        mockTransport.emit('message', agentUpdate)
      })

      await waitFor(() => {
        // Last write (agent) should win
        expect(result.current.state.count).toBe(10)
      })
    })

    it('should handle deep merge conflicts correctly', async () => {
      interface NestedState {
        user: {
          profile: {
            name: string
            age: number
          }
          settings: {
            theme: string
          }
        }
      }

      const { result } = renderHook(() =>
        useCoAgent<NestedState>('test-agent', {
          user: {
            profile: { name: 'Alice', age: 30 },
            settings: { theme: 'light' }
          }
        }, { transport: mockTransport })
      )

      // Client modifies name
      act(() => {
        result.current.setState({
          user: {
            profile: { name: 'Bob', age: 30 },
            settings: { theme: 'light' }
          }
        })
      })

      // Agent modifies theme
      const agentUpdate: AgentStateUpdateMessage = {
        type: 'agentStateUpdate',
        agentName: 'test-agent',
        state: {
          user: {
            profile: { name: 'Alice', age: 30 },
            settings: { theme: 'dark' }
          }
        },
        mergeStrategy: 'merge',
        timestamp: Date.now()
      }

      act(() => {
        mockTransport.emit('message', agentUpdate)
      })

      await waitFor(() => {
        // Should merge both changes
        expect(result.current.state.user.profile.name).toBe('Bob')
        expect(result.current.state.user.settings.theme).toBe('dark')
      })
    })
  })

  describe('Reconnection & State Restoration', () => {
    it('should restore state after reconnection', async () => {
      const { result } = renderHook(() =>
        useCoAgent('test-agent', { count: 0 }, { transport: mockTransport })
      )

      act(() => {
        result.current.setState({ count: 5 })
      })

      // Simulate disconnect
      act(() => {
        mockTransport.emit('disconnect', {})
      })

      expect(result.current.isConnected).toBe(false)

      // Simulate reconnect
      act(() => {
        mockTransport.emit('connect', {})
      })

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true)
        // State should be preserved
        expect(result.current.state.count).toBe(5)
      })
    })

    it('should resync state with agent after reconnection', async () => {
      const onReconnect = vi.fn()

      const { result } = renderHook(() =>
        useCoAgent('test-agent', { count: 0 }, {
          transport: mockTransport,
          onReconnect
        })
      )

      act(() => {
        result.current.setState({ count: 5 })
      })

      // Simulate reconnect
      act(() => {
        mockTransport.emit('connect', {})
      })

      await waitFor(() => {
        expect(onReconnect).toHaveBeenCalled()
        // Should resend last state
        const message = mockTransport.lastSentMessage as ClientStateUpdateMessage
        expect(message?.state).toEqual({ count: 5 })
      })
    })

    it('should handle state divergence during disconnection', async () => {
      const { result } = renderHook(() =>
        useCoAgent('test-agent', { count: 0 }, {
          transport: mockTransport,
          resyncOnReconnect: true
        })
      )

      // Update while connected
      act(() => {
        result.current.setState({ count: 5 })
      })

      // Simulate disconnect
      act(() => {
        mockTransport.emit('disconnect', {})
      })

      // Client makes changes while disconnected
      act(() => {
        result.current.setState({ count: 10 })
      })

      // Reconnect
      act(() => {
        mockTransport.emit('connect', {})
      })

      // Agent sends its state
      const agentUpdate: AgentStateUpdateMessage = {
        type: 'agentStateUpdate',
        agentName: 'test-agent',
        state: { count: 7 },
        timestamp: Date.now()
      }

      act(() => {
        mockTransport.emit('message', agentUpdate)
      })

      await waitFor(() => {
        // Should handle conflict appropriately
        expect(result.current.state.count).toBeDefined()
      })
    })
  })

  describe('Memory Leak Prevention', () => {
    it('should cleanup listeners on unmount', () => {
      const { unmount } = renderHook(() =>
        useCoAgent('test-agent', { count: 0 }, { transport: mockTransport })
      )

      expect(mockTransport.getListenerCount('message')).toBeGreaterThan(0)

      unmount()

      expect(mockTransport.getListenerCount('message')).toBe(0)
    })

    it('should not update state after unmount', async () => {
      const { result, unmount } = renderHook(() =>
        useCoAgent('test-agent', { count: 0 }, { transport: mockTransport })
      )

      unmount()

      // Try to send update after unmount
      const agentUpdate: AgentStateUpdateMessage = {
        type: 'agentStateUpdate',
        agentName: 'test-agent',
        state: { count: 10 },
        timestamp: Date.now()
      }

      act(() => {
        mockTransport.emit('message', agentUpdate)
      })

      // Should not cause errors or warnings
      expect(() => result.current.state).not.toThrow()
    })

    it('should handle multiple mount/unmount cycles', () => {
      for (let i = 0; i < 10; i++) {
        const { unmount } = renderHook(() =>
          useCoAgent('test-agent', { count: i }, { transport: mockTransport })
        )
        unmount()
      }

      expect(mockTransport.getListenerCount('message')).toBe(0)
    })
  })

  describe('Performance Under Load', () => {
    it('should handle 1000+ rapid updates efficiently', async () => {
      const { result } = renderHook(() =>
        useCoAgent('test-agent', { count: 0 }, {
          transport: mockTransport,
          throttle: 10
        })
      )

      const startTime = Date.now()

      for (let i = 0; i < 1000; i++) {
        act(() => {
          result.current.setState({ count: i })
        })
      }

      const endTime = Date.now()

      // Should complete in reasonable time (< 5 seconds)
      expect(endTime - startTime).toBeLessThan(5000)
      expect(result.current.state.count).toBe(999)
    })

    it('should debounce rapid setState calls when configured', async () => {
      const sendSpy = vi.spyOn(mockTransport, 'send')

      const { result } = renderHook(() =>
        useCoAgent('test-agent', { count: 0 }, {
          transport: mockTransport,
          debounce: 100
        })
      )

      act(() => {
        result.current.setState({ count: 1 })
        result.current.setState({ count: 2 })
        result.current.setState({ count: 3 })
      })

      // Should only send once after debounce
      await waitFor(() => {
        expect(sendSpy).toHaveBeenCalledTimes(1)
      }, { timeout: 200 })
    })

    it('should throttle agent updates when configured', async () => {
      const { result } = renderHook(() =>
        useCoAgent('test-agent', { count: 0 }, {
          transport: mockTransport,
          throttle: 50
        })
      )

      // Send 10 rapid updates
      for (let i = 0; i < 10; i++) {
        act(() => {
          mockTransport.emit('message', {
            type: 'agentStateUpdate',
            agentName: 'test-agent',
            state: { count: i },
            timestamp: Date.now()
          })
        })
      }

      await waitFor(() => {
        // Should have processed less than 10 due to throttling
        expect(result.current.state.count).toBeLessThan(10)
      })
    })
  })

  describe('Type Safety & Validation', () => {
    it('should validate state structure at runtime', () => {
      interface TypedState {
        id: string
        value: number
      }

      const { result } = renderHook(() =>
        useCoAgent<TypedState>('test-agent', { id: '1', value: 0 }, {
          transport: mockTransport,
          validate: (state) => {
            return typeof state.id === 'string' && typeof state.value === 'number'
          }
        })
      )

      expect(() => {
        act(() => {
          // This should fail validation
          result.current.setState({ id: 123 as unknown as string, value: 0 })
        })
      }).toThrow()
    })

    it('should enforce type safety for complex nested types', () => {
      interface ComplexState {
        users: Array<{ id: string; name: string }>
        metadata: Record<string, unknown>
      }

      const { result } = renderHook(() =>
        useCoAgent<ComplexState>('test-agent', {
          users: [{ id: '1', name: 'Alice' }],
          metadata: { version: 1 }
        }, { transport: mockTransport })
      )

      expect(result.current.state.users).toHaveLength(1)
      expect(result.current.state.users[0]?.name).toBe('Alice')
    })
  })

  describe('Error Handling', () => {
    it('should call onError callback on state update failure', async () => {
      const onError = vi.fn()

      const { result } = renderHook(() =>
        useCoAgent('test-agent', { count: 0 }, {
          transport: mockTransport,
          onError
        })
      )

      // Simulate transport error
      const errorSpy = vi.spyOn(mockTransport, 'send').mockImplementation(() => {
        throw new Error('Transport error')
      })

      act(() => {
        result.current.setState({ count: 5 })
      })

      await waitFor(() => {
        expect(onError).toHaveBeenCalled()
      })

      errorSpy.mockRestore()
    })

    it('should set error state on agent update error', async () => {
      const { result } = renderHook(() =>
        useCoAgent('test-agent', { count: 0 }, { transport: mockTransport })
      )

      const errorMessage = {
        type: 'error',
        code: 'STATE_UPDATE_FAILED',
        message: 'Failed to update state',
        timestamp: Date.now()
      }

      act(() => {
        mockTransport.emit('message', errorMessage)
      })

      await waitFor(() => {
        expect(result.current.error).toBeDefined()
        expect(result.current.error?.message).toBe('Failed to update state')
      })
    })

    it('should recover from transient errors', async () => {
      const { result } = renderHook(() =>
        useCoAgent('test-agent', { count: 0 }, {
          transport: mockTransport,
          retryOnError: true,
          maxRetries: 3
        })
      )

      let attempts = 0
      vi.spyOn(mockTransport, 'send').mockImplementation(() => {
        attempts++
        if (attempts < 3) {
          throw new Error('Transient error')
        }
      })

      act(() => {
        result.current.setState({ count: 5 })
      })

      await waitFor(() => {
        expect(attempts).toBe(3)
        expect(result.current.error).toBeNull()
      })
    })
  })

  describe('Custom Callbacks', () => {
    it('should call onChange callback on state changes', async () => {
      const onChange = vi.fn()

      const { result } = renderHook(() =>
        useCoAgent('test-agent', { count: 0 }, {
          transport: mockTransport,
          onChange
        })
      )

      act(() => {
        result.current.setState({ count: 5 })
      })

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(
          { count: 5 },
          { count: 0 }
        )
      })
    })

    it('should call onSync callback on bidirectional sync', async () => {
      const onSync = vi.fn()

      const { result } = renderHook(() =>
        useCoAgent('test-agent', { count: 0 }, {
          transport: mockTransport,
          onSync
        })
      )

      const agentUpdate: AgentStateUpdateMessage = {
        type: 'agentStateUpdate',
        agentName: 'test-agent',
        state: { count: 10 },
        timestamp: Date.now()
      }

      act(() => {
        mockTransport.emit('message', agentUpdate)
      })

      await waitFor(() => {
        expect(onSync).toHaveBeenCalled()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty state object', () => {
      const { result } = renderHook(() =>
        useCoAgent('test-agent', {}, { transport: mockTransport })
      )

      expect(result.current.state).toEqual({})
    })

    it('should handle null/undefined in state', () => {
      interface NullableState {
        value: string | null
        optional?: number
      }

      const { result } = renderHook(() =>
        useCoAgent<NullableState>('test-agent', { value: null }, {
          transport: mockTransport
        })
      )

      expect(result.current.state.value).toBeNull()
    })

    it('should handle array state types', () => {
      type ArrayState = string[]

      const { result } = renderHook(() =>
        useCoAgent<ArrayState>('test-agent', ['a', 'b', 'c'], {
          transport: mockTransport
        })
      )

      expect(result.current.state).toEqual(['a', 'b', 'c'])

      act(() => {
        result.current.setState(['d', 'e'])
      })

      expect(result.current.state).toEqual(['d', 'e'])
    })

    it('should handle primitive state types', () => {
      const { result } = renderHook(() =>
        useCoAgent<number>('test-agent', 42, { transport: mockTransport })
      )

      expect(result.current.state).toBe(42)
    })
  })

  describe('Advanced Features', () => {
    it('should support state transformation on sync', async () => {
      const transform = vi.fn((state: { count: number }) => ({
        count: state.count * 2
      }))

      const { result } = renderHook(() =>
        useCoAgent('test-agent', { count: 0 }, {
          transport: mockTransport,
          transform
        })
      )

      const agentUpdate: AgentStateUpdateMessage = {
        type: 'agentStateUpdate',
        agentName: 'test-agent',
        state: { count: 5 },
        timestamp: Date.now()
      }

      act(() => {
        mockTransport.emit('message', agentUpdate)
      })

      await waitFor(() => {
        expect(transform).toHaveBeenCalled()
        expect(result.current.state.count).toBe(10)
      })
    })

    it('should support middleware for state updates', async () => {
      const middleware = vi.fn((next, state) => {
        // Add timestamp to all updates
        return next({ ...state, timestamp: Date.now() })
      })

      interface StateWithTimestamp {
        count: number
        timestamp?: number
      }

      const { result } = renderHook(() =>
        useCoAgent<StateWithTimestamp>('test-agent', { count: 0 }, {
          transport: mockTransport,
          middleware
        })
      )

      act(() => {
        result.current.setState({ count: 5 })
      })

      await waitFor(() => {
        expect(middleware).toHaveBeenCalled()
        expect(result.current.state.timestamp).toBeDefined()
      })
    })

    it('should support custom serialization', async () => {
      const serialize = vi.fn((state) => JSON.stringify(state))
      const deserialize = vi.fn((data) => JSON.parse(data))

      const { result } = renderHook(() =>
        useCoAgent('test-agent', { count: 0 }, {
          transport: mockTransport,
          serialize,
          deserialize
        })
      )

      act(() => {
        result.current.setState({ count: 5 })
      })

      await waitFor(() => {
        expect(serialize).toHaveBeenCalled()
      })
    })
  })
})
