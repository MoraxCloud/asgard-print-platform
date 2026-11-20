import { afterEach, describe, expect, it } from 'vitest'
import { resetLocale, setLocale, t } from '@worm-print-platform/core/i18n'
import { CHART_ELEMENT_UI, installChartCommonUI, uninstallChartCommonUI } from '../ui.js'
import { CHART_KIND_DEFINITIONS, CHART_KINDS } from '../kinds.js'
import { getElementUI } from '@worm-print-platform/plugin-kit'

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
    const zhKeys = Object.keys(CHART_ELEMENT_UI.locales!['zh-CN']!)
    const enKeys = Object.keys(CHART_ELEMENT_UI.locales!['en-US']!)
    expect(zhKeys.sort()).toEqual(enKeys.sort())
    expect(zhKeys.every(k => k.startsWith('echarts.'))).toBe(true)
  })

  it('十类图表 id/type 不变，labelKey 指向语言包', () => {
    expect(CHART_KIND_DEFINITIONS).toHaveLength(10)
    expect(CHART_KINDS).toHaveLength(10)
    for (const def of CHART_KIND_DEFINITIONS) {
      expect((def as unknown as { labelKey?: string }).labelKey).toMatch(/^echarts\./)
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
