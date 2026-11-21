// 从内置语言包派生语义键清单：npm run i18n:keys / npm run i18n:check
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const MESSAGES_DIR = resolve(HERE, '../src/i18n/messages')
const OUT_FILE = resolve(HERE, '../src/i18n/locale-keys.json')

export function parseKeys(source) {
  const re = /^\s{2,}(?:'([^']+)'|"([^"]+)"|([A-Za-z0-9_$][\w$]*))\s*:/gm
  const keys = []
  for (const match of source.matchAll(re)) keys.push(match[1] ?? match[2] ?? match[3])
  return keys
}

export function checkParity(zhSource, enSource) {
  const zh = parseKeys(zhSource)
  const en = parseKeys(enSource)
  return {
    missing: zh.filter(key => !en.includes(key)),
    extra: en.filter(key => !zh.includes(key)),
  }
}

function main() {
  // 语言包用 ...shell / ...expr 汇总；把拆出的文件也纳入键集合与校验
  const bundleFiles = [
    ['zh-CN.ts', 'shell-zh.ts', 'expr-zh.ts'],
    ['en-US.ts', 'shell-en.ts', 'expr-en.ts'],
    ['th-TH.ts', 'shell-th.ts', 'expr-th.ts'],
  ]
  const [zhSource, enSource, thSource] = bundleFiles.map(files =>
    files.map(f => readFileSync(resolve(MESSAGES_DIR, f), 'utf8')).join('\n'),
  )
  for (const [label, source] of [['en', enSource], ['th', thSource]]) {
    const { missing, extra } = checkParity(zhSource, source)
    if (missing.length || extra.length) {
      console.error(`[gen-locale-keys] 键不一致：${label} 缺失 [${missing.join(', ')}]；${label} 多出 [${extra.join(', ')}]`)
      process.exit(1)
    }
  }
  const keys = parseKeys(zhSource)
  // locale-keys.json 必须是合法 JSON（不能加 // 注释头），否则下游 JSON.parse 失败
  const body = `${JSON.stringify(keys, null, 2)}\n`
  if (process.argv.includes('--check')) {
    const current = readFileSync(OUT_FILE, 'utf8')
    if (current !== body) {
      console.error('[gen-locale-keys] locale-keys.json 与语言包不同步，请运行 npm run i18n:keys')
      process.exit(1)
    }
    console.log(`[gen-locale-keys] 校验通过：${keys.length} 个键`)
    return
  }
  writeFileSync(OUT_FILE, body, 'utf8')
  console.log(`[gen-locale-keys] 已写入 ${keys.length} 个键`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
