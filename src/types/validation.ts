/**
 * Component Validation Schemas
 * JSON Schema-based validation for A2UI component properties
 */

import type { ComponentType, ComponentProperties } from './components.js'

/**
 * JSON Schema definition
 */
export interface JSONSchema {
    type?: string | string[]
    properties?: Record<string, JSONSchema>
    required?: string[]
    items?: JSONSchema
    enum?: unknown[]
    default?: unknown
    oneOf?: JSONSchema[]
    anyOf?: JSONSchema[]
    allOf?: JSONSchema[]
    additionalProperties?: boolean | JSONSchema
    pattern?: string
    minLength?: number
    maxLength?: number
    minimum?: number
    maximum?: number
    description?: string
}

/**
 * Component validation schema with defaults
 */
export interface ComponentSchema<T extends ComponentType = ComponentType> {
    type: T
    schema: JSONSchema
    defaults: Partial<ComponentProperties[T]>
}

/**
 * Validation result
 */
export interface ValidationResult {
    valid: boolean
    errors: ValidationError[]
}

/**
 * Validation error
 */
export interface ValidationError {
    path: string
    message: string
    expected?: string
    received?: string
}

/**
 * Video component validation schemas
 */
export const videoComponentSchemas = {
    videoRecorder: {
        type: 'videoRecorder',
        schema: {
            type: 'object',
            properties: {
                mode: {
                    type: 'string',
                    enum: ['screen', 'camera', 'pip'],
                    description: 'Recording mode: screen capture, camera, or picture-in-picture'
                },
                audio: {
                    type: 'boolean',
                    default: true,
                    description: 'Enable audio recording'
                },
                quality: {
                    type: 'string',
                    enum: ['low', 'medium', 'high'],
                    default: 'high',
                    description: 'Video quality setting'
                },
                ai: {
                    type: 'object',
                    properties: {
                        transcribe: {
                            type: 'boolean',
                            default: false,
                            description: 'Enable AI transcription'
                        },
                        highlights: {
                            type: 'boolean',
                            default: false,
                            description: 'Enable AI highlight detection'
                        },
                        summary: {
                            type: 'boolean',
                            default: false,
                            description: 'Enable AI summary generation'
                        },
                        zerodb: {
                            type: 'boolean',
                            default: false,
                            description: 'Auto-store in ZeroDB'
                        }
                    },
                    additionalProperties: false
                },
                onStart: {
                    type: 'string',
                    description: 'JSON pointer to action handler for recording start'
                },
                onComplete: {
                    type: 'string',
                    description: 'JSON pointer to action handler for recording completion'
                },
                onError: {
                    type: 'string',
                    description: 'JSON pointer to error handler'
                }
            },
            required: ['mode'],
            additionalProperties: false
        },
        defaults: {
            mode: 'screen',
            audio: true,
            quality: 'high'
        }
    } as ComponentSchema<'videoRecorder'>,

    videoCall: {
        type: 'videoCall',
        schema: {
            type: 'object',
            properties: {
                roomId: {
                    type: 'string',
                    minLength: 1,
                    description: 'Unique room identifier for the video call'
                },
                layout: {
                    type: 'string',
                    enum: ['grid', 'speaker', 'sidebar'],
                    default: 'grid',
                    description: 'Video layout mode'
                },
                features: {
                    type: 'object',
                    properties: {
                        chat: {
                            type: 'boolean',
                            default: true,
                            description: 'Enable text chat'
                        },
                        screenShare: {
                            type: 'boolean',
                            default: true,
                            description: 'Enable screen sharing'
                        },
                        recording: {
                            type: 'boolean',
                            default: false,
                            description: 'Enable call recording'
                        }
                    },
                    additionalProperties: false
                },
                ai: {
                    type: 'object',
                    properties: {
                        liveTranscription: {
                            type: 'boolean',
                            default: false,
                            description: 'Enable live transcription'
                        },
                        liveCaptions: {
                            type: 'boolean',
                            default: false,
                            description: 'Enable live captions'
                        },
                        translation: {
                            type: 'string',
                            pattern: '^[a-z]{2}(-[A-Z]{2})?$',
                            description: 'Language code for translation (e.g., "en", "es-MX")'
                        },
                        noiseCancellation: {
                            type: 'boolean',
                            default: false,
                            description: 'Enable AI noise cancellation'
                        },
                        speakerIdentification: {
                            type: 'boolean',
                            default: false,
                            description: 'Enable speaker identification'
                        },
                        actionItemDetection: {
                            type: 'boolean',
                            default: false,
                            description: 'Enable automatic action item detection'
                        }
                    },
                    additionalProperties: false
                },
                onJoin: {
                    type: 'string',
                    description: 'JSON pointer to action handler for participant join'
                },
                onLeave: {
                    type: 'string',
                    description: 'JSON pointer to action handler for participant leave'
                },
                onError: {
                    type: 'string',
                    description: 'JSON pointer to error handler'
                }
            },
            required: ['roomId'],
            additionalProperties: false
        },
        defaults: {
            layout: 'grid',
            features: {
                chat: true,
                screenShare: true,
                recording: false
            }
        }
    } as ComponentSchema<'videoCall'>,

    aiVideo: {
        type: 'aiVideo',
        schema: {
            type: 'object',
            properties: {
                prompt: {
                    type: 'string',
                    minLength: 1,
                    description: 'Text prompt for AI video generation'
                },
                template: {
                    type: 'string',
                    description: 'Template identifier for video generation'
                },
                data: {
                    type: 'object',
                    description: 'Data context for template rendering'
                },
                voice: {
                    type: 'string',
                    description: 'Voice identifier for narration'
                },
                streaming: {
                    type: 'boolean',
                    default: true,
                    description: 'Enable streaming generation with progress updates'
                },
                onProgress: {
                    type: 'string',
                    description: 'JSON pointer to progress handler'
                },
                onComplete: {
                    type: 'string',
                    description: 'JSON pointer to completion handler'
                },
                onError: {
                    type: 'string',
                    description: 'JSON pointer to error handler'
                }
            },
            additionalProperties: false
        },
        defaults: {
            streaming: true
        }
    } as ComponentSchema<'aiVideo'>,

    aiVideoPlayer: {
        type: 'aiVideoPlayer',
        schema: {
            type: 'object',
            properties: {
                videoUrl: {
                    type: 'string',
                    minLength: 1,
                    pattern: '^https?://.+',
                    description: 'URL of the video to play'
                },
                transcript: {
                    type: 'string',
                    description: 'Video transcript text'
                },
                interactive: {
                    type: 'object',
                    properties: {
                        allowQuestions: {
                            type: 'boolean',
                            default: true,
                            description: 'Enable AI Q&A about video content'
                        },
                        conversationalControl: {
                            type: 'boolean',
                            default: true,
                            description: 'Enable conversational playback control'
                        },
                        smartChapters: {
                            type: 'boolean',
                            default: true,
                            description: 'Enable AI-generated smart chapters'
                        },
                        semanticSearch: {
                            type: 'boolean',
                            default: false,
                            description: 'Enable semantic search within video'
                        }
                    },
                    additionalProperties: false
                },
                onProgress: {
                    type: 'string',
                    description: 'JSON pointer to progress handler'
                },
                onQuestion: {
                    type: 'string',
                    description: 'JSON pointer to question handler'
                }
            },
            required: ['videoUrl'],
            additionalProperties: false
        },
        defaults: {
            interactive: {
                allowQuestions: true,
                conversationalControl: true,
                smartChapters: true,
                semanticSearch: false
            }
        }
    } as ComponentSchema<'aiVideoPlayer'>
} as const

