import { describe, it, expect } from 'vitest'
import { normalizeChartOption } from '../normalize.js'

describe('形态归一', () => {
  it('条形图归一为横向轴，类目写 yAxis', () => {
    const out = normalizeChartOption('barHChart', { series: [{ type: 'bar', data: ['$data'] }] }) as Record<string, any>
    expect(out.xAxis).toMatchObject({ type: 'value' })
    expect(out.yAxis).toMatchObject({ type: 'category', data: ['$data'] })
    expect(out.series[0].type).toBe('bar')
  })

  it('面积图补 areaStyle，折线图不补', () => {
    expect((normalizeChartOption('areaChart', { series: [{ type: 'line', data: ['$data'] }] }) as Record<string, any>).series[0].areaStyle).toEqual({})
    expect((normalizeChartOption('lineChart', { series: [{ type: 'line', data: ['$data'], areaStyle: {} }] }) as Record<string, any>).series[0].areaStyle).toBeUndefined()
  })

  it('饼/环/散点/雷达/漏斗/仪表的 series.type 被纠正，自定义字段保留', () => {
    const pie = normalizeChartOption('pieChart', { color: ['#f00'], series: [{ type: 'bar', data: ['$data'], name: 'x' }] }) as Record<string, any>
    expect(pie.series[0]).toMatchObject({ type: 'pie', name: 'x' })
    expect(pie.color).toEqual(['#f00'])
    expect(pie.xAxis).toBeUndefined()
    const doughnut = normalizeChartOption('doughnutChart', { series: [{ type: 'pie', data: ['$data'] }] }) as Record<string, any>
    expect(doughnut.series[0].radius).toEqual(['40%', '70%'])
    expect((normalizeChartOption('scatterChart', { series: [{ type: 'bar', data: ['$data'] }] }) as Record<string, any>).series[0].type).toBe('scatter')
    expect((normalizeChartOption('radarChart', { series: [{ type: 'radar', data: ['$data'] }] }) as Record<string, any>).series[0].type).toBe('radar')
    expect((normalizeChartOption('funnelChart', { series: [{ type: 'funnel', data: ['$data'] }] }) as Record<string, any>).series[0].sort).toBe('descending')
    expect((normalizeChartOption('gaugeChart', { series: [{ type: 'gauge', data: ['$data'] }] }) as Record<string, any>).series[0].type).toBe('gauge')
  })

  it('数组轴逐项归一，不被展开成数字键对象', () => {
    const out = normalizeChartOption('barChart', {
      xAxis: [{ type: 'category', data: ['$data'] }, { type: 'category', data: ['a'] }],
      yAxis: [{ type: 'value' }],
      series: [{ type: 'bar', data: ['$data'] }],
    }) as Record<string, any>
    expect(Array.isArray(out.xAxis)).toBe(true)
    expect(out.xAxis).toHaveLength(2)
    expect(out.xAxis[0].type).toBe('category')
    expect(out.yAxis).toHaveLength(1)
    expect(out.yAxis[0].type).toBe('value')
  })

  it('归一不修改入参', () => {
    const input = { series: [{ type: 'bar', data: ['$data'] }] }
    normalizeChartOption('lineChart', input)
    expect(input.series[0].type).toBe('bar')
  })

  it('存量 offsetX/offsetY 迁成 ECharts 原生 offset: [x, y]', () => {
    const input = { series: [{ type: 'bar', data: ['$data'], label: { show: true, offsetX: 8, offsetY: -4 } }] }
    const out = normalizeChartOption('barChart', input) as Record<string, any>
    expect(out.series[0].label.offset).toEqual([8, -4])
    expect(out.series[0].label.offsetX).toBeUndefined()
    expect(out.series[0].label.offsetY).toBeUndefined()
    expect(input.series[0].label.offsetX).toBe(8)
  })

  it('已有 offset 不被旧键覆盖，仪表盘 detail 同样迁移', () => {
    const out = normalizeChartOption('barChart', {
      series: [{ type: 'bar', data: ['$data'], label: { offset: [1, 2], offsetX: 9 } }],
    }) as Record<string, any>
    expect(out.series[0].label.offset).toEqual([1, 2])
    expect(out.series[0].label.offsetX).toBeUndefined()
    const gauge = normalizeChartOption('gaugeChart', {
      series: [{ type: 'gauge', detail: { show: true, offsetY: 6 } }],
    }) as Record<string, any>
    expect(gauge.series[0].detail.offset).toEqual([0, 6])
  })
})
