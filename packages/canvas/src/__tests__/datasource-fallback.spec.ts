// @vitest-environment happy-dom
// 回归：显式绑定数据源在示例数据里缺失时，设计态不得回退到别的数组串字段。
// 流式列表两条是对照用例：其「顶层第一个数组」回退是文档化契约，实测不会串字段，故不改动。
import { beforeAll, describe, expect, it } from 'vitest'
import type { TableRow } from '@worm-print-platform/core/designer'
import { DesignerStore } from '../core/store'
import { render } from '../core/h'
import { renderTable } from '../shell/table'
import { flowListCells } from '../shell/flow-list'

beforeAll(() => {
  const proto = HTMLCanvasElement.prototype as any
  proto.getContext = function () {
    return { font: '', measureText: (t: string) => ({ width: String(t).length * 8 }) }
  }
})

describe('设计态数据源缺失不回退', () => {
  it('表格条码：绑定 wbc（demo 中不存在）时，示例值不取 goods 的 qty', () => {
    const rows: TableRow[] = [{
      id: 'r1', type: 'data', height: 8,
      cells: [{ id: 'c1', cellType: 'barcode', formatter: '{qty}', barcodeType: 'CODE128' }],
    }]
    const store = new DesignerStore()
    store.addElement('table', {
      left: 10, top: 10, width: 80, height: 20,
      tableColWidths: [80], tableRows: rows, dataSource: 'wbc',
    } as never)
    const el = store.elements.find(e => e.printElementType.type === 'table')!
    const host = document.createElement('div')
    render(renderTable(el, store, () => {}), host)
    const text = host.textContent ?? ''
    console.log('表格渲染文本:', text)
    expect(text).not.toContain('100')
  })

  it('流式列表（对照）：表达式声明 drugs 但数据缺失时不会串值', () => {
    const el = { options: { formatter: '{drugs.name} {qty}' } } as any
    const record = [{ goods: [{ name: '螺丝', qty: 100 }] }]
    const cells = flowListCells(el, record)
    console.log('流式列表预览:', cells)
    expect(cells.join(' ')).not.toContain('100')
  })

  it('流式列表（对照）：未声明数据源的行内字段仍按老口径取第一个数组', () => {
    const el = { options: { formatter: '{name} {qty}' } } as any
    const record = [{ goods: [{ name: '螺丝', qty: 100 }] }]
    const cells = flowListCells(el, record)
    console.log('行内字段模式预览:', cells)
    expect(cells.join(' ')).toContain('100')
  })
})
