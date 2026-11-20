#!/usr/bin/env node
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { installPlugin, removePlugin } from './install.js'
import { BUNDLED_CATALOG } from './catalog.generated.js'
import { MarketError, type InstallOptions, type MarketIndex, type MarketSource } from './types.js'

declare const PLUGIN_MARKETPLACE_VERSION: string
const VERSION = typeof PLUGIN_MARKETPLACE_VERSION !== 'undefined'
  ? PLUGIN_MARKETPLACE_VERSION
  : '1.6.0'

const SOURCES = new Set(['npm', 'github', 'gitee', 'auto', 'local'])
const USAGE = `用法: worm-print-marketplace <命令> [选项]

命令:
  list                       列出内置索引中的插件
  install <名称>[@版本]      安装单个插件（缺省版本 = 最新稳定版）
  remove <名称>              卸载插件

选项:
  --source npm|github|gitee|auto   安装来源，默认 auto（npm → GitHub → Gitee）
  --dir <路径>                     插件根目录，默认 .worm-print/plugins
  --repo <路径或URL>               本地市场目录或自定义 git 仓库地址
  --force                         已存在时覆盖安装
  -h, --help                      显示帮助
  -v, --version                   显示版本`

export interface ParsedArgs {
  command?: 'list' | 'install' | 'remove'
  name?: string
  version?: string
  source: MarketSource | 'auto'
  dir?: string
  repo?: string
  force: boolean
  help: boolean
  helpVersion: boolean
}

export function parseArgs(argv: string[]): ParsedArgs {
  const result: ParsedArgs = { source: 'auto', force: false, help: false, helpVersion: false }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '-h' || arg === '--help') { result.help = true; continue }
    if (arg === '-v' || arg === '--version') { result.helpVersion = true; continue }
    if (arg === '--force') { result.force = true; continue }
    if (arg === '--source' || arg === '--dir' || arg === '--repo') {
      const value = argv[++i]
      if (!value) throw new MarketError('BAD_ARGUMENT', `${arg} 缺少值`)
      if (arg === '--source') {
        if (!SOURCES.has(value)) throw new MarketError('BAD_ARGUMENT', `不支持的来源（--source）：${value}`)
        result.source = value as MarketSource | 'auto'
      } else if (arg === '--dir') result.dir = value
      else result.repo = value
      continue
    }
    if (arg.startsWith('-')) throw new MarketError('BAD_ARGUMENT', `未知选项：${arg}`)
    if (!result.command) {
      if (arg === 'list' || arg === 'install' || arg === 'remove') result.command = arg
      else throw new MarketError('BAD_ARGUMENT', `未知命令：${arg}`)
      continue
    }
    if (!result.name) {
      const at = arg.lastIndexOf('@')
      if (at > 0) {
        result.name = arg.slice(0, at)
        result.version = arg.slice(at + 1)
      } else {
        result.name = arg
      }
    }
  }
  return result
}

export interface CliDeps {
  install?: typeof installPlugin
  remove?: typeof removePlugin
  index?: MarketIndex
  out?: (message: string) => void
}

function errorCode(err: unknown): number {
  if (err instanceof MarketError) {
    const map: Record<string, number> = {
      BAD_ARGUMENT: 2, BAD_PLUGIN_ID: 2, BAD_REPO: 2,
      NOT_FOUND: 3, VERSION_NOT_FOUND: 3,
      ALREADY_EXISTS: 4, INVALID_PLUGIN: 5,
      NPM_FAILED: 6, CLONE_FAILED: 6, GIT_MISSING: 6,
    }
    return map[err.code] ?? 1
  }
  return 1
}

export async function main(argv: string[], deps: CliDeps = {}): Promise<number> {
  const out = deps.out ?? console.log
  let parsed: ParsedArgs
  try {
    parsed = parseArgs(argv)
  } catch (err) {
    out(err instanceof Error ? err.message : String(err))
    return 1
  }
  if (parsed.help) { out(USAGE); return 0 }
  if (parsed.helpVersion) { out(`@worm-print-platform/marketplace ${VERSION}`); return 0 }
  if (!parsed.command) { out(USAGE); return 1 }

  const index = deps.index ?? BUNDLED_CATALOG
  if (parsed.command === 'list') {
    out(index.plugins.map(p => `${p.id}@${p.version}  ${p.npmName}`).join('\n') || '（索引为空）')
    return 0
  }
  if (!parsed.name) { out('缺少插件名'); return 1 }

  try {
    if (parsed.command === 'install') {
      const options: InstallOptions = {
        name: parsed.name,
        version: parsed.version,
        source: parsed.source,
        dir: parsed.dir,
        repo: parsed.repo,
        force: parsed.force,
        index,
      }
      const result = await (deps.install ?? installPlugin)(options)
      out(`已安装 ${result.id}@${result.version}（来源 ${result.source}）→ ${result.target}`)
      return 0
    }
    await (deps.remove ?? removePlugin)({
      name: parsed.name, dir: parsed.dir, repo: parsed.repo,
    })
    out(`已卸载 ${parsed.name}`)
    return 0
  } catch (err) {
    out(err instanceof Error ? err.message : String(err))
    return errorCode(err)
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then(code => { process.exitCode = code })
}
