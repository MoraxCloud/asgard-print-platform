// @vitest-environment happy-dom
// 工具栏「预览 / 保存」显隐开关：默认显示，showPreview / showSave 可单独隐藏；
// 隐藏只影响按钮出图，save() 方法与事件派发不受影响（宿主自定义打印/预览业务的旁路）。
import { beforeEach, describe, expect, it } from 'vitest'
import { PrintDesignerElement, definePrintDesigner } from '../print-designer'

function stubStorage() {
  const map = new Map<string, string>()
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => map.get(key) ?? null,
      setItem: (key: string, value: string) => { map.set(key, String(value)) },
      removeItem: (key: string) => { map.delete(key) },
      clear: () => map.clear(),
    },
  })
}

function frame() {
  return new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
}

async function mount(setup?: (el: PrintDesignerElement) => void) {
  definePrintDesigner()
  const host = document.createElement('div')
  document.body.replaceChildren(host)
  const el = document.createElement('print-designer') as PrintDesignerElement
  setup?.(el)
  host.appendChild(el)
  await frame()
  return { el, root: el.shadowRoot! }
}

const previewBtn = (root: ShadowRoot) =>
  [...root.querySelectorAll<HTMLButtonElement>('.designer-toolbar .btn-secondary')]
    .find(b => b.textContent === '预览')
const saveBtn = (root: ShadowRoot) =>
  [...root.querySelectorAll<HTMLButtonElement>('.designer-toolbar .btn-primary')]
    .find(b => b.textContent === '保存')

beforeEach(stubStorage)

describe('工具栏显隐：showPreview / showSave', () => {
  it('默认显示「预览」与「保存」', async () => {
    const { root } = await mount()
    expect(previewBtn(root)).toBeTruthy()
    expect(saveBtn(root)).toBeTruthy()
  })

  it('showPreview=false 只隐藏「预览」，并写 show-preview attribute', async () => {
    const { el, root } = await mount()
    el.showPreview = false
    await frame()
    expect(previewBtn(root)).toBeUndefined()
    expect(saveBtn(root)).toBeTruthy()
    expect(el.getAttribute('show-preview')).toBe('false')
  })

  it('showSave=false 只隐藏「保存」，并写 show-save attribute', async () => {
    const { el, root } = await mount()
    el.showSave = false
    await frame()
    expect(saveBtn(root)).toBeUndefined()
    expect(previewBtn(root)).toBeTruthy()
    expect(el.getAttribute('show-save')).toBe('false')
  })

  it('两者都隐藏时工具栏不再出主/次按钮', async () => {
    const { el, root } = await mount()
    el.showPreview = false
    el.showSave = false
    await frame()
    expect(root.querySelector('.designer-toolbar .btn-primary')).toBeNull()
    expect(root.querySelector('.designer-toolbar .btn-secondary')).toBeNull()
  })

  it('挂载前声明式 attribute 同样生效', async () => {
    const { root } = await mount(el => {
      el.setAttribute('show-preview', 'false')
      el.setAttribute('show-save', 'false')
    })
    expect(previewBtn(root)).toBeUndefined()
    expect(saveBtn(root)).toBeUndefined()
  })

  it('重新置 true 后按钮恢复显示', async () => {
    const { el, root } = await mount()
    el.showPreview = false
    el.showSave = false
    await frame()
    el.showPreview = true
    el.showSave = true
    await frame()
    expect(previewBtn(root)).toBeTruthy()
    expect(saveBtn(root)).toBeTruthy()
  })

  it('隐藏「保存」按钮后 save() 仍派发 save 事件（宿主业务旁路不受影响）', async () => {
    const { el } = await mount()
    el.showSave = false
    await frame()
    const seen: string[] = []
    el.addEventListener('save', ev => seen.push((ev as CustomEvent<string>).detail))
    el.save()
    expect(seen).toHaveLength(1)
    expect(() => JSON.parse(seen[0]!)).not.toThrow()
  })
})