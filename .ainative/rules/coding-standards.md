# A2UI Core - Coding Standards

## TypeScript Standards

### Strict Mode Requirements
- **100% TypeScript strict mode** - No exceptions
- **Zero `any` types** - Use proper types or `unknown`
- **Complete type coverage** - All functions, parameters, returns typed
- **JSDoc on public APIs** - Document all exported interfaces

### File Structure
```
src/
├── types/          # Type definitions only
├── handlers/       # Message handlers
├── integrations/   # External service integrations
├── transport/      # Network transport layers
├── utils/          # Utility functions
├── validation/     # Validation logic
└── index.ts        # Main exports

tests/
├── types/          # Type definition tests
├── handlers/       # Handler tests
├── integration/    # Integration tests
└── utils/          # Utility tests
```

### Naming Conventions
- **Files**: kebab-case (`file-upload-components.ts`)
- **Types**: PascalCase (`FileUploadComponent`)
- **Functions**: camelCase (`validateFile()`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_FILE_SIZE`)

### Import/Export Rules
```typescript
// ✅ CORRECT - Named exports
export interface FileUploadComponent { }
export function validateFile() { }

// ❌ WRONG - Default exports
export default FileUploadComponent
```

## Testing Standards

### TDD Requirements
- **Write tests BEFORE implementation**
- **Minimum 85% coverage** - Required for all features
- **100% coverage target** - Aim for perfect coverage
- **All tests must pass** - Zero failing tests allowed

### Test Structure
```typescript
describe('Component/Feature', () => {
  describe('Happy Path', () => {
    it('should handle valid input', () => {
      // Arrange
      const input = createValidInput()

      // Act
      const result = functionUnderTest(input)

      // Assert
      expect(result).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty input', () => { })
    it('should handle null/undefined', () => { })
    it('should handle max limits', () => { })
  })

  describe('Error Cases', () => {
    it('should throw on invalid input', () => {
      expect(() => functionUnderTest(invalid)).toThrow()
    })
  })
})
```

### Test Coverage Requirements
- **Statements**: ≥85%
- **Branches**: ≥85%
- **Functions**: ≥85%
- **Lines**: ≥85%

### Running Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Specific test file
npm test -- tests/types/file-upload.test.ts
```

## Code Quality

### Zero Dependencies Rule
- **Runtime dependencies**: 0 (zero)
- **Dev dependencies only**: Build tools, test frameworks
- **No third-party libraries** in production bundle
- **Pure TypeScript** implementations

### Performance Requirements
- **Parser latency**: <10ms per chunk
- **Memory usage**: <100MB for typical operations
- **Bundle size**: <50KB gzipped

### Security Requirements
- **No eval()** or Function() constructor
- **Input validation** on all external data
- **Type guards** for runtime checks
- **Sanitize file paths** and user input

## Documentation

### JSDoc Requirements
```typescript
/**
 * Upload a file to ZeroDB storage
 *
 * @param file - The file to upload
 * @param metadata - Optional metadata
 * @returns Promise resolving to file ID
 * @throws {ValidationError} If file is invalid
 * @throws {NetworkError} If upload fails
 *
 * @example
 * ```typescript
 * const fileId = await uploadFile(myFile, {
 *   organization: 'org-123'
 * })
 * ```
 */
export async function uploadFile(
  file: File,
  metadata?: FileMetadata
): Promise<string>
```

### README Requirements
- **Clear description** of what the module does
- **Installation instructions**
- **Usage examples** with code
- **API reference** for public interfaces
- **Testing instructions**

## Error Handling

### Error Types
```typescript
// Custom error classes
export class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class NetworkError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message)
    this.name = 'NetworkError'
  }
}
```

### Error Messages
- **User-friendly** - Explain what went wrong
- **Actionable** - Tell user how to fix
- **Specific** - Include relevant details

```typescript
// ✅ GOOD
throw new ValidationError(
  'File size exceeds maximum of 10MB. Please choose a smaller file.',
  'fileSize'
)

// ❌ BAD
throw new Error('Invalid')
```

## Version Control

### Commit Messages
```
Add file upload component

- Implement FileUploadComponent with drag-and-drop
- Add ZeroDB integration for file storage
- Create 35 tests with 100% coverage
```

### Branch Naming
- `feature/123-short-description` - New features
- `fix/456-bug-description` - Bug fixes
- `docs/789-doc-update` - Documentation

### PR Requirements
- All tests passing
- Coverage ≥85%
- No TypeScript errors
- Documentation updated
- README updated if needed

## Accessibility

### WCAG 2.1 AA Compliance
- **Keyboard navigation** - All interactive elements
- **Screen reader support** - ARIA labels
- **Color contrast** - Minimum 4.5:1 ratio
- **Focus indicators** - Visible focus states

### Testing Accessibility
```typescript
describe('Accessibility', () => {
  it('should have proper ARIA labels', () => {
    expect(component.getAttribute('aria-label')).toBeDefined()
  })

  it('should be keyboard navigable', () => {
    // Test tab order and keyboard events
  })
})
```

## Internationalization

### i18n Requirements
- **No hardcoded strings** in UI components
- **Use translation keys** for all text
- **RTL support** - Right-to-left languages
- **Pluralization** - Handle singular/plural forms
- **Date/time formatting** - Locale-aware

### Translation Keys
```typescript
// ✅ CORRECT
const message = t('fileUpload.error.tooLarge', {
  maxSize: '10MB'
})

// ❌ WRONG
const message = 'File is too large'
```

## Performance

### Optimization Rules
- **Lazy loading** - Load code on demand
- **Code splitting** - Separate chunks for routes
- **Tree shaking** - Remove unused code
- **Compression** - Gzip all assets

### Bundle Analysis
```bash
npm run build
npm run analyze-bundle
```

## Review Checklist

Before submitting PR:
- [ ] All tests passing (`npm test`)
- [ ] Coverage ≥85% (`npm run test:coverage`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] Documentation updated
- [ ] README updated if needed
- [ ] No console.log statements
- [ ] No commented-out code
- [ ] Commit messages follow format
- [ ] Branch name follows convention

---

**Last Updated**: 2026-02-11
**Status**: Active
**Enforcement**: Mandatory
