# Monorepo Management Standards

**Purpose**: Standards for managing A2UI Core monorepo with multiple packages
**Status**: Mandatory for all package development

---

## Package Structure

```
ai-kit-a2ui-core/
├── packages/
│   ├── a2ui-react/              # React bindings
│   │   ├── src/
│   │   ├── tests/
│   │   ├── package.json
│   │   └── README.md
│   ├── a2ui-runtime/            # Runtime abstraction layer
│   │   ├── src/
│   │   ├── tests/
│   │   ├── package.json
│   │   └── README.md
│   └── a2ui-vue/                # Future: Vue bindings
├── src/                         # Core library (framework-agnostic)
├── tests/                       # Core library tests
├── sdks/                        # Multi-language SDKs
├── docs/                        # Documentation
├── examples/                    # Example applications
├── package.json                 # Root package.json
├── pnpm-workspace.yaml          # Workspace configuration
└── tsconfig.json                # Root TypeScript config
```

---

## Workspace Configuration

### pnpm-workspace.yaml
```yaml
packages:
  - 'packages/*'
  - 'examples/*'
```

### Root package.json
```json
{
  "name": "@ainative/ai-kit-a2ui-core-monorepo",
  "private": true,
  "workspaces": [
    "packages/*",
    "examples/*"
  ],
  "scripts": {
    "test": "pnpm -r test",
    "build": "pnpm -r build",
    "lint": "pnpm -r lint",
    "type-check": "pnpm -r type-check"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vitest": "^1.6.1",
    "@changesets/cli": "^2.27.0"
  }
}
```

---

## Package Naming Convention

### NPM Scoped Packages
```
@ainative/ai-kit-a2ui-core       # Core library (existing)
@ainative/a2ui-react             # React package
@ainative/a2ui-runtime           # Runtime package
@ainative/a2ui-vue               # Vue package (future)
@ainative/a2ui-angular           # Angular package (future)
```

### Package Versioning
- **Core library**: Independent versioning (currently 0.1.0-alpha.1)
- **Framework packages**: Independent versioning (start at 1.0.0)
- Use Changesets for version management

---

## Dependency Management

### Cross-Package Dependencies
```json
// packages/a2ui-react/package.json
{
  "name": "@ainative/a2ui-react",
  "dependencies": {
    "@ainative/ai-kit-a2ui-core": "workspace:*"
  },
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  }
}
```

### Install Commands
```bash
# Install dependencies for all packages
pnpm install

# Install dependency in specific package
pnpm --filter @ainative/a2ui-react add react

# Add dev dependency in all packages
pnpm -r add -D vitest
```

---

## Build Scripts

### Root-Level Scripts
```json
{
  "scripts": {
    "build": "pnpm -r build",
    "build:core": "pnpm --filter @ainative/ai-kit-a2ui-core build",
    "build:react": "pnpm --filter @ainative/a2ui-react build",
    "build:runtime": "pnpm --filter @ainative/a2ui-runtime build",

    "test": "pnpm -r test",
    "test:core": "pnpm --filter @ainative/ai-kit-a2ui-core test",
    "test:react": "pnpm --filter @ainative/a2ui-react test",

    "lint": "pnpm -r lint",
    "type-check": "pnpm -r type-check",

    "clean": "pnpm -r clean && rm -rf node_modules"
  }
}
```

### Package-Level Scripts
```json
{
  "scripts": {
    "build": "vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src --ext .ts,.tsx",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist node_modules"
  }
}
```

---

## TypeScript Configuration

### Root tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

### Package tsconfig.json
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "jsx": "react-jsx"  // For React packages only
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

---

## Testing Strategy

### Test Organization
```
packages/a2ui-react/
├── src/
│   ├── components/
│   │   ├── A2UIChat.tsx
│   │   └── A2UIChat.test.tsx      # Co-located tests
│   └── hooks/
│       ├── useCoAgent.ts
│       └── useCoAgent.test.ts
└── tests/
    ├── integration/                # Integration tests
    └── e2e/                        # End-to-end tests
```

### Running Tests
```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @ainative/a2ui-react test

# Run tests in watch mode
pnpm --filter @ainative/a2ui-react test:watch

# Coverage for all packages
pnpm -r test:coverage
```

---

## Version Management with Changesets

### Installation
```bash
pnpm add -Dw @changesets/cli
pnpm changeset init
```

### Creating a Changeset
```bash
pnpm changeset
# Select packages that changed
# Select version bump type (major, minor, patch)
# Write change summary
```

### Versioning Packages
```bash
# Update package versions based on changesets
pnpm changeset version

# Publish packages to npm
pnpm changeset publish
```

