// @vitest-environment happy-dom
// 状态栏：移除「未保存/已保存」指示，显示由 gen-version 从 package.json 派生的版本号。
import { beforeEach, describe, expect, it } from 'vitest'
import { definePrintDesigner } from '../print-designer'
import { CANVAS_VERSION } from '../version'

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

async function mount() {
  definePrintDesigner()
  const host = document.createElement('div')
  document.body.replaceChildren(host)
  const el = document.createElement('print-designer')
  host.appendChild(el)
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
  return el.shadowRoot!
}

beforeEach(stubStorage)

describe('状态栏：版本号替代保存指示', () => {
  it('显示 v<版本号>，且与 package.json 派生的常量一致', async () => {
    const root = await mount()
    const bar = root.querySelector('.status-bar')!
    expect(bar.textContent).toContain(`v${CANVAS_VERSION}`)
    expect(root.querySelector('.status-version')?.textContent).toBe(`v${CANVAS_VERSION}`)
  })

  it('不再渲染「已保存 / 未保存」指示与圆点', async () => {
    const root = await mount()
    const bar = root.querySelector('.status-bar')!
    expect(bar.textContent).not.toContain('已保存')
    expect(bar.textContent).not.toContain('未保存')
    expect(root.querySelector('.status-dirty')).toBeNull()
    expect(root.querySelector('.dirty-dot')).toBeNull()
  })

  it('其余状态项（缩放 / 元素 / 纸张）仍显示', async () => {
    const root = await mount()
    const bar = root.querySelector('.status-bar')!
    expect(bar.textContent).toContain('缩放')
    expect(bar.textContent).toContain('元素')
    expect(root.querySelector('.status-paper')).not.toBeNull()
  })
})
