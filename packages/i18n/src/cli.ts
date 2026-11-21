#!/usr/bin/env node
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { discover } from './discover.js'
import { buildTemplate } from './template.js'

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

/** CLI 命令入口；后续 Task 在同一 run() 中追加 validate / update 分支。 */
export function run(argv: string[], deps: RunDeps = {}): number {
  const cwd = deps.cwd ?? process.cwd()
  const out = deps.out ?? ((line: string) => process.stdout.write(`${line}\n`))
  const [command, ...rest] = argv
  const outputFile = (() => { const i = rest.indexOf('-o'); return i >= 0 ? rest[i + 1] : undefined })()
  const dir = (() => { const i = rest.indexOf('--dir'); return i >= 0 ? rest[i + 1] : undefined })()

  if (command === 'template') {
    const template = buildTemplate(discover(dir ?? cwd))
    const text = `${JSON.stringify(template, null, 2)}\n`
    if (outputFile) writeFileSync(resolve(cwd, outputFile), text, 'utf8')
    else out(text.trimEnd())
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
