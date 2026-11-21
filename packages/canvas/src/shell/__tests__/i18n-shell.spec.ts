// @vitest-environment happy-dom
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { setLocale } from '@worm-print-platform/core/i18n'
import { definePrintDesigner, type PrintDesignerElement } from '../../index.js'
import { customPropertyTabLabel } from '../../core/plugin.js'

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

/** 挂载并选中一个元素，使元素属性台可见 */
async function mountWithSelected(lang: string, type: string, setup?: (store: any) => void) {
  definePrintDesigner()
  const host = document.createElement('div')
  document.body.replaceChildren(host)
  const el = document.createElement('print-designer') as PrintDesignerElement
  el.setAttribute('lang', lang)
  host.appendChild(el)
  await frame()
  const store = (el as unknown as { store: any }).store
  store.addElement(type, { left: 10, top: 10, width: 40, height: 10 })
  store.selectOne(store.elements[0]!.id)
  setup?.(store)
  await frame()
  return el.shadowRoot!
}

afterEach(() => {
  setLocale('zh-CN')
  document.body.replaceChildren()
})

describe('设计器 shell 文案国际化', () => {
  it('法语实例属性台出现法语线型', async () => {
    const shadow = await mountWithSelected('fr-FR', 'table')
    const el = document.querySelector('print-designer') as PrintDesignerElement
    el.messages = { 'constants.borderStyle.solid': 'Solide' }
    await frame()
    expect(shadow.textContent).toContain('Solide')
  })


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

  it('泰语界面：工具栏按钮为泰语且无中文残留', async () => {
    const root = await mount('th-TH')
    const texts = [...root.querySelectorAll('button')].map(b => b.textContent?.trim() ?? '')
    expect(texts).toContain('บันทึก')
    expect(texts).toContain('ตัวอย่าง')
    // 页签名来自模板数据（非 UI 文案），仅检查工具栏与状态栏按钮不含中文
    const uiTexts = [...root.querySelectorAll('.designer-toolbar button, .status-bar')].map(e => e.textContent?.trim() ?? '')
    expect(uiTexts.some(t => /[\u4e00-\u9fff]/.test(t))).toBe(false)
  })

  it('英文界面：属性控件提示与图层名也跟随实例语言', async () => {
    const root = await mount('en-US')
    const stepperTitles = [...root.querySelectorAll('.pd-step-btn')].map(e => e.getAttribute('title'))
    expect(stepperTitles).toContain('Decrease')
    expect(stepperTitles).toContain('Increase')
    expect([...root.querySelectorAll('.pd-reset-btn')].some(e => e.getAttribute('data-tip')?.includes('Restore default'))).toBe(true)
    expect([...root.querySelectorAll('[title]')].some(e => e.getAttribute('title') === '颜色选择')).toBe(false)
  })

  it('英文界面：图层名按元素类型取词，不冻结在模块加载时的语言', async () => {
    const root = await mountWithSelected('en-US', 'text')
    expect([...root.querySelectorAll('.layer-name')].map(e => e.textContent?.trim())).toContain('Text')
  })

  it('英文界面：边框预设与单边选项按实例语言取词', async () => {
    const root = await mountWithSelected('en-US', 'text')
    const labels = [...root.querySelectorAll('.border-presets button, .pd-checkbox-group .pd-checkbox span')]
      .map(e => e.textContent?.trim())
    expect(labels).toContain('All')
    expect(labels).toContain('Outside')
    expect(labels).toContain('Top')
  })

  it('英文界面：表格属性下拉按实例语言取词', async () => {
    const root = await mountWithSelected('en-US', 'table')
    const options = [...root.querySelectorAll('.property-panel option')].map(e => e.textContent?.trim())
    expect(options.filter(o => /[\u3400-\u9fff]/.test(o))).toEqual([])
  })

  it('「自定义属性」页签标题按 locale 取词', () => {
    setLocale('en-US')
    expect(customPropertyTabLabel()).toBe('Custom properties')
    setLocale('th-TH')
    expect(customPropertyTabLabel()).not.toMatch(/[\u3400-\u9fff]/)
    setLocale('zh-CN')
    expect(customPropertyTabLabel()).toBe('自定义属性')
  })

  it('英文/泰语界面：二维码缩放模式下拉选项按实例语言取词', async () => {
    for (const lang of ['en-US', 'th-TH']) {
      const root = await mountWithSelected(lang, 'qrcode')
      const fitSelect = [...root.querySelectorAll<HTMLSelectElement>('.property-panel select')]
        .find(s => Array.from(s.options).some(o => o.value === 'contain'))
      expect(fitSelect).toBeTruthy()
      const labels = Array.from(fitSelect!.options).map(o => o.textContent?.trim() ?? '')
      expect(labels.some(l => /[\u3400-\u9fff]/.test(l))).toBe(false)
      if (lang === 'en-US') expect(labels).toContain('Contain (keep ratio)')
    }
  })

  it('英文界面：条码条宽推荐与旋转说明按实例语言取词', async () => {
    const root = await mountWithSelected('en-US', 'barcode', store => {
      store.updateElement(store.elements[0].id, { printerDpi: 203, barWidth: 2 })
    })
    const text = root.textContent ?? ''
    expect(text).toContain('recommended bar-width ratio')
    expect(text).not.toContain('推荐条宽倍率')
    expect(text).toContain('90° steps only')
    expect(text).not.toContain('条码与二维码仅支持')
  })

  it('英文界面：颜色选择器面板文案按实例语言取词', async () => {
    const root = await mountWithSelected('en-US', 'text')
    const trigger = root.querySelector<HTMLElement>('.preset-color-trigger')
    expect(trigger).toBeTruthy()
    trigger!.click()
    await frame()
    const panel = root.querySelector('.preset-color-panel')
    expect(panel).toBeTruthy()
    expect(panel!.getAttribute('aria-label')).toBe('Pick a color')
    const panelText = panel!.textContent ?? ''
    expect(panelText).toContain('Common colors')
    expect(panelText).toContain('Clear')
    expect(panelText).not.toMatch(/[\u3400-\u9fff]/)
  })

  it('高级组三开关每行一个的样式在 core 样式源中已声明', () => {
    const css = readFileSync(resolve(ROOT, 'packages/core/src/styles/designer.css'), 'utf8')
    expect(css).toMatch(/\.advanced-row\{display:flex;flex-direction:column/)
    expect(css).toMatch(/\.advanced-row \.pd-label-t\{white-space:nowrap\}/)
  })

  it('英文界面：core 中文常量文案按实例语言取词', async () => {
    const root = await mountWithSelected('en-US', 'text')
    expect([...root.querySelectorAll('.pd-label-t')].map(e => e.textContent?.trim())).toContain('Content')
    expect(root.textContent ?? '').not.toContain('线型 / 宽度 / 颜色即时生效')
    const tips = [...root.querySelectorAll('.pd-help')].map(e => e.getAttribute('data-tip') ?? '')
    expect(tips.some(t => t.startsWith('Rotation of the element'))).toBe(true)
    expect(tips.some(t => t.includes('元素绕自身中心旋转的角度'))).toBe(false)
  })

  it('英文界面：表格行类型角标按实例语言取词', async () => {
    const root = await mountWithSelected('en-US', 'table')
    const badges = [...root.querySelectorAll('.row-badge')].map(e => e.textContent?.trim())
    expect(badges).toContain('H')
    expect(badges.some(b => /[\u3400-\u9fff]/.test(b ?? ''))).toBe(false)
  })

  it('英文界面：表格单元格属性下拉按实例语言取词', async () => {
    const root = await mountWithSelected('en-US', 'table', store => {
      store.setTableSelection({ elementId: store.elements[0].id, r1: 1, c1: 0, r2: 1, c2: 0 })
    })
    const options = [...root.querySelectorAll('.property-panel option')].map(e => e.textContent?.trim())
    expect(options.filter(o => /[\u3400-\u9fff]/.test(o))).toEqual([])
  })

  it('英文界面：流式列表示例数据按实例语言取词', async () => {
    const root = await mountWithSelected('en-US', 'flowList')
    expect(root.textContent ?? '').toContain('Herb 20g')
  })

  it('shell 与元素定义无残留硬编码中文', () => {
    execFileSync('node', [
      'scripts/check-hardcoded-zh.mjs',
      'packages/canvas/src/shell',
      'packages/canvas/src/core/element-definitions.ts',
    ], { cwd: ROOT })
  })
})
