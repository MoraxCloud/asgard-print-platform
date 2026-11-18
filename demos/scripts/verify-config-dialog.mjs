import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// 四宿主「配置」弹窗验收：显隐开关 + 主题三档写回 + 外壳/纸张边界 + auto 跟随系统。
// 用法：node demos/scripts/verify-config-dialog.mjs
// 需先起四个 demo（npm run dev:demos:all），端口可用 DEMO_PORT_* 覆盖。
const require = createRequire(join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'package.json'))
const { chromium } = require('playwright')

const DEMOS = [
  { name: 'vue3', url: `http://localhost:${process.env.DEMO_PORT_VUE3 || 9331}`, config: '.demo-topbar button:has-text("配置")', mask: '.config-mask' },
  { name: 'vue2', url: `http://localhost:${process.env.DEMO_PORT_VUE2 || 9332}`, config: '.demo-topbar button:has-text("配置")', mask: '.config-mask' },
  { name: 'jquery', url: `http://localhost:${process.env.DEMO_PORT_JQUERY || 9334}`, config: '#btn-config', mask: '#config-mask' },
  { name: 'react', url: `http://localhost:${process.env.DEMO_PORT_REACT || 9335}`, config: '.demo-topbar button:has-text("配置")', mask: '.config-mask' },
]

const browser = await chromium.launch()
let failed = 0
const check = (name, pass, detail = '') => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
  if (!pass) failed++
}

for (const demo of DEMOS) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  console.log(`\n[${demo.name}] ${demo.url}`)
  try {
    await page.goto(demo.url, { waitUntil: 'networkidle' })
    await page.waitForSelector('print-designer', { timeout: 15000 })
    await page.locator(demo.config).first().click()
    await page.locator(demo.mask).waitFor({ state: 'visible', timeout: 5000 })

    const radios = page.locator(`${demo.mask} input[name="config-theme"]`)
    const values = await radios.evaluateAll(els => els.map(e => e.value).sort())
    const checked = await radios.evaluateAll(els => els.filter(e => e.checked).map(e => e.value))
    check(`${demo.name} 主题三档齐全`, JSON.stringify(values) === JSON.stringify(['auto', 'dark', 'light']), values.join(','))
    check(`${demo.name} 默认跟随系统`, JSON.stringify(checked) === JSON.stringify(['auto']), checked.join(',') || '(无选中)')
    check(`${demo.name} 显隐开关仍为 2`, await page.locator(`${demo.mask} input[type="checkbox"]`).count() === 2)

    for (const mode of ['dark', 'light', 'auto']) {
      await page.locator(`${demo.mask} input[name="config-theme"][value="${mode}"]`).check()
      const el = page.locator('print-designer').first()
      check(`${demo.name} 切到 ${mode} 写回 theme`,
        await el.getAttribute('theme') === mode && await el.evaluate(x => x.theme) === mode)
    }
    check(`${demo.name} 完成按钮关闭弹窗`, await (async () => {
      await page.locator(`${demo.mask} button:has-text("完成")`).click()
      await page.locator(demo.mask).waitFor({ state: 'hidden', timeout: 5000 })
      return true
    })())
    check(`${demo.name} 零页面错误`, errors.length === 0, errors.join(' | '))
  } catch (e) {
    check(`${demo.name} 脚本执行`, false, e.message.slice(0, 200))
  }
  await page.close()
}

// 主题边界：只改外壳，纸张/画布背景不变；auto 跟随系统；不影响显隐属性。
console.log('\n[主题边界量测 vue3]')
async function snap(theme, colorScheme) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme })
  const page = await ctx.newPage()
  await page.goto(DEMOS[0].url, { waitUntil: 'networkidle' })
  await page.waitForSelector('print-designer')
  await page.locator(DEMOS[0].config).first().click()
  if (theme !== 'auto') await page.locator(`${DEMOS[0].mask} input[name="config-theme"][value="${theme}"]`).check()
  await page.waitForTimeout(200)
  const out = await page.evaluate(() => {
    const sr = document.querySelector('print-designer').shadowRoot
    const bg = s => getComputedStyle(sr.querySelector(s)).backgroundColor
    const d = document.querySelector('print-designer')
    return {
      shell: getComputedStyle(sr.querySelector('.designer-container')).backgroundColor,
      paper: bg('.hiprint-printPaper'),
      canvas: bg('.canvas-area'),
      theme: d.getAttribute('theme'),
      showPreview: d.getAttribute('show-preview'),
      showSave: d.getAttribute('show-save'),
    }
  })
  await ctx.close()
  return out
}
const light = await snap('light', 'light')
const dark = await snap('dark', 'light')
const autoLight = await snap('auto', 'light')
const autoDark = await snap('auto', 'dark')
check('深色只改外壳：纸张背景不变', dark.paper === light.paper, dark.paper)
check('深色只改外壳：画布区背景不变', dark.canvas === light.canvas, dark.canvas)
check('深色外壳与浅色不同', dark.shell !== light.shell, `${light.shell} → ${dark.shell}`)
check('auto 跟随系统色', autoLight.shell !== autoDark.shell, `${autoLight.shell} → ${autoDark.shell}`)
check('auto 回落 theme=auto', autoLight.theme === 'auto' && autoDark.theme === 'auto')
check('主题切换不影响显隐属性', dark.showPreview === light.showPreview && dark.showSave === light.showSave)

await browser.close()
console.log(failed ? `\n失败 ${failed} 项` : '\n全部通过')
process.exit(failed ? 1 : 0)
