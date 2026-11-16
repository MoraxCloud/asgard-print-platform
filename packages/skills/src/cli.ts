#!/usr/bin/env node
import { installSkill } from './install'
import { DEFAULT_GITHUB_REPO, DEFAULT_GITEE_REPO } from './repo'
import { SkillError, type SkillErrorCode } from './types'

const USAGE = `用法: npx @worm-print-platform/skills <技能名> [选项]

从 GitHub / Gitee 仓库把官方技能安装到当前项目（默认 .agents/skills/<技能名>/）。

参数:
  <技能名>              必填，单个技能名，如 worm-print-platform-mcp

选项:
  --repo <地址>         仓库地址（GitHub/Gitee 均可），缺省时用默认双源：
                          ${DEFAULT_GITHUB_REPO}
                          ${DEFAULT_GITEE_REPO}
                          先 GitHub，失败自动回退 Gitee。也支持 owner/repo 简写。
  --dir <目录>          技能根目录，技能装到 <目录>/<技能名>/。默认 .agents/skills
  --force               目标技能目录已存在时覆盖（默认拒绝覆盖并报错）
  -h, --help            显示帮助
  -v, --version         显示版本

示例:
  npx @worm-print-platform/skills worm-print-platform-mcp
  npx @worm-print-platform/skills worm-print-platform-integration --dir .qoder/skills
  npx @worm-print-platform/skills worm-print-platform-mcp --repo https://gitee.com/liulong_oschina/worm-print-platform.git

退出码: 0 成功 · 2 参数错误 · 3 目标已存在 · 4 未找到技能 · 5 仓库操作失败 · 6 缺少 git`

/** 稳定退出码映射，便于 AI Agent 与脚本判定失败类型。 */
const EXIT_CODE: Record<SkillErrorCode, number> = {
  BAD_ARGUMENT: 2,
  BAD_SKILL_NAME: 2,
  BAD_REPO: 2,
  ALREADY_EXISTS: 3,
  NOT_FOUND: 4,
  CLONE_FAILED: 5,
  GIT_MISSING: 6,
}

interface ParsedArgs {
  skill: string | undefined
  repo: string | undefined
  dir: string | undefined
  force: boolean
  help: boolean
  version: boolean
}

/** 手写极简参数解析：只保留一个位置参数（技能名），其余为已知开关。 */
function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    skill: undefined,
    repo: undefined,
    dir: undefined,
    force: false,
    help: false,
    version: false,
  }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    switch (arg) {
      case '-h':
      case '--help':
        parsed.help = true
        break
      case '-v':
      case '--version':
        parsed.version = true
        break
      case '--force':
        parsed.force = true
        break
      case '--repo':
      case '--dir': {
        const value = argv[++i]
        if (value === undefined || value.startsWith('--')) {
          throw new SkillError('BAD_ARGUMENT', `${arg} 需要一个值`)
        }
        if (arg === '--repo') parsed.repo = value
        else parsed.dir = value
        break
      }
      default:
        if (arg.startsWith('-')) {
          throw new SkillError('BAD_ARGUMENT', `未知选项：${arg}`)
        }
        if (parsed.skill !== undefined) {
          throw new SkillError('BAD_ARGUMENT', `只接受一个技能名，多余参数：${arg}`)
        }
        parsed.skill = arg
    }
  }
  return parsed
}

const VERSION = '1.5.0'

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    console.log(USAGE)
    return
  }
  if (args.version) {
    console.log(`@worm-print-platform/skills ${VERSION}`)
    return
  }
  if (!args.skill) {
    console.error(USAGE)
    throw new SkillError('BAD_ARGUMENT', '缺少技能名')
  }

  const result = await installSkill(args.skill, {
    repo: args.repo,
    dir: args.dir,
    force: args.force,
  })
  console.log(`已安装技能「${result.skill}」→ ${result.target}`)
  console.log(`来源：${result.source.url}`)
  if (!result.created) console.log('提示：已覆盖原有技能目录。')
}

main().catch(error => {
  const code = error instanceof SkillError ? EXIT_CODE[error.code] : 1
  const message = error instanceof Error ? error.message : String(error)
  console.error(`安装失败：${message}`)
  process.exitCode = code
})
