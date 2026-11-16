import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node18',
  dts: true,
  clean: true,
  shims: true,
  external: ['@worm-print-platform/core', '@worm-print-platform/contract', '@modelcontextprotocol/sdk'],
})
