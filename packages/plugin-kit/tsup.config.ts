import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  shims: true,
  external: ['@worm-print-platform/core', '@worm-print-platform/core/designer'],
})
