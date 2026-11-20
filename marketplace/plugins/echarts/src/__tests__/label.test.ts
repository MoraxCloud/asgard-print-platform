import { describe, expect, it } from 'vitest'
import { labelFieldsOf, labelTargetOf, readChartLabel, updateChartLabel } from '../label.js'
import { createDefaultChartOption } from '../defaults.js'

const bar = (extra: Record<string, unknown> = {}) => ({
  series: [{ type: 'bar', data: ['$data'], ...extra }],
})

describe('readChartLabel', () => {
  it('未写标签时 show 跟随 ECharts 原生默认', () => {
    expect(readChartLabel(undefined, 'barChart').show).toBe(false)
    expect(readChartLabel(undefined, 'pieChart').show).toBe(true)
    expect(readChartLabel(undefined, 'gaugeChart').show).toBe(true)
  })
})

describe('updateChartLabel 默认集', () => {
  it('直角系默认集写 position top / fontSize 12', () => {
    const next = updateChartLabel(bar(), 'barChart', { enabled: true })
    expect((next.series as any[])[0].label).toEqual({ show: true, position: 'top', fontSize: 12 })
  })

  it('饼图默认集写 outside / overflow none', () => {
    const next = updateChartLabel(createDefaultChartOption('pieChart'), 'pieChart', { enabled: true })
    expect((next.series as any[])[0].label).toEqual({ show: true, position: 'outside', overflow: 'none', fontSize: 11 })
  })

  it('仪表盘只写 detail，不产生 label', () => {
    const next = updateChartLabel(createDefaultChartOption('gaugeChart'), 'gaugeChart', { enabled: true })
    expect((next.series as any[])[0].detail).toEqual({ show: true, fontSize: 14 })
    expect((next.series as any[])[0].label).toBeUndefined()
    expect(labelTargetOf('gaugeChart')).toBe('detail')
  })
})

describe('updateChartLabel 写回', () => {
  it('多 series 同步写同一份标签', () => {
    const next = updateChartLabel({ series: [{ type: 'bar' }, { type: 'bar' }] }, 'barChart', { fontSize: 14 })
    expect((next.series as any[]).map(s => s.label.fontSize)).toEqual([14, 14])
  })

  it('关闭只写 show:false 并保留其余配置', () => {
    const next = updateChartLabel(bar({ label: { show: true, fontSize: 16, color: '#f00' } }), 'barChart', { enabled: false })
    expect((next.series as any[])[0].label).toEqual({ show: false, fontSize: 16, color: '#f00' })
  })

  it('重开不覆盖已有 formatter', () => {
    const next = updateChartLabel(bar({ label: { show: false, formatter: '{b}: {c}' } }), 'barChart', { enabled: true })
    expect((next.series as any[])[0].label.formatter).toBe('{b}: {c}')
  })

  it('labelLine 局部更新保留其他键', () => {
    const next = updateChartLabel(
      { series: [{ type: 'pie', labelLine: { show: true, length: 20 } }] },
      'pieChart',
      { labelLine: { length: 8 } },
    )
    expect((next.series as any[])[0].labelLine).toEqual({ show: true, length: 8 })
  })

  it('空字符串与 null 删除键', () => {
    const next = updateChartLabel(bar({ label: { show: true, color: '#f00', formatter: '{c}' } }), 'barChart', { color: '', formatter: null })
    expect((next.series as any[])[0].label).toEqual({ show: true })
  })

  it('未知 kind 原样返回且不修改入参', () => {
    const source = bar({ label: { show: true } })
    const snapshot = JSON.parse(JSON.stringify(source))
    const next = updateChartLabel(source, 'nopeChart', { enabled: false })
    expect(next.series).toEqual(snapshot.series)
    expect(source).toEqual(snapshot)
  })
})

describe('labelFieldsOf 分档', () => {
  it('按图表能力返回字段子集', () => {
    expect(labelFieldsOf('barChart')).not.toContain('labelLine.show')
    expect(labelFieldsOf('pieChart')).toContain('labelLine.length2')
    expect(labelFieldsOf('funnelChart')).not.toContain('labelLine.length2')
    expect(labelFieldsOf('radarChart')).toEqual(['formatter', 'fontSize', 'fontWeight', 'color'])
    expect(labelFieldsOf('gaugeChart')).toEqual(['formatter', 'fontSize', 'fontWeight', 'color', 'offset'])
  })
})

describe('标签偏移 offset: [x, y]', () => {
  const OFFSET_KINDS = [
    'barChart', 'barHChart', 'lineChart', 'areaChart',
    'pieChart', 'doughnutChart', 'scatterChart', 'gaugeChart',
  ]

  it('支持偏移的八类图表都能读写原生 offset', () => {
    for (const type of OFFSET_KINDS) {
      const next = updateChartLabel(createDefaultChartOption(type), type, { offset: [12, -8] })
      const key = labelTargetOf(type)
      expect((next.series as any[])[0][key].offset, type).toEqual([12, -8])
      expect(readChartLabel(next, type).offset, type).toEqual([12, -8])
    }
    expect(labelFieldsOf('radarChart')).not.toContain('offset')
    expect(labelFieldsOf('funnelChart')).not.toContain('offset')
  })

  it('旧 offsetX/offsetY 读入即迁移，写回不再残留旧键', () => {
    const legacy = bar({ label: { show: true, offsetX: 7, offsetY: -3 } })
    expect(readChartLabel(legacy, 'barChart').offset).toEqual([7, -3])
    const next = updateChartLabel(legacy, 'barChart', { fontSize: 14 })
    const label = (next.series as any[])[0].label
    expect(label.offset).toEqual([7, -3])
    expect(label.fontSize).toBe(14)
    expect(label.offsetX).toBeUndefined()
    expect(label.offsetY).toBeUndefined()
  })

  it('仪表盘 detail 的旧偏移同样迁移', () => {
    const legacy = { series: [{ type: 'gauge', detail: { show: true, offsetX: 4, offsetY: 9 } }] }
    expect(readChartLabel(legacy, 'gaugeChart').offset).toEqual([4, 9])
    const next = updateChartLabel(legacy, 'gaugeChart', { color: '#fff' })
    expect((next.series as any[])[0].detail.offset).toEqual([4, 9])
  })

  it('清空偏移同时删除原生键与旧键', () => {
    const source = bar({ label: { show: true, offset: [2, 3], offsetX: 1, offsetY: 1 } })
    const next = updateChartLabel(source, 'barChart', { offset: null as any })
    const label = (next.series as any[])[0].label
    expect(label.offset).toBeUndefined()
    expect(label.offsetX).toBeUndefined()
    expect(label.offsetY).toBeUndefined()
  })
})
