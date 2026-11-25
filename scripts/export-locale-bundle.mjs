// 把所有内置语言资源合并成标准 i18next resources（用户可直接 i18next.init({ resources })）。
// 用法：npm run i18n:bundle（前置：npm run build，需 core/dist 存在）
// 产出：dist/i18n/resources.json 与 dist/i18n/resources.js
// 结构：{ [locale]: { core, help, constants, propertyTips, echarts } }
// 注意：help 段是静态内容（正文含 HTML），不参与运行时取词，仅作交付快照。
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const LOCALES = ['zh-CN', 'en-US', 'th-TH']
const CORE_I18N = resolve(ROOT, 'packages/core/dist/i18n')
const PLUGINS = [{ id: 'echarts', dir: resolve(ROOT, 'marketplace/plugins/echarts/dist/i18n') }]

const read = (rel) => readFileSync(resolve(ROOT, rel), 'utf8')

/** 从包内 dist/i18n/<locale>.json 读取命名空间；缺失时 warn 并跳过（不阻塞 bundle） */
function readNamespace(dir, locale, ns) {
  const file = resolve(dir, `${locale}.json`)
  if (!existsSync(file)) return undefined
  const data = JSON.parse(readFileSync(file, 'utf8'))
  if (!data[ns]) return undefined
  return data[ns]
}

/** 从帮助章节 TS 文件提取 default export 的 id / title / content(模板字符串) */
function parseHelpSection(source) {
  const id = (source.match(/id:\s*'([^']+)'/) ?? [])[1]
  const title = (source.match(/title:\s*'([^']+)'/) ?? [])[1]
  const content = (source.match(/content:\s*`([\s\S]*?)`/) ?? [])[1] ?? ''
  return id ? { id, title, content } : null
}

function main() {
  const resources = {}
  const HELP_SECTIONS = ['getting-started', 'features', 'advanced-settings', 'shortcuts', 'faq', 'changelog']

  for (const locale of LOCALES) {
    const core = readNamespace(CORE_I18N, locale, 'core')
    if (!core) throw new Error(`缺少 core/dist/i18n/${locale}.json 的 core 命名空间，请先 npm run build -w @worm-print-platform/core`)

    // 帮助文档：按章节 id 聚合（静态内容，不参与运行时）
    const help = {}
    for (const sec of HELP_SECTIONS) {
      const parsed = parseHelpSection(read(`packages/canvas/src/shell/help-content/${locale}/${sec}.ts`))
      if (parsed) help[parsed.id] = parsed
    }

    const entry = {
      core,
      help,
      constants: readNamespace(CORE_I18N, locale, 'constants') ?? {},
      propertyTips: readNamespace(CORE_I18N, locale, 'propertyTips') ?? {},
    }
    for (const plugin of PLUGINS) {
      const messages = readNamespace(plugin.dir, locale, plugin.id)
      if (messages) entry[plugin.id] = messages
      else if (locale === 'zh-CN') console.warn(`[export-locale-bundle] 跳过 ${plugin.id}：未找到 ${plugin.dir}/${locale}.json（先构建该插件）`)
    }
    resources[locale] = entry
  }

  const outDir = resolve(ROOT, 'dist/i18n')
  mkdirSync(outDir, { recursive: true })
  writeFileSync(resolve(outDir, 'resources.json'), `${JSON.stringify(resources, null, 2)}\n`, 'utf8')
  writeFileSync(
    resolve(outDir, 'resources.js'),
    `/* @worm-print-platform 聚合语言资源（标准 i18next resources；help 为静态快照，不参与运行时） */\nexport const resources = ${JSON.stringify(resources)};\nexport default resources;\n`,
    'utf8',
  )
  console.log(`[export-locale-bundle] 已写出 dist/i18n/resources.json 与 resources.js，locales=${LOCALES.join(',')}`)
}

main()
