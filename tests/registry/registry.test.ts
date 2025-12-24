/**
 * Component Registry Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ComponentRegistry } from '../../src/registry/registry.js'
import type { ComponentDefinition } from '../../src/registry/registry.js'

describe('ComponentRegistry', () => {
  let registry: ComponentRegistry

  beforeEach(() => {
    registry = new ComponentRegistry()
  })

  describe('register', () => {
    it('registers a component', () => {
      const definition: ComponentDefinition = {
        type: 'customButton',
        displayName: 'Custom Button',
        category: 'input',
      }

      registry.register('customButton', definition)
      expect(registry.has('customButton')).toBe(true)
    })

    it('overwrites existing registration', () => {
      registry.register('button', { type: 'button', displayName: 'Button 1' })
      registry.register('button', { type: 'button', displayName: 'Button 2' })

      const definition = registry.get('button')
      expect(definition?.displayName).toBe('Button 2')
    })
  })

  describe('get', () => {
    it('retrieves registered component', () => {
      const definition: ComponentDefinition = {
        type: 'customCard',
        displayName: 'Custom Card',
        tags: ['container'],
      }

      registry.register('customCard', definition)
      const retrieved = registry.get('customCard')

      expect(retrieved).toEqual(definition)
    })

    it('returns undefined for non-existent component', () => {
      expect(registry.get('nonExistent')).toBeUndefined()
    })
  })

  describe('has', () => {
    it('returns true for registered components', () => {
      registry.register('button', { type: 'button' })
      expect(registry.has('button')).toBe(true)
    })

    it('returns false for non-registered components', () => {
      expect(registry.has('nonExistent')).toBe(false)
    })
  })

  describe('unregister', () => {
    it('removes a registered component', () => {
      registry.register('button', { type: 'button' })
      const removed = registry.unregister('button')

      expect(removed).toBe(true)
      expect(registry.has('button')).toBe(false)
    })

    it('returns false for non-existent component', () => {
      const removed = registry.unregister('nonExistent')
      expect(removed).toBe(false)
    })
  })

  describe('getAll', () => {
    it('returns all registered components', () => {
      registry.register('button', { type: 'button' })
      registry.register('card', { type: 'card' })

      const all = registry.getAll()
      expect(all).toHaveLength(2)
      expect(all.map((d) => d.type)).toContain('button')
      expect(all.map((d) => d.type)).toContain('card')
    })

    it('returns empty array when no components registered', () => {
      expect(registry.getAll()).toEqual([])
    })
  })

  describe('getByCategory', () => {
    beforeEach(() => {
      registry.register('button', { type: 'button', category: 'input' })
      registry.register('textField', { type: 'textField', category: 'input' })
      registry.register('card', { type: 'card', category: 'layout' })
      registry.register('image', { type: 'image', category: 'media' })
    })

    it('returns components in specified category', () => {
      const inputComponents = registry.getByCategory('input')
      expect(inputComponents).toHaveLength(2)
      expect(inputComponents.map((d) => d.type)).toContain('button')
      expect(inputComponents.map((d) => d.type)).toContain('textField')
    })

    it('returns empty array for unused category', () => {
      const contentComponents = registry.getByCategory('content')
      expect(contentComponents).toEqual([])
    })
  })

  describe('searchByTag', () => {
    beforeEach(() => {
      registry.register('button', { type: 'button', tags: ['input', 'clickable'] })
      registry.register('textField', { type: 'textField', tags: ['input', 'form'] })
      registry.register('card', { type: 'card', tags: ['container'] })
    })

    it('returns components with specified tag', () => {
      const inputComponents = registry.searchByTag('input')
      expect(inputComponents).toHaveLength(2)
      expect(inputComponents.map((d) => d.type)).toContain('button')
      expect(inputComponents.map((d) => d.type)).toContain('textField')
    })

    it('returns empty array for non-existent tag', () => {
      const results = registry.searchByTag('nonExistent')
      expect(results).toEqual([])
    })

    it('handles components without tags', () => {
      registry.register('noTags', { type: 'noTags' })
      const results = registry.searchByTag('anyTag')
      expect(results.map((d) => d.type)).not.toContain('noTags')
    })
  })

  describe('clear', () => {
    it('removes all registered components', () => {
      registry.register('button', { type: 'button' })
      registry.register('card', { type: 'card' })

      registry.clear()

      expect(registry.getAll()).toEqual([])
      expect(registry.has('button')).toBe(false)
      expect(registry.has('card')).toBe(false)
    })
  })

  describe('standard', () => {
    it('returns registry with 18 standard components', () => {
      const standardRegistry = ComponentRegistry.standard()
      const all = standardRegistry.getAll()

      expect(all).toHaveLength(18)
    })

    it('includes all A2UI v0.9 component types', () => {
      const standardRegistry = ComponentRegistry.standard()
      const types = standardRegistry.getAll().map((d) => d.type)

      const expectedTypes = [
        'card',
        'text',
        'button',
        'row',
        'column',
        'modal',
        'tabs',
        'list',
        'textField',
        'checkBox',
        'slider',
        'choicePicker',
        'dateTimeInput',
        'image',
        'video',
        'audioPlayer',
        'icon',
        'divider',
      ]

      for (const expectedType of expectedTypes) {
        expect(types).toContain(expectedType)
      }
    })

    it('assigns categories to components', () => {
      const standardRegistry = ComponentRegistry.standard()

      const layoutComponents = standardRegistry.getByCategory('layout')
      const inputComponents = standardRegistry.getByCategory('input')
      const mediaComponents = standardRegistry.getByCategory('media')

      expect(layoutComponents.length).toBeGreaterThan(0)
      expect(inputComponents.length).toBeGreaterThan(0)
      expect(mediaComponents.length).toBeGreaterThan(0)
    })

    it('includes default props for components', () => {
      const standardRegistry = ComponentRegistry.standard()
      const button = standardRegistry.get('button')

      expect(button?.defaultProps).toBeDefined()
      expect(button?.defaultProps).toHaveProperty('variant')
    })
  })
})
