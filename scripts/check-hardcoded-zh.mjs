// 扫描指定目录下的硬编码中文 UI 文案（由 Task 0 的 spike-i18n.mjs 原型提升）
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { relative, resolve } from 'node:path'

const CJK = /[\u4e00-\u9fff]/

function listTsFiles(dir) {
  const out = []
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const name of entries) {
    const full = resolve(dir, name)
    if (statSync(full).isDirectory()) {
      if (name === '__tests__' || name === 'help-content' || name === 'i18n' || name === 'messages') continue
      out.push(...listTsFiles(full))
    } else if (name.endsWith('.ts') && !name.endsWith('.spec.ts') && !name.endsWith('.test.ts') && !name.endsWith('-test.ts') && name !== 'label-translation.ts') {
      out.push(full)
    }
  }
  return out
}

const dirs = process.argv.slice(2)
if (!dirs.length) {
  console.error('用法：node scripts/check-hardcoded-zh.mjs <dir...>')
  process.exit(2)
}

let hits = 0
const samples = []
for (const arg of dirs) {
  const dir = resolve(process.cwd(), arg)
  for (const file of listTsFiles(dir)) {
    readFileSync(file, 'utf8').split(/\r?\n/).forEach((line, i) => {
      const trimmed = line.trim()
      if (!trimmed || /^(\/\/|\/\*|\*)/.test(trimmed)) return
      if (line.includes('tr(') || line.includes('trG(') || line.includes('t(')) return
      // 去掉所有 /* ... */ 与 // 注释（中文注释不算 UI 文案；这里按首个注释符截断）
      let code = line
      const blockAt = code.indexOf('/*')
      const lineAt = code.indexOf('//')
      const cut = Math.min(blockAt === -1 ? Infinity : blockAt, lineAt === -1 ? Infinity : lineAt)
      if (cut !== Infinity) code = code.slice(0, cut)
      if (!CJK.test(code)) return
      hits += 1
      if (samples.length < 12) samples.push(`${relative(process.cwd(), file)}:${i + 1}: ${trimmed.slice(0, 100)}`)
    })
  }
}

if (hits) {
  console.error(`[check-hardcoded-zh] 发现 ${hits} 行未国际化的中文文案：`)
  console.error(samples.join('\n'))
  process.exit(1)
}
console.log('[check-hardcoded-zh] 未发现硬编码中文文案')
