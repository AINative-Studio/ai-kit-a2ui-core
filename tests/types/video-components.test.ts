/**
 * Video Component Types Tests
 * Tests for videoRecorder, videoCall, aiVideo, and aiVideoPlayer component types
 */

import { describe, it, expect } from 'vitest'
import type {
    ComponentType,
    A2UIComponent,
    TypedA2UIComponent,
    ComponentProperties,
} from '../../src/types/components.js'

describe('Video Component Types', () => {
    describe('ComponentType Union', () => {
        it('includes videoRecorder in ComponentType union', () => {
            const type: ComponentType = 'videoRecorder'
            expect(type).toBe('videoRecorder')
        })

        it('includes videoCall in ComponentType union', () => {
            const type: ComponentType = 'videoCall'
            expect(type).toBe('videoCall')
        })

        it('includes aiVideo in ComponentType union', () => {
            const type: ComponentType = 'aiVideo'
            expect(type).toBe('aiVideo')
        })

        it('includes aiVideoPlayer in ComponentType union', () => {
            const type: ComponentType = 'aiVideoPlayer'
            expect(type).toBe('aiVideoPlayer')
        })
    })

    describe('VideoRecorder Component', () => {
        it('creates valid videoRecorder component with minimal properties', () => {
            const component: TypedA2UIComponent<'videoRecorder'> = {
                id: 'recorder-1',
                type: 'videoRecorder',
                properties: {
                    mode: 'screen',
                },
            }

            expect(component.type).toBe('videoRecorder')
            expect(component.properties?.mode).toBe('screen')
        })

        it('creates valid videoRecorder component with all properties', () => {
            const component: TypedA2UIComponent<'videoRecorder'> = {
                id: 'recorder-2',
                type: 'videoRecorder',
                properties: {
                    mode: 'camera',
                    audio: true,
                    quality: 'high',
                    ai: {
                        transcribe: true,
                        highlights: true,
                        summary: true,
                        zerodb: true,
                    },
                    onStart: '/handlers/recordingStart',
                    onComplete: '/handlers/recordingComplete',
                    onError: '/handlers/recordingError',
                },
            }

            expect(component.type).toBe('videoRecorder')
            expect(component.properties?.mode).toBe('camera')
            expect(component.properties?.audio).toBe(true)
            expect(component.properties?.quality).toBe('high')
            expect(component.properties?.ai?.transcribe).toBe(true)
            expect(component.properties?.ai?.highlights).toBe(true)
            expect(component.properties?.ai?.summary).toBe(true)
            expect(component.properties?.ai?.zerodb).toBe(true)
        })

        it('validates mode property accepts screen, camera, or pip', () => {
            const modes: Array<ComponentProperties['videoRecorder']['mode']> = [
                'screen',
                'camera',
                'pip',
            ]

            modes.forEach((mode) => {
                const component: TypedA2UIComponent<'videoRecorder'> = {
                    id: 'recorder-test',
                    type: 'videoRecorder',
                    properties: { mode },
                }
                expect(component.properties?.mode).toBe(mode)
            })
        })

        it('validates quality property accepts low, medium, or high', () => {
            const qualities: Array<ComponentProperties['videoRecorder']['quality']> = [
                'low',
                'medium',
                'high',
            ]

            qualities.forEach((quality) => {
                const component: TypedA2UIComponent<'videoRecorder'> = {
                    id: 'recorder-test',
                    type: 'videoRecorder',
                    properties: {
                        mode: 'screen',
                        quality,
                    },
                }
                expect(component.properties?.quality).toBe(quality)
            })
        })

        it('supports AI features independently', () => {
            const component: TypedA2UIComponent<'videoRecorder'> = {
                id: 'recorder-3',
                type: 'videoRecorder',
                properties: {
                    mode: 'pip',
                    ai: {
                        transcribe: true,
                        highlights: false,
                    },
                },
            }

            expect(component.properties?.ai?.transcribe).toBe(true)
            expect(component.properties?.ai?.highlights).toBe(false)
        })
    })

    describe('VideoCall Component', () => {
        it('creates valid videoCall component with minimal properties', () => {
            const component: TypedA2UIComponent<'videoCall'> = {
                id: 'call-1',
                type: 'videoCall',
                properties: {
                    roomId: 'room-123',
                },
            }

            expect(component.type).toBe('videoCall')
            expect(component.properties?.roomId).toBe('room-123')
        })

        it('creates valid videoCall component with all properties', () => {
            const component: TypedA2UIComponent<'videoCall'> = {
                id: 'call-2',
                type: 'videoCall',
                properties: {
                    roomId: 'room-456',
                    layout: 'grid',
                    features: {
                        chat: true,
                        screenShare: true,
                        recording: true,
                    },
                    ai: {
                        liveTranscription: true,
                        liveCaptions: true,
                        translation: 'es',
                        noiseCancellation: true,
                        speakerIdentification: true,
                        actionItemDetection: true,
                    },
                    onJoin: '/handlers/callJoin',
                    onLeave: '/handlers/callLeave',
                    onError: '/handlers/callError',
                },
            }

            expect(component.type).toBe('videoCall')
            expect(component.properties?.roomId).toBe('room-456')
            expect(component.properties?.layout).toBe('grid')
            expect(component.properties?.features?.chat).toBe(true)
            expect(component.properties?.ai?.liveTranscription).toBe(true)
        })

        it('validates layout property accepts grid, speaker, or sidebar', () => {
            const layouts: Array<ComponentProperties['videoCall']['layout']> = [
                'grid',
                'speaker',
                'sidebar',
            ]

            layouts.forEach((layout) => {
                const component: TypedA2UIComponent<'videoCall'> = {
                    id: 'call-test',
                    type: 'videoCall',
                    properties: {
                        roomId: 'test-room',
                        layout,
                    },
                }
                expect(component.properties?.layout).toBe(layout)
            })
        })

        it('supports features independently', () => {
            const component: TypedA2UIComponent<'videoCall'> = {
                id: 'call-3',
                type: 'videoCall',
                properties: {
                    roomId: 'room-789',
                    features: {
                        chat: true,
                        screenShare: false,
                        recording: true,
                    },
                },
            }

            expect(component.properties?.features?.chat).toBe(true)
            expect(component.properties?.features?.screenShare).toBe(false)
            expect(component.properties?.features?.recording).toBe(true)
        })

        it('supports AI features with translation language code', () => {
            const component: TypedA2UIComponent<'videoCall'> = {
                id: 'call-4',
                type: 'videoCall',
                properties: {
                    roomId: 'room-intl',
                    ai: {
                        liveTranscription: true,
                        translation: 'fr',
                        noiseCancellation: true,
                    },
                },
            }

            expect(component.properties?.ai?.translation).toBe('fr')
            expect(component.properties?.ai?.noiseCancellation).toBe(true)
        })
    })

    describe('AIVideo Component', () => {
        it('creates valid aiVideo component with minimal properties', () => {
            const component: TypedA2UIComponent<'aiVideo'> = {
                id: 'ai-video-1',
                type: 'aiVideo',
                properties: {},
            }

            expect(component.type).toBe('aiVideo')
        })

        it('creates valid aiVideo component with prompt', () => {
            const component: TypedA2UIComponent<'aiVideo'> = {
                id: 'ai-video-2',
                type: 'aiVideo',
                properties: {
                    prompt: 'Generate a video about AI technology',
                },
            }

            expect(component.type).toBe('aiVideo')
            expect(component.properties?.prompt).toBe('Generate a video about AI technology')
        })

        it('creates valid aiVideo component with all properties', () => {
            const component: TypedA2UIComponent<'aiVideo'> = {
                id: 'ai-video-3',
                type: 'aiVideo',
                properties: {
                    prompt: 'Create a product demo',
                    template: 'product-showcase',
                    data: {
                        productName: 'AI Widget',
                        features: ['Fast', 'Smart', 'Reliable'],
                    },
                    voice: 'professional-male',
                    streaming: true,
                    onProgress: '/handlers/videoProgress',
                    onComplete: '/handlers/videoComplete',
                    onError: '/handlers/videoError',
                },
            }

            expect(component.type).toBe('aiVideo')
            expect(component.properties?.prompt).toBe('Create a product demo')
            expect(component.properties?.template).toBe('product-showcase')
            expect(component.properties?.data?.productName).toBe('AI Widget')
            expect(component.properties?.voice).toBe('professional-male')
            expect(component.properties?.streaming).toBe(true)
        })

        it('supports template-based generation with data', () => {
            const component: TypedA2UIComponent<'aiVideo'> = {
                id: 'ai-video-4',
                type: 'aiVideo',
                properties: {
                    template: 'tutorial-template',
                    data: {
                        steps: ['Step 1', 'Step 2', 'Step 3'],
                        duration: 120,
                    },
                },
            }

            expect(component.properties?.template).toBe('tutorial-template')
            expect(component.properties?.data).toHaveProperty('steps')
            expect(component.properties?.data?.steps).toHaveLength(3)
        })

        it('supports streaming mode', () => {
            const component: TypedA2UIComponent<'aiVideo'> = {
                id: 'ai-video-5',
                type: 'aiVideo',
                properties: {
                    prompt: 'Generate live video',
                    streaming: true,
                },
            }

            expect(component.properties?.streaming).toBe(true)
        })
    })

    describe('AIVideoPlayer Component', () => {
        it('creates valid aiVideoPlayer component with minimal properties', () => {
            const component: TypedA2UIComponent<'aiVideoPlayer'> = {
                id: 'player-1',
                type: 'aiVideoPlayer',
                properties: {
                    videoUrl: 'https://example.com/video.mp4',
                },
            }

            expect(component.type).toBe('aiVideoPlayer')
            expect(component.properties?.videoUrl).toBe('https://example.com/video.mp4')
        })

        it('creates valid aiVideoPlayer component with all properties', () => {
            const component: TypedA2UIComponent<'aiVideoPlayer'> = {
                id: 'player-2',
                type: 'aiVideoPlayer',
                properties: {
                    videoUrl: 'https://example.com/ai-video.mp4',
                    transcript: 'Full video transcript here...',
                    interactive: {
                        allowQuestions: true,
                        conversationalControl: true,
                        smartChapters: true,
                        semanticSearch: true,
                    },
                    onProgress: '/handlers/playerProgress',
                    onQuestion: '/handlers/playerQuestion',
                },
            }

            expect(component.type).toBe('aiVideoPlayer')
            expect(component.properties?.videoUrl).toBe('https://example.com/ai-video.mp4')
            expect(component.properties?.transcript).toBe('Full video transcript here...')
            expect(component.properties?.interactive?.allowQuestions).toBe(true)
            expect(component.properties?.interactive?.conversationalControl).toBe(true)
            expect(component.properties?.interactive?.smartChapters).toBe(true)
            expect(component.properties?.interactive?.semanticSearch).toBe(true)
        })

        it('supports interactive features independently', () => {
            const component: TypedA2UIComponent<'aiVideoPlayer'> = {
                id: 'player-3',
                type: 'aiVideoPlayer',
                properties: {
                    videoUrl: 'https://example.com/video3.mp4',
                    interactive: {
                        allowQuestions: true,
                        conversationalControl: false,
                        smartChapters: true,
                        semanticSearch: false,
                    },
                },
            }

            expect(component.properties?.interactive?.allowQuestions).toBe(true)
            expect(component.properties?.interactive?.conversationalControl).toBe(false)
            expect(component.properties?.interactive?.smartChapters).toBe(true)
            expect(component.properties?.interactive?.semanticSearch).toBe(false)
        })

        it('supports transcript for enhanced features', () => {
            const component: TypedA2UIComponent<'aiVideoPlayer'> = {
                id: 'player-4',
                type: 'aiVideoPlayer',
                properties: {
                    videoUrl: 'https://example.com/video4.mp4',
                    transcript: 'This is a sample transcript for semantic search.',
                },
            }

            expect(component.properties?.transcript).toBe('This is a sample transcript for semantic search.')
        })
    })

    describe('Type Safety and Validation', () => {
        it('enforces type safety for video component properties', () => {
            const components: A2UIComponent[] = [
                {
                    id: 'test-1',
                    type: 'videoRecorder',
                    properties: { mode: 'screen' },
                },
                {
                    id: 'test-2',
                    type: 'videoCall',
                    properties: { roomId: 'room-1' },
                },
                {
                    id: 'test-3',
                    type: 'aiVideo',
                    properties: { prompt: 'test' },
                },
                {
                    id: 'test-4',
                    type: 'aiVideoPlayer',
                    properties: { videoUrl: 'https://example.com/video.mp4' },
                },
            ]

            expect(components).toHaveLength(4)
            expect(components[0].type).toBe('videoRecorder')
            expect(components[1].type).toBe('videoCall')
            expect(components[2].type).toBe('aiVideo')
            expect(components[3].type).toBe('aiVideoPlayer')
        })

        it('allows all video types in component arrays', () => {
            const videoComponents: TypedA2UIComponent<'videoRecorder' | 'videoCall' | 'aiVideo' | 'aiVideoPlayer'>[] = [
                {
                    id: 'vid-1',
                    type: 'videoRecorder',
                    properties: { mode: 'screen' },
                },
                {
                    id: 'vid-2',
                    type: 'videoCall',
                    properties: { roomId: 'room-1' },
                },
                {
                    id: 'vid-3',
                    type: 'aiVideo',
                    properties: { prompt: 'test' },
                },
                {
                    id: 'vid-4',
                    type: 'aiVideoPlayer',
                    properties: { videoUrl: 'https://example.com/video.mp4' },
                },
            ]

            expect(videoComponents).toHaveLength(4)
        })

        it('supports children for layout composition', () => {
            const component: TypedA2UIComponent<'videoRecorder'> = {
                id: 'recorder-with-children',
                type: 'videoRecorder',
                properties: { mode: 'screen' },
                children: ['control-1', 'status-1'],
            }

            expect(component.children).toEqual(['control-1', 'status-1'])
        })
    })

    describe('Event Handler References', () => {
        it('stores event handler references as JSON pointer strings for videoRecorder', () => {
            const component: TypedA2UIComponent<'videoRecorder'> = {
                id: 'recorder-events',
                type: 'videoRecorder',
                properties: {
                    mode: 'screen',
                    onStart: '/actions/recording/start',
                    onComplete: '/actions/recording/complete',
                    onError: '/actions/recording/error',
                },
            }

            expect(component.properties?.onStart).toBe('/actions/recording/start')
            expect(component.properties?.onComplete).toBe('/actions/recording/complete')
            expect(component.properties?.onError).toBe('/actions/recording/error')
        })

        it('stores event handler references as JSON pointer strings for videoCall', () => {
            const component: TypedA2UIComponent<'videoCall'> = {
                id: 'call-events',
                type: 'videoCall',
                properties: {
                    roomId: 'room-1',
                    onJoin: '/actions/call/join',
                    onLeave: '/actions/call/leave',
                    onError: '/actions/call/error',
                },
            }

            expect(component.properties?.onJoin).toBe('/actions/call/join')
            expect(component.properties?.onLeave).toBe('/actions/call/leave')
            expect(component.properties?.onError).toBe('/actions/call/error')
        })

        it('stores event handler references as JSON pointer strings for aiVideo', () => {
            const component: TypedA2UIComponent<'aiVideo'> = {
                id: 'ai-video-events',
                type: 'aiVideo',
                properties: {
                    prompt: 'test',
                    onProgress: '/actions/video/progress',
                    onComplete: '/actions/video/complete',
                    onError: '/actions/video/error',
                },
            }

            expect(component.properties?.onProgress).toBe('/actions/video/progress')
            expect(component.properties?.onComplete).toBe('/actions/video/complete')
            expect(component.properties?.onError).toBe('/actions/video/error')
        })

        it('stores event handler references as JSON pointer strings for aiVideoPlayer', () => {
            const component: TypedA2UIComponent<'aiVideoPlayer'> = {
                id: 'player-events',
                type: 'aiVideoPlayer',
                properties: {
                    videoUrl: 'https://example.com/video.mp4',
                    onProgress: '/actions/player/progress',
                    onQuestion: '/actions/player/question',
                },
            }

            expect(component.properties?.onProgress).toBe('/actions/player/progress')
            expect(component.properties?.onQuestion).toBe('/actions/player/question')
        })
    })

    describe('Complex Nested Structures', () => {
        it('handles complex AI configuration in videoRecorder', () => {
            const component: TypedA2UIComponent<'videoRecorder'> = {
                id: 'recorder-complex',
                type: 'videoRecorder',
                properties: {
                    mode: 'pip',
                    audio: true,
                    quality: 'high',
                    ai: {
                        transcribe: true,
                        highlights: true,
                        summary: false,
                        zerodb: true,
                    },
                },
            }

            expect(component.properties?.ai).toBeDefined()
            expect(Object.keys(component.properties?.ai || {})).toHaveLength(4)
        })

        it('handles complex features and AI configuration in videoCall', () => {
            const component: TypedA2UIComponent<'videoCall'> = {
                id: 'call-complex',
                type: 'videoCall',
                properties: {
                    roomId: 'complex-room',
                    layout: 'speaker',
                    features: {
                        chat: true,
                        screenShare: true,
                        recording: false,
                    },
                    ai: {
                        liveTranscription: true,
                        liveCaptions: true,
                        translation: 'de',
                        noiseCancellation: true,
                        speakerIdentification: false,
                        actionItemDetection: true,
                    },
                },
            }

            expect(component.properties?.features).toBeDefined()
            expect(component.properties?.ai).toBeDefined()
            expect(Object.keys(component.properties?.features || {})).toHaveLength(3)
            expect(Object.keys(component.properties?.ai || {})).toHaveLength(6)
        })

        it('handles complex data in aiVideo', () => {
            const component: TypedA2UIComponent<'aiVideo'> = {
                id: 'ai-video-complex',
                type: 'aiVideo',
                properties: {
                    template: 'advanced-template',
                    data: {
                        title: 'Complex Video',
                        sections: [
                            { id: 1, content: 'Intro' },
                            { id: 2, content: 'Main' },
                            { id: 3, content: 'Outro' },
                        ],
                        metadata: {
                            author: 'AI Agent',
                            version: '1.0',
                        },
                    },
                },
            }

            expect(component.properties?.data).toBeDefined()
            expect(component.properties?.data?.sections).toHaveLength(3)
            expect(component.properties?.data?.metadata).toBeDefined()
        })

        it('handles complex interactive configuration in aiVideoPlayer', () => {
            const component: TypedA2UIComponent<'aiVideoPlayer'> = {
                id: 'player-complex',
                type: 'aiVideoPlayer',
                properties: {
                    videoUrl: 'https://example.com/complex.mp4',
                    transcript: 'Long transcript...',
                    interactive: {
                        allowQuestions: true,
                        conversationalControl: true,
                        smartChapters: true,
                        semanticSearch: true,
                    },
                },
            }

            expect(component.properties?.interactive).toBeDefined()
            expect(Object.keys(component.properties?.interactive || {})).toHaveLength(4)
        })
    })
})
