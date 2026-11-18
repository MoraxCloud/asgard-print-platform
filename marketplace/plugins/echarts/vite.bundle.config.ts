import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

/**
 * 浏览器直挂产物：dist/echarts.js（UMD，可 <script src> 直接用）。
 * 与库构建（vite.config.ts）不同：core、plugin-kit 与 echarts 本体全部内联，
 * 宿主不需要 bundler / bare import；两张注册表靠 globalThis Symbol 与 canvas.js 共享。
 */
export default defineConfig({
  resolve: {
    alias: [
      { find: /^@worm-print-platform\/core\/designer$/, replacement: fileURLToPath(new URL('../../../packages/core/src/designer/index.ts', import.meta.url)) },
      { find: /^@worm-print-platform\/core\/browser$/, replacement: fileURLToPath(new URL('../../../packages/core/src/browser/index.ts', import.meta.url)) },
      { find: /^@worm-print-platform\/core\/client$/, replacement: fileURLToPath(new URL('../../../packages/core/src/client/index.ts', import.meta.url)) },
      { find: /^@worm-print-platform\/core$/, replacement: fileURLToPath(new URL('../../../packages/core/src/index.ts', import.meta.url)) },
      { find: /^@worm-print-platform\/plugin-kit$/, replacement: fileURLToPath(new URL('../../../packages/plugin-kit/src/index.ts', import.meta.url)) },
      { find: /^@worm-print-platform\/plugin-echarts\/kit$/, replacement: fileURLToPath(new URL('./src/kit.ts', import.meta.url)) },
      { find: /^@worm-print-platform\/plugin-echarts$/, replacement: fileURLToPath(new URL('./src/index.ts', import.meta.url)) },
    ],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      input: fileURLToPath(new URL('./src/browser-bundle.ts', import.meta.url)),
      output: {
        format: 'umd',
        name: 'WormPrintEcharts',
        entryFileNames: 'echarts.js',
        inlineDynamicImports: true,
      },
    },
  },
})
