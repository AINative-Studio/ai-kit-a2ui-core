/**
 * Validation Module
 * CEL (Common Expression Language) validation for A2UI components
 *
 * File upload validation lives in '../types/file-upload-components.js'
 * (validateFile, validateFiles, sanitizeFileName, formatFileSize) — that is
 * the tested, canonical implementation; this module does not duplicate it.
 */

export { CELValidator, defaultValidator } from './cel-validator.js'
export { CELCompiler, CELCompilerCache, CELCompilationError, defaultCompiler } from './cel-compiler.js'
export type { ValidationContext } from './cel-validator.js'
