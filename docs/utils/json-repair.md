# JSON Repair Utilities

Comprehensive JSON repair, diagnostic, and extraction utilities for handling malformed LLM output in A2UI Core.

## Overview

The JSON repair utilities provide three main modules:

1. **JSONRepair** - Automatically repairs malformed JSON using multiple strategies
2. **JSONDiagnostics** - Analyzes JSON and provides detailed error reports
3. **JSONExtractor** - Extracts valid data from severely malformed JSON

## Installation

These utilities are included in the `@ainative/ai-kit-a2ui-core` package:

```typescript
import {
  JSONRepair,
  JSONDiagnostics,
  JSONExtractor,
  repairJSON,
  diagnoseJSON,
  extractJSON
} from '@ainative/ai-kit-a2ui-core/utils'
```

## JSONRepair

### Basic Usage

```typescript
import { JSONRepair } from '@ainative/ai-kit-a2ui-core/utils'

const repair = new JSONRepair()

// Repair malformed JSON
const result = repair.repair('{"type":"text","value":"Hello"')

if (result.success) {
  const parsed = JSON.parse(result.repaired)
  console.log(parsed) // { type: 'text', value: 'Hello' }
}
```

### Configuration Options

```typescript
const repair = new JSONRepair({
  fixBraces: true,        // Add missing closing braces
  fixBrackets: true,      // Add missing closing brackets
  fixQuotes: true,        // Fix quote issues
  fixCommas: true,        // Fix trailing/missing commas
  fixKeys: true,          // Fix unquoted keys
  fixValues: true,        // Fix malformed values
  extractPartial: true,   // Extract partial JSON on failure
  truncateInvalid: false, // Remove invalid trailing content
  maxDepth: 100,          // Max nesting depth
  maxLength: 10_000_000,  // Max string length
  timeout: 5000           // Max repair time (ms)
})
```

### Repair Strategies

#### 1. Missing Closing Braces

```typescript
// Input
const json = '{"type":"text","value":"Hello"'

// Output
{"type":"text","value":"Hello"}
```

#### 2. Missing Closing Brackets

```typescript
// Input
const json = '{"items":[1,2,3'

// Output
{"items":[1,2,3]}
```

#### 3. Unquoted Keys

```typescript
// Input
const json = '{type:"text",value:"Hello"}'

// Output
{"type":"text","value":"Hello"}
```

#### 4. Trailing Commas

```typescript
// Input
const json = '{"items":[1,2,3,],"end":true,}'

// Output
{"items":[1,2,3],"end":true}
```

#### 5. Missing Commas

```typescript
// Input
const json = '{"a":1"b":2}'

// Output
{"a":1,"b":2}
```

#### 6. Incomplete Strings

```typescript
// Input
const json = '{"text":"Hello Wor'

// Output
{"text":"Hello Wor"}
```

### Repair Result

```typescript
interface RepairResult {
  repaired: string        // Repaired JSON string
  original: string        // Original JSON string
  success: boolean        // Whether repair succeeded
  fixes: RepairFix[]      // List of fixes applied
  confidence: number      // Confidence score (0-1)
  warnings: string[]      // Warnings about potential issues
  repairTime: number      // Time taken to repair (ms)
}

interface RepairFix {
  type: 'braces' | 'brackets' | 'quotes' | 'commas' | 'keys' | 'values' | 'escapes' | 'truncate'
  position: number        // Position in original string
  description: string     // Description of fix
  original?: string       // Original text (if applicable)
  fixed: string           // Fixed text
}
```

### Advanced Usage

```typescript
// Use quick repair function
const repaired = repairJSON('{"type":"text"')

// Extract partial JSON when full repair fails
const partial = repair.extractPartialJSON('{"incomplete":')
console.log(partial) // {}

// Validate JSON
if (repair.validate('{"valid": true}')) {
  console.log('Valid JSON!')
}
```

## JSONDiagnostics

### Basic Usage

```typescript
import { JSONDiagnostics } from '@ainative/ai-kit-a2ui-core/utils'

const diagnostics = new JSONDiagnostics()

const result = diagnostics.analyze('{"type":"text"')

console.log(result.valid)           // false
console.log(result.errors)          // [{ type: 'structure', message: '...' }]
console.log(result.structure)       // { depth: 1, unclosedBraces: 1, ... }
console.log(result.repairability)   // 0.85
console.log(result.suggestions)     // ['Add closing brace at the end']
```

