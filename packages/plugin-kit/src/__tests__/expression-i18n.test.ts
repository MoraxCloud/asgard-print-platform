// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { resetLocale, setLocale } from '@worm-print-platform/core/i18n'
import { renderExpressionEditor } from '../expression-editor.js'
import { render } from '../dom.js'

afterEach(() => resetLocale())

function renderEditor() {
  const target = { elementId: 'e1', targetPath: 'options.formatter', value: '' }
  const el = renderExpressionEditor({
    fields: [],
    onClose: () => {},
    onApply: () => {},
  }, target)
  const host = document.createElement('div')
  render(el, host)
  return host
}

describe('表达式编辑器国际化', () => {
  it('英文模式下页签与标题为英文', () => {
    setLocale('en-US')
    const host = renderEditor()
    const texts = [...host.querySelectorAll('*')].map(n => n.textContent ?? '').join(' ')
    expect(texts).toContain('Fields')
    expect(texts).toContain('Variables')
    expect(texts).toContain('Functions')
    expect(texts).not.toContain('📁 字段')
  })

  it('中文模式逐字恢复', () => {
    setLocale('zh-CN')
    const host = renderEditor()
    const texts = [...host.querySelectorAll('*')].map(n => n.textContent ?? '').join(' ')
    expect(texts).toContain('字段')
    expect(texts).toContain('变量')
    expect(texts).toContain('函数')
  })
})