### Example .changeset/config.json
```json
{
  "$schema": "https://unpkg.com/@changesets/config@2.3.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

---

## Publishing Workflow

### Pre-Publish Checklist
- [ ] All tests passing across all packages
- [ ] Version numbers updated via changesets
- [ ] CHANGELOG.md updated
- [ ] Documentation updated
- [ ] README.md updated in each package
- [ ] No breaking changes (or documented if major version)

### Publishing Commands
```bash
# Build all packages
pnpm build

# Run all tests
pnpm test

# Create changeset (if not already done)
pnpm changeset

# Version packages
pnpm changeset version

# Publish to npm
pnpm changeset publish

# Push tags to git
git push --follow-tags
```

### NPM Registry Configuration
```json
// .npmrc
@ainative:registry=https://registry.npmjs.org/
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```

---

## Example Apps

### Structure
```
examples/
├── react-headless/              # Headless hooks example
│   ├── src/
│   ├── package.json
│   └── README.md
├── react-components/            # Pre-built components example
│   ├── src/
│   ├── package.json
│   └── README.md
└── runtime-express/             # Runtime with Express
    ├── src/
    ├── package.json
    └── README.md
```

### Example package.json
```json
{
  "name": "example-react-headless",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "@ainative/ai-kit-a2ui-core": "workspace:*",
    "@ainative/a2ui-react": "workspace:*",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}
```

---

## Documentation

### Package-Level README.md
Each package MUST have:
- Installation instructions
- Quick start example
- API reference
- Link to full documentation

### Cross-Package Documentation
```
docs/
├── getting-started/
│   ├── installation.md
│   └── core-concepts.md
├── packages/
│   ├── react.md                 # @ainative/a2ui-react docs
│   ├── runtime.md               # @ainative/a2ui-runtime docs
│   └── core.md                  # Core library docs
└── examples/
    ├── todo-app.md
    └── dashboard.md
```

---

## Git Workflow

### Branch Naming
```
feature/85-react-package-foundation
feature/86-coagents-pattern
feature/87-pre-built-components
fix/react-memory-leak
docs/runtime-api-reference
```

### Commit Messages
```
Add React package foundation

- Create package structure
- Implement A2UIProvider context
- Add headless hooks (useA2UIAgent, useA2UIState, useA2UIAction)
- Write 50+ tests with 87% coverage
```

### Pull Request Template
```markdown
## Description
Brief description of changes

## Package(s) Affected
- [ ] @ainative/ai-kit-a2ui-core
- [ ] @ainative/a2ui-react
- [ ] @ainative/a2ui-runtime

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Breaking change
- [ ] Documentation

## Testing
- [ ] All tests passing
- [ ] Coverage ≥85%
- [ ] No TypeScript errors

## Checklist
- [ ] Changeset created
- [ ] Documentation updated
- [ ] Examples updated
```

---

## CI/CD Pipeline

### GitHub Actions Workflow
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 10
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm build
      - run: pnpm test
      - run: pnpm lint
      - run: pnpm type-check
```

---

## Performance Monitoring

### Bundle Size Tracking
```bash
# Install bundle analyzer
pnpm add -Dw @bundle-size/analyze

# Analyze bundle size
pnpm --filter @ainative/a2ui-react run build
npx @bundle-size/analyze dist/index.mjs
```

### Size Budgets
```json
// packages/a2ui-react/package.json
{
  "bundlesize": [
    {
      "path": "./dist/index.mjs",
      "maxSize": "60kb"
    },
    {
      "path": "./dist/headless.mjs",
      "maxSize": "5kb"
    }
  ]
}
```

---

## Common Commands Reference

```bash
# Install dependencies for all packages
pnpm install

# Add dependency to specific package
pnpm --filter @ainative/a2ui-react add react

# Build all packages
pnpm build

# Build specific package
pnpm --filter @ainative/a2ui-react build

# Test all packages
pnpm test

# Test specific package
pnpm --filter @ainative/a2ui-react test

# Lint all packages
pnpm lint

# Type check all packages
pnpm type-check

# Create changeset
pnpm changeset

# Version packages
pnpm changeset version

# Publish to npm
pnpm changeset publish

# Clean all packages
pnpm -r clean && rm -rf node_modules
```

---

## Summary

**Monorepo MUST**:
1. Use pnpm workspaces for dependency management
2. Maintain consistent TypeScript configuration
3. Use Changesets for version management
4. Keep packages independently versioned
5. Provide examples for each package
6. Run tests across all packages in CI/CD
7. Enforce bundle size budgets
8. Document cross-package dependencies
9. Maintain consistent scripts across packages
10. Use scoped npm packages (@ainative/*)

---

**Last Updated**: 2026-02-17
**Status**: Mandatory
**Enforcement**: CI/CD + code review
