# Test-Driven Development (TDD) Workflow

## Core TDD Principles

### Red-Green-Refactor Cycle

```
1. 🔴 RED: Write a failing test
2. 🟢 GREEN: Write minimal code to pass
3. 🔵 REFACTOR: Improve code quality
4. Repeat
```

## TDD Workflow Steps

### Step 1: Write the Test First
```typescript
// tests/types/file-upload.test.ts
import { describe, it, expect } from 'vitest'
import type { FileUploadComponent } from '../src/types/file-upload-components'

describe('FileUploadComponent', () => {
  it('should have required properties', () => {
    const component: FileUploadComponent = {
      type: 'fileUpload',
      id: 'upload-1',
      properties: {
        accept: ['image/*'],
        multiple: true,
        maxFileSize: 10485760 // 10MB
      }
    }

    expect(component.type).toBe('fileUpload')
    expect(component.id).toBeDefined()
  })
})
```

**Run test**: It should FAIL (file doesn't exist yet)
```bash
npm test -- tests/types/file-upload.test.ts
# Expected: FAIL - Module not found
```

### Step 2: Write Minimal Implementation
```typescript
// src/types/file-upload-components.ts
export interface FileUploadComponent {
  type: 'fileUpload'
  id: string
  properties: {
    accept?: string[]
    multiple?: boolean
    maxFileSize?: number
  }
}
```

**Run test again**: It should PASS
```bash
npm test -- tests/types/file-upload.test.ts
# Expected: PASS ✓
```

### Step 3: Add More Tests (Edge Cases)
```typescript
describe('FileUploadComponent validation', () => {
  it('should validate file size', () => {
    const validator = createFileValidator({ maxFileSize: 1000 })
    const tooLarge = new File(['x'.repeat(2000)], 'large.txt')

    expect(() => validator.validate(tooLarge)).toThrow('File too large')
  })

  it('should validate file type', () => {
    const validator = createFileValidator({ accept: ['image/*'] })
    const textFile = new File(['text'], 'doc.txt', { type: 'text/plain' })

    expect(() => validator.validate(textFile)).toThrow('Invalid file type')
  })
})
```

### Step 4: Implement Validation Logic
```typescript
export function createFileValidator(options: FileUploadProperties) {
  return {
    validate(file: File): void {
      if (options.maxFileSize && file.size > options.maxFileSize) {
        throw new Error(`File too large: ${file.size} > ${options.maxFileSize}`)
      }

      if (options.accept && !isAcceptedType(file.type, options.accept)) {
        throw new Error(`Invalid file type: ${file.type}`)
      }
    }
  }
}

function isAcceptedType(fileType: string, acceptPatterns: string[]): boolean {
  return acceptPatterns.some(pattern => {
    if (pattern.endsWith('/*')) {
      return fileType.startsWith(pattern.slice(0, -2))
    }
    return fileType === pattern
  })
}
```

### Step 5: Refactor for Quality
```typescript
// Refactor: Extract type checking logic
export class FileTypeValidator {
  constructor(private patterns: string[]) {}

  isValid(mimeType: string): boolean {
    return this.patterns.some(pattern =>
      this.matchesPattern(mimeType, pattern)
    )
  }

  private matchesPattern(type: string, pattern: string): boolean {
    if (pattern.endsWith('/*')) {
      const category = pattern.slice(0, -2)
      return type.startsWith(category)
    }
    return type === pattern
  }
}

// Refactor: Improve error messages
export class FileSizeValidator {
  constructor(private maxSize: number) {}

  validate(file: File): void {
    if (file.size > this.maxSize) {
      const maxMB = (this.maxSize / 1024 / 1024).toFixed(1)
      const actualMB = (file.size / 1024 / 1024).toFixed(1)
      throw new ValidationError(
        `File size ${actualMB}MB exceeds maximum ${maxMB}MB`,
        'fileSize'
      )
    }
  }
}
```

## Test Coverage Requirements

### Minimum Coverage: 85%

```bash
npm run test:coverage

# Expected output:
# File                    | % Stmts | % Branch | % Funcs | % Lines
# ----------------------- |---------|----------|---------|--------
# file-upload-components  |   91.67 |    88.89 |     100 |   91.67
```

### Coverage Targets by Category

| Category | Minimum | Target |
|----------|---------|--------|
| Happy path | 100% | 100% |
| Error cases | 85% | 100% |
| Edge cases | 85% | 95% |
| Type guards | 100% | 100% |
| Utilities | 90% | 100% |

## Test Organization

### Test File Structure
```
tests/
├── types/
│   ├── file-upload-components.test.ts
│   ├── progressive-render-messages.test.ts
│   └── mcp-protocol.test.ts
├── handlers/
│   ├── file-upload-handler.test.ts
│   └── mcp-handler.test.ts
├── integration/
│   ├── zerodb-integration.test.ts
│   └── end-to-end.test.ts
└── utils/
    ├── validators.test.ts
    └── helpers.test.ts
```

### Test Naming Conventions
```typescript
// ✅ GOOD - Descriptive test names
it('should reject files larger than maxFileSize', () => {})
it('should accept multiple files when multiple is true', () => {})
it('should emit upload progress events', () => {})

// ❌ BAD - Vague test names
it('works', () => {})
it('test 1', () => {})
it('should validate', () => {})
```

## Test Types

### Unit Tests
Test individual functions and classes in isolation.

```typescript
describe('FileTypeValidator', () => {
  describe('isValid', () => {
    it('should match exact MIME types', () => {
      const validator = new FileTypeValidator(['image/png'])
      expect(validator.isValid('image/png')).toBe(true)
      expect(validator.isValid('image/jpeg')).toBe(false)
    })

    it('should match wildcard patterns', () => {
      const validator = new FileTypeValidator(['image/*'])
      expect(validator.isValid('image/png')).toBe(true)
      expect(validator.isValid('image/jpeg')).toBe(true)
      expect(validator.isValid('text/plain')).toBe(false)
    })
  })
})
```

### Integration Tests
Test components working together.

```typescript
describe('File Upload Integration', () => {
  it('should upload file to ZeroDB', async () => {
    const handler = new FileUploadHandler({
      zerodbClient: mockZeroDBClient,
      validator: createFileValidator({ maxFileSize: 1000000 })
    })

    const file = new File(['content'], 'test.txt')
    const result = await handler.handleUpload(file)

    expect(result.fileId).toBeDefined()
    expect(mockZeroDBClient.upload).toHaveBeenCalledWith(file)
  })
})
```

### End-to-End Tests
Test complete user workflows.

```typescript
describe('File Upload E2E', () => {
  it('should complete full upload workflow', async () => {
    // 1. User selects file
    const file = new File(['data'], 'doc.pdf')

    // 2. Validation occurs
    await validateFile(file)

    // 3. Upload starts
    const uploadPromise = uploadFile(file)

    // 4. Progress updates received
    await waitForProgressUpdate()

    // 5. Upload completes
    const result = await uploadPromise

    expect(result.status).toBe('complete')
    expect(result.url).toMatch(/^https:\/\//)
  })
})
```

## Mocking Best Practices

### Mock External Dependencies
```typescript
import { vi } from 'vitest'

// Mock ZeroDB client
const mockZeroDBClient = {
  upload: vi.fn().mockResolvedValue({ fileId: 'file-123' }),
  download: vi.fn(),
  delete: vi.fn()
}

// Mock fetch
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ success: true })
})
```

### Avoid Over-Mocking
```typescript
// ❌ BAD - Mocking internal implementation details
const mockInternalHelper = vi.fn()

// ✅ GOOD - Mocking external boundaries
const mockAPIClient = vi.fn()
```

## Test Assertions

### Use Specific Matchers
```typescript
// ✅ GOOD - Specific assertions
expect(result).toEqual({ status: 'success', fileId: 'abc' })
expect(array).toHaveLength(3)
expect(error).toBeInstanceOf(ValidationError)
expect(string).toMatch(/^file-\d+$/)

// ❌ BAD - Generic assertions
expect(result).toBeTruthy()
expect(array).toBeDefined()
```

### Test Both Success and Failure
```typescript
describe('uploadFile', () => {
  it('should return file ID on success', async () => {
    const result = await uploadFile(validFile)
    expect(result.fileId).toMatch(/^file-/)
  })

  it('should throw ValidationError on invalid file', async () => {
    await expect(uploadFile(invalidFile))
      .rejects.toThrow(ValidationError)
  })

  it('should throw NetworkError on upload failure', async () => {
    mockAPI.upload.mockRejectedValue(new Error('Network failed'))
    await expect(uploadFile(validFile))
      .rejects.toThrow(NetworkError)
  })
})
```

## Pre-Implementation Checklist

Before writing ANY production code:

- [ ] Write test case describing expected behavior
- [ ] Run test and confirm it FAILS
- [ ] Understand WHY it fails
- [ ] Write minimal code to make it pass
- [ ] Run test and confirm it PASSES
- [ ] Check coverage is ≥85%
- [ ] Refactor if needed
- [ ] Commit with descriptive message

## Coverage Verification

### Check Coverage Before Committing
```bash
npm run test:coverage

# Look for coverage summary:
# Statements   : 92.5% ( 148/160 )
# Branches     : 88.2% ( 45/51 )
# Functions    : 95.0% ( 19/20 )
# Lines        : 92.5% ( 148/160 )
```

### Coverage Report Location
```
coverage/
├── index.html      # Interactive HTML report
├── lcov-report/    # LCOV format
└── coverage-final.json
```

### View Coverage Report
```bash
open coverage/index.html
# Interactive report shows:
# - Lines covered/uncovered
# - Branches covered/uncovered
# - Functions covered/uncovered
```

## Common TDD Pitfalls

### ❌ Writing Tests After Code
```typescript
// Wrong order:
// 1. Write implementation
// 2. Write tests

// Leads to:
// - Tests that just confirm existing behavior
// - Missing edge cases
// - False confidence
```

### ✅ TDD Correct Order
```typescript
// Correct order:
// 1. Write failing test
// 2. Run test (should FAIL)
// 3. Write minimal implementation
// 4. Run test (should PASS)
// 5. Refactor
// 6. Repeat
```

### ❌ Testing Implementation Details
```typescript
// BAD - Testing private methods
it('should call internal helper', () => {
  const spy = vi.spyOn(component, 'privateHelper')
  component.publicMethod()
  expect(spy).toHaveBeenCalled()
})
```

### ✅ Testing Public Interface
```typescript
// GOOD - Testing observable behavior
it('should return formatted result', () => {
  const result = component.publicMethod(input)
  expect(result).toEqual(expectedOutput)
})
```

## TDD Metrics

### Velocity Metrics
- Tests written per feature: 100% (all features have tests)
- Test execution time: <5 seconds for unit tests
- Coverage achieved: ≥85% minimum, 95%+ target

### Quality Metrics
- Defect density: <1 bug per 1000 lines
- Test flakiness: <1% flaky tests
- Test maintenance: <10% time spent fixing tests

## Summary

**TDD is mandatory for all features in A2UI Core.**

Key principles:
1. **Test first** - Always write tests before implementation
2. **Red-Green-Refactor** - Follow the cycle
3. **85% minimum coverage** - Enforce with CI/CD
4. **Fast tests** - Keep unit tests under 5 seconds
5. **Clear assertions** - Use specific matchers
6. **Mock boundaries** - Mock external dependencies only

---

**Last Updated**: 2026-02-11
**Status**: Mandatory
**Enforcement**: Pre-commit hooks + CI/CD
