import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { SAMPLES } from './intents.mjs'

const ROOT = fileURLToPath(new URL('../../', import.meta.url))
const DEMO_DIR = fileURLToPath(new URL('../apps/vue3/', import.meta.url))
const BASE_URL = process.env.LIVE_DEMO_URL || 'http://127.0.0.1:9331/'
const CONTROL_URL = `http://127.0.0.1:${process.env.LIVE_PORT || 9340}`
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const OVERLAY = String.raw`
;(function () {
  if (window.top !== window.self || window.__liveOverlay) return
  const style = document.createElement('style')
  style.textContent = [
    '#live-caption{position:fixed;z-index:2147483000;left:50%;bottom:88px;transform:translateX(-50%);max-width:72%;padding:12px 28px;border:1px solid rgba(255,255,255,.18);border-radius:10px;background:rgba(12,23,35,.9);color:#fff;font:600 clamp(20px,2vw,30px)/1.55 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif;text-align:center;letter-spacing:.02em;opacity:0;transition:opacity .18s ease;pointer-events:none;white-space:pre-line}',
    '#live-video{position:fixed;z-index:2147482998;inset:0;width:100%;height:100%;object-fit:contain;background:#0e1824}',
    '#live-video[hidden]{display:none}',
    '#live-loop-fab{position:fixed;z-index:2147483002;right:24px;bottom:24px;display:inline-flex;align-items:center;gap:9px;min-height:46px;padding:0 18px;color:#fff;background:#2f6fed;border:1px solid rgba(255,255,255,.25);border-radius:24px;box-shadow:0 8px 26px rgba(16,42,82,.3);font:700 14px/1 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif;cursor:pointer}',
    '#live-loop-fab:hover{background:#2056c5}',
    '#live-loop-fab:focus-visible{outline:3px solid rgba(255,255,255,.8);outline-offset:3px}',
    '#live-loop-fab i{width:8px;height:8px;background:#fff;border-radius:50%;box-shadow:0 0 0 4px rgba(255,255,255,.16)}',
    '#live-loop-fab.paused{background:#52657b}',
    '#live-focus{position:fixed;z-index:2147482999;border:3px solid #ffbd59;border-radius:9px;box-shadow:0 0 0 5px rgba(255,189,89,.2);opacity:0;transition:opacity .18s ease;pointer-events:none}',
    '#live-cursor{position:fixed;z-index:2147483001;width:28px;height:28px;margin:-5px 0 0 -5px;border:3px solid #fff;border-radius:50%;background:rgba(47,111,237,.9);box-shadow:0 3px 14px rgba(0,0,0,.3);opacity:0;pointer-events:none}',
    '#live-caption.on,#live-focus.on{opacity:1}',
    '@media(prefers-reduced-motion:reduce){#live-caption,#live-focus{transition:none}}',
  ].join('\n')
  const mount = () => {
    if (!document.body) return
    document.head.append(style)
    const caption = document.createElement('div')
    caption.id = 'live-caption'
    const focus = document.createElement('div')
    focus.id = 'live-focus'
    const cursor = document.createElement('div')
    cursor.id = 'live-cursor'
    const video = document.createElement('video')
    video.id = 'live-video'
    video.src = '${CONTROL_URL}/assets/template-loop.webm'
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    video.hidden = true
    const button = document.createElement('button')
    button.id = 'live-loop-fab'
    button.type = 'button'
    button.innerHTML = '<i aria-hidden="true"></i><span>自动演示</span>'
    document.body.append(caption, video, focus, cursor, button)
    const setLoop = state => {
      const label = !state.loopRunning ? '自动演示' : (state.loopPaused ? '继续演示' : '暂停演示')
      button.querySelector('span').textContent = label
      button.classList.toggle('paused', !!state.loopPaused)
      button.setAttribute('aria-label', label)
      const wantsVideo = state.stage === 'video'
      if (wantsVideo && video.hidden) {
        video.hidden = false
        video.currentTime = 0
      }
      if (!wantsVideo) video.hidden = true
      if (wantsVideo && state.loopRunning && !state.loopPaused) video.play().catch(() => {})
      else video.pause()
    }
    button.addEventListener('click', () => {
      fetch('${CONTROL_URL}/api/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loop: 'toggle' }),
      }).catch(() => {})
    })
    const sync = () => fetch('${CONTROL_URL}/api/state').then(response => response.json()).then(setLoop).catch(() => {})
    video.addEventListener('ended', () => {
      fetch('${CONTROL_URL}/api/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoEnded: true }),
      }).catch(() => {})
    })
    setInterval(sync, 1000)
    sync()
    addEventListener('mousemove', event => {
      cursor.style.left = event.clientX + 'px'
      cursor.style.top = event.clientY + 'px'
      cursor.style.opacity = '1'
    }, true)
    window.__liveOverlay = {
      caption(text) { caption.textContent = text || ''; caption.classList.toggle('on', !!text) },
      setLoop,
      focusRect(rect) {
        if (!rect) return focus.classList.remove('on')
        Object.assign(focus.style, { left: rect.x - 8 + 'px', top: rect.y - 8 + 'px', width: rect.width + 16 + 'px', height: rect.height + 16 + 'px' })
        focus.classList.add('on')
      },
      clearFocus() { focus.classList.remove('on') },
    }
  }
  if (document.body) mount()
  else document.addEventListener('DOMContentLoaded', mount, { once: true })
})()
`

