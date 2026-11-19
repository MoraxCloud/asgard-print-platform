import { describe, expect, it } from 'vitest'
import { compareStable, extractVersion, isStableVersion, latestStable, parseSemver } from './semver.js'

describe('semver 极简解析', () => {
  it('解析 v 前缀与预发布', () => {
    expect(parseSemver('v1.2.3')).toEqual({ major: 1, minor: 2, patch: 3, prerelease: '' })
    expect(parseSemver('1.2.3-beta.1')?.prerelease).toBe('beta.1')
  })

  it('预发布标识视为非稳定版', () => {
    expect(isStableVersion('1.0.0')).toBe(true)
    expect(isStableVersion('1.0.0-rc.1')).toBe(false)
    expect(isStableVersion('v2.0.0-beta')).toBe(false)
  })

  it('过滤预发布并取最高稳定版', () => {
    expect(latestStable(['1.5.2', '2.0.0-rc.1', '1.5.10', '1.4.9'])).toBe('1.5.10')
    expect(latestStable(['v1.0.0-alpha', 'v2.0.0-beta'])).toBeNull()
  })

  it('稳定版按数字比较', () => {
    expect(compareStable('1.5.2', '1.5.10')).toBeLessThan(0)
    expect(compareStable('2.0.0', '1.9.9')).toBeGreaterThan(0)
  })

  it('从 git tag ref 中抽取版本号', () => {
    expect(extractVersion('refs/tags/plugins/echarts/v1.2.3')).toBe('1.2.3')
    expect(extractVersion('1.0.0')).toBe('1.0.0')
  })
})
