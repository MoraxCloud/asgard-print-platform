// @vitest-environment happy-dom
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createTranslator, resetLocale, setLocale, t } from '@worm-print-platform/core/i18n'
import zh from '../i18n/zh-CN.json'
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
  it('语言资源含 zh-CN 且键以 echarts. 开头', () => {
    expect(Object.keys(zh.echarts).length).toBeGreaterThan(100)
    for (const key of Object.keys(zh.echarts)) expect(key.startsWith('echarts.')).toBe(true)
  })

  it('源码引用的语义键在三语资源中齐全（含中文配置）', () => {
    const pluginDir = process.cwd()
    const sources = ['src/ui.ts', 'src/constants.ts', 'src/label.ts', 'src/kinds.ts', 'src/plugin.ts']
      .map(rel => readFileSync(resolve(pluginDir, rel), 'utf8')).join('\n')
    const keys = new Set<string>()
    for (const m of sources.matchAll(/\bt\('([^']+)'\)/g)) keys.add(m[1])
    for (const m of sources.matchAll(/labelKey:\s*'([^']+)'/g)) keys.add(m[1])
    for (const locale of ['zh-CN', 'en-US', 'th-TH']) {
      const messages = JSON.parse(readFileSync(resolve(pluginDir, `src/i18n/${locale}.json`), 'utf8')).echarts
      for (const key of keys) expect(messages[key], `${locale} 缺少 ${key}`).toBeTruthy()
    }
  })

  it('主包与兼容包都声明 wormPrint.i18n', () => {
    const root = resolve(process.cwd(), '../../..')
    for (const rel of ['marketplace/plugins/echarts/package.json', 'packages/echarts/package.json']) {
      const pkg = JSON.parse(readFileSync(resolve(root, rel), 'utf8'))
      expect(pkg.wormPrint.i18n).toEqual({ dir: 'dist/i18n', base: 'zh-CN' })
    }
  })

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
    // 所有 key 必须语义化：不允许纯数字编号后缀
    expect(zhKeys.filter(k => /\.k\d+$/.test(k))).toEqual([])
    // 151 键数量不变（一一对应，仅重命名）
    expect(zhKeys).toHaveLength(151)
    // 关键语义 key 存在（对齐百度 ECharts 的 series.typeNames 等命名）
    expect(zhKeys).toContain('echarts.series.typeNames.bar')
    expect(zhKeys).toContain('echarts.series.typeNames.gauge')
    expect(zhKeys).toContain('echarts.notes.bar')
    expect(zhKeys).toContain('echarts.label.formatter.value')
    expect(zhKeys).toContain('echarts.label.position.bar.top')
    expect(zhKeys).toContain('echarts.meta.chartOption')
    expect(zhKeys).toContain('echarts.panel.hint.dataBinding')
    expect(zhKeys).toContain('echarts.palette.default')
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
      openExpression: () => {},
    })
    const node = typeof result === 'object' && result !== null && 'node' in result ? result.node : result
    const host = document.createElement('div')
    if (typeof node === 'string') host.innerHTML = node
    else host.appendChild(node as Node)
    const hint = [...host.querySelectorAll('.pd-hint')].map(n => n.textContent ?? '').join(' ')
    expect(hint).not.toContain('echarts.ui.k')
    expect(hint.length).toBeGreaterThan(0)
  })

  it('属性面板按宿主传入的 t 取词，不冻结在全局 locale', () => {
    // 全局仍是中文，模拟实例 lang=en-US 而全局未变的真实场景
    setLocale('zh-CN')
    const ui = getElementUI('barChart')!
    const element = {
      id: 'e1', type: 'barChart',
      printElementType: { type: 'barChart', title: '柱状图' },
      options: { left: 0, top: 0, width: 100, height: 60, chartOption: {} },
    } as unknown as RuntimeElement
    const result = ui.renderProperty!({
      element,
      data: [{ name: 'x', value: 1 }],
      fields: [],
      update: () => {},
      repaint: () => {},
      openExpression: () => {},
      t: createTranslator('en-US'),
    })
    const node = typeof result === 'object' && result !== null && 'node' in result ? result.node : result
    const host = document.createElement('div')
    if (typeof node === 'string') host.innerHTML = node
    else host.appendChild(node as Node)
    const text = host.textContent ?? ''
    expect(text).toContain('Data source')
    expect(text).toContain('Value fields')
    expect(text).not.toMatch(/[\u3400-\u9fff]/)
  })

  it('属性面板内颜色选择器按实例 locale 取词', () => {
    setLocale('zh-CN')
    const ui = getElementUI('barChart')!
    const element = {
      id: 'e1', type: 'barChart',
      printElementType: { type: 'barChart', title: '柱状图' },
      options: { left: 0, top: 0, width: 100, height: 60, chartOption: {} },
    } as unknown as RuntimeElement
    const result = ui.renderProperty!({
      element, data: [{ name: 'x', value: 1 }], fields: [],
      update: () => {}, repaint: () => {}, openExpression: () => {}, t: createTranslator('en-US'),
    })
    const node = typeof result === 'object' && result !== null && 'node' in result ? result.node : result
    const host = document.createElement('div')
    document.body.appendChild(host)
    try {
      if (typeof node === 'string') host.innerHTML = node
      else host.appendChild(node as Node)
      const trigger = host.querySelector<HTMLElement>('.preset-color-trigger')
      expect(trigger).toBeTruthy()
      trigger!.click()
      const panel = document.body.querySelector('.preset-color-panel')
      expect(panel).toBeTruthy()
      expect(panel!.getAttribute('aria-label')).toBe('Pick a color')
      expect(panel!.textContent).toContain('Common colors')
    } finally {
      host.remove()
    }
  })

  it('十类图表属性面板在实例 locale 下均无中文残留', () => {
    setLocale('zh-CN')
    const ui = getElementUI('barChart')!
    const en = createTranslator('en-US')
    for (const def of CHART_KIND_DEFINITIONS) {
      const element = {
        id: 'e1', type: def.type,
        printElementType: { type: def.type, title: def.label },
        options: { left: 0, top: 0, width: 100, height: 60, chartOption: {} },
      } as unknown as RuntimeElement
      const result = ui.renderProperty!({
        element, data: [{ name: 'x', value: 1 }], fields: [],
        update: () => {}, repaint: () => {}, openExpression: () => {}, t: en,
      })
      const node = typeof result === 'object' && result !== null && 'node' in result ? result.node : result
      const host = document.createElement('div')
      if (typeof node === 'string') host.innerHTML = node
      else host.appendChild(node as Node)
      expect(host.textContent ?? '', def.type).not.toMatch(/[\u3400-\u9fff]/)
    }
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
