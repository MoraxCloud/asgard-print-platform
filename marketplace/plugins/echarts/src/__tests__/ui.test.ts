// @vitest-environment happy-dom
import type { ElementOptions, RuntimeElement } from '@worm-print-platform/core/designer'
import { getElementUI } from '@worm-print-platform/plugin-kit'
import type { ElementUIRenderResult } from '@worm-print-platform/plugin-kit'
import type { ExpressionEditorTarget } from '@worm-print-platform/plugin-kit/expression-editor'
import {
  CHART_KINDS,
  CHART_KIND_DEFINITIONS,
  createDefaultChartOption,
} from '../kit.js'
import { describe, expect, it } from 'vitest'
import { installChartCommonUI, uninstallChartCommonUI } from '../ui.js'

function makeElement(type: string, options: Record<string, unknown> = {}): RuntimeElement {
  return {
    id: `el-${type}`,
    printElementType: { type },
    options: { left: 0, top: 0, width: 100, height: 60, ...options },
  } as unknown as RuntimeElement
}

/** 渲染结果可能是字符串、Node 或 { node, dispose }；统一挂到临时容器里查询 */
function mount(result: ElementUIRenderResult): HTMLElement {
  const raw = typeof result === 'object' && result !== null && 'node' in result ? result.node : result
  if (typeof raw === 'string') {
    const host = document.createElement('div')
    host.innerHTML = raw
    return host
  }
  return raw as HTMLElement
}

function labelsOf(root: HTMLElement): string[] {
  return [...root.querySelectorAll('.pd-label')].map(node => node.textContent?.trim() ?? '')
}

interface PropertyFixture {
  root: HTMLElement
  updates: Partial<ElementOptions>[]
  expressionRequests: Array<{
    target: ExpressionEditorTarget
    apply: (next: { formatter?: string; binding?: string; title?: string }) => void
  }>
}

type OpenExpression = (
  target: ExpressionEditorTarget,
  apply: (next: { formatter?: string; binding?: string; title?: string }) => void,
) => void

function renderProperty(
  type: string,
  options: Record<string, unknown> = {},
  data: readonly Record<string, unknown>[] = [{ name: '华东', value: 12, region: 'A' }],
  fields: readonly { fieldKey: string; fieldLabel: string; fieldType?: string; sortOrder?: number }[] = [],
  openExpression?: OpenExpression,
): PropertyFixture {
  const ui = getElementUI(type)
  expect(ui?.renderProperty).toBeTypeOf('function')
  const updates: Partial<ElementOptions>[] = []
  const expressionRequests: PropertyFixture['expressionRequests'] = []
  const result = ui!.renderProperty!({
    element: makeElement(type, options),
    data,
    fields: fields.map(field => ({
      ...field,
      fieldType: field.fieldType ?? 'string',
      sortOrder: field.sortOrder ?? 0,
    })),
    update: partial => { updates.push(partial) },
    repaint: () => {},
    openExpression: openExpression ?? (() => {}),
  })
  return { root: mount(result), updates, expressionRequests }
}

describe('echarts common ElementUI 注册', () => {
  it('十种图表类型全部注册到 plugin-kit 且共用同一份 UI', () => {
    expect(CHART_KINDS).toHaveLength(10)
    const uis = CHART_KINDS.map(type => getElementUI(type))
    uis.forEach(ui => expect(ui).toBeDefined())
    expect(new Set(uis).size).toBe(1)
  })

  it('install / uninstall 幂等', () => {
    installChartCommonUI()
    installChartCommonUI()
    expect(getElementUI('barChart')).toBeDefined()
    uninstallChartCommonUI()
    uninstallChartCommonUI()
    expect(getElementUI('barChart')).toBeUndefined()
    installChartCommonUI()
    expect(getElementUI('barChart')).toBeDefined()
  })

  it('searchKeywords 与 Vue 面板同口径', () => {
    const keywords = getElementUI('barChart')?.searchKeywords ?? []
    expect(keywords).toContain('图表')
    expect(keywords).toContain('仪表')
    expect(keywords).toContain('echarts')
  })
})

