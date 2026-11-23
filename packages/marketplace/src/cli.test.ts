import { describe, expect, it, vi } from 'vitest'
import { filterAndSortPlugins, formatPluginLines, main, parseArgs } from './cli.js'
import type { InstallOptions, InstallResult, MarketIndex } from './types.js'

const fakeResult = (id: string): InstallResult => ({
  id, version: '1.0.0', target: `/tmp/${id}`, source: 'local', stable: true, created: true,
})

describe('CLI 参数解析', () => {
  it('解析 install 名称、版本与旗标', () => {
    const args = parseArgs(['install', 'echarts@1.0.0', '--source', 'npm', '--force'])
    expect(args.command).toBe('install')
    expect(args.name).toBe('echarts')
    expect(args.version).toBe('1.0.0')
    expect(args.source).toBe('npm')
    expect(args.force).toBe(true)
  })

  it('作用域包名无版本时不误判版本', () => {
    const args = parseArgs(['install', '@worm-print-platform/plugin-echarts'])
    expect(args.name).toBe('@worm-print-platform/plugin-echarts')
    expect(args.version).toBeUndefined()
  })

  it('非法 --source 报错', () => {
    expect(() => parseArgs(['install', 'x', '--source', 'svn'])).toThrow(/source/)
  })

  it('缺省 source 为 auto', () => {
    expect(parseArgs(['install', 'x']).source).toBe('auto')
  })
})

describe('CLI 执行', () => {
  it('main 调用 install 并传出解析结果', async () => {
    const spy = vi.fn(async (_options: InstallOptions) => fakeResult('echarts'))
    const out = vi.fn()
    const code = await main(['install', 'echarts', '--source', 'local', '--repo', '/tmp/repo'], {
      install: spy, out,
    })
    expect(code).toBe(0)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0]).toMatchObject({
      name: 'echarts', source: 'local', repo: '/tmp/repo',
    })
    expect(spy.mock.calls[0][0].version).toBeUndefined()
  })

  it('缺少命令时返回非零并提示', async () => {
    const out = vi.fn()
    const code = await main([], { out })
    expect(code).toBe(1)
    expect(out).toHaveBeenCalled()
  })
})

const listIndex = (): MarketIndex => ({
  schemaVersion: 1,
  metadata: {
    categories: {
      element: { title: { 'zh-CN': '元素插件', en: 'Element' } },
      functional: { title: { 'zh-CN': '功能插件', en: 'Functional' } },
    },
    sortKeys: { publishedAt: { title: { 'zh-CN': '发布时间' }, order: 'desc' } },
  },
  plugins: [
    {
      id: 'echarts', uniqueId: 'worm-echarts', type: 'element', name: '百度图表',
      title: { 'zh-CN': '百度图表', en: 'ECharts Charts' }, version: '1.6.1',
      npmName: '@worm-print-platform/plugin-echarts', path: 'plugins/echarts',
      entry: 'dist/marketplace.js', kinds: [], exportFormats: [],
      engines: { core: '>=1.5.2 <2' }, publishTimestamp: 200,
      metadata: { category: 'element', labels: [], sortKeys: { publishedAt: 200 } },
    },
    {
      id: 'data-preview', uniqueId: 'worm-data-preview', type: 'functional', name: '数据源预览',
      title: { 'zh-CN': '数据源预览', en: 'Data Preview' }, version: '0.1.0',
      npmName: '@worm-print-platform/plugin-data-preview', path: 'plugins/data-preview',
      entry: 'dist/index.js', kinds: [], exportFormats: [],
      publishTimestamp: 100,
      metadata: { category: 'functional', labels: [], sortKeys: { publishedAt: 100 } },
    },
  ],
})

describe('CLI list 筛选与展示', () => {
  it('parseArgs 解析 list 的筛选旗标，非法 type 报错', () => {
    const args = parseArgs(['list', '--type', 'element', '--search', 'charts', '--locale', 'en', '--sort', 'publishedAt', '--json'])
    expect(args).toMatchObject({
      command: 'list', type: 'element', search: 'charts', locale: 'en', sort: 'publishedAt', json: true,
    })
    expect(() => parseArgs(['list', '--type', 'bogus'])).toThrow(/type/)
  })

  it('filterAndSortPlugins 按 type/category/label/search 过滤，sort 缺值排最后', () => {
    expect(filterAndSortPlugins(listIndex(), { type: 'functional' }).map(p => p.id)).toEqual(['data-preview'])
    expect(filterAndSortPlugins(listIndex(), { category: 'element' }).map(p => p.id)).toEqual(['echarts'])
    expect(filterAndSortPlugins(listIndex(), { search: '预览' }).map(p => p.id)).toEqual(['data-preview'])
    const sorted = filterAndSortPlugins(listIndex(), { sort: 'publishedAt' }).map(p => p.id)
    expect(sorted).toEqual(['echarts', 'data-preview'])
  })

  it('formatPluginLines 含 uniqueId、localized 类型名与标题、版本与 engines', () => {
    const lines = formatPluginLines(listIndex().plugins, 'en', listIndex().metadata?.categories)
    expect(lines).toContain('worm-echarts')
    expect(lines).toContain('Element')
    expect(lines).toContain('ECharts Charts')
    expect(lines).toContain('1.6.1')
    expect(lines).toContain('>=1.5.2 <2')
  })

  it('main list --json 输出含 uniqueId/type/title 的合法 JSON', async () => {
    const out = vi.fn()
    const code = await main(['list', '--json'], { index: listIndex(), out })
    expect(code).toBe(0)
    const parsed = JSON.parse(out.mock.calls[0][0] as string)
    expect(parsed[0]).toMatchObject({ uniqueId: 'worm-echarts', type: 'element' })
    expect(parsed[0].title).toMatchObject({ 'zh-CN': '百度图表' })
  })

  it('旧结构索引（缺可选字段）也能展示，回退 id 与内置类型名', () => {
    const legacy: MarketIndex = {
      schemaVersion: 1,
      plugins: [{
        id: 'echarts', name: '百度图表', version: '1.0.0',
        npmName: '@worm-print-platform/plugin-echarts', path: 'plugins/echarts',
        entry: 'dist/index.js', kinds: ['barChart'], exportFormats: [],
      }],
    }
    const lines = formatPluginLines(filterAndSortPlugins(legacy, {}), 'zh-CN')
    expect(lines).toContain('echarts')
    expect(lines).toContain('元素插件')
  })

  it('main validate 对违规索引返回 1 并把问题写到 stderr', async () => {
    const out = vi.fn()
    const err = vi.fn()
    const bad = listIndex() as MarketIndex
    bad.schemaVersion = 2
    const code = await main(['validate'], { index: bad, out, err })
    expect(code).toBe(1)
    expect(err).toHaveBeenCalled()
    expect(String(err.mock.calls[0][0])).toContain('schemaVersion')
  })
})
