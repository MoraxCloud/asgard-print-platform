// electron-vite build 之后、electron-builder 之前：把仓库根 locales/*.json 复制到 out/locales。
// out/** 已在 electron-builder files 中，自动进入 asar；无 locales/ 目录时跳过。
import { cpSync, existsSync, mkdirSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../../..')
const src = resolve(repoRoot, 'locales')
const dest = resolve(here, '../out/locales')
if (!existsSync(src)) {
  console.log('[copy-locales] 未发现 locales/，跳过')
  process.exit(0)
}
mkdirSync(dest, { recursive: true })
cpSync(src, dest, { recursive: true, filter: f => statSync(f).isDirectory() || f.endsWith('.json') })
console.log('[copy-locales] 已复制 locales/ 到 out/locales')