### Diagnostic Result

```typescript
interface DiagnosticResult {
  valid: boolean              // Whether JSON is valid
  errors: JSONError[]         // List of errors found
  warnings: JSONWarning[]     // List of warnings
  structure: StructureInfo    // Structural information
  repairability: number       // Likelihood repair will succeed (0-1)
  suggestions: string[]       // Suggested fixes
  analysisTime: number        // Analysis time (ms)
}

interface JSONError {
  type: 'syntax' | 'structure' | 'value'
  position: number
  line?: number
  column?: number
  message: string
  context: string             // Surrounding text
}

interface StructureInfo {
  depth: number               // Maximum nesting depth
  unclosedBraces: number
  unclosedBrackets: number
  unclosedStrings: number
  trailingCommas: number
  unquotedKeys: number
  objectCount: number
  arrayCount: number
  characterCount: number
}
```

### Use Cases

```typescript
// Check repairability before attempting repair
const result = diagnostics.analyze(json)
if (result.repairability > 0.8) {
  const repaired = repair.repair(json)
}

// Get specific suggestions
const suggestions = diagnostics.suggestFixes(json)
console.log(suggestions)

// Analyze structure
const structure = diagnostics.analyzeStructure(json)
if (structure.depth > 100) {
  console.warn('Deeply nested structure detected')
}
```

## JSONExtractor

### Basic Usage

```typescript
import { JSONExtractor } from '@ainative/ai-kit-a2ui-core/utils'

const extractor = new JSONExtractor()

// Extract all valid JSON fragments
const fragments = extractor.extractFragments('{"a":1}invalid{"b":2}')
// Returns: [{a:1}, {b:2}]

// Extract objects only
const objects = extractor.extractObjects('{"a":1}{"b":2}')
// Returns: [{a:1}, {b:2}]

// Extract arrays
const arrays = extractor.extractArrays('[1,2][3,4]')
// Returns: [[1,2], [3,4]]
```

### Extraction Methods

#### Extract by Type

```typescript
// Extract strings
const strings = extractor.extractStrings('{"a":"hello","b":"world"}')
// Returns: ['a', 'hello', 'b', 'world']

// Extract numbers
const numbers = extractor.extractNumbers('{"a":1,"b":2.5}')
// Returns: [1, 2.5]

// Extract booleans
const booleans = extractor.extractBooleans('{"a":true,"b":false}')
// Returns: [true, false]
```

#### Build Partial Structures

```typescript
// Extract what you can from incomplete JSON
const partial = extractor.buildPartial('{"type":"text","value":"Hello"')
console.log(partial)
// Returns: { type: 'text', value: 'Hello' }
```

#### Extract by Path

```typescript
// Extract value at specific path
const value = extractor.extractByPath(
  '{"data":{"user":{"name":"John"}}}',
  'data.user.name'
)
console.log(value) // 'John'

// Works with arrays
const id = extractor.extractByPath(
  '{"items":[{"id":1},{"id":2}]}',
  'items[0].id'
)
console.log(id) // 1
```

## Integration with Streaming Parser

The JSON repair utilities integrate seamlessly with the streaming JSON parser:

```typescript
import { StreamingJSONRepair } from '@ainative/ai-kit-a2ui-core/parser'

const parser = new StreamingJSONRepair({
  fixBraces: true,
  fixBrackets: true,
  fixQuotes: true,
  enableDiagnostics: false,
  throwOnFailure: false,
  onRepair: (result) => {
    console.log('Repair applied:', result.fixes)
  }
})

// Feed chunks as they arrive
parser.feed('{"type":"createSurface","id":"main"')
parser.feed(',"components":[{"type":"text"')

// Finalize with auto-repair
const message = parser.finalize()

// Get repair statistics
const stats = parser.getRepairStats()
console.log(stats)
// {
//   repairsAttempted: 5,
//   repairsSucceeded: 4,
//   repairsFailed: 1,
//   averageRepairTime: 2.5
// }
```

## Common LLM Error Patterns

### Pattern 1: Truncated Output

```typescript
// LLM stops mid-string
const json = '{"type":"createSurface","surfaceId":"main","components":[{"type":"text","properties":{"value":"Hello'

const result = repair.repair(json)
// Adds: "}}}]}
```

### Pattern 2: Missing Quotes on Keys

```typescript
// LLM forgets quotes
const json = '{type:"updateComponents",surfaceId:"main"}'

const result = repair.repair(json)
// Adds quotes: {"type":"updateComponents","surfaceId":"main"}
```

