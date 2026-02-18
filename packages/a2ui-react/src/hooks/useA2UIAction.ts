/**
 * useA2UIAction Hook
 * Execute user actions and send them to the agent
 */

import { useState, useCallback, useRef } from 'react'
import { useA2UIContext } from '../context/index.js'
import type { UseA2UIActionReturn, SurfaceId, UserActionMessage } from '../types/index.js'

/**
 * Hook for executing user actions
 *
 * @param surfaceId - ID of the surface to send actions from
 * @returns executeAction function and loading/error state
 *
 * @example
 * ```tsx
 * const { executeAction, isLoading, error } = useA2UIAction('chat-1')
 *
 * // Execute action on button click
 * <button onClick={() => executeAction('send-button', 'click', { message: 'Hello!' })}>
 *   Send
 * </button>
 * ```
 */
export function useA2UIAction(surfaceId: SurfaceId): UseA2UIActionReturn {
  const { transport, isConnected } = useA2UIContext()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const isMountedRef = useRef(true)
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /**
   * Execute a user action
   *
   * @param componentId - ID of the component that triggered the action
   * @param event - Event type (e.g., 'click', 'change', 'submit')
   * @param data - Optional action data
   */
  const executeAction = useCallback(
    (componentId: string, event: string, data?: Record<string, unknown>) => {
      if (!isMountedRef.current) return

      // Check connection
      if (!isConnected) {
        const connectionError = new Error('Cannot execute action: not connected to agent')
        setError(connectionError)
        return
      }

      // Clear previous error
      setError(null)
      setIsLoading(true)

      // Set a timeout to reset loading state (in case no response is received)
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
      loadingTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setIsLoading(false)
        }
      }, 5000) // 5 second timeout

      try {
        // Create user action message
        const message: UserActionMessage = {
          type: 'userAction',
          surfaceId,
          componentId,
          action: event,
          context: data || {},
          timestamp: Date.now(),
        }

        // Send message via transport
        transport.send(message)

        // Reset loading state after a short delay
        setTimeout(() => {
          if (isMountedRef.current) {
            setIsLoading(false)
          }
        }, 100)
      } catch (err) {
        if (isMountedRef.current) {
          const actionError =
            err instanceof Error ? err : new Error('Failed to execute action')
          setError(actionError)
          setIsLoading(false)
        }
      }
    },
    [surfaceId, transport, isConnected]
  )

  /**
   * Clear current error
   */
  const clearError = useCallback(() => {
    if (isMountedRef.current) {
      setError(null)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
    }
  }, [])

  return {
    executeAction,
    isLoading,
    error,
    clearError,
  }
}

// Import useEffect
import { useEffect } from 'react'
