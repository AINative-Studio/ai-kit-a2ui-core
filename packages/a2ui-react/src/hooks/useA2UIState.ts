/**
 * useA2UIState Hook
 * Read and subscribe to data model state using JSON pointer paths
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useA2UIContext } from '../context/index.js'
import type { UseA2UIStateReturn, SurfaceId } from '../types/index.js'

/**
 * Hook for reading and subscribing to data model state
 *
 * @template T - Type of the value at the JSON pointer path
 * @param surfaceId - ID of the surface to read from
 * @param path - JSON pointer path (e.g., "/user/name" or "/items/0")
 * @returns Current value, loading state, and refresh function
 *
 * @example
 * ```tsx
 * const { value, isLoading, error } = useA2UIState<string>('chat-1', '/user/name')
 * const { value: items } = useA2UIState<Item[]>('chat-1', '/items')
 * ```
 */
export function useA2UIState<T = unknown>(
  surfaceId: SurfaceId,
  path: string
): UseA2UIStateReturn<T> {
  const { surfaces, getSurface } = useA2UIContext()
  const [value, setValue] = useState<T | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const isMountedRef = useRef(true)

  // Extract value from data model using JSON pointer
  const extractValue = useCallback((): T | undefined => {
    try {
      const surface = getSurface(surfaceId)
      if (!surface || !surface.dataModel) {
        return undefined
      }

      // Handle root path
      if (path === '/' || path === '') {
        return surface.dataModel as T
      }

      // Remove leading slash and split path
      const parts = path.slice(1).split('/')
      let current: unknown = surface.dataModel

      // Navigate through the path
      for (const part of parts) {
        if (current === null || current === undefined) {
          return undefined
        }

        if (typeof current !== 'object') {
          return undefined
        }

        // Handle array indices
        if (Array.isArray(current)) {
          const index = parseInt(part, 10)
          if (isNaN(index) || index < 0 || index >= current.length) {
            return undefined
          }
          current = current[index]
        } else {
          current = (current as Record<string, unknown>)[part]
        }
      }

      return current as T
    } catch (err) {
      if (isMountedRef.current) {
        setError(
          err instanceof Error ? err : new Error('Failed to extract value from data model')
        )
      }
      return undefined
    }
  }, [surfaceId, path, getSurface])

  // Update value when surfaces change
  useEffect(() => {
    isMountedRef.current = true

    try {
      const newValue = extractValue()
      if (isMountedRef.current) {
        setValue(newValue)
        setIsLoading(false)
        setError(null)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error('Failed to read state'))
        setIsLoading(false)
      }
    }

    return () => {
      isMountedRef.current = false
    }
  }, [surfaces, surfaceId, path, extractValue])

  // Manually refresh value
  const refresh = useCallback(() => {
    if (!isMountedRef.current) return

    setIsLoading(true)
    setError(null)

    try {
      const newValue = extractValue()
      if (isMountedRef.current) {
        setValue(newValue)
        setIsLoading(false)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error('Failed to refresh state'))
        setIsLoading(false)
      }
    }
  }, [extractValue])

  return {
    value,
    isLoading,
    error,
    refresh,
  }
}
