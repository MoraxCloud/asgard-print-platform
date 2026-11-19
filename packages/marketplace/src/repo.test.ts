import { describe, expect, it } from 'vitest'
import { parseRepoUrl, resolveGitSource } from './repo.js'

describe('仓库地址解析', () => {
  it('解析 GitHub / Gitee HTTPS 地址', () => {
    expect(parseRepoUrl('https://github.com/worm-longliu/worm-print-platform.git').host).toBe('github')
    expect(parseRepoUrl('https://gitee.com/liulong_oschina/worm-print-platform.git').host).toBe('gitee')
  })

  it('支持本地 file:// 仓库用于离线验证', () => {
    const url = 'file:///tmp/marketplace-fixture.git'
    expect(parseRepoUrl(url)).toMatchObject({ url, host: 'other' })
  })

  it('拒绝选项式与空白地址', () => {
    expect(() => parseRepoUrl('--upload-pack=evil')).toThrow()
    expect(() => parseRepoUrl('https://x.com/a b.git')).toThrow()
  })

  it('缺省按来源返回双源常量', () => {
    expect(resolveGitSource('github').url).toContain('github.com')
    expect(resolveGitSource('gitee').url).toContain('gitee.com')
  })
})
