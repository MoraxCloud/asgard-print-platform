import { copyFileSync, readFileSync } from 'node:fs'
import { defineConfig } from 'tsup'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'))

const banner = `/*!
 * ${pkg.name} v${pkg.version}
 * Copyright (c) 2026 worm <liu_long_qqcom@qq.com>
 * SPDX-FileCopyrightText: 2026 worm <liu_long_qqcom@qq.com>
 * SPDX-License-Identifier: MIT
 */`

export default defineConfig([
  {
    // Node 宿主入口（服务端/Electron 主进程）：读取 IIFE 产物，构建期用 shims 处理 import.meta.url
    entry: { node: 'src/node.ts' },
    format: ['esm', 'cjs'],
    platform: 'node',
    target: 'node18',
    dts: false,
    clean: false,
    shims: true,
    banner: { js: banner },
  },
  {
    // 注入用产物：三端页面上下文共用同一份图表执行器（echarts 随包打入 IIFE）
    // tsup 对 iife 格式固定追加 .global.js 后缀 → dist/executor.iife.global.js
    // target 须 ≥ es2020：iife 会全量内联 core 产物，其 decimal 实现含 BigInt（ES2020）字面量
    entry: { 'executor.iife': 'src/browser/executor.iife.ts' },
    format: ['iife'],
    globalName: '__wormEchartsExecutor',
    platform: 'browser',
    target: 'es2020',
    dts: false,
    clean: false,
    minify: true,
    noExternal: ['echarts'],
    banner: { js: banner },
    // 副作用入口也要有 types 条件：IIFE 本身无导出，声明文件由源码复制到 dist
    onSuccess: async () => {
      copyFileSync(
        new URL('./src/browser/executor.iife.d.ts', import.meta.url),
        new URL('./dist/executor.iife.global.d.ts', import.meta.url),
      )
    },
  },
  {
    // Web Components / plugin-kit 设计器 UI（原 echarts-common 的薄适配层）：
    // 画布走 echarts SSR 静态 SVG，属性台为原生 DOM；import 即注册 element UI。
    entry: { ui: 'src/ui.ts' },
    format: ['esm', 'cjs'],
    platform: 'browser',
    target: 'es2020',
    dts: false,
    clean: false,
    shims: true,
    external: [/^@worm-print-platform\/plugin-echarts(\/.*)?$/, /^@worm-print-platform\/core(\/.*)?$/, /^@worm-print-platform\/plugin-kit(\/.*)?$/],
    banner: { js: banner },
  },
  {
    // 市场安装入口：插件描述符 + 设计器 UI 一次 import 注册完成
    entry: { marketplace: 'src/marketplace.ts' },
    format: ['esm'],
    platform: 'browser',
    target: 'es2020',
    dts: false,
    clean: false,
    shims: true,
    external: [
      /^echarts(\/.*)?$/,
      /^@worm-print-platform\/core(\/.*)?$/,
      /^@worm-print-platform\/plugin-kit(\/.*)?$/,
      /^@worm-print-platform\/plugin-echarts(\/.*)?$/,
    ],
    banner: { js: banner },
  },
])
