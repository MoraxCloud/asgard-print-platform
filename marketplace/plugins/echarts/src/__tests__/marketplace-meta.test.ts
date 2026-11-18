import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const index = JSON.parse(readFileSync(new URL('../../../../marketplace.json', import.meta.url), 'utf8'))
const plugin = JSON.parse(readFileSync(new URL('../../plugin.json', import.meta.url), 'utf8'))
const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'))

describe('百度图表市场插件', () => {
  it('索引与插件清单元数据一致', () => {
    const entry = index.plugins.find((p: any) => p.id === 'echarts')
    expect(entry).toBeDefined()
    expect(entry.version).toBe(plugin.version)
    expect(pkg.wormPrint.version).toBe(plugin.version)
    expect(entry.npmName).toBe(plugin.npmName)
    expect(entry.entry).toBe(plugin.entry)
    expect(entry.path).toBe('plugins/echarts')
  })

  it('声明十类图表且无导出格式', () => {
    expect(plugin.kinds).toHaveLength(10)
    const types = plugin.kinds.map((k: any) => k.type)
    expect(types).toContain('barChart')
    expect(types).toContain('gaugeChart')
    expect(plugin.exportFormats).toEqual([])
  })

  it('市场包为源码真源且可独立发布', () => {
    expect(pkg.name).toBe('@worm-print-platform/plugin-echarts')
    expect(pkg.wormPrint.id).toBe('echarts')
    expect(pkg.wormPrint.entry).toBe('dist/marketplace.js')
    expect(pkg.wormPrint.entry).toBe(plugin.entry)
    expect(pkg.dependencies.echarts).toBe('^6.1.0')
    expect(pkg.dependencies['@worm-print-platform/echarts']).toBeUndefined()
    expect(readFileSync(new URL('../marketplace.ts', import.meta.url), 'utf8')).toContain('ui')
  })

  it('兼容镜像包由同一源码生成', () => {
    const compat = JSON.parse(readFileSync(new URL('../../../../../packages/echarts/package.json', import.meta.url), 'utf8'))
    expect(compat.name).toBe('@worm-print-platform/echarts')
    expect(compat.scripts.build).toContain('marketplace/plugins/echarts')
  })
})
