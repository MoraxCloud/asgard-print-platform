import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { installSkill, resolveSkillTarget, validateSkillName } from './install'
import { SkillError, type GitExecutor, type GitResult } from './types'

const tempDirs: string[] = []
function makeTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'skills-test-'))
  tempDirs.push(dir)
  return dir
}
afterEach(() => {
  while (tempDirs.length) rmSync(tempDirs.pop()!, { recursive: true, force: true })
})

const SKILL = 'worm-print-platform-mcp'

/** 模拟 git：clone 在目标临时目录造出 skills/<name>/SKILL.md，sparse-checkout 空操作。 */
function mockGit(options: { failUrls?: string[]; skill?: string } = {}): {
  executor: GitExecutor
  calls: string[][]
} {
  const calls: string[][] = []
  const skill = options.skill ?? SKILL
  const failUrls = options.failUrls ?? []
  const executor: GitExecutor = async (args, cwd): Promise<GitResult> => {
    calls.push([...args])
    if (args[0] === 'clone') {
      const failed = failUrls.find(url => args.includes(url))
      if (failed) throw new Error(`模拟克隆失败：${failed}`)
      const tmpRoot = args[args.length - 1]
      const skillDir = join(tmpRoot, 'skills', skill)
      const { mkdirSync } = await import('node:fs')
      mkdirSync(skillDir, { recursive: true })
      writeFileSync(join(skillDir, 'SKILL.md'), `# ${skill}\n`)
    }
    return { stdout: '', stderr: '' }
  }
  return { executor, calls }
}

describe('validateSkillName', () => {
  it.each([
    ['worm-print-platform-mcp', 'worm-print-platform-mcp'],
    ['  skill.v2  ', 'skill.v2'],
    ['Skill_1', 'Skill_1'],
  ])('接受合法技能名 %s', (input, expected) => {
    expect(validateSkillName(input)).toBe(expected)
  })

  it.each(['', '..', '.', '.hidden', '../evil', 'a/b', 'a b', 'a$cmd', '-lead'])(
    '拒绝非法技能名 %s',
    input => {
      expect(() => validateSkillName(input)).toThrow(SkillError)
      try {
        validateSkillName(input)
      } catch (error) {
        expect((error as SkillError).code).toBe('BAD_SKILL_NAME')
      }
    },
  )
})

describe('resolveSkillTarget', () => {
  it('默认落到 cwd/.agents/skills/<skill>', () => {
    const { target, baseDir } = resolveSkillTarget(SKILL, undefined, '/work/project')
    expect(baseDir).toBe('/work/project/.agents/skills')
    expect(target).toBe('/work/project/.agents/skills/' + SKILL)
  })

  it('相对 dir 相对 cwd 解析', () => {
    const { target } = resolveSkillTarget(SKILL, '.qoder/skills', '/work/project')
    expect(target).toBe('/work/project/.qoder/skills/' + SKILL)
  })

  it('绝对 dir 直接使用', () => {
    const { target } = resolveSkillTarget(SKILL, '/opt/skills', '/work/project')
    expect(target).toBe('/opt/skills/' + SKILL)
  })
})

describe('installSkill', () => {
  it('默认双源：克隆 GitHub，落地到目标目录', async () => {
    const cwd = makeTempDir()
    const { executor, calls } = mockGit()
    const result = await installSkill(SKILL, { cwd, executor })

    expect(result.created).toBe(true)
    expect(result.source.url).toContain('github.com')
    expect(existsSync(join(result.target, 'SKILL.md'))).toBe(true)
    expect(readFileSync(join(result.target, 'SKILL.md'), 'utf8')).toContain(SKILL)
    // clone 用临时目录，sparse-checkout 只取 skills/<skill>
    expect(calls[0][0]).toBe('clone')
    expect(calls[1]).toEqual(['sparse-checkout', 'set', `skills/${SKILL}`])
  })

  it('GitHub 失败时自动回退 Gitee', async () => {
    const cwd = makeTempDir()
    const gitee = 'https://gitee.com/liulong_oschina/worm-print-platform.git'
    const { executor, calls } = mockGit({ failUrls: ['https://github.com/worm-longliu/worm-print-platform.git'] })
    const result = await installSkill(SKILL, { cwd, executor })

    expect(result.source.url).toBe(gitee)
    expect(calls.filter(c => c[0] === 'clone')).toHaveLength(2)
    expect(existsSync(join(result.target, 'SKILL.md'))).toBe(true)
  })

  it('显式 repo 只尝试单一源，失败时不回退', async () => {
    const cwd = makeTempDir()
    const url = 'https://gitee.com/foo/bar.git'
    const { executor, calls } = mockGit({ failUrls: [url] })
    await expect(installSkill(SKILL, { cwd, repo: url, executor })).rejects.toMatchObject({
      code: 'CLONE_FAILED',
    })
    expect(calls.filter(c => c[0] === 'clone')).toHaveLength(1)
  })

  it('仓库中缺少 SKILL.md 时报 NOT_FOUND', async () => {
    const cwd = makeTempDir()
    const { executor } = mockGit({ skill: 'other-skill' })
    await expect(installSkill(SKILL, { cwd, executor })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
  })

  it('目标已存在且无 force 时拒绝覆盖', async () => {
    const cwd = makeTempDir()
    const { executor } = mockGit()
    await installSkill(SKILL, { cwd, executor })
    await expect(installSkill(SKILL, { cwd, executor })).rejects.toMatchObject({
      code: 'ALREADY_EXISTS',
    })
  })

  it('force 时覆盖已有目录且 created 为 false', async () => {
    const cwd = makeTempDir()
    const { executor } = mockGit()
    await installSkill(SKILL, { cwd, executor })
    const result = await installSkill(SKILL, { cwd, force: true, executor })
    expect(result.created).toBe(false)
    expect(existsSync(join(result.target, 'SKILL.md'))).toBe(true)
  })

  it('自定义 dir 生效', async () => {
    const cwd = makeTempDir()
    const { executor } = mockGit()
    const result = await installSkill(SKILL, { cwd, dir: 'custom/skills', executor })
    expect(result.target).toBe(join(cwd, 'custom/skills', SKILL))
    expect(existsSync(join(result.target, 'SKILL.md'))).toBe(true)
  })

  it('不合法的技能名在克隆前就被拒绝', async () => {
    const cwd = makeTempDir()
    const { executor, calls } = mockGit()
    await expect(installSkill('../evil', { cwd, executor })).rejects.toMatchObject({
      code: 'BAD_SKILL_NAME',
    })
    expect(calls).toHaveLength(0)
  })

  it('clone 抛 git 缺失错误时原样上抛', async () => {
    const cwd = makeTempDir()
    const executor: GitExecutor = async () => {
      throw new SkillError('GIT_MISSING', '未找到 git')
    }
    await expect(installSkill(SKILL, { cwd, executor })).rejects.toMatchObject({
      code: 'GIT_MISSING',
    })
  })
})
