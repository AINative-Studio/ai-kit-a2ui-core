/**
 * Incremental Renderer for Progressive UI Updates
 *
 * Handles progressive rendering of components as they arrive
 * from streaming JSON parser. Updates UI in real-time as data
 * becomes available.
 *
 * @example
 * ```typescript
 * const renderer = new IncrementalRenderer({
 *   onPartialRender: (component) => {
 *     // Render partial component with loading state
 *   },
 *   onComponentUpdate: (id, component) => {
 *     // Update existing component with new data
 *   },
 *   onFinalize: (id, component) => {
 *     // Finalize component when complete
 *   }
 * })
 *
 * // Feed partial components as they arrive
 * renderer.renderPartial({ type: 'text', id: 't1' })
 * renderer.updateComponent('t1', { properties: { text: 'Hello' } })
 * renderer.finalizeComponent('t1', fullComponent)
 * ```
 */

import type { A2UIComponent } from '../types/components.js'

/**
 * Renderer callbacks
 */
export interface RendererCallbacks {
  /** Called when a partial component is first rendered */
  onPartialRender?: (partial: Partial<A2UIComponent>) => void

  /** Called when a component is updated with new data */
  onComponentUpdate?: (id: string, updates: Partial<A2UIComponent>) => void

  /** Called when a component is finalized (complete) */
  onFinalize?: (id: string, component: A2UIComponent) => void

  /** Called when a rendering error occurs */
  onError?: (id: string, error: Error) => void

  /** Called when rendering starts */
  onRenderStart?: (surfaceId: string) => void

  /** Called when all rendering is complete */
  onRenderComplete?: (surfaceId: string) => void
}

/**
 * Component state during progressive rendering
 */
export interface ComponentState {
  /** Component ID */
  id: string

  /** Current partial component */
  partial: Partial<A2UIComponent>

  /** Component status */
  status: 'pending' | 'rendering' | 'complete' | 'error'

  /** Timestamp when first seen */
  firstSeen: number

  /** Timestamp when last updated */
  lastUpdated: number

  /** Timestamp when finalized (if complete) */
  finalized?: number

  /** Number of updates received */
  updateCount: number

  /** Errors encountered */
  errors: Error[]
}

/**
 * Render metrics
 */
export interface RenderMetrics {
  /** Total components processed */
  totalComponents: number

  /** Components currently rendering */
  renderingComponents: number

  /** Completed components */
  completedComponents: number

  /** Failed components */
  failedComponents: number

  /** Average time to first render (ms) */
  avgTimeToFirstRender: number

  /** Average time to completion (ms) */
  avgTimeToCompletion: number

  /** Total updates processed */
  totalUpdates: number
}

/**
 * Incremental Renderer Options
 */
export interface RendererOptions extends RendererCallbacks {
  /** Maximum time to wait for component completion (ms) */
  timeout?: number

  /** Enable debug logging */
  debug?: boolean

  /** Automatically finalize components after timeout */
  autoFinalize?: boolean
}

/**
 * Incremental Renderer
 *
 * Manages progressive rendering of UI components as they
 * arrive from streaming JSON parser.
 */
export class IncrementalRenderer {
  private components = new Map<string, ComponentState>()
  private callbacks: RendererCallbacks
  private options: Required<Omit<RendererOptions, keyof RendererCallbacks>>
  private renderStartTime: number | null = null
  private currentSurfaceId: string | null = null

  constructor(options: RendererOptions = {}) {
    this.callbacks = {
      onPartialRender: options.onPartialRender,
      onComponentUpdate: options.onComponentUpdate,
      onFinalize: options.onFinalize,
      onError: options.onError,
      onRenderStart: options.onRenderStart,
      onRenderComplete: options.onRenderComplete
    }

    this.options = {
      timeout: options.timeout ?? 30000, // 30 seconds default
      debug: options.debug ?? false,
      autoFinalize: options.autoFinalize ?? true
    }
  }

