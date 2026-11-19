import { describe, expect, it } from 'vitest'
import {
  clearExportPlugins,
  defineExportPlugin,
  getExportPluginById,
  getExportPluginByFormat,
  getExportPlugins,
  registerExportPlugin,
} from './export-plugin-registry.js'

const makePlugin = (id: string, formats: string[], version = '1.0.0') =>
  defineExportPlugin({
    id,
    version,
    formats,
    export: async () => ({ filename: `${id}.out`, blob: new Blob([]) }),
  })

describe('导出插件注册表', () => {
  it('按格式与 id 查询命中', () => {
    const release = registerExportPlugin(makePlugin('excel', ['xlsx']))
    expect(getExportPluginByFormat('xlsx')?.id).toBe('excel')
    expect(getExportPluginById('excel')?.formats).toEqual(['xlsx'])
    release()
  })

  it('同 id 后注册覆盖且跨 bundle 共享同一注册表', () => {
    const first = registerExportPlugin(makePlugin('doc', ['docx'], '1.0.0'))
    const second = registerExportPlugin(makePlugin('doc', ['docx', 'odt'], '2.0.0'))
    expect(getExportPlugins().filter(p => p.id === 'doc')).toHaveLength(1)
    expect(getExportPluginById('doc')?.version).toBe('2.0.0')
    const shared = (globalThis as any)[Symbol.for('worm-print-platform.export-plugin-registry.v1')]
    expect(shared.plugins.has('doc')).toBe(true)
    second()
    first()
  })

  it('formats 为空时 define 抛错', () => {
    expect(() => makePlugin('bad', [])).toThrow(/formats/)
  })

  it('注销后查询不再命中', () => {
    const release = registerExportPlugin(makePlugin('temp', ['pdf']))
    release()
    expect(getExportPluginByFormat('pdf')).toBeUndefined()
  })

  it('clearExportPlugins 清空全部', () => {
    registerExportPlugin(makePlugin('a', ['a1']))
    clearExportPlugins()
    expect(getExportPlugins()).toHaveLength(0)
  })
})
