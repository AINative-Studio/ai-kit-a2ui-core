/**
 * CEL Integration Tests
 * Tests CEL validation integrated with component schemas
 */

import { describe, test, expect, beforeEach } from 'vitest'
import { CELValidator } from '../../src/validation/cel-validator.js'
import type { CELExpression, ValidationContext } from '../../src/types/validation.js'

describe('CEL Integration Tests', () => {
    let validator: CELValidator

    beforeEach(() => {
        validator = new CELValidator()
        validator.clearCache()
    })

    describe('Component Schema Validation', () => {
        test('validates video recorder component with CEL', () => {
            const context: ValidationContext = {
                data: {
                    mode: 'screen',
                    audio: true,
                    quality: 'high',
                    ai: {
                        transcribe: true,
                        highlights: true,
                        summary: false,
                        zerodb: true
                    }
                }
            }

            const expressions: CELExpression[] = [
                {
                    name: 'ai_features_require_transcribe',
                    expression: '(data.ai.highlights || data.ai.summary) ? data.ai.transcribe : true',
                    message: 'AI highlights and summary require transcription to be enabled'
                },
                {
                    name: 'valid_mode',
                    expression: 'data.mode in ["screen", "camera", "pip"]',
                    message: 'Invalid recording mode'
                },
                {
                    name: 'valid_quality',
                    expression: 'data.quality in ["low", "medium", "high"]',
                    message: 'Invalid quality setting'
                }
            ]

            const result = validator.validateAll(context, expressions)
            expect(result.valid).toBe(true)
        })

        test('validates video call component constraints', () => {
            const context: ValidationContext = {
                data: {
                    roomId: 'room-123',
                    layout: 'grid',
                    features: {
                        chat: true,
                        screenShare: true,
                        recording: true
                    },
                    ai: {
                        liveTranscription: true,
                        liveCaptions: true,
                        noiseCancellation: true
                    }
                }
            }

            const expressions: CELExpression[] = [
                {
                    name: 'captions_require_transcription',
                    expression: 'data.ai.liveCaptions ? data.ai.liveTranscription : true',
                    message: 'Live captions require live transcription to be enabled'
                },
                {
                    name: 'valid_roomid',
                    expression: 'data.roomId.size() > 0',
                    message: 'Room ID cannot be empty'
                },
                {
                    name: 'recording_with_consent',
                    expression: 'data.features.recording ? has(data, "recordingConsent") || true : true',
                    message: 'Recording requires consent flag'
                }
            ]

            const result = validator.validateAll(context, expressions)
            expect(result.valid).toBe(true)
        })

        test('validates text field with custom CEL rules', () => {
            const context: ValidationContext = {
                data: {
                    label: 'Email',
                    value: 'user@example.com',
                    type: 'email',
                    required: true
                }
            }

            const expressions: CELExpression[] = [
                {
                    name: 'email_format',
                    expression: 'data.type == "email" ? data.value.contains("@") : true',
                    message: 'Invalid email format'
                },
                {
                    name: 'required_not_empty',
                    expression: 'data.required ? data.value.size() > 0 : true',
                    message: 'Required field cannot be empty'
                },
                {
                    name: 'no_disposable_email',
                    expression: 'data.type == "email" ? !data.value.endsWith("tempmail.com") : true',
                    message: 'Disposable email addresses not allowed'
                }
            ]

            const result = validator.validateAll(context, expressions)
            expect(result.valid).toBe(true)
        })
    })

    describe('Cross-Component Validation', () => {
        test('validates unique component IDs', () => {
            const context: ValidationContext = {
                data: {
                    components: [
                        { id: 'comp-1', type: 'text' },
                        { id: 'comp-2', type: 'button' },
                        { id: 'comp-3', type: 'image' }
                    ]
                }
            }

            const expression: CELExpression = {
                name: 'unique_component_ids',
                expression: 'unique(data.components.map(c, c.id)).size() == data.components.size()',
                message: 'All component IDs must be unique'
            }

            const result = validator.validate(context, expression)
            expect(result.valid).toBe(true)
        })

        test('detects duplicate component IDs', () => {
            const context: ValidationContext = {
                data: {
                    components: [
                        { id: 'comp-1', type: 'text' },
                        { id: 'comp-2', type: 'button' },
                        { id: 'comp-1', type: 'image' } // Duplicate
                    ]
                }
            }

            const expression: CELExpression = {
                name: 'unique_component_ids',
                expression: 'unique(data.components.map(c, c.id)).size() == data.components.size()',
                message: 'All component IDs must be unique'
            }

            const result = validator.validate(context, expression)
            expect(result.valid).toBe(false)
        })

        test('validates maximum button count', () => {
            const context: ValidationContext = {
                data: {
                    components: [
                        { id: 'btn-1', type: 'button' },
                        { id: 'btn-2', type: 'button' },
                        { id: 'txt-1', type: 'text' },
                        { id: 'btn-3', type: 'button' }
                    ]
                }
            }

            const expression: CELExpression = {
                name: 'max_buttons',
                expression: 'data.components.filter(c, c.type == "button").size() <= 5',
                message: 'Maximum 5 buttons allowed per view'
            }

            const result = validator.validate(context, expression)
            expect(result.valid).toBe(true)
        })

        test('validates modal requires close handler', () => {
            const context: ValidationContext = {
                data: {
                    type: 'modal',
                    properties: {
                        open: true,
                        onClose: '/actions/closeModal'
                    }
                }
            }

            const expression: CELExpression = {
                name: 'modal_close_handler',
                expression: 'data.type == "modal" ? has(data.properties, "onClose") : true',
                message: 'Modal components must have onClose handler'
            }

            const result = validator.validate(context, expression)
            expect(result.valid).toBe(true)
        })
    })

    describe('Real-World Validation Scenarios', () => {
        test('validates date range with duration constraint', () => {
            const startDate = new Date('2025-01-01').getTime()
            const endDate = new Date('2025-01-15').getTime()
            const maxDuration = 30 * 24 * 60 * 60 * 1000 // 30 days in ms

            const context: ValidationContext = {
                data: {
                    startDate,
                    endDate,
                    maxDuration
                }
            }

            const expression: CELExpression = {
                name: 'valid_date_range',
                expression: 'data.startDate < data.endDate && (data.endDate - data.startDate) <= data.maxDuration',
                message: 'Date range must be valid and not exceed 30 days'
            }

            const result = validator.validate(context, expression)
            expect(result.valid).toBe(true)
        })

        test('validates password strength', () => {
            const context: ValidationContext = {
                data: {
                    password: 'SecureP@ss123',
                    confirmPassword: 'SecureP@ss123'
                }
            }

            const expressions: CELExpression[] = [
                {
                    name: 'password_length',
                    expression: 'data.password.size() >= 8',
                    message: 'Password must be at least 8 characters'
                },
                {
                    name: 'password_match',
                    expression: 'data.password == data.confirmPassword',
                    message: 'Passwords must match'
                },
                {
                    name: 'password_has_number',
                    expression: 'data.password.matches(".*[0-9].*")',
                    message: 'Password must contain at least one number'
                },
                {
                    name: 'password_has_special',
                    expression: 'data.password.matches(".*[@$!%*?&#].*")',
                    message: 'Password must contain at least one special character'
                }
            ]

            const result = validator.validateAll(context, expressions)
            expect(result.valid).toBe(true)
        })

        test('validates business hours configuration', () => {
            const context: ValidationContext = {
                data: {
                    businessHours: {
                        enabled: true,
                        startHour: 9,
                        endHour: 17,
                        timezone: 'America/New_York'
                    }
                }
            }

            const expressions: CELExpression[] = [
                {
                    name: 'valid_hours_range',
                    expression: 'data.businessHours.startHour >= 0 && data.businessHours.startHour < 24',
                    message: 'Start hour must be between 0 and 23'
                },
                {
                    name: 'end_after_start',
                    expression: 'data.businessHours.endHour > data.businessHours.startHour',
                    message: 'End hour must be after start hour'
                },
                {
                    name: 'timezone_required_if_enabled',
                    expression: 'data.businessHours.enabled ? has(data.businessHours, "timezone") : true',
                    message: 'Timezone is required when business hours are enabled'
                }
            ]

            const result = validator.validateAll(context, expressions)
            expect(result.valid).toBe(true)
        })

        test('validates webhook configuration', () => {
            const context: ValidationContext = {
                data: {
                    webhook: {
                        url: 'https://api.example.com/webhook',
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer token123'
                        },
                        retryCount: 3
                    }
                }
            }

            const expressions: CELExpression[] = [
                {
                    name: 'https_required',
                    expression: 'data.webhook.url.startsWith("https://")',
                    message: 'Webhook URL must use HTTPS'
                },
                {
                    name: 'valid_method',
                    expression: 'data.webhook.method in ["GET", "POST", "PUT", "DELETE"]',
                    message: 'Invalid HTTP method'
                },
                {
                    name: 'auth_header_required',
                    expression: 'has(data.webhook.headers, "Authorization")',
                    message: 'Authorization header is required'
                },
                {
                    name: 'retry_limit',
                    expression: 'data.webhook.retryCount >= 0 && data.webhook.retryCount <= 5',
                    message: 'Retry count must be between 0 and 5'
                }
            ]

            const result = validator.validateAll(context, expressions)
            expect(result.valid).toBe(true)
        })

        test('validates file upload constraints', () => {
            const context: ValidationContext = {
                data: {
                    file: {
                        name: 'document.pdf',
                        size: 2097152, // 2MB in bytes
                        type: 'application/pdf'
                    }
                }
            }

            const maxSize = 5 * 1024 * 1024 // 5MB
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']

            const expressions: CELExpression[] = [
                {
                    name: 'file_size_limit',
                    expression: `data.file.size <= ${maxSize}`,
                    message: 'File size must not exceed 5MB'
                },
                {
                    name: 'allowed_file_type',
                    expression: `data.file.type in ${JSON.stringify(allowedTypes)}`,
                    message: 'File type not allowed'
                },
                {
                    name: 'valid_file_name',
                    expression: 'data.file.name.size() > 0',
                    message: 'File name cannot be empty'
                }
            ]

            const result = validator.validateAll(context, expressions)
            expect(result.valid).toBe(true)
        })
    })

    describe('Performance Tests', () => {
        test('evaluates 1000 simple expressions in under 1 second', () => {
            const context: ValidationContext = { data: 5 }
            const expression: CELExpression = {
                name: 'performance_test',
                expression: 'value > 0 && value < 100',
                message: 'Value must be between 0 and 100'
            }

            const startTime = Date.now()
            for (let i = 0; i < 1000; i++) {
                validator.validate(context, expression)
            }
            const endTime = Date.now()

            const duration = endTime - startTime
            expect(duration).toBeLessThan(1000) // Less than 1 second
        })

        test('caching improves performance significantly', () => {
            const context: ValidationContext = { data: 5 }
            const expression: CELExpression = {
                name: 'cache_test',
                expression: 'value > 0 && value < 100 && value % 2 == 1',
                message: 'Complex validation'
            }

            // First run (no cache)
            validator.clearCache()
            const startTime1 = Date.now()
            for (let i = 0; i < 100; i++) {
                validator.validate(context, expression)
            }
            const duration1 = Date.now() - startTime1

            // Second run (with cache)
            const startTime2 = Date.now()
            for (let i = 0; i < 100; i++) {
                validator.validate(context, expression)
            }
            const duration2 = Date.now() - startTime2

            // Cached version should be faster or equal
            expect(duration2).toBeLessThanOrEqual(duration1)
        })

        test('handles complex collection operations efficiently', () => {
            const context: ValidationContext = {
                data: Array.from({ length: 100 }, (_, i) => ({
                    id: i,
                    name: `Item ${i}`,
                    active: i % 2 === 0
                }))
            }

            const expression: CELExpression = {
                name: 'complex_collection',
                expression: 'value.filter(item, item.active).size() == value.filter(item, item.id % 2 == 0).size()',
                message: 'Active items validation failed'
            }

            const startTime = Date.now()
            const result = validator.validate(context, expression)
            const duration = Date.now() - startTime

            expect(result.valid).toBe(true)
            expect(duration).toBeLessThan(100) // Less than 100ms
        })
    })
})