  /**
   * Start progressive rendering session
   *
   * @param surfaceId - Surface being rendered
   */
  startRendering(surfaceId: string): void {
    this.currentSurfaceId = surfaceId
    this.renderStartTime = Date.now()
    this.callbacks.onRenderStart?.(surfaceId)
    this.log(`Started rendering surface: ${surfaceId}`)
  }

  /**
   * Render partial component as it arrives
   *
   * @param partial - Partial component data
   */
  renderPartial(partial: Partial<A2UIComponent>): void {
    if (!partial.id) {
      this.logError('Cannot render partial without component ID')
      return
    }

    const now = Date.now()
    let state = this.components.get(partial.id)

    if (!state) {
      // New component
      state = {
        id: partial.id,
        partial,
        status: 'rendering',
        firstSeen: now,
        lastUpdated: now,
        updateCount: 1,
        errors: []
      }

      this.components.set(partial.id, state)
      this.callbacks.onPartialRender?.(partial)
      this.log(`Rendering partial component: ${partial.id}`)
    } else {
      // Update existing partial
      state.partial = { ...state.partial, ...partial }
      state.lastUpdated = now
      state.updateCount++

      this.callbacks.onComponentUpdate?.(partial.id, partial)
      this.log(`Updated component: ${partial.id} (update #${state.updateCount})`)
    }

    // Check for timeout
    if (this.options.autoFinalize && now - state.firstSeen > this.options.timeout) {
      this.log(`Component ${partial.id} timeout, auto-finalizing`)
      this.autoFinalizeComponent(partial.id)
    }
  }

  /**
   * Update component with new data
   *
   * @param id - Component ID
   * @param updates - Partial updates
   */
  updateComponent(id: string, updates: Partial<A2UIComponent>): void {
    const state = this.components.get(id)

    if (!state) {
      // Component not seen yet, treat as new partial
      this.renderPartial({ id, ...updates })
      return
    }

    if (state.status === 'complete') {
      this.logError(`Cannot update completed component: ${id}`)
      return
    }

    const now = Date.now()
    state.partial = { ...state.partial, ...updates }
    state.lastUpdated = now
    state.updateCount++

    this.callbacks.onComponentUpdate?.(id, updates)
    this.log(`Updated component: ${id} (update #${state.updateCount})`)
  }

  /**
   * Finalize component when complete
   *
   * @param id - Component ID
   * @param component - Complete component
   */
  finalizeComponent(id: string, component: A2UIComponent): void {
    const state = this.components.get(id)

    if (!state) {
      this.logError(`Cannot finalize unknown component: ${id}`)
      return
    }

    if (state.status === 'complete') {
      this.log(`Component ${id} already finalized, skipping`)
      return
    }

    const now = Date.now()
    state.partial = component
    state.status = 'complete'
    state.finalized = now
    state.lastUpdated = now

    this.callbacks.onFinalize?.(id, component)
    this.log(`Finalized component: ${id} (${state.updateCount} updates, ${now - state.firstSeen}ms)`)

    // Check if all components are complete
    this.checkRenderComplete()
  }

  /**
   * Handle rendering error
   *
   * @param id - Component ID
   * @param error - Error that occurred
   */
  handleError(id: string, error: Error): void {
    const state = this.components.get(id)

    if (!state) {
      this.logError(`Error for unknown component: ${id}`)
      return
    }

    state.status = 'error'
    state.errors.push(error)

    this.callbacks.onError?.(id, error)
    this.logError(`Error rendering component ${id}: ${error.message}`)
  }

  /**
   * Complete rendering session
   */
  completeRendering(): void {
    if (!this.currentSurfaceId) {
      return
    }

    // Auto-finalize any pending components
    if (this.options.autoFinalize) {
      for (const [id, state] of this.components.entries()) {
        if (state.status === 'rendering') {
          this.log(`Auto-finalizing pending component: ${id}`)
          this.autoFinalizeComponent(id)
        }
      }
    }

    this.callbacks.onRenderComplete?.(this.currentSurfaceId)
    this.log(`Completed rendering surface: ${this.currentSurfaceId}`)
    this.logMetrics()
  }

