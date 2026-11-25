import { afterEach, describe, expect, it } from 'vitest'
import { clearLocales, getResources, resetLocale, setLocale, t } from '../index.js'

afterEach(() => { resetLocale(); clearLocales() })

describe('内置命名空间', () => {
  it('三语都含 constants 与 propertyTips', () => {
    for (const lng of ['zh-CN', 'en-US', 'th-TH']) {
      const res = getResources(lng)
      expect(res.constants['constants.borderStyle.none']).toBeTruthy()
      expect(res.propertyTips['propertyTips.ap-img-fit']).toBeTruthy()
    }
  })

  it('含点语义键可命中', () => {
    setLocale('en-US')
    expect(t('constants.borderStyle.none')).toBe('None')
  })

  it('clearLocales 不清内置命名空间', () => {
    clearLocales()
    expect(getResources('zh-CN').constants).toBeTruthy()
    expect(getResources('zh-CN').propertyTips).toBeTruthy()
  })
})
