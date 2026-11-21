// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { resetLocale, setLocale, t } from '@worm-print-platform/core/i18n'
import { CHART_ELEMENT_UI, installChartCommonUI, uninstallChartCommonUI } from '../ui.js'
import { CHART_KIND_DEFINITIONS, CHART_KINDS } from '../kinds.js'
import { LABEL_POSITIONS, LABEL_PRESETS } from '../label.js'
import { CHART_PLUGIN } from '../plugin.js'
import { getElementUI } from '@worm-print-platform/plugin-kit'
import type { RuntimeElement } from '@worm-print-platform/core/designer'

afterEach(() => {
  uninstallChartCommonUI()
  setLocale('zh-CN')
  installChartCommonUI()
})

describe('echarts 插件语言包', () => {
  it('注册了 id 与双语包，键集合一致且前缀合规', () => {
    expect(CHART_ELEMENT_UI.i18nId).toBe('echarts')
    expect(CHART_ELEMENT_UI.locales).toHaveProperty('zh-CN')
    expect(CHART_ELEMENT_UI.locales).toHaveProperty('en-US')
    expect(CHART_ELEMENT_UI.locales).toHaveProperty('th-TH')
    const zhKeys = Object.keys(CHART_ELEMENT_UI.locales!['zh-CN']!)
    const enKeys = Object.keys(CHART_ELEMENT_UI.locales!['en-US']!)
    const thKeys = Object.keys(CHART_ELEMENT_UI.locales!['th-TH']!)
    expect(zhKeys.sort()).toEqual(enKeys.sort())
    expect(zhKeys.sort()).toEqual(thKeys.sort())
    expect(zhKeys.every(k => k.startsWith('echarts.'))).toBe(true)
  })

  it('切泰语后 engine 能解析插件键', () => {
    const firstKey = Object.keys(CHART_ELEMENT_UI.locales!['en-US']!)[0]!
    setLocale('th-TH')
    expect(t(firstKey)).toBe(CHART_ELEMENT_UI.locales!['th-TH']![firstKey])
  })

  it('标签预设与位置选项按语言取词', () => {
    setLocale('en-US')
    expect(t(LABEL_PRESETS[0]!.labelKey!)).toBe('Value')
    expect(t(LABEL_POSITIONS.bar[0]!.labelKey!)).toBe('Top')
    setLocale('th-TH')
    expect(t(LABEL_PRESETS[0]!.labelKey!)).not.toBe('数值')
    setLocale('zh-CN')
    expect(t(LABEL_PRESETS[0]!.labelKey!)).toBe('数值')
  })

  it('常量保留中文 label 源字段', () => {
    expect(LABEL_PRESETS[0]!.label).toBe('数值')
    expect(LABEL_POSITIONS.bar[0]!.label).toBe('顶部')
  })

  it('图表种类 label 随 locale 切换', () => {
    setLocale('zh-CN'); expect(CHART_PLUGIN.kinds[0]!.label).toBe('柱状图')
    setLocale('en-US'); expect(CHART_PLUGIN.kinds[0]!.label).toBe('Bar chart')
    setLocale('zh-CN')
  })

  it('notes 三语种齐全且随 locale 切换', () => {
    for (const loc of ['zh-CN', 'en-US', 'th-TH']) {
      setLocale(loc)
      expect(CHART_PLUGIN.kinds.every(k => k.notes.length > 0 && !/^echarts\./.test(k.notes))).toBe(true)
    }
    setLocale('en-US'); const en = CHART_PLUGIN.kinds[0]!.notes
    setLocale('zh-CN'); const zh = CHART_PLUGIN.kinds[0]!.notes
    expect(en).not.toBe(zh)
    setLocale('zh-CN')
  })

  it('十类图表 id/type 不变，labelKey 指向语言包', () => {
    expect(CHART_KIND_DEFINITIONS).toHaveLength(10)
    expect(CHART_KINDS).toHaveLength(10)
    for (const def of CHART_KIND_DEFINITIONS) {
      expect((def as unknown as { labelKey?: string }).labelKey).toMatch(/^echarts\./)
    }
  })

  it('属性面板提示文案不显示原始 key（模块加载期求值缺陷）', () => {
    setLocale('zh-CN')
    const ui = getElementUI('barChart')!
    const element = {
      id: 'e1', type: 'barChart',
      options: { left: 0, top: 0, width: 100, height: 60, chartOption: {} },
    } as unknown as RuntimeElement
    const result = ui.renderProperty!({
      element,
      data: [{ name: 'x', value: 1 }],
      fields: [],
      update: () => {},
      repaint: () => {},
    })
    const node = typeof result === 'object' && result !== null && 'node' in result ? result.node : result
    const host = document.createElement('div')
    if (typeof node === 'string') host.innerHTML = node
    else host.appendChild(node as Node)
    const hint = [...host.querySelectorAll('.pd-hint')].map(n => n.textContent ?? '').join(' ')
    expect(hint).not.toContain('echarts.ui.k')
    expect(hint.length).toBeGreaterThan(0)
  })

  it('切英文后 engine 能解析插件键，切回中文恢复', () => {
    const firstKey = Object.keys(CHART_ELEMENT_UI.locales!['zh-CN']!)[0]!
    const zhVal = CHART_ELEMENT_UI.locales!['zh-CN']![firstKey]
    setLocale('zh-CN')
    expect(t(firstKey)).toBe(zhVal)
    setLocale('en-US')
    expect(t(firstKey)).toBe(CHART_ELEMENT_UI.locales!['en-US']![firstKey])
    expect(getElementUI('barChart')).toBeTruthy()
  })
})
