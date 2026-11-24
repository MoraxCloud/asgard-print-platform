import { spawn } from 'node:child_process'
import { mkdirSync, renameSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '../..')
const DEMO_DIR = resolve(HERE, '../apps/vue3')
const BASE_URL = process.env.LIVE_DEMO_URL || 'http://127.0.0.1:9331/'
const ASSET_DIR = join(HERE, 'assets')
const TEMP_DIR = join(ASSET_DIR, '.recording')
const OUTPUT = join(ASSET_DIR, 'template-loop.webm')
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

async function serverUp() {
  try { return (await fetch(BASE_URL, { signal: AbortSignal.timeout(1200) })).ok } catch { return false }
}

let vite = null
async function ensureServer() {
  if (await serverUp()) return
  vite = spawn('npm', ['run', 'dev', '--prefix', DEMO_DIR], { cwd: ROOT, stdio: 'ignore', detached: process.platform !== 'win32' })
  const deadline = Date.now() + 60000
  while (Date.now() < deadline) {
    if (await serverUp()) return
    await sleep(500)
  }
  throw new Error('设计器服务启动超时')
}

async function clickText(page, selector, text) {
  const locator = page.locator(selector).filter({ hasText: text }).first()
  await locator.waitFor({ state: 'visible', timeout: 15000 })
  await locator.click()
  await sleep(250)
}

async function loadSample(page, group, name) {
  await clickText(page, '.demo-topbar button', '加载示例')
  await page.locator('.gallery-panel').waitFor({ state: 'visible' })
  await clickText(page, '.gallery-tab', group)
  await clickText(page, '.sample-card', name)
  await clickText(page, '.gallery-panel button', '使用该模板')
  await page.locator('.gallery-panel').waitFor({ state: 'hidden', timeout: 15000 })
  await sleep(900)
}

async function openPreview(page) {
  await page.evaluate(() => {
    const button = [...document.querySelector('print-designer').shadowRoot.querySelectorAll('button')]
      .find(node => node.textContent.trim() === '预览')
    button?.click()
  })
  await page.locator('.preview-mask').waitFor({ state: 'visible', timeout: 20000 })
  await page.waitForFunction(() =>
    (document.querySelector('.preview-mask iframe')?.contentWindow?.document.querySelectorAll('.print-page').length ?? 0) > 0,
  undefined, { timeout: 30000 })
}

async function closePreview(page) {
  await page.keyboard.press('Escape')
  await page.locator('.preview-mask').waitFor({ state: 'hidden', timeout: 10000 })
  await sleep(500)
}

await ensureServer()
mkdirSync(ASSET_DIR, { recursive: true })
rmSync(TEMP_DIR, { recursive: true, force: true })
mkdirSync(TEMP_DIR, { recursive: true })
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
})
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  locale: 'zh-CN',
  recordVideo: { dir: TEMP_DIR, size: { width: 1280, height: 800 } },
})
const page = await context.newPage()
const errors = []
page.on('pageerror', error => errors.push(String(error)))

try {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
  await page.locator('.designer-container').waitFor({ timeout: 30000 })
  await sleep(1200)

  await loadSample(page, '单据', '快递电子面单')
  await sleep(2200)
  await openPreview(page)
  await sleep(3200)
  await closePreview(page)

  await loadSample(page, '标签', '价签打印')
  const batch = page.locator('.demo-batch-switch input')
  if (!(await batch.isChecked())) await batch.check()
  await sleep(1200)
  await openPreview(page)
  await sleep(4200)
  await closePreview(page)

  await loadSample(page, '标签', '资产/设备标签')
  await sleep(2200)
  await openPreview(page)
  await sleep(3200)
} finally {
  await context.close()
  const video = page.video()
  const raw = video ? await video.path() : ''
  await browser.close()
  if (vite?.pid) {
    try { process.kill(process.platform === 'win32' ? vite.pid : -vite.pid, 'SIGTERM') } catch {}
  }
  if (!raw) throw new Error('浏览器没有生成录像')
  rmSync(OUTPUT, { force: true })
  renameSync(raw, OUTPUT)
  rmSync(TEMP_DIR, { recursive: true, force: true })
}

if (errors.length) throw new Error(`录像过程出现脚本错误：${errors.join(' / ')}`)
console.log(`模板循环视频：${OUTPUT}`)
