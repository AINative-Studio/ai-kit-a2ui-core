/**
 * Performance Benchmarks for A2UI Video Protocol
 * Tests serialization, validation, state updates, and memory usage
 */

import { describe, it, expect } from 'vitest'
import type {
    CreateSurfaceMessage,
    UpdateComponentsMessage,
    UpdateDataModelMessage,
    UserActionMessage,
} from '../../src/types/protocol.js'
import type { A2UIComponent } from '../../src/types/components.js'
import {
    validateComponentProperties,
    applyDefaults,
} from '../../src/types/validation.js'

/**
 * Benchmark utilities
 */
interface BenchmarkResult {
    operation: string
    iterations: number
    totalTime: number
    avgTime: number
    minTime: number
    maxTime: number
    opsPerSecond: number
}

function benchmark(
    operation: string,
    fn: () => void,
    iterations: number = 10000
): BenchmarkResult {
    const times: number[] = []
    let totalTime = 0

    // Warmup
    for (let i = 0; i < 100; i++) {
        fn()
    }

    // Actual benchmark
    for (let i = 0; i < iterations; i++) {
        const start = performance.now()
        fn()
        const end = performance.now()
        const time = end - start
        times.push(time)
        totalTime += time
    }

    times.sort((a, b) => a - b)

    return {
        operation,
        iterations,
        totalTime,
        avgTime: totalTime / iterations,
        minTime: times[0],
        maxTime: times[times.length - 1],
        opsPerSecond: (iterations / totalTime) * 1000,
    }
}

function formatBenchmarkResult(result: BenchmarkResult): string {
    return [
        `Operation: ${result.operation}`,
        `Iterations: ${result.iterations.toLocaleString()}`,
        `Total Time: ${result.totalTime.toFixed(2)}ms`,
        `Average: ${result.avgTime.toFixed(4)}ms`,
        `Min: ${result.minTime.toFixed(4)}ms`,
        `Max: ${result.maxTime.toFixed(4)}ms`,
        `Throughput: ${result.opsPerSecond.toFixed(0)} ops/sec`,
    ].join('\n  ')
}

/**
 * Memory profiling utilities
 */
interface MemoryProfile {
    operation: string
    heapUsedBefore: number
    heapUsedAfter: number
    heapDelta: number
    heapDeltaMB: number
    externalBefore: number
    externalAfter: number
    externalDelta: number
}

function profileMemory(operation: string, fn: () => void): MemoryProfile {
    // Force garbage collection if available
    if (global.gc) {
        global.gc()
    }

    const before = process.memoryUsage()

    fn()

    const after = process.memoryUsage()

    const heapDelta = after.heapUsed - before.heapUsed

    return {
        operation,
        heapUsedBefore: before.heapUsed,
        heapUsedAfter: after.heapUsed,
        heapDelta,
        heapDeltaMB: heapDelta / (1024 * 1024),
        externalBefore: before.external,
        externalAfter: after.external,
        externalDelta: after.external - before.external,
    }
}

function formatMemoryProfile(profile: MemoryProfile): string {
    return [
        `Operation: ${profile.operation}`,
        `Heap Used Before: ${(profile.heapUsedBefore / (1024 * 1024)).toFixed(2)} MB`,
        `Heap Used After: ${(profile.heapUsedAfter / (1024 * 1024)).toFixed(2)} MB`,
        `Heap Delta: ${profile.heapDeltaMB.toFixed(2)} MB`,
        `External Delta: ${(profile.externalDelta / (1024 * 1024)).toFixed(2)} MB`,
    ].join('\n  ')
}

