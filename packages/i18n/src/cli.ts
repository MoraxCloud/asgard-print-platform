#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { discover } from './discover.js'
import { buildTemplate } from './template.js'
import { validatePack } from './validate.js'
import { updatePack } from './update.js'

export interface RunDeps {
  cwd?: string
  out?: (line: string) => void
}

const USAGE = `用法: worm-print-i18n <命令> [参数]

命令:
  template [-o <文件>] [--dir <项目根>]   导出扁平点号键翻译骨架
  validate <文件> [--strict] [--dir <项目根>]  校验语言包
  update   <文件> [--prune] [--dir <项目根>]  按最新骨架增量更新

退出码: 0 成功 / 1 校验失败 / 2 用法错误`

/** 取第一个位置参数（跳过布尔开关与带值开关的参数）。 */
function positional(rest: string[], flagsWithValue: string[]): string | undefined {
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i]
    if (flagsWithValue.includes(arg)) { i++; continue }
    if (arg === '--strict' || arg === '--prune' || arg.startsWith('-')) continue
    return arg
  }
  return undefined
}

/** CLI 命令入口。 */
export function run(argv: string[], deps: RunDeps = {}): number {
  const cwd = deps.cwd ?? process.cwd()
  const out = deps.out ?? ((line: string) => process.stdout.write(`${line}\n`))
  const [command, ...rest] = argv
  const dir = (() => { const i = rest.indexOf('--dir'); return i >= 0 ? rest[i + 1] : undefined })()
  const template = () => buildTemplate(discover(dir ?? cwd, msg => out(msg)))

  if (command === 'template') {
    const outputFile = (() => { const i = rest.indexOf('-o'); return i >= 0 ? rest[i + 1] : undefined })()
    const text = `${JSON.stringify(template(), null, 2)}\n`
    if (outputFile) writeFileSync(resolve(cwd, outputFile), text, 'utf8')
    else out(text.trimEnd())
    return 0
  }

  if (command === 'validate') {
    const file = positional(rest, ['-o', '--dir'])
    if (!file) { out('用法错误：validate 需要语言包文件路径'); return 2 }
    let pack: unknown
    try {
      pack = JSON.parse(readFileSync(resolve(cwd, file), 'utf8'))
    } catch (err) {
      out(`读取语言包失败：${file}: ${(err as Error).message}`)
      return 1
    }
    const issues = validatePack(pack, template(), { strict: rest.includes('--strict') })
    let hasError = false
    for (const issue of issues) {
      if (issue.level === 'error') hasError = true
      out(`${issue.level.toUpperCase()}${issue.key ? ` ${issue.key}` : ''}: ${issue.message}`)
    }
    if (!issues.length) out('校验通过')
    return hasError ? 1 : 0
  }

  if (command === 'update') {
    const file = positional(rest, ['-o', '--dir'])
    if (!file) { out('用法错误：update 需要语言包文件路径'); return 2 }
    let pack: Record<string, string>
    try {
      const raw: unknown = JSON.parse(readFileSync(resolve(cwd, file), 'utf8'))
      if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) throw new Error('语言包必须是扁平对象')
      pack = raw as Record<string, string>
    } catch (err) {
      out(`读取语言包失败：${file}: ${(err as Error).message}`)
      return 1
    }
    const base = template()
    const { next, added, removed } = updatePack(pack, base, { prune: rest.includes('--prune') })
    // 写回前按骨架顺序排序；保留的多余键排在最后
    const order = [...Object.keys(base), ...Object.keys(next).filter(k => !(k in base)).sort()]
    const sorted = Object.fromEntries(order.filter(k => k in next).map(k => [k, next[k]]))
    writeFileSync(resolve(cwd, file), `${JSON.stringify(sorted, null, 2)}\n`, 'utf8')
    out(`已更新 ${file}：新增 ${added.length} 键${removed.length ? `，删除 ${removed.length} 键` : ''}`)
    for (const key of added) out(`  + ${key}`)
    for (const key of removed) out(`  - ${key}`)
    return 0
  }

  if (command === '-h' || command === '--help') { out(USAGE); return 0 }
  out(`未知命令：${command ?? '(空)'}`)
  out(USAGE)
  return 2
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(run(process.argv.slice(2)))
}
