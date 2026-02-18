# A2UI Core Monorepo

**Status**: Active Development
**Package Manager**: pnpm 10.x
**Version Management**: Changesets

---

## Overview

The A2UI Core project is organized as a pnpm monorepo containing the framework-agnostic core library, framework-specific bindings, and example applications.

---

## Repository Structure

```
ai-kit-a2ui-core/
├── packages/                       # Publishable packages
│   ├── a2ui-react/                 # React headless hooks (@ainative/a2ui-react)
│   ├── a2ui-runtime/               # Runtime abstraction layer (@ainative/a2ui-runtime)
│   ├── a2ui-inspector/             # Chrome DevTools extension (@ainative/a2ui-inspector)
│   └── react/                      # Pre-built React components (@ainative/a2ui-react)
├── examples/                       # Example applications (private)
│   ├── react-headless/             # Headless hooks demonstration
│   ├── react-components/           # Pre-built components demo
│   └── runtime-express/            # Runtime with Express.js
├── src/                            # Core library source (@ainative/ai-kit-a2ui-core)
├── tests/                          # Core library tests
├── docs/                           # Documentation
│   ├── monorepo/                   # Monorepo documentation
│   └── roadmap/                    # Project roadmap
└── .changeset/                     # Version management
```

---

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 10.0.0

### Installation

```bash
# Install pnpm globally (if not already installed)
npm install -g pnpm@10

# Clone repository
git clone https://github.com/AINative-Studio/ai-kit-a2ui-core.git
cd ai-kit-a2ui-core

# Install all dependencies
pnpm install
```

### Development

```bash
# Run tests across all packages
pnpm test

# Type check all packages
pnpm type-check

# Lint all packages
pnpm lint

# Build all packages (excluding examples)
pnpm build

# Build specific package
pnpm build:core
pnpm build:react
pnpm build:runtime
```

---

## Packages

### Core Library

**@ainative/ai-kit-a2ui-core** - Framework-agnostic core library

- Zero dependencies
- Full TypeScript support
- A2UI protocol v0.9 implementation
- Location: Root (src/)

[Documentation](../../README.md) | [Changelog](../../CHANGELOG.md)

### React Bindings

**@ainative/a2ui-react** - React hooks and components

- Headless hooks (useA2UIAgent, useA2UIState, useA2UIAction)
- Pre-built components (A2UIChat, A2UIPopup, A2UISidebar)
- Full TypeScript support
- Peer dependency: React >= 18.0.0

[Documentation](../../packages/a2ui-react/README.md)

### Runtime

**@ainative/a2ui-runtime** - LLM provider abstraction

- OpenAI adapter
- Anthropic adapter
- Middleware system
- Action registry
- Peer dependencies: openai, @anthropic-ai/sdk (optional)

[Documentation](../../packages/a2ui-runtime/README.md)

### DevTools Inspector

**@ainative/a2ui-inspector** - Chrome DevTools extension

- A2UI protocol debugging
- State inspection
- Message capture
- Performance tracking

[Documentation](../../packages/a2ui-inspector/README.md)

---

## Common Commands

### Dependency Management

```bash
# Add dependency to workspace root
pnpm add -Dw <package>

# Add dependency to specific package
pnpm --filter @ainative/a2ui-react add <package>

# Add dev dependency
pnpm --filter @ainative/a2ui-react add -D <package>

# Remove dependency
pnpm --filter @ainative/a2ui-react remove <package>
```

### Running Scripts

```bash
# Run script in all packages
pnpm -r <script>

# Run script in specific package
pnpm --filter <package-name> <script>

# Examples
pnpm -r build              # Build all packages
pnpm -r test               # Test all packages
pnpm test:core             # Test core only
pnpm --filter @ainative/a2ui-react test   # Test React package
```

### Changesets

```bash
# Create a changeset
pnpm changeset

# Version packages
pnpm changeset:version

# Publish packages
pnpm changeset:publish
```

---

## Workspace Configuration

### pnpm-workspace.yaml

```yaml
packages:
  - 'packages/*'    # All framework packages
  - 'examples/*'    # Example applications
```

### Internal Dependencies

All packages use the workspace protocol for internal dependencies:

```json
{
  "dependencies": {
    "@ainative/ai-kit-a2ui-core": "workspace:*"
  }
}
```

This ensures packages always use the local version during development.

---

## Version Management

### Creating a Changeset

1. Make your changes
2. Run `pnpm changeset`
3. Select affected packages
4. Choose version bump type (major, minor, patch)
5. Write change summary
6. Commit the changeset file

### Versioning Workflow

```bash
# After merging PRs with changesets
pnpm changeset:version

# This updates:
# - package.json versions
# - CHANGELOG.md files
# - Removes consumed changesets

# Commit version changes
git add .
git commit -m "Version packages"

# Publish to npm
pnpm changeset:publish
git push --follow-tags
```

---

## CI/CD

### GitHub Actions

**CI Workflow** - Runs on every push/PR
- Linting
- Type checking
- Testing (Node 18 & 20)
- Building

**Release Workflow** - Runs on push to main
- Creates release PR (via Changesets)
- Publishes packages to npm
- Creates git tags

### Environment Variables

Set in GitHub repository settings:

```bash
NPM_TOKEN=<npm-publish-token>
CODECOV_TOKEN=<codecov-token> (optional)
```

---

## Testing

### Running Tests

```bash
# All packages
pnpm test

# With coverage
pnpm test:coverage

# Specific package
pnpm --filter @ainative/a2ui-react test

# Watch mode
pnpm test:watch
```

### Coverage Requirements

- Minimum: 80% overall coverage
- Monorepo tests: 24 tests covering workspace configuration

---

## Documentation

- [Migration Guide](./MIGRATION_GUIDE.md) - Migrating from npm to pnpm
- [Monorepo Standards](../../.ainative/rules/monorepo-standards.md) - Development standards
- [Contributing Guide](../../CONTRIBUTING.md) - How to contribute
- [Testing Guide](./TESTING.md) - Testing best practices

---

## Troubleshooting

### Common Issues

1. **"workspace:*" not resolving**
   ```bash
   pnpm install
   ```

2. **Build failures**
   ```bash
   pnpm -r clean
   pnpm install
   pnpm build
   ```

3. **Peer dependency warnings**
   ```bash
   # Add to .npmrc
   auto-install-peers=true
   ```

### Getting Help

- [GitHub Issues](https://github.com/AINative-Studio/ai-kit-a2ui-core/issues)
- [Discord Community](https://discord.gg/ainative)
- [Email Support](mailto:hello@ainative.studio)

---

## Performance

### Installation Speed

| Command | Time | vs npm |
|---------|------|--------|
| `pnpm install` (cold) | 24s | 47% faster |
| `pnpm install` (cached) | 8s | 82% faster |

### Disk Space

| Setup | Size | vs npm |
|-------|------|--------|
| pnpm workspace | 189MB | 59% smaller |

---

## Links

- [GitHub Repository](https://github.com/AINative-Studio/ai-kit-a2ui-core)
- [npm Organization](https://www.npmjs.com/org/ainative)
- [Documentation](https://docs.ainative.studio)
- [Website](https://ainative.studio)

---

**Maintained by**: AINative Studio
**License**: MIT
**Last Updated**: 2026-02-17
