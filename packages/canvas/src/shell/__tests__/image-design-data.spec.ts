// @vitest-environment happy-dom
// 设计态图片 src 的表达式求值必须消费宿主注入的设计数据，否则动态 base64 图在画布上永远空白。
import { describe, it, expect } from 'vitest'
import type { RuntimeElement, TableRow } from '@worm-print-platform/core/designer'
import { getElementDefinition } from '../../core/element-definitions'
import { DesignerStore } from '../../core/store'
import { render } from '../../core/h'
import type { El } from '../../core/h'
import { renderTable } from '../table'
// 触发 BUILTIN_CONTENT_RENDERERS 注册（image 渲染器在模块加载时注入）
import '../elements'

const PNG = 'data:image/png;base64,iVBORw0KGgo='
const imageDef = getElementDefinition('image')!

function imageEl(src: string): RuntimeElement {
  return {
    id: 'img-1',
    options: { left: 0, top: 0, width: 60, height: 20, src },
    printElementType: { type: 'image', title: '图片' },
  }
}

/** 走真实渲染器：image.renderContent(el, designMode, host) */
function renderImage(el: RuntimeElement, designData?: readonly Record<string, unknown>[]): HTMLElement {
  const host = document.createElement('div')
  const ctx = designData ? { designData } : undefined
  const vnode = imageDef.renderContent!(el, true, ctx as never) as El
  render(vnode, host)
  return host
}

describe('设计态图片 src 表达式求值', () => {
  it('宿主注入 designData 时，{字段} src 按数据根求值并渲染出图', () => {
    const el = imageEl('{logo}')
    const host = renderImage(el, [{ remark: 'ok', logo: PNG }])
    const img = host.querySelector('img') as HTMLImageElement | null
    expect(img).not.toBeNull()
    expect(img!.getAttribute('src')).toBe(PNG)
  })

  it('未注入 designData 时回落到内置 demo 数据，静态 src 原样保留', () => {
    const host = renderImage(imageEl(PNG))
    const img = host.querySelector('img') as HTMLImageElement | null
    expect(img).not.toBeNull()
    expect(img!.getAttribute('src')).toBe(PNG)
  })
})

/** 构造含静态/动态两个图片单元格的表格，走真实 renderTable（第四参 designData） */
function renderImageTable(designData?: readonly Record<string, unknown>[]): HTMLElement {
  const rows: TableRow[] = [{
    id: 'r1', type: 'data', height: 20,
    cells: [
      { id: 'c1', cellType: 'image', formatter: PNG },
      { id: 'c2', cellType: 'image', formatter: '{logo}' },
    ],
  }]
  const store = new DesignerStore()
  store.addElement('table', {
    left: 0, top: 0, width: 120, height: 20, tableColWidths: [60, 60], tableRows: rows,
  } as never)
  const el = store.elements.find(e => e.printElementType.type === 'table')!
  const host = document.createElement('div')
  render(renderTable(el, store, () => {}, designData), host)
  return host
}

describe('设计态表格图片单元格 src 表达式求值', () => {
  it('注入 designData 时，动态 {logo} 图片单元格渲染出图，静态 base64 原样保留', () => {
    const host = renderImageTable([{ logo: PNG }])
    const imgs = [...host.querySelectorAll('.cell-image img')] as HTMLImageElement[]
    expect(imgs.length).toBe(2)
    expect(imgs[0]!.getAttribute('src')).toBe(PNG)
    expect(imgs[1]!.getAttribute('src')).toBe(PNG)
  })

  it('无 designData 时回落到内置 demo 数据：静态原样、动态保持未求值原文', () => {
    const host = renderImageTable()
    const imgs = [...host.querySelectorAll('.cell-image img')] as HTMLImageElement[]
    expect(imgs.length).toBe(2)
    expect(imgs[0]!.getAttribute('src')).toBe(PNG)
    // 内置 demo 数据无 logo：求值保留 {logo} 原文，不会被注入的 designData 求值
    expect(imgs[1]!.getAttribute('src')).toBe('{logo}')
  })
})
