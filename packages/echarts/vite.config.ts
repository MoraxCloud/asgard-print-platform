import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

const pkg = JSON.parse(readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf-8'))

// 产物版权头：npm 分发链路唯一能留存署名的位置
const licenseBanner = `/*!
 * ${pkg.name} v${pkg.version}
 * Copyright (c) 2026 worm <liu_long_qqcom@qq.com>
 * SPDX-FileCopyrightText: 2026 worm <liu_long_qqcom@qq.com>
 * SPDX-License-Identifier: MIT
 */`

function licenseBannerPlugin() {
  return {
    name: 'license-banner',
    generateBundle(_options: unknown, bundle: Record<string, { type: string; code: string }>) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type === 'chunk') chunk.code = licenseBanner + chunk.code
      }
    },
  }
}

// 主入口（框架无关插件描述符）与 /kit 子路径走 vite lib 多入口构建；
// node 入口、IIFE 执行器与 /ui（plugin-kit 设计器 UI）由 tsup 产出。
// 图表库 echarts 与 core / plugin-kit 全部外置：宿主自行安装。
export default defineConfig({
  plugins: [licenseBannerPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    lib: {
      entry: {
        index: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
        kit: fileURLToPath(new URL('./src/kit.ts', import.meta.url)),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => (format === 'es' ? `${entryName}.js` : `${entryName}.cjs`),
    },
    rollupOptions: {
      external: [
        // 匹配 echarts 及 /core、/charts 等全部按需子路径：宿主安装、不打进本包
        /^echarts(\/.*)?$/,
        /^@worm-print-platform\/core(\/.*)?$/,
        /^@worm-print-platform\/plugin-kit(\/.*)?$/,
      ],
    },
    sourcemap: false,
    emptyOutDir: true,
  },
})