export class DemoRunner {
  constructor({ headless = false } = {}) {
    this.headless = headless
    this.browser = null
    this.page = null
    this.vite = null
    this.errors = []
    this.preview = null
    this.previewPages = 0
    this.captureVersion = 0
    this.ready = false
  }

  async serverUp() {
    try {
      const response = await fetch(BASE_URL, { signal: AbortSignal.timeout(1200) })
      return response.ok
    } catch {
      return false
    }
  }

  async ensureDemoServer() {
    if (await this.serverUp()) return
    this.vite = spawn('npm', ['run', 'dev', '--prefix', DEMO_DIR], {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: process.platform !== 'win32',
    })
    let output = ''
    const collect = chunk => {
      output = (output + String(chunk)).slice(-4000)
      if (process.env.LIVE_DEBUG === '1') process.stdout.write(String(chunk))
    }
    this.vite.stdout.on('data', collect)
    this.vite.stderr.on('data', collect)
    const deadline = Date.now() + 60000
    while (Date.now() < deadline) {
      if (this.vite.exitCode != null) throw new Error(`演示服务启动失败：${output}`)
      if (await this.serverUp()) return
      await sleep(500)
    }
    throw new Error('演示服务启动超时')
  }

  async start() {
    await this.ensureDemoServer()
    this.browser = await chromium.launch({
      headless: this.headless,
      ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
    })
    const context = await this.browser.newContext({
      viewport: { width: 1600, height: 1000 },
      locale: 'zh-CN',
      deviceScaleFactor: 1,
    })
    await context.addInitScript({ content: OVERLAY })
    this.page = await context.newPage()
    this.page.on('pageerror', error => this.errors.push(String(error)))
    this.page.on('dialog', dialog => dialog.accept().catch(() => {}))
    await this.page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
    await this.page.locator('.designer-container').waitFor({ timeout: 30000 })
    await sleep(700)
    this.ready = true
    await this.capture()
  }

  async caption(text) {
    if (!this.page || this.page.isClosed()) return
    await this.page.evaluate(value => window.__liveOverlay?.caption(value), text).catch(() => {})
  }

  async setLoop(state) {
    if (!this.page || this.page.isClosed()) return
    await this.page.evaluate(value => window.__liveOverlay?.setLoop(value), {
      loopRunning: state.loopRunning,
      loopPaused: state.loopPaused,
      stage: state.stage,
    }).catch(() => {})
  }

