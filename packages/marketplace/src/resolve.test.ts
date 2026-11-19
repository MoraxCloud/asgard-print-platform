import { describe, expect, it } from 'vitest'
import { buildGitTag, resolvePluginName, resolveVersion } from './resolve.js'
import type { MarketIndex } from './types.js'

const index: MarketIndex = {
  schemaVersion: 1,
  plugins: [{
    id: 'echarts', name: '百度图表', version: '1.0.0',
    npmName: '@worm-print-platform/plugin-echarts', path: 'plugins/echarts',
    entry: 'dist/index.js', kinds: [], exportFormats: [],
  }],
}

describe('名称与版本解析', () => {
  it('短 id 经索引映射到 npm 包', () => {
    expect(resolvePluginName('echarts', index)).toEqual({
      id: 'echarts', npmName: '@worm-print-platform/plugin-echarts',
    })
  })

  it('未登记短 id 按约定 scope 解析', () => {
    expect(resolvePluginName('foo', index).npmName).toBe('@worm-print-platform/plugin-foo')
  })

  it('拒绝空白与选项式名称', () => {
    expect(() => resolvePluginName('--evil', index)).toThrow()
    expect(() => resolvePluginName('bad name', index)).toThrow()
    expect(() => resolvePluginName('', index)).toThrow()
  })

  it('识别完整 npm spec', () => {
    expect(resolvePluginName('@worm-print-platform/plugin-echarts@1.0.0', index)).toEqual({
      id: 'echarts', npmName: '@worm-print-platform/plugin-echarts@1.0.0',
    })
  })

  it('拼装插件 git tag', () => {
    expect(buildGitTag('echarts', '1.0.0')).toBe('plugins/echarts/v1.0.0')
  })

  it('未指定版本取最高稳定版（npm 与 git ref）', () => {
    expect(resolveVersion('npm', ['1.0.0', '2.0.0-beta.1', '1.2.0'])).toBe('1.2.0')
    expect(resolveVersion('github', [
      'refs/tags/plugins/echarts/v1.0.0',
      'refs/tags/plugins/echarts/v1.1.0-rc.1',
    ])).toBe('1.0.0')
  })

  it('指定版本按请求解析', () => {
    expect(resolveVersion('npm', ['1.0.0', '1.2.0'], '1.2.0')).toBe('1.2.0')
  })

  it('无稳定版本抛 VERSION_NOT_FOUND', () => {
    expect(() => resolveVersion('npm', ['1.0.0-beta.1'])).toThrow(/VERSION_NOT_FOUND/)
  })
})
