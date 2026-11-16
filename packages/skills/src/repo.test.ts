import { describe, expect, it } from 'vitest'
import {
  DEFAULT_GITHUB_REPO,
  DEFAULT_GITEE_REPO,
  parseRepoUrl,
  resolveSources,
} from './repo'
import { SkillError } from './types'

describe('parseRepoUrl', () => {
  it('解析 https GitHub 地址并识别平台', () => {
    const source = parseRepoUrl('https://github.com/foo/bar.git')
    expect(source.url).toBe('https://github.com/foo/bar.git')
    expect(source.host).toBe('github')
    expect(source.hostName).toBe('github.com')
  })

  it('解析 Gitee 地址', () => {
    const source = parseRepoUrl('https://gitee.com/foo/bar.git')
    expect(source.host).toBe('gitee')
  })

  it('解析 scp 风格 SSH 地址', () => {
    const source = parseRepoUrl('git@github.com:foo/bar.git')
    expect(source.host).toBe('github')
    expect(source.hostName).toBe('github.com')
  })

  it('解析 ssh:// 风格地址', () => {
    const source = parseRepoUrl('ssh://git@gitee.com/foo/bar.git')
    expect(source.host).toBe('gitee')
  })

  it('owner/repo 简写补全为 GitHub', () => {
    const source = parseRepoUrl('foo/bar')
    expect(source.url).toBe('https://github.com/foo/bar.git')
    expect(source.host).toBe('github')
  })

  it('自定义主机归类为 other', () => {
    expect(parseRepoUrl('https://gitlab.example.com/foo/bar.git').host).toBe('other')
  })

  it('保留原始输入用于提示', () => {
    const source = parseRepoUrl('  https://gitee.com/foo/bar.git  ')
    expect(source.raw).toBe('https://gitee.com/foo/bar.git')
  })

  it.each([
    ['空地址', '   '],
    ['无协议', 'github.com/foo/bar.git'],
    ['以连字符开头', '--upload-pack=evil'],
    ['含空白', 'https://github.com/foo bar.git'],
  ])('拒绝%s', (_label, input) => {
    expect(() => parseRepoUrl(input)).toThrow(SkillError)
    try {
      parseRepoUrl(input)
    } catch (error) {
      expect((error as SkillError).code).toBe('BAD_REPO')
    }
  })
})

describe('resolveSources', () => {
  it('缺省时返回 GitHub → Gitee 双源且顺序固定', () => {
    const sources = resolveSources()
    expect(sources.map(s => s.url)).toEqual([DEFAULT_GITHUB_REPO, DEFAULT_GITEE_REPO])
  })

  it('显式 repo 时只返回单一源', () => {
    const url = 'https://gitee.com/liulong_oschina/worm-print-platform.git'
    const sources = resolveSources(url)
    expect(sources).toHaveLength(1)
    expect(sources[0].url).toBe(url)
  })

  it('repo 为空白字符串时回落到默认双源', () => {
    expect(resolveSources('   ').map(s => s.url)).toEqual([
      DEFAULT_GITHUB_REPO,
      DEFAULT_GITEE_REPO,
    ])
  })
})
