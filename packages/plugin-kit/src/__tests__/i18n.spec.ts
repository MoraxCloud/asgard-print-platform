import { afterEach, describe, expect, it, vi } from 'vitest'
import { resetLocale, setLocale, t } from '@worm-print-platform/core/i18n'
import {
  clearElementUIs,
  defineElementUI,
  registerElementUI,
  subscribeElementUIRegistry,
} from '../index.js'

afterEach(() => {
  clearElementUIs()
  resetLocale()
})

describe('插件语言包注册', () => {
  it('注册后按 locale 生效，注销后失效', () => {
    const ui = defineElementUI({
      types: ['foo'],
      renderCanvas: () => '',
      i18nId: 'foo',
      locales: { 'en-US': { 'foo.label': 'Foo' } },
    })
    const off = registerElementUI(ui)
    setLocale('en-US')
    expect(t('foo.label')).toBe('Foo')
    off()
    expect(t('foo.label')).toBe('foo.label')
  })

  it('缺 i18nId 时取 types[0] 作前缀', () => {
    const ui = defineElementUI({
      types: ['foo'],
      renderCanvas: () => '',
      locales: { 'en-US': { 'foo.label': 'Foo' } },
    })
    const off = registerElementUI(ui)
    setLocale('en-US')
    expect(t('foo.label')).toBe('Foo')
    off()
  })

  it('语言包键前缀非法时抛错', () => {
    expect(() => defineElementUI({
      types: ['foo'],
      renderCanvas: () => '',
      locales: { 'en-US': { 'bar.label': 'Bar' } },
    })).toThrow(/foo\./)
  })

  it('注册与注销各通知订阅者一次', () => {
    const listener = vi.fn()
    const offSub = subscribeElementUIRegistry(listener)
    const offUi = registerElementUI(defineElementUI({
      types: ['foo'],
      renderCanvas: () => '',
    }))
    offUi()
    expect(listener).toHaveBeenCalledTimes(2)
    offSub()
  })
})
