import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 10000,
    teardownTimeout: 5000,
    hookTimeout: 10000,
    pool: 'forks',
    poolOptions: {
      forks: {
        isolate: true,
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        'examples/',
        '**/*.stories.tsx',
        '**/*.test.tsx',
        '**/*.test.ts',
        'dist/',
        '.storybook/',
        'storybook-static/',
        // Pure re-export barrels — no executable logic to cover.
        'src/index.ts',
        'src/headless.ts',
        'src/hooks/index.ts',
        'src/context/index.ts',
        'src/types/**',
      ],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
