/**
 * useA2UI - Base hook for accessing A2UI context
 *
 * Provides convenient access to the A2UI context value, exposing
 * transport, surfaces, connection status, and surface/component accessors.
 * Must be used within an A2UIProvider tree.
 */

import { useA2UIContext } from '../context/index.js'
import type { A2UIContextValue } from '../types/index.js'

/**
 * Base hook for accessing the A2UI context.
 *
 * @returns The full A2UI context value
 * @throws {Error} If called outside of an A2UIProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isConnected, surfaces, getSurface } = useA2UI()
 *
 *   if (!isConnected) return <p>Connecting...</p>
 *
 *   const chat = getSurface('chat-1')
 *   return <div>{chat?.components.length} components loaded</div>
 * }
 * ```
 */
export function useA2UI(): A2UIContextValue {
  return useA2UIContext()
}
