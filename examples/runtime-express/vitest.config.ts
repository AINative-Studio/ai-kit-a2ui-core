import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/**/index.ts', // Exclude index files (just exports)
        'tests/**/*',
      ],
      statements: 90,
      branches: 90,
      functions: 90,
      lines: 90,
    },
    setupFiles: ['tests/setup.ts'],
  },
})
