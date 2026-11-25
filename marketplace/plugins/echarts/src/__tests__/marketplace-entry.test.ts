import { afterEach, describe, expect, it, vi } from 'vitest'
import { getElementPluginById } from '@worm-print-platform/core/designer'
import { resetLocale, setLocale } from '@worm-print-platform/core/i18n'
import { getElementUI } from '@worm-print-platform/plugin-kit'
import { CHART_PLUGIN_ID } from '../constants.js'

afterEach(() => {
  resetLocale()
  vi.restoreAllMocks()
})

describe('echarts 市场入口', () => {
  it('语言资源注册前导入无缺键警告，label 与 group 随 locale 切换', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await import('../marketplace.js')

    expect(warn.mock.calls.filter(call => String(call[0]).includes('[i18n] missing key'))).toEqual([])
    const plugin = getElementPluginById(CHART_PLUGIN_ID)
    const bar = plugin?.kinds.find(kind => kind.type === 'barChart')
    const ui = getElementUI('barChart')
    expect(bar).toBeDefined()
    expect(ui).toBeDefined()

    setLocale('zh-CN')
    expect(bar?.optionMeta?.chartOption?.label).toBe('图表 option')
    expect(ui?.group).toBe('图表')
    setLocale('en-US')
    expect(bar?.optionMeta?.chartOption?.label).toBe('Chart option')
    expect(ui?.group).toBe('Chart')
    setLocale('th-TH')
    expect(bar?.optionMeta?.chartOption?.label).toBe('ตัวเลือกแผนภูมิ')
    expect(ui?.group).toBe('แผนภูมิ')
  })
})