describe('Performance Benchmarks - Message Serialization/Deserialization', () => {
    it('should benchmark CreateSurfaceMessage serialization', () => {
        const message: CreateSurfaceMessage = {
            type: 'createSurface',
            surfaceId: 'test-surface',
            components: [
                {
                    id: 'recorder-1',
                    type: 'videoRecorder',
                    properties: {
                        mode: 'screen',
                        audio: true,
                        quality: 'high',
                        ai: {
                            transcribe: true,
                            highlights: true,
                        },
                    },
                },
            ],
            dataModel: {
                user: { name: 'Test User' },
                settings: { theme: 'dark' },
            },
            timestamp: Date.now(),
        }

        const result = benchmark(
            'CreateSurfaceMessage JSON.stringify',
            () => {
                JSON.stringify(message)
            },
            10000
        )

        console.log('\n' + formatBenchmarkResult(result))

        // Performance assertions
        expect(result.avgTime).toBeLessThan(1) // Should average < 1ms
        expect(result.opsPerSecond).toBeGreaterThan(1000) // Should handle > 1000 ops/sec
    })

    it('should benchmark CreateSurfaceMessage deserialization', () => {
        const message: CreateSurfaceMessage = {
            type: 'createSurface',
            surfaceId: 'test-surface',
            components: [
                {
                    id: 'recorder-1',
                    type: 'videoRecorder',
                    properties: {
                        mode: 'screen',
                        audio: true,
                        quality: 'high',
                    },
                },
            ],
            dataModel: {
                user: { name: 'Test User' },
            },
            timestamp: Date.now(),
        }

        const json = JSON.stringify(message)

        const result = benchmark(
            'CreateSurfaceMessage JSON.parse',
            () => {
                JSON.parse(json)
            },
            10000
        )

        console.log('\n' + formatBenchmarkResult(result))

        expect(result.avgTime).toBeLessThan(1)
        expect(result.opsPerSecond).toBeGreaterThan(1000)
    })

    it('should benchmark UpdateComponentsMessage serialization', () => {
        const message: UpdateComponentsMessage = {
            type: 'updateComponents',
            surfaceId: 'test-surface',
            updates: [
                {
                    id: 'recorder-1',
                    operation: 'update',
                    component: {
                        id: 'recorder-1',
                        type: 'videoRecorder',
                        properties: {
                            mode: 'camera',
                            audio: false,
                        },
                    },
                },
            ],
            timestamp: Date.now(),
        }

        const result = benchmark(
            'UpdateComponentsMessage JSON.stringify',
            () => {
                JSON.stringify(message)
            },
            10000
        )

        console.log('\n' + formatBenchmarkResult(result))

        expect(result.avgTime).toBeLessThan(0.5)
        expect(result.opsPerSecond).toBeGreaterThan(2000)
    })

    it('should benchmark UpdateDataModelMessage serialization', () => {
        const message: UpdateDataModelMessage = {
            type: 'updateDataModel',
            surfaceId: 'test-surface',
            updates: [
                { path: '/user/name', operation: 'set', value: 'New Name' },
                { path: '/settings/theme', operation: 'set', value: 'light' },
                { path: '/recording/status', operation: 'set', value: 'active' },
            ],
            timestamp: Date.now(),
        }

        const result = benchmark(
            'UpdateDataModelMessage JSON.stringify',
            () => {
                JSON.stringify(message)
            },
            10000
        )

        console.log('\n' + formatBenchmarkResult(result))

        expect(result.avgTime).toBeLessThan(0.5)
        expect(result.opsPerSecond).toBeGreaterThan(2000)
    })

    it('should benchmark UserActionMessage serialization', () => {
        const message: UserActionMessage = {
            type: 'userAction',
            surfaceId: 'test-surface',
            action: 'startRecording',
            componentId: 'recorder-1',
            context: {
                mode: 'screen',
                quality: 'high',
            },
            dataModel: {
                user: { name: 'Test User' },
                recording: { active: true },
            },
            timestamp: Date.now(),
        }

        const result = benchmark(
            'UserActionMessage JSON.stringify',
            () => {
                JSON.stringify(message)
            },
            10000
        )

        console.log('\n' + formatBenchmarkResult(result))

        expect(result.avgTime).toBeLessThan(1)
        expect(result.opsPerSecond).toBeGreaterThan(1000)
    })

    it('should benchmark large message with multiple video components', () => {
        const components: A2UIComponent[] = []

        // Create 50 video components
        for (let i = 0; i < 50; i++) {
            components.push({
                id: `recorder-${i}`,
                type: 'videoRecorder',
                properties: {
                    mode: i % 2 === 0 ? 'screen' : 'camera',
                    audio: true,
                    quality: 'high',
                    ai: {
                        transcribe: true,
                        highlights: i % 3 === 0,
                    },
                },
            })
        }

        const message: CreateSurfaceMessage = {
            type: 'createSurface',
            surfaceId: 'large-surface',
            components,
            dataModel: {},
            timestamp: Date.now(),
        }

        const result = benchmark(
            'Large message (50 components) JSON.stringify',
            () => {
                JSON.stringify(message)
            },
            1000
        )

        console.log('\n' + formatBenchmarkResult(result))

        expect(result.avgTime).toBeLessThan(5) // Should handle large messages in < 5ms
        expect(result.opsPerSecond).toBeGreaterThan(200)
    })
})

