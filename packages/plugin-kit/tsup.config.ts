import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    dom: 'src/dom.ts',
    controls: 'src/color-picker.ts',
    'expression-editor': 'src/expression-editor.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  shims: true,
  external: ['@worm-print-platform/core', '@worm-print-platform/core/designer', '@worm-print-platform/core/i18n'],
})
