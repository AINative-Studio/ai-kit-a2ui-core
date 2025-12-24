import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.config.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/index.ts', // Exclude barrel exports from coverage
      ],
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
})
