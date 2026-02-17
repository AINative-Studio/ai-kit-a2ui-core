# Contributing to @ainative/ai-kit-a2ui-core

Thank you for your interest in contributing to the A2UI Core package!

## Development Setup

1. **Clone and install:**
   ```bash
   git clone https://github.com/AINative-Studio/ai-kit-a2ui-core.git
   cd ai-kit-a2ui-core
   npm install
   ```

2. **Run tests:**
   ```bash
   npm test              # Run once
   npm run test:watch    # Watch mode
   npm run test:coverage # With coverage
   ```

3. **Build:**
   ```bash
   npm run build         # Production build
   npm run dev           # Watch mode
   ```

## Project Structure

```
src/
├── index.ts                 # Main entry point
├── types/                   # A2UI protocol types
│   ├── components.ts        # Component type definitions
│   ├── protocol.ts          # Message type definitions
│   └── index.ts
├── json-pointer/            # RFC 6901 implementation
│   ├── json-pointer.ts      # JSON Pointer utilities
│   └── index.ts
├── transport/               # WebSocket transport
│   ├── transport.ts         # A2UI transport layer
│   └── index.ts
└── registry/                # Component registry
    ├── registry.ts          # Component catalog
    └── index.ts

tests/
├── json-pointer/
├── registry/
└── types/
```

## Coding Standards

### TypeScript

- **Strict Mode**: All code must pass `strict: true` checks
- **Type Safety**: No `any` types without justification
- **Documentation**: JSDoc comments on all public APIs
- **Imports**: Use `.js` extensions in imports (ESM requirement)

### Example:

```typescript
/**
 * Resolve a JSON Pointer path
 *
 * @param object - The object to navigate
 * @param pointer - JSON Pointer string (e.g., "/user/name")
 * @returns The resolved value or undefined
 */
export function resolve<T>(object: unknown, pointer: string): T | undefined {
  // Implementation
}
```

### Testing

- **Coverage**: 100% coverage target (currently 66%)
- **TDD**: Write tests before implementation
- **Descriptive**: Use clear test descriptions

```typescript
describe('JSONPointer', () => {
  describe('resolve', () => {
    it('resolves simple object paths', () => {
      const data = { user: { name: 'Alice' } }
      expect(JSONPointer.resolve(data, '/user/name')).toBe('Alice')
    })
  })
})
```

## Zero Dependencies Policy

**CRITICAL**: This package has **ZERO runtime dependencies**.

- ❌ Do NOT add runtime dependencies
- ✅ Dev dependencies are OK (tsup, vitest, etc.)
- ✅ Use standard Web APIs (WebSocket, JSON, etc.)
- ✅ Implement utilities yourself (no lodash, etc.)

## Pull Request Process

1. **Create Issue**: Describe the bug/feature
2. **Branch**: `git checkout -b feature/your-feature`
3. **Implement**: Follow TDD workflow
4. **Test**: Ensure 100% coverage for new code
5. **Document**: Add JSDoc and update README if needed
6. **PR**: Submit with clear description

### PR Checklist

- [ ] Tests added/updated
- [ ] All tests passing (`npm test`)
- [ ] Coverage maintained/improved
- [ ] TypeScript strict mode passing
- [ ] Documentation updated
- [ ] Zero dependencies maintained
- [ ] Build succeeds (`npm run build`)

## Commit Messages

Follow conventional commits:

```
feat: Add JSON Pointer escape handling
fix: Resolve array index edge case
docs: Update JSONPointer examples
test: Add registry category tests
```

## Code Review

All PRs require:
- ✅ Passing CI tests
- ✅ Maintainer approval
- ✅ Zero dependency check

## Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create git tag: `git tag v0.1.0`
4. Push: `git push --tags`
5. Publish: `npm publish`

## Questions?

- GitHub Issues: Bug reports and features
- Discussions: General questions
- Email: hello@ainative.studio

---

**Version**: 0.1.0-alpha.1
**Last Updated**: 2025-12-23
