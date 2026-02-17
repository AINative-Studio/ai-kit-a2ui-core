/**
 * CEL Expression Validator
 * Validates data using Common Expression Language (CEL) expressions
 * Provides advanced validation beyond JSON Schema capabilities
 */

import { parse } from '@marcbachmann/cel-js'
import { CELCompiler, CELCompilationError } from './cel-compiler.js'
import type { CELExpression, ValidationResult, ValidationError } from '../types/validation.js'

/**
 * Validation context for CEL expression evaluation
 * Contains all data and helper functions available to expressions
 */
export interface ValidationContext {
    /** Current data being validated */
    data: unknown
    /** Parent context data (for nested validation) */
    parent?: unknown
    /** Root context data */
    root?: unknown
    /** Additional context variables */
    variables?: Record<string, unknown>
}

/**
 * CEL Validator
 * Evaluates CEL expressions against validation context
 */
export class CELValidator {
    private compiler: CELCompiler

    constructor(compiler?: CELCompiler) {
        this.compiler = compiler || new CELCompiler()
    }

    /**
     * Create evaluation context with helper functions
     * Note: CEL has built-in functions like int(), string(), bool(), has(), duration()
     */
    private createHelpers(): Record<string, unknown> {
        return {
            // unique() - Remove duplicates from array (for duplicate ID detection)
            unique: (arr: unknown[]): unknown[] => {
                if (!Array.isArray(arr)) return []
                return [...new Set(arr.map(item => JSON.stringify(item)))]
                    .map(item => JSON.parse(item))
            }
        }
    }

    /**
     * Validate data against a single CEL expression
     */
    validate(
        context: ValidationContext,
        expression: CELExpression
    ): ValidationResult {
        const errors: ValidationError[] = []

        try {
            // Prepare evaluation context
            const evalContext = this.buildEvaluationContext(context)

            // Parse and evaluate expression
            const expr = parse(expression.expression)
            const result = expr(evalContext)

            // Check if result is boolean
            if (typeof result !== 'boolean') {
                errors.push({
                    path: 'expression',
                    message: `CEL expression '${expression.name}' must return boolean, got ${typeof result}`,
                    expected: 'boolean',
                    received: typeof result,
                    source: 'celExpression',
                    expressionName: expression.name
                })
                return { valid: false, errors }
            }

            // If expression evaluates to false, add error
            if (!result) {
                errors.push({
                    path: 'data',
                    message: expression.message,
                    source: 'celExpression',
                    expressionName: expression.name
                })
            }

        } catch (error) {
            if (error instanceof CELCompilationError) {
                errors.push({
                    path: 'expression',
                    message: `Failed to compile CEL expression '${expression.name}': ${error.details}`,
                    source: 'celExpression',
                    expressionName: expression.name
                })
            } else {
                errors.push({
                    path: 'expression',
                    message: `Failed to evaluate CEL expression '${expression.name}': ${error instanceof Error ? error.message : String(error)}`,
                    source: 'celExpression',
                    expressionName: expression.name
                })
            }
        }

        return {
            valid: errors.length === 0,
            errors
        }
    }

    /**
     * Validate data against multiple CEL expressions
     */
    validateAll(
        context: ValidationContext,
        expressions: CELExpression[]
    ): ValidationResult {
        const allErrors: ValidationError[] = []

        for (const expression of expressions) {
            const result = this.validate(context, expression)
            if (!result.valid) {
                allErrors.push(...result.errors)
            }
        }

        return {
            valid: allErrors.length === 0,
            errors: allErrors
        }
    }

    /**
     * Evaluate a CEL expression and return the result
     * Used for testing and debugging
     */
    evaluateExpression(expression: string, data: unknown): unknown {
        const context = this.buildEvaluationContext({ data })
        const expr = parse(expression)
        return expr(context)
    }

    /**
     * Check if an expression is valid (can be compiled)
     */
    isValidExpression(expression: string): boolean {
        const result = this.compiler.validate(expression)
        return result.valid
    }

    /**
     * Get detailed validation info for an expression
     */
    validateExpression(expression: string): { valid: boolean; error?: string } {
        return this.compiler.validate(expression)
    }

    /**
     * Clear expression compilation cache
     */
    clearCache(): void {
        this.compiler.clearCache()
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): { size: number; maxSize: number; maxAge: number } {
        return this.compiler.getCacheStats()
    }

    /**
     * Build evaluation context
     * Provides variables and helper functions for CEL expression evaluation
     */
    private buildEvaluationContext(context: ValidationContext): Record<string, unknown> {
        const { data, parent, root, variables = {} } = context

        // Base context with data variables and helper functions
        const evalContext: Record<string, unknown> = {
            // Main data
            value: data,
            data: data,
            parent: parent ?? null,
            root: root ?? data,

            // Helper functions
            ...this.createHelpers(),

            // Add custom variables
            ...variables
        }

        return evalContext
    }
}

/**
 * Default singleton validator instance
 */
export const defaultValidator = new CELValidator()