describe('Performance Benchmarks - Component Validation', () => {
    it('should benchmark videoRecorder validation with valid properties', () => {
        const properties = {
            mode: 'screen' as const,
            audio: true,
            quality: 'high' as const,
            ai: {
                transcribe: true,
                highlights: false,
            },
        }

        const result = benchmark(
            'videoRecorder validation (valid)',
            () => {
                validateComponentProperties('videoRecorder', properties)
            },
            10000
        )

        console.log('\n' + formatBenchmarkResult(result))

        expect(result.avgTime).toBeLessThan(0.5)
        expect(result.opsPerSecond).toBeGreaterThan(2000)
    })

    it('should benchmark videoRecorder validation with invalid properties', () => {
        const properties = {
            mode: 'invalid',
            audio: 'yes', // Wrong type
            quality: 'ultra',
        }

        const result = benchmark(
            'videoRecorder validation (invalid)',
            () => {
                validateComponentProperties('videoRecorder', properties)
            },
            10000
        )

        console.log('\n' + formatBenchmarkResult(result))

        expect(result.avgTime).toBeLessThan(1)
        expect(result.opsPerSecond).toBeGreaterThan(1000)
    })

    it('should benchmark videoCall validation with complex properties', () => {
        const properties = {
            roomId: 'room-123',
            layout: 'grid' as const,
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
        }

        const result = benchmark(
            'videoCall validation (complex)',
            () => {
                validateComponentProperties('videoCall', properties)
            },
            10000
        )

        console.log('\n' + formatBenchmarkResult(result))

        expect(result.avgTime).toBeLessThan(1)
        expect(result.opsPerSecond).toBeGreaterThan(1000)
    })

    it('should benchmark aiVideo validation', () => {
        const properties = {
            prompt: 'Create a welcome video',
            template: 'welcome-v1',
            data: { userName: 'Test', company: 'ACME' },
            voice: 'en-US-Neural',
            streaming: true,
        }

        const result = benchmark(
            'aiVideo validation',
            () => {
                validateComponentProperties('aiVideo', properties)
            },
            10000
        )

        console.log('\n' + formatBenchmarkResult(result))

        expect(result.avgTime).toBeLessThan(0.5)
        expect(result.opsPerSecond).toBeGreaterThan(2000)
    })

    it('should benchmark aiVideoPlayer validation', () => {
        const properties = {
            videoUrl: 'https://example.com/video.mp4',
            transcript: 'Long transcript text...'.repeat(100),
            interactive: {
                allowQuestions: true,
                conversationalControl: true,
                smartChapters: true,
                semanticSearch: true,
            },
        }

        const result = benchmark(
            'aiVideoPlayer validation',
            () => {
                validateComponentProperties('aiVideoPlayer', properties)
            },
            10000
        )

        console.log('\n' + formatBenchmarkResult(result))

        expect(result.avgTime).toBeLessThan(0.5)
        expect(result.opsPerSecond).toBeGreaterThan(2000)
    })

    it('should benchmark batch validation of multiple components', () => {
        const components = [
            { type: 'videoRecorder' as const, props: { mode: 'screen' as const } },
            {
                type: 'videoCall' as const,
                props: { roomId: 'room-1', layout: 'grid' as const },
            },
            { type: 'aiVideo' as const, props: { prompt: 'Test', streaming: true } },
            {
                type: 'aiVideoPlayer' as const,
                props: { videoUrl: 'https://example.com/video.mp4' },
            },
        ]

        const result = benchmark(
            'Batch validation (4 components)',
            () => {
                components.forEach((comp) => {
                    validateComponentProperties(comp.type, comp.props)
                })
            },
            10000
        )

        console.log('\n' + formatBenchmarkResult(result))

        expect(result.avgTime).toBeLessThan(2)
        expect(result.opsPerSecond).toBeGreaterThan(500)
    })
})