  /**
   * Get component state
   *
   * @param id - Component ID
   * @returns Component state or undefined
   */
  getComponentState(id: string): ComponentState | undefined {
    return this.components.get(id)
  }

  /**
   * Get all component states
   *
   * @returns Map of all component states
   */
  getAllStates(): Map<string, ComponentState> {
    return new Map(this.components)
  }

  /**
   * Get rendering metrics
   *
   * @returns Current metrics
   */
  getMetrics(): RenderMetrics {
    const states = Array.from(this.components.values())

    const rendering = states.filter((s) => s.status === 'rendering').length
    const completed = states.filter((s) => s.status === 'complete').length
    const failed = states.filter((s) => s.status === 'error').length

    const completedStates = states.filter((s) => s.status === 'complete' && s.finalized)
    const avgTimeToCompletion = completedStates.length > 0
      ? completedStates.reduce((sum, s) => sum + ((s.finalized ?? 0) - s.firstSeen), 0) / completedStates.length
      : 0

    const avgTimeToFirstRender = states.length > 0
      ? states.reduce((sum, s) => sum + (s.lastUpdated - s.firstSeen), 0) / states.length
      : 0

    const totalUpdates = states.reduce((sum, s) => sum + s.updateCount, 0)

    return {
      totalComponents: states.length,
      renderingComponents: rendering,
      completedComponents: completed,
      failedComponents: failed,
      avgTimeToFirstRender,
      avgTimeToCompletion,
      totalUpdates
    }
  }

  /**
   * Reset renderer state
   */
  reset(): void {
    this.components.clear()
    this.renderStartTime = null
    this.currentSurfaceId = null
    this.log('Renderer reset')
  }

  /**
   * Auto-finalize component (best-effort)
   */
  private autoFinalizeComponent(id: string): void {
    const state = this.components.get(id)
    if (!state) return

    // Check if partial is complete enough to be a valid component
    const partial = state.partial
    if (partial.type && partial.id) {
      // Attempt to finalize with what we have
      const component = partial as A2UIComponent
      this.finalizeComponent(id, component)
    } else {
      // Mark as error if not enough data
      this.handleError(id, new Error('Component timeout: insufficient data'))
    }
  }

  /**
   * Check if all components are complete
   */
  private checkRenderComplete(): void {
    const allComplete = Array.from(this.components.values()).every(
      (state) => state.status === 'complete' || state.status === 'error'
    )

    if (allComplete && this.currentSurfaceId) {
      this.completeRendering()
    }
  }

  /**
   * Log debug message
   */
  private log(message: string): void {
    if (this.options.debug) {
      console.log(`[IncrementalRenderer] ${message}`)
    }
  }

  /**
   * Log error message
   */
  private logError(message: string): void {
    if (this.options.debug) {
      console.error(`[IncrementalRenderer] ${message}`)
    }
  }

  /**
   * Log rendering metrics
   */
  private logMetrics(): void {
    if (!this.options.debug) return

    const metrics = this.getMetrics()
    console.log('[IncrementalRenderer] Metrics:', {
      total: metrics.totalComponents,
      completed: metrics.completedComponents,
      failed: metrics.failedComponents,
      avgTimeToFirstRender: `${metrics.avgTimeToFirstRender.toFixed(2)}ms`,
      avgTimeToCompletion: `${metrics.avgTimeToCompletion.toFixed(2)}ms`,
      totalUpdates: metrics.totalUpdates
    })
  }
}

/**
 * Create a new incremental renderer instance
 *
 * @param options - Renderer options and callbacks
 * @returns New renderer instance
 */
export function createIncrementalRenderer(options?: RendererOptions): IncrementalRenderer {
  return new IncrementalRenderer(options)
}
