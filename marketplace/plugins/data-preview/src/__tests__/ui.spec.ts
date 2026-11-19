// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import type { PrintBusinessField } from '@worm-print-platform/core/designer'
import { openDataPreview } from '../ui'

const fields: PrintBusinessField[] = [
  { fieldKey: '系统信息.机构编号', fieldLabel: '机构编号', fieldType: 'string', sortOrder: 2 },
  { fieldKey: '系统信息.患者', fieldLabel: '患者对象', fieldType: 'string', sortOrder: 3 },
  { fieldKey: '系统信息.费用', fieldLabel: '费用数组', fieldType: 'list', sortOrder: 4 },
]

let host: HTMLElement
beforeEach(() => {
  document.body.replaceChildren()
  document.head.querySelectorAll('style[data-plugin-data-preview]').forEach(s => s.remove())
  host = document.createElement('div')
  document.body.appendChild(host)
})

describe('openDataPreview 弹窗', () => {
  it('渲染标题、tab 栏与总览表', () => {
    openDataPreview({
      root: { 机构编号: 'H1', 患者: { 姓名: '张三' } },
      fields, groupKey: '系统信息', title: '系统信息', container: host,
    })
    expect(host.querySelector('.dp-dialog .dp-title')?.textContent).toContain('系统信息')
    const tabs = Array.from(host.querySelectorAll<HTMLElement>('.dp-tab'))
    expect(tabs.map(t => t.textContent)).toEqual(['总览', '患者对象'])
    expect(host.querySelector('.dp-overview-table')).toBeTruthy()
    expect(host.querySelector('.dp-body')?.textContent).toContain('机构编号')
  })

  it('对象子 tab 渲染表单，总览“查看 →”可跳转', () => {
    openDataPreview({
      root: { 机构编号: 'H1', 患者: { 姓名: '张三' } },
      fields, groupKey: '系统信息', container: host,
    })
    host.querySelector<HTMLElement>('.dp-jump')!.click()
    expect(host.querySelector<HTMLElement>('.dp-tab.active')?.textContent).toBe('患者对象')
    const rows = Array.from(host.querySelectorAll<HTMLElement>('.dp-form-table tbody tr'))
    expect(rows.map(r => r.textContent)).toEqual(['姓名张三'])
  })

  it('数组根的总览即表格，不分页', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ 机构编号: `H${i}` }))
    openDataPreview({ root: many, fields, container: host })
    expect(host.querySelectorAll('.dp-data-table tbody tr')).toHaveLength(20)
  })

  it('data + groupKey 取数，root 优先', () => {
    const data = [{ 系统信息: { 机构编号: 'H1' } }]
    openDataPreview({ data, groupKey: '系统信息', fields, container: host })
    expect(host.querySelector('.dp-body')?.textContent).toContain('H1')
    openDataPreview({ data, root: { 机构编号: 'H2' }, fields, container: host })
    expect(host.querySelectorAll('.dp-dialog')).toHaveLength(2)
    expect(host.querySelector('.dp-body')?.textContent).toContain('H1')
  })

  it('关闭按钮移除弹窗，dispose 可多次调用', () => {
    const dispose = openDataPreview({ root: { 机构编号: 'H1' }, container: host })
    host.querySelector<HTMLElement>('.dp-close')!.click()
    expect(host.children).toHaveLength(0)
    expect(() => { dispose(); dispose() }).not.toThrow()
  })

  it('Esc 关闭弹窗', () => {
    openDataPreview({ root: { 机构编号: 'H1' }, container: host })
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(host.children).toHaveLength(0)
  })

  it('默认不显示字段 key', () => {
    openDataPreview({ root: { 机构编号: 'H1' }, fields, groupKey: '系统信息', container: host })
    expect(host.querySelector('.dp-key')).toBeNull()
  })

  it('showFieldKey=true 时表单与总览显示「中文名 (key)」', () => {
    openDataPreview({
      root: { 机构编号: 'H1', 患者: { 姓名: '张三' } },
      fields, groupKey: '系统信息', container: host, showFieldKey: true,
    })
    expect(host.querySelector('.dp-overview-table .dp-key')?.textContent).toBe('(系统信息.机构编号)')
    host.querySelector<HTMLElement>('.dp-jump')!.click()
    expect(host.querySelector('.dp-form-table .dp-key')?.textContent).toBe('(姓名)')
  })

  it('showFieldKey=true 时表格表头换行显示 key', () => {
    const keyFields: PrintBusinessField[] = [
      { fieldKey: 'goods', fieldLabel: '商品明细', fieldType: 'list', sortOrder: 1 },
      { fieldKey: 'goods.name', fieldLabel: '商品名称', fieldType: 'string', sortOrder: 2 },
      { fieldKey: 'goods.qty', fieldLabel: '数量', fieldType: 'number', sortOrder: 3 },
    ]
    openDataPreview({
      root: [{ name: 'A', qty: 2 }], fields: keyFields,
      groupKey: 'goods', container: host, showFieldKey: true,
    })
    const th = host.querySelector('.dp-data-table thead th')!
    expect(th.textContent).toContain('商品名称')
    expect(th.textContent).toContain('goods.name')
    expect(th.querySelector('br')).toBeTruthy()
  })

  it('样式按 document 幂等注入', () => {
    openDataPreview({ root: {}, container: host })
    openDataPreview({ root: {}, container: host })
    expect(document.head.querySelectorAll('style[data-plugin-data-preview]')).toHaveLength(1)
  })
})
