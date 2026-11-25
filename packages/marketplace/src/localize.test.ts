import { describe, expect, it } from 'vitest'
import { localize } from './localize.js'

describe('localize 多语言回退', () => {
  it('字符串原样返回', () => {
    expect(localize('百度图表元素', 'en-US')).toBe('百度图表元素')
  })

  it('精确 locale 未命中时回退语言前缀', () => {
    const text = { 'zh-CN': '百度图表', en: 'ECharts' }
    expect(localize(text, 'en-US')).toBe('ECharts')
  })

  it('目标语言缺失时回退基准语言 zh-CN', () => {
    const text = { 'zh-CN': '百度图表', en: 'ECharts' }
    expect(localize(text, 'fr-FR')).toBe('百度图表')
  })

  it('undefined 返回空串', () => {
    expect(localize(undefined, 'zh-CN')).toBe('')
  })
})
