import { useState, useEffect, useCallback, useRef } from 'react'
import { A2UITransport } from '@ainative/ai-kit-a2ui-core/transport'
import type {
  A2UIComponent,
  UserActionMessage
} from '@ainative/ai-kit-a2ui-core/types'

// DataModel type for this hook
export type DataModel = Record<string, unknown>

// SurfaceId type
export type SurfaceId = string

export interface UseA2UIAgentOptions {
  url: string
  autoConnect?: boolean
  reconnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

export interface Surface {
  id: SurfaceId
  components: A2UIComponent[]
  dataModel?: DataModel
}

export interface UseA2UIAgentReturn {
  surfaces: Map<SurfaceId, Surface>
  send: (action: Omit<UserActionMessage, 'type'>) => void
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  isConnected: boolean
  isConnecting: boolean
  error: Error | null
}

/**
 * Hook for managing A2UI agent connections and surfaces
 * 
 * @example
 * ```tsx
 * const agent = useA2UIAgent({
 *   url: 'wss://api.example.com/agent',
 *   autoConnect: true
 * })
 * 
 * // Access surfaces
 * const chatSurface = agent.surfaces.get('chat-1')
 * 
 * // Send user action
 * agent.send({
 *   surfaceId: 'chat-1',
 *   action: 'send-message',
 *   context: { message: 'Hello!' }
 * })
 * ```
 */
export function useA2UIAgent(options: UseA2UIAgentOptions): UseA2UIAgentReturn {
  const [surfaces, setSurfaces] = useState<Map<SurfaceId, Surface>>(new Map())
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  const transportRef = useRef<A2UITransport | null>(null)

  // Initialize transport
  useEffect(() => {
    const transport = new A2UITransport(options.url, {
      autoReconnect: options.reconnect ?? true,
      reconnectDelay: options.reconnectInterval ?? 3000,
      maxReconnectAttempts: options.maxReconnectAttempts ?? 5
    })

    transportRef.current = transport

    // Status change handler
    transport.on('statusChange', (data) => {
      const status = data as string
      setIsConnecting(status === 'connecting' || status === 'reconnecting')
      setIsConnected(status === 'connected')
      if (status === 'error') {
        setError(new Error('Transport error'))
      }
    })

    // Error handler
    transport.on('error', (data) => {
      const err = data as Error
      setError(err)
    })

    // Create surface handler
    transport.on('createSurface', (data) => {
      const message = data as { surfaceId: string; components: A2UIComponent[]; dataModel?: DataModel }
      setSurfaces((prev) => {
        const next = new Map(prev)
        next.set(message.surfaceId, {
          id: message.surfaceId,
          components: message.components,
          dataModel: message.dataModel
        })
        return next
      })
    })

    // Update components handler
    transport.on('updateComponents', (data) => {
      const message = data as {
        surfaceId: string
        updates?: Array<{
          id: string
          operation: 'add' | 'update' | 'remove'
          component?: A2UIComponent
        }>
      }
      setSurfaces((prev) => {
        const surface = prev.get(message.surfaceId)
        if (!surface) return prev

        const next = new Map(prev)
        const updatedComponents = surface.components.map((component) => {
          const update = message.updates?.find((u: { id: string }) => u.id === component.id)
          if (update && update.component) {
            return update.component
          }
          return component
        })

        next.set(message.surfaceId, {
          ...surface,
          components: updatedComponents
        })
        return next
      })
    })

    // Auto-connect if specified
    if (options.autoConnect) {
      transport.connect().catch((err) => {
        setError(err as Error)
      })
    }

    // Cleanup
    return () => {
      transport.disconnect()
    }
  }, [options.url, options.autoConnect, options.reconnect, options.reconnectInterval, options.maxReconnectAttempts])

  // Send user action
  const send = useCallback((action: Omit<UserActionMessage, 'type'>) => {
    if (!transportRef.current) {
      throw new Error('Transport not initialized')
    }

    transportRef.current.send({
      type: 'userAction',
      ...action
    })
  }, [])

  // Connect to agent
  const connect = useCallback(async () => {
    if (!transportRef.current) {
      throw new Error('Transport not initialized')
    }
    await transportRef.current.connect()
  }, [])

  // Disconnect from agent
  const disconnect = useCallback(async () => {
    if (!transportRef.current) {
      throw new Error('Transport not initialized')
    }
    transportRef.current.disconnect()
  }, [])

  return {
    surfaces,
    send,
    connect,
    disconnect,
    isConnected,
    isConnecting,
    error
  }
}
