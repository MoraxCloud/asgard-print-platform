import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { OUT_DIR } from './paths.mjs'

// 统一片尾卡：同一套文案渲染浅/深两版，落入本剧本 OUT_DIR。
// 用法：VIDEO_SCRIPT=script-<key>.json node render-endcard-tail.mjs
const require = createRequire(join(dirname(fileURLToPath(import.meta.url)), '..', 'package.json'))
const { chromium } = require('playwright')
const here = dirname(fileURLToPath(import.meta.url))
mkdirSync(OUT_DIR, { recursive: true })

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 })

for (const theme of ['light', 'dark']) {
  await page.goto(`file://${join(here, 'endcard-tail.html')}?theme=${theme}`, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => {
    const img = document.querySelector('.qrframe img')
    return img && img.complete && img.naturalWidth > 0
  })
  const out = join(OUT_DIR, `endcard-tail-${theme}.png`)
  await page.locator('.card').screenshot({ path: out })
  console.log(`片尾卡（${theme}）已渲染：${out}`)
}
await browser.close()
