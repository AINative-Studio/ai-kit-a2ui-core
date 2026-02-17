/**
 * CEL Expression Compiler
 * Handles compilation and caching of CEL expressions for performance
 */

import { parse, type ParsedExpression } from '@marcbachmann/cel-js'
import type { CompiledCELExpression } from '../types/validation.js'

/**
 * Expression compilation cache
 * LRU cache with timestamp-based eviction
 */
export class CELCompilerCache {
    private cache: Map<string, CompiledCELExpression> = new Map()
    private maxSize: number
    private maxAge: number // milliseconds

    constructor(maxSize = 1000, maxAge = 3600000) { // 1 hour default
        this.maxSize = maxSize
        this.maxAge = maxAge
    }

    /**
     * Get compiled expression from cache
     */
    get(expression: string): CompiledCELExpression | undefined {
        const cached = this.cache.get(expression)

        if (!cached) {
            return undefined
        }

        // Check if expired
        if (Date.now() - cached.compiledAt > this.maxAge) {
            this.cache.delete(expression)
            return undefined
        }

        return cached
    }

    /**
     * Store compiled expression in cache
     */
    set(expression: string, compiled: unknown): void {
        // Evict oldest if cache is full
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value
            if (firstKey !== undefined) {
                this.cache.delete(firstKey)
            }
        }

        this.cache.set(expression, {
            source: expression,
            compiled,
            compiledAt: Date.now()
        })
    }

    /**
     * Clear all cached expressions
     */
    clear(): void {
        this.cache.clear()
    }

    /**
     * Get cache statistics
     */
    stats(): { size: number; maxSize: number; maxAge: number } {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            maxAge: this.maxAge
        }
    }
}

/**
 * CEL Expression Compiler
 * Compiles CEL expressions with caching for performance
 */
export class CELCompiler {
    private cache: CELCompilerCache

    constructor(cacheMaxSize?: number, cacheMaxAge?: number) {
        this.cache = new CELCompilerCache(cacheMaxSize, cacheMaxAge)
    }

    /**
     * Compile a CEL expression
     * Returns cached version if available
     */
    compile(expression: string): ParsedExpression {
        // Check cache first
        const cached = this.cache.get(expression)
        if (cached) {
            return cached.compiled as ParsedExpression
        }

        // Compile expression
        try {
            const compiled = parse(expression)

            // Store in cache
            this.cache.set(expression, compiled)

            return compiled
        } catch (error) {
            throw new CELCompilationError(
                `Failed to compile CEL expression: ${expression}`,
                expression,
                error instanceof Error ? error.message : String(error)
            )
        }
    }

    /**
     * Validate expression syntax without caching
     */
    validate(expression: string): { valid: boolean; error?: string } {
        try {
            parse(expression)
            return { valid: true }
        } catch (error) {
            return {
                valid: false,
                error: error instanceof Error ? error.message : String(error)
            }
        }
    }

    /**
     * Clear compilation cache
     */
    clearCache(): void {
        this.cache.clear()
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): { size: number; maxSize: number; maxAge: number } {
        return this.cache.stats()
    }
}

/**
 * CEL Compilation Error
 * Thrown when expression cannot be compiled
 */
export class CELCompilationError extends Error {
    constructor(
        message: string,
        public expression: string,
        public details: string
    ) {
        super(message)
        this.name = 'CELCompilationError'
    }
}

/**
 * Default singleton compiler instance
 */
export const defaultCompiler = new CELCompiler()
