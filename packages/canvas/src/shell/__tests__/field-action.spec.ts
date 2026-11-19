// @vitest-environment happy-dom
// 字段树插件动作按钮：按钮存在、入参正确、点击不折叠、注销后消失。
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { clearFieldActionUIs, registerFieldActionUI } from '@worm-print-platform/plugin-kit'
import type { FieldActionContext, FieldActionUI } from '@worm-print-platform/plugin-kit'
import type { PrintBusinessField } from '@worm-print-platform/core/designer'
import { DesignerStore } from '../../core/store'
import { FormatToolbar } from '../../core/format'
import { render, clear } from '../../core/h'
import type { ShellCtx, ShellState } from '../controls'
import { renderLeftPanel } from '../panels'

const fields: PrintBusinessField[] = [
  { id: '1', fieldKey: '系统信息', fieldLabel: '系统信息', fieldType: 'string', sortOrder: 1 },
  { id: '2', fieldKey: '系统信息.机构编号', fieldLabel: '机构编号', fieldType: 'string', sortOrder: 2 },
  { id: '3', fieldKey: '费用明细', fieldLabel: '费用明细', fieldType: 'list', sortOrder: 3 },
  { id: '4', fieldKey: '费用明细.金额', fieldLabel: '金额', fieldType: 'number', sortOrder: 4 },
]
const data = [{ 系统信息: { 机构编号: 'H1' }, 费用明细: [{ 金额: 2 }] }]

function makeState(): ShellState {
  return {
    leftTab: 'fields', leftCollapsed: false, propTab: 'element', propCollapsed: false,
    openDd: null, collapsedGroups: new Set(), renamingPage: null,
  }
}

function paint(onActivate: (ctx: FieldActionContext) => void) {
  const store = new DesignerStore()
  store.fields = fields
  const host = document.createElement('div')
  document.body.replaceChildren(host)
  const overlay = document.createElement('div')
  const state = makeState()
  const ctx: ShellCtx = {
    store, format: new FormatToolbar(store), state,
    repaint: () => { clear(host); render(renderLeftPanel(ctx), host) },
    fire: () => {}, showHelp: true, isEdit: false,
    host: { fonts: [], designData: data, fields },
    fieldActionHost: overlay,
  }
  const action: FieldActionUI = { id: 'preview', label: '查看数据源', onActivate }
  const dispose = registerFieldActionUI(action)
  render(renderLeftPanel(ctx), host)
  return { host, ctx, state, overlay, dispose }
}

beforeEach(() => clearFieldActionUIs())

describe('字段树插件动作按钮', () => {
  it('分组 header 渲染动作按钮，data-tip 取标签', () => {
    const { host } = paint(() => {})
    const buttons = Array.from(host.querySelectorAll<HTMLElement>('.field-group-header .field-action-btn'))
    expect(buttons).toHaveLength(2)
    expect(buttons.every(b => b.getAttribute('data-tip') === '查看数据源')).toBe(true)
  })

  it('点击传入分组信息、designData、fields 与 overlay 容器', () => {
    const onActivate = vi.fn()
    const { host, overlay } = paint(onActivate)
    host.querySelector<HTMLElement>('.field-group-header .field-action-btn')!.click()
    expect(onActivate).toHaveBeenCalledTimes(1)
    const ctxArg = onActivate.mock.calls[0][0] as FieldActionContext
    expect(ctxArg.group).toEqual({ key: '系统信息', label: '系统信息', isList: false })
    expect(ctxArg.data).toBe(data)
    expect(ctxArg.fields).toBe(fields)
    expect(ctxArg.container).toBe(overlay)
  })

  it('点击列表分组传入 isList=true', () => {
    const onActivate = vi.fn()
    const { host } = paint(onActivate)
    const buttons = Array.from(host.querySelectorAll<HTMLElement>('.field-group-header .field-action-btn'))
    buttons[1].click()
    expect((onActivate.mock.calls[0][0] as FieldActionContext).group.isList).toBe(true)
  })

  it('点击不触发分组折叠', () => {
    const { host, state } = paint(() => {})
    host.querySelector<HTMLElement>('.field-group-header .field-action-btn')!.click()
    expect(state.collapsedGroups.size).toBe(0)
  })

  it('注销后重绘，按钮消失', () => {
    const { host, ctx, dispose } = paint(() => {})
    expect(host.querySelector('.field-action-btn')).toBeTruthy()
    dispose()
    ctx.repaint()
    expect(host.querySelector('.field-action-btn')).toBeNull()
  })
})
