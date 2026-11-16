/**
 * 多剧本流水线路径解析：
 * - 环境变量 VIDEO_SCRIPT 指定 video/ 下的剧本文件名，默认 script.json
 * - 剧本必须有 key：script-<key>.json；无 key 的 script.json 只作样例与自检
 * - 输出目录：一律「日期-主题」目录（横屏 out/<YYYY-MM-DD>-<key>/，竖屏 portrait/out/ 同规则），
 *   日期取首次出片日，首跑自动登记进 out-registry.json，重跑同片不换目录
 * - 画幅口径：script.video = { width, height, margin }
 *   margin 为抖音安全留白（左右各一条黑边），内容台 = 画布宽 − 2×margin，
 *   录制按内容台尺寸出图，合成期补黑边到画布尺寸，画面全程不缩放、不拉伸。
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const name = process.env.VIDEO_SCRIPT || 'script.json'
export const SCRIPT_PATH = name.startsWith('/') ? name : join(__dirname, name)
const m = basename(SCRIPT_PATH).match(/^script-(.+)\.json$/)
const KEY = m ? m[1] : ''
// 产物目录：「日期-主题」是唯一口径（out/<YYYY-MM-DD>-<key>/，竖屏 portrait/out/ 同规则）。
// 首跑自动登记进 out-registry.json 并固定下来，重跑同片不换目录；无 key 的样例仍落裸 out/。
// 登记表 key 按链路命名空间化（竖屏加 portrait/ 前缀），避免两条链的同名剧本互相串目录。
const portraitScript = basename(dirname(SCRIPT_PATH)) === 'portrait'
let dir = join(__dirname, portraitScript ? 'portrait/out' : 'out', KEY)
if (KEY) {
  const regPath = join(__dirname, 'out-registry.json')
  let reg = {}
  try {
    reg = JSON.parse(readFileSync(regPath, 'utf8'))
  } catch {}
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const prefix = portraitScript ? 'portrait/out' : 'out'
  const regKey = portraitScript ? `portrait/${KEY}` : KEY
  if (!reg[regKey]) {
    reg[regKey] = `${prefix}/${today}-${KEY}`
    try {
      writeFileSync(regPath, JSON.stringify(reg, null, 2) + '\n')
    } catch {}
  }
  dir = join(__dirname, reg[regKey])
}
export const OUT_DIR = dir
export const OUT_KEY = KEY

let video = { width: 1920, height: 1080, margin: 0 }
try {
  video = { ...video, ...JSON.parse(readFileSync(SCRIPT_PATH, 'utf8')).video }
} catch {}

export const MARGIN = video.margin
export const CANVAS = { width: video.width, height: video.height }
export const STAGE = { width: video.width - video.margin * 2, height: video.height }
