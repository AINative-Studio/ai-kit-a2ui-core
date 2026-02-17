/**
 * Component Validation Tests
 * BDD-style tests for video component validation schemas
 */

import { describe, it, expect } from 'vitest'
import {
    validateComponentProperties,
    applyDefaults,
    getDefaults,
    getSchema,
    videoComponentSchemas,
    type ValidationResult,
} from '../../src/types/validation.js'

describe('Video Component Validation Schemas', () => {
    describe('videoRecorder', () => {
        describe('when validating required fields', () => {
            it('should require mode field', () => {
                const result = validateComponentProperties('videoRecorder', {})

                expect(result.valid).toBe(false)
                expect(result.errors).toHaveLength(1)
                expect(result.errors[0].path).toBe('mode')
                expect(result.errors[0].message).toContain('Required field')
            })

            it('should accept valid mode values', () => {
                const modes = ['screen', 'camera', 'pip'] as const

                for (const mode of modes) {
                    const result = validateComponentProperties('videoRecorder', { mode })
                    expect(result.valid).toBe(true)
                }
            })

            it('should reject invalid mode values', () => {
                const result = validateComponentProperties('videoRecorder', { mode: 'invalid' })

                expect(result.valid).toBe(false)
                expect(result.errors.some(e => e.path === 'mode')).toBe(true)
            })
        })

        describe('when validating optional fields', () => {
            it('should accept valid audio boolean', () => {
                const result = validateComponentProperties('videoRecorder', {
                    mode: 'screen',
                    audio: true
                })

                expect(result.valid).toBe(true)
            })

            it('should accept valid quality values', () => {
                const qualities = ['low', 'medium', 'high'] as const

                for (const quality of qualities) {
                    const result = validateComponentProperties('videoRecorder', {
                        mode: 'screen',
                        quality
                    })
                    expect(result.valid).toBe(true)
                }
            })

            it('should reject invalid quality values', () => {
                const result = validateComponentProperties('videoRecorder', {
                    mode: 'screen',
                    quality: 'ultra'
                })

                expect(result.valid).toBe(false)
                expect(result.errors.some(e => e.path === 'quality')).toBe(true)
            })
        })

        describe('when validating AI options', () => {
            it('should accept valid AI options', () => {
                const result = validateComponentProperties('videoRecorder', {
                    mode: 'screen',
                    ai: {
                        transcribe: true,
                        highlights: true,
                        summary: false,
                        zerodb: true
                    }
                })

                expect(result.valid).toBe(true)
            })

            it('should reject additional AI properties', () => {
                const result = validateComponentProperties('videoRecorder', {
                    mode: 'screen',
                    ai: {
                        transcribe: true,
                        invalidProperty: true
                    }
                })

                expect(result.valid).toBe(false)
                expect(result.errors.some(e => e.path.includes('invalidProperty'))).toBe(true)
            })

            it('should reject invalid AI option types', () => {
                const result = validateComponentProperties('videoRecorder', {
                    mode: 'screen',
                    ai: {
                        transcribe: 'yes'
                    }
                })

                expect(result.valid).toBe(false)
                expect(result.errors.some(e => e.path.includes('transcribe'))).toBe(true)
            })
        })

        describe('when validating event handlers', () => {
            it('should accept string event handlers', () => {
                const result = validateComponentProperties('videoRecorder', {
                    mode: 'screen',
                    onStart: '/actions/startRecording',
                    onComplete: '/actions/completeRecording',
                    onError: '/actions/handleError'
                })

                expect(result.valid).toBe(true)
            })

            it('should reject non-string event handlers', () => {
                const result = validateComponentProperties('videoRecorder', {
                    mode: 'screen',
                    onComplete: 123
                })

                expect(result.valid).toBe(false)
                expect(result.errors.some(e => e.path === 'onComplete')).toBe(true)
            })
        })

        describe('when applying defaults', () => {
            it('should apply default mode, audio, and quality', () => {
                const props = applyDefaults('videoRecorder', {})

                expect(props.mode).toBe('screen')
                expect(props.audio).toBe(true)
                expect(props.quality).toBe('high')
            })

            it('should preserve provided values over defaults', () => {
                const props = applyDefaults('videoRecorder', {
                    mode: 'camera',
                    audio: false,
                    quality: 'low'
                })

                expect(props.mode).toBe('camera')
                expect(props.audio).toBe(false)
                expect(props.quality).toBe('low')
            })

            it('should merge partial overrides', () => {
                const props = applyDefaults('videoRecorder', {
                    mode: 'pip'
                })

                expect(props.mode).toBe('pip')
                expect(props.audio).toBe(true)
                expect(props.quality).toBe('high')
            })
        })
    })

    describe('videoCall', () => {
        describe('when validating required fields', () => {
            it('should require roomId field', () => {
                const result = validateComponentProperties('videoCall', {})

                expect(result.valid).toBe(false)
                expect(result.errors).toHaveLength(1)
                expect(result.errors[0].path).toBe('roomId')
            })

            it('should reject empty roomId', () => {
                const result = validateComponentProperties('videoCall', { roomId: '' })

                expect(result.valid).toBe(false)
                expect(result.errors.some(e => e.path === 'roomId')).toBe(true)
            })

            it('should accept valid roomId', () => {
                const result = validateComponentProperties('videoCall', { roomId: 'room-123' })

                expect(result.valid).toBe(true)
            })
        })

        describe('when validating layout options', () => {
            it('should accept valid layout values', () => {
                const layouts = ['grid', 'speaker', 'sidebar'] as const

                for (const layout of layouts) {
                    const result = validateComponentProperties('videoCall', {
                        roomId: 'room-123',
                        layout
                    })
                    expect(result.valid).toBe(true)
                }
            })

            it('should reject invalid layout values', () => {
                const result = validateComponentProperties('videoCall', {
                    roomId: 'room-123',
                    layout: 'invalid'
                })

                expect(result.valid).toBe(false)
                expect(result.errors.some(e => e.path === 'layout')).toBe(true)
            })
        })

        describe('when validating feature flags', () => {
            it('should accept valid feature options', () => {
                const result = validateComponentProperties('videoCall', {
                    roomId: 'room-123',
                    features: {
                        chat: true,
                        screenShare: false,
                        recording: true
                    }
                })

                expect(result.valid).toBe(true)
            })

            it('should reject additional feature properties', () => {
                const result = validateComponentProperties('videoCall', {
                    roomId: 'room-123',
                    features: {
                        chat: true,
                        invalidFeature: true
                    }
                })

                expect(result.valid).toBe(false)
                expect(result.errors.some(e => e.path.includes('invalidFeature'))).toBe(true)
            })
        })

        describe('when validating AI options', () => {
            it('should accept valid AI options', () => {
                const result = validateComponentProperties('videoCall', {
                    roomId: 'room-123',
                    ai: {
                        liveTranscription: true,
                        liveCaptions: true,
                        translation: 'es',
                        noiseCancellation: true,
                        speakerIdentification: true,
                        actionItemDetection: false
                    }
                })

                expect(result.valid).toBe(true)
            })

            it('should accept valid language codes', () => {
                const validCodes = ['en', 'es', 'fr-FR', 'en-US']

                for (const code of validCodes) {
                    const result = validateComponentProperties('videoCall', {
                        roomId: 'room-123',
                        ai: {
                            translation: code
                        }
                    })
                    expect(result.valid).toBe(true)
                }
            })

            it('should reject invalid language codes', () => {
                const invalidCodes = ['english', 'ES', 'en_US', '123']

                for (const code of invalidCodes) {
                    const result = validateComponentProperties('videoCall', {
                        roomId: 'room-123',
                        ai: {
                            translation: code
                        }
                    })
                    expect(result.valid).toBe(false)
                }
            })
        })

        describe('when applying defaults', () => {
            it('should apply default layout and features', () => {
                const props = applyDefaults('videoCall', { roomId: 'room-123' })

                expect(props.layout).toBe('grid')
                expect(props.features).toEqual({
                    chat: true,
                    screenShare: true,
                    recording: false
                })
            })

            it('should merge feature overrides', () => {
                const props = applyDefaults('videoCall', {
                    roomId: 'room-123',
                    features: {
                        recording: true
                    }
                })

                expect(props.features).toEqual({
                    chat: true,
                    screenShare: true,
                    recording: true
                })
            })
        })
    })

    describe('aiVideo', () => {
        describe('when validating optional fields', () => {
            it('should accept valid prompt', () => {
                const result = validateComponentProperties('aiVideo', {
                    prompt: 'Create a video about AI'
                })

                expect(result.valid).toBe(true)
            })

            it('should reject empty prompt', () => {
                const result = validateComponentProperties('aiVideo', {
                    prompt: ''
                })

                expect(result.valid).toBe(false)
                expect(result.errors.some(e => e.path === 'prompt')).toBe(true)
            })

            it('should accept template and data', () => {
                const result = validateComponentProperties('aiVideo', {
                    template: 'marketing-template',
                    data: {
                        title: 'Product Launch',
                        features: ['AI', 'Cloud', 'Security']
                    }
                })

                expect(result.valid).toBe(true)
            })

            it('should accept streaming flag', () => {
                const result = validateComponentProperties('aiVideo', {
                    prompt: 'Test',
                    streaming: false
                })

                expect(result.valid).toBe(true)
            })
        })

        describe('when applying defaults', () => {
            it('should apply default streaming value', () => {
                const props = applyDefaults('aiVideo', {})

                expect(props.streaming).toBe(true)
            })

            it('should preserve provided streaming value', () => {
                const props = applyDefaults('aiVideo', { streaming: false })

                expect(props.streaming).toBe(false)
            })
        })
    })

    describe('aiVideoPlayer', () => {
        describe('when validating required fields', () => {
            it('should require videoUrl field', () => {
                const result = validateComponentProperties('aiVideoPlayer', {})

                expect(result.valid).toBe(false)
                expect(result.errors).toHaveLength(1)
                expect(result.errors[0].path).toBe('videoUrl')
            })

            it('should reject empty videoUrl', () => {
                const result = validateComponentProperties('aiVideoPlayer', { videoUrl: '' })

                expect(result.valid).toBe(false)
                expect(result.errors.some(e => e.path === 'videoUrl')).toBe(true)
            })

            it('should accept valid HTTP URLs', () => {
                const urls = [
                    'http://example.com/video.mp4',
                    'https://example.com/video.mp4',
                    'https://cdn.example.com/videos/test.mp4'
                ]

                for (const url of urls) {
                    const result = validateComponentProperties('aiVideoPlayer', { videoUrl: url })
                    expect(result.valid).toBe(true)
                }
            })

            it('should reject non-HTTP URLs', () => {
                const urls = [
                    'ftp://example.com/video.mp4',
                    'file:///path/to/video.mp4',
                    'video.mp4'
                ]

                for (const url of urls) {
                    const result = validateComponentProperties('aiVideoPlayer', { videoUrl: url })
                    expect(result.valid).toBe(false)
                }
            })
        })

        describe('when validating interactive options', () => {
            it('should accept valid interactive options', () => {
                const result = validateComponentProperties('aiVideoPlayer', {
                    videoUrl: 'https://example.com/video.mp4',
                    interactive: {
                        allowQuestions: true,
                        conversationalControl: false,
                        smartChapters: true,
                        semanticSearch: true
                    }
                })

                expect(result.valid).toBe(true)
            })

            it('should reject additional interactive properties', () => {
                const result = validateComponentProperties('aiVideoPlayer', {
                    videoUrl: 'https://example.com/video.mp4',
                    interactive: {
                        allowQuestions: true,
                        invalidOption: true
                    }
                })

                expect(result.valid).toBe(false)
                expect(result.errors.some(e => e.path.includes('invalidOption'))).toBe(true)
            })

            it('should reject invalid interactive option types', () => {
                const result = validateComponentProperties('aiVideoPlayer', {
                    videoUrl: 'https://example.com/video.mp4',
                    interactive: {
                        allowQuestions: 'yes'
                    }
                })

                expect(result.valid).toBe(false)
                expect(result.errors.some(e => e.path.includes('allowQuestions'))).toBe(true)
            })
        })

        describe('when applying defaults', () => {
            it('should apply default interactive options', () => {
                const props = applyDefaults('aiVideoPlayer', {
                    videoUrl: 'https://example.com/video.mp4'
                })

                expect(props.interactive).toEqual({
                    allowQuestions: true,
                    conversationalControl: true,
                    smartChapters: true,
                    semanticSearch: false
                })
            })

            it('should merge interactive overrides', () => {
                const props = applyDefaults('aiVideoPlayer', {
                    videoUrl: 'https://example.com/video.mp4',
                    interactive: {
                        semanticSearch: true
                    }
                })

                expect(props.interactive).toEqual({
                    allowQuestions: true,
                    conversationalControl: true,
                    smartChapters: true,
                    semanticSearch: true
                })
            })
        })
    })

    describe('Validation Utility Functions', () => {
        describe('getDefaults', () => {
            it('should return default values for videoRecorder', () => {
                const defaults = getDefaults('videoRecorder')

                expect(defaults).toEqual({
                    mode: 'screen',
                    audio: true,
                    quality: 'high'
                })
            })

            it('should return default values for videoCall', () => {
                const defaults = getDefaults('videoCall')

                expect(defaults).toEqual({
                    layout: 'grid',
                    features: {
                        chat: true,
                        screenShare: true,
                        recording: false
                    }
                })
            })

            it('should return default values for aiVideo', () => {
                const defaults = getDefaults('aiVideo')

                expect(defaults).toEqual({
                    streaming: true
                })
            })

            it('should return default values for aiVideoPlayer', () => {
                const defaults = getDefaults('aiVideoPlayer')

                expect(defaults).toEqual({
                    interactive: {
                        allowQuestions: true,
                        conversationalControl: true,
                        smartChapters: true,
                        semanticSearch: false
                    }
                })
            })

            it('should return empty object for non-video components', () => {
                const defaults = getDefaults('text' as any)

                expect(defaults).toEqual({})
            })
        })

        describe('getSchema', () => {
            it('should return JSON schema for videoRecorder', () => {
                const schema = getSchema('videoRecorder')

                expect(schema).toBeDefined()
                expect(schema?.type).toBe('object')
                expect(schema?.required).toContain('mode')
                expect(schema?.properties).toHaveProperty('mode')
                expect(schema?.properties).toHaveProperty('audio')
                expect(schema?.properties).toHaveProperty('quality')
                expect(schema?.properties).toHaveProperty('ai')
            })

            it('should return JSON schema for videoCall', () => {
                const schema = getSchema('videoCall')

                expect(schema).toBeDefined()
                expect(schema?.required).toContain('roomId')
                expect(schema?.properties).toHaveProperty('roomId')
                expect(schema?.properties).toHaveProperty('layout')
                expect(schema?.properties).toHaveProperty('features')
                expect(schema?.properties).toHaveProperty('ai')
            })

            it('should return JSON schema for aiVideo', () => {
                const schema = getSchema('aiVideo')

                expect(schema).toBeDefined()
                expect(schema?.properties).toHaveProperty('prompt')
                expect(schema?.properties).toHaveProperty('template')
                expect(schema?.properties).toHaveProperty('data')
                expect(schema?.properties).toHaveProperty('streaming')
            })

            it('should return JSON schema for aiVideoPlayer', () => {
                const schema = getSchema('aiVideoPlayer')

                expect(schema).toBeDefined()
                expect(schema?.required).toContain('videoUrl')
                expect(schema?.properties).toHaveProperty('videoUrl')
                expect(schema?.properties).toHaveProperty('interactive')
            })

            it('should return null for non-video components', () => {
                const schema = getSchema('text' as any)

                expect(schema).toBeNull()
            })
        })

        describe('videoComponentSchemas', () => {
            it('should export all video component schemas', () => {
                expect(videoComponentSchemas).toHaveProperty('videoRecorder')
                expect(videoComponentSchemas).toHaveProperty('videoCall')
                expect(videoComponentSchemas).toHaveProperty('aiVideo')
                expect(videoComponentSchemas).toHaveProperty('aiVideoPlayer')
            })

            it('should have consistent schema structure', () => {
                const schemas = Object.values(videoComponentSchemas)

                for (const schema of schemas) {
                    expect(schema).toHaveProperty('type')
                    expect(schema).toHaveProperty('schema')
                    expect(schema).toHaveProperty('defaults')
                    expect(schema.schema.type).toBe('object')
                    expect(schema.schema).toHaveProperty('properties')
                }
            })
        })
    })

    describe('Edge Cases and Error Handling', () => {
        describe('when properties is null or undefined', () => {
            it('should handle null properties', () => {
                const result = validateComponentProperties('videoRecorder', null)

                expect(result.valid).toBe(false)
                expect(result.errors).toHaveLength(1)
                expect(result.errors[0].path).toBe('properties')
            })

            it('should handle undefined properties', () => {
                const result = validateComponentProperties('videoRecorder', undefined)

                expect(result.valid).toBe(false)
                expect(result.errors).toHaveLength(1)
                expect(result.errors[0].path).toBe('properties')
            })
        })

        describe('when properties is not an object', () => {
            it('should reject string properties', () => {
                const result = validateComponentProperties('videoRecorder', 'invalid')

                expect(result.valid).toBe(false)
                expect(result.errors[0].expected).toBe('object')
            })

            it('should reject array properties', () => {
                const result = validateComponentProperties('videoRecorder', [])

                expect(result.valid).toBe(false)
                expect(result.errors[0].expected).toBe('object')
            })

            it('should reject number properties', () => {
                const result = validateComponentProperties('videoRecorder', 123)

                expect(result.valid).toBe(false)
                expect(result.errors[0].expected).toBe('object')
            })
        })

        describe('when validating unknown component types', () => {
            it('should return valid for non-video components', () => {
                const result = validateComponentProperties('text' as any, {
                    value: 'Hello'
                })

                expect(result.valid).toBe(true)
                expect(result.errors).toHaveLength(0)
            })
        })

        describe('when properties have additional fields', () => {
            it('should reject additional top-level properties', () => {
                const result = validateComponentProperties('videoRecorder', {
                    mode: 'screen',
                    unknownField: 'value'
                })

                expect(result.valid).toBe(false)
                expect(result.errors.some(e => e.path === 'unknownField')).toBe(true)
            })
        })

        describe('when applying defaults with complex nested structures', () => {
            it('should deep merge nested objects', () => {
                const props = applyDefaults('videoCall', {
                    roomId: 'room-123',
                    features: {
                        chat: false
                    }
                })

                expect(props.features?.chat).toBe(false)
                expect(props.features?.screenShare).toBe(true)
                expect(props.features?.recording).toBe(false)
            })

            it('should not merge arrays', () => {
                const props = applyDefaults('aiVideo', {
                    data: {
                        items: [1, 2, 3]
                    }
                })

                expect(props.data).toEqual({
                    items: [1, 2, 3]
                })
            })
        })
    })
})
