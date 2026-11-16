// @vitest-environment happy-dom
// 中文 key 的表达式写法引导：双击含中文字段时即时提示 {中文字段名}，
// 英文字段/手动编辑清空提示；帮助信息区常驻中文 key 写法说明。
import { describe, it, expect } from 'vitest'
import type { PrintBusinessField } from '@worm-print-platform/core/designer'
import { render } from '../../core/h'
import { renderExpressionEditor } from '../expression-editor'

const fields: PrintBusinessField[] = [
  { id: '1', fieldKey: '姓名', fieldLabel: '客户姓名', fieldType: 'string', sortOrder: 1 },
  { id: '2', fieldKey: 'supplier.名称', fieldLabel: '供应商名称', fieldType: 'string', sortOrder: 2 },
  { id: '3', fieldKey: 'amount', fieldLabel: '金额', fieldType: 'number', sortOrder: 3 },
]

function mountEditor() {
  const host = document.createElement('div')
  document.body.replaceChildren(host)
  render(renderExpressionEditor({
    fields,
    onClose: () => {},
    onApply: () => {},
  }, { elementId: 'el-1', targetPath: 'options.formatter', value: '' }), host)
  return host
}

/** 按 fieldKey 定位字段行并双击（含中文 key 由 fieldKey 精确匹配，避免重名） */
function dblclickField(host: HTMLElement, fieldKey: string, mods: { ctrlKey?: boolean } = {}) {
  const row = Array.from(host.querySelectorAll<HTMLElement>('.ee-field-item'))
    .find(r => r.querySelector('.ee-item-key')?.textContent === fieldKey)
  if (!row) throw new Error(`找不到字段行 ${fieldKey}`)
  row.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, ...mods }))
}

const textarea = (host: HTMLElement) => host.querySelector<HTMLTextAreaElement>('.ee-textarea')!
const hint = (host: HTMLElement) => host.querySelector<HTMLElement>('.ee-key-hint')!

describe('表达式弹窗：中文 key 写法引导（common）', () => {
  it('双击中文字段插入 {中文key} 并提示正确写法', () => {
    const host = mountEditor()
    expect(hint(host).style.display).toBe('none')

    dblclickField(host, '姓名')

    expect(textarea(host).value).toBe('{姓名}')
    expect(hint(host).style.display).not.toBe('none')
    expect(hint(host).textContent).toContain('{姓名}')
    expect(hint(host).textContent).toContain('无需 data')
  })

  it('双击带点中文 key 提示完整路径写法', () => {
    const host = mountEditor()
    dblclickField(host, 'supplier.名称')
    expect(textarea(host).value).toBe('{supplier.名称}')
    expect(hint(host).textContent).toContain('{supplier.名称}')
  })

  it('双击英文字段清空提示（回归）', () => {
    const host = mountEditor()
    dblclickField(host, '姓名')
    expect(hint(host).style.display).not.toBe('none')

    dblclickField(host, 'amount')

    // 双击是光标处追加，不替换已有内容
    expect(textarea(host).value).toBe('{姓名}{amount}')
    expect(hint(host).style.display).toBe('none')
  })

  it('函数参数内双击中文字段仍插裸 key，并提示', () => {
    const host = mountEditor()
    const ta = textarea(host)
    ta.value = '{SUM('
    ta.dispatchEvent(new Event('input', { bubbles: true }))
    ta.selectionStart = ta.selectionEnd = 5

    dblclickField(host, '姓名')

    expect(textarea(host).value).toBe('{SUM(姓名')
    expect(hint(host).style.display).not.toBe('none')
  })

  it('手动编辑表达式时清空提示', () => {
    const host = mountEditor()
    dblclickField(host, '姓名')
    expect(hint(host).style.display).not.toBe('none')

    const ta = textarea(host)
    ta.value = '{姓名}固定文本'
    ta.dispatchEvent(new Event('input', { bubbles: true }))

    expect(hint(host).style.display).toBe('none')
  })

  it('帮助信息区常驻中文 key 写法说明', () => {
    const host = mountEditor()
    const help = host.querySelector('.ee-help-card.ee-help-field')?.textContent ?? ''
    expect(help).toContain('中文 key 直接写 {字段名}')
  })
})
