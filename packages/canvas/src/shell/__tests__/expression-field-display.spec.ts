// @vitest-environment happy-dom
// 表达式弹窗字段行的宿主显示模式：label / key / both（默认 both）。
// 变量 / 函数页签、复制按钮、分组名与插入语义不受影响。
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'
import type { PrintBusinessField } from '@worm-print-platform/core/designer'
import { render } from '../../core/h'
import { renderExpressionEditor, normalizeFieldDisplay } from '../expression-editor'
import type { FieldDisplayMode } from '../expression-editor'

const fields: PrintBusinessField[] = [
  { id: '0', fieldKey: 'customer', fieldLabel: '客户信息', fieldType: 'string', sortOrder: 0 },
  { id: '1', fieldKey: 'customer.name', fieldLabel: '客户名称', fieldType: 'string', sortOrder: 1 },
  { id: '2', fieldKey: 'order', fieldLabel: '订单信息', fieldType: 'string', sortOrder: 2 },
  { id: '3', fieldKey: 'order.remark', fieldLabel: '', fieldType: 'string', sortOrder: 3 },
]

function mount(fieldDisplay?: FieldDisplayMode) {
  const host = document.createElement('div')
  document.body.replaceChildren(host)
  render(renderExpressionEditor({
    fields,
    ...(fieldDisplay === undefined ? {} : { fieldDisplay }),
    onClose: () => {},
    onApply: () => {},
  }, { elementId: 'el-1', targetPath: 'options.formatter', value: '' }), host)
  return host
}

const rows = (host: HTMLElement) => Array.from(host.querySelectorAll<HTMLElement>('.ee-field-item'))

/** 把 core 共享样式源注入文档，断言真实 CSS 规则的计算结果，而非源码文本 */
function injectSharedStyles() {
  const css = readFileSync(resolve(process.cwd(), '../core/src/styles/designer.css'), 'utf8')
  const style = document.createElement('style')
  style.textContent = css
  document.head.appendChild(style)
}

describe('表达式弹窗字段显示模式', () => {
  it('归一化：大小写/空格容错，非法值与空值回退 both', () => {
    expect(normalizeFieldDisplay(' KEY ')).toBe('key')
    expect(normalizeFieldDisplay(' LaBeL ')).toBe('label')
    expect(normalizeFieldDisplay('both')).toBe('both')
    expect(normalizeFieldDisplay('bogus')).toBe('both')
    expect(normalizeFieldDisplay(null)).toBe('both')
    expect(normalizeFieldDisplay(undefined)).toBe('both')
  })

  it('缺省同时显示中文名与 key，key 不带修饰类', () => {
    const row = rows(mount())[0]!
    expect(row.querySelector('.ee-item-label')?.textContent).toBe('客户名称')
    const key = row.querySelector('.ee-item-key')
    expect(key?.textContent).toBe('customer.name')
    expect(key?.classList.contains('is-primary')).toBe(false)
  })

  it('label 模式只显示中文名，分组名常驻，空中文名回落 key', () => {
    const host = mount('label')
    const row = rows(host)[0]!
    expect(row.querySelector('.ee-item-label')?.textContent).toBe('客户名称')
    expect(row.querySelector('.ee-item-key')).toBeNull()
    expect(host.querySelector('.ee-field-group')?.textContent).toContain('客户信息')
    expect(rows(host)[1]!.querySelector('.ee-item-label')?.textContent).toBe('order.remark')
  })

  it('key 模式只显示裸 key（无括号），空中文名字段同样回落 key', () => {
    const host = mount('key')
    const row = rows(host)[0]!
    expect(row.querySelector('.ee-item-label')).toBeNull()
    const key = row.querySelector('.ee-item-key.is-primary')
    expect(key?.textContent).toBe('customer.name')
    expect(key?.textContent).not.toContain('(')
    expect(rows(host)[1]!.querySelector('.ee-item-key.is-primary')?.textContent).toBe('order.remark')
  })

  it('key 模式不影响变量页签的两行结构', () => {
    const host = mount('key')
    const tabs = Array.from(host.querySelectorAll<HTMLElement>('.ee-nav-tab'))
    tabs[1]!.click()
    const item = host.querySelector('.ee-list-item')!
    expect(item.querySelector('.ee-item-label')).not.toBeNull()
    expect(item.querySelector('.ee-item-key')).not.toBeNull()
  })

  it('key 模式复制按钮提示仍指向中文名', () => {
    const btn = mount('key').querySelector('.ee-copy-btn')!
    expect(btn.getAttribute('data-tip')).toBe('复制字段名「客户名称」')
  })

  it('key 模式的字号与颜色套用中文名样式', () => {
    injectSharedStyles()
    const wrap = document.createElement('div')
    wrap.className = 'ee-field-info'
    const key = document.createElement('span')
    key.className = 'ee-item-key is-primary'
    wrap.appendChild(key)
    document.body.appendChild(wrap)
    const style = getComputedStyle(key)
    expect(style.fontSize).toBe('12px')
    expect(style.color).toBe('#303133')
  })
})
