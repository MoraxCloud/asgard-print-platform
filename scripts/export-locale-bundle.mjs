// 把所有内置语言资源合并成标准 i18next resources（用户可直接 i18next.init({ resources })）。
// 用法：npm run i18n:bundle（前置：npm run build，需 core/dist 存在）
// 产出：dist/i18n/resources.json 与 dist/i18n/resources.js
// 结构：{ [locale]: { core, help, constants, propertyTips, echarts } }
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const LOCALES = ['zh-CN', 'en-US', 'th-TH']

const read = (rel) => readFileSync(resolve(ROOT, rel), 'utf8')

/**
 * 从源码里提取 `const NAME: Record<string, string> = { ... }` 的键值。
 * 只支持单引号或双引号字符串值（含转义），足以覆盖本项目语言表。
 */
function parseStringRecord(source, name) {
  const start = source.indexOf(`const ${name}`)
  if (start < 0) return {}
  const brace = source.indexOf('{', start)
  let depth = 0
  let end = -1
  for (let i = brace; i < source.length; i++) {
    if (source[i] === '{') depth++
    else if (source[i] === '}') { depth--; if (depth === 0) { end = i; break } }
  }
  if (end < 0) return {}
  const body = source.slice(brace + 1, end)
  const out = {}
  // 全局匹配（非逐行）：支持一行多键值对、单/双引号的键与值、值内转义引号
  const re = /(?:'([^']+)'|"([^"]+)")\s*:\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')/g
  for (const m of body.matchAll(re)) {
    const key = m[1] ?? m[2]
    const raw = m[3] ?? m[4] ?? ''
    out[key] = raw.replace(/\\(["'\\])/g, '$1').replace(/\\n/g, '\n')
  }
  return out
}

/** 从帮助章节 TS 文件提取 default export 的 id / title / content(模板字符串) */
function parseHelpSection(source) {
  const id = (source.match(/id:\s*'([^']+)'/) ?? [])[1]
  const title = (source.match(/title:\s*'([^']+)'/) ?? [])[1]
  const content = (source.match(/content:\s*`([\s\S]*?)`/) ?? [])[1] ?? ''
  return id ? { id, title, content } : null
}

async function main() {
  // core：从构建产物拿（已含三语种内置语义包）
  const coreMod = await import(pathToFileURL(resolve(ROOT, 'packages/core/dist/i18n/index.js')).href)
  const coreResources = coreMod.getResources()

  const helpContent = {}
  const constants = {}
  const propertyTips = {}
  const echarts = {}
  const HELP_SECTIONS = ['getting-started', 'features', 'advanced-settings', 'shortcuts', 'faq', 'changelog']

  for (const locale of LOCALES) {
    const dir = locale === 'zh-CN' ? 'zh-CN' : locale === 'en-US' ? 'en-US' : 'th-TH'
    // 帮助文档：按章节 id 聚合
    const help = {}
    for (const sec of HELP_SECTIONS) {
      const parsed = parseHelpSection(read(`packages/canvas/src/shell/help-content/${dir}/${sec}.ts`))
      if (parsed) help[parsed.id] = parsed
    }
    helpContent[locale] = help

    // 常量映射：中文源文本 → 各语文案
    const labelSrc = read('packages/canvas/src/shell/label-translation.ts')
    const en = parseStringRecord(labelSrc, 'SOURCE_EN')
    const th = parseStringRecord(labelSrc, 'SOURCE_TH')
    constants[locale] = locale === 'th-TH' ? th : en

    // 属性说明：属性 key → 各语文案
    const tipSrc = read('packages/canvas/src/shell/property-tip-translation.ts')
    const tipEn = parseStringRecord(tipSrc, 'EN')
    const tipTh = parseStringRecord(tipSrc, 'TH')
    propertyTips[locale] = locale === 'th-TH' ? tipTh : tipEn

    // echarts 插件语言包
    const eSrc = read(`marketplace/plugins/echarts/src/i18n/${dir === 'th-TH' ? 'th-TH' : dir === 'en-US' ? 'en-US' : 'zh-CN'}.ts`)
    echarts[locale] = parseStringRecord(eSrc, dir === 'zh-CN' ? 'echartsZhCN' : dir === 'en-US' ? 'echartsEnUS' : 'echartsThTH')
  }

  const resources = {}
  for (const locale of LOCALES) {
    resources[locale] = {
      core: coreResources[locale]?.core ?? {},
      help: helpContent[locale] ?? {},
      constants: constants[locale] ?? {},
      propertyTips: propertyTips[locale] ?? {},
      echarts: echarts[locale] ?? {},
    }
  }

  const outDir = resolve(ROOT, 'dist/i18n')
  mkdirSync(outDir, { recursive: true })
  writeFileSync(resolve(outDir, 'resources.json'), JSON.stringify(resources, null, 2) + '\n', 'utf8')
  writeFileSync(
    resolve(outDir, 'resources.js'),
    `/* @worm-print-platform 聚合语言资源（标准 i18next resources） */\nexport const resources = ${JSON.stringify(resources)};\nexport default resources;\n`,
    'utf8',
  )
  console.log(`[export-locale-bundle] 已写出 dist/i18n/resources.json 与 resources.js，locales=${LOCALES.join(',')}`)
}

main().catch((e) => { console.error('[export-locale-bundle] 失败:', e); process.exit(1) })
