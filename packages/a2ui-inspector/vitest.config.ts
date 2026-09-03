import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        'scripts/',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/types/*.ts',
        // Browser-extension glue code (Chrome API wiring, content-script
        // injection, app shell/entry point) — verified via manual/E2E
        // extension testing, not meaningfully unit-testable without heavy
        // Chrome API mocking that provides little real verification value.
        'src/background/**',
        'src/content/**',
        'src/panel/App.tsx',
        'src/panel/index.tsx',
        'src/shared/utils/index.ts',
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
      '@': resolve(__dirname, './src')
    }
  }
})
