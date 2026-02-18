import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    dts({
      rollupTypes: true,
      include: ['src/**/*'],
      exclude: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx']
    })
  ],
  resolve: {
    alias: {
      '@ainative/ai-kit-a2ui-core/transport': resolve(__dirname, '../../src/transport/index.ts'),
      '@ainative/ai-kit-a2ui-core/types': resolve(__dirname, '../../src/types/index.ts'),
      '@ainative/ai-kit-a2ui-core': resolve(__dirname, '../../src/index.ts'),
    }
  },
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        headless: resolve(__dirname, 'src/headless.ts')
      },
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@ainative/ai-kit-a2ui-core',
        '@ainative/ai-kit-a2ui-core/transport',
        '@ainative/ai-kit-a2ui-core/types'
      ]
    },
    minify: 'terser',
    sourcemap: true
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/types/**',
        '**/index.ts',
        '**/headless.ts'
      ],
      all: true,
      lines: 85,
      functions: 85,
      branches: 85,
      statements: 85
    }
  }
})
