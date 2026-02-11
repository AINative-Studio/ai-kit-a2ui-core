# CEL Expression Support in A2UI Core

## Overview

A2UI Core now supports **CEL (Common Expression Language)** for advanced validation beyond JSON Schema capabilities. CEL enables cross-field validation, complex business rules, and dynamic constraints that cannot be expressed with static JSON Schema alone.

## What is CEL?

CEL (Common Expression Language) is a non-Turing complete expression language designed for simplicity, speed, and safety. It's used by Google Cloud, Kubernetes, and other systems for policy evaluation and configuration validation.

### Key Features

- Fast, lightweight evaluation (<10ms per expression)
- Type-safe with built-in type checking
- No side effects (pure functional)
- Rich standard library
- Google-compatible syntax

## Installation

CEL support is built into `@ainative/ai-kit-a2ui-core` using the `@marcbachmann/cel-js` library (zero additional dependencies for end users).

```bash
npm install @ainative/ai-kit-a2ui-core
```

## Basic Usage

### Simple Validation

```typescript
import { CELValidator } from '@ainative/ai-kit-a2ui-core/validation'

const validator = new CELValidator()

const result = validator.validate(
    { data: 5 },
    {
        name: 'greater_than_zero',
        expression: 'value > 0',
        message: 'Value must be greater than zero'
    }
)

console.log(result.valid) // true
```

### Component Schema Integration

```typescript
import type { ValidationRule, CELExpression } from '@ainative/ai-kit-a2ui-core/types'

const videoRecorderValidation: ValidationRule = {
    jsonSchema: {
        type: 'object',
        required: ['mode'],
        properties: {
            mode: { enum: ['screen', 'camera', 'pip'] },
            ai: {
                type: 'object',
                properties: {
                    transcribe: { type: 'boolean' },
                    highlights: { type: 'boolean' },
                    summary: { type: 'boolean' }
                }
            }
        }
    },
    celExpressions: [
        {
            name: 'ai_features_require_transcribe',
            expression: '(data.ai.highlights || data.ai.summary) ? data.ai.transcribe : true',
            message: 'AI highlights and summary require transcription to be enabled',
            description: 'Conditional dependency validation'
        }
    ]
}
```

## Supported Operations

### Arithmetic Operations

```typescript
// Addition, subtraction, multiplication, division, modulo
'value >= 5 && value <= 15'
'total > 100'
'count % 2 == 0'
```

### Comparison Operations

```typescript
// Less than, greater than, equal, not equal
'startDate < endDate'
'price >= 0'
'status == "active"'
'type != "disabled"'
```

### Logical Operations

```typescript
// AND, OR, NOT
'enabled && count > 0'
'type == "premium" || type == "enterprise"'
'!disabled'
```

### String Operations

```typescript
// contains, startsWith, endsWith, matches (regex)
'email.contains("@")'
'url.startsWith("https://")'
'file.endsWith(".pdf")'
'email.matches("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\\\.[a-zA-Z]{2,}$")'
```

### Collection Operations

```typescript
// size, map, filter, all, exists
'items.size() <= 10'
'users.map(u, u.id)'
'components.filter(c, c.type == "button").size() <= 5'
'numbers.all(n, n > 0)'
'tags.exists(t, t == "important")'
```

### Type Checking

```typescript
// has, int(), string(), bool(), duration()
'has(data, "billingInfo")'
'int(value) == 42'
'string(count) == "100"'
'bool(enabled)'
'duration("24h") == duration("1d")'
```

## Common Use Cases

### 1. Duplicate ID Detection

```typescript
{
    name: 'unique_component_ids',
    expression: 'unique(components.map(c, c.id)).size() == components.size()',
    message: 'All component IDs must be unique'
}
```

### 2. Date Range Validation

```typescript
{
    name: 'valid_date_range',
    expression: 'startDate < endDate && (endDate - startDate) <= duration("30d")',
    message: 'Date range must be valid and not exceed 30 days'
}
```

### 3. Conditional Required Fields

```typescript
{
    name: 'premium_billing',
    expression: 'type == "premium" ? has(data, "billingInfo") && data.billingInfo.valid : true',
    message: 'Premium accounts require valid billing info'
}
```

### 4. Cross-Component Validation

```typescript
{
    name: 'max_buttons',
    expression: 'components.filter(c, c.type == "button").size() <= 5',
    message: 'Maximum 5 buttons allowed per view'
}
```

### 5. Complex Business Rules

```typescript
{
    name: 'discount_rules',
    expression: 'order.total > 100 ? order.discount >= 10 : order.discount == 0',
    message: 'Orders over $100 must have at least 10% discount'
}
```

### 6. Password Strength

```typescript
[
    {
        name: 'password_length',
        expression: 'password.size() >= 8',
        message: 'Password must be at least 8 characters'
    },
    {
        name: 'password_has_number',
        expression: 'password.matches(".*[0-9].*")',
        message: 'Password must contain at least one number'
    },
    {
        name: 'password_has_special',
        expression: 'password.matches(".*[@$!%*?&#].*")',
        message: 'Password must contain at least one special character'
    }
]
```

## Custom Helper Functions

A2UI Core provides a custom `unique()` function for duplicate detection:

```typescript
// Remove duplicates from array
'unique(items).size() == items.size()'
```

## Built-in CEL Functions

CEL provides these built-in functions:

