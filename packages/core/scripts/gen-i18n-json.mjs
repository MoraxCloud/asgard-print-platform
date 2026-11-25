// 构建后从 dist/i18n/index.js 的 getResources() 生成 dist/i18n/<locale>.json。
// 语言包 JSON 不手写产物，避免与运行时资源漂移。
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const mod = await import(pathToFileURL(resolve(ROOT, 'dist/i18n/index.js')).href)
const resources = mod.getResources()
const outDir = resolve(ROOT, 'dist/i18n')
mkdirSync(outDir, { recursive: true })
for (const [locale, namespaces] of Object.entries(resources)) {
  writeFileSync(resolve(outDir, `${locale}.json`), `${JSON.stringify(namespaces, null, 2)}\n`, 'utf8')
}
console.log(`[gen-i18n-json] 已写出 ${Object.keys(resources).length} 份语言资源：${Object.keys(resources).join(', ')}`)
