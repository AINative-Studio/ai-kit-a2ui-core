/**
 * A2UI Provider Context
 * Wraps the A2UI transport layer and provides state to React components
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { A2UITransport } from '@ainative/ai-kit-a2ui-core/transport'
import type {
  A2UIContextValue,
  A2UIProviderProps,
  Surface,
  SurfaceId,
  A2UIComponent,
  CreateSurfaceMessage,
  UpdateComponentsMessage,
  UpdateDataModelMessage,
  TransportStatus,
  DataModel,
} from '../types/index.js'

/**
 * A2UI React Context
 */
export const A2UIContext = createContext<A2UIContextValue | null>(null)

/**
 * Hook to access A2UI context
 * @throws {Error} If used outside of A2UIProvider
 */
export function useA2UIContext(): A2UIContextValue {
  const context = useContext(A2UIContext)
  if (!context) {
    throw new Error('useA2UIContext must be used within an A2UIProvider')
  }
  return context
}

/**
 * A2UI Provider Component
 * Manages WebSocket connection and surfaces state
 *
 * @example
 * ```tsx
 * <A2UIProvider url="wss://api.example.com/agent" autoConnect>
 *   <YourApp />
 * </A2UIProvider>
 * ```
 */
export function A2UIProvider({
  url,
  options,
  autoConnect = true,
  children,
  onError,
  onConnect,
  onDisconnect,
}: A2UIProviderProps): JSX.Element {
  const [surfaces, setSurfaces] = useState<Map<SurfaceId, Surface>>(new Map())
  const [isConnected, setIsConnected] = useState(false)
  const transportRef = useRef<A2UITransport | null>(null)
  const isMountedRef = useRef(true)

  // Initialize transport
  useEffect(() => {
    isMountedRef.current = true

    const transport = new A2UITransport(url, {
      autoReconnect: options?.autoReconnect ?? true,
      reconnectDelay: options?.reconnectDelay ?? 3000,
      maxReconnectAttempts: options?.maxReconnectAttempts ?? 5,
      pingInterval: options?.pingInterval ?? 30000,
      pongTimeout: options?.pongTimeout ?? 5000,
    })

    transportRef.current = transport

    // Status change handler
    const handleStatusChange = (status: TransportStatus) => {
      if (!isMountedRef.current) return

      setIsConnected(status === 'connected')

      if (status === 'connected') {
        onConnect?.()
      } else if (status === 'disconnected') {
        onDisconnect?.()
      } else if (status === 'error') {
        onError?.(new Error('Transport error'))
      }
    }

    // Error handler
    const handleError = (error: Error) => {
      if (!isMountedRef.current) return
      onError?.(error)
    }

    // Create surface handler
    const handleCreateSurface = (message: CreateSurfaceMessage) => {
      if (!isMountedRef.current) return

      setSurfaces((prev) => {
        const next = new Map(prev)
        next.set(message.surfaceId, {
          surfaceId: message.surfaceId,
          components: message.components,
          dataModel: message.dataModel,
        })
        return next
      })
    }

    // Update components handler
    const handleUpdateComponents = (message: UpdateComponentsMessage) => {
      if (!isMountedRef.current) return

      setSurfaces((prev) => {
        const surface = prev.get(message.surfaceId)
        if (!surface) return prev

        const next = new Map(prev)

        // Apply component updates
        const updatedComponents = surface.components.map((component) => {
          const update = message.updates?.find((u) => u.id === component.id)
          if (update && update.component) {
            // Replace or merge component based on operation
            if (update.operation === 'update') {
              return {
                ...component,
                ...update.component,
                properties: { ...component.properties, ...update.component.properties },
              }
            } else if (update.operation === 'add') {
              return update.component
            }
          }
          return component
        }).filter((component) => {
          // Remove components marked for removal
          const update = message.updates?.find((u) => u.id === component.id)
          return !update || update.operation !== 'remove'
        })

        next.set(message.surfaceId, {
          ...surface,
          components: updatedComponents,
        })
        return next
      })
    }

    // Update data model handler
    const handleUpdateDataModel = (message: UpdateDataModelMessage) => {
      if (!isMountedRef.current) return

      setSurfaces((prev) => {
        const surface = prev.get(message.surfaceId)
        if (!surface) return prev

        const next = new Map(prev)
        const updatedDataModel = { ...surface.dataModel } as DataModel

        // Apply data updates using JSON pointer paths
        if (message.updates) {
          for (const update of message.updates) {
            applyDataUpdate(updatedDataModel, update.path, update.value)
          }
        }

        next.set(message.surfaceId, {
          ...surface,
          dataModel: updatedDataModel,
        })
        return next
      })
    }

    // Delete surface handler
    const handleDeleteSurface = (message: { surfaceId: SurfaceId }) => {
      if (!isMountedRef.current) return

      setSurfaces((prev) => {
        const next = new Map(prev)
        next.delete(message.surfaceId)
        return next
      })
    }

    // Register event handlers
    transport.on('statusChange', handleStatusChange)
    transport.on('error', handleError)
    transport.on('createSurface', handleCreateSurface)
    transport.on('updateComponents', handleUpdateComponents)
    transport.on('updateDataModel', handleUpdateDataModel)
    transport.on('deleteSurface', handleDeleteSurface)

    // Auto-connect if specified
    if (autoConnect) {
      transport.connect().catch((err) => {
        if (isMountedRef.current) {
          onError?.(err as Error)
        }
      })
    }

    // Cleanup
    return () => {
      isMountedRef.current = false
      transport.off('statusChange', handleStatusChange)
      transport.off('error', handleError)
      transport.off('createSurface', handleCreateSurface)
      transport.off('updateComponents', handleUpdateComponents)
      transport.off('updateDataModel', handleUpdateDataModel)
      transport.off('deleteSurface', handleDeleteSurface)
      transport.disconnect()
    }
  }, [url, options, autoConnect, onError, onConnect, onDisconnect])

  // Get surface by ID
  const getSurface = useCallback(
    (surfaceId: SurfaceId): Surface | undefined => {
      return surfaces.get(surfaceId)
    },
    [surfaces]
  )

  // Get component by ID
  const getComponent = useCallback(
    (surfaceId: SurfaceId, componentId: string): A2UIComponent | undefined => {
      const surface = surfaces.get(surfaceId)
      if (!surface) return undefined
      return surface.components.find((c) => c.id === componentId)
    },
    [surfaces]
  )

  const contextValue: A2UIContextValue = {
    transport: transportRef.current!,
    surfaces,
    isConnected,
    getSurface,
    getComponent,
  }

  return <A2UIContext.Provider value={contextValue}>{children}</A2UIContext.Provider>
}

/**
 * Apply a data update using JSON pointer path
 * @param obj - Target object to update
 * @param path - JSON pointer path (e.g., "/user/name")
 * @param value - New value to set
 */
function applyDataUpdate(obj: DataModel, path: string, value: unknown): void {
  if (!path || path === '/') {
    // Root update - merge values
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(obj, value)
    }
    return
  }

  // Remove leading slash and split path
  const parts = path.slice(1).split('/').filter((part) => part.length > 0)
  if (parts.length === 0) return

  let current: DataModel = obj

  // Navigate to parent
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    if (!part) continue
    if (!(part in current)) {
      current[part] = {}
    }
    current = current[part] as DataModel
  }

  // Set value at final key
  const lastKey = parts[parts.length - 1]
  if (lastKey) {
    current[lastKey] = value
  }
}