  async highlight(selector) {
    const locator = this.page.locator(selector).first()
    await locator.waitFor({ state: 'visible', timeout: 12000 })
    const box = await locator.boundingBox()
    await this.page.evaluate(rect => window.__liveOverlay?.focusRect(rect), box)
    return locator
  }

  async clearFocus() {
    await this.page.evaluate(() => window.__liveOverlay?.clearFocus())
  }

  async click(selector) {
    const locator = await this.highlight(selector)
    await locator.scrollIntoViewIfNeeded()
    const box = await locator.boundingBox()
    if (!box) throw new Error('演示目标不可见')
    await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 14 })
    await sleep(140)
    await this.page.mouse.down()
    await sleep(70)
    await this.page.mouse.up()
    await sleep(260)
  }

  async closePreview() {
    const mask = this.page.locator('.preview-mask')
    if (await mask.count() && await mask.isVisible()) {
      await this.page.keyboard.press('Escape')
      await mask.waitFor({ state: 'hidden', timeout: 10000 })
      this.previewPages = 0
    }
  }

  async loadSample(sampleId) {
    const sample = SAMPLES.find(item => item.id === sampleId)
    if (!sample) throw new Error('未知模板')
    await this.closePreview()
    await this.click('.demo-topbar button:text-is("加载示例")')
    await this.page.locator('.gallery-panel').waitFor({ state: 'visible' })
    await this.click(`.gallery-tab:text-is("${sample.group}")`)
    const card = this.page.locator('.sample-card').filter({ has: this.page.locator('.sample-name', { hasText: sample.name }) }).first()
    await card.waitFor({ state: 'visible' })
    await this.click(`.sample-card:has(.sample-name:text-is("${sample.name}"))`)
    await this.click('.gallery-panel button:text-is("使用该模板")')
    await this.page.locator('.gallery-panel').waitFor({ state: 'hidden', timeout: 15000 })
    await sleep(450)
  }

  async selectText() {
    await this.closePreview()
    await this.click('.pd-tab:text-is("元素")')
    const text = this.page.locator('.print-element.type-text').first()
    await text.waitFor({ state: 'visible', timeout: 12000 })
    await this.click('.print-element.type-text >> nth=0')
    const input = this.page.locator('input[placeholder="输入内容，支持 {字段} 表达式"]')
    await input.waitFor({ state: 'visible', timeout: 12000 })
    return input
  }

  async editText(value) {
    const input = await this.selectText()
    await input.fill(value)
    await input.press('Tab')
    await sleep(400)
  }

  async bindField() {
    const input = await this.selectText()
    const fieldKey = await this.page.evaluate(() => {
      const fields = document.querySelector('print-designer')?.store?.fields ?? []
      const field = fields.find(item => String(item.fieldKey ?? '').includes('.')) ?? fields[0]
      return field?.fieldKey ?? ''
    })
    if (!fieldKey) throw new Error('当前模板没有可绑定字段')
    await input.fill(`{${fieldKey}}`)
    await input.press('Tab')
    await sleep(400)
  }

  async align(value) {
    await this.selectText()
    const align = ['left', 'center', 'right'].includes(value) ? value : 'center'
    await this.click(`.pd-field:has-text("对齐") input[value="${align}"]`)
    await sleep(320)
  }

  async paper(width, height) {
    await this.closePreview()
    const batch = this.page.locator('.demo-batch-switch input')
    if (await batch.isChecked()) await batch.uncheck()
    await this.click('.pd-tab:text-is("页面属性")')
    const paperSelect = this.page.locator('select.pd-select:visible')
      .filter({ has: this.page.locator('option[value="CUSTOM"]') }).first()
    await paperSelect.waitFor({ state: 'visible', timeout: 12000 })
    await paperSelect.selectOption('CUSTOM')
    const inputs = this.page.locator('.custom-size-grid input')
    await inputs.nth(0).fill(String(width))
    await inputs.nth(0).press('Tab')
    await inputs.nth(1).fill(String(height))
    await inputs.nth(1).press('Tab')
    await this.highlight('.custom-size-grid')
    await sleep(500)
    await this.click('.pd-tab:text-is("元素")')
  }

  async openPreview() {
    const mask = this.page.locator('.preview-mask')
    if (!(await mask.count()) || !(await mask.isVisible())) {
      await this.click('.designer-toolbar button:text-is("预览")')
      await mask.waitFor({ state: 'visible', timeout: 20000 })
    }
    const deadline = Date.now() + 30000
    let pages = 0
    while (Date.now() < deadline) {
      pages = await this.page.evaluate(() =>
        document.querySelector('.preview-mask iframe')?.contentWindow?.document.querySelectorAll('.print-page').length ?? 0)
      if (pages > 0) break
      await sleep(200)
    }
    if (!pages) throw new Error('出纸预览未生成纸面')
    await this.highlight('.preview-panel')
    this.previewPages = pages
  }

  async undo() {
    await this.closePreview()
    await this.page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z')
    await sleep(400)
  }

  async run(action, args = {}) {
    if (!this.ready || !this.page || this.page.isClosed()) {
      this.ready = false
      throw new Error('演示窗口已关闭')
    }
    if (action === 'load-sample') await this.loadSample(args.sampleId)
    else if (action === 'edit-text') await this.editText(args.text || 'Worm Print 自动演示')
    else if (action === 'bind-field') await this.bindField()
    else if (action === 'align') await this.align(args.align)
    else if (action === 'paper') await this.paper(args.width, args.height)
    else if (action === 'preview') await this.openPreview()
    else if (action === 'tiling') {
      await this.loadSample('price-label')
      const batch = this.page.locator('.demo-batch-switch input')
      if (!(await batch.isChecked())) await batch.check()
      await sleep(250)
      await this.openPreview()
    }
    else if (action === 'undo') await this.undo()
    else throw new Error('不支持的演示动作')
    await this.clearFocus()
    await this.capture()
    return this.snapshot()
  }

  async snapshot() {
    if (!this.page || this.page.isClosed()) return { ready: false }
    try {
      return await this.page.evaluate(previewPages => {
        const badge = [...document.querySelectorAll('.demo-badge')].map(node => node.textContent).find(text => text.includes('业务类型：')) || ''
        const designer = document.querySelector('print-designer')
        return {
          ready: true,
          sample: badge.replace('业务类型：', '').trim() || '空白模板',
          elementCount: designer?.shadowRoot?.querySelectorAll('[data-el-id]').length ?? 0,
          fieldCount: designer?.store?.fields?.length ?? 0,
          previewPages: previewPages || document.querySelector('.preview-mask iframe')?.contentWindow?.document.querySelectorAll('.print-page').length || 0,
          previewSheets: document.querySelector('.preview-mask iframe')?.contentWindow?.document.querySelectorAll('.print-sheet').length || 0,
          captureVersion: window.__liveCaptureVersion || 0,
        }
      }, this.previewPages)
    } catch {
      return { ready: false }
    }
  }

  async capture() {
    if (!this.page || this.page.isClosed()) {
      this.ready = false
      throw new Error('演示窗口已关闭')
    }
    try {
      this.preview = await this.page.screenshot({ type: 'jpeg', quality: 74 })
      this.captureVersion += 1
      await this.page.evaluate(version => { window.__liveCaptureVersion = version }, this.captureVersion)
    } catch (error) {
      this.ready = false
      throw error
    }
  }

  async close() {
    this.ready = false
    if (this.browser) await this.browser.close().catch(() => {})
    if (this.vite?.pid) {
      try { process.kill(process.platform === 'win32' ? this.vite.pid : -this.vite.pid, 'SIGTERM') } catch {}
    }
  }
}