/**
 * Validate component properties against schema
 */
export function validateComponentProperties<T extends ComponentType>(
    componentType: T,
    properties: unknown
): ValidationResult {
    const errors: ValidationError[] = []

    // Get schema for component type
    const componentSchema = videoComponentSchemas[componentType as keyof typeof videoComponentSchemas]

    if (!componentSchema) {
        return {
            valid: true,
            errors: []
        }
    }

    // Validate properties exist
    if (properties === null || properties === undefined) {
        errors.push({
            path: 'properties',
            message: 'Properties object is required',
            expected: 'object',
            received: typeof properties
        })
        return { valid: false, errors }
    }

    if (typeof properties !== 'object' || Array.isArray(properties)) {
        errors.push({
            path: 'properties',
            message: 'Properties must be an object',
            expected: 'object',
            received: Array.isArray(properties) ? 'array' : typeof properties
        })
        return { valid: false, errors }
    }

    const props = properties as Record<string, unknown>
    const schema = componentSchema.schema

    // Validate required fields
    if (schema.required) {
        for (const field of schema.required) {
            if (!(field in props) || props[field] === undefined || props[field] === null) {
                errors.push({
                    path: field,
                    message: `Required field '${field}' is missing`,
                    expected: 'defined value',
                    received: 'undefined'
                })
            }
        }
    }

    // Validate property types and enums
    if (schema.properties) {
        for (const [key, value] of Object.entries(props)) {
            const fieldSchema = schema.properties[key]

            if (!fieldSchema) {
                if (schema.additionalProperties === false) {
                    errors.push({
                        path: key,
                        message: `Additional property '${key}' is not allowed`,
                        expected: 'known property',
                        received: key
                    })
                }
                continue
            }

            // Skip validation for undefined optional fields
            if (value === undefined || value === null) {
                continue
            }

            // Validate type
            if (fieldSchema.type) {
                const actualType = Array.isArray(value) ? 'array' : typeof value
                const expectedTypes = Array.isArray(fieldSchema.type) ? fieldSchema.type : [fieldSchema.type]

                if (!expectedTypes.includes(actualType)) {
                    errors.push({
                        path: key,
                        message: `Field '${key}' has invalid type`,
                        expected: expectedTypes.join(' | '),
                        received: actualType
                    })
                    continue
                }
            }

            // Validate enum
            if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
                errors.push({
                    path: key,
                    message: `Field '${key}' must be one of allowed values`,
                    expected: fieldSchema.enum.map(String).join(', '),
                    received: String(value)
                })
            }

            // Validate string constraints
            if (fieldSchema.type === 'string' && typeof value === 'string') {
                if (fieldSchema.minLength !== undefined && value.length < fieldSchema.minLength) {
                    errors.push({
                        path: key,
                        message: `Field '${key}' is too short`,
                        expected: `length >= ${fieldSchema.minLength}`,
                        received: `length = ${value.length}`
                    })
                }

                if (fieldSchema.pattern) {
                    const regex = new RegExp(fieldSchema.pattern)
                    if (!regex.test(value)) {
                        errors.push({
                            path: key,
                            message: `Field '${key}' does not match required pattern`,
                            expected: fieldSchema.pattern,
                            received: value
                        })
                    }
                }
            }

            // Validate nested objects
            if (fieldSchema.type === 'object' && typeof value === 'object' && !Array.isArray(value)) {
                const nestedProps = fieldSchema.properties
                if (nestedProps) {
                    for (const [nestedKey, nestedValue] of Object.entries(value as Record<string, unknown>)) {
                        const nestedFieldSchema = nestedProps[nestedKey]

                        if (!nestedFieldSchema && fieldSchema.additionalProperties === false) {
                            errors.push({
                                path: `${key}.${nestedKey}`,
                                message: `Additional property '${nestedKey}' is not allowed in '${key}'`,
                                expected: 'known property',
                                received: nestedKey
                            })
                            continue
                        }

                        if (nestedFieldSchema && nestedValue !== undefined && nestedValue !== null) {
                            // Validate nested field type
                            if (nestedFieldSchema.type) {
                                const actualType = typeof nestedValue
                                if (actualType !== nestedFieldSchema.type) {
                                    errors.push({
                                        path: `${key}.${nestedKey}`,
                                        message: `Field '${key}.${nestedKey}' has invalid type`,
                                        expected: String(nestedFieldSchema.type),
                                        received: actualType
                                    })
                                }
                            }

                            // Validate nested enum
                            if (nestedFieldSchema.enum && !nestedFieldSchema.enum.includes(nestedValue)) {
                                errors.push({
                                    path: `${key}.${nestedKey}`,
                                    message: `Field '${key}.${nestedKey}' must be one of allowed values`,
                                    expected: nestedFieldSchema.enum.map(String).join(', '),
                                    received: String(nestedValue)
                                })
                            }

                            // Validate nested string pattern
                            if (nestedFieldSchema.type === 'string' && typeof nestedValue === 'string' && nestedFieldSchema.pattern) {
                                const regex = new RegExp(nestedFieldSchema.pattern)
                                if (!regex.test(nestedValue)) {
                                    errors.push({
                                        path: `${key}.${nestedKey}`,
                                        message: `Field '${key}.${nestedKey}' does not match required pattern`,
                                        expected: nestedFieldSchema.pattern,
                                        received: nestedValue
                                    })
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors
    }
}

/**
 * Apply default values to component properties
 */
export function applyDefaults<T extends ComponentType>(
    componentType: T,
    properties?: Partial<ComponentProperties[T]>
): ComponentProperties[T] {
    const componentSchema = videoComponentSchemas[componentType as keyof typeof videoComponentSchemas]

    if (!componentSchema) {
        return (properties || {}) as ComponentProperties[T]
    }

    const defaults = componentSchema.defaults
    const merged = { ...defaults, ...properties }

    // Deep merge nested defaults
    if (defaults && properties) {
        for (const key of Object.keys(defaults)) {
            const defaultValue = defaults[key as keyof typeof defaults]
            const providedValue = properties[key as keyof typeof properties]

            if (
                defaultValue &&
                typeof defaultValue === 'object' &&
                !Array.isArray(defaultValue) &&
                providedValue &&
                typeof providedValue === 'object' &&
                !Array.isArray(providedValue)
            ) {
                merged[key as keyof typeof merged] = {
                    ...(defaultValue as Record<string, unknown>),
                    ...(providedValue as Record<string, unknown>)
                } as typeof merged[keyof typeof merged]
            }
        }
    }

    return merged as ComponentProperties[T]
}

/**
 * Get default properties for a component type
 */
export function getDefaults<T extends ComponentType>(
    componentType: T
): Partial<ComponentProperties[T]> {
    const componentSchema = videoComponentSchemas[componentType as keyof typeof videoComponentSchemas]
    return (componentSchema?.defaults || {}) as Partial<ComponentProperties[T]>
}

/**
 * Get JSON schema for a component type
 */
export function getSchema<T extends ComponentType>(
    componentType: T
): JSONSchema | null {
    const componentSchema = videoComponentSchemas[componentType as keyof typeof videoComponentSchemas]
    return componentSchema?.schema || null
}
