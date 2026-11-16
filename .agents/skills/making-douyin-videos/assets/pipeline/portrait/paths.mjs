/**
 * 竖屏多剧本流水线路径解析（口径对齐 ../paths.mjs）：
 * - 环境变量 VIDEO_SCRIPT 指定 portrait/ 下的剧本文件名，默认 script.json
 * - 剧本必须有 key：script-<key>.json；无 key 的 script.json 只作样例与自检
 * - 输出目录：一律「日期-主题」目录 portrait/out/<YYYY-MM-DD>-<key>/，日期取首次出片日，
 *   与横屏共用根目录的 out-registry.json（值相对流水线根解析），首跑自动登记、重跑不换目录
 * - 卡片 HTML 由剧本 `cards` 字段指定（相对本目录），缺省 cards.html
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const name = process.env.VIDEO_SCRIPT || 'script.json'
export const PORTRAIT_DIR = __dirname
export const SCRIPT_PATH = name.startsWith('/') ? name : resolve(__dirname, name)
export const SCRIPT_KEY = basename(SCRIPT_PATH).match(/^script-(.+)\.json$/)?.[1] ?? ''
let dir = join(__dirname, 'out', SCRIPT_KEY)
if (SCRIPT_KEY) {
  const regPath = join(__dirname, '..', 'out-registry.json')
  let reg = {}
  try {
    reg = JSON.parse(readFileSync(regPath, 'utf8'))
  } catch {}
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  if (!reg[`portrait/${SCRIPT_KEY}`]) {
    reg[`portrait/${SCRIPT_KEY}`] = `portrait/out/${today}-${SCRIPT_KEY}`
    try {
      writeFileSync(regPath, JSON.stringify(reg, null, 2) + '\n')
    } catch {}
  }
  dir = join(__dirname, '..', reg[`portrait/${SCRIPT_KEY}`])
}
export const OUT_DIR = dir