### Pattern 3: Extra Commas

```typescript
// LLM adds trailing commas
const json = '{"items":[1,2,3,],"end":true,}'

const result = repair.repair(json)
// Removes: {"items":[1,2,3],"end":true}
```

## Performance

- **Small JSON** (<1KB): <10ms repair time
- **Medium JSON** (1-100KB): <50ms repair time
- **Large JSON** (100KB-1MB): <500ms repair time
- **Success Rate**: 95%+ on common LLM errors

### Performance Tips

1. **Set appropriate limits**:
   ```typescript
   const repair = new JSONRepair({
     maxLength: 1_000_000,  // 1MB limit
     timeout: 1000          // 1 second timeout
   })
   ```

2. **Use diagnostics first** for very large JSON:
   ```typescript
   const result = diagnostics.analyze(json)
   if (result.repairability > 0.8) {
     repair.repair(json)
   }
   ```

3. **Disable unused strategies**:
   ```typescript
   const repair = new JSONRepair({
     fixBraces: true,
     fixKeys: false,      // Disable if not needed
     fixEscapes: false    // Disable if not needed
   })
   ```

## Error Handling

```typescript
try {
  const result = repair.repair(json)

  if (result.success) {
    const parsed = JSON.parse(result.repaired)
    // Use parsed data
  } else {
    // Try extraction
    const partial = repair.extractPartialJSON(json)
    // Use partial data
  }
} catch (error) {
  console.error('Repair failed:', error)
  // Fallback logic
}
```

## Best Practices

1. **Always check success flag**:
   ```typescript
   if (result.success) {
     // Safe to parse
   }
   ```

2. **Use confidence scores**:
   ```typescript
   if (result.confidence > 0.9) {
     // High confidence repair
   }
   ```

3. **Handle extraction fallback**:
   ```typescript
   const repaired = repair.repair(json)
   const data = repaired.success
     ? JSON.parse(repaired.repaired)
     : repair.extractPartialJSON(json)
   ```

4. **Monitor repair stats** in production:
   ```typescript
   const parser = new StreamingJSONRepair({
     onRepair: (result) => {
       metrics.recordRepair({
         success: result.success,
         confidence: result.confidence,
         fixCount: result.fixes.length
       })
     }
   })
   ```

## Limitations

1. **Context-dependent ambiguity**: Cannot always determine intent when JSON is severely malformed
2. **Performance on huge files**: May be slow on JSON >10MB
3. **Unicode edge cases**: Some complex unicode scenarios may not be handled perfectly
4. **Nested string quotes**: Quotes inside string values can be ambiguous

## See Also

- [Streaming JSON Parser](../parser/streaming-json-parser.md)
- [Progressive Rendering](../renderer/progressive-rendering.md)
- [A2UI Protocol Specification](../protocol/a2ui-spec.md)

## API Reference

### JSONRepair

- `repair(json: string): RepairResult`
- `fixMissingBraces(json: string): { fixed: string; fixes: RepairFix[] }`
- `fixMissingBrackets(json: string): { fixed: string; fixes: RepairFix[] }`
- `fixQuoteIssues(json: string): { fixed: string; fixes: RepairFix[] }`
- `fixTrailingCommas(json: string): { fixed: string; fixes: RepairFix[] }`
- `fixMissingCommas(json: string): { fixed: string; fixes: RepairFix[] }`
- `fixUnquotedKeys(json: string): { fixed: string; fixes: RepairFix[] }`
- `fixMalformedValues(json: string): { fixed: string; fixes: RepairFix[] }`
- `extractValidJSON(json: string): any | null`
- `extractPartialJSON(json: string): Partial<any>`
- `validate(json: string): boolean`

### JSONDiagnostics

- `analyze(json: string): DiagnosticResult`
- `findSyntaxErrors(json: string): JSONError[]`
- `analyzeStructure(json: string): StructureInfo`
- `assessRepairability(json: string): number`
- `suggestFixes(json: string): string[]`

### JSONExtractor

- `extractFragments(json: string): any[]`
- `extractObjects(json: string): Record<string, any>[]`
- `extractArrays(json: string): any[][]`
- `extractStrings(json: string): string[]`
- `extractNumbers(json: string): number[]`
- `extractBooleans(json: string): boolean[]`
- `buildPartial(json: string): Partial<any>`
- `extractByPath(json: string, path: string): any`
