// @vitest-environment happy-dom
import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { setLocale } from '@worm-print-platform/core/i18n'
import { definePrintDesigner, type PrintDesignerElement } from '../../index.js'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../..')

function frame() {
  return new Promise<void>(r => requestAnimationFrame(() => r()))
}

async function mount(lang?: string) {
  definePrintDesigner()
  const host = document.createElement('div')
  document.body.replaceChildren(host)
  const el = document.createElement('print-designer') as PrintDesignerElement
  if (lang) el.setAttribute('lang', lang)
  host.appendChild(el)
  await frame()
  return el.shadowRoot!
}

afterEach(() => {
  setLocale('zh-CN')
  document.body.replaceChildren()
})

describe('设计器 shell 文案国际化', () => {
  it('英文界面：工具栏按钮为英文', async () => {
    const root = await mount('en-US')
    const texts = [...root.querySelectorAll('button')].map(b => b.textContent?.trim() ?? '')
    expect(texts).toContain('Save')
    expect(texts).toContain('Preview')
  })

  it('中文界面：同位置逐字恢复', async () => {
    const root = await mount('zh-CN')
    const texts = [...root.querySelectorAll('button')].map(b => b.textContent?.trim() ?? '')
    expect(texts).toContain('保存')
    expect(texts).toContain('预览')
  })

  it('shell 与元素定义无残留硬编码中文', () => {
    execFileSync('node', [
      'scripts/check-hardcoded-zh.mjs',
      'packages/canvas/src/shell',
      'packages/canvas/src/core/element-definitions.ts',
    ], { cwd: ROOT })
  })
})