describe('Performance Benchmarks - State Updates', () => {
    it('should benchmark applying defaults to videoRecorder', () => {
        const properties = {
            mode: 'camera' as const,
        }

        const result = benchmark(
            'applyDefaults videoRecorder',
            () => {
                applyDefaults('videoRecorder', properties)
            },
            10000
        )

        console.log('\n' + formatBenchmarkResult(result))

        expect(result.avgTime).toBeLessThan(0.5)
        expect(result.opsPerSecond).toBeGreaterThan(2000)
    })

    it('should benchmark applying defaults with nested objects', () => {
        const properties = {
            roomId: 'room-1',
            features: {
                chat: false,
            },
            ai: {
                liveTranscription: true,
            },
        }

        const result = benchmark(
            'applyDefaults videoCall (nested)',
            () => {
                applyDefaults('videoCall', properties)
            },
            10000
        )

        console.log('\n' + formatBenchmarkResult(result))

        expect(result.avgTime).toBeLessThan(1)
        expect(result.opsPerSecond).toBeGreaterThan(1000)
    })

    it('should benchmark component property updates', () => {
        let component: A2UIComponent = {
            id: 'recorder-1',
            type: 'videoRecorder',
            properties: {
                mode: 'screen',
                audio: true,
                quality: 'high',
            },
        }

        const result = benchmark(
            'Component property update',
            () => {
                component = {
                    ...component,
                    properties: {
                        ...component.properties,
                        mode: 'camera',
                        audio: false,
                    },
                }
            },
            10000
        )

        console.log('\n' + formatBenchmarkResult(result))

        expect(result.avgTime).toBeLessThan(0.5)
        expect(result.opsPerSecond).toBeGreaterThan(2000)
    })

    it('should benchmark data model updates with JSON Pointer paths', () => {
        let dataModel = {
            user: { name: 'Test User', email: 'test@example.com' },
            recording: { active: false, duration: 0 },
            settings: { quality: 'high', audio: true },
        }

        const updates = [
            { path: '/recording/active', value: true },
            { path: '/recording/duration', value: 120 },
            { path: '/user/name', value: 'Updated User' },
        ]

        const result = benchmark(
            'Data model updates (3 paths)',
            () => {
                updates.forEach((update) => {
                    const keys = update.path.split('/').filter(Boolean)
                    let target: any = dataModel
                    for (let i = 0; i < keys.length - 1; i++) {
                        target = target[keys[i]]
                    }
                    target[keys[keys.length - 1]] = update.value
                })
            },
            10000
        )

        console.log('\n' + formatBenchmarkResult(result))

        expect(result.avgTime).toBeLessThan(0.5)
        expect(result.opsPerSecond).toBeGreaterThan(2000)
    })

    it('should benchmark large data model updates', () => {
        const dataModel: Record<string, any> = {}

        // Create large data model with 100 nested objects
        for (let i = 0; i < 100; i++) {
            dataModel[`section${i}`] = {
                id: i,
                name: `Section ${i}`,
                data: { value: i * 2, active: i % 2 === 0 },
            }
        }

        const result = benchmark(
            'Large data model update (100 sections)',
            () => {
                const updated = { ...dataModel }
                updated.section50 = { ...updated.section50, name: 'Updated' }
            },
            10000
        )

        console.log('\n' + formatBenchmarkResult(result))

        expect(result.avgTime).toBeLessThan(1)
        expect(result.opsPerSecond).toBeGreaterThan(1000)
    })
})

