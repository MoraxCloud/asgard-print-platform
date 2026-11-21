import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import type { LocalePackage } from './types.js'

export interface TargetPack {
  locale: string
  messages: Record<string, string>
}

export interface ReportOptions {
  cwd?: string
  locales?: string[]
}

interface Row {
  key: string
  values: Record<string, string>
}

const DEFAULT_LOCALES = ['zh-CN', 'en-US', 'th-TH']

/** 模块名：core 按 key 首段分组，插件按「插件 id / 第二段」分组。 */
function moduleOf(ns: string, key: string): string {
  if (ns === 'constants') return '常量 constants'
  if (ns === 'propertyTips') return '属性说明 propertyTips'
  const parts = key.split('.')
  if (ns === 'core') return `core / ${parts[0]}`
  return `${ns} / ${parts[1] ?? '其它'}`
}

/** 收集对照行：模块按首次出现顺序，模块内按键排序。 */
function collectRows(pkgs: LocalePackage[], locales: string[], target?: TargetPack): Map<string, Row[]> {
  const modules = new Map<string, Row[]>()
  for (const pkg of pkgs) {
    const base = pkg.locales.get('zh-CN')
    if (!base) continue
    for (const [ns, messages] of Object.entries(base)) {
      for (const key of Object.keys(messages)) {
        const values: Record<string, string> = {}
        for (const locale of locales) values[locale] = pkg.locales.get(locale)?.[ns]?.[key] ?? ''
        if (target && key in target.messages) values[target.locale] = target.messages[key]
        const module = moduleOf(ns, key)
        const rows = modules.get(module) ?? []
        rows.push({ key, values })
        modules.set(module, rows)
      }
    }
  }
  for (const rows of modules.values()) rows.sort((a, b) => a.key.localeCompare(b.key))
  return modules
}

const SOURCE_EXT = /\.(js|cjs|mjs|ts|tsx|vue)$/
const SKIP_DIRS = new Set(['.git', '.cache', 'coverage', '__tests__', 'node_modules/.cache'])
const QUOTED = /['"`]([^'"`\n]+)['"`]/g

/** 建一次索引：扫描包目录/源码目录里的字符串字面量，定位每个 key 的使用位置。 */
function buildUsageIndex(roots: string[], keys: Set<string>, cwd: string): Map<string, string[]> {
  const index = new Map<string, string[]>()
  const seen = new Set<string>()
  const visit = (dir: string, depth: number) => {
    if (depth > 6 || !existsSync(dir) || seen.has(dir)) return
    seen.add(dir)
    let entries: string[] = []
    try { entries = readdirSync(dir) as string[] } catch { return }
    for (const name of entries) {
      if (SKIP_DIRS.has(name)) continue
      const full = join(dir, name)
      let st
      try { st = statSync(full) } catch { continue }
      if (st.isDirectory()) { visit(full, depth + 1); continue }
      if (!SOURCE_EXT.test(name)) continue
      let src: string
      try { src = readFileSync(full, 'utf8') } catch { continue }
      src.split('\n').forEach((line, i) => {
        for (const m of line.matchAll(QUOTED)) {
          if (!keys.has(m[1])) continue
          const loc = `${relative(cwd, full)}:${i + 1}`
          const list = index.get(m[1]) ?? []
          if (!list.includes(loc)) list.push(loc)
          index.set(m[1], list)
        }
      })
    }
  }
  for (const root of roots) visit(root, 0)
  // 源码位置优先于打包产物，便于人工定位与修改
  const priority = (loc: string) => loc.includes('/src/') ? 0 : loc.includes('/dist/') ? 2 : 1
  for (const [key, list] of index) {
    index.set(key, list.sort((a, b) => priority(a) - priority(b)).slice(0, 3))
  }
  return index
}

function usageRoots(opts: ReportOptions, pkgs: LocalePackage[]): string[] {
  const cwd = opts.cwd ?? process.cwd()
  const roots = [join(cwd, 'src'), join(cwd, 'packages')]
  for (const pkg of pkgs) roots.push(pkg.origin)
  return roots.filter(existsSync)
}

const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ')

/** 生成中文在最左的 Markdown 对照表，按模块分组，含使用位置。 */
export function buildComparisonMd(pkgs: LocalePackage[], target?: TargetPack, opts: ReportOptions = {}): string {
  const locales = [...DEFAULT_LOCALES, ...(target ? [target.locale] : [])]
  const columns = ['中文', ...locales.slice(1)]
  const modules = collectRows(pkgs, locales, target)
  const allKeys = new Set<string>()
  for (const rows of modules.values()) for (const row of rows) allKeys.add(row.key)
  const usage = buildUsageIndex(usageRoots(opts, pkgs), allKeys, opts.cwd ?? process.cwd())

  const out = [
    '# 语言包对照表',
    '',
    `> 由 \`worm-print-i18n report\` 生成；中文在最左，按模块分组，使用位置为源码中的引用行。共 ${allKeys.size} 键。`,
    '',
  ]
  for (const [module, rows] of modules) {
    out.push(`## 模块：${module}`, '')
    out.push(`| ${columns.join(' | ')} | 使用位置 |`)
    out.push(`| ${columns.map(() => '---').join(' | ')} | --- |`)
    const localesForColumns = ['zh-CN', ...columns.slice(1)]
    for (const row of rows) {
      const values = localesForColumns.map(l => cell(row.values[l] ?? ''))
      const places = (usage.get(row.key) ?? []).map(p => `\`${p}\``).join('<br>') || '—'
      out.push(`| ${values.join(' | ')} | ${places} |`)
    }
    out.push('')
  }
  return `${out.join('\n')}\n`
}
