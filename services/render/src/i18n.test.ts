import { afterEach, describe, expect, it } from 'vitest'
import { resetLocale, setLocale } from '@worm-print-platform/core/i18n'
import { normalizePrintData, MAX_BATCH_COPIES } from '@worm-print-platform/core'

afterEach(() => resetLocale())

describe('打印数据校验诊断的 locale', () => {
  it('默认中文逐字不变', () => {
    expect(() => normalizePrintData([])).toThrow('批量打印数据必须是非空对象数组')
    expect(() => normalizePrintData(new Array(MAX_BATCH_COPIES + 1).fill({}))).toThrow(
      `批量打印最多支持 ${MAX_BATCH_COPIES} 份，当前 ${MAX_BATCH_COPIES + 1} 份`,
    )
  })

  it('切英文后诊断英文化', () => {
    setLocale('en-US')
    expect(() => normalizePrintData([])).toThrow('Batch print data must be a non-empty array of objects')
    expect(() => normalizePrintData(new Array(MAX_BATCH_COPIES + 1).fill({}))).toThrow(/at most/)
  })
})
