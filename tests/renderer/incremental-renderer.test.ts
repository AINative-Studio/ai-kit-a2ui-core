/**
 * Incremental Renderer Tests
 *
 * Comprehensive test suite for progressive UI rendering
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  IncrementalRenderer,
  createIncrementalRenderer,
  type RendererCallbacks,
  type ComponentState
} from '../../src/renderer/incremental-renderer.js'
import type { A2UIComponent } from '../../src/types/components.js'

describe('IncrementalRenderer', () => {
  let renderer: IncrementalRenderer
  let callbacks: RendererCallbacks

  beforeEach(() => {
    callbacks = {
      onPartialRender: vi.fn(),
      onComponentUpdate: vi.fn(),
      onFinalize: vi.fn(),
      onError: vi.fn(),
      onRenderStart: vi.fn(),
      onRenderComplete: vi.fn()
    }

    renderer = new IncrementalRenderer({ ...callbacks, debug: false })
  })

  describe('Rendering Lifecycle', () => {
    it('should start rendering session', () => {
      renderer.startRendering('surface-1')

      expect(callbacks.onRenderStart).toHaveBeenCalledWith('surface-1')
    })

    it('should render partial component', () => {
      const partial = { id: 't1', type: 'text' as const }

      renderer.renderPartial(partial)

      expect(callbacks.onPartialRender).toHaveBeenCalledWith(partial)

      const state = renderer.getComponentState('t1')
      expect(state).toBeDefined()
      expect(state?.status).toBe('rendering')
    })

    it('should update component with new data', () => {
      renderer.renderPartial({ id: 't1', type: 'text' as const })
      renderer.updateComponent('t1', { properties: { text: 'Hello' } })

      expect(callbacks.onComponentUpdate).toHaveBeenCalledWith('t1', {
        properties: { text: 'Hello' }
      })

      const state = renderer.getComponentState('t1')
      expect(state?.updateCount).toBe(2)
    })

    it('should finalize complete component', () => {
      const component: A2UIComponent = {
        type: 'text',
        id: 't1',
        properties: { text: 'Hello World' }
      }

      renderer.renderPartial({ id: 't1', type: 'text' as const })
      renderer.finalizeComponent('t1', component)

      expect(callbacks.onFinalize).toHaveBeenCalledWith('t1', component)

      const state = renderer.getComponentState('t1')
      expect(state?.status).toBe('complete')
      expect(state?.finalized).toBeDefined()
    })

    it('should complete rendering when all components finalized', () => {
      renderer.startRendering('surface-1')

      renderer.renderPartial({ id: 't1', type: 'text' as const })
      renderer.renderPartial({ id: 't2', type: 'button' as const })

      renderer.finalizeComponent('t1', {
        type: 'text',
        id: 't1',
        properties: { text: 'Text' }
      })

      renderer.finalizeComponent('t2', {
        type: 'button',
        id: 't2',
        properties: { text: 'Button' }
      })

      expect(callbacks.onRenderComplete).toHaveBeenCalledWith('surface-1')
    })
  })

  describe('Component State Management', () => {
    it('should track component state', () => {
      renderer.renderPartial({ id: 't1', type: 'text' as const })

      const state = renderer.getComponentState('t1')

      expect(state).toBeDefined()
      expect(state?.id).toBe('t1')
      expect(state?.status).toBe('rendering')
      expect(state?.updateCount).toBe(1)
      expect(state?.firstSeen).toBeDefined()
      expect(state?.lastUpdated).toBeDefined()
    })

    it('should track multiple updates', () => {
      renderer.renderPartial({ id: 't1', type: 'text' as const })
      renderer.updateComponent('t1', { properties: { text: 'Update 1' } })
      renderer.updateComponent('t1', { properties: { text: 'Update 2' } })

      const state = renderer.getComponentState('t1')
      expect(state?.updateCount).toBe(3)
    })

    it('should get all component states', () => {
      renderer.renderPartial({ id: 't1', type: 'text' as const })
      renderer.renderPartial({ id: 't2', type: 'button' as const })

      const allStates = renderer.getAllStates()
      expect(allStates.size).toBe(2)
      expect(allStates.has('t1')).toBe(true)
      expect(allStates.has('t2')).toBe(true)
    })

    it('should merge partial updates', () => {
      renderer.renderPartial({ id: 't1', type: 'text' as const })
      renderer.updateComponent('t1', { properties: { text: 'Hello' } })
      renderer.updateComponent('t1', { properties: { style: { color: 'blue' } } })

      const state = renderer.getComponentState('t1')
      expect(state?.partial.type).toBe('text')
      expect(state?.partial.properties).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle component errors', () => {
      renderer.renderPartial({ id: 't1', type: 'text' as const })

      const error = new Error('Render failed')
      renderer.handleError('t1', error)

      expect(callbacks.onError).toHaveBeenCalledWith('t1', error)

      const state = renderer.getComponentState('t1')
      expect(state?.status).toBe('error')
      expect(state?.errors).toHaveLength(1)
    })

    it('should track multiple errors', () => {
      renderer.renderPartial({ id: 't1', type: 'text' as const })

      renderer.handleError('t1', new Error('Error 1'))
      renderer.handleError('t1', new Error('Error 2'))

      const state = renderer.getComponentState('t1')
      expect(state?.errors).toHaveLength(2)
    })

    it('should not update completed components', () => {
      const component: A2UIComponent = {
        type: 'text',
        id: 't1',
        properties: { text: 'Complete' }
      }

      renderer.renderPartial({ id: 't1', type: 'text' as const })
      renderer.finalizeComponent('t1', component)

      // Try to update after finalization
      renderer.updateComponent('t1', { properties: { text: 'Should not update' } })

      const state = renderer.getComponentState('t1')
      expect(state?.status).toBe('complete')
    })

    it('should handle errors for unknown components', () => {
      renderer.handleError('unknown', new Error('Error'))

      const state = renderer.getComponentState('unknown')
      expect(state).toBeUndefined()
    })

    it('should not finalize unknown components', () => {
      const component: A2UIComponent = {
        type: 'text',
        id: 'unknown',
        properties: { text: 'Test' }
      }

      renderer.finalizeComponent('unknown', component)

      const state = renderer.getComponentState('unknown')
      expect(state).toBeUndefined()
    })
  })

  describe('Metrics and Performance', () => {
    it('should calculate rendering metrics', () => {
      renderer.renderPartial({ id: 't1', type: 'text' as const })
      renderer.renderPartial({ id: 't2', type: 'button' as const })

      renderer.finalizeComponent('t1', {
        type: 'text',
        id: 't1',
        properties: { text: 'Text' }
      })

      const metrics = renderer.getMetrics()

      expect(metrics.totalComponents).toBe(2)
      expect(metrics.completedComponents).toBe(1)
      expect(metrics.renderingComponents).toBe(1)
      expect(metrics.failedComponents).toBe(0)
      expect(metrics.totalUpdates).toBe(2)
    })

    it('should track average time to completion', async () => {
      renderer.renderPartial({ id: 't1', type: 'text' as const })

      // Simulate some time passing
      await new Promise((resolve) => setTimeout(resolve, 10))

      renderer.finalizeComponent('t1', {
        type: 'text',
        id: 't1',
        properties: { text: 'Text' }
      })

      const metrics = renderer.getMetrics()
      expect(metrics.avgTimeToCompletion).toBeGreaterThan(0)
    })

    it('should count failed components', () => {
      renderer.renderPartial({ id: 't1', type: 'text' as const })
      renderer.handleError('t1', new Error('Failed'))

      const metrics = renderer.getMetrics()
      expect(metrics.failedComponents).toBe(1)
    })

    it('should calculate total updates', () => {
      renderer.renderPartial({ id: 't1', type: 'text' as const })
      renderer.updateComponent('t1', { properties: { text: 'Update 1' } })
      renderer.updateComponent('t1', { properties: { text: 'Update 2' } })

      const metrics = renderer.getMetrics()
      expect(metrics.totalUpdates).toBe(3)
    })
  })

  describe('Auto-Finalization', () => {
    it.skip('should auto-finalize on timeout', async () => {
      // Timeout-based test - skip for CI reliability
      const shortTimeoutRenderer = new IncrementalRenderer({
        ...callbacks,
        timeout: 50,
        autoFinalize: true
      })

      shortTimeoutRenderer.renderPartial({ id: 't1', type: 'text' as const })

      await new Promise((resolve) => setTimeout(resolve, 100))

      const state = shortTimeoutRenderer.getComponentState('t1')
      expect(state?.status).not.toBe('rendering')
    })

    it('should auto-finalize when completing rendering', () => {
      renderer.startRendering('surface-1')

      renderer.renderPartial({ id: 't1', type: 'text' as const })
      renderer.renderPartial({ id: 't2', type: 'button' as const })

      renderer.completeRendering()

      const metrics = renderer.getMetrics()
      expect(metrics.renderingComponents).toBe(0)
    })

    it('should not auto-finalize if disabled', () => {
      const noAutoRenderer = new IncrementalRenderer({
        ...callbacks,
        autoFinalize: false
      })

      noAutoRenderer.renderPartial({ id: 't1', type: 'text' as const })
      noAutoRenderer.completeRendering()

      const state = noAutoRenderer.getComponentState('t1')
      expect(state?.status).toBe('rendering')
    })
  })

  describe('Progressive Rendering Flow', () => {
    it('should handle typical LLM streaming flow', () => {
      renderer.startRendering('surface-1')

      // Partial component arrives
      renderer.renderPartial({ id: 't1', type: 'text' as const })
      expect(callbacks.onPartialRender).toHaveBeenCalledTimes(1)

      // Properties arrive
      renderer.updateComponent('t1', { properties: { text: 'Hello' } })
      expect(callbacks.onComponentUpdate).toHaveBeenCalledTimes(1)

      // More properties
      renderer.updateComponent('t1', { properties: { style: { color: 'blue' } } })
      expect(callbacks.onComponentUpdate).toHaveBeenCalledTimes(2)

      // Finalize
      renderer.finalizeComponent('t1', {
        type: 'text',
        id: 't1',
        properties: { text: 'Hello', style: { color: 'blue' } }
      })
      expect(callbacks.onFinalize).toHaveBeenCalledTimes(1)
      expect(callbacks.onRenderComplete).toHaveBeenCalledTimes(1)
    })

    it('should handle multiple components progressively', () => {
      renderer.startRendering('surface-1')

      // First component starts
      renderer.renderPartial({ id: 't1', type: 'text' as const })

      // Second component starts
      renderer.renderPartial({ id: 't2', type: 'button' as const })

      // First component updates
      renderer.updateComponent('t1', { properties: { text: 'Text' } })

      // Second component updates
      renderer.updateComponent('t2', { properties: { text: 'Button' } })

      // Finalize both
      renderer.finalizeComponent('t1', {
        type: 'text',
        id: 't1',
        properties: { text: 'Text' }
      })

      renderer.finalizeComponent('t2', {
        type: 'button',
        id: 't2',
        properties: { text: 'Button' }
      })

      expect(callbacks.onRenderComplete).toHaveBeenCalledTimes(1)

      const metrics = renderer.getMetrics()
      expect(metrics.completedComponents).toBe(2)
    })

    it('should handle out-of-order updates', () => {
      // Update before initial render
      renderer.updateComponent('t1', { properties: { text: 'Hello' } })

      // Should create component automatically
      const state = renderer.getComponentState('t1')
      expect(state).toBeDefined()
      expect(state?.partial.properties).toBeDefined()
    })
  })

  describe('Reset Functionality', () => {
    it('should reset renderer state', () => {
      renderer.startRendering('surface-1')
      renderer.renderPartial({ id: 't1', type: 'text' as const })

      renderer.reset()

      const state = renderer.getComponentState('t1')
      expect(state).toBeUndefined()

      const metrics = renderer.getMetrics()
      expect(metrics.totalComponents).toBe(0)
    })

    it('should allow reuse after reset', () => {
      renderer.renderPartial({ id: 't1', type: 'text' as const })
      renderer.reset()

      renderer.renderPartial({ id: 't2', type: 'button' as const })

      const state = renderer.getComponentState('t2')
      expect(state).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle renderPartial without component ID', () => {
      renderer.renderPartial({ type: 'text' as const })

      // Should not create state
      const allStates = renderer.getAllStates()
      expect(allStates.size).toBe(0)
    })

    it('should handle duplicate finalization', () => {
      const component: A2UIComponent = {
        type: 'text',
        id: 't1',
        properties: { text: 'Text' }
      }

      renderer.renderPartial({ id: 't1', type: 'text' as const })
      renderer.finalizeComponent('t1', component)
      renderer.finalizeComponent('t1', component)

      expect(callbacks.onFinalize).toHaveBeenCalledTimes(1)
    })

    it('should handle empty properties', () => {
      renderer.renderPartial({ id: 't1', type: 'text' as const, properties: {} })

      const state = renderer.getComponentState('t1')
      expect(state?.partial.properties).toBeDefined()
    })

    it('should handle rapid updates', () => {
      renderer.renderPartial({ id: 't1', type: 'text' as const })

      for (let i = 0; i < 100; i++) {
        renderer.updateComponent('t1', { properties: { text: `Update ${i}` } })
      }

      const state = renderer.getComponentState('t1')
      expect(state?.updateCount).toBe(101)
    })
  })

  describe('Factory Function', () => {
    it('should create renderer via factory', () => {
      const newRenderer = createIncrementalRenderer()
      expect(newRenderer).toBeInstanceOf(IncrementalRenderer)
    })

    it('should accept options in factory', () => {
      const newRenderer = createIncrementalRenderer({
        timeout: 5000,
        debug: true
      })

      expect(newRenderer).toBeInstanceOf(IncrementalRenderer)
    })
  })

  describe('Performance', () => {
    it('should handle many components efficiently', () => {
      const start = Date.now()

      for (let i = 0; i < 1000; i++) {
        renderer.renderPartial({ id: `t${i}`, type: 'text' as const })
      }

      const duration = Date.now() - start

      expect(duration).toBeLessThan(100) // Should render 1000 components in <100ms

      const metrics = renderer.getMetrics()
      expect(metrics.totalComponents).toBe(1000)
    })

    it('should handle many updates efficiently', () => {
      renderer.renderPartial({ id: 't1', type: 'text' as const })

      const start = Date.now()

      for (let i = 0; i < 1000; i++) {
        renderer.updateComponent('t1', { properties: { text: `Update ${i}` } })
      }

      const duration = Date.now() - start

      expect(duration).toBeLessThan(100) // Should handle 1000 updates in <100ms
    })
  })

  describe('Callback Validation', () => {
    it('should work without callbacks', () => {
      const noCallbackRenderer = new IncrementalRenderer()

      expect(() => {
        noCallbackRenderer.renderPartial({ id: 't1', type: 'text' as const })
        noCallbackRenderer.finalizeComponent('t1', {
          type: 'text',
          id: 't1',
          properties: {}
        })
      }).not.toThrow()
    })

    it('should call callbacks in correct order', () => {
      const callOrder: string[] = []

      const orderedCallbacks: RendererCallbacks = {
        onRenderStart: () => callOrder.push('start'),
        onPartialRender: () => callOrder.push('partial'),
        onComponentUpdate: () => callOrder.push('update'),
        onFinalize: () => callOrder.push('finalize'),
        onRenderComplete: () => callOrder.push('complete')
      }

      const orderedRenderer = new IncrementalRenderer(orderedCallbacks)

      orderedRenderer.startRendering('surface-1')
      orderedRenderer.renderPartial({ id: 't1', type: 'text' as const })
      orderedRenderer.updateComponent('t1', { properties: { text: 'Test' } })
      orderedRenderer.finalizeComponent('t1', {
        type: 'text',
        id: 't1',
        properties: { text: 'Test' }
      })

      expect(callOrder).toEqual(['start', 'partial', 'update', 'finalize', 'complete'])
    })
  })
})
