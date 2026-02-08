# Changelog

All notable changes to @ainative/ai-kit-a2ui-core will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0-alpha.1] - 2025-12-23

### Added

- **JSON Pointer (RFC 6901)** - Complete implementation
  - `JSONPointer.resolve()` - Navigate object paths
  - `JSONPointer.set()` - Set values with auto-creation
  - `JSONPointer.remove()` - Remove values
  - `JSONPointer.compile()` - Parse pointer strings
  - Full RFC 6901 escape sequence support (~0, ~1)
  - 89% test coverage

- **WebSocket Transport** - Framework-agnostic agent communication
  - `A2UITransport` class with event-based API
  - Auto-reconnect with configurable retry
  - Ping/pong keep-alive
  - Connection status tracking
  - Message type routing

- **Component Registry** - Component catalog system
  - `ComponentRegistry` class for type management
  - Pre-loaded standard catalog (18 components)
  - Category and tag-based search
  - Extensible for custom components
  - 100% test coverage

- **Protocol Types** - Complete A2UI v0.9 definitions
  - All 18 component types
  - All 8 message types
  - Type guards for message discrimination
  - Strict TypeScript typing
  - 100% test coverage

- **Build Configuration**
  - TypeScript 5.3+ with strict mode
  - tsup for ESM + CJS builds
  - Vitest for testing
  - ESLint + Prettier
  - Bundle size < 20 KB gzipped

- **Documentation**
  - README with examples
  - Comprehensive API docs
  - Contributing guide
  - Product Requirements Document

### Technical Details

- **Zero runtime dependencies** ✅
- **TypeScript strict mode** ✅
- **61 passing tests** ✅
- **66% overall coverage** (excluding index files and WebSocket)
- **ESM + CJS outputs** ✅

### Known Limitations

- WebSocket transport requires browser environment (not tested)
- Index files have 0% coverage (expected - barrel exports only)
- JSON Pointer has 11 uncovered edge case lines

### Breaking Changes

- N/A (initial release)

---

## [Unreleased]

### Planned

- [ ] 100% test coverage for JSON Pointer
- [ ] Browser-based WebSocket transport tests
- [ ] Additional component property schemas
- [ ] Performance benchmarks
- [ ] Example integrations

---

**Legend:**
- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security fixes

[0.1.0-alpha.1]: https://github.com/AINative-Studio/ai-kit-a2ui-core/releases/tag/v0.1.0-alpha.1
