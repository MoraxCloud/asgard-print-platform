// 版本派生脚本：从本包 package.json 的 version 派生运行时版本常量。
// package.json 是唯一真源，避免状态栏显示的版本号与 npm 发包版本漂移。
// 与 gen-styles / gen-icons 一样挂在 npm run styles 链上，build/test 前自动刷新。
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PKG = fileURLToPath(new URL('..', import.meta.url))
const PKG_JSON = join(PKG, 'package.json')
const OUT = join(PKG, 'src/version.ts')

let version
try {
  version = JSON.parse(readFileSync(PKG_JSON, 'utf8')).version
} catch {
  console.error('[gen-version] 读取 package.json 失败')
  process.exit(1)
}
if (!version || !/^\d+\.\d+\.\d+/.test(version)) {
  console.error(`[gen-version] 版本号非法：${version}`)
  process.exit(1)
}

writeFileSync(OUT, `// 自动生成，请勿手改：由 scripts/gen-version.mjs 从 package.json 的 version 派生。
/** 设计器（@worm-print-platform/canvas）当前版本，用于状态栏等 UI 展示 */
export const CANVAS_VERSION = '${version}'
`)

console.log(`[gen-version] 已派生 src/version.ts：v${version}`)
