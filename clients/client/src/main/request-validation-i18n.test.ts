import { afterEach, describe, expect, it } from 'vitest'
import { resetLocale, setLocale } from '@worm-print-platform/core/i18n'
import { parsePrintSubmit } from './request-validation.js'

afterEach(() => resetLocale())

function errOf(raw: unknown): string {
  try {
    parsePrintSubmit(raw)
    return ''
  } catch (err) {
    return (err as Error).message
  }
}

describe('请求校验诊断的 locale', () => {
  it('默认中文逐字不变', () => {
    expect(errOf({ templateJson: {}, printData: [] })).toContain('批量打印数据必须是非空对象数组')
  })

  it('切英文后诊断英文化', () => {
    setLocale('en-US')
    expect(errOf({ templateJson: {}, printData: [] })).toContain('Batch print data must be a non-empty array of objects')
  })
})
