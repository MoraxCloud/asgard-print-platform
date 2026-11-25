import { describe, expect, it } from 'vitest'
import type { IndexIssue, LocalizedText, MarketIndex, MarketIndexEntry } from './types.js'
import { validateIndex } from './validate-index.js'

const basePlugin = (): MarketIndexEntry => ({
  id: 'echarts',
  uniqueId: 'worm-echarts',
  type: 'element',
  name: '百度图表',
  title: { 'zh-CN': '百度图表' },
  version: '1.0.0',
  npmName: '@worm-print-platform/plugin-echarts',
  path: 'plugins/echarts',
  entry: 'dist/index.js',
  kinds: ['barChart'],
  exportFormats: [],
})

const baseIndex = (): MarketIndex => ({
  schemaVersion: 1,
  plugins: [basePlugin()],
})

describe('validateIndex 索引校验', () => {
  it('合法索引无问题', () => {
    expect(validateIndex(baseIndex())).toEqual([])
  })

  it('旧结构索引（缺全部可选字段）不报错', () => {
    const legacy = {
      schemaVersion: 1,
      plugins: [{
        id: 'echarts', name: '百度图表', version: '1.0.0',
        npmName: '@worm-print-platform/plugin-echarts', path: 'plugins/echarts',
        entry: 'dist/index.js', kinds: [], exportFormats: [],
      }],
    } as MarketIndex
    expect(validateIndex(legacy)).toEqual([])
  })

  it('schemaVersion 非 1 报错', () => {
    const index = baseIndex(); index.schemaVersion = 2
    expect(validateIndex(index).some((i: IndexIssue) => i.path === 'schemaVersion')).toBe(true)
  })

  it('uniqueId 重复报错', () => {
    const index = baseIndex()
    const second = { ...basePlugin(), id: 'other' }
    index.plugins = [...index.plugins, second]
    expect(validateIndex(index).some((i: IndexIssue) => i.path === 'plugins[1].uniqueId')).toBe(true)
  })

  it('uniqueId 无连字符报错', () => {
    const index = baseIndex(); index.plugins[0].uniqueId = 'echarts'
    expect(validateIndex(index).some((i: IndexIssue) => i.path === 'plugins[0].uniqueId')).toBe(true)
  })

  it('metadata.category 未声明报错', () => {
    const index = baseIndex(); index.plugins[0].metadata = { category: 'nope' }
    expect(validateIndex(index).some((i: IndexIssue) => i.path === 'plugins[0].metadata.category')).toBe(true)
  })

  it('LocalizedText 缺 zh-CN 报错', () => {
    const index = baseIndex()
    index.plugins[0].title = { en: 'ECharts' } as unknown as LocalizedText
    expect(validateIndex(index).some((i: IndexIssue) => i.path === 'plugins[0].title')).toBe(true)
  })

  it('versions 为空数组报错', () => {
    const index = baseIndex(); index.plugins[0].versions = []
    expect(validateIndex(index).some((i: IndexIssue) => i.path === 'plugins[0].versions')).toBe(true)
  })

  it('engines.core 为空串报错', () => {
    const index = baseIndex(); index.plugins[0].engines = { core: '' }
    expect(validateIndex(index).some((i: IndexIssue) => i.path === 'plugins[0].engines.core')).toBe(true)
  })
})