describe('renderCanvas', () => {
  it('十种类型都产出包在 echarts-canvas-element 里的静态 SVG', () => {
    const ui = getElementUI('barChart')!
    for (const def of CHART_KIND_DEFINITIONS) {
      const html = ui.renderCanvas({
        element: makeElement(def.type, { chartOption: createDefaultChartOption(def.type) }),
        data: [{ name: '华东', value: 12 }],
        designMode: true,
      })
      expect(typeof html, def.type).toBe('string')
      expect(html, def.type).toContain('class="echarts-canvas-element"')
      expect(html, def.type).toContain('pointer-events:none')
      expect(html, def.type).toContain('<svg')
    }
  })
})

describe('renderProperty', () => {
  it('柱状图出数据映射 + 样式 + 堆叠字段', () => {
    const { root } = renderProperty('barChart')
    const labels = labelsOf(root)
    expect(labels).toEqual(expect.arrayContaining([
      '数据源', '类目字段', '数值字段（多值多系列）', '系列拆分字段',
      '图表标题', '显示图例', '配色', '堆叠显示',
    ]))
    expect(labels).not.toContain('气泡大小')
    expect(labels).not.toContain('内径（%）')
  })

  it('饼图只留单数值字段、无堆叠', () => {
    const labels = labelsOf(renderProperty('pieChart').root)
    expect(labels).toContain('数值字段')
    expect(labels).not.toContain('堆叠显示')
    expect(labels).not.toContain('内径（%）')
  })

  it('仪表盘出 min/max、无类目字段', () => {
    const labels = labelsOf(renderProperty('gaugeChart').root)
    expect(labels).toContain('最小 / 最大值')
    expect(labels).not.toContain('类目字段')
  })

  it('散点图出气泡开关', () => {
    const { root } = renderProperty('scatterChart')
    expect(labelsOf(root)).toContain('气泡大小')
    const wrap = [...root.querySelectorAll('.pd-field')].find(
      item => item.querySelector('.pd-label')?.textContent?.trim() === '气泡大小',
    )
    expect(wrap?.querySelector('input[type="checkbox"]')).not.toBeNull()
  })
})

describe('renderProperty 写回', () => {
  it('改类目字段写回 normalize 后的 chartOption，并保留未知自定义字段', () => {
    const chartOption = {
      ...createDefaultChartOption('barChart'),
      myCustomMarker: { keep: true },
      dataNote: '手写备注',
      // 与 barChart 语义不符的 series.type，用于验证写回前按 kind 归一
      series: [{ type: 'line', data: ['$data'], name: '旧名' }],
    }
    const requests: PropertyFixture['expressionRequests'] = []
    const { root, updates } = renderProperty('barChart', { chartOption }, [{ trend: [{ name: '一月', region: '东' }] }], [], (target, apply) => {
      requests.push({ target, apply })
    })
    const pickers = [...root.querySelectorAll<HTMLButtonElement>('.echarts-field-picker')]
    pickers[1]!.click() // 类目字段
    requests[0]!.apply({ formatter: '{region}', binding: 'region' })

    expect(updates).toHaveLength(1)
    const patch = updates[0]!
    expect(patch.chartCategoryField).toBe('region')
    const written = patch.chartOption as Record<string, unknown>
    expect(written.myCustomMarker).toEqual({ keep: true })
    expect(written.dataNote).toBe('手写备注')
    expect((written.series as Record<string, unknown>[])[0]!.type).toBe('bar')
    expect((written.series as Record<string, unknown>[])[0]!.data).toEqual(['$data'])
  })

  it('气泡开关只写回 chartBubble，不动其它键', () => {
    const { root, updates } = renderProperty('scatterChart', {
      chartOption: createDefaultChartOption('scatterChart'),
    })
    const wrap = [...root.querySelectorAll('.pd-field')].find(
      item => item.querySelector('.pd-label')?.textContent?.trim() === '气泡大小',
    )
    const checkbox = wrap!.querySelector('input[type="checkbox"]') as HTMLInputElement
    checkbox.checked = true
    checkbox.dispatchEvent(new Event('change'))

    expect(updates).toHaveLength(1)
    expect(updates[0]!.chartBubble).toBe(true)
    expect(updates[0]!.chartOption).toBeDefined()
  })

  it('数值字段按 kind 上限增删，series 数量随之对齐', () => {
    const { root, updates } = renderProperty('barChart', {
      chartOption: createDefaultChartOption('barChart'),
      chartValueFields: ['value'],
    })
    const add = [...root.querySelectorAll('button')].find(btn => btn.textContent?.includes('添加字段'))
    expect(add).toBeDefined()
    add!.dispatchEvent(new Event('click'))

    expect(updates).toHaveLength(1)
    expect(updates[0]!.chartValueFields).toEqual(['value', ''])
    expect((updates[0]!.chartOption as Record<string, unknown>).series).toHaveLength(2)
  })
})

