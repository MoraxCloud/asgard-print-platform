#!/usr/bin/env node
// electron-vite 启动包装：清除宿主注入的 ELECTRON_RUN_AS_NODE 后再拉起 electron-vite。
//
// 背景：从 IDE / AI Agent（其自身是 Electron 应用）的集成终端执行 `npm run dev` 时，
// 宿主会给子进程注入 ELECTRON_RUN_AS_NODE=1，导致 Electron 二进制以纯 Node 模式运行，
// 主进程 `import { BrowserWindow } from 'electron'` 报 “does not provide an export named”。
// 该变量不在系统环境里、只在宿主会话中存在，故统一在启动入口清掉，避免误导性报错。
//
// 用法与 electron-vite 一致，参数原样透传：
//   node scripts/electron-vite-with-env.mjs dev
//   node scripts/electron-vite-with-env.mjs preview
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const pkgJson = require.resolve('electron-vite/package.json')
const binScript = join(dirname(pkgJson), 'bin', 'electron-vite.js')

const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE

const child = spawn(process.execPath, [binScript, ...process.argv.slice(2)], {
  env,
  stdio: 'inherit',
})

child.on('error', (err) => {
  console.error('[electron-vite-with-env] 启动失败:', err.message)
  process.exit(1)
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
  } else {
    process.exit(code ?? 0)
  }
})
