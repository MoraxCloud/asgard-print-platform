// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest'
import type { PrintBusinessField } from '@worm-print-platform/core/designer'
import type { FieldActionContext, FieldGroupInfo } from '@worm-print-platform/plugin-kit'
import { mountPreview } from '../ui'

const fields: PrintBusinessField[] = [
  { fieldKey: '系统信息.机构编号', fieldLabel: '机构编号', fieldType: 'string', sortOrder: 2 },
  { fieldKey: '系统信息.患者', fieldLabel: '患者对象', fieldType: 'string', sortOrder: 3 },
  { fieldKey: '系统信息.费用', fieldLabel: '费用数组', fieldType: 'list', sortOrder: 4 },
]

function setup(root: unknown, group: FieldGroupInfo = { key: '系统信息', label: '系统信息', isList: false }) {
  const container = document.createElement('div')
  document.body.replaceChildren(container)
  const ctx: FieldActionContext = {
    group, data: [{ [group.key]: root }], fields, container,
  }
  return { container, ctx }
}

describe('mountPreview 弹窗', () => {
  it('渲染标题、tab 栏与总览表', () => {
    const { container, ctx } = setup({ 机构编号: 'H1', 患者: { 姓名: '张三' } })
    mountPreview(ctx)
    expect(container.querySelector('.dp-dialog .dp-title')?.textContent).toContain('系统信息')
    const tabs = Array.from(container.querySelectorAll<HTMLElement>('.dp-tab'))
    expect(tabs.map(t => t.textContent)).toEqual(['总览', '患者对象'])
    expect(container.querySelector('.dp-overview-table')).toBeTruthy()
    expect(container.querySelector('.dp-body')?.textContent).toContain('机构编号')
  })

  it('对象子 tab 渲染表单，总览“查看 →”可跳转', () => {
    const { container, ctx } = setup({ 机构编号: 'H1', 患者: { 姓名: '张三' } })
    mountPreview(ctx)
    container.querySelector<HTMLElement>('.dp-jump')!.click()
    const active = container.querySelector<HTMLElement>('.dp-tab.active')
    expect(active?.textContent).toBe('患者对象')
    const rows = Array.from(container.querySelectorAll<HTMLElement>('.dp-form-table tbody tr'))
    expect(rows.map(r => r.textContent)).toEqual(['姓名张三'])
  })

  it('数组根的总览即表格，不分页', () => {
    const listGroup: FieldGroupInfo = { key: '费用明细', label: '费用明细', isList: true }
    const many = Array.from({ length: 20 }, (_, i) => ({ 机构编号: `H${i}` }))
    const { container, ctx } = setup(many, listGroup)
    mountPreview(ctx)
    const rows = container.querySelectorAll('.dp-data-table tbody tr')
    expect(rows).toHaveLength(20)
  })

  it('关闭按钮清空容器，dispose 可多次调用', () => {
    const { container, ctx } = setup({ 机构编号: 'H1' })
    const dispose = mountPreview(ctx)
    container.querySelector<HTMLElement>('.dp-close')!.click()
    expect(container.children).toHaveLength(0)
    expect(() => { dispose(); dispose() }).not.toThrow()
  })

  it('Esc 关闭弹窗', () => {
    const { container, ctx } = setup({ 机构编号: 'H1' })
    mountPreview(ctx)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(container.children).toHaveLength(0)
  })
})
