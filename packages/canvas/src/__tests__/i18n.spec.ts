// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { setLocale, t } from '@worm-print-platform/core/i18n'
import { definePrintDesigner, type PrintDesignerElement } from '../index.js'
import { PRINT_DESIGNER_ATTRIBUTES, PRINT_DESIGNER_METHODS, PRINT_DESIGNER_PROPERTY_NAMES, PRINT_DESIGNER_CONTRACT_VERSION } from '../host-contract.js'

function frame() {
  return new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
}

async function mount(setup?: (el: PrintDesignerElement) => void) {
  definePrintDesigner()
  const host = document.createElement('div')
  document.body.replaceChildren(host)
  const el = document.createElement('print-designer') as PrintDesignerElement
  setup?.(el)
  host.appendChild(el)
  await frame()
  return el
}

afterEach(() => {
  // happy-dom 的 navigator.language 可能是 en-US，必须显式恢复中文，避免污染同进程其他测试文件
  setLocale('zh-CN')
  document.body.replaceChildren()
})

describe('设计器语言通道', () => {
  it('lang attribute 生效并可用 setLocale 切换', async () => {
    const el = await mount(node => node.setAttribute('lang', 'en-US'))
    expect(el.lang).toBe('en-US')
    el.setLocale('zh-CN')
    expect(el.lang).toBe('zh-CN')
  })

  it('messages 注入的用户包覆盖内置译文', async () => {
    const el = await mount(node => node.setAttribute('lang', 'en-US'))
    el.messages = { 'toolbar.save': 'Store' }
    expect(t('toolbar.save')).toBe('Store')
  })

  it('未设 lang 的实例跟随全局 locale，显式 lang 的实例不受影响', async () => {
    const auto = await mount()
    const fixed = await mount(node => node.setAttribute('lang', 'zh-CN'))
    setLocale('en-US')
    expect(auto.lang).toBe('en-US')
    expect(fixed.lang).toBe('zh-CN')
  })
})

describe('宿主契约版本', () => {
  it('已升级为 1.4.0 并含语言通道', () => {
    expect(PRINT_DESIGNER_CONTRACT_VERSION).toBe('1.4.0')
    expect(PRINT_DESIGNER_ATTRIBUTES).toContain('lang')
    expect(PRINT_DESIGNER_PROPERTY_NAMES).toEqual(expect.arrayContaining(['lang', 'messages']))
    expect(PRINT_DESIGNER_METHODS).toContain('setLocale')
  })
})
