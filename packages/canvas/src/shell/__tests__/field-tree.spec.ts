// @vitest-environment happy-dom
// 字段树长名称显示（common 侧）：与 Vue 3 轨 FieldTreePanel.spec.ts 同口径——
// .node-meta 包裹中文名与变量名，整行 data-tip 与分组 data-tip 带出完整文本（浮层由 print-designer 的 JS 提示承担）。
// 单击字段行复制字段中文名（Gitee #IKRIZM）：与 Vue 3 轨同口径，复制成功后行内出现「已复制」。
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect, vi, afterEach } from 'vitest'
import type { PrintBusinessField } from '@worm-print-platform/core/designer'
import { DesignerStore } from '../../core/store'
import { FormatToolbar } from '../../core/format'
import { render, clear } from '../../core/h'
import type { ShellCtx, ShellState } from '../controls'
import { renderLeftPanel } from '../panels'

const LONG_LABEL = '客户签收备注（加急）'
const LONG_KEY = 'customer.receiptRemark.urgentHandling'
const ROW_TIP = `${LONG_LABEL} (${LONG_KEY}) · 单击复制字段名 · 拖动中按住 Ctrl（Mac 为 ⌘）切换为插入字段名`

const fields: PrintBusinessField[] = [
  { id: '1', fieldKey: 'customer', fieldLabel: '客户信息', fieldType: 'string', sortOrder: 1 },
  { id: '2', fieldKey: LONG_KEY, fieldLabel: LONG_LABEL, fieldType: 'string', sortOrder: 2 },
]

const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
afterEach(() => {
  if (originalClipboard) Object.defineProperty(navigator, 'clipboard', originalClipboard)
  else Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true, writable: true })
})

function stubClipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true, writable: true })
  return writeText
}

function makeState(): ShellState {
  return {
    leftTab: 'fields', leftCollapsed: false, propTab: 'element', propCollapsed: false,
    openDd: null, collapsedGroups: new Set(), renamingPage: null,
  }
}

function paint(overrides: Partial<ShellState> = {}) {
  const store = new DesignerStore()
  store.fields = fields
  const host = document.createElement('div')
  document.body.replaceChildren(host)
  const ctx: ShellCtx = {
    store, format: new FormatToolbar(store), state: { ...makeState(), ...overrides },
    // 与真实外壳一致：复制成功后由 repaint 重画左栏（整体重绘模型）。
    // 必须先 clear——render 只 append，不清空会留下重绘前的旧行，断言就命中了旧 DOM。
    repaint: () => { clear(host); render(renderLeftPanel(ctx), host) },
    fire: () => {}, showHelp: true, isEdit: false,
    host: { fonts: [] },
  }
  render(renderLeftPanel(ctx), host)
  return host
}

/** 复制走 Promise，等一轮宏任务让 repaint 落地 */
function flush() {
  return new Promise<void>(resolve => setTimeout(resolve, 0))
}

const rows = (host: HTMLElement) => Array.from(host.querySelectorAll<HTMLElement>('.field-row'))
const rowOf = (host: HTMLElement) => rows(host).find(r => r.textContent?.includes(LONG_KEY))!

/** 把 core 共享样式源注入文档，断言真实 CSS 规则的计算结果 */
function injectSharedStyles() {
  const css = readFileSync(resolve(process.cwd(), '../core/src/styles/designer.css'), 'utf8')
  const style = document.createElement('style')
  style.textContent = css
  document.head.appendChild(style)
}

