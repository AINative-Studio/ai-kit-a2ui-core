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
    it('returns registry with 22 standard components', () => {
      const standardRegistry = ComponentRegistry.standard()
      const all = standardRegistry.getAll()

      expect(all).toHaveLength(22)
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

    it('includes all A2UI v0.10 video component types', () => {
      const standardRegistry = ComponentRegistry.standard()
      const types = standardRegistry.getAll().map((d) => d.type)

      const videoComponentTypes = [
        'videoRecorder',
        'videoCall',
        'aiVideo',
        'aiVideoPlayer',
      ]

      for (const videoType of videoComponentTypes) {
        expect(types).toContain(videoType)
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

  describe('video components', () => {
    let registry: ComponentRegistry

    beforeEach(() => {
      registry = ComponentRegistry.standard()
    })

    describe('videoRecorder component', () => {
      it('is registered in standard catalog', () => {
        expect(registry.has('videoRecorder')).toBe(true)
      })

      it('has correct display name and description', () => {
        const videoRecorder = registry.get('videoRecorder')

        expect(videoRecorder?.displayName).toBe('Video Recorder')
        expect(videoRecorder?.description).toBe('Record screen, camera, or both')
      })

      it('has media category', () => {
        const videoRecorder = registry.get('videoRecorder')

        expect(videoRecorder?.category).toBe('media')
      })

      it('has appropriate tags', () => {
        const videoRecorder = registry.get('videoRecorder')

        expect(videoRecorder?.tags).toContain('video')
        expect(videoRecorder?.tags).toContain('recording')
        expect(videoRecorder?.tags).toContain('media')
        expect(videoRecorder?.tags).toContain('screen')
        expect(videoRecorder?.tags).toContain('camera')
      })

      it('has correct default props', () => {
        const videoRecorder = registry.get('videoRecorder')

        expect(videoRecorder?.defaultProps).toEqual({
          mode: 'screen',
          audio: true,
          quality: 'medium',
        })
      })
    })

    describe('videoCall component', () => {
      it('is registered in standard catalog', () => {
        expect(registry.has('videoCall')).toBe(true)
      })

      it('has correct display name and description', () => {
        const videoCall = registry.get('videoCall')

        expect(videoCall?.displayName).toBe('Video Call')
        expect(videoCall?.description).toBe('Real-time video conferencing')
      })

      it('has communication category', () => {
        const videoCall = registry.get('videoCall')

        expect(videoCall?.category).toBe('communication')
      })

      it('has appropriate tags', () => {
        const videoCall = registry.get('videoCall')

        expect(videoCall?.tags).toContain('video')
        expect(videoCall?.tags).toContain('call')
        expect(videoCall?.tags).toContain('communication')
        expect(videoCall?.tags).toContain('webrtc')
        expect(videoCall?.tags).toContain('conferencing')
      })

      it('has correct default props', () => {
        const videoCall = registry.get('videoCall')

        expect(videoCall?.defaultProps).toEqual({
          layout: 'grid',
          features: {
            chat: true,
            screenShare: true,
            recording: false,
          },
        })
      })
    })

    describe('aiVideo component', () => {
      it('is registered in standard catalog', () => {
        expect(registry.has('aiVideo')).toBe(true)
      })

      it('has correct display name and description', () => {
        const aiVideo = registry.get('aiVideo')

        expect(aiVideo?.displayName).toBe('AI Video')
        expect(aiVideo?.description).toBe('AI-generated video from prompts')
      })

      it('has generation category', () => {
        const aiVideo = registry.get('aiVideo')

        expect(aiVideo?.category).toBe('generation')
      })

      it('has appropriate tags', () => {
        const aiVideo = registry.get('aiVideo')

        expect(aiVideo?.tags).toContain('video')
        expect(aiVideo?.tags).toContain('ai')
        expect(aiVideo?.tags).toContain('generation')
        expect(aiVideo?.tags).toContain('media')
      })

      it('has correct default props', () => {
        const aiVideo = registry.get('aiVideo')

        expect(aiVideo?.defaultProps).toEqual({
          streaming: false,
        })
      })
    })

    describe('aiVideoPlayer component', () => {
      it('is registered in standard catalog', () => {
        expect(registry.has('aiVideoPlayer')).toBe(true)
      })

      it('has correct display name and description', () => {
        const aiVideoPlayer = registry.get('aiVideoPlayer')

        expect(aiVideoPlayer?.displayName).toBe('AI Video Player')
        expect(aiVideoPlayer?.description).toBe(
          'Interactive AI-aware video player'
        )
      })

      it('has media category', () => {
        const aiVideoPlayer = registry.get('aiVideoPlayer')

        expect(aiVideoPlayer?.category).toBe('media')
      })

      it('has appropriate tags', () => {
        const aiVideoPlayer = registry.get('aiVideoPlayer')

        expect(aiVideoPlayer?.tags).toContain('video')
        expect(aiVideoPlayer?.tags).toContain('player')
        expect(aiVideoPlayer?.tags).toContain('ai')
        expect(aiVideoPlayer?.tags).toContain('interactive')
        expect(aiVideoPlayer?.tags).toContain('media')
      })

      it('has correct default props', () => {
        const aiVideoPlayer = registry.get('aiVideoPlayer')

        expect(aiVideoPlayer?.defaultProps).toEqual({
          interactive: {
            allowQuestions: true,
            conversationalControl: false,
            smartChapters: true,
          },
        })
      })
    })

    describe('video component search', () => {
      it('finds all video components by video tag', () => {
        const videoComponents = registry.searchByTag('video')

        expect(videoComponents).toHaveLength(5)
        expect(videoComponents.map((c) => c.type)).toContain('video')
        expect(videoComponents.map((c) => c.type)).toContain('videoRecorder')
        expect(videoComponents.map((c) => c.type)).toContain('videoCall')
        expect(videoComponents.map((c) => c.type)).toContain('aiVideo')
        expect(videoComponents.map((c) => c.type)).toContain('aiVideoPlayer')
      })

      it('finds AI video components by ai tag', () => {
        const aiComponents = registry.searchByTag('ai')

        expect(aiComponents).toHaveLength(2)
        expect(aiComponents.map((c) => c.type)).toContain('aiVideo')
        expect(aiComponents.map((c) => c.type)).toContain('aiVideoPlayer')
      })

      it('finds video components in media category', () => {
        const mediaComponents = registry.getByCategory('media')

        expect(mediaComponents.map((c) => c.type)).toContain('image')
        expect(mediaComponents.map((c) => c.type)).toContain('video')
        expect(mediaComponents.map((c) => c.type)).toContain('audioPlayer')
        expect(mediaComponents.map((c) => c.type)).toContain('videoRecorder')
        expect(mediaComponents.map((c) => c.type)).toContain('aiVideoPlayer')
      })

      it('finds videoCall in communication category', () => {
        const communicationComponents = registry.getByCategory('communication')

        expect(communicationComponents).toHaveLength(1)
        expect(communicationComponents.map((c) => c.type)).toContain('videoCall')
      })

      it('finds aiVideo in generation category', () => {
        const generationComponents = registry.getByCategory('generation')

        expect(generationComponents).toHaveLength(1)
        expect(generationComponents.map((c) => c.type)).toContain('aiVideo')
      })
    })
  })
})
