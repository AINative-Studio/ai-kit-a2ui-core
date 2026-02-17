import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'types/index': 'src/types/index.ts',
    'json-pointer/index': 'src/json-pointer/index.ts',
    'transport/index': 'src/transport/index.ts',
    'registry/index': 'src/registry/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  minify: false,
  treeshake: true,
  external: [],
  noExternal: [],
  target: 'es2022',
  outDir: 'dist',
})
