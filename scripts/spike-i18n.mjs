// Task 0 先行验证原型：语言包键解析 + 硬编码中文扫描口径
// RED 阶段：parseKeys 为占位实现，--keys 必须先失败
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

export function parseKeys(source) {
  const re = /^\s{2,}(?:'([^']+)'|"([^"]+)"|([A-Za-z0-9_$][\w$]*))\s*:/gm
  const keys = []
  for (const match of source.matchAll(re)) keys.push(match[1] ?? match[2] ?? match[3])
  return keys
}

function listTsFiles(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) {
      if (name === '__tests__' || name === 'help-content') continue
      out.push(...listTsFiles(full))
    } else if (name.endsWith('.ts') && !name.endsWith('.spec.ts') && !name.endsWith('.test.ts')) {
      out.push(full)
    }
  }
  return out
}

function scan() {
  const shellDir = join(ROOT, 'packages/canvas/src/shell')
  const cjk = /[\u4e00-\u9fff]/
  const hits = []
  for (const file of listTsFiles(shellDir)) {
    const lines = readFileSync(file, 'utf8').split(/\r?\n/)
    lines.forEach((line, i) => {
      const trimmed = line.trim()
      if (!trimmed || /^(\/\/|\/\*|\*)/.test(trimmed)) return
      if (line.includes('t(')) return
      if (cjk.test(line)) hits.push(`${relative(ROOT, file)}:${i + 1}: ${trimmed.slice(0, 80)}`)
    })
  }
  const files = new Set(hits.map(h => h.split(':')[0])).size
  console.log(hits.slice(0, 15).join('\n'))
  if (hits.length < 100 || hits.length > 800) {
    console.error(`FAIL: ${files} files, ${hits.length} literal lines (期望 100..800)`)
    process.exit(1)
  }
  const commentLike = hits.slice(0, 10).filter(h => /^\/\/|^\*/.test(h.split(': ')[1] ?? ''))
  if (commentLike.length) {
    console.error('FAIL: 前 10 条命中含纯注释行：', commentLike)
    process.exit(1)
  }
  console.log(`PASS: ${files} files, ${hits.length} literal lines`)
  console.log(hits.slice(0, 10).join('\n'))
}

const args = process.argv.slice(2)
if (args.includes('--keys')) {
  const sample = "const zh = {\n  'toolbar.save': '保存',\n  toolbarPreview: '预览',\n  // 'comment.key': '注释',\n  'nested': { 'inner.key': 'x' },\n}"
  const keys = parseKeys(sample)
  const expected = ['toolbar.save', 'toolbarPreview', 'nested']
  if (JSON.stringify(keys) !== JSON.stringify(expected)) {
    console.error(`FAIL: ${JSON.stringify(keys)}`)
    process.exit(1)
  }
  console.log(`PASS: ${keys.length} keys`)
}
if (args.includes('--scan')) scan()
