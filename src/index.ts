/**
 * @ainative/ai-kit-a2ui-core
 * Framework-agnostic core library for A2UI protocol (v0.9)
 * Zero runtime dependencies
 */

// Protocol Types
export * from './types/index.js'

// JSON Pointer (RFC 6901)
export * from './json-pointer/index.js'

// WebSocket Transport
export * from './transport/index.js'

// Component Registry
export * from './registry/index.js'

// Handlers
export * from './handlers/index.js'

// Client Actions
export * from './actions/index.js'

// Validation
export * from './validation/index.js'

// Integrations
export * from './integrations/index.js'

// Version
export const VERSION = '0.1.0-alpha.1'
