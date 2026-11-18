// 主题参数通道：预设 / 覆盖的优先级，以及「画布保持现状」的硬约束。
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PRINT_DESIGNER_TAG } from '../host-contract'
import { definePrintDesigner } from '../print-designer'
import type { PrintDesignerElement } from '../print-designer'
import { CANVAS_UNCHANGED_TOKENS, DARK_THEME_TOKENS } from '../theme-tokens'

definePrintDesigner()

function shellOf(el: PrintDesignerElement): HTMLElement {
  return el.shadowRoot!.querySelector<HTMLElement>('.designer-container')!
}

describe('主题参数：预设与覆盖优先级', () => {
  const created: PrintDesignerElement[] = []
  function make(): PrintDesignerElement {
    const el = document.createElement(PRINT_DESIGNER_TAG) as PrintDesignerElement
    document.body.appendChild(el)
    created.push(el)
    return el
  }
  afterEach(() => {
    while (created.length) created.pop()!.remove()
    vi.unstubAllGlobals()
  })

  it('theme=dark 把暗色预设写到内部容器的行内变量', () => {
    const el = make()
    el.theme = 'dark'
    const shell = shellOf(el)
    expect(shell.style.getPropertyValue('--pd-bg')).toBe(DARK_THEME_TOKENS['--pd-bg'])
    expect(shell.style.getPropertyValue('--pd-text')).toBe(DARK_THEME_TOKENS['--pd-text'])
  })

  it('暗色预设不触碰画布令牌：纸张、画布背景、标尺、手柄保持原值', () => {
    const el = make()
    el.theme = 'dark'
    const shell = shellOf(el)
    for (const token of CANVAS_UNCHANGED_TOKENS) {
      expect(shell.style.getPropertyValue(token), `${token} 不应被主题参数写入`).toBe('')
    }
  })

  it('theme-config 覆盖暗色预设；宿主可显式覆盖画布外围背景', () => {
    const el = make()
    el.theme = 'dark'
    el.themeConfig = { overrides: { '--pd-bg': '#010203', '--pd-canvas-bg': '#aaaaaa' } }
    const shell = shellOf(el)
    expect(shell.style.getPropertyValue('--pd-bg')).toBe('#010203')
    expect(shell.style.getPropertyValue('--pd-canvas-bg')).toBe('#aaaaaa')
  })

  it('无 themeConfig 时 theme=light 清空暗色预设，回落浅色现状', () => {
    const el = make()
    el.theme = 'dark'
    el.theme = 'light'
    const shell = shellOf(el)
    expect(shell.style.getPropertyValue('--pd-bg')).toBe('')
    expect(shell.style.getPropertyValue('--pd-text')).toBe('')
  })

  it('theme=light 时 themeConfig 仍优先（参数高于预设）', () => {
    const el = make()
    el.theme = 'dark'
    el.themeConfig = { overrides: { '--pd-bg': '#010203' } }
    el.theme = 'light'
    expect(shellOf(el).style.getPropertyValue('--pd-bg')).toBe('#010203')
  })

  it('重绘只清子节点，不冲掉主题行内变量', async () => {
    const el = make()
    el.theme = 'dark'
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
    el.fields = []
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
    expect(shellOf(el).style.getPropertyValue('--pd-bg')).toBe(DARK_THEME_TOKENS['--pd-bg'])
  })

  it('theme-config attribute 传参生效；非法 JSON 被忽略且不抛错', () => {
    const el = make()
    el.setAttribute('theme-config', JSON.stringify({ overrides: { '--pd-bg': '#123456' } }))
    expect(shellOf(el).style.getPropertyValue('--pd-bg')).toBe('#123456')
    expect(() => el.setAttribute('theme-config', '{bad json')).not.toThrow()
    expect(shellOf(el).style.getPropertyValue('--pd-bg')).toBe('')
  })

  it('移除 theme-config 后回落到当前预设', () => {
    const el = make()
    el.theme = 'dark'
    el.themeConfig = { overrides: { '--pd-bg': '#123456' } }
    el.removeAttribute('theme-config')
    expect(shellOf(el).style.getPropertyValue('--pd-bg')).toBe(DARK_THEME_TOKENS['--pd-bg'])
  })

  it('auto 跟随系统深浅色，卸载时成对摘除 matchMedia 监听', () => {
    const add = vi.fn()
    const remove = vi.fn()
    const mql = { matches: true, addEventListener: add, removeEventListener: remove } as unknown as MediaQueryList
    vi.stubGlobal('matchMedia', vi.fn(() => mql))
    const el = make()
    el.theme = 'auto'
    expect(shellOf(el).style.getPropertyValue('--pd-bg')).toBe(DARK_THEME_TOKENS['--pd-bg'])
    expect(add).toHaveBeenCalled()
    el.remove()
    expect(remove).toHaveBeenCalled()
  })
})
