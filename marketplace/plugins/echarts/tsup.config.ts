import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'es2020',
  dts: false,
  clean: true,
  shims: true,
  external: [
    /^@worm-print-platform\/core(\/.*)?$/,
    /^@worm-print-platform\/plugin-kit(\/.*)?$/,
    /^@worm-print-platform\/echarts(\/.*)?$/,
  ],
})