describe('Performance Benchmarks - Memory Usage Profiling', () => {
    it('should profile memory for creating large message', () => {
        const profile = profileMemory(
            'Create large CreateSurfaceMessage',
            () => {
                const components: A2UIComponent[] = []
                for (let i = 0; i < 1000; i++) {
                    components.push({
                        id: `component-${i}`,
                        type: 'videoRecorder',
                        properties: {
                            mode: 'screen',
                            audio: true,
                            quality: 'high',
                        },
                    })
                }

                const message: CreateSurfaceMessage = {
                    type: 'createSurface',
                    surfaceId: 'large-surface',
                    components,
                    dataModel: {},
                }

                JSON.stringify(message)
            }
        )

        console.log('\n' + formatMemoryProfile(profile))

        // Memory should be reasonable for 1000 components
        expect(profile.heapDeltaMB).toBeLessThan(10) // Should use < 10MB
    })

    it('should profile memory for repeated validations', () => {
        const properties = {
            mode: 'screen' as const,
            audio: true,
            quality: 'high' as const,
        }

        const profile = profileMemory('1000 validations', () => {
            for (let i = 0; i < 1000; i++) {
                validateComponentProperties('videoRecorder', properties)
            }
        })

        console.log('\n' + formatMemoryProfile(profile))

        // Validation should not leak memory
        expect(profile.heapDeltaMB).toBeLessThan(5)
    })

    it('should profile memory for serialization/deserialization cycle', () => {
        const message: CreateSurfaceMessage = {
            type: 'createSurface',
            surfaceId: 'test-surface',
            components: [
                {
                    id: 'recorder-1',
                    type: 'videoRecorder',
                    properties: {
                        mode: 'screen',
                        audio: true,
                        quality: 'high',
                    },
                },
            ],
            dataModel: { user: { name: 'Test' } },
        }

        const profile = profileMemory('1000 serialize/deserialize cycles', () => {
            for (let i = 0; i < 1000; i++) {
                const json = JSON.stringify(message)
                JSON.parse(json)
            }
        })

        console.log('\n' + formatMemoryProfile(profile))

        expect(profile.heapDeltaMB).toBeLessThan(5)
    })

    it('should profile memory for component state updates', () => {
        let components: A2UIComponent[] = []

        // Initialize with 100 components
        for (let i = 0; i < 100; i++) {
            components.push({
                id: `comp-${i}`,
                type: 'videoRecorder',
                properties: { mode: 'screen' },
            })
        }

        const profile = profileMemory('100 component updates', () => {
            // Update each component
            components = components.map((comp) => ({
                ...comp,
                properties: {
                    ...comp.properties,
                    mode: 'camera',
                },
            }))
        })

        console.log('\n' + formatMemoryProfile(profile))

        expect(profile.heapDeltaMB).toBeLessThan(2)
    })

    it('should profile memory for deep nested data model', () => {
        const profile = profileMemory('Create deep nested data model', () => {
            const dataModel: Record<string, any> = {}

            // Create deep nesting (10 levels)
            let current = dataModel
            for (let i = 0; i < 10; i++) {
                current[`level${i}`] = {
                    id: i,
                    data: { value: i * 10 },
                    items: Array(10)
                        .fill(null)
                        .map((_, j) => ({ id: j, value: j })),
                }
                current = current[`level${i}`]
            }

            JSON.stringify(dataModel)
        })

        console.log('\n' + formatMemoryProfile(profile))

        expect(profile.heapDeltaMB).toBeLessThan(5)
    })

    it('should profile memory for validation with errors', () => {
        const invalidProperties = {
            mode: 'invalid-mode',
            audio: 'yes',
            quality: 'ultra-mega',
            extra: 'not-allowed',
        }

        const profile = profileMemory('1000 validations with errors', () => {
            for (let i = 0; i < 1000; i++) {
                validateComponentProperties('videoRecorder', invalidProperties)
            }
        })

        console.log('\n' + formatMemoryProfile(profile))

        // Error generation should not leak memory
        expect(profile.heapDeltaMB).toBeLessThan(5)
    })
})

describe('Performance Benchmarks - Edge Cases', () => {
    it('should benchmark deeply nested component properties', () => {
        const properties = {
            roomId: 'room-1',
            layout: 'grid' as const,
            features: {
                chat: true,
                screenShare: true,
                recording: true,
            },
            ai: {
                liveTranscription: true,
                liveCaptions: true,
                translation: 'es-MX',
                noiseCancellation: true,
                speakerIdentification: true,
                actionItemDetection: true,
            },
            metadata: {
                created: Date.now(),
                tags: ['important', 'client', 'demo'],
                participants: Array(50)
                    .fill(null)
                    .map((_, i) => ({
                        id: `user-${i}`,
                        name: `User ${i}`,
                    })),
            },
        }

        const result = benchmark(
            'Deep nested validation',
            () => {
                validateComponentProperties('videoCall', properties)
            },
            5000
        )

        console.log('\n' + formatBenchmarkResult(result))

        expect(result.avgTime).toBeLessThan(2)
        expect(result.opsPerSecond).toBeGreaterThan(500)
    })

    it('should benchmark empty/minimal messages', () => {
        const message: CreateSurfaceMessage = {
            type: 'createSurface',
            surfaceId: 'minimal',
            components: [],
        }

        const result = benchmark(
            'Minimal message serialization',
            () => {
                JSON.stringify(message)
            },
            10000
        )

        console.log('\n' + formatBenchmarkResult(result))

        expect(result.avgTime).toBeLessThan(0.1)
        expect(result.opsPerSecond).toBeGreaterThan(10000)
    })

    it('should benchmark message with large data model', () => {
        const dataModel: Record<string, any> = {}

        // Create large data model
        for (let i = 0; i < 1000; i++) {
            dataModel[`key${i}`] = {
                id: i,
                value: `Value ${i}`,
                timestamp: Date.now(),
            }
        }

        const message: CreateSurfaceMessage = {
            type: 'createSurface',
            surfaceId: 'large-data',
            components: [],
            dataModel,
        }

        const result = benchmark(
            'Large data model serialization',
            () => {
                JSON.stringify(message)
            },
            1000
        )

        console.log('\n' + formatBenchmarkResult(result))

        expect(result.avgTime).toBeLessThan(10)
        expect(result.opsPerSecond).toBeGreaterThan(100)
    })
})