describe('hasProperties', () => {
  it('只有带图表专属属性的元素才显示自定义属性页签', () => {
    const ui = getElementUI('barChart')!
    expect(ui.hasProperties!(makeElement('barChart', { chartOption: createDefaultChartOption('barChart') }))).toBe(true)
    expect(ui.hasProperties!(makeElement('barChart', { chartCategoryField: 'name' }))).toBe(true)
    expect(ui.hasProperties!(makeElement('barChart'))).toBe(false)
    expect(ui.hasProperties!({ id: 'empty', printElementType: { type: 'barChart' } } as unknown as RuntimeElement)).toBe(false)
  })
})

describe('数据标签分组', () => {
  it('柱状图面板出现数据标签分组与总开关', () => {
    const { root } = renderProperty('barChart')
    expect(root.querySelector('.echarts-label-group')).not.toBeNull()
    expect(labelsOf(root)).toContain('显示数据标签')
  })

  it('饼图面板含引导线，柱状图不含', () => {
    expect(labelsOf(renderProperty('pieChart').root)).toContain('显示引导线')
    expect(labelsOf(renderProperty('barChart').root)).not.toContain('显示引导线')
  })

  it('仪表盘不出现「标签位置」', () => {
    expect(labelsOf(renderProperty('gaugeChart').root)).not.toContain('标签位置')
  })

  it('打开总开关写默认集且只提交一次', () => {
    const { root, updates } = renderProperty('barChart', { chartOption: createDefaultChartOption('barChart') })
    const wrap = [...root.querySelectorAll('.pd-field')].find(
      item => item.querySelector('.pd-label')?.textContent?.trim() === '显示数据标签',
    )!
    const box = wrap.querySelector('input[type="checkbox"]') as HTMLInputElement
    box.checked = true
    box.dispatchEvent(new Event('change'))
    expect(updates).toHaveLength(1)
    expect((updates[0]!.chartOption as any).series[0].label).toEqual({ show: true, position: 'top', fontSize: 12 })
  })

  it('选择 formatter 预设写入模板字符串', () => {
    const { root, updates } = renderProperty('barChart', { chartOption: createDefaultChartOption('barChart') })
    const select = [...root.querySelectorAll('select.pd-select')].find(node =>
      [...node.options].some(o => o.textContent === '名称: 数值')) as HTMLSelectElement
    expect(select).toBeDefined()
    select.value = '{b}: {c}'
    select.dispatchEvent(new Event('change'))
    expect((updates[0]!.chartOption as any).series[0].label.formatter).toBe('{b}: {c}')
  })

  it('偏移 X / Y 两个输入框整对写回 offset: [x, y]', () => {
    const { root, updates } = renderProperty('barChart', { chartOption: createDefaultChartOption('barChart') })
    const wrap = [...root.querySelectorAll('.pd-field')].find(
      item => item.querySelector('.pd-label')?.textContent?.trim() === '偏移 X / Y',
    )!
    const inputs = [...wrap.querySelectorAll('input[type="number"]')] as HTMLInputElement[]
    expect(inputs).toHaveLength(2)
    inputs[0]!.value = '18'
    inputs[0]!.dispatchEvent(new Event('change'))
    expect((updates[0]!.chartOption as any).series[0].label.offset).toEqual([18, 0])
    // 第二个输入框取的是实时 DOM 值，不依赖上一次提交后的重绘
    inputs[1]!.value = '-6'
    inputs[1]!.dispatchEvent(new Event('change'))
    expect((updates[1]!.chartOption as any).series[0].label.offset).toEqual([18, -6])
  })

  it('颜色留空删除该键', () => {
    const option = createDefaultChartOption('barChart')
    ;(option.series as any[])[0].label = { show: true, color: '#ff0000' }
    const { root, updates } = renderProperty('barChart', { chartOption: option })
    // 颜色字段现用共享 colorPicker：点触发钮开面板 → 点「清除」按钮 → onChange(undefined) → 写回 '' → 归一化删键
    const trigger = root.querySelector('button.preset-color-trigger') as HTMLButtonElement
    expect(trigger).toBeTruthy()
    trigger.click()
    const clear = document.querySelector('.picker-clear') as HTMLButtonElement
    expect(clear).toBeTruthy()
    clear.click()
    expect((updates[0]!.chartOption as any).series[0].label.color).toBeUndefined()
  })
})