- `int(value)` - Convert to integer (returns BigInt in JavaScript)
- `string(value)` - Convert to string
- `bool(value)` - Convert to boolean
- `has(map, key)` - Check if map has key
- `duration(string)` - Parse duration ("24h", "30m", etc.)
- `size()` - Get collection/string length
- `map(collection, variable, expression)` - Transform collection
- `filter(collection, variable, expression)` - Filter collection
- `all(collection, variable, expression)` - Check all elements
- `exists(collection, variable, expression)` - Check if any element matches
- `contains(string)` - Check substring
- `startsWith(string)` - Check prefix
- `endsWith(string)` - Check suffix
- `matches(regex)` - Match regular expression

## Performance Optimization

### Expression Caching

CEL expressions are automatically cached after first compilation:

```typescript
const validator = new CELValidator()

// First evaluation compiles and caches
validator.validate(context, expression)

// Subsequent evaluations use cached version (faster)
validator.validate(context, expression)
```

### Performance Tips

1. **Keep expressions simple** - Each expression should validate one concern
2. **Use multiple simple expressions** instead of one complex expression
3. **Avoid nested map/filter operations** - Pre-process data when possible
4. **Cache validator instances** - Reuse the same validator across validations
5. **Target: <10ms per expression** - Achieved for most standard validations

## Error Handling

### Validation Errors

```typescript
const result = validator.validate(context, expression)

if (!result.valid) {
    result.errors.forEach(error => {
        console.log(`Error: ${error.message}`)
        console.log(`Path: ${error.path}`)
        console.log(`Source: ${error.source}`) // 'celExpression'
        console.log(`Expression: ${error.expressionName}`)
    })
}
```

### Expression Compilation Errors

```typescript
// Check if expression is valid
if (!validator.isValidExpression('value > > 0')) {
    const validation = validator.validateExpression('value > > 0')
    console.log(validation.error) // Syntax error details
}
```

## Migration from JSON Schema

### Before (JSON Schema only)

```typescript
{
    type: 'object',
    properties: {
        email: { type: 'string', pattern: '^.+@.+$' },
        age: { type: 'number', minimum: 18 }
    },
    required: ['email', 'age']
}
```

### After (JSON Schema + CEL)

```typescript
{
    jsonSchema: {
        type: 'object',
        properties: {
            email: { type: 'string' },
            age: { type: 'number' }
        },
        required: ['email', 'age']
    },
    celExpressions: [
        {
            name: 'valid_email',
            expression: 'email.contains("@") && !email.endsWith("tempmail.com")',
            message: 'Valid non-disposable email required'
        },
        {
            name: 'adult_age',
            expression: 'age >= 18',
            message: 'Must be 18 or older'
        }
    ]
}
```

## Troubleshooting

### Common Issues

#### Issue: "Unknown variable: value"

```typescript
// WRONG - variable not in context
expression: 'myValue > 0'

// CORRECT - use 'value' or 'data.fieldName'
expression: 'value > 0'
expression: 'data.myField > 0'
```

#### Issue: "Expression must return boolean"

```typescript
// WRONG - returns number
expression: 'value + 10'

// CORRECT - returns boolean
expression: 'value + 10 > 20'
```

#### Issue: BigInt vs Number

CEL uses BigInt for integer operations in JavaScript:

```typescript
// Expression returns 15n (BigInt), not 15 (Number)
const result = validator.evaluateExpression('5 + 10', {})
console.log(result) // 15n

// For comparisons, this is handled automatically
'value > 10' // Works with both number and BigInt
```

## Best Practices

1. **Use JSON Schema for structure, CEL for logic**
   - JSON Schema: Type checking, required fields, enums
   - CEL: Cross-field validation, conditional rules, business logic

2. **Write clear expression names and messages**
   - Name describes what is validated
   - Message explains what went wrong

3. **Keep expressions focused**
   - One expression per validation concern
   - Multiple simple expressions > One complex expression

4. **Document complex expressions**
   - Add description field to explain business rules
   - Include examples in comments

5. **Test expressions thoroughly**
   - Test valid cases
   - Test edge cases (null, undefined, empty)
   - Test error messages

## API Reference

### CELValidator

```typescript
class CELValidator {
    constructor(compiler?: CELCompiler)

    validate(context: ValidationContext, expression: CELExpression): ValidationResult
    validateAll(context: ValidationContext, expressions: CELExpression[]): ValidationResult
    evaluateExpression(expression: string, data: unknown): unknown
    isValidExpression(expression: string): boolean
    validateExpression(expression: string): { valid: boolean; error?: string }
    clearCache(): void
    getCacheStats(): { size: number; maxSize: number; maxAge: number }
}
```

### Types

```typescript
interface ValidationContext {
    data: unknown
    parent?: unknown
    root?: unknown
    variables?: Record<string, unknown>
}

interface CELExpression {
    name: string
    expression: string
    message: string
    description?: string
}

interface ValidationResult {
    valid: boolean
    errors: ValidationError[]
}

interface ValidationError {
    path: string
    message: string
    expected?: string
    received?: string
    source?: 'jsonSchema' | 'celExpression'
    expressionName?: string
}
```

## Examples Repository

Complete examples available at:
- `/Users/aideveloper/ai-kit-a2ui-core/tests/validation/cel-validator.test.ts`
- `/Users/aideveloper/ai-kit-a2ui-core/tests/validation/cel-integration.test.ts`

## Resources

- [CEL Specification](https://github.com/google/cel-spec)
- [CEL Language Definition](https://cel.dev/)
- [A2UI Protocol Specification](../protocol/a2ui-v0.9.md)
- [@marcbachmann/cel-js Documentation](https://www.npmjs.com/package/@marcbachmann/cel-js)

## Support

For issues or questions:
- GitHub Issues: https://github.com/AINative-Studio/ai-kit-a2ui-core/issues
- Email: hello@ainative.studio
