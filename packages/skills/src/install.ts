import { execFile } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { isAbsolute, join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { resolveSources } from './repo'
import {
  SkillError,
  type GitExecutor,
  type InstallOptions,
  type InstallResult,
  type RepoSource,
} from './types'

const execFileAsync = promisify(execFile)

/** 真实 git 执行器：参数数组不经 shell，杜绝命令注入。 */
export const defaultGitExecutor: GitExecutor = async (args, cwd) => {
  let result: { stdout: string | Buffer; stderr: string | Buffer }
  try {
    result = await execFileAsync('git', args, {
      cwd,
      encoding: 'utf8',
      windowsHide: true,
      timeout: 120_000,
      maxBuffer: 4 * 1024 * 1024,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    })
  } catch (error) {
    const err = error as NodeJS.ErrnoException & { stderr?: string }
    if (err.code === 'ENOENT') {
      throw new SkillError('GIT_MISSING', '未找到 git 命令，请先安装 Git 并加入 PATH。')
    }
    const detail = (err.stderr || err.message || String(error)).trim()
    throw new SkillError('CLONE_FAILED', `git ${args[0]} 失败：${detail}`)
  }
  return { stdout: String(result.stdout), stderr: String(result.stderr) }
}

/** 技能名白名单：字母/数字开头，仅含字母数字、点、下划线、连字符。防路径穿越。 */
export function validateSkillName(input: string): string {
  const name = input.trim()
  if (!name || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name) || name === '..' || name === '.') {
    throw new SkillError('BAD_SKILL_NAME', `非法技能名：${input}（仅允许字母数字开头，可含 . _ -）`)
  }
  return name
}

/** 解析技能落地目录：<dir>/<skill>，dir 相对 cwd。 */
export function resolveSkillTarget(
  skill: string,
  dir: string | undefined,
  cwd: string | undefined,
): { target: string; baseDir: string } {
  const root = cwd ? resolve(cwd) : process.cwd()
  const dirInput = dir && dir.trim() ? dir.trim() : '.agents/skills'
  const baseDir = isAbsolute(dirInput) ? resolve(dirInput) : resolve(root, dirInput)
  return { target: join(baseDir, skill), baseDir }
}

/** 从单个仓库稀疏克隆技能目录到临时目录，返回 { skillDir, tmpRoot }。失败时清理临时目录。 */
async function fetchSkillFromRepo(
  source: RepoSource,
  skill: string,
  executor: GitExecutor,
): Promise<{ skillDir: string; tmpRoot: string }> {
  const tmpRoot = mkdtempSync(join(tmpdir(), 'worm-print-skills-'))
  try {
    // 浅克隆 + 稀疏检出：只取 skills/<skill>，避免拉取整个 monorepo。
    await executor(['clone', '--depth', '1', '--filter=blob:none', '--sparse', source.url, tmpRoot])
    await executor(['sparse-checkout', 'set', `skills/${skill}`], tmpRoot)

    const skillDir = join(tmpRoot, 'skills', skill)
    if (!existsSync(join(skillDir, 'SKILL.md'))) {
      throw new SkillError(
        'NOT_FOUND',
        `仓库 ${source.raw} 中不存在技能「${skill}」（缺少 skills/${skill}/SKILL.md）`,
      )
    }
    return { skillDir, tmpRoot }
  } catch (error) {
    rmSync(tmpRoot, { recursive: true, force: true })
    throw error
  }
}

/**
 * 安装技能。默认按 GitHub → Gitee 顺序尝试，任一源成功即落地；
 * 全部失败时聚合各源错误抛出。
 */
export async function installSkill(
  skillInput: string,
  options: InstallOptions = {},
): Promise<InstallResult> {
  const skill = validateSkillName(skillInput)
  const executor = options.executor ?? defaultGitExecutor
  const sources = resolveSources(options.repo)
  const { target, baseDir } = resolveSkillTarget(skill, options.dir, options.cwd)

  if (existsSync(target) && options.force !== true) {
    throw new SkillError(
      'ALREADY_EXISTS',
      `技能目录已存在：${target}\n如确认覆盖，请加 --force 重试。`,
    )
  }
  const created = !existsSync(target)
  const failures: string[] = []

  for (const source of sources) {
    let fetched: { skillDir: string; tmpRoot: string } | undefined
    try {
      fetched = await fetchSkillFromRepo(source, skill, executor)
      mkdirSync(baseDir, { recursive: true })
      if (!created) rmSync(target, { recursive: true, force: true })
      cpSync(fetched.skillDir, target, { recursive: true, errorOnExist: false, force: true })
      return { skill, target, source, created }
    } catch (error) {
      // 确定性错误重试其他源没有意义，立即上抛并保留精确错误码，便于脚本判定。
      if (
        error instanceof SkillError &&
        (error.code === 'NOT_FOUND' || error.code === 'GIT_MISSING')
      ) {
        throw error
      }
      const detail = error instanceof Error ? error.message : String(error)
      failures.push(`${source.raw}：${detail}`)
    } finally {
      if (fetched) rmSync(fetched.tmpRoot, { recursive: true, force: true })
    }
  }

  throw new SkillError(
    'CLONE_FAILED',
    `技能「${skill}」从以下仓库安装均失败：\n- ${failures.join('\n- ')}`,
  )
}