describe('数据源/字段弹框选择', () => {
  const option = () => createDefaultChartOption('barChart')
  const chartData = [{ trend: [{ name: '一月', sales: 120, region: '东' }] }]
  const capture = () => {
    const requests: PropertyFixture['expressionRequests'] = []
    const apply: OpenExpression = (target, applyNext) => { requests.push({ target, apply: applyNext }) }
    return { requests, apply }
  }

  it('图表绑定字段通过字段表达式弹框选择并回写原始 key', () => {
    const { requests, apply } = capture()
    const fields = [
      { fieldKey: 'goodsDetails', fieldLabel: '货物明细', fieldType: 'list', sortOrder: 1 },
      { fieldKey: 'name', fieldLabel: '名称', fieldType: 'string', sortOrder: 2 },
      { fieldKey: 'value', fieldLabel: '数值', fieldType: 'number', sortOrder: 3 },
      { fieldKey: 'region', fieldLabel: '区域', fieldType: 'string', sortOrder: 4 },
    ]
    const { root, updates } = renderProperty('barChart', {
      chartOption: option(), chartDataSource: 'goodsDetails', chartCategoryField: 'name',
      chartValueFields: ['value'], chartSeriesField: 'region',
    }, [{ goodsDetails: [{ name: 'A', value: 1, region: '东区' }] }], fields, apply)
    const pickers = [...root.querySelectorAll<HTMLButtonElement>('.echarts-field-picker')]
    expect(pickers).toHaveLength(4)
    pickers[0]!.click()
    expect(requests[0]!.target).toMatchObject({
      targetPath: 'options.chartDataSource', binding: 'goodsDetails', fieldOnly: true,
    })
    expect(requests[0]!.target.fields?.map(field => field.fieldKey)).toEqual(['goodsDetails'])
    requests[0]!.apply({ formatter: '{goodsDetails}', binding: 'goodsDetails', title: '货物明细' })
    expect(updates.at(-1)?.chartDataSource).toBe('goodsDetails')

    pickers[1]!.click()
    expect(requests[1]!.target.fields?.map(field => field.fieldKey)).toEqual(['name', 'value', 'region'])
    requests[1]!.apply({ formatter: '{name}', binding: 'name', title: '名称' })
    expect(updates.at(-1)?.chartCategoryField).toBe('name')

    pickers[2]!.click()
    requests[2]!.apply({ formatter: '{value}', binding: 'value', title: '数值' })
    expect(updates.at(-1)?.chartValueFields).toEqual(['value'])

    pickers[3]!.click()
    requests[3]!.apply({ formatter: '{region}', binding: 'region', title: '区域' })
    expect(updates.at(-1)?.chartSeriesField).toBe('region')
  })

  it('数据源候选只来自 fields 的列表字段，不混入 demo 数组键', () => {
    const { requests, apply } = capture()
    const { root } = renderProperty('barChart', {
      chartOption: option(), chartDataSource: 'goodsDetails',
    }, [{ goods: [{ name: 'demo' }] }], [
      { fieldKey: 'goodsDetails', fieldLabel: '货物明细', fieldType: 'list', sortOrder: 1 },
    ], apply)
    root.querySelector<HTMLButtonElement>('.echarts-field-picker')!.click()
    expect(requests[0]!.target.fields?.map(field => field.fieldKey)).toEqual(['goodsDetails'])
  })

  it('宿主未提供 openExpression 时明确报错', () => {
    const ui = getElementUI('barChart')!
    expect(() => ui.renderProperty!({
      element: makeElement('barChart', { chartOption: option() }),
      data: chartData,
      fields: [],
      update: () => {},
      repaint: () => {},
    } as any)).toThrow(/openExpression/)
  })

  it('历史值不在 fields 时仍在按钮上显示裸 key', () => {
    const { root } = renderProperty('barChart', {
      chartOption: option(), chartDataSource: 'legacySource',
    }, chartData, [])
    expect(root.querySelector<HTMLElement>('.echarts-field-current')?.textContent).toBe('legacySource')
  })

  it('绑定数据源后行字段优先取带前缀的字段', () => {
    const { requests, apply } = capture()
    const { root } = renderProperty('barChart', {
      chartOption: option(), chartDataSource: 'goods', chartCategoryField: 'name',
    }, chartData, [
      { fieldKey: 'goods', fieldLabel: '商品', fieldType: 'list', sortOrder: 1 },
      { fieldKey: 'goods.name', fieldLabel: '商品名', fieldType: 'string', sortOrder: 2 },
      { fieldKey: 'other.name', fieldLabel: '其他名', fieldType: 'string', sortOrder: 3 },
    ], apply)
    const pickers = [...root.querySelectorAll<HTMLButtonElement>('.echarts-field-picker')]
    pickers[1]!.click()
    expect(requests[0]!.target.fields?.map(field => field.fieldKey)).toEqual(['goods.name'])
  })

  it('数据源保留自动模式，可清空为顶层第一个数组', () => {
    const { root, updates } = renderProperty('barChart', {
      chartOption: option(), chartDataSource: 'goodsDetails',
    }, [{ goodsDetails: [] }], [], () => {})
    const auto = root.querySelector<HTMLButtonElement>('.echarts-auto-source')!
    expect(auto).toBeTruthy()
    auto.click()
    expect(updates.at(-1)?.chartDataSource).toBe('')
  })
})

describe('数据标签总开关的可见性', () => {
  it('标签关闭时总开关仍位于 summary 中（不被 details 折叠隐藏）', () => {
    const { root } = renderProperty('barChart', { chartOption: createDefaultChartOption('barChart') })
    const group = root.querySelector('.echarts-label-group') as HTMLDetailsElement
    const toggle = [...root.querySelectorAll('.pd-field')].find(
      item => item.querySelector('.pd-label')?.textContent?.trim() === '显示数据标签',
    )!
    expect(group).not.toBeNull()
    expect(group.querySelector('summary')?.contains(toggle)).toBe(true)
  })
})