describe('素材台字段树长字段显示', () => {
  it('字段行用 node-meta 包裹中文名与变量名', () => {
    const host = paint()
    const row = rowOf(host)
    expect(row.querySelector('.node-meta')).toBeTruthy()
    expect(row.querySelector('.node-meta > .node-label')?.textContent).toBe(LONG_LABEL)
    expect(row.querySelector('.node-meta > .node-key')?.textContent).toBe(`(${LONG_KEY})`)
  })

  it('整行 data-tip 带出完整中文名与变量名，不残留原生 title', () => {
    const host = paint()
    const row = rowOf(host)
    expect(row.getAttribute('data-tip')).toBe(ROW_TIP)
    expect(row.getAttribute('title')).toBeNull()
  })

  it('字段行起拖用宽效果集 all（macOS ⌘ 重算不能被会话拒绝，守卫与 Vue 3 轨同口径）', () => {
    const host = paint()
    const dt: { setData: ReturnType<typeof vi.fn>; effectAllowed: string } = { setData: vi.fn(), effectAllowed: '' }
    const ev = new Event('dragstart', { bubbles: true })
    Object.defineProperty(ev, 'dataTransfer', { value: dt })
    rowOf(host).dispatchEvent(ev)
    expect(dt.setData).toHaveBeenCalledWith('fieldKey', LONG_KEY)
    expect(dt.effectAllowed).toBe('all')
  })

  it('分组标题 data-tip 带出完整分组名', () => {
    const host = paint()
    expect(host.querySelector('.field-group-header .group-label')?.getAttribute('data-tip')).toBe('客户信息')
  })
})

describe('素材台字段树单击复制字段名（common）', () => {
  it('单击字段行复制中文名并显示「已复制」', async () => {
    const writeText = stubClipboard()
    const host = paint()
    rowOf(host).click()
    await flush()
    expect(writeText).toHaveBeenCalledWith(LONG_LABEL)
    expect(rowOf(host).querySelector('.copy-hint')?.textContent).toBe('已复制')
  })
})

describe('素材台字段行显示模式（宿主 field-display）', () => {
  it('默认 both：中文名与带括号的 key 同显，key 无修饰类', () => {
    const row = rows(paint())[0]!
    expect(row.querySelector('.node-label')?.textContent).toBe(LONG_LABEL)
    const key = row.querySelector('.node-key')
    expect(key?.textContent).toBe(`(${LONG_KEY})`)
    expect(key?.classList.contains('is-primary')).toBe(false)
  })

  it('label 模式只显示中文名，分组名/提示/复制语义不变', async () => {
    const writeText = stubClipboard()
    const host = paint({ fieldDisplay: 'label' })
    const row = rows(host)[0]!
    expect(row.querySelector('.node-label')?.textContent).toBe(LONG_LABEL)
    expect(row.querySelector('.node-key')).toBeNull()
    expect(host.querySelector('.field-group-header .group-label')?.getAttribute('data-tip')).toBe('客户信息')
    expect(row.getAttribute('data-tip')).toBe(ROW_TIP)
    row.click()
    await flush()
    expect(writeText).toHaveBeenCalledWith(LONG_LABEL)
  })

  it('key 模式只显示裸 key（无括号），分组名仍在', () => {
    const host = paint({ fieldDisplay: 'key' })
    const row = rows(host)[0]!
    expect(row.querySelector('.node-label')).toBeNull()
    const key = row.querySelector('.node-key.is-primary')
    expect(key?.textContent).toBe(LONG_KEY)
    expect(key?.textContent).not.toContain('(')
    expect(host.querySelector('.field-group-header .group-label')?.getAttribute('data-tip')).toBe('客户信息')
  })

  it('label 模式下隐藏的 key 仍可被搜索命中', () => {
    const host = paint({ fieldDisplay: 'label' })
    const search = host.querySelector<HTMLInputElement>('.search-input')!
    search.value = LONG_KEY
    search.dispatchEvent(new Event('input'))
    search.dispatchEvent(new Event('change'))
    expect(rows(host)).toHaveLength(1)
  })

  it('key 模式样式：字号与颜色套用中文名', () => {
    injectSharedStyles()
    const row = document.createElement('div')
    row.className = 'field-row'
    const key = document.createElement('span')
    key.className = 'node-key is-primary'
    row.appendChild(key)
    document.body.appendChild(row)
    const style = getComputedStyle(key)
    expect(style.fontSize).toBe('13px')
    expect(style.color).toBe('#303133')
  })
})
