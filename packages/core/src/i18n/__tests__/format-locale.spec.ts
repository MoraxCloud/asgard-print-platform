import { afterEach, describe, expect, it } from 'vitest'
import { generateHtml } from '../../render/html-generator.js'
import { EXTENDED_FUNCTIONS } from '../../designer/utils/expression-eval.js'
import { toUpperCaseAmount } from '../../functions/format.js'
import { resetLocale, setLocale } from '../index.js'

afterEach(() => resetLocale())

const template = {
  paperSize: 'A4',
  orientation: 'portrait',
  margins: { top: 10, right: 10, bottom: 10, left: 10 },
  header: { height: 0, elements: [] },
  footer: { height: 0, elements: [] },
  elements: [],
} as never

describe('documentLang', () => {
  it('测量趟与最终趟都支持 documentLang，默认仍为 zh-CN', () => {
    expect(generateHtml(template, [], undefined, { isMeasurementPass: true })).toContain('<html lang="zh-CN">')
    expect(generateHtml(template, [], undefined, {
      isMeasurementPass: true,
      documentLang: 'en-US',
    } as never)).toContain('<html lang="en-US">')
    expect(generateHtml(template, [], {})).toContain('<html lang="zh-CN">')
    expect(generateHtml(template, [], {}, { documentLang: 'en-US' } as never)).toContain('<html lang="en-US">')
  })
})

describe('FORMAT 跟随 locale', () => {
  it('保留两位小数，千分位按 locale 变化', () => {
    resetLocale()
    expect(EXTENDED_FUNCTIONS.FORMAT(1234.5)).toBe('1,234.50')
    setLocale('de-DE')
    expect(EXTENDED_FUNCTIONS.FORMAT(1234.5)).toBe('1.234,50')
  })

  it('大写金额仍为中文且不受 locale 影响', () => {
    expect(toUpperCaseAmount(1234.56)).toBe('壹仟贰佰叁拾肆元伍角陆分')
    setLocale('de-DE')
    expect(toUpperCaseAmount(1234.56)).toBe('壹仟贰佰叁拾肆元伍角陆分')
  })
})
