// 从内置语言包派生语义键清单：npm run i18n:keys / npm run i18n:check
// core 的 TS 消息包 + constants/propertyTips 三语 JSON 资源共同构成键集合。
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const MESSAGES_DIR = resolve(HERE, '../src/i18n/messages')
const LOCALES_DIR = resolve(HERE, '../src/i18n/locales')
const OUT_FILE = resolve(HERE, '../src/i18n/locale-keys.json')
const LOCALES = ['zh-CN', 'en-US', 'th-TH']
const RESOURCE_NAMESPACES = ['constants', 'propertyTips']

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

/** 读取 JSON 资源里的扁平键：{ ns: { key: value } } → key[] */
export function readJsonKeys(locale, ns) {
  const data = JSON.parse(readFileSync(resolve(LOCALES_DIR, `${ns}-${locale}.json`), 'utf8'))
  const messages = data[ns]
  if (!messages || typeof messages !== 'object') throw new Error(`${ns}-${locale}.json 缺少 ${ns} 命名空间`)
  return Object.keys(messages)
}

function main() {
  // core 消息包用 ...shell / ...expr 汇总；把拆出的文件也纳入键集合与校验
  const bundleFiles = [
    ['zh-CN.ts', 'shell-zh.ts', 'expr-zh.ts'],
    ['en-US.ts', 'shell-en.ts', 'expr-en.ts'],
    ['th-TH.ts', 'shell-th.ts', 'expr-th.ts'],
  ]
  const sources = bundleFiles.map(files =>
    files.map(f => readFileSync(resolve(MESSAGES_DIR, f), 'utf8')).join('\n'),
  )
  const [zhSource, enSource, thSource] = sources

  // core 三语 parity（原有语义）
  for (const [label, source] of [['en', enSource], ['th', thSource]]) {
    const { missing, extra } = checkParity(zhSource, source)
    if (missing.length || extra.length) {
      console.error(`[gen-locale-keys] core 键不一致：${label} 缺失 [${missing.join(', ')}]；${label} 多出 [${extra.join(', ')}]`)
      process.exit(1)
    }
  }

  // constants / propertyTips 三语 parity：以 zh-CN 为基准
  const jsonResources = new Map()
  for (const ns of RESOURCE_NAMESPACES) {
    const byLocale = new Map(LOCALES.map(locale => [locale, readJsonKeys(locale, ns)]))
    jsonResources.set(ns, byLocale)
    const base = byLocale.get('zh-CN')
    for (const locale of ['en-US', 'th-TH']) {
      const keys = byLocale.get(locale)
      const missing = base.filter(k => !keys.includes(k))
      const extra = keys.filter(k => !base.includes(k))
      if (missing.length || extra.length) {
        console.error(`[gen-locale-keys] ${ns} 键不一致：${locale} 缺失 [${missing.join(', ')}]；${locale} 多出 [${extra.join(', ')}]`)
        process.exit(1)
      }
    }
  }

  const coreKeys = parseKeys(zhSource)
  const resourceKeys = RESOURCE_NAMESPACES.flatMap(ns => jsonResources.get(ns).get('zh-CN'))
  const keys = [...new Set([...coreKeys, ...resourceKeys])].sort()
  // locale-keys.json 必须是合法 JSON（不能加 // 注释头），否则下游 JSON.parse 失败
  const body = `${JSON.stringify(keys, null, 2)}\n`
  if (process.argv.includes('--check')) {
    const current = readFileSync(OUT_FILE, 'utf8')
    if (current !== body) {
      console.error('[gen-locale-keys] locale-keys.json 与语言包不同步，请运行 npm run i18n:keys')
      process.exit(1)
    }
    console.log(`[gen-locale-keys] 校验通过：${keys.length} 个键（含 constants/propertyTips 三语 parity）`)
    return
  }
  writeFileSync(OUT_FILE, body, 'utf8')
  console.log(`[gen-locale-keys] 已写入 ${keys.length} 个键`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
