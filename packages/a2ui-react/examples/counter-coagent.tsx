/**
 * CoAgent Counter Example
 * Demonstrates bidirectional state synchronization between UI and AI agent
 *
 * This example shows:
 * - UI updates syncing to agent in real-time
 * - Agent modifications streaming back to UI
 * - Optimistic updates with rollback on error
 * - Conflict resolution strategies
 * - Reconnection handling
 */

import React, { useState } from 'react'
import { useCoAgent } from '../src/hooks/useCoAgent'
import type { CoAgentTransport } from '../src/types/coagent'

// Mock transport for demo (replace with real WebSocket transport)
class MockTransport implements CoAgentTransport {
  private listeners = new Map<string, Set<(data: unknown) => void>>()
  private simulateAgentDelay = 500 // ms

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
    console.log('[Transport] Sending to agent:', message)

    // Simulate agent processing and response
    setTimeout(() => {
      const msg = message as { type: string; agentName: string; state: { count?: number } }

      if (msg.type === 'clientStateUpdate') {
        // Simulate agent acknowledging and potentially modifying state
        const currentCount = msg.state.count ?? 0
        const agentModifiedCount = currentCount + Math.floor(Math.random() * 3) // Agent adds 0-2

        this.emit('message', {
          type: 'agentStateUpdate',
          agentName: msg.agentName,
          state: { count: agentModifiedCount },
          timestamp: Date.now()
        })
      }
    }, this.simulateAgentDelay)
  }

  emit(event: string, data: unknown): void {
    console.log('[Transport] Received from agent:', data)
    this.listeners.get(event)?.forEach(handler => handler(data))
  }

  isConnected(): boolean {
    return true
  }

  close(): void {
    this.listeners.clear()
  }
}

interface CounterState {
  count: number
  lastModifiedBy?: 'client' | 'agent'
  lastModifiedAt?: number
}

export function CoAgentCounter() {
  const transport = useState(() => new MockTransport())[0]

  const {
    state,
    setState,
    isConnected,
    error,
    version
  } = useCoAgent<CounterState>('counter-agent',
    { count: 0 },
    {
      transport,
      optimistic: true, // Enable optimistic updates
      conflictResolution: 'last-write-wins', // How to handle conflicts
      onSync: (direction, newState) => {
        console.log(`[Sync] ${direction}:`, newState)
      },
      onChange: (newState, oldState) => {
        console.log('[State] Changed:', { old: oldState, new: newState })
      },
      onConflict: (conflict) => {
        console.warn('[Conflict] Detected:', conflict)
      },
      onError: (error) => {
        console.error('[Error]:', error)
      }
    }
  )

  const increment = () => {
    setState({
      count: state.count + 1,
      lastModifiedBy: 'client',
      lastModifiedAt: Date.now()
    })
  }

  const decrement = () => {
    setState({
      count: state.count - 1,
      lastModifiedBy: 'client',
      lastModifiedAt: Date.now()
    })
  }

  const reset = () => {
    setState({
      count: 0,
      lastModifiedBy: 'client',
      lastModifiedAt: Date.now()
    })
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>CoAgent Counter Example</h1>

      <div style={{ marginBottom: '20px' }}>
        <div style={{
          padding: '10px',
          background: isConnected ? '#d4edda' : '#f8d7da',
          border: `1px solid ${isConnected ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '4px'
        }}>
          Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'} | Version: {version}
        </div>
      </div>

      {error && (
        <div style={{
          padding: '10px',
          marginBottom: '20px',
          background: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '4px'
        }}>
          ⚠️ Error: {error.message}
        </div>
      )}

      <div style={{
        fontSize: '48px',
        fontWeight: 'bold',
        margin: '40px 0',
        textAlign: 'center'
      }}>
        {state.count}
      </div>

      <div style={{
        display: 'flex',
        gap: '10px',
        justifyContent: 'center',
        marginBottom: '20px'
      }}>
        <button
          onClick={decrement}
          style={{
            padding: '10px 20px',
            fontSize: '18px',
            cursor: 'pointer',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          - Decrement
        </button>

        <button
          onClick={reset}
          style={{
            padding: '10px 20px',
            fontSize: '18px',
            cursor: 'pointer',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Reset
        </button>

        <button
          onClick={increment}
          style={{
            padding: '10px 20px',
            fontSize: '18px',
            cursor: 'pointer',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          + Increment
        </button>
      </div>

      <div style={{
        padding: '15px',
        background: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        fontSize: '14px'
      }}>
        <h3>State Details</h3>
        <pre style={{ margin: 0 }}>
          {JSON.stringify(state, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: '30px', fontSize: '14px', color: '#6c757d' }}>
        <h3>How it works:</h3>
        <ul>
          <li><strong>Bidirectional Sync</strong>: UI changes instantly sync to the agent, and agent modifications stream back</li>
          <li><strong>Optimistic Updates</strong>: UI updates immediately, then confirms with agent</li>
          <li><strong>Conflict Resolution</strong>: Uses "last-write-wins" strategy to handle simultaneous updates</li>
          <li><strong>Type Safe</strong>: Full TypeScript support with state inference</li>
          <li><strong>Agent Intelligence</strong>: Notice how the agent sometimes adds extra value to your increments!</li>
        </ul>
      </div>
    </div>
  )
}

export default CoAgentCounter
